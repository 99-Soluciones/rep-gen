import Ajv2020 from 'ajv/dist/2020';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type {
  ReportBankComplementRecord,
  TipoTransaccionBanco,
} from '../../domain/bank-complements';
import { getPortalRows } from '../../../common/utils';
import { fecha, id, numero, redondear, texto } from '../shared/fm-parsers';
import schema from './bancos-complementos.schema.json';
import {
  BANCO,
  COMP_EGRESO,
  COMP_INGRESO,
  EGRESO,
  INGRESO,
  MOV,
} from './bank-complements.fields';

/*
 * Implementa la "Lógica de negocio" de la ficha
 * (docs/reports/fichas/bank-complements/bank-complements.md): un renglón por
 * complemento; una conciliación sin complementos o un movimiento sin conciliar
 * dan un solo renglón con lo que falta en null.
 */

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validar = ajv.compile(schema);

type Campos = Record<string, unknown>;
type Fila = ReportBankComplementRecord;

/** Texto de FileMaker en una línea: los saltos (\r) pasan a espacio. */
const plano = (valor: unknown): string => texto(valor).split(/\s+/).join(' ');

const SIN_CONCILIACION = {
  ingresoId: null,
  egresoId: null,
  conciliacionEstado: null,
  conciliacionMontoTotal: null,
  conciliacionMontoComplementado: null,
  conciliacionSaldoPorComplementar: null,
  clienteProveedorId: null,
  bancoTransferenciaId: null,
  clienteProveedor: null,
  clienteProveedorRazonSocial: null,
  clienteProveedorRfc: null,
} satisfies Partial<Fila>;

const SIN_PAGO = {
  pagoGranTotalMxn: null,
  pagoFecha: null,
  pagoPeriodoFiscal: null,
  pagoFolio: null,
  pagoUuid: null,
  facturaSerieFolio: null,
  facturaFecha: null,
  facturaGranTotal: null,
  facturaUuid: null,
  facturaMetodoPago: null,
  ventaId: null,
} satisfies Partial<Fila>;

type Lado = typeof INGRESO | typeof EGRESO;
type LadoPago = typeof COMP_INGRESO | typeof COMP_EGRESO;

/** Paso 3: tipo según el lado y el id que no esté vacío. */
function tipoDe(esIngreso: boolean, c: Campos, f: Lado): TipoTransaccionBanco {
  if (id(c[f.transferenciaId]))
    return esIngreso ? 'Transferencia desde banco' : 'Transferencia a banco';
  if (esIngreso)
    return id(c[f.proveedorId]) && !id(c[f.clienteId])
      ? 'Pago de proveedor'
      : 'Pago de cliente';
  return id(c[f.clienteId]) && !id(c[f.proveedorId])
    ? 'Pago a cliente'
    : 'Pago a proveedor';
}

/** Paso 5: REP si existe; si no, "Factura PUE"; si no, vacío. */
function folioPago(p: Campos, f: LadoPago, metodoPago: string): string {
  const folio = texto(p[f.repFolio]);
  if (folio) return `${texto(p[f.repSerie])}-${folio}`;
  return metodoPago === 'PUE' ? 'Factura PUE' : '';
}

function pago(p: Campos, esIngreso: boolean): Partial<Fila> {
  const f: LadoPago = esIngreso ? COMP_INGRESO : COMP_EGRESO;
  const metodoPago = texto(p[f.facturaMetodoPago]);
  return {
    pagoGranTotalMxn: numero(p[f.monto]),
    pagoFecha: fecha(p[f.fecha]),
    pagoPeriodoFiscal: texto(p[f.periodoFiscal]),
    pagoFolio: folioPago(p, f, metodoPago),
    pagoUuid: texto(p[f.repUuid]),
    facturaSerieFolio: esIngreso
      ? texto(p[COMP_INGRESO.facturaSerieFolio])
      : `${texto(p[COMP_EGRESO.facturaSerie])}-${texto(p[COMP_EGRESO.facturaFolio])}`,
    facturaFecha: fecha(p[f.facturaFecha]),
    facturaGranTotal: numero(p[f.facturaGranTotal]),
    facturaUuid: texto(p[f.facturaUuid]),
    facturaMetodoPago: metodoPago,
    ventaId: esIngreso ? id(p[COMP_INGRESO.ventaId]) : null,
  };
}

