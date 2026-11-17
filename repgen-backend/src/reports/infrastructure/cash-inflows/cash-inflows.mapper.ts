import Ajv2020 from 'ajv/dist/2020';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type {
  DetalleIngresos,
  ReportCashInflowRecord,
  TipoRenglonIngreso,
} from '../../domain/cash-inflows';
import { getPortalRows } from '../../../common/utils';
import { fecha, id, numero, redondear, texto } from '../shared/fm-parsers';
import type { DateRange } from '../shared/sales-utils';
import pagosSchema from './ingresos-pagos.schema.json';
import bancosSchema from './ingresos-bancos.schema.json';
import { BAN, CONCEPTOS, PAGOS_VENTA, VEN } from './cash-inflows.fields';

/*
 * Implementa la "Lógica de negocio" de la ficha
 * (docs/reports/fichas/cash-inflows/cash-inflows.md): cada pago aplicado a una
 * factura sale con los importes de la factura (o del concepto) prorrateados
 * por lo pagado; los depósitos con saldo por aplicar salen aparte.
 */

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validarPago = ajv.compile(pagosSchema);
const validarBanco = ajv.compile(bancosSchema);

function assertSchema(
  validar: typeof validarPago,
  record: RawRecord,
  nombre: string,
  index: number,
): void {
  if (validar(record)) return;
  const detalle = ajv.errorsText(validar.errors, {
    separator: '; ',
    dataVar: `${nombre}[${index}]`,
  });
  throw new Error(`Registro de Ingresos inválido: ${detalle}`);
}

type Campos = Record<string, unknown>;

const n = (valor: unknown): number => numero(valor) ?? 0;
const tasa6 = (valor: number): number => Math.round(valor * 1e6) / 1e6;
/** Un tipo de cambio vacío o 0 es "sin conversión". */
const tipoCambio = (valor: unknown): number => n(valor) || 1;
const enRango = (dia: string | null, { startDate, endDate }: DateRange) =>
  dia !== null && dia >= startDate && dia <= endDate;

const VACIO: ReportCashInflowRecord = {
  tipoRenglon: 'Pago aplicado',
  pagoFecha: '',
  bancoFolioTransaccion: null,
  bancoNombre: '',
  bancoFormaPago: '',
  bancoMoneda: '',
  bancoTipoDeCambio: 1,
  cliente: '',
  clienteRazonSocial: null,
  clienteRfc: null,
  clienteCuentaContable: null,
  clasificacion1: null,
  clasificacion2: null,
  clasificacion3: null,
  clasificacion4: null,
  clienteId: null,
  clienteRepDeVenta: null,
  clienteColonia: null,
  clienteDelegacion: null,
  clienteCiudad: null,
  clienteEstado: null,
  creditoGranTotalMxn: null,
  ventaId: null,
  facturaUuid: null,
  facturaSerieFolio: null,
  facturaFecha: null,
  facturaFechaDeCaptura: null,
  facturaGranTotalMxn: null,
  facturaGranTotalOriginal: null,
  facturaMoneda: null,
  facturaTipoDeCambio: null,
  facturaUsoCfdi: null,
  facturaMetodoPago: null,
  facturaEstatus: null,
  facturaSaldoActual: null,
  pagoTasa: null,
  facturaRepDeVenta: null,
  facturaRepDeCobranza: null,
  observacionesEnCfdi: null,
  bodegaId: null,
  bodegaNombre: null,
  articuloSku: null,
  articuloMarca: null,
  articuloNombre: null,
  articuloNombreCompleto: null,
  articuloPresentacion: null,
  articuloCuentaContable: null,
  categoriadeProducto1: null,
  categoriadeProducto2: null,
  categoriadeProducto3: null,
  categoriadeProducto4: null,
  claveDeProductoOServicio: null,
  cantidad: null,
  unidadDeVenta: null,
  unidadDeContenido: null,
  contenidoUnitario: null,
  contenidoSubTotal: null,
  precioUnitario: null,
  tipoDeConcepto: null,
  metodoDeAdquisicion: null,
  costoDirectoUnitarioMxn: null,
  importeSinDescuentoMxn: null,
  descuentoMontoMxn: null,
  importeConDescuentoMxn: null,
  ivaMxn: null,
  iepsMxn: null,
  ivaRetenidoMxn: null,
  isrRetenidoMxn: null,
  pagoGranTotalMxn: 0,
  costoDirectoSubTotalMxn: null,
  gananciaBrutaMxn: null,
  costoTasa: null,
  margenTasa: null,
};

