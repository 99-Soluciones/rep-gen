import Ajv2020 from 'ajv/dist/2020';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type {
  ReportPayablesRecord,
  TipoTransaccionCxP,
} from '../../domain/payables';
import { getPortalRows } from '../../../common/utils';
import { fecha, id, numero, redondear, unaLinea } from '../shared/fm-parsers';
import { granTotalOriginal, serieFolioCompra } from '../shared/compras';
import facturasSchema from './cxp-facturas.schema.json';
import bancosSchema from './cxp-bancos.schema.json';
import {
  APLICACIONES,
  BAN,
  FAC,
  PAGOS_COMPRA,
  banProveedor,
  type LadoBanco,
} from './payables.fields';

/*
 * Implementa la "Lógica de negocio" de la ficha
 * (docs/reports/fichas/payables/payables.md). Contraparte de Cuentas por
 * cobrar: el saldo al corte es el de hoy + lo pagado o aplicado después.
 */

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validarFactura = ajv.compile(facturasSchema);
const validarBanco = ajv.compile(bancosSchema);

function assertSchema(
  validar: typeof validarFactura,
  record: RawRecord,
  nombre: string,
  index: number,
): void {
  if (validar(record)) return;
  const detalle = ajv.errorsText(validar.errors, {
    separator: '; ',
    dataVar: `${nombre}[${index}]`,
  });
  throw new Error(`Registro de CxP inválido: ${detalle}`);
}

type Campos = Record<string, unknown>;
/** Fila antes de ponerle la fecha de corte (es la misma en todas). */
type Fila = Omit<ReportPayablesRecord, 'fechaCorte'>;
/** Fila con su llave de orden (fecha, id, desempate). */
type ConOrden = { fila: Fila; orden: [string, number, number] };

const diasEntre = (desde: string, hasta: string): number =>
  Math.round(
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) /
      86_400_000,
  );

const VACIO: Fila = {
  tipoTransaccion: 'Factura vencida',
  proveedorId: null,
  proveedor: '',
  proveedorRazonSocial: null,
  proveedorRfc: null,
  proveedorCuentaContable: null,
  proveedorAcuerdos: null,
  facturaSerieFolio: null,
  facturaFecha: null,
  facturaUuid: null,
  facturaObservaciones: null,
  facturaMoneda: null,
  facturaGranTotalOriginal: null,
  facturaTipoDeCambio: null,
  facturaGranTotal: null,
  facturaFechaLimiteDePago: null,
  facturaEstatus: null,
  facturaDiasVencida: null,
  facturaNoPagarFecha: null,
  compraRepDeCompra: null,
  facturaSaldoPendiente: null,
  facturaSaldoVencido: null,
  facturaSaldoPorVencer: null,
  facturaNoPagarMonto: null,
  facturaNoPagarIva: null,
  facturaNoPagarIeps: null,
  facturaNoPagarCerradaPor: null,
  abonoSaldoNoAplicado: null,
  cargoSaldoNoAplicado: null,
  bancoFolioTransaccion: null,
  ingresoId: null,
  egresoId: null,
  bancoNombre: null,
  bancoCuentaContable: null,
  bancoFecha: null,
  bancoMonto: null,
  bancoReferencia: null,
  cargoMontoSinIdentificar: null,
  compraTieneProductos: null,
  bodegaEntregaEstatus: null,
  bodegaFechaEstimadaDeEntrega: null,
  bodegaFechaDeEntrega: null,
  compraId: null,
};

const TIENE_PRODUCTOS: Record<string, string> = { '1': 'SI', '0': 'NO' };