/** Paso 2: los renglones de una conciliación (uno por complemento, o uno solo). */
function renglonesConciliacion(
  movimiento: Omit<
    Fila,
    keyof typeof SIN_CONCILIACION | keyof typeof SIN_PAGO | 'tipoTransaccion'
  >,
  c: Campos,
  esIngreso: boolean,
  complementosDelMovimiento: Campos[],
): Fila[] {
  const f: Lado = esIngreso ? INGRESO : EGRESO;
  const fp: LadoPago = esIngreso ? COMP_INGRESO : COMP_EGRESO;
  const conciliacionId = id(c[f.id]);
  const complementos = complementosDelMovimiento.filter(
    (p) => id(p[fp.conciliacionId]) === conciliacionId,
  );
  const montoTotal = numero(c[f.montoTotal]);
  const complementado = redondear(
    complementos.reduce((s, p) => s + (numero(p[fp.monto]) ?? 0), 0),
  );
  const conciliacion = {
    ...movimiento,
    tipoTransaccion: tipoDe(esIngreso, c, f),
    ingresoId: esIngreso ? conciliacionId : null,
    egresoId: esIngreso ? null : conciliacionId,
    conciliacionEstado: texto(c[f.estado]),
    conciliacionMontoTotal: montoTotal,
    conciliacionMontoComplementado: complementado,
    conciliacionSaldoPorComplementar:
      montoTotal === null ? null : redondear(montoTotal - complementado),
    clienteProveedorId: id(c[f.clienteId]) ?? id(c[f.proveedorId]) ?? null,
    bancoTransferenciaId: id(c[f.transferenciaId]),
    clienteProveedor: texto(c[f.nombre]),
    clienteProveedorRazonSocial: texto(c[f.razonSocial]),
    clienteProveedorRfc: texto(c[f.rfc]),
  };
  if (!complementos.length) return [{ ...conciliacion, ...SIN_PAGO }];
  return complementos.map((p) => ({
    ...conciliacion,
    ...SIN_PAGO,
    ...pago(p, esIngreso),
  }));
}

function renglones(record: RawRecord): Fila[] {
  const fd = record.fieldData as Campos;
  const portales = record.portalData as Campos | null;
  const banco = getPortalRows(portales, BANCO.portal)[0] ?? {};
  const movimiento = {
    bancoFolioTransaccion: id(fd[MOV.id]) ?? 0,
    bancoFecha: fecha(fd[MOV.fecha]),
    bancoNombre: texto(banco[BANCO.nombre]),
    bancoNumeroCuenta: texto(banco[BANCO.cuenta]),
    bancoCuentaContable: texto(fd[MOV.cuentaContable]),
    bancoMoneda: texto(banco[BANCO.moneda]),
    bancoTipoDeCambio: numero(fd[MOV.tipoCambio]),
    bancoFormaPago: texto(fd[MOV.formaPago]),
    bancoConcepto: plano(fd[MOV.concepto]),
    bancoAbono: numero(fd[MOV.abono]),
    bancoCargo: numero(fd[MOV.cargo]),
    bancoSaldoResultante: numero(fd[MOV.saldoResultante]),
    bancoSaldoPorIdentificar: numero(fd[MOV.saldoPorIdentificar]),
    bancoSaldoPorComplementar: numero(fd[MOV.saldoPorComplementar]),
    bancoTextoComplemento: plano(fd[MOV.textoComplemento]),
  };
  const compIngreso = getPortalRows(portales, COMP_INGRESO.portal);
  const compEgreso = getPortalRows(portales, COMP_EGRESO.portal);
  const filas = [
    ...getPortalRows(portales, INGRESO.portal).flatMap((c) =>
      renglonesConciliacion(movimiento, c, true, compIngreso),
    ),
    ...getPortalRows(portales, EGRESO.portal).flatMap((c) =>
      renglonesConciliacion(movimiento, c, false, compEgreso),
    ),
  ];
  return filas.length
    ? filas
    : [
        {
          ...movimiento,
          tipoTransaccion: 'Sin identificar',
          ...SIN_CONCILIACION,
          ...SIN_PAGO,
        },
      ];
}

/** Registros de apiExport_Bancos_Complementos → filas del reporte (paso 6: orden). */
export function cleanData(rawData: RawRecord[]): Fila[] {
  rawData.forEach((record, index) => {
    if (validar(record)) return;
    const detalle = ajv.errorsText(validar.errors, {
      separator: '; ',
      dataVar: `registro[${index}]`,
    });
    throw new Error(`Registro de Bancos con complementos inválido: ${detalle}`);
  });
  return rawData
    .flatMap(renglones)
    .sort(
      (a, b) =>
        (a.bancoFecha ?? '').localeCompare(b.bancoFecha ?? '') ||
        a.bancoFolioTransaccion - b.bancoFolioTransaccion,
    );
}
