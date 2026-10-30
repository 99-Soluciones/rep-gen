#!/usr/bin/env node
// @ts-check

/**
 * ¿Un reporte pesado frena a las demás consultas de la MISMA sesión de FileMaker?
 *
 * Abre dos sesiones de la Data API (A y B) y corre el reporte de ventas por
 * concepto en A. Mientras corre, hace consultas pequeñas en A y en B:
 *   - Si solo A se atrasa, la cola es por sesión: separar sesiones lo resuelve.
 *   - Si las dos se atrasan, el límite es el servidor: separar sesiones no basta.
 *
 * Solo lee: no crea, edita ni borra registros. Aun así, carga el FileMaker Server
 * que comparten todos los clientes, así que córrelo fuera de horario.
 *
 * Uso (desde repgen-backend):
 *   node scripts/prueba-cola-sesion.mjs --tenant <base> --desde 2026-09-01 --hasta 2026-09-30 --confirmar
 *   node scripts/prueba-cola-sesion.mjs --self-test
 *
 * Toma FM_SERVER, FM_USERNAME y FM_PASSWORD del entorno o del .env.
 * Usa el rango de un reporte que normalmente tarde más de 10 segundos.
 */

import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';

const LAYOUT_REPORTE = 'apiExport_VentaITM';
const LAYOUT_PEQUENO = 'columnas_prefs';
// Mismos campos que GetSalesitemReportUseCase (salesitem-field-map.ts).
const CAMPOS_FECHA = [
  'venta.itm|VENTA_|_x_ventaID::cfdi_FacturaFechaTimbrar',
  'venta.itm|VENTA_|_x_ventaID::cfdi_CANCEL_fecha_v0_23_1r',
  'venta.itm|devo.venta_|_x_ventaID::cfdi_fechaTimbre_v0_24_1',
];

const TIMEOUT_MS = 150_000;
const MUESTRAS_BASE = 5;
const ESPERA_ANTES_DE_SONDEAR_MS = 1_500; // el reporte ya debe estar corriendo
const PAUSA_ENTRE_SONDEOS_MS = 500;
const PAUSA_ENTRE_RONDAS_MS = 5_000;
const REPORTE_MINIMO_MS = 3_000; // con menos, no hay tiempo de ver una cola

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @param {number[]} valores */
function mediana(valores) {
  const orden = [...valores].sort((a, b) => a - b);
  const mitad = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2;
}

/**
 * Clasifica la prueba. Tiempos en ms.
 * ponytail: umbral fijo (3 veces la base o 1 s más); ajústalo si la red es muy variable.
 * @param {{ base: number, misma: number, otra: number, reporteMs: number }} tiempos
 */
function veredicto({ base, misma, otra, reporteMs }) {
  if (reporteMs < REPORTE_MINIMO_MS) return 'REPORTE_CORTO';
  const umbral = Math.max(base * 3, base + 1_000);
  const mismaLenta = misma >= umbral;
  const otraLenta = otra >= umbral;
  if (mismaLenta && !otraLenta) return 'COLA_POR_SESION';
  if (mismaLenta && otraLenta) return 'SERVIDOR_SATURADO';
  if (!mismaLenta && !otraLenta) return 'SIN_COLA';
  return 'INCONCLUSO';
}

const QUE_HACER = {
  COLA_POR_SESION:
    'La cola es por sesión. Usar una sesión para reportes y otra para el ERP resuelve la espera.',
  SERVIDOR_SATURADO:
    'Las dos sesiones se atrasan. Separar sesiones no basta: hay que aligerar el reporte o revisar la capacidad del servidor.',
  SIN_COLA:
    'Ninguna sesión se atrasó en esta corrida. Repite con un rango más pesado antes de descartar la cola.',
  INCONCLUSO:
    'Solo se atrasó la otra sesión. Repite la prueba; puede ser ruido de red o del servidor.',
  REPORTE_CORTO:
    'El reporte tardó menos de 3 s. Usa un rango de fechas más amplio.',
};

/** @param {number} ms */
const formatear = (ms) =>
  ms >= 1_000 ? `${(ms / 1_000).toFixed(1)} s` : `${Math.round(ms)} ms`;

/** @param {Response} respuesta */
async function codigoFileMaker(respuesta) {
  const cuerpo = await respuesta.json().catch(() => undefined);
  return cuerpo?.messages?.[0]?.code ?? 'sin código';
}

/**
 * @param {string} urlBase
 * @param {string} credenciales
 */
