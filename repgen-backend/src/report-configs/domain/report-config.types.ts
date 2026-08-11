import type { ReportConfigResponse } from '@repgen/shared-types';

export type {
  ColumnStateEntry,
  ReportConfigResponse,
} from '@repgen/shared-types';

export interface ReportConfigRecord extends ReportConfigResponse {
  fmRecordId: string;
  userId: number;
}
