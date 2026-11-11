import { RawRecord } from '../../../filemaker/ifilemaker';
import { salesFieldMapJson } from './sales-field-map';
import { FieldMapHelper, PortalSourceByKey } from '../shared';
import { SalesMappedRecord } from '../../domain/sales';

const fieldMapHelper = new FieldMapHelper(salesFieldMapJson);

const SALES_PORTAL_SOURCE_BY_KEY = {
  cliente: 'Cliente',
  devolucion: 'Devo',
} as const satisfies PortalSourceByKey;

/**
 * Convierte un registro raw de ventas (fieldData + portalData) a llaves limpias
 * definidas en salesFieldMap.json.
 * @param record Registro raw de FileMaker.
 * @returns Registro normalizado con keys limpias.
 * @example
 * const clean = mapSalesRecordWithCleanKeys(record);
 * // clean.cliente?.rfc
 */
export function mapSalesRecordWithCleanKeys(
  record: RawRecord,
): SalesMappedRecord {
  return fieldMapHelper.mapRecordWithPortalConfig<SalesMappedRecord>(
    record,
    SALES_PORTAL_SOURCE_BY_KEY,
  );
}
