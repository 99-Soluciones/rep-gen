import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileMakerService } from '../../filemaker/filemaker.service';
import { LoggerService } from '../../common/logger/logger.service';
import { mapReportConfigRecord } from '../infrastructure/report-config.mapper';
import {
  reportConfigFieldMap as fm,
  REPORT_CONFIG_LAYOUT,
} from '../infrastructure/report-config-field-map';

@Injectable()
export class DeleteReportConfigUseCase {
  constructor(
    private readonly fileMakerService: FileMakerService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    dbName: string,
    userId: number,
    configId: string,
  ): Promise<void> {
    const result = await this.fileMakerService.findRecords(
      dbName,
      REPORT_CONFIG_LAYOUT,
      [{ [fm.id]: configId }],
      1,
      1,
    );

    const raw = result.response?.data?.[0];
    if (!raw) {
      throw new NotFoundException('Configuración no encontrada');
    }

    const record = mapReportConfigRecord(raw);
    if (record.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta configuración',
      );
    }

    await this.fileMakerService.deleteRecord(
      dbName,
      REPORT_CONFIG_LAYOUT,
      raw.recordId,
    );
    this.logger.log(
      `Config ${configId} eliminada por usuario ${userId} en ${dbName}`,
    );
  }
}
