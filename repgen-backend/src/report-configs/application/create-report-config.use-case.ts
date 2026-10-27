import { Injectable } from '@nestjs/common';
import { FileMakerService } from '../../filemaker/filemaker.service';
import { LoggerService } from '../../common/logger/logger.service';
import type { ReportConfigResponse } from '../domain/report-config.types';
import {
  mapReportConfigRecord,
  serializeContenidoVista,
  type ContenidoVista,
} from '../infrastructure/report-config.mapper';
import {
  reportConfigFieldMap as fm,
  REPORT_CONFIG_LAYOUT,
} from '../infrastructure/report-config-field-map';
import { asegurarNombreLibre } from './nombre-vista';

@Injectable()
export class CreateReportConfigUseCase {
  constructor(
    private readonly fileMakerService: FileMakerService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    dbName: string,
    userId: number,
    reportId: string,
    name: string,
    contenido: ContenidoVista,
    isDefault: boolean,
  ): Promise<ReportConfigResponse> {
    // Valida antes de tocar FileMaker (lanza 400 si los filtros son enormes).
    const contenidoSerializado = serializeContenidoVista(contenido);
    await asegurarNombreLibre(
      this.fileMakerService,
      dbName,
      userId,
      reportId,
      name,
    );

    if (isDefault) {
      await this.clearExistingDefault(dbName, userId, reportId);
    }

    const fieldData: Record<string, unknown> = {
      [fm.userId]: userId,
      [fm.reportId]: reportId,
      [fm.name]: name,
      [fm.columnState]: contenidoSerializado,
      [fm.isDefault]: isDefault ? 1 : 0,
    };

    const created = await this.fileMakerService.createRecord(
      dbName,
      REPORT_CONFIG_LAYOUT,
      fieldData,
    );

    if (!created.response?.recordId) {
      this.logger.error(
        `No se pudo crear el registro en FileMaker`,
        undefined,
        { tenant: dbName },
      );
      throw new Error('Error al crear la configuración');
    }

    const recordId = created.response.recordId;

    // Usa el FM internal recordId para obtener el registro recién creado
    const getResult = await this.fileMakerService.getRecord(
      dbName,
      REPORT_CONFIG_LAYOUT,
      recordId,
    );

    const raw = getResult.response?.data?.[0];
    if (!raw) {
      this.logger.error(
        `No se pudo recuperar el registro recién creado (recordId: ${created.response.recordId})`,
        undefined,
        { tenant: dbName },
      );
      throw new Error('Error al recuperar la configuración creada');
    }

    const {
      userId: _userId,
      fmRecordId,
      ...response
    } = mapReportConfigRecord(raw);
    return response;
  }

  private async clearExistingDefault(
    dbName: string,
    userId: number,
    reportId: string,
  ): Promise<void> {
    try {
      const result = await this.fileMakerService.findRecords(
        dbName,
        REPORT_CONFIG_LAYOUT,
        [{ [fm.userId]: userId, [fm.reportId]: reportId, [fm.isDefault]: 1 }],
        1,
        100,
      );

      const data = result.response?.data;
      if (!data?.length) return;

      await Promise.all(
        data.map((raw) =>
          this.fileMakerService.editRecord(
            dbName,
            REPORT_CONFIG_LAYOUT,
            raw.recordId,
            { [fm.isDefault]: 0 },
          ),
        ),
      );
    } catch {
      // No hay default actual — es normal
    }
  }
}