/** Estatus de hoy (no del periodo), sin "vencida / por vencer": eso depende del día. */
const ESTATUS: Record<string, string> = {
  Cobrado: 'Liquidado',
  Pendiente: 'Vigente',
  NoCobrar: 'No Cobrar',
  Cancelado: 'Cancelada',
};

const TIPO_CONCEPTO: Record<string, string> = {
  '0': 'Producto',
  '1': 'Servicio',
  '2': 'Activo',
};

/** Mismo formato que Ventas por concepto. */
function metodoDeAdquisicion(c: Campos): string {
  if (texto(c[CONCEPTOS.ordenCompraItm])) {
    return `[OC#${texto(c[CONCEPTOS.ordenCompraId])}] ${texto(c[CONCEPTOS.ordenCompraSerieFolio])} - ${texto(c[CONCEPTOS.ordenCompraFecha])}`;
  }
  const lote = texto(c[CONCEPTOS.lote]);
  return lote ? `Lote: ${lote}` : 'N/A';
}

/** Importes ya prorrateados (sin redondear) -> campos de la fila. */
function montos(m: {
  sin: number;
  descuento: number;
  con: number;
  iva: number;
  ieps: number;
  ivaRetenido: number;
  isrRetenido: number;
  pago: number;
  costo: number;
}) {
  return {
    importeSinDescuentoMxn: redondear(m.sin),
    descuentoMontoMxn: redondear(m.descuento),
    importeConDescuentoMxn: redondear(m.con),
    ivaMxn: redondear(m.iva),
    iepsMxn: redondear(m.ieps),
    ivaRetenidoMxn: redondear(m.ivaRetenido),
    isrRetenidoMxn: redondear(m.isrRetenido),
    pagoGranTotalMxn: redondear(m.pago),
    costoDirectoSubTotalMxn: redondear(m.costo),
    gananciaBrutaMxn: redondear(m.con - m.costo),
    // Con importe 0 no hay tasa que calcular.
    costoTasa: m.con ? tasa6(m.costo / m.con) : null,
    margenTasa: m.con ? tasa6(1 - m.costo / m.con) : null,
  };
}