function mapFactura(record: RawRecord, corte: string): ConOrden | null {
  const f: Campos = record.fieldData;
  const aprobada = fecha(f[FAC.aprobada]);
  if (!aprobada || aprobada > corte) return null;

  const pagadoDespues = getPortalRows(
    record.portalData ?? null,
    PAGOS_COMPRA.portal,
  )
    .filter((pago) => (fecha(pago[PAGOS_COMPRA.fecha]) ?? '') > corte)
    .reduce(
      (suma, pago) => suma + (numero(pago[PAGOS_COMPRA.montoMxn]) ?? 0),
      0,
    );
  // Gran total − pagado, no el campo de saldo: en Pagos puede venir en 0 sin
  // pagos (comparación con el ERP de SANS).
  const granTotal = numero(f[FAC.granTotal]) ?? 0;
  const saldoHoy = granTotal - (numero(f[FAC.pagado]) ?? 0);
  const saldo = redondear(saldoHoy + pagadoDespues);
  // Cero o negativo (Cerrado pagado de más) no sale.
  if (saldo < 0.005) return null;

  // "No pagar" = Cerrado con saldo; si se marcó después del corte, ese día
  // era una factura normal.
  const fechaCerrado = fecha(f[FAC.fechaCerrado]);
  const noPagar =
    unaLinea(f[FAC.area]) === 'Cerrado' &&
    saldoHoy > 0.005 &&
    (!fechaCerrado || fechaCerrado <= corte);
  // Sin plazo, se debe desde la aprobación.
  const limite = fecha(f[FAC.fechaLimite]) ?? aprobada;
  const vencida = limite < corte;
  const conCfdi = !!unaLinea(f[FAC.uuid]);

  const fila: Fila = {
    ...VACIO,
    tipoTransaccion: noPagar
      ? 'Factura cerrada: No pagar'
      : vencida
        ? 'Factura vencida'
        : 'Factura por vencer',
    proveedorId: id(f[FAC.proveedorId]),
    proveedor: unaLinea(f[FAC.proveedor]),
    proveedorRazonSocial: unaLinea(f[FAC.razonSocial]),
    proveedorRfc: unaLinea(f[FAC.rfc]),
    proveedorCuentaContable: unaLinea(f[FAC.cuentaContable]),
    proveedorAcuerdos: unaLinea(f[FAC.acuerdos]),
    facturaSerieFolio: serieFolioCompra(
      f[FAC.uuid],
      unaLinea(f[FAC.serie]),
      unaLinea(f[FAC.folio]),
    ),
    facturaFecha: conCfdi ? fecha(f[FAC.fechaFactura]) : null,
    facturaUuid: unaLinea(f[FAC.uuid]),
    facturaObservaciones: unaLinea(f[FAC.observaciones]),
    facturaMoneda: unaLinea(f[FAC.moneda]),
    facturaGranTotalOriginal: granTotalOriginal(
      granTotal,
      numero(f[FAC.tipoCambio]),
    ),
    facturaTipoDeCambio: numero(f[FAC.tipoCambio]),
    facturaGranTotal: redondear(granTotal),
    facturaFechaLimiteDePago: limite,
    facturaEstatus: noPagar ? 'No pagar' : vencida ? 'Vencida' : 'Por vencer',
    facturaDiasVencida: vencida ? diasEntre(limite, corte) : 0,
    facturaNoPagarFecha: noPagar ? fechaCerrado : null,
    compraRepDeCompra: unaLinea(f[FAC.repCompra]),
    // "No pagar": su saldo va solo a facturaNoPagarMonto.
    facturaSaldoPendiente: noPagar ? 0 : saldo,
    facturaSaldoVencido: noPagar || !vencida ? 0 : saldo,
    facturaSaldoPorVencer: noPagar || vencida ? 0 : saldo,
    facturaNoPagarMonto: noPagar ? saldo : 0,
    facturaNoPagarIva: noPagar ? redondear(numero(f[FAC.iva]) ?? 0) : 0,
    facturaNoPagarIeps: noPagar ? redondear(numero(f[FAC.ieps]) ?? 0) : 0,
    facturaNoPagarCerradaPor: noPagar ? unaLinea(f[FAC.cerradaPor]) : null,
    compraTieneProductos:
      TIENE_PRODUCTOS[unaLinea(f[FAC.tieneProductos])] ?? '',
    bodegaEntregaEstatus: unaLinea(f[FAC.entregaEstatus]),
    bodegaFechaEstimadaDeEntrega: fecha(f[FAC.entregaEstimada]),
    bodegaFechaDeEntrega: fecha(f[FAC.entregaFecha]),
    compraId: id(f[FAC.compraId]),
  };
  // Una OC puede tener varias facturas sin CFDI con la misma fecha límite:
  // desempata el recordId de FileMaker.
  return {
    fila,
    orden: [limite, fila.compraId ?? 0, Number(record.recordId) || 0],
  };
}

