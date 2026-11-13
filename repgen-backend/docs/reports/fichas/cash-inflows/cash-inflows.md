# Ficha: Flujo de efectivo - Ingresos

> Basada en los reportes de la versión anterior "Ingreso Factura" e "Ingreso
> conceptos" (CSV, periodo 01/10/2026 al 31/10/2026, 105 y 187 filas). Lo
> marcado **PENDIENTE** lo decide la persona dueña del reporte. Guía:
> [docs/guides/COMO-AGREGAR-REPORTE.md](../../../../../docs/guides/COMO-AGREGAR-REPORTE.md)

- Nombre interno: `cash-inflows`
- Endpoint: `reports/flujo-efectivo-ingresos/buscar`
- Ruta frontend y reportId: `/flujo_efectivo_ingresos` (no existe aún en el menú)
- Tipo: **rango de fechas**
- Campo de fecha del rango: la **fecha del movimiento de banco** (ver paso 1)
- Endpoints: `reports/flujo-efectivo-ingresos/buscar` (por factura) y
  `reports/flujo-efectivo-ingresos-por-concepto/buscar` (por concepto)
- ¿Filtra por permisos del usuario?: **sí, solo los depósitos sin aplicar y no
  identificados** (layout de bancos), por los bancos que el usuario puede ver,
  igual que hace el código de Cuentas por cobrar (`getBankBaseFilters`). Los
  pagos aplicados a facturas no se filtran. Consecuencia: el total del periodo
  puede variar según el usuario.

> **Estado (12/11/2026): implementado y validado contra el reporte anterior.** Los **PENDIENTE** que quedan abajo
> con una recomendación se aprobaron tal como dice la recomendación (borrador
> y plan aprobados); se conservan para saber de dónde salió cada regla. Código:
> `repgen-backend/src/reports/*/cash-inflows/` y
> `repgen-frontend/src/features/reports/cash-inflows/`.

## Qué muestra

El dinero que **entró al banco** en el periodo y a qué se aplicó. Es el
reporte de Ventas visto desde el pago: cada pago aplicado a una factura sale
con los datos de la factura y sus importes **prorrateados** por lo pagado.
Además salen los depósitos del periodo que todavía no se aplican a ninguna
factura.

Dos vistas con las mismas columnas (como Ventas / Ventas por concepto):

| Vista        | Una fila por…                       | Filas en la muestra |
| ------------ | ----------------------------------- | ------------------- |
| Por factura  | pago × factura                      | 91 + 14 sin factura |
| Por concepto | pago × factura × concepto           | 173 + 14 sin factura |

Las dos vistas suman lo mismo: $1,544,913.10 en la muestra.

## Tipos de renglón

Columna nueva `tipoRenglon` (no existía en la versión anterior; ahí se
distinguían por el texto "NO IDENTIFICADO" / "NO COMPLEMENTADO"):

| `tipoRenglon`         | Qué es                                                        | Filas en la muestra | Monto en la muestra |
| --------------------- | ------------------------------------------------------------- | ------------------- | ------------------- |
| `Pago aplicado`       | parte de un depósito aplicada a una factura                   | 91                  | $247,497.44         |
| `Pago sin aplicar`    | depósito de un cliente identificado, con saldo por aplicar    | 1                   | $48.00              |
| `Pago no identificado`| depósito sin cliente                                          | 13                  | $1,297,367.66       |

**Decidido:** salen los dos tipos sin factura, de **cualquier banco**. "BBVA
Egresos" es solo el nombre de la cuenta; puede recibir ingresos.

Un mismo depósito puede salir en varios renglones: en la muestra el movimiento
7388 tiene dos `Pago aplicado` (F-3171 y F-2982) y un `Pago sin aplicar` de
$48 por lo que sobró.

## Fuentes: dos layouts

| Fuente                  | Layout                       | Búsqueda                                                  | Datos dorados          |
| ----------------------- | ---------------------------- | --------------------------------------------------------- | ---------------------- |
| Pagos aplicados         | `apiExport_Ingresos_Pagos`   | fecha del movimiento de banco dentro del rango            | `entrada-pagos.json`   |
| Depósitos sin aplicar   | `apiExport_Ingresos_Bancos`  | `_fecha` dentro del rango, abono `>0` y saldo por complementar `>0` | `entrada-bancos.json`  |

**Decidido: la tabla base de `apiExport_Ingresos_Pagos` es Ventas**, con dos
portales con nombre de objeto:

- `PagosVenta` (`venta_|contIngreso.ITM|_x_ventaID`, el mismo de CxC): un
  renglón por pago aplicado a la venta, con el monto aplicado en MXN y los
  datos del movimiento de banco (fecha, folio, banco, forma de pago, moneda,
  tipo de cambio).
- `Conceptos` (`venta_|venta.ITM_|_x_ventaID`): un renglón por concepto de la
  venta, con los campos de Ventas por concepto (artículo, cantidad, importes,
  impuestos, costos).

Respuestas crudas: `cash_inflows_Pagos_ResponseFM.json` y
`cash_inflows_Bancos_ResponseFM.json` (datos reales: anonimizar antes de
subirlas). Los schemas se escriben cuando el layout tenga los campos de la
revisión de abajo.

### Revisión de los layouts (12/11/2026)

Lo que falta para poder calcular todas las columnas:

| Layout / portal       | Falta                                                                 | Para qué |
| --------------------- | --------------------------------------------------------------------- | -------- |
| Pagos · `Conceptos`   | `qty`                                                                 | `cantidad`, `contenidoSubTotal` y todos los subtotales |
| Pagos · `Conceptos`   | `sub_mont_sinDiscount_sinIEPS`, `sub_discount_Monto`, `sub_tax_contraIVA`, `sub_tax_contraIEPS`, `sub_tax_favorIVAret_v0_18_1`, `sub_tax_favorISRret_v0_18_1`, `sub_mont_GranTotal` | importes por concepto como en Ventas por concepto; con solo los `unit_*` habría que multiplicar por `qty` y el redondeo puede diferir |
| Pagos · venta         | `entrega_dest_Colonia`, `entrega_dest_Delegacion`, `entrega_dest_Ciudad`, `entrega_dest_EDO` | columnas 62–65 (como Ventas) |
| Pagos · venta         | `area_fechaVenta`                                                     | `facturaFechaDeCaptura` (opcional: vacía en la muestra) |
| Bancos                | dirección del cliente (colonia, delegación, ciudad, estado)           | columnas 62–65 en `Pago sin aplicar` (opcional) |
| Bancos · portal       | nombre de objeto                                                      | hoy su llave es el nombre de la ocurrencia de tabla; funciona, pero se rompe si la renombran |

Observaciones:

- `_idu_formaPago_v0_22_1` y `_idu_cdfi_usoCDFI` traen solo la clave (`03`,
  `G01`); la versión anterior mostraba clave y descripción. **Decidido: solo
  la clave**, igual que Ventas y Bancos hoy.
- **Confirmado** con la venta 3699: cada renglón de `PagosVenta` trae su
  propio folio de banco (7394 y 7527), los mismos del reporte anterior.
- En esa captura `Conceptos` devolvió 1 de 4 renglones. El backend pedirá
  `limit.Conceptos` y `limit.PagosVenta` altos; las entradas doradas deben
  capturarse también con el portal completo.
- `cfdi_Observaciones_v0_18_4` trae saltos de línea (`\r`); se cambian por un
  espacio (la versión anterior los pegaba: "SANTO SPIRITOOC 6926").