function filasDePagos(
  pagos: RawRecord[],
  rango: DateRange,
  detalle: DetalleIngresos,
): ReportCashInflowRecord[] {
  const filas: ReportCashInflowRecord[] = [];
  pagos.forEach((registro, index) => {
    assertSchema(validarPago, registro, 'pagos', index);
    const f = registro.fieldData;
    const conceptos = getPortalRows(
      registro.portalData ?? null,
      CONCEPTOS.portal,
    );
    const granTotal = n(f[VEN.granTotal]);
    const tc = tipoCambio(f[VEN.tipoCambio]);

    for (const p of getPortalRows(
      registro.portalData ?? null,
      PAGOS_VENTA.portal,
    )) {
      const folio = id(p[PAGOS_VENTA.bancoFolio]);
      const dia = fecha(p[PAGOS_VENTA.fecha]);
      // Folio 0: nota de crédito u otro movimiento sin banco; no es dinero que entró.
      if (!folio || dia === null || !enRango(dia, rango)) continue;

      const pago = n(p[PAGOS_VENTA.montoMxn]);
      const tasa = granTotal ? pago / granTotal : 0;
      const base: ReportCashInflowRecord = {
        ...VACIO,
        tipoRenglon: 'Pago aplicado',
        pagoFecha: dia,
        bancoFolioTransaccion: folio,
        bancoNombre: texto(p[PAGOS_VENTA.bancoNombre]),
        bancoFormaPago: texto(p[PAGOS_VENTA.formaPago]),
        bancoMoneda: texto(p[PAGOS_VENTA.bancoMoneda]),
        bancoTipoDeCambio: tipoCambio(p[PAGOS_VENTA.bancoTipoCambio]),
        cliente: texto(f[VEN.cliente]),
        clienteRazonSocial: texto(f[VEN.razonSocial]),
        clienteRfc: texto(f[VEN.rfc]),
        clienteCuentaContable: texto(f[VEN.cuentaContable]),
        clasificacion1: texto(f[VEN.clasificacion(1)]),
        clasificacion2: texto(f[VEN.clasificacion(2)]),
        clasificacion3: texto(f[VEN.clasificacion(3)]),
        clasificacion4: texto(f[VEN.clasificacion(4)]),
        clienteId: id(f[VEN.clienteId]),
        clienteRepDeVenta: texto(f[VEN.repCliente]),
        clienteColonia: texto(f[VEN.colonia]),
        clienteDelegacion: texto(f[VEN.delegacion]),
        clienteCiudad: texto(f[VEN.ciudad]),
        clienteEstado: texto(f[VEN.estado]),
        creditoGranTotalMxn: redondear(n(f[VEN.creditoAutorizado])),
        ventaId: id(f[VEN.ventaId]),
        facturaUuid: texto(f[VEN.uuid]),
        facturaSerieFolio: texto(f[VEN.serieFolio]),
        facturaFecha: fecha(f[VEN.timbrado]),
        facturaFechaDeCaptura: fecha(f[VEN.fechaCaptura]),
        facturaGranTotalMxn: redondear(granTotal),
        facturaGranTotalOriginal: redondear(granTotal / tc),
        facturaMoneda: texto(f[VEN.moneda]),
        facturaTipoDeCambio: tc,
        facturaUsoCfdi: texto(f[VEN.usoCfdi]),
        facturaMetodoPago: texto(f[VEN.metodoPago]),
        facturaEstatus:
          texto(f[VEN.area]) === 'Cancelada'
            ? 'Cancelada'
            : (ESTATUS[texto(f[VEN.estatusSaldo])] ?? ''),
        facturaSaldoActual: redondear(n(f[VEN.saldo])),
        pagoTasa: tasa6(tasa),
        facturaRepDeVenta: texto(f[VEN.repFactura]),
        facturaRepDeCobranza: texto(f[VEN.repCobranza]),
        // FileMaker separa los renglones con \r.
        observacionesEnCfdi: texto(f[VEN.observaciones])
          .replace(/\r/g, ' ')
          .trim(),
        bodegaId: numero(f[VEN.bodegaId]),
        bodegaNombre: texto(f[VEN.bodegaNombre]),
      };

      if (detalle === 'factura') {
        const sin = n(f[VEN.importeSinDescuento]) * tasa;
        const descuento = n(f[VEN.descuento]) * tasa;
        const costo =
          conceptos.reduce((s, c) => s + n(c[CONCEPTOS.costoSubTotal]), 0) *
          tasa;
        filas.push({
          ...base,
          ...montos({
            sin,
            descuento,
            con: sin - descuento,
            iva: n(f[VEN.iva]) * tasa,
            ieps: n(f[VEN.ieps]) * tasa,
            ivaRetenido: n(f[VEN.ivaRetenido]) * tasa,
            isrRetenido: n(f[VEN.isrRetenido]) * tasa,
            pago,
            costo,
          }),
        });
        continue;
      }

      for (const c of conceptos) {
        // Cantidad, contenido y precios son los del concepto completo: solo
        // importes y costo subtotal se prorratean (ficha, paso 4).
        const cantidad = n(c[CONCEPTOS.qty]);
        const contenido = n(c[CONCEPTOS.contenido]);
        filas.push({
          ...base,
          articuloSku: texto(c[CONCEPTOS.sku]),
          articuloMarca: texto(c[CONCEPTOS.marca]),
          articuloNombre: texto(c[CONCEPTOS.nombre]),
          articuloNombreCompleto: texto(c[CONCEPTOS.nombreCompleto]),
          articuloPresentacion: texto(c[CONCEPTOS.presentacion]),
          articuloCuentaContable: texto(c[CONCEPTOS.cuentaContable]),
          categoriadeProducto1: texto(c[CONCEPTOS.clasificacion(1)]),
          categoriadeProducto2: texto(c[CONCEPTOS.clasificacion(2)]),
          categoriadeProducto3: texto(c[CONCEPTOS.clasificacion(3)]),
          categoriadeProducto4: texto(c[CONCEPTOS.clasificacion(4)]),
          claveDeProductoOServicio: `${texto(c[CONCEPTOS.satClave])}-${texto(c[CONCEPTOS.satNombre])}`,
          cantidad,
          unidadDeVenta: texto(c[CONCEPTOS.unidadVenta]),
          unidadDeContenido: texto(c[CONCEPTOS.unidadContenido]),
          contenidoUnitario: contenido,
          contenidoSubTotal: tasa6(contenido * cantidad),
          precioUnitario: redondear(n(c[CONCEPTOS.precioUnitario])),
          tipoDeConcepto: TIPO_CONCEPTO[texto(c[CONCEPTOS.tipo])] ?? '',
          metodoDeAdquisicion: metodoDeAdquisicion(c),
          costoDirectoUnitarioMxn: redondear(n(c[CONCEPTOS.costoUnitario])),
          ...montos({
            sin: n(c[CONCEPTOS.importeSinDescuento]) * tasa,
            descuento: n(c[CONCEPTOS.descuento]) * tasa,
            con: n(c[CONCEPTOS.importeConDescuento]) * tasa,
            iva: n(c[CONCEPTOS.iva]) * tasa,
            ieps: n(c[CONCEPTOS.ieps]) * tasa,
            ivaRetenido: n(c[CONCEPTOS.ivaRetenido]) * tasa,
            isrRetenido: n(c[CONCEPTOS.isrRetenido]) * tasa,
            pago: n(c[CONCEPTOS.granTotal]) * tasa,
            costo: n(c[CONCEPTOS.costoSubTotal]) * tasa,
          }),
        });
      }
    }
  });
  return filas;
}

