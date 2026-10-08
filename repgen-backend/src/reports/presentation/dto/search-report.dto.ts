import { IsDefined, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { DateRange } from '../../application';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class DateRangeDto implements DateRange {
  @Matches(ISO_DATE, { message: 'startDate debe tener formato YYYY-MM-DD' })
  startDate!: string;

  @Matches(ISO_DATE, { message: 'endDate debe tener formato YYYY-MM-DD' })
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
}
