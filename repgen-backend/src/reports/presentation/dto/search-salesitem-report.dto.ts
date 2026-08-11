import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FilterSalesItemModel } from '../../domain';
import { DateRangeDto, FilterFieldDto } from './search-bank-report.dto';
import { FilterSalesDto } from './search-sales-report.dto';

export class FilterSalesItemDto
  extends FilterSalesDto
  implements FilterSalesItemModel
{
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  tipoDeConcepto?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  metodoDeAdquisicion?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  costoDirectoUnitarioMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  costoDirectoSubTotalMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  gananciaBrutaMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  costoTasa?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  margenTasa?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloSku?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloMarca?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloNombre?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloNombreCompleto?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloCuentaContable?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  categoriadeProducto1?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  categoriadeProducto2?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  categoriadeProducto3?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  categoriadeProducto4?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  claveDeProductoOServicio?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  cantidad?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  unidadDeVenta?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  unidadDeContenido?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  contenidoUnitario?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  contenidoSubTotal?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  precioUnitario?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloImporteSinDescuentoMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloDescuentoMontoMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloImporteConDescuentoMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloIVAMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloIEPSMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloIVARetenidoMxn?: FilterFieldDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFieldDto)
  articuloISRretenidoMxn?: FilterFieldDto;
}

export class SearchSalesItemReportDto {
  @IsOptional()
  @IsString()
  globalSearch?: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterSalesItemDto)
  filterModel?: FilterSalesItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;
}
