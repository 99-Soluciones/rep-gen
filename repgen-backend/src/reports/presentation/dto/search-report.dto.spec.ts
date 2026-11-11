import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SearchReportDto } from './search-report.dto';

const esValido = (startDate: string, endDate: string) =>
  validateSync(
    plainToInstance(SearchReportDto, { dateRange: { startDate, endDate } }),
  ).length === 0;

describe('SearchReportDto', () => {
  it('acepta fechas reales y rechaza las que no existen o traen hora', () => {
    expect(esValido('2024-02-29', '2024-03-31')).toBe(true);
    expect(esValido('2024-02-31', '2024-03-31')).toBe(false);
    expect(esValido('2024-01-01', '2024-13-01')).toBe(false);
    expect(esValido('2024-01-01T00:00:00', '2024-03-31')).toBe(false);
  });
});
