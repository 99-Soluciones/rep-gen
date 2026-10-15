import Ajv2020 from 'ajv/dist/2020';
import { BadRequestException } from '@nestjs/common';
import { RawRecord } from '../../../filemaker/ifilemaker';
import type {
  ReportSalesItemRecord,
  SalesItemMappedRecord,
} from '../../domain/';
import schema from './salesitem-report.schema.json';

import { TypeGetters } from '../../../common/utils';
import { mapSalesItemRecordWithCleanKeys } from './salesitem-field-map.helper';
import {
  CANCELED_STATUS,
  DateRange,
  RETURN_STATUS,
  extractSerieFolio,
  negate,
  normalizeExchangeRate,
  safeDateInRange,
  stateCFDI,
} from '../shared';

const { getString, getNumber } = TypeGetters;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSalesItemRecord = ajv.compile(schema);

const BASE_SALES_ITEM_DEFAULTS: ReportSalesItemRecord = {
  cliente: '',
  clienteRazonSocial: '',
  clienteRfc: '',
  clienteCuentaContable: '',
  clienteCalle: '',
  clienteColonia: '',
  clienteDelegacion: '',
  clienteCiudad: '',
  clienteEstado: '',
  clienteId: 0,
  clienteRepDeVenta: '',
  clienteRepDeCobranza: '',
  nombreClasificacion1: '',
  nombreClasificacion2: '',
  nombreClasificacion3: '',
  nombreClasificacion4: '',
  clasificacion1: '',
  clasificacion2: '',
  clasificacion3: '',
  clasificacion4: '',
  ventaId: 0,
  devoId: '',
  facturaUuid: '',
  facturaSerie: '',
  facturaFolio: '',
  facturaFecha: '',
  facturaGranTotalMxn: 0,
  facturaGranTotalOriginal: 0,
  facturaFechaDeCaptura: '',
  facturaTipoDeCambio: 0,
  facturaMoneda: '',
  facturaUsoCfdi: '',
  facturaMetodoPago: '',
  facturaFormaDePago: '',
  facturaEstatus: '',
  facturaSaldoActual: 0,
  facturaTasaPagada: 0,
  observacionesEnCfdi: '',
  bodegaId: 0,
  bodegaNombre: '',
  importeSinDescuentoMxn: 0,
  descuentoMontoMxn: 0,
  importeConDescuentoMxn: 0,
  ivaMxn: 0,
  iepsMxn: 0,
  ivaRetenidoMxn: 0,
  isrRetenidoMxn: 0,
  pagoGranTotalMxn: 0,
  tipoDeConcepto: '',
  metodoDeAdquisicion: '',
  costoDirectoUnitarioMxn: 0,
  costoDirectoSubTotalMxn: 0,
  gananciaBrutaMxn: 0,
  costoTasa: 0,
  margenTasa: 0,
  articuloSku: '',
  articuloMarca: '',
  articuloNombre: '',
  articuloNombreCompleto: '',
  articuloCuentaContable: '',
  categoriadeProducto1: '',
  categoriadeProducto2: '',
  categoriadeProducto3: '',
  categoriadeProducto4: '',
  claveDeProductoOServicio: '',
  cantidad: 0,
  unidadDeVenta: '',
  unidadDeContenido: '',
  contenidoUnitario: 0,
  contenidoSubTotal: 0,
  precioUnitario: 0,
};

function assertSalesItemRecord(record: RawRecord, index: number): void {
  if (validateSalesItemRecord(record)) {
    return;
  }

  const details = ajv.errorsText(validateSalesItemRecord.errors, {
    separator: '; ',
    dataVar: `rawData[${index}]`,
  });

  throw new BadRequestException(`SalesItem record invalido: ${details}`);
}

function resolveMethodOfAcquisition(
  mappedRecord: SalesItemMappedRecord,
): string {
  const poIdu = getString(mappedRecord.item?.idu);
  const poId = getString(mappedRecord.po?.id);
  const poFechaComprobante = getString(mappedRecord.po?.fechaComprobante);
  const poSerieFolio = getString(mappedRecord.po?.serieFolio);
  const loteProduccion = getString(mappedRecord.item?.serieMasNumber);

  if (poIdu) {
    return `[OC#${poId}] ${poSerieFolio} - ${poFechaComprobante}`;
  }

  if (loteProduccion) {
    return `Lote: ${loteProduccion}`;
  }

  return 'N/A';
}

