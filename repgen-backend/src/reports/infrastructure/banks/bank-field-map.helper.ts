import { RawRecord } from '../../../filemaker/ifilemaker';
import type { BankMappedRecord } from '../../domain/banks';
import { bankFieldMapJson } from './bank-field-map';
import { FieldMapHelper, PortalSourceByKey } from '../shared';

const fieldMapHelper = new FieldMapHelper(bankFieldMapJson);

const BANK_PORTAL_SOURCE_BY_KEY = {
  banco: 'Banco',
  ingreso: 'contIngreso',
  egreso: 'contEgreso',
  cliente: {
    ingreso: 'clienteIngreso',
    egreso: 'clienteEgreso',
  },
  proveedor: {
    ingreso: 'proveedorIngreso',
    egreso: 'proveedorEgreso',
  },
} as const satisfies PortalSourceByKey;

/**
 * Convierte un registro raw de bancos (fieldData + portalData) a llaves limpias
 * definidas en bankFieldMap.json.
 * @param record Registro raw de FileMaker.
 * @returns Registro con keys limpias.
 * @example
 * const clean = mapBankRecordWithCleanKeys(record);
 * // clean.banco?.nombre
 */
export function mapBankRecordWithCleanKeys(
  record: RawRecord,
): BankMappedRecord {
  return fieldMapHelper.mapRecordWithPortalConfig<BankMappedRecord>(
    record,
    BANK_PORTAL_SOURCE_BY_KEY,
  );
}

/**
 * Mapea una lista de registros raw de bancos a llaves limpias.
 * @param records Lista de registros raw.
 * @returns Lista mapeada.
 * @example
 * const rows = mapBankRecordsWithCleanKeys(rawRows);
 */
export function mapBankRecordsWithCleanKeys(
  records: RawRecord[],
): BankMappedRecord[] {
  return records.map(mapBankRecordWithCleanKeys);
}

/**
 * Resuelve una ruta limpia (ej. banco.nombre) a su campo raw.
 * @param cleanPath Ruta de key limpia.
 * @returns Nombre raw del campo o null.
 * @example
 * getBankRawFieldName('banco.nombre')
 * // 'contBanco.ITM|contBANCO_|_x_bancoID::datos_nombre'
 */
export function getBankRawFieldName(cleanPath: string): string | null {
  return fieldMapHelper.getRawFieldName(cleanPath);
}
