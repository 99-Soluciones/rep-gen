import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  PERIODOS_VISTA,
  type PeriodoVista,
} from '../../domain/report-config.types';

export class CreateReportConfigDto {
  @IsString()
  reportId!: string;

  // Mismo límite que el input del frontend (MAX_NOMBRE_VISTA): un nombre más largo no se lee en el selector.
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @IsArray()
  columnState!: object[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;

  /** Modelo de filtros de AG Grid; null lo borra. */
  @IsObject()
  @IsOptional()
  filterModel?: Record<string, unknown> | null;

  /** Periodo relativo; null = la vista no toca las fechas. */
  @IsIn(PERIODOS_VISTA)
  @IsOptional()
  periodo?: PeriodoVista | null;
}
