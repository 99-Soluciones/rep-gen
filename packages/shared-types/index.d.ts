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

/** Tipo de renglón de Cuentas por cobrar. */
export type TipoTransaccionCxC =
  | 'Factura vencida'
  | 'Factura por vencer'
  | 'Factura cerrada: No cobrar'
  | 'Abono por aplicar'
  | 'Cargo por aplicar'
  | 'Abono no identificado';

/**
 * Fila de Cuentas por cobrar. Todas las filas traen las mismas llaves; un
 * campo que no aplica al tipo de renglón va en null. Montos en MXN, fechas
 * YYYY-MM-DD.
 */
export interface ReportReceivablesRecord {
  /** Día de corte (YYYY-MM-DD); el mismo en todas las filas. */
  fechaCorte: string;
  tipoTransaccion: TipoTransaccionCxC;
  clienteId: number | null;
  cliente: string;
  clienteRazonSocial: string | null;
  clienteRfc: string | null;
  clasificacion1: string | null;
  clasificacion2: string | null;
  clasificacion3: string | null;
  clasificacion4: string | null;
  clienteCuentaContable: string | null;
  clienteRepDeVenta: string | null;
  /** Crédito autorizado del cliente (monto). */
  clienteCreditoAutorizado: number | null;
  facturaSerieFolio: string | null;
  facturaGranTotal: number | null;
  facturaUuid: string | null;
  facturaFecha: string | null;
  facturaMetodoPago: string | null;
  facturaDiasCredito: number | null;
  facturaFechaVencimiento: string | null;
  /** 'No cobrar': al corte ya estaba marcada así; su saldo va en facturaNoCobrarGranTotal. */
  facturaEstatus: 'Vencida' | 'Por vencer' | 'No cobrar' | null;
  facturaDiasVencida: number | null;
  facturaRepDeVenta: string | null;
  facturaRepDeCobranza: string | null;
  facturaSaldoPendiente: number | null;
  facturaSaldoVencido: number | null;
  facturaSaldoPorVencer: number | null;
  /** Saldo de una factura "No cobrar" (va aquí y no en pendiente/vencido/por vencer). */
  facturaNoCobrarGranTotal: number | null;
  /** IVA / IEPS de una factura "No cobrar" (monto_contraIVA / monto_contraIEPS); si no, 0. */
  facturaNoCobrarIva: number | null;
  facturaNoCobrarIeps: number | null;
  /** Cuándo se marcó "No cobrar" (saldo_fecha_liquidacion_bancoITM_noCobrar); null en las demás. */
  facturaNoCobrarFecha: string | null;
  abonoSaldoNoAplicado: number | null;
  cargoSaldoNoAplicado: number | null;
  abonoMontoSinIdentificar: number | null;
  ingresoId: number | null;
  egresoId: number | null;
  bancoFolioTransaccion: number | null;
  bancoNombre: string | null;
  bancoCuentaContable: string | null;
  bancoFecha: string | null;
  bancoMonto: number | null;
  bancoReferencia: string | null;
  ventaId: number | null;
}

/**
 * Fila de Cuentas por cobrar por cliente: los saldos del detalle sumados por
 * cliente. La última fila ("INGRESOS SIN IDENTIFICAR", clienteId null) solo
 * trae abonoSaldoNoAplicado; las demás cifras van en null.
 */
export interface ReportReceivablesClientRecord {
  fechaCorte: string;
  clienteId: number | null;
  cliente: string;
  clienteRazonSocial: string | null;
  clienteRfc: string | null;
  clasificacion1: string | null;
  clasificacion2: string | null;
  clasificacion3: string | null;
  clasificacion4: string | null;
  clienteCuentaContable: string | null;
  clienteCreditoAutorizado: number | null;
  clienteRepDeVenta: string | null;
  clienteRepDeCobranza: string | null;
  /** Vigentes + No cobrables − Saldo a favor. */
  clienteSaldoFiscal: number | null;
  /** Facturas vigentes: vencido + por vencer. */
  facturaSaldoPendiente: number | null;
  facturaSaldoVencido: number | null;
  facturaSaldoPorVencer: number | null;
  facturaNoCobrarGranTotal: number | null;
  /** Pagos + devoluciones no aplicados. */
  clienteSaldoAFavor: number | null;
  abonoSaldoNoAplicado: number | null;
  cargoSaldoNoAplicado: number | null;
}

/**
 * Respuesta de POST /reports/cuentas-por-cobrar/buscar (por factura) y de
 * /reports/cuentas-por-cobrar-por-cliente/buscar (por cliente).
 */
