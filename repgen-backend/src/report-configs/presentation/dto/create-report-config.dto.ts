import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateReportConfigDto {
  @IsString()
  reportId!: string;

  @IsString()
  name!: string;

  @IsArray()
  columnState!: object[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}
