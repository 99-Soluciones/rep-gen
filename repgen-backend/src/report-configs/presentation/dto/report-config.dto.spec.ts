import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateReportConfigDto } from './create-report-config.dto';
import { UpdateReportConfigDto } from './update-report-config.dto';

const erroresNombre = (
  Dto: typeof CreateReportConfigDto | typeof UpdateReportConfigDto,
  name: unknown,
) =>
  validateSync(
    plainToInstance(Dto, { reportId: 'bancos', columnState: [], name }),
  )
    .filter((e) => e.property === 'name')
    .flatMap((e) => Object.keys(e.constraints ?? {}));

describe('nombre de la vista (mismo límite que el input del frontend)', () => {
  it.each([CreateReportConfigDto, UpdateReportConfigDto])(
    '%p acepta hasta 60 caracteres',
    (Dto) => {
      expect(erroresNombre(Dto, 'a'.repeat(60))).toEqual([]);
      expect(erroresNombre(Dto, 'a'.repeat(61))).toContain('maxLength');
    },
  );

  it.each([CreateReportConfigDto, UpdateReportConfigDto])(
    '%p rechaza un nombre vacío',
    (Dto) => {
      expect(erroresNombre(Dto, '')).toContain('isNotEmpty');
    },
  );

  it('renombrar es opcional: un update sin nombre es válido', () => {
    expect(erroresNombre(UpdateReportConfigDto, undefined)).toEqual([]);
  });
});