export interface ReceivablesResponse<
  T = ReportReceivablesRecord | ReportReceivablesClientRecord,
> {
  /** Día de corte (YYYY-MM-DD): los saldos son al cierre de ese día. */
  fechaCorte: string;
  data: T[];
}

/** Tipo de renglón de Cuentas por pagar. */
export type TipoTransaccionCxP =
  | 'Factura vencida'
  | 'Factura por vencer'
  | 'Factura cerrada: No pagar'
  | 'Cargo por aplicar'
  | 'Abono por aplicar'
  | 'Cargo no identificado';

/**
 * Fila de Cuentas por pagar (por compras). Todas las filas traen las mismas
 * llaves; un campo que no aplica al tipo de renglón va en null. Montos en
 * MXN, fechas YYYY-MM-DD.
 */
export interface ReportPayablesRecord {
  /** Día de corte (YYYY-MM-DD); el mismo en todas las filas. */
  fechaCorte: string;
  tipoTransaccion: TipoTransaccionCxP;
  proveedorId: number | null;
  proveedor: string;
  proveedorRazonSocial: string | null;
  proveedorRfc: string | null;
  proveedorCuentaContable: string | null;
  proveedorAcuerdos: string | null;
  /** Sin CFDI: null (la OC va en compraId). */
  facturaSerieFolio: string | null;
  facturaFecha: string | null;
  facturaUuid: string | null;
  facturaObservaciones: string | null;
  facturaMoneda: string | null;
  /** Gran total en la moneda de la compra (gran total MXN / TC). */
  facturaGranTotalOriginal: number | null;
  facturaTipoDeCambio: number | null;
  facturaGranTotal: number | null;
  facturaFechaLimiteDePago: string | null;
  /** 'No pagar': al corte ya estaba marcada así; su saldo va en facturaNoPagarMonto. */
  facturaEstatus: 'Vencida' | 'Por vencer' | 'No pagar' | null;
  facturaDiasVencida: number | null;
  facturaNoPagarFecha: string | null;
  compraRepDeCompra: string | null;
  facturaSaldoPendiente: number | null;
  facturaSaldoVencido: number | null;
  facturaSaldoPorVencer: number | null;
  /** Saldo de una factura "No pagar" (va aquí y no en pendiente/vencido/por vencer). */
  facturaNoPagarMonto: number | null;
  facturaNoPagarIva: number | null;
  facturaNoPagarIeps: number | null;
  facturaNoPagarCerradaPor: string | null;
  abonoSaldoNoAplicado: number | null;
  cargoSaldoNoAplicado: number | null;
  bancoFolioTransaccion: number | null;
  ingresoId: number | null;
  egresoId: number | null;
  bancoNombre: string | null;
  bancoCuentaContable: string | null;
  bancoFecha: string | null;
  bancoMonto: number | null;
  bancoReferencia: string | null;
  cargoMontoSinIdentificar: number | null;
  /** 'SI' / 'NO'; '' si FileMaker no lo trae. */
  compraTieneProductos: string | null;
  bodegaEntregaEstatus: string | null;
  bodegaFechaEstimadaDeEntrega: string | null;
  bodegaFechaDeEntrega: string | null;
  compraId: number | null;
}

/** Respuesta de POST /reports/cuentas-por-pagar/buscar. */
export interface PayablesResponse {
  /** Día de corte (YYYY-MM-DD): los saldos son al cierre de ese día. */
  fechaCorte: string;
  data: ReportPayablesRecord[];
}

/** Tipo de renglón de Flujo de efectivo - Ingresos. */
export type TipoRenglonIngreso =
  | 'Pago aplicado'
  | 'Pago sin aplicar'
  | 'Pago no identificado';

/** Vista del reporte: una fila por pago × factura, o por pago × factura × concepto. */
export type DetalleIngresos = 'factura' | 'concepto';

/**
 * Fila de Flujo de efectivo - Ingresos. Las dos vistas traen las mismas
 * llaves; lo que no aplica al tipo de renglón o a la vista va en null.
 * Importes y costo subtotal prorrateados por lo pagado (pagoTasa). Montos en
 * MXN, fechas YYYY-MM-DD.
 */
