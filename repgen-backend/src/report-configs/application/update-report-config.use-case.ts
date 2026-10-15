import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FileMakerService } from '../../filemaker/filemaker.service';
import { LoggerService } from '../../common/logger/logger.service';
import type {
  ColumnStateEntry,
  PeriodoVista,
  ReportConfigResponse,
} from '../domain/report-config.types';
import {
  mapReportConfigRecord,
  serializeContenidoVista,
} from '../infrastructure/report-config.mapper';
import {
  reportConfigFieldMap as fm,
  REPORT_CONFIG_LAYOUT,
} from '../infrastructure/report-config-field-map';

@Injectable()
export class UpdateReportConfigUseCase {
  constructor(
    private readonly fileMakerService: FileMakerService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    dbName: string,
    userId: number,
    configId: string,
    patch: {
      name?: string;
      columnState?: ColumnStateEntry[];
      filterModel?: Record<string, unknown> | null;
      periodo?: PeriodoVista | null;
      isDefault?: boolean;
    },
  ): Promise<ReportConfigResponse> {
    const { raw, record } = await this.findOwnedRecord(
      dbName,
      userId,
      configId,
    );

    if (patch.isDefault === true) {
      await this.clearExistingDefault(
        dbName,
        userId,
        record.reportId,
        raw.recordId,
      );
    }

    const fieldData: Record<string, unknown> = {};
    if (patch.name !== undefined) fieldData[fm.name] = patch.name;
    // El campo guarda columnas + filtros + periodo juntos: un PATCH parcial se
    // combina con lo guardado para no borrar lo que no viene en la petición.
    if (
      patch.columnState !== undefined ||
      patch.filterModel !== undefined ||
      patch.periodo !== undefined
    ) {
      fieldData[fm.columnState] = serializeContenidoVista({
        columnState: patch.columnState ?? record.columnState,
        filterModel:
          patch.filterModel !== undefined
            ? patch.filterModel
            : (record.filterModel ?? null),
        periodo:
          patch.periodo !== undefined
            ? patch.periodo
            : (record.periodo ?? null),
      });
    }
    if (patch.isDefault !== undefined)
      fieldData[fm.isDefault] = patch.isDefault ? 1 : 0;

    await this.fileMakerService.editRecord(
      dbName,
      REPORT_CONFIG_LAYOUT,
      raw.recordId,
      fieldData,
    );

    const updated = await this.fileMakerService.findRecords(
      dbName,
      REPORT_CONFIG_LAYOUT,
      [{ [fm.id]: configId, [fm.userId]: userId }],
      1,
      1,
    );

    const updatedRaw = updated.response?.data?.[0];
    if (!updatedRaw)
      throw new NotFoundException(
        'Configuración no encontrada tras actualizar',
      );

    const {
      userId: _userId,
      fmRecordId,
      ...response
    } = mapReportConfigRecord(updatedRaw);
    return response;
  }

  private async findOwnedRecord(
    dbName: string,
    userId: number,
    configId: string,
  ) {
    const result = await this.fileMakerService.findRecords(
      dbName,
      REPORT_CONFIG_LAYOUT,
      [{ [fm.id]: configId }],
      1,
      1,
    );

    const raw = result.response?.data?.[0];
    if (!raw) throw new NotFoundException('Configuración no encontrada');

    const record = mapReportConfigRecord(raw);
    if (record.userId !== userId)
      throw new ForbiddenException(
        'No tienes permiso para modificar esta configuración',
      );

    return { raw, record };
  }

  private async clearExistingDefault(
    dbName: string,
    userId: number,
    reportId: string,
    excludeRecordId: string,
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
        data
          .filter((r) => r.recordId !== excludeRecordId)
          .map((r) =>
            this.fileMakerService.editRecord(
              dbName,
              REPORT_CONFIG_LAYOUT,
              r.recordId,
              {
                [fm.isDefault]: 0,
              },
            ),
          ),
      );
    } catch {
      // No hay default anterior — es normal
    }
  }
}
