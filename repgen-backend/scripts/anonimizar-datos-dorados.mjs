#!/usr/bin/env node
// @ts-check

/**
 * Anonimiza en su lugar las entradas doradas (`entrada-*.json`) de una ficha.
 *
 * Cambia nombres, razones sociales, RFC, representantes y UUID por valores
 * ficticios. El mismo valor original siempre recibe el mismo reemplazo, en
 * todos los archivos de la carpeta: un cliente sigue siendo el mismo en
 * facturas y bancos, así que las relaciones y los totales no cambian. Montos,
 * fechas, ids, folios y clasificaciones se quedan.
 *
 * Correrlo ANTES de armar esperado-borrador.json (o volver a armarlo después).
 * Si un reporte trae otro campo sensible, agregar su sufijo a REGLAS.
 *
 * Uso (desde repgen-backend):
 *   node scripts/anonimizar-datos-dorados.mjs docs/reports/fichas/<nombre>/datos-dorados
 *   node scripts/anonimizar-datos-dorados.mjs --self-test
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

/** Sufijo del nombre de campo de FileMaker → tipo de reemplazo. */
const REGLAS = [
  ['::destLocal_dirNombreComercial', 'nombre'],
  ['::fiscal_RazonSocial', 'razon'],
  ['::fiscal_RFC', 'rfc'],
  ['::userData_nombre_Completo', 'persona'],
  ['::_idu_user_name', 'persona'],
  ['cfdi_UUID', 'uuid'],
  ['::__idu_ingreso_itm', 'uuid'],
];

const FALSOS = {
  nombre: (n) => `Cliente Ejemplo ${String(n).padStart(2, '0')}`,
  razon: (n) => `RAZON SOCIAL EJEMPLO ${String(n).padStart(2, '0')} SA DE CV`,
  rfc: (n) => `EJE0101${String(n).padStart(2, '0')}AA${n % 10}`,
  persona: (n) => `Representante ${n <= 26 ? String.fromCharCode(64 + n) : n}`,
  uuid: (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
};

const YA_FALSO = {
  nombre: /^Cliente Ejemplo \d+$/,
  razon: /^RAZON SOCIAL EJEMPLO \d+ SA DE CV$/,
  rfc: /^EJE0101\d{2}AA\d$/,
  persona: /^Representante (?:[A-Z]|\d+)$/,
  uuid: /^00000000-0000-4000-8000-\d{12}$/,
};

/** Devuelve una función que anonimiza un objeto de campos (fieldData o renglón de portal). */
export function crearAnonimizador() {
  /** @type {Record<string, Map<string, string>>} */
  const mapas = {};
  const falso = (tipo, valor) => {
    const mapa = (mapas[tipo] ??= new Map());
    // Ya anonimizado (se volvió a correr): se queda igual y ocupa su número.
    // ponytail: mezclar datos nuevos con ya anonimizados podría repetir un número; anonimizar todo junto.
    if (!mapa.has(valor)) mapa.set(valor, YA_FALSO[tipo].test(valor) ? valor : FALSOS[tipo](mapa.size + 1));
    return mapa.get(valor);
  };
  /** @param {Record<string, unknown>} campos */
  const limpiar = (campos) => {
    for (const [k, v] of Object.entries(campos)) {
      const regla = REGLAS.find(([sufijo]) => k.endsWith(sufijo));
      if (regla && typeof v === 'string' && v.trim()) campos[k] = falso(regla[1], v.trim());
    }
  };
  return { limpiar, mapas };
}

function anonimizarCarpeta(carpeta) {
  const { limpiar, mapas } = crearAnonimizador();
  const archivos = readdirSync(carpeta).filter((f) => /^entrada-.*\.json$/.test(f)).sort();
  assert.ok(archivos.length, `No hay entrada-*.json en ${carpeta}`);
  for (const archivo of archivos) {
    const ruta = join(carpeta, archivo);
    const raw = readFileSync(ruta, 'utf8');
    const json = JSON.parse(raw);
    for (const registro of json.response.data) {
      limpiar(registro.fieldData);
      for (const filas of Object.values(registro.portalData ?? {})) filas.forEach(limpiar);
    }
    let salida = JSON.stringify(json, null, 2) + '\n';
    if (raw.includes('\r\n')) salida = salida.replace(/\n/g, '\r\n');
    writeFileSync(ruta, salida, 'utf8');
  }
  const resumen = Object.entries(mapas).map(([t, m]) => `${t}: ${m.size}`).join(', ');
  console.log(`Anonimizados ${archivos.join(', ')} → ${resumen || 'nada que cambiar'}`);
}

function selfTest() {
  const { limpiar } = crearAnonimizador();
  const factura = { 'venta_|CLIENTE_|_x_clienteID::fiscal_RFC': 'ABC010101AB1', cfdi_UUID: '', monto: 5 };
  const banco = { 'contBanco.ITM|CLIENTE.ingreso|_x_bancoItmID::fiscal_RFC': ' ABC010101AB1 ' };
  const otro = { 'x::fiscal_RFC': 'ZZZ010101ZZ9' };
  [factura, banco, otro].forEach(limpiar);
  assert.equal(factura['venta_|CLIENTE_|_x_clienteID::fiscal_RFC'], 'EJE010101AA1');
  assert.equal(banco['contBanco.ITM|CLIENTE.ingreso|_x_bancoItmID::fiscal_RFC'], 'EJE010101AA1');
  assert.equal(otro['x::fiscal_RFC'], 'EJE010102AA2');
  assert.equal(factura.cfdi_UUID, '', 'vacío se queda vacío');
  assert.equal(factura.monto, 5, 'lo que no es sensible no cambia');
  console.log('self-test OK');
}

const arg = process.argv[2];
if (arg === '--self-test') selfTest();
else if (arg) anonimizarCarpeta(arg);
else {
  console.error('Uso: node scripts/anonimizar-datos-dorados.mjs <carpeta datos-dorados> | --self-test');
  process.exit(1);
}
