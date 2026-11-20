import Ajv2020 from 'ajv/dist/2020';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type {
  EstatusCompra,
  ReportPurchaseItemRecord,
} from '../../domain/purchase-items';
import { hoyEnMexico } from '../../../common/utils';
import {
  fecha,
  id,
  numero,
  redondear,
  redondear6,
  texto,
  unaLinea,
} from '../shared/fm-parsers';
import type { DateRange } from '../shared/sales-utils';
import schema from './compras-conceptos.schema.json';
import {
  ARTICULO,
  BANCO,
  COMPRA,
  CONCEPTO,
  PROVEEDOR,
} from './purchase-items.fields';

/*
 * Implementa la "Lógica de negocio" de la ficha
 * (docs/reports/fichas/purchase-items/purchase-items.md): un renglón por
 * concepto de una compra aprobada; los datos de la compra se repiten.
 */

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validar = ajv.compile(schema);

type Campos = Record<string, unknown>;
type Fila = ReportPurchaseItemRecord;

const TIPOS: Record<string, string> = {
  STOCK: 'Stock',
  GASTO: 'Gasto',
  INCREMENTABLE: 'Incrementable',
  COSTO: 'Costo',
};

/** Cerrado = liquidada; en Pagos, vencida si la fecha límite ya pasó (decisión 4). */
function estatus(
  area: string,
  limite: string | null,
  hoy: string,
): EstatusCompra {
  if (area === 'Cerrado') return 'Liquidado';
  return limite && limite < hoy ? 'Vencida' : 'Vigente';
}

/** Monto del concepto = cantidad × unitario de FileMaker, sin ruido de punto flotante. */
const porCantidad = (cantidad: number | null, unitario: unknown) => {
  const u = numero(unitario);
  return cantidad === null || u === null ? null : redondear6(cantidad * u);
};

function fila(f: Campos, hoy: string): Fila {
  const tipoFm = texto(f[CONCEPTO.tipo]);
  const tipo = TIPOS[tipoFm.toUpperCase()] ?? tipoFm;
  const gasto = tipo === 'Gasto';
  const conCfdi = texto(f[COMPRA.uuid]) !== '';
  const granTotal = numero(f[COMPRA.granTotalMxn]);
  const tipoCambio = numero(f[COMPRA.tipoCambio]);
  const limite = fecha(f[COMPRA.fechaLimiteDePago]);
  const cantidad = numero(f[CONCEPTO.cantidad]);
  const sinDescuento = porCantidad(cantidad, f[CONCEPTO.unitSinDescuento]);
  const conDescuento = porCantidad(cantidad, f[CONCEPTO.unitConDescuento]);
  const entrega = gasto ? null : fecha(f[CONCEPTO.fechaEntrega]);
  const clave = texto(f[ARTICULO.unidadClave]);
  const [cat1, cat2, cat3, cat4] = ARTICULO.categorias.map((c) => texto(f[c]));

  return {
    compraFechaAprobado: fecha(f[COMPRA.fechaAprobado]),
    compraId: id(f[COMPRA.id]) ?? 0,
    compraRepDeCompra: texto(f[COMPRA.repDeCompra]),
    proveedor: unaLinea(f[PROVEEDOR.nombre]),
    proveedorRazonSocial: unaLinea(f[PROVEEDOR.razonSocial]),
    proveedorRfc: texto(f[PROVEEDOR.rfc]),
    proveedorCuentaContable: unaLinea(f[PROVEEDOR.cuentaContable]),
    facturaUuid: texto(f[COMPRA.uuid]),
    facturaSerieFolio: conCfdi
      ? `${texto(f[COMPRA.serie])}-${texto(f[COMPRA.folio])}`
      : null,
    facturaFecha: conCfdi ? fecha(f[COMPRA.fechaCfdi]) : null,
    facturaGranTotalMxn: granTotal,
    facturaObservaciones: unaLinea(f[COMPRA.observaciones]),
    facturaEstatus: estatus(texto(f[COMPRA.area]), limite, hoy),
    facturaSaldoActual: numero(f[COMPRA.saldoMxn]),
    facturaFechaLimiteDePago: limite,
    bancoNombre: texto(f[BANCO.nombre]),
    bancoNumeroCuenta: texto(f[BANCO.cuenta]),
    facturaMoneda: texto(f[COMPRA.moneda]),
    facturaTipoDeCambio: tipoCambio,
    // Un tipo de cambio vacío o 0 es "sin conversión".
    facturaGranTotalOriginal:
      granTotal === null ? null : redondear(granTotal / (tipoCambio || 1)),
    articuloSku: texto(f[ARTICULO.sku]),
    articuloMarca: texto(f[ARTICULO.marca]),
    articuloNombre: unaLinea(f[ARTICULO.nombre]),
    articuloNombreCompleto: unaLinea(f[ARTICULO.nombreCompleto]),
    articuloCuentaContable: texto(f[ARTICULO.cuentaContable]),
    categoriadeProducto1: cat1,
    categoriadeProducto2: cat2,
    categoriadeProducto3: cat3,
    categoriadeProducto4: cat4,
    tipoDeConcepto: tipo,
    cantidad,
    unidadDeCompra: clave
      ? `[${clave}] ${texto(f[ARTICULO.unidadNombre])}`.trim()
      : '',
    precioUnitario: porCantidad(1, f[CONCEPTO.unitSinDescuento]),
    articuloImporteSinDescuentoMxn: sinDescuento,
    articuloDescuentoMontoMxn:
      sinDescuento === null || conDescuento === null
        ? null
        : redondear6(sinDescuento - conDescuento),
    articuloImporteConDescuentoMxn: conDescuento,
    articuloIVAMxn: porCantidad(cantidad, f[CONCEPTO.unitIva]),
    articuloIEPSMxn: porCantidad(cantidad, f[CONCEPTO.unitIeps]),
    articuloIVARetenidoMxn: porCantidad(cantidad, f[CONCEPTO.unitIvaRetenido]),
    articuloISRretenidoMxn: porCantidad(cantidad, f[CONCEPTO.unitIsrRetenido]),
    articuloGranTotalMxn: porCantidad(cantidad, f[CONCEPTO.unitGranTotal]),
    // Un gasto no pasa por bodega (paso 4).
    bodegaNombre: gasto ? null : texto(f[CONCEPTO.bodega]),
    bodegaEntregaEstatus: gasto ? null : entrega ? 'Entregado' : 'Pendiente',
    bodegaEntregaFecha: entrega,
  };
}

/**
 * Registros de apiExport_CompraITM → filas del reporte. `hoy` decide si una
 * compra con saldo está vencida; los tests la fijan.
 */
export function cleanData(
  rawData: RawRecord[],
  _rango?: DateRange,
  hoy: string = hoyEnMexico(),
): Fila[] {
  rawData.forEach((record, index) => {
    if (validar(record)) return;
    const detalle = ajv.errorsText(validar.errors, {
      separator: '; ',
      dataVar: `registro[${index}]`,
    });
    throw new Error(`Registro de Compras por concepto inválido: ${detalle}`);
  });
  // FileMaker no devuelve los conceptos agrupados por compra (paso 5); sort es estable.
  return rawData
    .map((r) => fila(r.fieldData, hoy))
    .sort((a, b) => a.compraId - b.compraId);
}