function filasDeBancos(
  bancos: RawRecord[],
  rango: DateRange,
): ReportCashInflowRecord[] {
  const filas: ReportCashInflowRecord[] = [];
  bancos.forEach((registro, index) => {
    assertSchema(validarBanco, registro, 'bancos', index);
    const f = registro.fieldData;
    const dia = fecha(f[BAN.fecha]);
    const saldo = n(f[BAN.saldo]);
    if (n(f[BAN.abono]) <= 0 || saldo <= 0 || dia === null) return;
    if (!enRango(dia, rango)) return;

    const tc = tipoCambio(f[BAN.tipoCambio]);
    const banco: ReportCashInflowRecord = {
      ...VACIO,
      tipoRenglon: 'Pago no identificado',
      cliente: 'NO IDENTIFICADO',
      pagoFecha: dia,
      bancoFolioTransaccion: id(f[BAN.folio]),
      bancoNombre: texto(f[BAN.banco]),
      bancoFormaPago: texto(f[BAN.formaPago]),
      bancoMoneda: texto(f[BAN.moneda]),
      bancoTipoDeCambio: tc,
      // Solo lo que falta por aplicar, no el depósito completo.
      pagoGranTotalMxn: redondear(saldo * tc),
    };
    if (!id(f[BAN.clienteIngreso])) {
      filas.push(banco);
      return;
    }
    // Sin la división de CxC (ingreso menor que el depósito): con dos
    // ingresos en un depósito, el monto del ingreso es de otro cliente.
    filas.push({
      ...banco,
      tipoRenglon: 'Pago sin aplicar',
      cliente: texto(f[BAN.cliente]),
      clienteRazonSocial: texto(f[BAN.razonSocial]),
      clienteRfc: texto(f[BAN.rfc]),
      clienteCuentaContable: texto(f[BAN.cuentaContable]),
      clasificacion1: texto(f[BAN.clasificacion(1)]),
      clasificacion2: texto(f[BAN.clasificacion(2)]),
      clasificacion3: texto(f[BAN.clasificacion(3)]),
      clasificacion4: texto(f[BAN.clasificacion(4)]),
      clienteId: id(f[BAN.clienteId]),
      clienteRepDeVenta: texto(f[BAN.repCliente]),
    });
  });
  return filas;
}

const ORDEN: TipoRenglonIngreso[] = [
  'Pago aplicado',
  'Pago sin aplicar',
  'Pago no identificado',
];

/**
 * Registros crudos de los dos layouts -> filas del reporte, en la vista
 * pedida ('factura': una fila por pago × factura; 'concepto': por pago ×
 * factura × concepto).
 */
export function cleanData(
  pagos: RawRecord[],
  bancos: RawRecord[],
  rango: DateRange,
  detalle: DetalleIngresos,
): ReportCashInflowRecord[] {
  // sort es estable: los conceptos conservan el orden del portal.
  return [
    ...filasDePagos(pagos, rango, detalle),
    ...filasDeBancos(bancos, rango),
  ].sort(
    (a, b) =>
      ORDEN.indexOf(a.tipoRenglon) - ORDEN.indexOf(b.tipoRenglon) ||
      a.pagoFecha.localeCompare(b.pagoFecha) ||
      (a.bancoFolioTransaccion ?? 0) - (b.bancoFolioTransaccion ?? 0) ||
      (a.ventaId ?? 0) - (b.ventaId ?? 0),
  );
}
