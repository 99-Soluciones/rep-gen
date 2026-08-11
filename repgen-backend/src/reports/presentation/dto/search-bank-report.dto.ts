import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FilterBankModel, FilterModel } from '../../domain';

export class FilterFieldDto implements FilterModel {
  @IsOptional()
  @IsString()
  filterType: string = 'text';

  @IsOptional()
  @IsString()
  type: string = 'contains';

  @IsOptional()
  filter: string | number = '';
}

export class DateRangeDto {
  @IsOptional()
  @IsString()
  startDate: string = '';

  @IsOptional()
  @IsString()
  endDate: string = '';
}

export class FilterBankDto implements FilterBankModel {
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  fecha?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  nombre_banco?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  numero_cuenta?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  moneda?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  formaPago?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  concepto?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  abono?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  cargo?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  saldoPorComplementar?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  tipoDeCambio?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  saldoPorIdentificar?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  textoComplementario?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  estadoIngreso?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  estadoEgreso?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  nombre_comercial?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  rfc?: FilterFieldDto;
}

export class SearchBankReportDto {
  @IsOptional()
  @IsString()
  globalSearch?: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterBankDto)
  filterModel?: FilterBankDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;
}