function buildBaseRecord(
  mappedRecord: SalesItemMappedRecord,
): ReportSalesItemRecord {
  const cantidadArticulo = getNumber(mappedRecord.qty);

  return {
    ...BASE_SALES_ITEM_DEFAULTS,
    cliente: getString(mappedRecord.cliente?.nombreComercial),
    clienteRazonSocial: getString(mappedRecord.cliente?.razonSocial),
    clienteRfc: getString(mappedRecord.cliente?.rfc),
    clienteCuentaContable: getString(mappedRecord.cliente?.cuentaContable),
    clienteCalle: getString(mappedRecord.entrega?.direccion),
    clienteColonia: getString(mappedRecord.entrega?.colonia),
    clienteDelegacion: getString(mappedRecord.entrega?.delegacion),
    clienteCiudad: getString(mappedRecord.entrega?.ciudad),
    clienteEstado: getString(mappedRecord.entrega?.estado),
    clienteId: getNumber(mappedRecord.cliente?.id),
    clienteRepDeVenta: getString(mappedRecord.usuario?.idVenta),
    clienteRepDeCobranza: getString(mappedRecord.usuario?.idCobranza),
    nombreClasificacion1: getString(mappedRecord.venta?.clasificacion1),
    nombreClasificacion2: getString(mappedRecord.venta?.clasificacion2),
    nombreClasificacion3: getString(mappedRecord.venta?.clasificacion3),
    nombreClasificacion4: getString(mappedRecord.venta?.clasificacion4),
    clasificacion1: getString(mappedRecord.cliente?.clasificacion1),
    clasificacion2: getString(mappedRecord.cliente?.clasificacion2),
    clasificacion3: getString(mappedRecord.cliente?.clasificacion3),
    clasificacion4: getString(mappedRecord.cliente?.clasificacion4),
    ventaId: getNumber(mappedRecord.venta?.id),
    devoId: getString(mappedRecord.devolucion?.id),
    facturaUuid: getString(mappedRecord.venta?.uuid),
    facturaFecha: getString(mappedRecord.venta?.fechaTimbrado),
    facturaGranTotalMxn: getNumber(mappedRecord.montos?.granTotal),
    facturaFechaDeCaptura: getString(mappedRecord.venta?.fechaCotizacion),
    facturaTipoDeCambio: getNumber(mappedRecord.venta?.tipoCambio),
    facturaMoneda: getString(mappedRecord.venta?.moneda),
    facturaUsoCfdi: getString(mappedRecord.venta?.usoCDFI),
    facturaMetodoPago: getString(mappedRecord.venta?.metodoPago),
    facturaFormaDePago: getString(mappedRecord.venta?.formaPago),
    facturaSaldoActual: getNumber(mappedRecord.montos?.pendienteGranTotal),
    observacionesEnCfdi: getString(mappedRecord.venta?.observaciones),
    bodegaId: getNumber(mappedRecord.venta?.bodegaId),
    bodegaNombre: getString(mappedRecord.bodega?.nombre),
    importeSinDescuentoMxn: getNumber(mappedRecord.montos?.sinDescuentoSinIEPS),
    descuentoMontoMxn: getNumber(mappedRecord.montos?.descuento),
    metodoDeAdquisicion: resolveMethodOfAcquisition(mappedRecord),
    ivaMxn: getNumber(mappedRecord.montos?.contraIVA),
    iepsMxn: getNumber(mappedRecord.montos?.contraIEPS),
    ivaRetenidoMxn: getNumber(mappedRecord.montos?.favorIVAretenido),
    isrRetenidoMxn: getNumber(mappedRecord.montos?.favorISRretenido),
    tipoDeConcepto: getString(mappedRecord.item?.tipo),
    costoDirectoUnitarioMxn: getNumber(mappedRecord.unit?.margenCosto),
    articuloSku: getString(mappedRecord.item?.sku),
    articuloMarca: getString(mappedRecord.item?.marca),
    articuloNombre: getString(mappedRecord.item?.nombre),
    articuloNombreCompleto: getString(mappedRecord.item?.nombreDisplay),
    articuloCuentaContable:
      getString(mappedRecord.item?.cuentaContable) ||
      getString(mappedRecord.item?.cuentaContableLegacy),
    categoriadeProducto1: getString(mappedRecord.item?.clasificacion1),
    categoriadeProducto2: getString(mappedRecord.item?.clasificacion2),
    categoriadeProducto3: getString(mappedRecord.item?.clasificacion3),
    categoriadeProducto4: getString(mappedRecord.item?.clasificacion4),
    claveDeProductoOServicio:
      getNumber(mappedRecord.item?.satClavePS) +
      '-' +
      getString(mappedRecord.item?.nombreSATps),
    cantidad: cantidadArticulo,
    unidadDeVenta: getString(mappedRecord.item?.satUnitVenta),
    unidadDeContenido: getString(mappedRecord.item?.satUnitCont),
    contenidoUnitario: getNumber(mappedRecord.item?.contenidoCantidad),
    contenidoSubTotal:
      getNumber(mappedRecord.item?.contenidoCantidad) * cantidadArticulo,
    precioUnitario: getNumber(mappedRecord.unit?.sinDescuentoSinIEPS),
    articuloImporteSinDescuentoMxn: getNumber(
      mappedRecord.sub?.sinDescuentoSinIEPS,
    ),
    articuloDescuentoMontoMxn: getNumber(mappedRecord.sub?.descuento),
    articuloIVAMxn: getNumber(mappedRecord.sub?.contraIVA),
    articuloIEPSMxn: getNumber(mappedRecord.sub?.contraIEPS),
    articuloIVARetenidoMxn: getNumber(mappedRecord.sub?.favorIVAretenido),
    articuloISRretenidoMxn: getNumber(mappedRecord.sub?.favorISRretenido),
  };
}

