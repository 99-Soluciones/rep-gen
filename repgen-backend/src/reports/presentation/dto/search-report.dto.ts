import {
  IsBoolean,
  IsDefined,
  IsISO8601,
  IsOptional,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { DateRange } from '../../application';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class DateRangeDto implements DateRange {
  @Matches(ISO_DATE, { message: 'startDate debe tener formato YYYY-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'startDate no es una fecha válida' })
  startDate!: string;

  @Matches(ISO_DATE, { message: 'endDate debe tener formato YYYY-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'endDate no es una fecha válida' })
  endDate!: string;
}

/**
 * Body de POST /reports/{reporte}/buscar. Solo viaja el rango de fechas: el
 * filtrado, el orden y la paginación se hacen en el cliente (AG Grid).
 */
export class SearchReportDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange!: DateRangeDto;

  /** "Actualizar datos": ignora la caché del reporte. */
  @IsOptional()
  @IsBoolean()
  refresh?: boolean;
}

/**
 * Body de POST /reports/cuentas-por-cobrar/buscar: un día de corte. Si falta,
 * el corte es hoy (México).
 */
export class SearchCorteDto {
  @IsOptional()
  @Matches(ISO_DATE, { message: 'fechaCorte debe tener formato YYYY-MM-DD' })
  fechaCorte?: string;

  @IsOptional()
  @IsBoolean()
  refresh?: boolean;
}
