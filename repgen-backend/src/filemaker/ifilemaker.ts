export interface RawRecord {
  fieldData: Record<string, unknown>;
  portalData?: Record<string, unknown> | null;
  recordId: string;
}

export interface GetTokenResponse {
  response: {
    token: string;
  };
}

export interface LogOutResponse {
  message: {
    code: string;
    message: string;
  };
}

export interface FindRecordsResult {
  response: {
    data: RawRecord[];
    dataInfo: {
      database: string;
      layout: string;
      table: string;
      totalRecordCount: number;
      foundCount: number;
      returnedCount: number;
    };
  };
}

export type FileMakerCondition = Record<string, string | number>;

export interface GetRecordResponse {
  response: {
    data: RawRecord[];
  };
}

export interface CreateRecordResponse {
  response: {
    recordId: string;
    modId: string;
  };
}

export interface EditRecordResponse {
  response: {
    modId: string;
  };
}