function applyBaseCalculatedFields(
  record: ReportSalesItemRecord,
  mappedRecord: SalesItemMappedRecord,
): ReportSalesItemRecord {
  const { serie, folio } = extractSerieFolio(
    getString(mappedRecord.venta?.serieFolio),
  );
  const facturaTipoDeCambio = normalizeExchangeRate(record.facturaTipoDeCambio);
  const facturaGranTotalOriginal = Number(
    (record.facturaGranTotalMxn / facturaTipoDeCambio).toFixed(2),
  );
  const pagosTotales =
    getNumber(mappedRecord.montos?.pagadoPagos) +
    getNumber(mappedRecord.montos?.pagadoAnticipos);

  const costoDirectoUnitarioMxn = record.costoDirectoUnitarioMxn || 0;
  const articuloImporteConDescuentoMxn =
    (record.articuloImporteSinDescuentoMxn || 0) -
    (record.articuloDescuentoMontoMxn || 0);
  const costoDirectoSubTotalMxn =
    costoDirectoUnitarioMxn * (record.cantidad || 0);
  const gananciaBrutaMxn =
    articuloImporteConDescuentoMxn - costoDirectoSubTotalMxn;

  return {
    ...record,
    facturaSerie: serie,
    facturaFolio: folio,
    facturaTipoDeCambio,
    facturaGranTotalOriginal,
    pagoGranTotalMxn: pagosTotales,
    facturaEstatus: stateCFDI(
      record.facturaFecha,
      getString(mappedRecord.venta?.fechaCancelacion),
      parseInt(getString(mappedRecord.cliente?.creditoDias), 10) || 0,
      record.facturaSaldoActual,
    ),
    facturaTasaPagada:
      record.facturaSaldoActual === 0
        ? 1
        : pagosTotales / facturaTipoDeCambio / facturaGranTotalOriginal || 0,
    importeConDescuentoMxn:
      record.importeSinDescuentoMxn + record.descuentoMontoMxn,
    costoDirectoSubTotalMxn: costoDirectoSubTotalMxn,
    articuloImporteConDescuentoMxn: articuloImporteConDescuentoMxn,
    gananciaBrutaMxn: gananciaBrutaMxn,
    margenTasa: gananciaBrutaMxn / (articuloImporteConDescuentoMxn || 0),
    costoTasa:
      (costoDirectoUnitarioMxn || 0) / articuloImporteConDescuentoMxn || 0,
  };
}

