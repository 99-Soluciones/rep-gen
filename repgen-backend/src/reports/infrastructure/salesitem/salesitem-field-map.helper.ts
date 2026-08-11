import { RawRecord } from '../../../filemaker/ifilemaker';
import type { SalesItemMappedRecord } from '../../domain/salesitem';
import { salesitemFieldMapJson } from './salesitem-field-map';
import {
  FieldMapHelper,
  PortalSourceByKey,
} from '../shared/reports-mapping-helpers';

const fieldMapHelper = new FieldMapHelper(salesitemFieldMapJson);

// Define aqui que keys del map viven en portalData y en que portal buscar.
const SalesItem_PORTAL_SOURCE_BY_KEY = {
  // ejemplo: cliente: 'Cliente',
} as const satisfies PortalSourceByKey;

/**
 * Convierte un registro raw (fieldData + portalData) a llaves limpias
 * definidas en salesitem-field-map.ts.
 * @param record Registro raw de FileMaker.
 * @returns Registro normalizado con keys limpias.
 * @example
 * const clean = mapSalesItemRecordWithCleanKeys(record);
 * // clean.valor1
 */
export function mapSalesItemRecordWithCleanKeys(
  record: RawRecord,
): SalesItemMappedRecord {
  return fieldMapHelper.mapRecordWithPortalConfig<SalesItemMappedRecord>(
    record,
    SalesItem_PORTAL_SOURCE_BY_KEY,
  );
}

/**
 * Convierte multiples registros raw a llaves limpias.
 * @param records Lista de registros raw.
 * @returns Lista mapeada con keys limpias.
 * @example
 * const list = mapSalesItemRecordsWithCleanKeys(rawRecords);
 */
export function mapSalesItemRecordsWithCleanKeys(
  records: RawRecord[],
): SalesItemMappedRecord[] {
  return records.map(mapSalesItemRecordWithCleanKeys);
}

/**
 * Resuelve ruta limpia a campo raw.
 * @param cleanPath Ruta de key limpia (ej. valor1).
 * @returns Nombre de campo raw o null.
 */
export function getSalesItemRawFieldName(cleanPath: string): string | null {
  return fieldMapHelper.getRawFieldName(cleanPath);
}
