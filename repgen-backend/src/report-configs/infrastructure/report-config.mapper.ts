import { BadRequestException } from '@nestjs/common';
import type { RawRecord } from '../../filemaker/ifilemaker';
import type {
  ReportConfigRecord,
  ColumnStateEntry,
  PeriodoVista,
} from '../domain/report-config.types';
import { PERIODOS_VISTA } from '../domain/report-config.types';
import { reportConfigFieldMap as fm } from './report-config-field-map';

/** Contenido de una vista guardado en el campo de texto columnState de FileMaker. */
export interface ContenidoVista {
  columnState: ColumnStateEntry[];
  filterModel: Record<string, unknown> | null;
  periodo: PeriodoVista | null;
}

const MAX_FILTER_MODEL_BYTES = 16 * 1024;

/**
 * Lee el campo de texto. Formato viejo: un array (solo columnas). Formato
 * actual: { v: 2, columns, filters, periodo }. Así las vistas existentes
 * siguen abriendo sin cambiar el esquema de FileMaker.
 */
export function parseContenidoVista(rawJson: unknown): ContenidoVista {
  const vacio: ContenidoVista = {
    columnState: [],
    filterModel: null,
    periodo: null,
  };
  if (typeof rawJson !== 'string' || !rawJson) return vacio;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return vacio;
  }

  if (Array.isArray(parsed)) {
    return { ...vacio, columnState: parsed as ColumnStateEntry[] };
  }
  if (!parsed || typeof parsed !== 'object') return vacio;

  const obj = parsed as Record<string, unknown>;
  const filtros = obj.filters;
  const periodo = obj.periodo;
  return {
    columnState: Array.isArray(obj.columns)
      ? (obj.columns as ColumnStateEntry[])
      : [],
    filterModel:
      filtros && typeof filtros === 'object' && !Array.isArray(filtros)
        ? (filtros as Record<string, unknown>)
        : null,
    periodo: (PERIODOS_VISTA as readonly unknown[]).includes(periodo)
      ? (periodo as PeriodoVista)
      : null,
  };
}

export function serializeContenidoVista(contenido: ContenidoVista): string {
  const filtros =
    contenido.filterModel && Object.keys(contenido.filterModel).length > 0
      ? contenido.filterModel
      : null;
  if (filtros && JSON.stringify(filtros).length > MAX_FILTER_MODEL_BYTES) {
    throw new BadRequestException(
      'Los filtros de la vista son demasiado grandes',
    );
  }
  return JSON.stringify({
    v: 2,
    columns: contenido.columnState,
    filters: filtros,
    periodo: contenido.periodo,
  });
}

export function mapReportConfigRecord(raw: RawRecord): ReportConfigRecord {
  const f = raw.fieldData;
  const { columnState, filterModel, periodo } = parseContenidoVista(
    f[fm.columnState],
  );

  return {
    fmRecordId: raw.recordId,
    id: String(f[fm.id]),
    userId: Number(f[fm.userId]),
    reportId: String(f[fm.reportId]),
    name: String(f[fm.name]),
    columnState,
    filterModel,
    periodo,
    isDefault: Number(f[fm.isDefault]) === 1,
    createdAt: String(f[fm.createdAt]),
    updatedAt: String(f[fm.updatedAt]),
  };
}