function buildCancellationRecord(
  source: ReportSalesItemRecord,
  cancelationDate: string,
): ReportSalesItemRecord {
  return {
    ...source,
    facturaEstatus: CANCELED_STATUS,
    facturaFecha: cancelationDate,
    observacionesEnCfdi: `Cancelación relacionada con la factura ${source.facturaSerie}-${source.facturaFolio}`,
    pagoGranTotalMxn: 0,
    facturaTasaPagada: 0,
    facturaSaldoActual: 0,
    facturaGranTotalMxn: negate(source.facturaGranTotalMxn ?? 0),
    facturaGranTotalOriginal: negate(source.facturaGranTotalOriginal ?? 0),
    importeSinDescuentoMxn: negate(source.importeSinDescuentoMxn ?? 0),
    ivaMxn: negate(source.ivaMxn ?? 0),
    iepsMxn: negate(source.iepsMxn ?? 0),
    ivaRetenidoMxn: negate(source.ivaRetenidoMxn ?? 0),
    isrRetenidoMxn: negate(source.isrRetenidoMxn ?? 0),
    importeConDescuentoMxn: negate(source.importeConDescuentoMxn ?? 0),
    costoDirectoSubTotalMxn: negate(source.costoDirectoSubTotalMxn ?? 0),
    gananciaBrutaMxn: negate(source.gananciaBrutaMxn ?? 0),
    margenTasa: negate(source.margenTasa ?? 0),
    costoTasa: negate(source.costoTasa ?? 0),
    contenidoSubTotal: negate(source.contenidoSubTotal ?? 0),
    articuloImporteSinDescuentoMxn: negate(
      source.articuloImporteSinDescuentoMxn ?? 0,
    ),
    articuloImporteConDescuentoMxn: negate(
      source.articuloImporteConDescuentoMxn ?? 0,
    ),
    articuloDescuentoMontoMxn: negate(source.articuloDescuentoMontoMxn ?? 0),
    articuloIVAMxn: negate(source.articuloIVAMxn ?? 0),
    articuloIEPSMxn: negate(source.articuloIEPSMxn ?? 0),
    articuloIVARetenidoMxn: negate(source.articuloIVARetenidoMxn ?? 0),
    articuloISRretenidoMxn: negate(source.articuloISRretenidoMxn ?? 0),
  };
}

function buildReturnRecord(
  source: ReportSalesItemRecord,
  mappedRecord: SalesItemMappedRecord,
): ReportSalesItemRecord {
  const devolucionFecha = getString(mappedRecord.devolucion?.fechaTimbrado);
  const cfdiFolioSerieDevo = getString(mappedRecord.devolucion?.notaSerieFolio);
  const devoItemGranTotal = getNumber(mappedRecord.devolucion?.item?.granTotal);
  const devoGranTotal = getNumber(mappedRecord.devolucion?.granTotal);
  const facturaGranTotalMxnDevo =
    devoItemGranTotal !== 0 ? devoItemGranTotal : devoGranTotal;
  const devolucionCantidad = getNumber(mappedRecord.devolucion?.item?.qty);
  const facturaTipoDeCambio = normalizeExchangeRate(source.facturaTipoDeCambio);
  const costoDirectoUnitarioMxn = source.costoDirectoUnitarioMxn || 0;
  const articuloImporteSinDescuentoMxn = getNumber(
    mappedRecord.sub?.sinDescuentoSinIEPS,
  );
  const articuloDescuentoMontoMxn = getNumber(mappedRecord.sub?.descuento);
  const articuloImporteConDescuentoMxn =
    articuloImporteSinDescuentoMxn - articuloDescuentoMontoMxn;
  const costoDirectoSubTotalMxn = costoDirectoUnitarioMxn * devolucionCantidad;
  const gananciaBrutaMxn =
    articuloImporteConDescuentoMxn - costoDirectoSubTotalMxn;

  return {
    ...source,
    facturaFecha: devolucionFecha,
    facturaUuid: getString(mappedRecord.devolucion?.notaUuid),
    facturaFechaDeCaptura: getString(mappedRecord.devolucion?.fechaCaptura),
    devoId: String(mappedRecord.devolucion?.id),
    facturaSerie: cfdiFolioSerieDevo
      ? cfdiFolioSerieDevo.split('-')[0]
      : source.facturaSerie,
    facturaFolio: cfdiFolioSerieDevo
      ? cfdiFolioSerieDevo.split('-')[1]
      : source.facturaFolio,
    facturaGranTotalMxn: negate(facturaGranTotalMxnDevo),
    importeSinDescuentoMxn: negate(getNumber(mappedRecord.devolucion?.importe)),
    importeConDescuentoMxn: negate(
      Math.abs(getNumber(mappedRecord.devolucion?.importe)),
    ),
    descuentoMontoMxn: 0,
    ivaMxn: negate(getNumber(mappedRecord.devolucion?.contraIVA)),
    iepsMxn: negate(getNumber(mappedRecord.devolucion?.item?.contraIEPS)),
    ivaRetenidoMxn: negate(
      getNumber(mappedRecord.devolucion?.favorIVAretenido),
    ),
    isrRetenidoMxn: negate(
      getNumber(mappedRecord.devolucion?.item?.isrRet) ||
        getNumber(mappedRecord.devolucion?.favorISRretenido),
    ),
    cantidad: devolucionCantidad ? devolucionCantidad : source.cantidad,
    facturaGranTotalOriginal: negate(
      Number((facturaGranTotalMxnDevo / facturaTipoDeCambio).toFixed(2)),
    ),
    facturaUsoCfdi: '04 - Devolución de mercancía',
    facturaMetodoPago: 'PUE - Pago en parcialidades o diferido',
    facturaFormaDePago: '',
    facturaEstatus: RETURN_STATUS,
    facturaTasaPagada: 0,
    observacionesEnCfdi: `Devolución relacionada con la factura ${source.facturaSerie}-${source.facturaFolio}`,
    pagoGranTotalMxn: 0,
    costoDirectoSubTotalMxn: negate(costoDirectoSubTotalMxn),
    gananciaBrutaMxn: negate(gananciaBrutaMxn),
    margenTasa: negate(
      gananciaBrutaMxn / (articuloImporteConDescuentoMxn || 0),
    ),
    costoTasa: negate(
      costoDirectoUnitarioMxn / (articuloImporteConDescuentoMxn || 0),
    ),
    contenidoSubTotal: negate(
      getNumber(mappedRecord.item?.contenidoCantidad) * devolucionCantidad,
    ),
    precioUnitario: negate(getNumber(mappedRecord.unit?.sinDescuentoSinIEPS)),
    articuloImporteSinDescuentoMxn: negate(
      getNumber(mappedRecord.unit?.sinDescuentoSinIEPS) * devolucionCantidad,
    ),
    articuloDescuentoMontoMxn: negate(
      getNumber(mappedRecord.unit?.descuento) * devolucionCantidad,
    ),
    articuloImporteConDescuentoMxn: negate(
      (getNumber(mappedRecord.unit?.sinDescuentoSinIEPS) -
        getNumber(mappedRecord.unit?.descuento)) *
        devolucionCantidad,
    ),
    articuloIVAMxn: negate(getNumber(mappedRecord.devolucion?.item?.contraIVA)),
    articuloIEPSMxn: negate(
      getNumber(mappedRecord.devolucion?.item?.contraIEPS),
    ),
    articuloIVARetenidoMxn: negate(
      getNumber(mappedRecord.devolucion?.item?.ivaRet),
    ),
    articuloISRretenidoMxn: negate(
      getNumber(mappedRecord.devolucion?.item?.isrRet),
    ),
  };
}

