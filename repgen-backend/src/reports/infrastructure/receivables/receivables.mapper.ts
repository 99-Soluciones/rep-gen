import Ajv2020 from 'ajv/dist/2020';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type {
  ReportReceivablesRecord,
  TipoTransaccionCxC,
} from '../../domain/receivables';
import { getPortalRows } from '../../../common/utils';
import { fecha, id, numero, redondear, texto } from '../shared/fm-parsers';
import facturasSchema from './cxc-facturas.schema.json';
import bancosSchema from './cxc-bancos.schema.json';
import {
  APLICACIONES,
  BAN,
  FAC,
  PAGOS_VENTA,
  banCliente,
  type LadoBanco,
} from './receivables.fields';

/*
 * Implementa la "Lógica de negocio" de la ficha
 * (docs/reports/fichas/receivables/receivables.md). El saldo al corte es el
 * saldo de hoy + lo pagado o aplicado después del corte.
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
  throw new Error(`Registro de CxC inválido: ${detalle}`);
}

type Campos = Record<string, unknown>;
/** Fila antes de ponerle la fecha de corte (es la misma en todas). */
type Fila = Omit<ReportReceivablesRecord, 'fechaCorte'>;

const sumarDias = (iso: string, dias: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

const diasEntre = (desde: string, hasta: string): number =>
  Math.round(
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) /
      86_400_000,
  );

const VACIO: Fila = {
  tipoTransaccion: 'Factura vencida',
  clienteId: null,
  cliente: '',
  clienteRazonSocial: null,
  clienteRfc: null,
  clasificacion1: null,
  clasificacion2: null,
  clasificacion3: null,
  clasificacion4: null,
  clienteCuentaContable: null,
  clienteRepDeVenta: null,
  facturaSerieFolio: null,
  facturaGranTotal: null,
  facturaUuid: null,
  facturaFecha: null,
  facturaMetodoPago: null,
  facturaDiasCredito: null,
  facturaFechaVencimiento: null,
  facturaEstatus: null,
  facturaDiasVencida: null,
  facturaRepDeVenta: null,
  facturaRepDeCobranza: null,
  facturaSaldoPendiente: null,
  facturaSaldoVencido: null,
  facturaSaldoPorVencer: null,
  facturaNoCobrarGranTotal: null,
  facturaNoCobrarIva: null,
  facturaNoCobrarIeps: null,
  facturaNoCobrarFecha: null,
  abonoSaldoNoAplicado: null,
  cargoSaldoNoAplicado: null,
  abonoMontoSinIdentificar: null,
  ingresoId: null,
  egresoId: null,
  bancoFolioTransaccion: null,
  bancoNombre: null,
  bancoCuentaContable: null,
  bancoFecha: null,
  bancoMonto: null,
  bancoReferencia: null,
  ventaId: null,
};

