import { ConflictException } from '@nestjs/common';
import type { FileMakerService } from '../../filemaker/filemaker.service';
import {
  reportConfigFieldMap as fm,
  REPORT_CONFIG_LAYOUT,
} from '../infrastructure/report-config-field-map';

/** Igual que problemaNombreVista del frontend (vista.ts): mayúsculas y espacios de más no cuentan. */
export const claveNombreVista = (nombre: string): string =>
  nombre.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');

/**
 * Dos vistas con el mismo nombre no se distinguen en el selector. El frontend
 * ya lo impide con las vistas que tiene cargadas; esto cubre otra pestaña que
 * guardó mientras tanto. `propiaId` es la vista que se renombra.
 * ponytail: consulta y después escribe, sin bloqueo: dos guardados en el mismo
 * instante todavía pueden colarse. Un campo único en FileMaker lo cerraría.
 */
export const asegurarNombreLibre = async (
  fileMakerService: FileMakerService,
  dbName: string,
  userId: number,
  reportId: string,
  nombre: string,
  propiaId: string | null = null,
): Promise<void> => {
  const result = await fileMakerService.findRecords(
    dbName,
    REPORT_CONFIG_LAYOUT,
    [{ [fm.userId]: userId, [fm.reportId]: reportId }],
    1,
    1000,
  );
  // FileMaker devuelve texto o número; cualquier otra cosa no es un nombre.
  const texto = (valor: unknown) =>
    typeof valor === 'string' || typeof valor === 'number' ? String(valor) : '';
  const buscado = claveNombreVista(nombre);
  const repetido = (result.response?.data ?? []).some(
    ({ fieldData }) =>
      texto(fieldData[fm.id]) !== propiaId &&
      claveNombreVista(texto(fieldData[fm.name])) === buscado,
  );
  if (repetido) throw new ConflictException('Ya hay una vista con ese nombre.');
};