export interface ReportCashInflowRecord {
  tipoRenglon: TipoRenglonIngreso;
  /** Fecha del movimiento de banco: el día que entró el dinero, no el del complemento. */
  pagoFecha: string;
  bancoFolioTransaccion: number | null;
  bancoNombre: string;
  bancoFormaPago: string;
  bancoMoneda: string;
  bancoTipoDeCambio: number;
  /** 'NO IDENTIFICADO' en un depósito sin cliente. */
  cliente: string;
  clienteRazonSocial: string | null;
  clienteRfc: string | null;
  clienteCuentaContable: string | null;
  clasificacion1: string | null;
  clasificacion2: string | null;
  clasificacion3: string | null;
  clasificacion4: string | null;
  clienteId: number | null;
  clienteRepDeVenta: string | null;
  clienteColonia: string | null;
  clienteDelegacion: string | null;
  clienteCiudad: string | null;
  clienteEstado: string | null;
  /** Crédito autorizado al cliente; no se prorratea. */
  creditoGranTotalMxn: number | null;
  ventaId: number | null;
  facturaUuid: string | null;
  facturaSerieFolio: string | null;
  facturaFecha: string | null;
  /** Fecha en que se capturó la venta (area_fechaVenta). */
  facturaFechaDeCaptura: string | null;
  /** Completo, sin prorratear. */
  facturaGranTotalMxn: number | null;
  facturaGranTotalOriginal: number | null;
  facturaMoneda: string | null;
  facturaTipoDeCambio: number | null;
  facturaUsoCfdi: string | null;
  facturaMetodoPago: string | null;
  /** Estatus de hoy, no del periodo: Liquidado · Vigente · No Cobrar · Cancelada. */
  facturaEstatus: string | null;
  /** Saldo de hoy, no del periodo. */
  facturaSaldoActual: number | null;
  /** Este pago ÷ gran total de la factura (no la tasa acumulada). */
  pagoTasa: number | null;
  facturaRepDeVenta: string | null;
  facturaRepDeCobranza: string | null;
  observacionesEnCfdi: string | null;
  bodegaId: number | null;
  bodegaNombre: string | null;
  articuloSku: string | null;
  articuloMarca: string | null;
  articuloNombre: string | null;
  articuloNombreCompleto: string | null;
  /** Nombre de la presentación (p. ej. "Botella .355 ml"). */
  articuloPresentacion: string | null;
  articuloCuentaContable: string | null;
  categoriadeProducto1: string | null;
  categoriadeProducto2: string | null;
  categoriadeProducto3: string | null;
  categoriadeProducto4: string | null;
  claveDeProductoOServicio: string | null;
  /** Del concepto completo, sin prorratear (igual que contenido y precios). */
  cantidad: number | null;
  unidadDeVenta: string | null;
  unidadDeContenido: string | null;
  contenidoUnitario: number | null;
  contenidoSubTotal: number | null;
  precioUnitario: number | null;
  tipoDeConcepto: string | null;
  metodoDeAdquisicion: string | null;
  costoDirectoUnitarioMxn: number | null;
  importeSinDescuentoMxn: number | null;
  descuentoMontoMxn: number | null;
  importeConDescuentoMxn: number | null;
  ivaMxn: number | null;
  iepsMxn: number | null;
  ivaRetenidoMxn: number | null;
  isrRetenidoMxn: number | null;
  /** Lo que entró: monto aplicado a la factura, o el saldo por aplicar del depósito. */
  pagoGranTotalMxn: number;
  costoDirectoSubTotalMxn: number | null;
  gananciaBrutaMxn: number | null;
  costoTasa: number | null;
  margenTasa: number | null;
}

/** Tipo de renglón de Bancos con complementos (de la conciliación). */
export type TipoTransaccionBanco =
  | 'Pago de cliente'
  | 'Pago de proveedor'
  | 'Transferencia desde banco'
  | 'Pago a proveedor'
  | 'Pago a cliente'
  | 'Transferencia a banco'
  | 'Sin identificar';

/**
 * Fila de Bancos con complementos: una por complemento. El movimiento y la
 * conciliación se repiten en cada fila; lo que no aplica va en null.
 * Ficha: repgen-backend/docs/reports/fichas/bank-complements/bank-complements.md
 */