Se busca en el campo de fecha del portal `PagosVenta` ("algún pago en el
rango"): FileMaker trae la venta si algún pago cumple, **con todos sus
pagos**; el mapper descarta los que caen fuera del rango. De una sola consulta
salen las dos vistas: la vista por concepto se calcula multiplicando cada
concepto por la tasa del pago.

`apiExport_Ingresos_Bancos`: **PENDIENTE** si se duplica `apiExport_CxC_Bancos`
o se reutiliza. Recomendación: duplicarlo y agregar forma de pago, moneda del
banco y dirección del cliente; así CxC no cambia ni hay que recapturar sus
datos dorados.

## Contrato de respuesta

`POST reports/flujo-efectivo-ingresos/buscar` (por factura) y
`POST reports/flujo-efectivo-ingresos-por-concepto/buscar` (por concepto)
reciben `{ "dateRange": { "startDate", "endDate" } }` y responden
`{ "data": ReportCashInflowRecord[] }`. Son dos endpoints y no un parámetro
porque el frontend cambia de pestaña cambiando de endpoint (como Ventas); las
dos vistas comparten una sola consulta a FileMaker en caché. Ejemplo con un renglón de
cada tipo y datos inventados: [api_response.json](api_response.json).

- **Todas las filas traen las mismas llaves**, en las dos vistas. Lo que no
  aplica va en `null`: los campos de artículo en la vista por factura (la
  versión anterior ponía `-`) y los de factura en los renglones sin factura.
- **Nombres iguales a los de Ventas** (`ReportSalesRecord` /
  `ReportSalesItemRecord`), incluido el sufijo `Mxn`, para reutilizar columnas
  y etiquetas. Los campos nuevos son los de `pago*`, `banco*` y `tipoRenglon`.
- **Todos los montos en MXN** (**decidido**), mostrando el tipo de cambio de la
  factura y el del banco.
- Montos como número, fechas `YYYY-MM-DD`.
- Encabezados de las clasificaciones desde `tenant/column-labels`, como en
  Ventas (en el CSV el encabezado dice "Centro de consumo", que es un valor).

### Columnas

Aplica: **P** = pago aplicado · **S** = sin aplicar · **N** = no identificado.
Vista: **F** = por factura · **C** = por concepto. "Prorr." = se multiplica por
`pagoTasa`. El origen en FileMaker se completa cuando exista el layout; donde
se conoce, es el campo que ya usan Ventas o CxC.

| #     | Encabezado anterior              | Campo de respuesta            | Tipo   | Aplica | Vista | Origen en FileMaker (por confirmar)                 | Nota |
| ----- | -------------------------------- | ----------------------------- | ------ | ------ | ----- | --------------------------------------------------- | ---- |
| nuevo | —                                | `tipoRenglon`                 | text   | P S N  | F C   | calculado                                           | filtro lista |
| 0     | Fecha del Pago                   | `pagoFecha`                   | date   | P S N  | F C   | Banco `_fecha` (P: por el portal `PagosVenta`)      | fecha del movimiento de banco; ver paso 1 |
| 1     | Banco Transaccion ID             | `bancoFolioTransaccion`       | number | P S N  | F C   | Banco `__id_bancoITM`                               | mismo nombre que en CxC |
| 2     | Banco Nombre                     | `bancoNombre`                 | text   | P S N  | F C   | `contBANCO_::datos_nombre`                          | filtro lista |
| 3     | Banco Forma Pago                 | `bancoFormaPago`              | text   | P S N  | F C   | `_idu_formaPago_v0_22_1`                            | solo la clave (`03`) |
| 4     | Cliente Nombre                   | `cliente`                     | text   | P S N  | F C   | `…::destLocal_dirNombreComercial`                   | `NO IDENTIFICADO` en N |
| 5     | Cliente Razón Social             | `clienteRazonSocial`          | text   | P S    | F C   | `…::fiscal_RazonSocial`                             | |
| 6     | Cliente RFC                      | `clienteRfc`                  | text   | P S    | F C   | `…::fiscal_RFC`                                     | |
| 7     | Cliente Cuenta Contable          | `clienteCuentaContable`       | text   | P S    | F C   | `…::cuentaContableTemp_v0_20_2r`                    | vacía en toda la muestra |
| 8–11  | (clasificaciones del cliente)    | `clasificacion1–4`            | text   | P S    | F C   | como CxC                                            | filtro lista |
| 12    | Venta ID                         | `ventaId`                     | number | P      | F C   | `__id_venta`                                        | |
| 13    | Factura UUID                     | `facturaUuid`                 | text   | P      | F C   | `cfdi_UUID`                                         | una remisión trae `REMISIÓN-…` |
| 14    | Factura Folio                    | `facturaSerieFolio`           | text   | P      | F C   | `cfdi_facturaSerieFolio_v0_18_1`                    | `F-3111`, `NOTA-3590` |
| 15    | Factura Fecha                    | `facturaFecha`                | date   | P      | F C   | `cfdi_FacturaFechaTimbrar`                          | puede ser posterior al pago |
| 16    | Factura Gran Total (MXN)         | `facturaGranTotalMxn`         | number | P      | F C   | `monto_GranTotal`                                   | completo, **no** prorrateado |
| 17    | Factura Uso CFDI                 | `facturaUsoCfdi`              | text   | P      | F C   | `_idu_cdfi_usoCDFI`                                 | |
| 18    | Factura Metodo Pago              | `facturaMetodoPago`           | text   | P      | F C   | `_idu_cdfi_metoPago`                                | PPD / PUE |
| 19    | Factura Status Actual (hoy)      | `facturaEstatus`              | text   | P      | F C   | regla de Ventas                                     | **de hoy**, no del periodo |
| 20    | Factura Saldo Actual (hoy)       | `facturaSaldoActual`          | number | P      | F C   | `saldo_Pendiente_GranTotal`                         | **de hoy**, no del periodo |
| 21    | Factura Tasa Pagada              | `pagoTasa`                    | number | P      | F C   | calculado: pago ÷ gran total                        | la de **este pago**, no la acumulada |
| 22    | Factura Rep de Venta             | `facturaRepDeVenta`           | text   | P      | F C   | como CxC                                            | |
| 23    | Factura Rep de Cobranza          | `facturaRepDeCobranza`        | text   | P      | F C   | como CxC                                            | |
| 24–25 | Factura Original Serie y Folio / Fecha | —                       |        |        |       |                                                     | **PENDIENTE**: vacías en toda la muestra; recomendación: quitarlas |
| 26    | Observaciones en CFDI            | `observacionesEnCfdi`         | text   | P      | F C   | `cfdi_Observaciones_v0_18_4`                        | |
| 27–28 | Bodega ID / Nombre               | `bodegaId`, `bodegaNombre`    | number / text | P | F C | `_id_bodega`, `bodega_nombre`                       | |
| 29–33 | Artículo SKU / Marca / Nombre / Nombre Completo / Cuenta Contable | `articuloSku`, `articuloMarca`, `articuloNombre`, `articuloNombreCompleto`, `articuloCuentaContable` | text | P | C | como Ventas por concepto | |
| 34–37 | (clasificaciones del artículo)   | `categoriadeProducto1–4`      | text   | P      | C     | como Ventas por concepto                            | vacías en la muestra; encabezado desde `tenant/column-labels` |
| 38    | Clave de Producto o Servicio     | `claveDeProductoOServicio`    | text   | P      | C     | como Ventas por concepto                            | |
| 39    | Cantidad                         | `cantidad`                    | number | P      | C     | `qty`                                               | completa, **no** prorrateada (ver paso 4) |
| 40–41 | Unidad de Venta / de Contenido   | `unidadDeVenta`, `unidadDeContenido` | text | P  | C     | como Ventas por concepto                            | |
| 42–43 | Contenido Unitario / Sub Total   | `contenidoUnitario`, `contenidoSubTotal` | number | P | C | como Ventas por concepto                          | completos, no prorrateados |
| 44    | Precio Unitario                  | `precioUnitario`              | number | P      | C     | como Ventas por concepto                            | no prorrateado |
| 45    | Importe sin Descuento (MXN)      | `importeSinDescuentoMxn`      | number | P      | F C   | factura o concepto                                  | Prorr. |
| 46    | Descuento Monto (MXN)            | `descuentoMontoMxn`           | number | P      | F C   | factura o concepto                                  | Prorr. |
| 47    | Importe con Descuento (MXN)      | `importeConDescuentoMxn`      | number | P      | F C   | factura o concepto                                  | Prorr. |
| 48    | IVA (MXN)                        | `ivaMxn`                      | number | P      | F C   | factura o concepto                                  | Prorr. |
| 49    | IEPS (MXN)                       | `iepsMxn`                     | number | P      | F C   | factura o concepto                                  | Prorr. |
| 50    | IVA Retenido (MXN)               | `ivaRetenidoMxn`              | number | P      | F C   | factura o concepto                                  | Prorr. |
| 51    | ISR Retenido (MXN)               | `isrRetenidoMxn`              | number | P      | F C   | factura o concepto                                  | Prorr. |
| 52    | Pago Gran Total (MXN)            | `pagoGranTotalMxn`            | number | P S N  | F C   | P: `app_MXN_GranTotal` · S N: saldo por complementar × TC | **la cifra principal del reporte** |
| 53    | Credito Gran Total (MXN)         | `creditoGranTotalMxn`         | number | P      | F C   | `venta_\|CLIENTE_\|_x_clienteID::credito.monto.Autorized` | **decidido**: crédito autorizado al cliente para venderle; es dato del cliente, no se prorratea |
| 54    | Tipo de Concepto                 | `tipoDeConcepto`              | text   | P      | C     | como Ventas por concepto                            | |
| 55    | Método de Adquisición            | `metodoDeAdquisicion`         | text   | P      | C     | como Ventas por concepto                            | compra o lote de producción; si es lote, su número de serie (`P-IPA-005`) |
| 56    | Costo Directo (Unitario) (MXN)   | `costoDirectoUnitarioMxn`     | number | P      | C     | `unit_margin_costo`                                 | no prorrateado |
| 57    | Costo Directo (SubTotal) (MXN)   | `costoDirectoSubTotalMxn`     | number | P      | F C   | `sub_margin_costo`                                  | Prorr. |
| 58    | Ganancia Bruta (MXN)             | `gananciaBrutaMxn`            | number | P      | F C   | calculado: importe con descuento − costo subtotal   | sobre los montos prorrateados |
| 59    | Costo Tasa                       | `costoTasa`                   | number | P      | F C   | calculado: costo subtotal ÷ importe con descuento   | |
| 60    | Margen Tasa                      | `margenTasa`                  | number | P      | F C   | calculado: 1 − `costoTasa`                          | |
| 61    | Artículo Nombre (repetido)       | `articuloPresentacion`        | text   | P      | C     | `venta_\|inv_Presentation_\|_x_ventaID::nombreInterna` (portal `Conceptos`) | nombre de la presentación ("Botella .355 ml"); se renombra |
| 62–65 | Cliente Colonia / Delegacion / Ciudad / Estado | `clienteColonia`, `clienteDelegacion`, `clienteCiudad`, `clienteEstado` | text | P S | F C | como Ventas | ocultas por defecto |
| 66    | Cliente ID                       | `clienteId`                   | number | P S    | F C   | `…::___id_cliente`                                  | |
| 67    | Cliente Rep de Venta             | `clienteRepDeVenta`           | text   | P S    | F C   | como CxC                                            | el vigente del cliente |
| 68    | Factura Fecha de Captura         | `facturaFechaDeCaptura`       | date   | P      | F C   | `area_fechaVenta`                                   | |
| 69    | Factura TipoDeCambio             | `facturaTipoDeCambio`         | number | P      | F C   | `tc_tipoCambioValor_v0_25_3`                        | |
| 70    | Factura Moneda                   | `facturaMoneda`               | text   | P      | F C   | `_idu_tc_moneda_v0_16_0`                            | |
| 71    | Factura Gran Total (en moneda timbrado) | `facturaGranTotalOriginal` | number | P    | F C   | gran total MXN ÷ TC, como Ventas                    | |
| 72    | Banco Moneda                     | `bancoMoneda`                 | text   | P S N  | F C   | `contBANCO…::_idu_moneda`                           | |
| 73    | Banco Tipo De Cambio a MXN       | `bancoTipoDeCambio`           | number | P S N  | F C   | `tc_tipoCambioValor_v0_26_1`                        | |

Columnas 9–11, 35–36 y 74–77 del CSV no tienen encabezado; las primeras son
clasificaciones (ya cubiertas), las últimas están vacías y no se incluyen.

## Lógica de negocio

### 1. Rango y fecha que cuenta

- El usuario elige un rango (`startDate` a `endDate`, ambos inclusive).
- **Decidido:** se filtra por **fecha del pago**, no por fecha de liquidación.
  Un abono parcial sale aunque la factura siga con saldo (9 renglones
  "Vigente: Vencida" en la muestra).
- **Decidido (12/11/2026): la "fecha del pago" es siempre la del movimiento
  de banco**, también en los pagos con complemento
  (`venta_|contBanco.ITM|_x_ventaID::_fecha` en el portal `PagosVenta`; `_fecha`
  en el layout de bancos). Es lo que hace el reporte anterior. Cada depósito
  cae en un solo mes, y el total del periodo es dinero que entró al banco en
  ese periodo.
- Validado contra el reporte anterior con FileMaker real: noviembre 01–12
  (25 renglones, $83,647.51), octubre por factura (105 renglones,
  $1,544,913.10) y octubre por concepto (187 renglones). Mismos pagos, mismas
  fechas e importes al centavo.
- Este reporte ya no coincide con Cuentas por cobrar en la fecha: CxC cuenta
  una aplicación en la fecha del complemento. Son preguntas distintas (qué
  entró al banco / qué se debe).
- Historia: la primera versión (rama `feat/reporte-flujo-efectivo-ingresos`)
  usaba la fecha del complemento (`fecha_ingresoITM_fechaDelComplemento`, que
  nunca viene vacía: sin complemento trae la del ingreso). Se descartó porque
  noviembre 01–12 daba $187,330.32: incluía $103,682.81 depositados en meses
  anteriores y complementados en noviembre.
- El título de la versión anterior dice "Facturas por Fecha del Timbre" en
  una vista y "Conceptos por Fecha del Pago" en la otra; las dos filtran por
  fecha del pago. El reporte nuevo no usa la fecha de timbrado para filtrar.

### 2. Consultas a FileMaker

- **Pagos (`apiExport_Ingresos_Pagos`)**: campo de fecha del portal
  `PagosVenta` entre `startDate` y `endDate`. No se filtra por estatus de la
  factura. El mapper genera un renglón solo por cada pago del portal cuya
  fecha está en el rango.
- **Bancos (`apiExport_Ingresos_Bancos`)**: `_fecha` en el rango,
  `monto_ORIG_abono_v0_22_1` `>0` y `saldo_ORIG_porComplementar_v0_22_1` `>0`.
  Los cargos no salen: el reporte es de ingresos.
- Portales con `limit.<portal>` alto (el Data API los corta a 50).
- **Movimientos sin banco (folio de banco = 0). Decidido: no salen.** Una
  nota de crédito puede liquidar una factura: el movimiento se registra pero
  no se asigna a un banco y trae `__id_bancoITM` = 0. No es dinero que entró
  al banco. El mapper descarta los renglones de `PagosVenta` con folio 0 o vacío.
- **Anticipos. Decidido: salen como cualquier pago.** Se registran igual, como
  renglón de `PagosVenta` con su movimiento de banco.

### 3. Tipo de renglón

| Origen | Condición                                                        | `tipoRenglon`          |
| ------ | ---------------------------------------------------------------- | ---------------------- |
| Pagos  | siempre                                                          | `Pago aplicado`        |
| Bancos | el ingreso tiene cliente (`_concil_id_cliente` distinto de vacío y de 0) | `Pago sin aplicar` |
| Bancos | sin cliente                                                      | `Pago no identificado` |

### 4. Cálculo de cada campo

**Pago aplicado**

- `pagoGranTotalMxn` = monto aplicado a esa factura en MXN (`app_MXN_GranTotal`).
- `pagoTasa` = `pagoGranTotalMxn` ÷ `facturaGranTotalMxn`. Cuadra en las 91
  filas de la muestra. Ej. F-1963: 3,500 ÷ 20,109.60 = 0.17405.
- **Decidido: importes prorrateados.** Cada importe, impuesto y costo
  subtotal = valor de la factura (vista F) o del concepto (vista C) ×
  `pagoTasa`. En cada fila:
  importe con descuento + IVA + IEPS − IVA retenido − ISR retenido =
  `pagoGranTotalMxn` (cuadra en las 91 filas, tolerancia $0.02).
- Vista por concepto: `pagoGranTotalMxn` del renglón = gran total del concepto
  × `pagoTasa`; la suma de los conceptos de un pago da el pago.
- **PENDIENTE (recomendación: dejarlo como hoy):** `cantidad`,
  `contenidoSubTotal`, `precioUnitario` y `costoDirectoUnitarioMxn` **no** se
  prorratean. Con dos abonos a la misma factura la cantidad sale dos veces;
  sumar `cantidad` en este reporte no da piezas vendidas.
- `importeSinDescuentoMxn` − `descuentoMontoMxn` = `importeConDescuentoMxn`.
  La versión anterior, en la vista por factura, repite el importe con
  descuento en "sin descuento" (F-3107: 827.59 / 177.31 / 827.59; por concepto
  sí trae 1,004.90). Se corrige.
- `gananciaBrutaMxn`, `costoTasa`, `margenTasa`: sobre los montos
  prorrateados. Con importe 0 las tasas van en `null`.
- `facturaEstatus` y `facturaSaldoActual` (**decidido**): los de **hoy**, no
  los del periodo. El encabezado de la columna lo dice ("actual").
- `facturaGranTotalMxn` y `facturaGranTotalOriginal`: completos, sin prorratear.
- **Moneda (decidido):** todo en MXN; `facturaTipoDeCambio`, `bancoMoneda` y
  `bancoTipoDeCambio` muestran con qué se convirtió. Toda la muestra es MXN.
- `creditoGranTotalMxn` = `credito.monto.Autorized` del cliente, tal cual.
- Vista por factura: campos de artículo → `null`.

**Pago sin aplicar**

- `pagoGranTotalMxn` = `saldo_ORIG_porComplementar_v0_22_1` ×
  `tc_tipoCambioValor_v0_26_1`: solo lo que falta por aplicar, no el depósito
  completo (movimiento 7388: $48).
- Datos del cliente desde el ingreso (como en CxC). Campos de factura y de
  artículo → `null`. Sale igual en las dos vistas.
- **PENDIENTE (recomendación: igual que CxC):** si el ingreso del cliente es
  menor que el depósito, el sobrante sale aparte como `Pago no identificado`.

**Pago no identificado**

- `pagoGranTotalMxn` = saldo por complementar × TC.
- `cliente` = `NO IDENTIFICADO`; el resto de cliente, factura y artículo → `null`.

**Todos**

- Fechas de FileMaker (`MM/DD/YYYY`) → `YYYY-MM-DD`; vacía → `null`.
- Textos con `trim()`.
- **PENDIENTE (recomendación: 2 decimales):** redondeo de montos. La versión
  anterior trae 8 decimales; con 2, la suma de los conceptos puede diferir un
  centavo del pago.

### 5. Exclusiones y casos límite

| Caso                                             | Regla                                         |
| ------------------------------------------------ | --------------------------------------------- |
| Remisión sin CFDI (`NOTA-3590`)                  | **sale** (está en la muestra)                 |
| Pago de centavos (F-2556: $0.47)                 | **sale**                                      |
| Factura "No Cobrar" con pago en el rango         | **sale** (F-2868 en la muestra)               |
| Factura pagada antes de timbrarse                | **sale** (F-3273)                             |
| Factura **cancelada** con pago en el rango       | **PENDIENTE**; recomendación: sale, con estatus `Cancelada` (el dinero sí entró) |
| Cargo de banco (devolución a un cliente)         | no sale: es egreso                            |
| Depósito con saldo por complementar 0            | no sale como "sin aplicar"                    |

### 6. Orden de las filas

1. Por tipo: `Pago aplicado`, `Pago sin aplicar`, `Pago no identificado`
   (la versión anterior pone los no identificados al final).
2. `pagoFecha` ascendente.
3. `bancoFolioTransaccion`, luego `ventaId`, luego el orden de los conceptos
   en la venta.

### 7. Cuadres para validar

- Σ `pagoGranTotalMxn` de la vista por factura = la de la vista por concepto.
- Por depósito: Σ renglones del mismo `bancoFolioTransaccion` ≤ monto del depósito.
- En cada `Pago aplicado`: importe con descuento + IVA + IEPS − retenciones =
  `pagoGranTotalMxn`.
- Contra la versión anterior, mismo rango: mismos pagos, fechas e importes
  (hecho con octubre 2026 y noviembre 01–12).
- **PENDIENTE:** ¿Σ del reporte = Σ abonos del reporte de Bancos en el mismo
  rango? Solo si todo abono está aplicado a facturas o tiene saldo por
  complementar; un abono aplicado a otra cosa (préstamo, otros ingresos)
  quedaría fuera de este reporte.

## Resumen / KPIs

Cifras de la muestra, 01/10/2026 al 31/10/2026:

| KPI                          | Monto         |
| ---------------------------- | ------------- |
| Ingresos del periodo (total) | $1,544,913.10 |
| · Aplicado a facturas        | $247,497.44   |
| · Sin aplicar (con cliente)  | $48.00        |
| · No identificado            | $1,297,367.66 |

**PENDIENTE:** cifra principal ("Resultado"). Recomendación: el total, con el
desglose por tipo y por banco en el panel lateral.

## Casos que deben estar en los datos dorados

- [ ] pago que liquida una factura completa (`pagoTasa` = 1)
- [ ] abono parcial (factura sigue con saldo)
- [ ] dos pagos a la misma factura dentro del rango
- [ ] dos pagos a la misma factura, uno dentro y otro fuera del rango (solo sale el primero)
- [ ] un depósito aplicado a varias facturas
- [ ] depósito aplicado en parte, con sobrante sin aplicar (aplicado + `Pago sin aplicar`)
- [ ] `Pago no identificado`
- [ ] pago el primer y el último día del rango (ambos salen)
- [ ] factura con varios conceptos (la suma de conceptos da el pago)
- [ ] concepto con descuento
- [ ] concepto con IEPS o con retenciones
- [ ] remisión sin CFDI
- [ ] factura timbrada después del pago
- [ ] factura "No Cobrar" con pago
- [ ] factura cancelada con pago (según lo que se decida)
- [ ] factura o depósito en dólares (conversión y tipos de cambio)
- [ ] factura con más de 50 conceptos o pagos (el portal no se recorta)
- [ ] cliente sin clasificaciones
- [ ] texto con espacios al final (se recorta)
- [ ] factura con crédito (`creditoGranTotalMxn`), cuando se defina

## Datos dorados: primer borrador (12/11/2026)

> Historia: este borrador usaba la fecha del complemento. Los datos dorados
> vigentes son los de la sección "borrador con fecha del banco".

En `datos-dorados/`: `entrada-pagos.json` (8 ventas), `entrada-bancos.json`
(3 movimientos), ambos anonimizados, y `rango.json` = 01/10/2026 a 31/10/2026.
El borrador sale de un script aparte que aplica esta ficha (no del código del
reporte): `esperado-factura-borrador.json` (11 filas) y
`esperado-concepto-borrador.json` (30 filas). Las dos vistas suman $593,488.01.

Contra el reporte anterior (mismos movimientos y ventas), todos los montos
coinciden al centavo en las dos vistas. Diferencias, todas esperadas:

- `pagoFecha`: 6 de 8 pagos cambian de día dentro de octubre (fecha del
  complemento en lugar de la del banco).
- `importeSinDescuentoMxn` en la vista por factura de F-3107, NOTA-3590 y
  F-3186: el anterior repetía el importe con descuento.
- `facturaEstatus` y los formatos de abajo.

Casos cubiertos: liquidación completa, abono parcial, dos pagos a la misma
factura, pagos de la misma factura fuera del rango (2238, 2892), venta con
todos sus pagos fuera del rango (3699, no sale), un depósito aplicado a varias
facturas (7390), varios conceptos, concepto con descuento, remisión sin CFDI,
factura timbrada después del pago, "No Cobrar", pago de centavos, sobrante sin
aplicar, no identificado, observaciones con salto de línea.

Faltan (segundo juego): pago el primer y el último día del rango, factura
cancelada con pago, nota de crédito (folio de banco 0), anticipo, dólares,
IEPS o retenciones, más de 50 conceptos o pagos, cliente sin clasificaciones
en un pago aplicado.

**Decidido (12/11/2026, borrador aprobado):** lo que salió al armar el
borrador queda como lo usa el borrador. Los puntos 3 y 4 ya no aplican: el
layout se amplió con `venta_|inv_Presentation_|_x_ventaID::nombreInterna` y
`area_fechaVenta`, y las dos columnas van en la respuesta.

1. `facturaEstatus`: `Liquidado` · `Vigente` · `No Cobrar` · `Cancelada`, desde
   `saldo_isPendiente_Cobrado_NoCobrar_Cancelado`. El anterior separaba
   "Vigente: Vencida / Por vencer", que depende del día en que se consulta;
   para tenerlo, los datos dorados necesitarían una fecha "hoy" fija.
2. Sobrante de un depósito con dos ingresos (movimiento 7388: $2,016 a un
   cliente y $1,008 a otro): sale como `Pago sin aplicar` con el cliente de
   `CLIENTE.ingreso`, igual que el anterior. **No** se aplica la división de
   CxC, porque `contINGRESO_::monto_MXN_GranTotal` es del otro ingreso y
   mandaría los $48 a "no identificado". Límite: con varios ingresos el layout
   solo da un cliente.
3. `articuloPresentacion`: el layout trae solo `_id_presentacion` (1, 2), no
   el nombre ("Botella .355 ml"). No está en el borrador; falta el campo o se
   quita la columna.
4. `facturaFechaDeCaptura`: `area_fechaVenta` no está en el layout. No está en
   el borrador (venía vacía en el anterior).
5. `tipoDeConcepto`: `Producto` / `Servicio` / `Activo` desde
   `itm_is_0product_1servicio_2activo`. El anterior decía "Producto Terminado".
6. `precioUnitario` = `unit_mont_GranTotal` (con impuestos), como el anterior;
   Ventas por concepto usa el precio sin impuestos.
7. Formatos como Ventas por concepto: `metodoDeAdquisicion` = `Lote: P-IPA-005`,
   `claveDeProductoOServicio` = `50202300-Bebidas no alcohólicas`,
   `unidadDeVenta` = `H87`.
8. Redondeo: montos a 2 decimales, tasas a 6.

## Datos dorados: borrador con fecha del banco (12/11/2026)

Mismas 8 ventas, recapturadas con `_fecha` del banco en `PagosVenta`; mismo
rango (octubre 2026). `esperado-factura-borrador.json` tiene 13 filas y
`esperado-concepto-borrador.json` 38; las dos vistas suman $605,327.66.

Contra el reporte anterior de octubre: **fechas y montos coinciden en los 13
pagos** (antes 6 de 8 fechas diferían). La venta 3699 (F-3273) ahora sí sale
en octubre, con sus dos pagos del 16/10 y 30/10 ($11,839.65). Siguen las
diferencias ya decididas (importe sin descuento, estatus, formatos).

**Confirmado (12/11/2026):** el sobrante de $48 del movimiento 7388 está bien
como `Pago sin aplicar` con el cliente de `CLIENTE.ingreso`. En ese depósito
se combinaron dos clientes (un movimiento poco común); el reporte anterior lo
muestra con cliente en una vista y como "NO IDENTIFICADO" en la otra. Se deja
así.

**Confirmado con FileMaker real:** las columnas de presentación del artículo y
fecha de captura salen bien en las dos pestañas.

Pendiente: segundo juego de datos dorados (cancelada con pago, nota de
crédito, anticipo, dólares, IEPS o retenciones); lo captura la persona.
