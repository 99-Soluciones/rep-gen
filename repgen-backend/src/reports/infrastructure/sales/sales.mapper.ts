import { BadRequestException } from '@nestjs/common';
import Ajv2020 from 'ajv/dist/2020';

import { RawRecord } from '../../../filemaker/ifilemaker';
import type { ReportSalesRecord, SalesMappedRecord } from '../../domain/sales';

import { TypeGetters } from '../../../common/utils';

import schema from './sales-report.schema.json';
import { mapSalesRecordWithCleanKeys } from './sales-field-map.helper';
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
const validateSalesRecord = ajv.compile(schema);

const BASE_SALES_DEFAULTS: ReportSalesRecord = {
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
};

function assertSalesRecord(record: RawRecord, index: number): void {
  if (validateSalesRecord(record)) {
    return;
  }
  const details = ajv.errorsText(validateSalesRecord.errors, {
    separator: '; ',
    dataVar: `rawData[${index}]`,
  });

  throw new BadRequestException(`Sales record invalido: ${details}`);
}

function buildBaseRecord(mappedRecord: SalesMappedRecord): ReportSalesRecord {
  return {
    ...BASE_SALES_DEFAULTS,
    clienteCalle: getString(mappedRecord.direccionEntrega),
    clienteColonia: getString(mappedRecord.coloniaEntrega),
    clienteDelegacion: getString(mappedRecord.delegacionEntrega),
    clienteCiudad: getString(mappedRecord.ciudadEntrega),
    clienteEstado: getString(mappedRecord.estadoEntrega),
    facturaUuid: getString(mappedRecord.uuidCfdi),
    facturaFechaDeCaptura: getString(mappedRecord.fechaVenta),
    facturaMoneda: getString(mappedRecord.idMoneda),
    facturaUsoCfdi: getString(mappedRecord.idUsoCfdi),
    facturaMetodoPago: getString(mappedRecord.idMetodoPagoCfdi),
    facturaFormaDePago: getString(mappedRecord.idFormaPagoCfdi),
    observacionesEnCfdi: getString(mappedRecord.observacionesCfdi).slice(0, -1),
    bodegaNombre: getString(mappedRecord.nombreBodega),
    ventaId: getNumber(mappedRecord.idVenta),
    facturaGranTotalMxn: getNumber(mappedRecord.montoGranTotal),
    facturaTipoDeCambio: getNumber(mappedRecord.tipoCambio),
    facturaSaldoActual: getNumber(mappedRecord.saldoPendienteGranTotal),
    importeSinDescuentoMxn: getNumber(
      mappedRecord.montoImporteSinDescuentoSinIeps,
    ),
    ivaMxn: getNumber(mappedRecord.montoContraIva),
    iepsMxn: getNumber(mappedRecord.montoContraIeps),
    ivaRetenidoMxn: getNumber(mappedRecord.montoFavorIvaRetenido),
    isrRetenidoMxn: getNumber(mappedRecord.montoFavorIsrRetenido),
    bodegaId: getNumber(mappedRecord.idBodega),
    cliente: getString(mappedRecord.cliente?.nombreComercial),
    clienteRazonSocial: getString(mappedRecord.cliente?.razonSocial),
    clienteRfc: getString(mappedRecord.cliente?.rfc),
    clienteCuentaContable: getString(mappedRecord.cliente?.cuentaContable),
    clienteRepDeVenta: getString(mappedRecord.cliente?.representanteVentas),
    clienteRepDeCobranza: getString(
      mappedRecord.cliente?.representanteCobranza,
    ),
    nombreClasificacion1: getString(mappedRecord.cliente?.clasificacion1),
    nombreClasificacion2: getString(mappedRecord.cliente?.clasificacion2),
    nombreClasificacion3: getString(mappedRecord.cliente?.clasificacion3),
    nombreClasificacion4: getString(mappedRecord.cliente?.clasificacion4),
    clasificacion1: getString(mappedRecord.cliente?.categoria1),
    clasificacion2: getString(mappedRecord.cliente?.categoria2),
    clasificacion3: getString(mappedRecord.cliente?.categoria3),
    clasificacion4: getString(mappedRecord.cliente?.categoria4),
    clienteId: getNumber(mappedRecord.cliente?.idCliente),
  };
}

function applyBaseCalculatedFields(
  record: ReportSalesRecord,
  mappedRecord: SalesMappedRecord,
): ReportSalesRecord {
  const { serie, folio } = extractSerieFolio(
    getString(mappedRecord.serieFolioCfdi),
  );
  const facturaTipoDeCambio = normalizeExchangeRate(record.facturaTipoDeCambio);
  const facturaGranTotalOriginal = Number(
    (record.facturaGranTotalMxn / facturaTipoDeCambio).toFixed(2),
  );

  const montoAnticipo = getNumber(mappedRecord.saldoPagadoEnAnticipos);
  const montoPago = getNumber(mappedRecord.saldoPagadoEnPagos);
  const pagosTotales = montoAnticipo + montoPago;

  const facturaSaldoActual = record.facturaSaldoActual ?? 0;

  const facturaEstatus = stateCFDI(
    getString(mappedRecord.fechaTimbradoFactura),
    getString(mappedRecord.fechaCancelacionCfdi),
    getNumber(mappedRecord.cliente?.diasCreditoAutorizado),
    pagosTotales,
  );

  return {
    ...record,
    facturaSerie: serie,
    facturaFolio: folio,
    facturaFecha: getString(mappedRecord.fechaTimbradoFactura),
    facturaTipoDeCambio,
    facturaGranTotalOriginal,
    pagoGranTotalMxn: pagosTotales,
    facturaEstatus,
    facturaTasaPagada:
      facturaSaldoActual === 0
        ? 1
        : facturaGranTotalOriginal > 0 && pagosTotales > 0
          ? Number(
              (
                pagosTotales /
                facturaTipoDeCambio /
                facturaGranTotalOriginal
              ).toFixed(4),
            )
          : 0,
  };
}