export interface ReportBankComplementRecord {
  bancoFolioTransaccion: number;
  bancoFecha: string | null;
  bancoNombre: string;
  bancoNumeroCuenta: string;
  bancoCuentaContable: string;
  bancoMoneda: string;
  bancoTipoDeCambio: number | null;
  bancoFormaPago: string;
  bancoConcepto: string;
  bancoAbono: number | null;
  bancoCargo: number | null;
  bancoSaldoResultante: number | null;
  bancoSaldoPorIdentificar: number | null;
  bancoSaldoPorComplementar: number | null;
  bancoTextoComplemento: string;
  tipoTransaccion: TipoTransaccionBanco;
  ingresoId: number | null;
  egresoId: number | null;
  conciliacionEstado: string | null;
  conciliacionMontoTotal: number | null;
  conciliacionMontoComplementado: number | null;
  conciliacionSaldoPorComplementar: number | null;
  clienteProveedorId: number | null;
  bancoTransferenciaId: number | null;
  clienteProveedor: string | null;
  clienteProveedorRazonSocial: string | null;
  clienteProveedorRfc: string | null;
  pagoGranTotalMxn: number | null;
  pagoFecha: string | null;
  pagoPeriodoFiscal: string | null;
  pagoFolio: string | null;
  pagoUuid: string | null;
  facturaSerieFolio: string | null;
  facturaFecha: string | null;
  facturaGranTotal: number | null;
  facturaUuid: string | null;
  facturaMetodoPago: string | null;
  ventaId: number | null;
}

/** Estatus de pago de la compra: Cerrado → Liquidado; Pagos → según la fecha límite. */
export type EstatusCompra = 'Liquidado' | 'Vencida' | 'Vigente';

/** Tipo de concepto de compra, normalizado (FileMaker mezcla mayúsculas). */
export type TipoConceptoCompra = 'Stock' | 'Gasto' | 'Incrementable' | 'Costo';

/**
 * Fila de Compras por concepto: una por concepto (poITM) de una compra
 * aprobada. Los datos de la compra se repiten en cada fila; lo que no aplica
 * va en null.
 * Ficha: repgen-backend/docs/reports/fichas/purchase-items/purchase-items.md
 */
export interface ReportPurchaseItemRecord {
  compraFechaAprobado: string | null;
  compraId: number;
  compraRepDeCompra: string;
  proveedor: string;
  proveedorRazonSocial: string;
  proveedorRfc: string;
  proveedorCuentaContable: string;
  facturaUuid: string;
  facturaSerieFolio: string | null;
  facturaFecha: string | null;
  facturaGranTotalMxn: number | null;
  facturaObservaciones: string;
  facturaEstatus: EstatusCompra;
  facturaSaldoActual: number | null;
  facturaFechaLimiteDePago: string | null;
  bancoNombre: string;
  bancoNumeroCuenta: string;
  facturaMoneda: string;
  facturaTipoDeCambio: number | null;
  facturaGranTotalOriginal: number | null;
  articuloSku: string;
  articuloMarca: string;
  articuloNombre: string;
  articuloNombreCompleto: string;
  articuloCuentaContable: string;
  categoriadeProducto1: string;
  categoriadeProducto2: string;
  categoriadeProducto3: string;
  categoriadeProducto4: string;
  tipoDeConcepto: TipoConceptoCompra | string;
  cantidad: number | null;
  unidadDeCompra: string;
  precioUnitario: number | null;
  articuloImporteSinDescuentoMxn: number | null;
  articuloDescuentoMontoMxn: number | null;
  articuloImporteConDescuentoMxn: number | null;
  articuloIVAMxn: number | null;
  articuloIEPSMxn: number | null;
  articuloIVARetenidoMxn: number | null;
  articuloISRretenidoMxn: number | null;
  articuloGranTotalMxn: number | null;
  bodegaNombre: string | null;
  bodegaEntregaEstatus: 'Entregado' | 'Pendiente' | null;
  bodegaEntregaFecha: string | null;
}

/**
 * Fila de Compras (general): una por compra aprobada (poFACTURA).
 * Ficha: repgen-backend/docs/reports/fichas/purchases/purchases.md
 */
export interface ReportPurchaseRecord {
  compraFechaAprobado: string | null;
  compraId: number;
  compraRepDeCompra: string;
  proveedor: string;
  proveedorRazonSocial: string;
  proveedorRfc: string;
  proveedorCuentaContable: string;
  facturaUuid: string;
  facturaSerieFolio: string | null;
  facturaFecha: string | null;
  facturaObservaciones: string;
  facturaEstatus: EstatusCompra;
  facturaSaldoActual: number | null;
  facturaFechaLimiteDePago: string | null;
  bancoNombre: string;
  bancoNumeroCuenta: string;
  facturaMoneda: string;
  facturaTipoDeCambio: number | null;
  facturaGranTotalOriginal: number | null;
  importeConDescuentoMxn: number | null;
  ivaMxn: number | null;
  iepsMxn: number | null;
  ivaRetenidoMxn: number | null;
  isrRetenidoMxn: number | null;
  facturaGranTotalMxn: number | null;
  bodegaNombre: string;
  bodegaEntregaEstatus: string;
  bodegaFechaEstimadaDeEntrega: string | null;
}