async function abrirSesion(urlBase, credenciales) {
  const respuesta = await fetch(`${urlBase}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credenciales}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!respuesta.ok) {
    throw new Error(
      `No se pudo abrir la sesión: HTTP ${respuesta.status}, código FileMaker ${await codigoFileMaker(respuesta)}`,
    );
  }
  return (await respuesta.json()).response.token;
}

/**
 * Una sesión sin cerrar vence sola a los 15 minutos: por eso un fallo aquí solo se avisa.
 * @param {string} urlBase
 * @param {string} token
 */
async function cerrarSesion(urlBase, token) {
  await fetch(`${urlBase}/sessions/${encodeURIComponent(token)}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((error) => console.warn(`No se pudo cerrar una sesión: ${error.message}`));
}

/**
 * @param {string} urlBase
 * @param {string} token
 * @returns {Promise<number>} Milisegundos que tardó la consulta.
 */
async function consultaPequena(urlBase, token) {
  const inicio = performance.now();
  const respuesta = await fetch(
    `${urlBase}/layouts/${encodeURIComponent(LAYOUT_PEQUENO)}/records?_limit=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  await respuesta.arrayBuffer();
  if (!respuesta.ok) {
    throw new Error(`La consulta pequeña falló: HTTP ${respuesta.status}`);
  }
  return performance.now() - inicio;
}

/**
 * @param {string} urlBase
 * @param {string} token
 * @param {string} rango
 * @returns {Promise<{ ms: number, registros: number }>}
 */
async function correrReporte(urlBase, token, rango) {
  const inicio = performance.now();
  const respuesta = await fetch(
    `${urlBase}/layouts/${encodeURIComponent(LAYOUT_REPORTE)}/_find`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CAMPOS_FECHA.map((campo) => ({ [campo]: rango })),
        offset: 1,
        limit: 999_999,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!respuesta.ok) {
    const codigo = await codigoFileMaker(respuesta);
    if (codigo === '401') return { ms: performance.now() - inicio, registros: 0 };
    throw new Error(`El reporte falló: HTTP ${respuesta.status}, código FileMaker ${codigo}`);
  }
  const cuerpo = await respuesta.json();
  return {
    ms: performance.now() - inicio,
    registros: cuerpo.response?.data?.length ?? 0,
  };
}

/**
 * Corre el reporte en A y sondea A y B mientras dura.
 * A lleva una sola consulta: si hay cola, se queda esperando al reporte.
 * @param {string} urlBase
 * @param {string} tokenA
 * @param {string} tokenB
 * @param {string} rango
 */
async function correrRonda(urlBase, tokenA, tokenB, rango) {
  let termino = false;
  const reporte = correrReporte(urlBase, tokenA, rango).finally(() => {
    termino = true;
  });
  // Si falla antes de llegar a Promise.all, Node no debe abortar sin cerrar las
  // sesiones: Promise.all vuelve a lanzar el error abajo.
  reporte.catch(() => {});

  await espera(ESPERA_ANTES_DE_SONDEAR_MS);
  const sondaMisma = consultaPequena(urlBase, tokenA);
  sondaMisma.catch(() => {});

  const otras = [];
  while (!termino) {
    otras.push(await consultaPequena(urlBase, tokenB));
    await espera(PAUSA_ENTRE_SONDEOS_MS);
  }

  const [{ ms, registros }, misma] = await Promise.all([reporte, sondaMisma]);
  return {
    reporteMs: ms,
    registros,
    misma,
    otra: otras.length ? mediana(otras) : misma,
  };
}

function autoprueba() {
  assert.equal(mediana([3, 1, 2]), 2);
  assert.equal(mediana([1, 2, 3, 4]), 2.5);

  const caso = { base: 200, reporteMs: 30_000 };
  assert.equal(veredicto({ ...caso, misma: 25_000, otra: 250 }), 'COLA_POR_SESION');
  assert.equal(veredicto({ ...caso, misma: 25_000, otra: 20_000 }), 'SERVIDOR_SATURADO');
  assert.equal(veredicto({ ...caso, misma: 300, otra: 250 }), 'SIN_COLA');
  assert.equal(veredicto({ ...caso, misma: 300, otra: 20_000 }), 'INCONCLUSO');
  assert.equal(veredicto({ ...caso, misma: 25_000, otra: 250, reporteMs: 2_000 }), 'REPORTE_CORTO');
  // Una base de 50 ms no vuelve "lenta" una consulta de 200 ms.
  assert.equal(veredicto({ base: 50, reporteMs: 30_000, misma: 200, otra: 150 }), 'SIN_COLA');

  console.log('Autoprueba correcta.');
}

async function principal() {
  const { values: opciones } = parseArgs({
    options: {
      tenant: { type: 'string' },
      desde: { type: 'string' },
      hasta: { type: 'string' },
      rondas: { type: 'string', default: '2' },
      confirmar: { type: 'boolean', default: false },
      'self-test': { type: 'boolean', default: false },
    },
  });

  if (opciones['self-test']) return autoprueba();

  const fechaIso = /^\d{4}-\d{2}-\d{2}$/;
  const rondas = Number(opciones.rondas);
  if (
    !/^[\p{L}\p{N} _-]{1,100}$/u.test(opciones.tenant ?? '') ||
    !fechaIso.test(opciones.desde ?? '') ||
    !fechaIso.test(opciones.hasta ?? '') ||
    !Number.isInteger(rondas) ||
    rondas < 1
  ) {
    console.error(
      'Uso: node scripts/prueba-cola-sesion.mjs --tenant <base> --desde AAAA-MM-DD --hasta AAAA-MM-DD [--rondas 2] --confirmar',
    );
    process.exitCode = 1;
    return;
  }

  try {
    process.loadEnvFile(new URL('../.env', import.meta.url));
  } catch {
    // Sin .env: las variables pueden venir del entorno.
  }
  const { FM_SERVER, FM_USERNAME, FM_PASSWORD } = process.env;
  if (!FM_SERVER || !FM_USERNAME || !FM_PASSWORD) {
    console.error('Faltan FM_SERVER, FM_USERNAME o FM_PASSWORD.');
    process.exitCode = 1;
    return;
  }

  const servidor = new URL(FM_SERVER).host;
  console.log(
    `Servidor: ${servidor} · Base: ${opciones.tenant} · Reporte: ${LAYOUT_REPORTE} · ${opciones.desde} a ${opciones.hasta} · ${rondas} ronda(s)`,
  );
  if (!opciones.confirmar) {
    console.error(
      'Esto carga el servidor que comparten todos los clientes. Córrelo fuera de horario y agrega --confirmar.',
    );
    process.exitCode = 1;
    return;
  }

  const urlBase = `${FM_SERVER.replace(/\/+$/, '')}/fmi/data/vLatest/databases/${encodeURIComponent(opciones.tenant)}`;
  const credenciales = Buffer.from(`${FM_USERNAME}:${FM_PASSWORD}`).toString('base64');
  const aFileMaker = (/** @type {string} */ iso) => {
    const [anio, mes, dia] = iso.split('-');
    return `${mes}/${dia}/${anio}`;
  };
  const rango = `${aFileMaker(opciones.desde)}...${aFileMaker(opciones.hasta)}`;

  const tokenA = await abrirSesion(urlBase, credenciales);
  const tokenB = await abrirSesion(urlBase, credenciales).catch(async (error) => {
    await cerrarSesion(urlBase, tokenA);
    throw error;
  });

  try {
    const muestras = [];
    for (const token of [tokenA, tokenB]) {
      for (let i = 0; i < MUESTRAS_BASE; i += 1) {
        muestras.push(await consultaPequena(urlBase, token));
        await espera(PAUSA_ENTRE_SONDEOS_MS);
      }
    }
    const base = mediana(muestras);
    console.log(`Línea base sin reporte: ${formatear(base)}`);

    const resultados = [];
    for (let ronda = 1; ronda <= rondas; ronda += 1) {
      if (ronda > 1) await espera(PAUSA_ENTRE_RONDAS_MS);
      const resultado = await correrRonda(urlBase, tokenA, tokenB, rango);
      resultados.push(resultado);
      console.log(
        `Ronda ${ronda}: reporte ${formatear(resultado.reporteMs)} (${resultado.registros} registros) · misma sesión ${formatear(resultado.misma)} · otra sesión ${formatear(resultado.otra)}`,
      );
    }

    const final = veredicto({
      base,
      misma: mediana(resultados.map((r) => r.misma)),
      otra: mediana(resultados.map((r) => r.otra)),
      reporteMs: mediana(resultados.map((r) => r.reporteMs)),
    });
    console.log(`\nResultado: ${final}\n${QUE_HACER[final]}`);
  } finally {
    await Promise.all([cerrarSesion(urlBase, tokenA), cerrarSesion(urlBase, tokenB)]);
  }
}

await principal().catch((error) => {
  console.error(`La prueba no terminó: ${error.message}`);
  process.exitCode = 1;
});
