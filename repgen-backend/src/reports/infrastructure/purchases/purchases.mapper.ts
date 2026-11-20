import Ajv2020 from 'ajv/dist/2020';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type { ReportPurchaseRecord } from '../../domain/purchases';
import { hoyEnMexico } from '../../../common/utils';
import { fecha, id, numero, texto, unaLinea } from '../shared/fm-parsers';
import {
  estatusCompra,
  granTotalOriginal,
  serieFolioCompra,
} from '../shared/compras';
import type { DateRange } from '../shared/sales-utils';
import schema from './compras.schema.json';
import { BANCO, COMPRA, ENTREGA, MONTOS, PROVEEDOR } from './purchases.fields';

/*
 * Implementa la "Lógica de negocio" de la ficha
 * (docs/reports/fichas/purchases/purchases.md): un renglón por compra
 * aprobada, con los montos de la compra tal como vienen de FileMaker.
 */

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validar = ajv.compile(schema);

type Campos = Record<string, unknown>;
type Fila = ReportPurchaseRecord;

function fila(f: Campos, hoy: string): Fila {
  const granTotal = numero(f[MONTOS.granTotal]);
  const tipoCambio = numero(f[COMPRA.tipoCambio]);
  const limite = fecha(f[COMPRA.fechaLimiteDePago]);
  const conCfdi = texto(f[COMPRA.uuid]) !== '';

  return {
    compraFechaAprobado: fecha(f[COMPRA.fechaAprobado]),
    compraId: id(f[COMPRA.id]) ?? 0,
    compraRepDeCompra: texto(f[COMPRA.repDeCompra]),
    proveedor: unaLinea(f[PROVEEDOR.nombre]),
    proveedorRazonSocial: unaLinea(f[PROVEEDOR.razonSocial]),
    proveedorRfc: texto(f[PROVEEDOR.rfc]),
    proveedorCuentaContable: unaLinea(f[PROVEEDOR.cuentaContable]),
    facturaUuid: texto(f[COMPRA.uuid]),
    facturaSerieFolio: serieFolioCompra(
      f[COMPRA.uuid],
      f[COMPRA.serie],
      f[COMPRA.folio],
    ),
    facturaFecha: conCfdi ? fecha(f[COMPRA.fechaCfdi]) : null,
    facturaObservaciones: unaLinea(f[COMPRA.observaciones]),
    facturaEstatus: estatusCompra(texto(f[COMPRA.area]), limite, hoy),
    facturaSaldoActual: numero(f[COMPRA.saldoMxn]),
    facturaFechaLimiteDePago: limite,
    bancoNombre: texto(f[BANCO.nombre]),
    bancoNumeroCuenta: texto(f[BANCO.cuenta]),
    facturaMoneda: texto(f[COMPRA.moneda]),
    facturaTipoDeCambio: tipoCambio,
    facturaGranTotalOriginal: granTotalOriginal(granTotal, tipoCambio),
    importeConDescuentoMxn: numero(f[MONTOS.importeConDescuento]),
    ivaMxn: numero(f[MONTOS.iva]),
    iepsMxn: numero(f[MONTOS.ieps]),
    ivaRetenidoMxn: numero(f[MONTOS.ivaRetenido]),
    isrRetenidoMxn: numero(f[MONTOS.isrRetenido]),
    facturaGranTotalMxn: granTotal,
    // Tal cual de FileMaker, también en compras de puro gasto (decisión 3).
    bodegaNombre: texto(f[ENTREGA.bodega]),
    bodegaEntregaEstatus: texto(f[ENTREGA.estatus]),
    bodegaFechaEstimadaDeEntrega: fecha(f[ENTREGA.fechaEstimada]),
  };
}

/**
 * Registros de apiExport_Compra → filas del reporte. `hoy` decide si una
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
    throw new Error(`Registro de Compras inválido: ${detalle}`);
  });
  return rawData
    .map((r) => fila(r.fieldData, hoy))
    .sort((a, b) => a.compraId - b.compraId);
}
