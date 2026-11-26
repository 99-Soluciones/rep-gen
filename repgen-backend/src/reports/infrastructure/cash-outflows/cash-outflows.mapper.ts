import Ajv2020 from 'ajv/dist/2020';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type {
  DetalleEgresos,
  ReportCashOutflowRecord,
  TipoRenglonEgreso,
} from '../../domain/cash-outflows';
import { getPortalRows, hoyEnMexico } from '../../../common/utils';
import {
  fecha,
  id,
  numero,
  redondear,
  redondear6,
  texto,
  tipoCambio,
  unaLinea,
} from '../shared/fm-parsers';
import {
  estatusCompra,
  granTotalOriginal,
  serieFolioCompra,
  tipoConceptoCompra,
} from '../shared/compras';
import { enRango, type DateRange } from '../shared/sales-utils';
import pagosSchema from './egresos-pagos.schema.json';
import bancosSchema from './egresos-bancos.schema.json';
import { BAN, CONCEPTOS, FAC, PAGOS_COMPRA } from './cash-outflows.fields';

/*
 * Implementa la "Lógica de negocio" de la ficha
 * (docs/reports/fichas/cash-outflows/cash-outflows.md): cada pago aplicado a
 * una factura de compra sale con los importes de la factura (o del concepto)
 * prorrateados por lo pagado; los cargos con saldo por aplicar salen aparte.
 * Es la réplica de Flujo de efectivo - Ingresos del lado de compras.
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
  throw new Error(`Registro de Egresos inválido: ${detalle}`);
}

type Campos = Record<string, unknown>;
type Fila = ReportCashOutflowRecord;

const n = (valor: unknown): number => numero(valor) ?? 0;
const TRASPASO = 'TRASPASO ENTRE CUENTAS';

/** Lo que solo tienen los pagos aplicados (o la vista por concepto): null. */
const SOLO_APLICADO = {
  compraId: null,
  facturaUuid: null,
  facturaSerieFolio: null,
  facturaFecha: null,
  facturaGranTotalMxn: null,
  facturaObservaciones: null,
  facturaEstatus: null,
  facturaSaldoActual: null,
  compraRepDeCompra: null,
  pagoTasa: null,
  facturaMoneda: null,
  facturaTipoDeCambio: null,
  facturaGranTotalOriginal: null,
  articuloSku: null,
  articuloMarca: null,
  articuloNombre: null,
  articuloNombreCompleto: null,
  articuloCuentaContable: null,
  categoriadeProducto1: null,
  categoriadeProducto2: null,
  categoriadeProducto3: null,
  categoriadeProducto4: null,
  tipoDeConcepto: null,
  cantidad: null,
  unidadDeCompra: null,
  precioUnitario: null,
  importeSinDescuentoMxn: null,
  descuentoMontoMxn: null,
  importeConDescuentoMxn: null,
  ivaMxn: null,
  iepsMxn: null,
  ivaRetenidoMxn: null,
  isrRetenidoMxn: null,
  bodegaEntregaEstatus: null,
  bodegaEntregaFecha: null,
  bodegaNombre: null,
} satisfies Partial<Fila>;

/** Importes ya prorrateados (sin redondear) -> campos de la fila. */
const montos = (m: {
  sin: number;
  descuento: number;
  con: number;
  iva: number;
  ieps: number;
  ivaRetenido: number;
  isrRetenido: number;
  pago: number;
}) => ({
  importeSinDescuentoMxn: redondear(m.sin),
  descuentoMontoMxn: redondear(m.descuento),
  importeConDescuentoMxn: redondear(m.con),
  ivaMxn: redondear(m.iva),
  iepsMxn: redondear(m.ieps),
  ivaRetenidoMxn: redondear(m.ivaRetenido),
  isrRetenidoMxn: redondear(m.isrRetenido),
  pagoGranTotalMxn: redondear(m.pago),
});

