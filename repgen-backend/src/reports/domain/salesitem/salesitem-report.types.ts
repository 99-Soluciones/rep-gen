import type { FilterModel } from '../reports.types';
import {
  FilterSalesModel,
  ReportSalesRecord,
} from '../sales/sales-report.types';

/**
 * ReportSalesItemRecord extiende ReportSalesRecord con campos adicionales específicos para el reporte de ventas por artículo.
 */
export interface ReportSalesItemRecord extends ReportSalesRecord {
  tipoDeConcepto?: string;
  metodoDeAdquisicion?: string;
  costoDirectoUnitarioMxn?: number;
  costoDirectoSubTotalMxn?: number;
  gananciaBrutaMxn?: number;
  costoTasa?: number;
  margenTasa?: number;
  articuloSku?: string;
  articuloMarca?: string;
  articuloNombre?: string;
  articuloNombreCompleto?: string;
  articuloCuentaContable?: string;
  categoriadeProducto1?: string;
  categoriadeProducto2?: string;
  categoriadeProducto3?: string;
  categoriadeProducto4?: string;
  claveDeProductoOServicio?: string;
  cantidad?: number;
  unidadDeVenta?: string;
  unidadDeContenido?: string;
  contenidoUnitario?: number;
  contenidoSubTotal?: number;
  precioUnitario?: number;
  articuloImporteSinDescuentoMxn?: number;
  articuloDescuentoMontoMxn?: number;
  articuloImporteConDescuentoMxn?: number;
  articuloIVAMxn?: number;
  articuloIEPSMxn?: number;
  articuloIVARetenidoMxn?: number;
  articuloISRretenidoMxn?: number;
}
/**
 * FilterSalesItemModel extiende FilterSalesModel con campos adicionales para filtrar por criterios específicos de artículos en el reporte de ventas por artículo.
 */
export interface FilterSalesItemModel extends FilterSalesModel {
  tipoDeConcepto?: FilterModel;
  metodoDeAdquisicion?: FilterModel;
  costoDirectoUnitarioMxn?: FilterModel;
  costoDirectoSubTotalMxn?: FilterModel;
  gananciaBrutaMxn?: FilterModel;
  costoTasa?: FilterModel;
  margenTasa?: FilterModel;
  articuloSku?: FilterModel;
  articuloMarca?: FilterModel;
  articuloNombre?: FilterModel;
  articuloNombreCompleto?: FilterModel;
  articuloCuentaContable?: FilterModel;
  categoriadeProducto1?: FilterModel;
  categoriadeProducto2?: FilterModel;
  categoriadeProducto3?: FilterModel;
  categoriadeProducto4?: FilterModel;
  claveDeProductoOServicio?: FilterModel;
  cantidad?: FilterModel;
  unidadDeVenta?: FilterModel;
  unidadDeContenido?: FilterModel;
  contenidoUnitario?: FilterModel;
  contenidoSubTotal?: FilterModel;
  precioUnitario?: FilterModel;
  articuloImporteSinDescuentoMxn?: FilterModel;
  articuloDescuentoMontoMxn?: FilterModel;
  articuloImporteConDescuentoMxn?: FilterModel;
  articuloIVAMxn?: FilterModel;
  articuloIEPSMxn?: FilterModel;
  articuloIVARetenidoMxn?: FilterModel;
  articuloISRretenidoMxn?: FilterModel;
}

/**
 * Interaz para el mapeo de registros raw de ventas por artículo a un formato con keys limpias, utilizando las definiciones en salesItemFieldMap.json.
 */
export interface SalesItemMappedRecord {
  bodega?: {
    nombre?: string;
  };

  cliente?: {
    id?: number;
    cuentaContable?: string;
    nombreComercial?: string;
    rfc?: string;
    razonSocial?: string;
    creditoDias?: string;
    clasificacion1?: string;
    clasificacion2?: string;
    clasificacion3?: string;
    clasificacion4?: string;
  };

  venta?: {
    id?: number;
    bodegaId?: number;
    formaPago?: string;
    metodoPago?: string;
    usoCDFI?: string;
    moneda?: string;
    repVenta?: string;
    fechaCotizacion?: string;
    fechaTimbrado?: string;
    folio?: string;
    observaciones?: string;
    uuid?: string;
    serieFolio?: string;
    fechaCancelacion?: string;
    tipoCambio?: number;
    clasificacion1?: string;
    clasificacion2?: string;
    clasificacion3?: string;
    clasificacion4?: string;
  };

  entrega?: {
    direccion?: string;
    ciudad?: string;
    colonia?: string;
    delegacion?: string;
    estado?: string;
  };

  montos?: {
    granTotal?: number;
    descuento?: number;
    sinDescuentoSinIEPS?: number;
    contraIEPS?: number;
    contraIVA?: number;
    favorIVAretenido?: number;
    favorISRretenido?: number;
    pagadoAnticipos?: string;
    pagadoPagos?: number;
    pendienteGranTotal?: string;
  };

  usuario?: {
    idCobranza?: string;
    idVenta?: string;
  };

  // Returns
  devolucion?: {
    id?: string;
    fechaCaptura?: string;
    fechaTimbrado?: string;
    granTotal?: string;
    importe?: string;
    contraIVA?: string;
    favorIVAretenido?: string;
    favorISRretenido?: string;
    notaUuid?: string;
    notaSerieFolio?: string;
    item?: {
      ventaItmId?: string;
      qty?: string;
      granTotal?: string;
      importe?: string;
      ivaRet?: string;
      contraIEPS?: string;
      contraIVA?: string;
      isrRet?: string;
    };
  };

  item?: {
    id?: string;
    idu?: string;
    presentacion?: number;
    satClavePS?: number;
    satUnitCont?: string;
    satUnitVenta?: string;
    contenidoCantidad?: number;
    marca?: string;
    modelo?: string;
    nombre?: string;
    nombreDisplay?: string;
    sku?: string;
    cuentaContable?: string;
    tipo?: number;
    clasificacion1?: string;
    clasificacion2?: string;
    clasificacion3?: string;
    clasificacion4?: string;
    prefClasificacion1?: string;
    prefClasificacion2?: string;
    prefClasificacion3?: string;
    prefClasificacion4?: string;
    serieMasNumber?: string;
    satUnitVentaNombre?: string;
    nombreSATps?: string;
  };

  po?: {
    id?: string;
    fechaComprobante?: string;
    serieFolio?: string;
  };

  sub?: {
    descuento?: number;
    margenCosto?: number;
    granTotal?: number;
    conDescuentoSinIEPS?: number;
    sinDescuentoSinIEPS?: number;
    contraIEPS?: number;
    contraIVA?: number;
    favorIVAretenido?: number;
    favorISRretenido?: number;
  };

  unit?: {
    margenCosto?: number;
    granTotal?: number;
    descuento: number;
    sinDescuentoSinIEPS: number;
    contraIEPS: number;
    contraIVA: number;
    favorIVAretenido: number;
    favorISRretenido: number;
  };

  qty?: number;
}