function mapFactura(record: RawRecord, corte: string): Fila | null {
  const f: Campos = record.fieldData;
  const timbrado = fecha(f[FAC.timbrado]);
  if (!timbrado || timbrado > corte || !texto(f[FAC.uuid])) return null;

  const cancelada = texto(f[FAC.area]) === 'Cancelada';
  const cancelacion = fecha(f[FAC.cancelacion]);
  if (cancelada && (!cancelacion || cancelacion <= corte)) return null;

  // "No cobrar" sí sale (se toma en cuenta en la contabilidad), marcada en
  // el estatus. Cuenta como no cobrar si al corte ya estaba marcada; sin
  // fecha no se sabe cuándo, así que se toma como ya marcada.
  const fechaNoCobrar = fecha(f[FAC.fechaNoCobrar]);
  const noCobrar =
    texto(f[FAC.estatusSaldo]) === 'NoCobrar' &&
    (!fechaNoCobrar || fechaNoCobrar <= corte);

  const pagos = getPortalRows(record.portalData ?? null, PAGOS_VENTA.portal);
  const sumaPagos = (despuesDelCorte: boolean) =>
    pagos
      .filter(
        (pago) =>
          (fecha(pago[PAGOS_VENTA.fecha]) ?? '') > corte === despuesDelCorte,
      )
      .reduce(
        (suma, pago) => suma + (numero(pago[PAGOS_VENTA.montoMxn]) ?? 0),
        0,
      );
  // Cancelada después del corte: la cancelación borró su saldo de hoy, así
  // que se parte del gran total menos lo pagado hasta el corte.
  const saldo = redondear(
    cancelada
      ? (numero(f[FAC.granTotal]) ?? 0) - sumaPagos(false)
      : (numero(f[FAC.saldo]) ?? 0) + sumaPagos(true),
  );
  if (Math.abs(saldo) < 0.005) return null;

  const diasCredito = numero(f[FAC.diasCredito]);
  const vencimiento =
    fecha(f[FAC.fechaLimite]) ?? sumarDias(timbrado, diasCredito ?? 0);
  const vencida = vencimiento < corte;

  return {
    ...VACIO,
    tipoTransaccion: noCobrar
      ? 'Factura cerrada: No cobrar'
      : vencida
        ? 'Factura vencida'
        : 'Factura por vencer',
    clienteId: id(f[FAC.clienteId]),
    cliente: texto(f[FAC.cliente]),
    clienteRazonSocial: texto(f[FAC.razonSocial]),
    clienteRfc: texto(f[FAC.rfc]),
    clasificacion1: texto(f[FAC.clasificacion(1)]),
    clasificacion2: texto(f[FAC.clasificacion(2)]),
    clasificacion3: texto(f[FAC.clasificacion(3)]),
    clasificacion4: texto(f[FAC.clasificacion(4)]),
    clienteCuentaContable: texto(f[FAC.cuentaContable]),
    clienteRepDeVenta: texto(f[FAC.repCliente]),
    facturaSerieFolio: texto(f[FAC.serieFolio]),
    facturaGranTotal: redondear(numero(f[FAC.granTotal]) ?? 0),
    facturaUuid: texto(f[FAC.uuid]),
    facturaFecha: timbrado,
    facturaMetodoPago: texto(f[FAC.metodoPago]),
    facturaDiasCredito: diasCredito === null ? null : Math.trunc(diasCredito),
    facturaFechaVencimiento: vencimiento,
    facturaEstatus: noCobrar ? 'No cobrar' : vencida ? 'Vencida' : 'Por vencer',
    facturaDiasVencida: vencida ? diasEntre(vencimiento, corte) : 0,
    facturaRepDeVenta: texto(f[FAC.repFactura]),
    facturaRepDeCobranza: texto(f[FAC.repCobranza]),
    // "No cobrar": su saldo va solo a facturaNoCobrarGranTotal (no suma al
    // pendiente, vencido ni por vencer).
    facturaSaldoPendiente: noCobrar ? 0 : saldo,
    facturaSaldoVencido: noCobrar || !vencida ? 0 : saldo,
    facturaSaldoPorVencer: noCobrar || vencida ? 0 : saldo,
    facturaNoCobrarGranTotal: noCobrar ? saldo : 0,
    facturaNoCobrarIva: noCobrar
      ? redondear(numero(f[FAC.noCobrarIva]) ?? 0)
      : 0,
    facturaNoCobrarIeps: noCobrar
      ? redondear(numero(f[FAC.noCobrarIeps]) ?? 0)
      : 0,
    facturaNoCobrarFecha: noCobrar ? fechaNoCobrar : null,
    ventaId: id(f[FAC.ventaId]),
  };
}