function filasDeConceptos(
  base: Fila,
  conceptos: Campos[],
  tasa: number,
  bodega: string,
) {
  return conceptos.map((c): Fila => {
    const tipo = tipoConceptoCompra(c[CONCEPTOS.tipo]);
    // Un gasto no pasa por bodega (regla de Compras por concepto).
    const gasto = tipo === 'Gasto';
    const entrega = gasto ? null : fecha(c[CONCEPTOS.fechaEntrega]);
    const clave = texto(c[CONCEPTOS.unidadClave]);
    return {
      ...base,
      articuloSku: texto(c[CONCEPTOS.sku]),
      articuloMarca: texto(c[CONCEPTOS.marca]),
      articuloNombre: unaLinea(c[CONCEPTOS.nombre]),
      articuloNombreCompleto: unaLinea(c[CONCEPTOS.nombreCompleto]),
      articuloCuentaContable: texto(c[CONCEPTOS.cuentaContable]),
      categoriadeProducto1: texto(c[CONCEPTOS.categoria(1)]),
      categoriadeProducto2: texto(c[CONCEPTOS.categoria(2)]),
      categoriadeProducto3: texto(c[CONCEPTOS.categoria(3)]),
      categoriadeProducto4: texto(c[CONCEPTOS.categoria(4)]),
      tipoDeConcepto: tipo,
      // Cantidad y precio son los del concepto completo; solo los importes
      // se prorratean (ficha, paso 4).
      cantidad: n(c[CONCEPTOS.cantidad]),
      unidadDeCompra: clave
        ? `[${clave}] ${texto(c[CONCEPTOS.unidadNombre])}`.trim()
        : '',
      precioUnitario: redondear(n(c[CONCEPTOS.precioUnitario])),
      ...montos({
        sin: n(c[CONCEPTOS.importeSinDescuento]) * tasa,
        descuento: n(c[CONCEPTOS.descuento]) * tasa,
        con: n(c[CONCEPTOS.importeConDescuento]) * tasa,
        iva: n(c[CONCEPTOS.iva]) * tasa,
        ieps: n(c[CONCEPTOS.ieps]) * tasa,
        ivaRetenido: n(c[CONCEPTOS.ivaRetenido]) * tasa,
        isrRetenido: n(c[CONCEPTOS.isrRetenido]) * tasa,
        pago: n(c[CONCEPTOS.granTotal]) * tasa,
      }),
      bodegaEntregaEstatus: gasto ? null : entrega ? 'Entregado' : 'Pendiente',
      bodegaEntregaFecha: entrega,
      bodegaNombre: gasto ? null : bodega,
    };
  });
}

function filasDePagos(
  pagos: RawRecord[],
  rango: DateRange,
  detalle: DetalleEgresos,
  hoy: string,
): Fila[] {
  const filas: Fila[] = [];
  pagos.forEach((registro, index) => {
    assertSchema(validarPago, registro, 'pagos', index);
    const f = registro.fieldData;
    const portales = registro.portalData ?? null;
    const conceptos = getPortalRows(portales, CONCEPTOS.portal);
    const granTotal = n(f[FAC.granTotal]);
    const tc = tipoCambio(f[FAC.tipoCambio]);
    const conCfdi = texto(f[FAC.uuid]) !== '';

    for (const p of getPortalRows(portales, PAGOS_COMPRA.portal)) {
      const folio = id(p[PAGOS_COMPRA.bancoFolio]);
      const dia = fecha(p[PAGOS_COMPRA.fecha]);
      const banco = texto(p[PAGOS_COMPRA.bancoNombre]);
      // Sin banco (compensación, forma de pago 17): no salió dinero del banco.
      if (!folio || !banco || !enRango(dia, rango)) continue;

      const pago = n(p[PAGOS_COMPRA.montoMxn]);
      const tasa = granTotal ? pago / granTotal : 0;
      const base: Fila = {
        tipoRenglon: 'Pago aplicado',
        pagoFecha: dia,
        bancoFolioTransaccion: folio,
        bancoNombre: banco,
        bancoFormaPago: texto(p[PAGOS_COMPRA.formaPago]),
        bancoMoneda: texto(p[PAGOS_COMPRA.bancoMoneda]),
        bancoTipoDeCambio: tipoCambio(p[PAGOS_COMPRA.bancoTipoCambio]),
        proveedor: unaLinea(f[FAC.proveedor]),
        proveedorRazonSocial: unaLinea(f[FAC.razonSocial]),
        proveedorRfc: texto(f[FAC.rfc]),
        proveedorCuentaContable: unaLinea(f[FAC.cuentaContable]),
        ...SOLO_APLICADO,
        compraId: id(f[FAC.compraId]),
        facturaUuid: texto(f[FAC.uuid]),
        facturaSerieFolio: serieFolioCompra(
          f[FAC.uuid],
          f[FAC.serie],
          f[FAC.folio],
        ),
        facturaFecha: conCfdi ? fecha(f[FAC.fechaCfdi]) : null,
        facturaGranTotalMxn: redondear(granTotal),
        facturaObservaciones: unaLinea(f[FAC.observaciones]),
        facturaEstatus: estatusCompra(
          texto(f[FAC.area]),
          fecha(f[FAC.fechaLimiteDePago]),
          hoy,
        ),
        facturaSaldoActual: redondear(n(f[FAC.saldoMxn])),
        compraRepDeCompra: texto(f[FAC.repDeCompra]),
        pagoTasa: redondear6(tasa),
        facturaMoneda: texto(f[FAC.moneda]),
        facturaTipoDeCambio: tc,
        facturaGranTotalOriginal: granTotalOriginal(granTotal, tc),
        pagoGranTotalMxn: 0,
      };

      if (detalle === 'concepto') {
        filas.push(
          ...filasDeConceptos(base, conceptos, tasa, texto(f[FAC.bodega])),
        );
        continue;
      }
      // La factura no trae importe sin descuento ni descuento: se suman de sus conceptos.
      const suma = (campo: string) =>
        conceptos.reduce((s, c) => s + n(c[campo]), 0);
      filas.push({
        ...base,
        ...montos({
          sin: suma(CONCEPTOS.importeSinDescuento) * tasa,
          descuento: suma(CONCEPTOS.descuento) * tasa,
          con: n(f[FAC.importeConDescuento]) * tasa,
          iva: n(f[FAC.iva]) * tasa,
          ieps: n(f[FAC.ieps]) * tasa,
          ivaRetenido: n(f[FAC.ivaRetenido]) * tasa,
          isrRetenido: n(f[FAC.isrRetenido]) * tasa,
          pago,
        }),
      });
    }
  });
  return filas;
}

