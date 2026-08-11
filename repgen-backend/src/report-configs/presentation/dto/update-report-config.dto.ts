import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateReportConfigDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  columnState?: object[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
