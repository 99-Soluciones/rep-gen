// Contratos de API compartidos entre repgen-backend y repgen-frontend.
// Solo tipos: este paquete no tiene (ni debe tener) codigo en runtime.
// El campo "exports" solo expone la condicion "types", asi que cualquier
// import de valor (no type-only) falla en compilacion a proposito.

/** Estado de una columna de AG Grid persistido en una configuracion de reporte. */
export interface ColumnStateEntry {
  colId: string;
  hide?: boolean;
  width?: number;
  sort?: 'asc' | 'desc' | null;
  sortIndex?: number | null;
  pinned?: 'left' | 'right' | null;
  aggFunc?: string | null;
}

/** Periodo relativo de una vista: se resuelve a fechas al abrirla. */
export type PeriodoVista = 'mes_actual' | 'mes_anterior' | 'anio_en_curso';

/** Vista guardada de un reporte (columnas + filtros + periodo) tal como la expone la API. */
export interface ReportConfigResponse {
  id: string;
  reportId: string;
  name: string;
  columnState: ColumnStateEntry[];
  /** Modelo de filtros de AG Grid (getFilterModel). null/ausente = sin filtros. */
  filterModel?: Record<string, unknown> | null;
  /** null/ausente = la vista no toca el rango de fechas. */
  periodo?: PeriodoVista | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Etiquetas de columnas personalizadas por tenant (GET /tenant/column-labels). */
export interface ColumnLabelsResponse {
  cliente: {
    clasificacion1: string;
    clasificacion2: string;
    clasificacion3: string;
    clasificacion4: string;
  };
  articulo: {
    categoria1: string;
    categoria2: string;
    categoria3: string;
    categoria4: string;
  };
}

/** Features habilitadas para el tenant (GET /tenant/features). */
export interface TenantFeaturesResponse {
  reportConfigs: boolean;
}

// --- Registros de reportes (respuesta de POST /reports/*/buscar: { data: T[] }) ---

/** Fila del reporte de bancos. */
export interface ReportBankRecord {
  idTransaccionBanco: number;
  fecha: string;
  formaPago: string;
  concepto: string;
  abono?: number;
  cargo?: number;
  saldoPorComplementar: number;
  tipoDeCambio?: number;
  saldoPorIdentificar?: number;
  saldoBanco?: number;
  textoComplementario?: string;
  nombre_banco?: string;
  numero_cuenta?: string;
  moneda?: string;
  cuentaContable?: string;
  estadoIngreso?: string;
  estadoEgreso?: string;
  nombre_comercial?: string;
  rfc?: string;
}

/** Fila del reporte de ventas por factura. */
export interface ReportSalesRecord {
  cliente: string;
  clienteRazonSocial: string;
  clienteRfc: string;
  clienteCuentaContable: string;
  clienteCalle: string;
  clienteColonia: string;
  clienteDelegacion: string;
  clienteCiudad: string;
  clienteEstado: string;
  clienteId: number;
  clienteRepDeVenta: string;
  clienteRepDeCobranza: string;
  nombreClasificacion1: string;
  nombreClasificacion2: string;
  nombreClasificacion3: string;
  nombreClasificacion4: string;
  clasificacion1: string;
  clasificacion2: string;
  clasificacion3: string;
  clasificacion4: string;

  ventaId: number;
  devoId: string;
  facturaUuid: string;
  facturaSerie: string;
  facturaFolio: string;
  facturaFecha: string;
  facturaGranTotalMxn: number;
  facturaGranTotalOriginal: number; // calculado por el importe gran total mxn / tipo de cambio, si la moneda es diferente a MXN, si la moneda es MXN es igual a facturaGranTotalMxn
  facturaFechaDeCaptura: string;
  facturaTipoDeCambio: number;
  facturaMoneda: string;
  facturaUsoCfdi: string;
  facturaMetodoPago: string;
  facturaFormaDePago: string;
  facturaEstatus: string;
  facturaSaldoActual: number;
  facturaTasaPagada: number;
  observacionesEnCfdi: string;
  bodegaId: number;
  bodegaNombre: string;
  importeSinDescuentoMxn: number;
  descuentoMontoMxn: number;
  importeConDescuentoMxn: number;
  ivaMxn: number;
  iepsMxn: number;
  ivaRetenidoMxn: number;
  isrRetenidoMxn: number;
  pagoGranTotalMxn: number;
}

/** Fila del reporte de ventas por concepto: la factura más los datos del artículo. */
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
