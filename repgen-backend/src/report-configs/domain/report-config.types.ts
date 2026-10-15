import type { ReportConfigResponse } from '@repgen/shared-types';

export type {
  ColumnStateEntry,
  PeriodoVista,
  ReportConfigResponse,
} from '@repgen/shared-types';

export const PERIODOS_VISTA = [
  'mes_actual',
  'mes_anterior',
  'anio_en_curso',
] as const;

export interface ReportConfigRecord extends ReportConfigResponse {
  fmRecordId: string;
  userId: number;
}