function buildCancellationRecord(
  source: ReportSalesRecord,
  cancelationDate: string,
): ReportSalesRecord {
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
  };
}

function buildReturnRecord(
  source: ReportSalesRecord,
  mappedRecord: SalesMappedRecord,
): ReportSalesRecord {
  const devolucionFecha = getString(mappedRecord.devolucion?.fechaTimbreCfdi);
  const cfdiFolioSerieDevo = getString(
    mappedRecord.devolucion?.serieFolioNotaCreditoCargo,
  );
  const facturaTipoDeCambio = normalizeExchangeRate(source.facturaTipoDeCambio);
  const devoMontoGranTotalRaw = getNumber(
    mappedRecord.devolucion?.montoGranTotal,
  );

  // FileMaker data sometimes uses slightly different rounded original values
  const facturaGranTotalMxnDevo = Number(
    Number(negate(devoMontoGranTotalRaw)).toFixed(2),
  );

  return {
    ...source,
    facturaFecha: devolucionFecha,
    facturaUuid: getString(mappedRecord.devolucion?.uuidNotaCredito),
    facturaFechaDeCaptura: getString(mappedRecord.devolucion?.fechaCaptura),
    devoId: String(mappedRecord.devolucion?.idDevolucion),
    facturaSerie: cfdiFolioSerieDevo
      ? cfdiFolioSerieDevo.split('-')[0]
      : source.facturaSerie,
    facturaFolio: cfdiFolioSerieDevo
      ? cfdiFolioSerieDevo.split('-')[1]
      : source.facturaFolio,
    facturaGranTotalMxn: facturaGranTotalMxnDevo,
    importeSinDescuentoMxn: negate(
      getNumber(mappedRecord.devolucion?.montoImporte),
    ),
    importeConDescuentoMxn: negate(
      getNumber(mappedRecord.devolucion?.montoImporte),
    ),
    ivaMxn: negate(getNumber(mappedRecord.devolucion?.montoContraIva)),
    iepsMxn: negate(getNumber(mappedRecord.devolucion?.montoContraIeps)),
    ivaRetenidoMxn: negate(
      getNumber(mappedRecord.devolucion?.montoFavorIvaRetenido),
    ),
    isrRetenidoMxn: negate(
      getNumber(mappedRecord.devolucion?.montoFavorIsrRetenido),
    ),
    facturaGranTotalOriginal: negate(
      Math.abs(
        Number((facturaGranTotalMxnDevo / facturaTipoDeCambio).toFixed(2)),
      ),
    ),
    facturaUsoCfdi: '04 - Devolución de mercancía',
    facturaMetodoPago: 'PUE - Pago en parcialidades o diferido',
    facturaFormaDePago: '',
    facturaEstatus: RETURN_STATUS,
    facturaTasaPagada: 0,
    observacionesEnCfdi: `Devolución relacionada con la factura ${source.facturaSerie}-${source.facturaFolio}`,
    pagoGranTotalMxn: 0,
  };
}

export function cleanData(
  rawData: RawRecord[],
  dateRange: DateRange,
): ReportSalesRecord[] {
  return rawData.flatMap((record: RawRecord, index: number) => {
    assertSalesRecord(record, index);

    const mappedRecord = mapSalesRecordWithCleanKeys(record);

    const baseRecord = buildBaseRecord(mappedRecord);
    const cleanedRecord = applyBaseCalculatedFields(baseRecord, mappedRecord);
    const facturaEnRango = safeDateInRange(
      cleanedRecord.facturaFecha,
      dateRange,
    );

    const fechaCancelacion = getString(mappedRecord.fechaCancelacionCfdi);
    const hasCancelation = safeDateInRange(fechaCancelacion, dateRange);
    if (
      hasCancelation &&
      mappedRecord.cliente &&
      Object.keys(mappedRecord.cliente).length > 0
    ) {
      const cancelRecord = buildCancellationRecord(
        cleanedRecord,
        fechaCancelacion,
      );
      return facturaEnRango ? [cleanedRecord, cancelRecord] : [cancelRecord];
    }

    const returnDate = getString(mappedRecord.devolucion?.fechaTimbreCfdi);
    const hasReturn = safeDateInRange(returnDate, dateRange);
    if (
      mappedRecord.devolucion &&
      Object.keys(mappedRecord.devolucion).length > 0
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
