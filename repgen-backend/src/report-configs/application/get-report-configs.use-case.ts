import { Injectable } from '@nestjs/common';
import { FileMakerService } from '../../filemaker/filemaker.service';
import { LoggerService } from '../../common/logger/logger.service';
import type { ReportConfigResponse } from '../domain/report-config.types';
import { mapReportConfigRecord } from '../infrastructure/report-config.mapper';
import {
  reportConfigFieldMap as fm,
  REPORT_CONFIG_LAYOUT,
} from '../infrastructure/report-config-field-map';

@Injectable()
export class GetReportConfigsUseCase {
  constructor(
    private readonly fileMakerService: FileMakerService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    dbName: string,
    userId: number,
    reportId: string,
  ): Promise<ReportConfigResponse[]> {
    try {
      const result = await this.fileMakerService.findRecords(
        dbName,
        REPORT_CONFIG_LAYOUT,
        [{ [fm.userId]: userId, [fm.reportId]: reportId }],
        1,
        1000,
      );

      const data = result.response?.data;
      if (!data?.length) {
        return [];
      }

      return data.map((raw) => {
        const {
          userId: _userId,
          fmRecordId,
          ...response
        } = mapReportConfigRecord(raw);
        return response;
      });
    } catch (error) {
      this.logger.error(
        `Error al obtener configuraciones para usuario ${userId}, reporte ${reportId}`,
        error as Error,
        { tenant: dbName },
      );
      return [];
    }
  }
}
