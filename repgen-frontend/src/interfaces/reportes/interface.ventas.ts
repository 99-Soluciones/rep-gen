export interface IVentaData {
  // Identificadores / Core
  ventaId: string; //listo
  devoId: string;
  facturaUuid: string; //listo
  facturaSerie: string; //listo
  facturaFolio: string; //listo
  facturaFecha: string; //listo
  facturaEstatus: string; //calculado //hardcode en devolucion
  facturaFechaDeCaptura: string; //listo //

  // Cliente Core
  cliente: string; //listo
  clienteRazonSocial: string; //listo
  clienteRfc: string; //listo
  clienteId: string; //listo

  // Financieros Generales (Factura)
  facturaGranTotalMxn: number; //lisyo
  facturaSaldoActual: number; //listo // devolucion es 0
  pagoGranTotalMxn: number; //suma de pagos mas anticipos relacionados con la factura, convertido a MXN si la moneda del pago es diferente a MXN usando el tipo de cambio del pago
  importeSinDescuentoMxn: number;
  descuentoMontoMxn: number; //se calcula con la tasa de descuento aplicada a importeSinDescuentoMxn, si no hay descuento es 0 //en devolucion es el campo monto.importe
  importeConDescuentoMxn: number; //Calculado como importeSinDescuentoMxn - descuentoMontoMxn
  ivaMxn: number; //listo
  iepsMxn: number; //listo
  ivaRetenidoMxn: number; //listo
  isrRetenidoMxn: number; //listo
  facturaGranTotalOriginal: number; // calculado por el importe gran total mxn / tipo de cambio, si la moneda es diferente a MXN, si la moneda es MXN es igual a facturaGranTotalMxn
  facturaTipoDeCambio: number; //listo
  facturaMoneda: string; //listo

  // Pago
  facturaUsoCfdi: string; //listo //Hardcore en devolucion
  facturaMetodoPago: string; //lhgisto
  facturaFormaDePago: string; //listo
  facturaTasaPagada: number; //Calculado como (importeConDescuentoMxn + ivaMxn + iepsMxn - ivaRetenidoMxn - isrRetenidoMxn) / facturaGranTotalMxn //deovlucion 1

  // Nivel Concepto (Solo en Reporte de Conceptos)
  articuloSku: string;
  articuloNombre: string;
  cantidad: number; //Venta_ITM
  precioUnitario: number;
  articuloImporteSinDescuentoMxn: number; //Cliente
  articuloDescuentoMontoMxn?: number;
  articuloImporteConDescuentoMxn?: number;
  articuloIVAMxn?: number;
  articuloIEPSMxn?: number;
  articuloIVARetenidoMxn?: number;
  articuloISRretenidoMxn?: number;

  // Detalles Extra del Articulo
  claveDeProductoOServicio: string;
  articuloMarca: string;
  articuloNombreCompleto: string;
  unidadDeVenta: string;
  unidadDeContenido: string;
  contenidoUnitario: number;
  contenidoSubTotal: number;
  tipoDeConcepto: string; // inventario
  metodoDeAdquisicion: string; // inventario

  // Costos y Rentabilidad
  costoDirectoUnitarioMxn: number; //inventario
  costoDirectoSubTotalMxn: number; //inventario
  gananciaBrutaMxn: number; //Calculado como importeConDescuentoMxn + ivaMxn + iepsMxn - ivaRetenidoMxn - isrRetenidoMxn - costoDirectoSubTotalMxn
  costoTasa: number; //Calculado como costoDirectoUnitarioMxn / precioUnitario
  margenTasa: number; //Calculado como gananciaBrutaMxn / importeConDescuentoMxn

  // Categorías y Contabilidad
  articuloCuentaContable: string;
  categoriadeProducto1: string;
  categoriadeProducto2: string;
  categoriadeProducto3: string;
  categoriadeProducto4: string;
  clasificacion1: string; //listo
  clasificacion2: string; //listo
  clasificacion3: string; //listo
  clasificacion4: string; //listo
  clienteCuentaContable: string;

  // Dirección Cliente
  clienteCalle: string; //LISTO
  clienteColonia: string; //LISTO
  clienteDelegacion: string; //LISTO
  clienteCiudad: string; //LISTO
  clienteEstado: string; //LISTO

  // Otros Detalles Generales
  clienteRepDeVenta: string; //listo
  clienteRepDeCobranza: string; //listo
  observacionesEnCfdi: string; //listo //Develucion es "Devolución de mercancía" o "Devolución de servicio" dependiendo del tipo de concepto
  bodegaId: string; //listo
  bodegaNombre: string; //relacion bodega
}