function mapBanco(record: RawRecord, corte: string): Fila[] {
  const f: Campos = record.fieldData;
  const fechaBanco = fecha(f[BAN.fecha]);
  if (!fechaBanco || fechaBanco > corte) return [];

  const abono = numero(f[BAN.abono]) ?? 0;
  const cargo = numero(f[BAN.cargo]) ?? 0;
  let lado: LadoBanco;
  let monto: number;
  let clienteConciliado: number | null;
  if (abono > 0) {
    lado = 'ingreso';
    monto = abono;
    clienteConciliado = id(f[BAN.clienteIngreso]);
  } else if (cargo > 0) {
    lado = 'egreso';
    monto = cargo;
    clienteConciliado = id(f[BAN.clienteEgreso]);
    // Un cargo sin cliente (proveedor, comisión) no es de cobranza.
    if (!clienteConciliado) return [];
  } else {
    return [];
  }

  // Se calcula en moneda original y al final se pasa a MXN con el TC del depósito.
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

  const fila: Fila = {
    ...VACIO,
    bancoFolioTransaccion: id(f[BAN.folio]),
    bancoNombre: texto(f[BAN.banco]),
    bancoCuentaContable: texto(f[BAN.bancoCuentaContable]),
    bancoFecha: fechaBanco,
    bancoMonto: redondear(monto * tipoCambio),
    bancoReferencia: texto(f[BAN.referencia]),
  };

  const noIdentificadoFila = (importe: number): Fila => ({
    ...fila,
    tipoTransaccion: 'Abono no identificado',
    cliente: 'SIN IDENTIFICAR',
    abonoMontoSinIdentificar: importe,
  });
  if (lado === 'ingreso' && !clienteConciliado)
    return [noIdentificadoFila(saldo)];

  // La parte del movimiento que no quedó en el ingreso/egreso del cliente
  // (banco − monto registrado) no es suya: en un abono es no identificado; en
  // un cargo no es de cobranza. Sin monto registrado no se separa.
  const registrado = numero(
    f[lado === 'ingreso' ? BAN.montoIngreso : BAN.montoEgreso],
  );
  const sobrante = registrado
    ? Math.min(
        Math.max(redondear(monto * tipoCambio - registrado), 0),
        Math.max(saldo, 0),
      )
    : 0;
  const delCliente = redondear(saldo - sobrante);

  const c = banCliente(lado);
  const cliente = {
    clienteId: id(f[c.id]),
    cliente: texto(f[c.nombre]),
    clienteRazonSocial: texto(f[c.razonSocial]),
    clienteRfc: texto(f[c.rfc]),
    clasificacion1: texto(f[c.clasificacion(1)]),
    clasificacion2: texto(f[c.clasificacion(2)]),
    clasificacion3: texto(f[c.clasificacion(3)]),
    clasificacion4: texto(f[c.clasificacion(4)]),
    clienteCuentaContable: texto(f[c.cuentaContable]),
    clienteRepDeVenta: texto(f[c.rep]),
  };
  const filas: Fila[] = [];
  if (Math.abs(delCliente) >= 0.005) {
    filas.push(
      lado === 'ingreso'
        ? {
            ...fila,
            ...cliente,
            tipoTransaccion: 'Abono por aplicar',
            abonoSaldoNoAplicado: delCliente,
            ingresoId: id(f[BAN.ingresoId]),
          }
        : {
            ...fila,
            ...cliente,
            tipoTransaccion: 'Cargo por aplicar',
            cargoSaldoNoAplicado: delCliente,
            egresoId: id(f[BAN.egresoId]),
          },
    );
  }
  if (lado === 'ingreso' && sobrante >= 0.005) {
    filas.push(noIdentificadoFila(sobrante));
  }
  return filas;
}

const ORDEN_TIPO: TipoTransaccionCxC[] = [
  'Factura vencida',
  'Factura por vencer',
  'Factura cerrada: No cobrar',
  'Abono por aplicar',
  'Cargo por aplicar',
  'Abono no identificado',
];

/** Orden de la ficha (paso 6): tipo, fecha y desempate por id. */
function compararFilas(a: Fila, b: Fila): number {
  const fechaA = a.facturaFechaVencimiento ?? a.bancoFecha ?? '';
  const fechaB = b.facturaFechaVencimiento ?? b.bancoFecha ?? '';
  return (
    ORDEN_TIPO.indexOf(a.tipoTransaccion) -
      ORDEN_TIPO.indexOf(b.tipoTransaccion) ||
    fechaA.localeCompare(fechaB) ||
    (a.ventaId ?? a.bancoFolioTransaccion ?? 0) -
      (b.ventaId ?? b.bancoFolioTransaccion ?? 0)
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
): ReportReceivablesRecord[] {
  facturas.forEach((r, i) => assertSchema(validarFactura, r, 'facturas', i));
  bancos.forEach((r, i) => assertSchema(validarBanco, r, 'bancos', i));

  const filas = [
    ...facturas.map((r) => mapFactura(r, fechaCorte)),
    ...bancos.flatMap((r) => mapBanco(r, fechaCorte)),
  ].filter((fila): fila is Fila => fila !== null);
  return filas.sort(compararFilas).map((fila) => ({ fechaCorte, ...fila }));
}