/** Tipo de un cargo sin aplicar (ficha, paso 3): el traspaso se evalúa primero. */
function tipoDeCargo(f: Campos): TipoRenglonEgreso {
  if (texto(f[BAN.concepto]).startsWith(TRASPASO))
    return 'Traspaso entre cuentas';
  return id(f[BAN.proveedorEgreso])
    ? 'Pago sin aplicar'
    : 'Pago no identificado';
}

function filasDeBancos(bancos: RawRecord[], rango: DateRange): Fila[] {
  const filas: Fila[] = [];
  bancos.forEach((registro, index) => {
    assertSchema(validarBanco, registro, 'bancos', index);
    const f = registro.fieldData;
    const dia = fecha(f[BAN.fecha]);
    const saldo = n(f[BAN.saldo]);
    if (n(f[BAN.cargo]) <= 0 || saldo <= 0 || !enRango(dia, rango)) return;

    const conProveedor = id(f[BAN.proveedorEgreso]) !== null;
    const tc = tipoCambio(f[BAN.tipoCambio]);
    filas.push({
      tipoRenglon: tipoDeCargo(f),
      pagoFecha: dia,
      bancoFolioTransaccion: id(f[BAN.folio]) ?? 0,
      bancoNombre: texto(f[BAN.banco]),
      bancoFormaPago: texto(f[BAN.formaPago]),
      bancoMoneda: texto(f[BAN.moneda]),
      bancoTipoDeCambio: tc,
      // Un traspaso usa la misma regla de proveedor que los demás cargos.
      proveedor: conProveedor ? unaLinea(f[BAN.proveedor]) : 'NO IDENTIFICADO',
      proveedorRazonSocial: conProveedor ? unaLinea(f[BAN.razonSocial]) : null,
      proveedorRfc: conProveedor ? texto(f[BAN.rfc]) : null,
      proveedorCuentaContable: conProveedor
        ? unaLinea(f[BAN.cuentaContable])
        : null,
      ...SOLO_APLICADO,
      // Solo lo que falta por aplicar, no el cargo completo.
      pagoGranTotalMxn: redondear(saldo * tc),
    });
  });
  return filas;
}

const ORDEN: TipoRenglonEgreso[] = [
  'Pago aplicado',
  'Pago sin aplicar',
  'Pago no identificado',
  'Traspaso entre cuentas',
];

/**
 * Registros crudos de los dos layouts -> filas del reporte, en la vista
 * pedida ('factura': una fila por pago × factura; 'concepto': por pago ×
 * factura × concepto). `hoy` decide si una factura con saldo está vencida;
 * los tests la fijan.
 */
export function cleanData(
  pagos: RawRecord[],
  bancos: RawRecord[],
  rango: DateRange,
  detalle: DetalleEgresos,
  hoy: string = hoyEnMexico(),
): Fila[] {
  // sort es estable: los conceptos conservan el orden del portal.
  return [
    ...filasDePagos(pagos, rango, detalle, hoy),
    ...filasDeBancos(bancos, rango),
  ].sort(
    (a, b) =>
      ORDEN.indexOf(a.tipoRenglon) - ORDEN.indexOf(b.tipoRenglon) ||
      a.pagoFecha.localeCompare(b.pagoFecha) ||
      a.bancoFolioTransaccion - b.bancoFolioTransaccion ||
      (a.compraId ?? 0) - (b.compraId ?? 0),
  );
}