export function cleanData(
  rawData: RawRecord[],
  dateRange: DateRange,
): ReportSalesItemRecord[] {
  return rawData.flatMap((record: RawRecord, index: number) => {
    assertSalesItemRecord(record, index);

    const mappedRecord = mapSalesItemRecordWithCleanKeys(record);

    const baseRecord = buildBaseRecord(mappedRecord);
    const cleanedRecord = applyBaseCalculatedFields(baseRecord, mappedRecord);
    const facturaEnRango = safeDateInRange(
      cleanedRecord.facturaFecha,
      dateRange,
    );
    const cancelationDate = getString(mappedRecord.venta?.fechaCancelacion);
    const hasCancelation = safeDateInRange(cancelationDate, dateRange);
    if (hasCancelation) {
      const cancelRecord = buildCancellationRecord(
        cleanedRecord,
        cancelationDate,
      );
      return facturaEnRango ? [cleanedRecord, cancelRecord] : [cancelRecord];
    }

    const returnDate = getString(mappedRecord.devolucion?.fechaTimbrado);
    const hasReturn = safeDateInRange(returnDate, dateRange);
    const devoInvItmId = getNumber(mappedRecord.devolucion?.item?.ventaItmId);

    if (
      mappedRecord.devolucion &&
      Object.keys(mappedRecord.devolucion).length > 0 &&
      devoInvItmId
    ) {
      if (!hasReturn) {
        return facturaEnRango ? [cleanedRecord] : [];
      }

      const returnRecord = buildReturnRecord(cleanedRecord, mappedRecord);
      return facturaEnRango ? [cleanedRecord, returnRecord] : [returnRecord];
    }

    if (!facturaEnRango) {
      return [];
    }

    return [cleanedRecord];
  });
}
