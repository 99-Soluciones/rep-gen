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