function mapBanco(record: RawRecord, corte: string): ConOrden[] {
  const f: Campos = record.fieldData;
  const fechaBanco = fecha(f[BAN.fecha]);
  if (!fechaBanco || fechaBanco > corte) return [];

  const abono = numero(f[BAN.abono]) ?? 0;
  const cargo = numero(f[BAN.cargo]) ?? 0;
  let lado: LadoBanco;
  let monto: number;
  let proveedor: number | null;
  if (cargo > 0) {
    // Devolución a un cliente: es de Cuentas por cobrar.
    if (id(f[BAN.clienteEgreso])) return [];
    lado = 'egreso';
    monto = cargo;
    proveedor = id(f[BAN.proveedorEgreso]);
  } else if (abono > 0) {
    lado = 'ingreso';
    monto = abono;
    proveedor = id(f[BAN.proveedorIngreso]);
    // Un abono sin proveedor es de Cuentas por cobrar.
    if (!proveedor) return [];
  } else {
    return [];
  }

  // Se calcula en moneda original y al final se pasa a MXN con el TC del movimiento.
  const aplic = APLICACIONES[lado];
  const aplicadoDespues = getPortalRows(record.portalData ?? null, aplic.portal)
    .filter((a) => (fecha(a[aplic.fecha]) ?? '') > corte)
    .reduce(
      (suma, a) =>
        suma +
        (numero(a[aplic.montoMxn]) ?? 0) / (numero(a[aplic.tipoCambio]) || 1),
      0,
    );
  const tipoCambio = numero(f[BAN.tipoCambio]) || 1;
  const saldo = redondear(
    ((numero(f[BAN.saldo]) ?? 0) + aplicadoDespues) * tipoCambio,
  );
  if (Math.abs(saldo) < 0.005) return [];

  const montoMxn = monto * tipoCambio;
  const fila: Fila = {
    ...VACIO,
    bancoFolioTransaccion: id(f[BAN.folio]),
    bancoNombre: unaLinea(f[BAN.banco]),
    bancoCuentaContable: unaLinea(f[BAN.bancoCuentaContable]),
    bancoFecha: fechaBanco,
    bancoMonto: redondear(montoMxn),
    bancoReferencia: unaLinea(f[BAN.referencia]),
  };
  const orden: ConOrden['orden'] = [
    fechaBanco,
    fila.bancoFolioTransaccion ?? 0,
    0,
  ];
  const noIdentificado = (importe: number): ConOrden => ({
    fila: {
      ...fila,
      tipoTransaccion: 'Cargo no identificado',
      proveedor: 'SIN IDENTIFICAR',
      cargoMontoSinIdentificar: importe,
    },
    orden,
  });
  // Cargo sin proveedor (sin egreso, comisiones, nómina): no identificado.
  if (!proveedor) return [noIdentificado(saldo)];

  // La parte del movimiento que no quedó en el egreso/ingreso del proveedor
  // no es suya: en un cargo sale como no identificada; en un abono es de CxC.
  // Sin monto registrado no se separa.
  const registrado = numero(
    f[lado === 'ingreso' ? BAN.montoIngreso : BAN.montoEgreso],
  );
  const sobrante =
    registrado && saldo > 0
      ? redondear(Math.min(Math.max(montoMxn - registrado, 0), saldo))
      : 0;
  const delProveedor = redondear(saldo - sobrante);

  const p = banProveedor(lado);
  const datosProveedor = {
    proveedorId: id(f[p.id]),
    proveedor: unaLinea(f[p.nombre]),
    proveedorRazonSocial: unaLinea(f[p.razonSocial]),
    proveedorRfc: unaLinea(f[p.rfc]),
    proveedorCuentaContable: unaLinea(f[p.cuentaContable]),
    proveedorAcuerdos: unaLinea(f[p.acuerdos]),
  };
  const filas: ConOrden[] = [];
  if (Math.abs(delProveedor) >= 0.005) {
    filas.push({
      fila:
        lado === 'egreso'
          ? {
              ...fila,
              ...datosProveedor,
              tipoTransaccion: 'Cargo por aplicar',
              cargoSaldoNoAplicado: delProveedor,
              egresoId: id(f[BAN.egresoId]),
            }
          : {
              ...fila,
              ...datosProveedor,
              tipoTransaccion: 'Abono por aplicar',
              abonoSaldoNoAplicado: delProveedor,
              ingresoId: id(f[BAN.ingresoId]),
            },
      orden,
    });
  }
  if (lado === 'egreso' && sobrante >= 0.005)
    filas.push(noIdentificado(sobrante));
  return filas;
}

const ORDEN_TIPO: TipoTransaccionCxP[] = [
  'Factura vencida',
  'Factura por vencer',
  'Factura cerrada: No pagar',
  'Cargo por aplicar',
  'Abono por aplicar',
  'Cargo no identificado',
];

/** Orden de la ficha (paso 6): tipo, fecha, id y desempate. */
function compararFilas(a: ConOrden, b: ConOrden): number {
  return (
    ORDEN_TIPO.indexOf(a.fila.tipoTransaccion) -
      ORDEN_TIPO.indexOf(b.fila.tipoTransaccion) ||
    a.orden[0].localeCompare(b.orden[0]) ||
    a.orden[1] - b.orden[1] ||
    a.orden[2] - b.orden[2]
  );
}

/**
 * Convierte los registros crudos de los dos layouts en las filas del reporte
 * al día de corte (YYYY-MM-DD). Lanza si un registro no cumple su schema.
 */
export function cleanData(
  facturas: RawRecord[],
  bancos: RawRecord[],
  fechaCorte: string,
): ReportPayablesRecord[] {
  facturas.forEach((r, i) => assertSchema(validarFactura, r, 'facturas', i));
  bancos.forEach((r, i) => assertSchema(validarBanco, r, 'bancos', i));

  const filas = [
    ...facturas.map((r) => mapFactura(r, fechaCorte)),
    ...bancos.flatMap((r) => mapBanco(r, fechaCorte)),
  ].filter((x): x is ConOrden => x !== null);
  return filas.sort(compararFilas).map(({ fila }) => ({ fechaCorte, ...fila }));
}
