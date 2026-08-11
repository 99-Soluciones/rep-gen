import type { RawRecord } from '../../filemaker/ifilemaker';
import type {
  ReportConfigRecord,
  ColumnStateEntry,
} from '../domain/report-config.types';
import { reportConfigFieldMap as fm } from './report-config-field-map';

export function mapReportConfigRecord(raw: RawRecord): ReportConfigRecord {
  const f = raw.fieldData;

  let columnState: ColumnStateEntry[] = [];
  const rawJson = f[fm.columnState];
  if (typeof rawJson === 'string' && rawJson) {
    try {
      columnState = JSON.parse(rawJson) as ColumnStateEntry[];
    } catch {
      columnState = [];
    }
  }

  return {
    fmRecordId: raw.recordId,
    id: String(f[fm.id]),
    userId: Number(f[fm.userId]),
    reportId: String(f[fm.reportId]),
    name: String(f[fm.name]),
    columnState,
    isDefault: Number(f[fm.isDefault]) === 1,
    createdAt: String(f[fm.createdAt]),
    updatedAt: String(f[fm.updatedAt]),
  };
}
