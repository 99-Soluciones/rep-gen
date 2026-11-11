import { InternalServerErrorException } from '@nestjs/common';
import type { FileMakerService } from '../../../filemaker/filemaker.service';
import type {
  FileMakerCondition,
  RawRecord,
} from '../../../filemaker/ifilemaker';
import type { ReportLogger } from './base-report.service';

// Se trae todo de una vez: el filtrado es del lado del cliente.
const FM_FIND_LIMIT = 999999;

/**
 * Find de un reporte: todos los registros que cumplen `query`, por la sesión
 * 'reportes'. Avisa en el log si FileMaker encontró más de los que devolvió.
 * @param portalLimits Renglones máximos por portal (la Data API da 50 si no se indica).
 */
export async function findAllRecords(
  fileMakerService: FileMakerService,
  logger: Pick<ReportLogger, 'warn'>,
  dbName: string,
  layout: string,
  query: FileMakerCondition[],
  portalLimits: Record<string, number> = {},
): Promise<RawRecord[]> {
  const res = await fileMakerService.findRecords(
    dbName,
    layout,
    query,
    1,
    FM_FIND_LIMIT,
    'reportes',
    portalLimits,
  );
  const data = res.response.data ?? [];
  const foundCount = res.response.dataInfo?.foundCount ?? 0;
  if (foundCount > data.length) {
    logger.warn(
      'Reporte truncado: FileMaker encontró más registros de los devueltos',
      { tenant: dbName, layout, foundCount, returned: data.length },
    );
  }
  return data;
}

/**
 * Un registro que no cumple el esquema es un problema de datos del servidor,
 * no del cliente: se registra y se responde 500 en vez de devolver un reporte
 * incompleto (faltarían filas en los totales).
 */
export function cleanOrThrow<T>(
  logger: Pick<ReportLogger, 'error'>,
  context: Record<string, string>,
  clean: () => T,
): T {
  try {
    return clean();
  } catch (error) {
    logger.error(
      'Registro de FileMaker con formato inesperado',
      error,
      context,
    );
    throw new InternalServerErrorException(
      'Los datos de FileMaker tienen un formato inesperado',
    );
  }
}
