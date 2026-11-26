# Ficha: Flujo de efectivo - Egresos

> Basada en el reporte de la versión anterior "GASTOS" (CSV `Egresos Sans.csv`,
> periodo 01/11/2026 al 25/11/2026, 99 filas, una por concepto). Es la réplica
> de [Flujo de efectivo - Ingresos](../cash-inflows/cash-inflows.md) del lado
> de compras: lo que no se dice aquí se hace igual que allá. Lo marcado
> **PENDIENTE** lo decide la persona dueña del reporte. Guía:
> [docs/guides/COMO-AGREGAR-REPORTE.md](../../../../../docs/guides/COMO-AGREGAR-REPORTE.md)

- Nombre interno: `cash-outflows`
- Endpoints: `reports/flujo-efectivo-egresos/buscar` (por factura) y
  `reports/flujo-efectivo-egresos-por-concepto/buscar` (por concepto)
- Ruta frontend y reportId: `/flujo_efectivo_egresos`
- Tipo: **rango de fechas**, por la **fecha del movimiento de banco** (como Ingresos)
- Pestañas: **Facturas** y **Conceptos**, como Ingresos
- ¿Filtra por permisos del usuario?: **PENDIENTE**. Recomendación: igual que
  Ingresos, solo los cargos sin aplicar y no identificados (layout de bancos)
  por los bancos que el usuario puede ver.

> **Estado (25/11/2026): ficha aprobada.** Los **PENDIENTE** con
> recomendación se aprobaron tal como dice la recomendación; se conservan para
> saber de dónde salió cada regla. Siguen abiertos: si FileMaker marca los
> traspasos, los cargos duplicados (se revisan en FileMaker) y el CSV de la
> vista por factura. Siguiente paso: la persona crea los dos layouts y pega
> sus respuestas.

## Qué muestra

El dinero que **salió del banco** en el periodo y a qué factura de compra se
aplicó. Cada pago aplicado sale con los datos de la factura de compra (o de
cada concepto) y sus importes prorrateados por lo pagado. Además salen los
cargos del periodo que todavía no se aplican a ninguna factura.

| Vista        | Una fila por…             | Filas en la muestra |
| ------------ | ------------------------- | ------------------- |
| Por factura  | pago × factura            | 25 + 57 sin factura |
| Por concepto | pago × factura × concepto | 42 + 57 sin factura |

La muestra es solo la vista por concepto. **PENDIENTE:** ¿existe en la
versión anterior una vista "por factura" de egresos? Si existe, pasar el CSV
del mismo periodo para comparar.

## Tipos de renglón

| `tipoRenglon`            | Qué es                                                                                       | Filas            | Monto en la muestra |
| ------------------------ | -------------------------------------------------------------------------------------------- | ---------------- | ------------------- |
| `Pago aplicado`          | parte de un cargo aplicada a una factura de compra                                           | 42 (25 facturas) | $333,193.09         |
| `Pago sin aplicar`       | cargo a un proveedor identificado, con saldo por aplicar                                     | 10               | $91,701.15          |
| `Pago no identificado`   | cargo sin proveedor                                                                          | 38               | $694,540.79         |
| `Traspaso entre cuentas` | cargo cuyo texto del banco dice `TRASPASO ENTRE CUENTAS` (no existía en la versión anterior) | 9                | $997,500.00         |
| **Total**                |                                                                                              | 99               | **$2,116,935.03**   |

En la versión anterior se distinguían por el texto `NO COMPLEMENTADO` en
"Factura #OC" y `NO IDENTIFICADO` en el proveedor.

## Fuentes: ¿se reutilizan los layouts de Ingresos?

**No directamente.** Los dos layouts de Ingresos están armados del lado del
cliente; Egresos necesita el lado del proveedor.

| Fuente             | Layout propuesto           | Parte de                                                             | Por qué no el de Ingresos                                                                                                                                                                                                                                         |
| ------------------ | -------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cargos sin aplicar | `apiExport_Egresos_Bancos` | **duplicar `apiExport_CxP_Bancos`**                                  | `Ingresos_Bancos` trae al cliente (`CLIENTE.ingreso`) y el portal de ingresos. `CxP_Bancos` ya tiene el proveedor del egreso (`PROV.egreso`), `contEGRESO_::_concil_id_prov`, `monto_ORIG_cargo_v0_22_1`, el saldo por complementar y el portal `contEgreso.ITM`. |
| Pagos aplicados    | `apiExport_Egresos_Pagos`  | tabla base **facturas de compra** (`poFactura`), como `CxP_Facturas` | `Ingresos_Pagos` es de Ventas.                                                                                                                                                                                                                                    |

**PENDIENTE: duplicar o ampliar `CxP_Bancos`.** Recomendación: duplicarlo
(como se hizo con Ingresos) para no tocar CxP ni recapturar sus datos dorados.

### `apiExport_Egresos_Bancos` (copia de `CxP_Bancos`)

Agregar:

| Campo                                                | Para qué                  |
| ---------------------------------------------------- | ------------------------- |
| `_idu_formaPago_v0_22_1`                             | `bancoFormaPago`          |
| `contBanco.ITM\|contBANCO_\|_x_bancoID::_idu_moneda` | `bancoMoneda`             |
| `mConceptoDeBancoTexto_v0_20_0` (ya está)            | ver pregunta de traspasos |

Se pueden quitar los campos del lado ingreso (`PROV.ingreso`, `contINGRESO_`,
portal `contINGRESO.ITM`). Darle nombre de objeto al portal `contEgreso.ITM`.

Búsqueda: `_fecha` en el rango, `monto_ORIG_cargo_v0_22_1` `>0` y
`saldo_ORIG_porComplementar_v0_22_1` `>0`.

### `apiExport_Egresos_Pagos` (nuevo, base `poFactura`)

Campos de la factura: los de `CxP_Facturas` (proveedor, OC, UUID, serie y
folio, fecha, gran total MXN, observaciones, estatus, saldo, rep de compra,
importes e impuestos MXN, moneda, TC).

Portal **`PagosCompra`** (`poFactura_|cont.EGRESO_ITM|_x_facturaIDU`, el que
usa `CxP_Facturas` con el nombre `PagosVenta`, que conviene corregir en la
copia): hoy trae `app_MXN_GranTotal`, TC del complemento y fecha del
complemento. **Falta el movimiento de banco**, igual que le faltaba a Ingresos:

| Campo (por la ocurrencia de banco del egreso)       | Para qué                          |
| --------------------------------------------------- | --------------------------------- |
| `contBanco.ITM::_fecha`                             | `pagoFecha` y el filtro del rango |
| `contBanco.ITM::__id_bancoITM`                      | `bancoFolioTransaccion`           |
| `contBanco.ITM::_idu_formaPago_v0_22_1`             | `bancoFormaPago`                  |
| `contBanco.ITM::tc_tipoCambioValor_v0_26_1`         | `bancoTipoDeCambio`               |
| `contBANCO::datos_nombre`, `contBANCO::_idu_moneda` | `bancoNombre`, `bancoMoneda`      |

Portal **`Conceptos`** (`poITM` de la factura): los campos de
`apiExport_CompraITM` (SKU, marca, nombre, nombre completo, cuenta contable,
clasificaciones 1–4, `is_stock_incrementable_gasto_costo`, `qty_Ordered`,
unidad, `unit_MXN_*`, `recibir_fecha`, bodega). **PENDIENTE:** si `poITM`
tiene campos de subtotal (`sub_…`), agregarlos; con solo `unit_*` × cantidad
el redondeo puede diferir (la lección de Ingresos).

### Revisión de los layouts (26/11/2026)

Capturas: `apiExport_Egresos_Bancos` (170 movimientos del 01 al 24/11) y
`apiExport_Egresos_Pagos` (27 facturas).

**Bancos: listo.** Respuesta y schema guardados
(`Egresos_Bancos_ResponseFM`, 3 registros anonimizados). Con cargo `>0` y saldo
por complementar `>0` salen **exactamente los 57 movimientos del CSV**, con
los mismos montos. Proveedor por `contEGRESO_::_concil_id_prov` en los 10
"sin aplicar". El portal tiene nombre de objeto (`contEgreso.ITM`).

**Pagos: falta corregir.** Montos bien: en las 27 facturas el pago del portal
y la suma de `sub.MXN.GranTotal` de los conceptos dan el gran total, y los
folios de banco coinciden con el CSV. El layout ya trae los `sub.MXN.*`
(no hace falta multiplicar `unit_*` × cantidad).

| #   | Qué                                                                                              | Por qué                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Portales **sin nombre de objeto**                                                                | Ponerles `PagosCompra` y `Conceptos`; hoy la llave es el nombre de la ocurrencia y se rompe si la renombran.                                                                                                                      |
| 2   | El nombre y la moneda del banco en `PagosCompra` vienen de `poFactura_\|cont.BANCO_\|_x_bancoID` | Es el **banco asignado a la factura**, no el del movimiento. Hoy coinciden (todo es BBVA Egresos); un pago desde otra cuenta saldría con el banco equivocado. Tomarlos del banco del movimiento (`contBancoITM__` → `contBANCO`). |
| 3   | Faltan las clasificaciones del artículo en `Conceptos`                                           | `categoriadeProducto1–4` (como `inv.ITM.classify1–4::name_v0_20_0` en `CompraITM`).                                                                                                                                               |
| 4   | Ninguna factura tiene dos pagos                                                                  | No se puede comprobar que `contBancoITM__\|_x_id_egreso` dé el banco de **cada** pago y no el del primero. Capturar una factura con abonos parciales.                                                                             |

**Pagos corregido (26/11/2026): listo.** Portales `PagosCompra` y
`Conceptos` con nombre de objeto; banco y moneda del movimiento por
`contBanco__|_x_id_bancoITM`; clasificaciones por
`invITM_classify1–4_|_x_idu_classify1–4::name_v0_20_0`, que salen por
concepto ("Textile" en la clasificación 4 de las gorras de la OC 1832, igual
que el CSV). Respuesta y schema guardados (`Egresos_Pagos_ResponseFM`: OC 1723,
1832, 1851 y 877, anonimizadas; el nombre del artículo de honorarios traía el
nombre de una persona y se cambió a mano).

La OC 877 (09/2025) tiene **dos pagos** y cada renglón trae su propio
movimiento (4224 y 4217): la relación es por pago, no por factura.

**Pagos sin banco.** El movimiento 4224 de la OC 877 ($19,788.96) tiene forma
de pago `17` (compensación) y **no tiene banco** (nombre y moneda vacíos).
Es el equivalente a la nota de crédito de Ingresos (folio 0): no es dinero que
salió del banco. **Decidido (por analogía con Ingresos): no sale.** El mapper
descarta los renglones de `PagosCompra` sin banco. Para no depender de que el
nombre venga vacío, conviene agregar al portal `contBancoITM__::_id_banco` y
descartar con `_id_banco` vacío o 0.

### Hallazgos en los datos (26/11/2026)

- **Pagos registrados dos veces.** Los movimientos aplicados a facturas
  (7575, 7656, 7660, 7661, 7663, 7703, 7704) **no traen texto del banco**: se
  capturaron a mano. Cada uno tiene su gemelo importado del estado de cuenta,
  con proveedor o sin él, mismo día y mismo monto, que sigue sin aplicar
  (7555, 7626, 7628, 7627, 7631, 7693, 7692). El texto del gemelo nombra la
  misma factura ("PAGO F A552 NUUKTAL" = factura A-552 pagada con 7656). El
  dinero salió una vez y el reporte lo cuenta dos: **$333,932.15**.
  7703/7704 son nuevos (las facturas 1864 y 1865 se complementaron después
  del CSV) y difieren por centavos de sus gemelos (143,372.99 vs 143,372.70;
  153,077.64 vs 153,077.44). Se corrige en FileMaker: complementar el
  movimiento importado y borrar el capturado a mano.
- **Traspasos.** FileMaker no los marca con un campo; solo el texto del banco
  dice `TRASPASO ENTRE CUENTAS`. Son 9 cargos en BBVA Ingresos por
  **$997,500**, cada uno con su abono gemelo en BBVA Egresos (400,000 → 7646,
  etc.). Esos abonos también salen como "no identificados" en **Flujo de
  efectivo - Ingresos**.
- Los demás cargos de BBVA Ingresos no son traspasos: comisiones bancarias,
  domiciliación Actinver ($85,613.41) y un reembolso de $5,760.

## Contrato de respuesta

Igual que Ingresos: `{ "dateRange": { "startDate", "endDate" } }` →
`{ "data": ReportCashOutflowRecord[] }`, mismas llaves en las dos vistas,
`null` donde no aplica, montos en MXN, fechas `YYYY-MM-DD`. Nombres: los de
Ingresos para pago, banco e importes (se reutilizan columnas del frontend) y
los de Compras por concepto para proveedor y artículo. Ejemplo:
[api_response.json](api_response.json).

### Columnas

**P** = pago aplicado · **S** = sin aplicar · **N** = no identificado.
**F** = por factura · **C** = por concepto. "Prorr." = × `pagoTasa`.

| #     | Encabezado anterior                       | Campo                                         | Tipo   | Aplica | Vista | Origen en FileMaker (por confirmar)                                                  | Nota                                                                                                                                        |
| ----- | ----------------------------------------- | --------------------------------------------- | ------ | ------ | ----- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| nuevo | —                                         | `tipoRenglon`                                 | text   | P S N  | F C   | calculado                                                                            | filtro lista                                                                                                                                |
| 0, 34 | Factura Fecha Pago / Banco Fecha del Pago | `pagoFecha`                                   | date   | P S N  | F C   | banco `_fecha`                                                                       | son la misma fecha en las 99 filas: una sola columna                                                                                        |
| 35    | Banco ID Movimiento                       | `bancoFolioTransaccion`                       | number | P S N  | F C   | `__id_bancoITM`                                                                      |                                                                                                                                             |
| 36    | Banco Nombre                              | `bancoNombre`                                 | text   | P S N  | F C   | `contBANCO::datos_nombre`                                                            |                                                                                                                                             |
| 37    | Banco Forma de Pago                       | `bancoFormaPago`                              | text   | P S N  | F C   | `_idu_formaPago_v0_22_1`                                                             | solo la clave, como Ingresos                                                                                                                |
| 42    | Banco Moneda                              | `bancoMoneda`                                 | text   | P S N  | F C   | `contBANCO::_idu_moneda`                                                             |                                                                                                                                             |
| 43    | Banco Tipo Cambio a MXN                   | `bancoTipoDeCambio`                           | number | P S N  | F C   | `tc_tipoCambioValor_v0_26_1`                                                         |                                                                                                                                             |
| 1     | Proveedor Nombre                          | `proveedor`                                   | text   | P S N  | F C   | `PROV::local_NombreComercial`                                                        | `NO IDENTIFICADO` en N                                                                                                                      |
| 2     | Proveedor Razón Social                    | `proveedorRazonSocial`                        | text   | P S    | F C   | `PROV::fiscal_RazonSocial`                                                           |                                                                                                                                             |
| nuevo | —                                         | `proveedorRfc`                                | text   | P S    | F C   | `PROV::fiscal_RFC`                                                                   | ya está en los layouts; **PENDIENTE** si se agrega                                                                                          |
| 3     | Proveedor Cuenta Contable                 | `proveedorCuentaContable`                     | text   | P S    | F C   | `PROV::cuentaContable_Temp_v0_20_2r`                                                 | ver anomalía 3                                                                                                                              |
| 4     | Factura #OC                               | `compraId`                                    | number | P      | F C   | `poFactura_\|PO_\|_x_po::__id_po`                                                    | sin el prefijo `OC# `, como Compras                                                                                                         |
| 5     | Factura UUID                              | `facturaUuid`                                 | text   | P      | F C   | `cfdi_UUID`                                                                          |                                                                                                                                             |
| 6     | Factura Folio                             | `facturaSerieFolio`                           | text   | P      | F C   | `cfdi_serie_v0_15_1` + `cfdi_folio`                                                  | `Sin Serie-125812818` como Compras                                                                                                          |
| 7     | Factura Fecha                             | `facturaFecha`                                | date   | P      | F C   | `cfdi_fecha`                                                                         | puede ser posterior al pago (Laboratorio, 24/11 vs 13/11)                                                                                   |
| 8     | Factura Gran Total (MXN)                  | `facturaGranTotalMxn`                         | number | P      | F C   | `monto_MXN_GranTotal`                                                                | completo, no prorrateado                                                                                                                    |
| 9     | Factura Observaciones                     | `facturaObservaciones`                        | text   | P      | F C   | `factura_observaciones_v0_18_1`                                                      |                                                                                                                                             |
| 10    | Factura Status Actual (hoy)               | `facturaEstatus`                              | text   | P      | F C   | regla de Compras                                                                     | **de hoy**                                                                                                                                  |
| 11    | Factura Saldo Actual (hoy)                | `facturaSaldoActual`                          | number | P      | F C   | `saldo_MXN_pendiente_GranTotal_saldoGeneral`                                         | **de hoy**                                                                                                                                  |
| 12    | Factura Rep Compra                        | `compraRepDeCompra`                           | text   | P      | F C   | `USER.repComp::userData_nombre_Completo`                                             |                                                                                                                                             |
| 38    | Banco Porcentaje Pagado de la Factura     | `pagoTasa`                                    | number | P      | F C   | calculado: pago ÷ gran total                                                         | 1 en las 42 filas de la muestra                                                                                                             |
| 39    | Factura Moneda                            | `facturaMoneda`                               | text   | P      | F C   | `_idu_moneda\|v0_18_1`                                                               |                                                                                                                                             |
| 40    | Factura Tipo de Cambio                    | `facturaTipoDeCambio`                         | number | P      | F C   | `tc_tipoCambioValor_v0_18_1`                                                         |                                                                                                                                             |
| 41    | Factura Gran Total (en moneda timbrado)   | `facturaGranTotalOriginal`                    | number | P      | F C   | gran total MXN ÷ TC                                                                  |                                                                                                                                             |
| 13    | Artículo SKU                              | `articuloSku`                                 | text   | P      | C     | como Compras por concepto                                                            |                                                                                                                                             |
| 14    | Artículo Marca                            | `articuloMarca`                               | text   | P      | C     |                                                                                      |                                                                                                                                             |
| 15    | Artículo Nombre                           | `articuloNombre`                              | text   | P      | C     |                                                                                      |                                                                                                                                             |
| 16    | Artículo Nombre Completo                  | `articuloNombreCompleto`                      | text   | P      | C     |                                                                                      | vacío en toda la muestra                                                                                                                    |
| 17    | Artículo Cuenta Contable                  | `articuloCuentaContable`                      | text   | P      | C     |                                                                                      | vacío en toda la muestra                                                                                                                    |
| 18–21 | (clasificaciones del artículo)            | `categoriadeProducto1–4`                      | text   | P      | C     | como Compras por concepto                                                            | encabezados desde `tenant/column-labels`                                                                                                    |
| 22    | Articulo Tipo de Gasto                    | `tipoDeConcepto`                              | text   | P      | C     | `is_stock_incrementable_gasto_costo`                                                 | normalizado: `Stock`, `Gasto`, `Incrementable`, `Costo` (como Compras)                                                                      |
| 23    | Articulo Cantidad                         | `cantidad`                                    | number | P      | C     | `qty_Ordered`                                                                        | no prorrateada                                                                                                                              |
| 24    | Articulo Unidad                           | `unidadDeCompra`                              | text   | P      | C     | `sat.UNITventa::unitNombre`                                                          | como Compras                                                                                                                                |
| 25    | Articulo Precio Unitario (MXN)            | `precioUnitario`                              | number | P      | C     | `unit_MXN_importe_SINdescuento`                                                      | no prorrateado                                                                                                                              |
| nuevo | —                                         | `importeSinDescuentoMxn`, `descuentoMontoMxn` | number | P      | F C   |                                                                                      | **PENDIENTE**: el CSV no los trae; recomendación: incluirlos (Prorr.) como Ingresos                                                         |
| 26    | Articulo Importe con Descuento (MXN)      | `importeConDescuentoMxn`                      | number | P      | F C   | factura o concepto                                                                   | Prorr.                                                                                                                                      |
| 27    | Articulo IVA (MXN)                        | `ivaMxn`                                      | number | P      | F C   |                                                                                      | Prorr.                                                                                                                                      |
| 28    | Articulo IEPS (MXN)                       | `iepsMxn`                                     | number | P      | F C   |                                                                                      | Prorr.                                                                                                                                      |
| 29    | Articulo IVA Retenido (MXN)               | `ivaRetenidoMxn`                              | number | P      | F C   |                                                                                      | Prorr.                                                                                                                                      |
| 30    | Articulo ISR Retenido (MXN)               | `isrRetenidoMxn`                              | number | P      | F C   |                                                                                      | Prorr.                                                                                                                                      |
| 31    | Articulo Gran Total (MXN)                 | `pagoGranTotalMxn`                            | number | P S N  | F C   | P: `app_MXN_GranTotal` (× tasa del concepto en C) · S N: saldo por complementar × TC | **la cifra principal**                                                                                                                      |
| 32    | Bodega Entrega Status                     | `bodegaEntregaEstatus`                        | text   | P      | C     | `recibir_fecha`                                                                      | regla de Compras: `Gasto` → `null`; con fecha → `Entregado`; sin fecha → `Pendiente`. El anterior pegaba la fecha ("Entregado: 12/11/2026") |
| nuevo | (ídem)                                    | `bodegaEntregaFecha`                          | date   | P      | C     | `recibir_fecha`                                                                      |                                                                                                                                             |
| 33    | Bodega Nombre                             | `bodegaNombre`                                | text   | P      | C     | `BODEGA::bodega_nombre`                                                              | el anterior pone `-` en los gastos → `null`                                                                                                 |

Columnas 44–77 del CSV no tienen encabezado y están vacías; no se incluyen.

## Lógica de negocio

### 1. Rango y fecha que cuenta

Igual que Ingresos: fecha del **movimiento de banco** (`_fecha`), ambos
extremos inclusive. En la muestra, "Factura Fecha Pago" y "Banco Fecha del
Pago" son iguales en las 99 filas.

### 2. Consultas a FileMaker

- **Pagos (`apiExport_Egresos_Pagos`)**: fecha del banco del portal
  `PagosCompra` en el rango; el mapper descarta los pagos fuera del rango y
  los que no tienen banco (compensaciones, folio 0), como Ingresos.
- **Bancos (`apiExport_Egresos_Bancos`)**: `_fecha` en el rango, cargo `>0`,
  saldo por complementar `>0`. Los abonos no salen.
- Portales con `limit.<portal>` alto.

### 3. Tipo de renglón

| Origen | Condición                                                                                 | `tipoRenglon`                                |
| ------ | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| Pagos  | siempre                                                                                   | `Pago aplicado`                              |
| Bancos | el egreso tiene proveedor (`contEGRESO_::_concil_id_prov` distinto de vacío y de 0)       | `Pago sin aplicar`                           |
| Bancos | sin proveedor                                                                             | `Pago no identificado`                       |
| Bancos | el texto del banco (`mConceptoDeBancoTexto_v0_20_0`) empieza con `TRASPASO ENTRE CUENTAS` | `Traspaso entre cuentas` (se evalúa primero) |

**Decidido (26/11/2026): los traspasos salen con su propio tipo de renglón**,
no se excluyen. Así se ven y se separan del total con el filtro de
`tipoRenglon`. Límite: depende del texto que manda el banco; si el banco lo
cambia, el traspaso cae en `Pago no identificado`. El script de anonimización
conserva ese prefijo para que los datos dorados lo prueben. Lo mismo aplica a
Flujo de efectivo - Ingresos (ver su ficha).

### 4. Cálculo

Como Ingresos: `pagoTasa` = pago ÷ gran total de la factura; importes ×
`pagoTasa`; en la vista por concepto, `pagoGranTotalMxn` = gran total del
concepto × `pagoTasa`. Sin aplicar / no identificado: saldo por complementar
× TC. Sin costo, ganancia ni margen (no aplican a compras).

En la muestra cuadra: Σ conceptos de cada factura = gran total de la factura
(Tres Guerras OC 1834: 525.30 + 438.77 + 2.30 = 966.37).

### 5. Exclusiones — PENDIENTE

- **Tipos de gasto.** El encabezado dice "INCLUIDO: Costos | Gastos |
  Incrementables | Mercancias e Insumos". Recomendación: no filtrar (salen
  todos), con `tipoDeConcepto` como filtro de columna.
- **Traspasos entre cuentas propias: decidido**, tipo de renglón aparte (ver
  paso 3). En la muestra son 9 cargos por $997,500.
- **Factura cancelada con pago**: recomendación igual que Ingresos (sale).

### 6. Orden

Tipo (aplicado, sin aplicar, no identificado), `pagoFecha`,
`bancoFolioTransaccion`, `compraId`, orden de los conceptos.

### 7. Cuadres

- Σ vista por factura = Σ vista por concepto, salvo centavos: cada concepto
  se redondea a 2 decimales y FileMaker trae subtotales con 4 a 6
  (15,578.5245). En los datos dorados difieren por $0.01 los folios 7576,
  7703 y 7704. La versión anterior no redondea el concepto.
- Por cargo: Σ renglones del mismo folio ≤ monto del cargo.
- En cada `Pago aplicado`: importe con descuento + IVA + IEPS − retenciones =
  `pagoGranTotalMxn`.

## Anomalías de la muestra (para revisar en FileMaker)

1. **Cargos que parecen duplicados.** Cinco pagos salen aplicados con un folio
   y, el mismo día y por el mismo monto al mismo proveedor, otra vez como
   "sin aplicar" con otro folio. Suman $37,482.01:

   | Proveedor           | Monto     | Folio aplicado | Folio sin aplicar |
   | ------------------- | --------- | -------------- | ----------------- |
   | Tres Guerras        | 966.37    | 7575           | 7555              |
   | Nuuktal             | 16,286.40 | 7656           | 7626              |
   | Laboratorio ABC     | 2,206.32  | 7661           | 7627              |
   | Laboratorio ABC     | 6,469.32  | 7660           | 7628              |
   | Republica Cervecera | 11,553.60 | 7663           | 7631              |

   ¿Se capturó dos veces el cargo? El reporte mostrará lo que haya en
   FileMaker; se corrige allá.

2. Todas las facturas de la muestra están liquidadas con un solo pago
   (`pagoTasa` = 1): no hay abonos parciales para probar el prorrateo.
3. "Proveedor Cuenta Contable" trae la razón social en Tres Guerras, Grupo
   Lundkar e Insumos Cerveceros.
4. "Insumos Cerveceros de **Oriente**" (nombre) vs "… de **Occidente**" (razón social).
5. Tipo de gasto con mayúsculas mezcladas (`GASTO`/`Gasto`, `STOCK`/`Stock`).

## Resumen / KPIs

Muestra, 01/11/2026 al 25/11/2026:

| KPI                           | Monto         |
| ----------------------------- | ------------- |
| Egresos del periodo (total)   | $2,116,935.03 |
| · Aplicado a facturas         | $333,193.09   |
| · Sin aplicar (con proveedor) | $91,701.15    |
| · No identificado             | $694,540.79   |
| · Traspasos entre cuentas     | $997,500.00   |

Panel lateral como Ingresos (total, desglose por tipo y por banco).

## Casos que deben estar en los datos dorados

Borrador en [datos-dorados/](datos-dorados/), del 01 al 24/11/2026,
anonimizado:

- `entrada-pagos.json`: 27 facturas, 27 pagos, 54 conceptos.
- `entrada-bancos.json`: los 57 cargos que devuelve la consulta (cargo `>0` y
  saldo por complementar `>0`). La captura traía los 170 movimientos del
  periodo; se dejaron solo los que FileMaker devuelve con esa búsqueda.
- `esperado-factura-borrador.json` (84 renglones) y
  `esperado-concepto-borrador.json` (111), armados con un script aparte a
  partir de esta ficha. `hoy` = 2026-11-26 para el estatus.

**Cuadre contra el CSV:** 80 de los 82 folios del CSV en el rango salen
iguales. Los otros dos (7576 y 7583) difieren por $0.01, por el redondeo del
concepto (ver Cuadres). Hay dos folios que el CSV no trae, 7703 y 7704
($296,450.63): las OC 1864 y 1865 se complementaron después de que se
generó el CSV.

| Tipo                   | Renglones (factura / concepto) | Monto         |
| ---------------------- | ------------------------------ | ------------- |
| Pago aplicado          | 27 / 54                        | $629,643.74   |
| Pago sin aplicar       | 10                             | $91,701.15    |
| Pago no identificado   | 38                             | $694,540.79   |
| Traspaso entre cuentas | 9                              | $997,500.00   |
| **Total**              | 84 / 111                       | $2,413,385.68 |

- [x] pago que liquida la factura (`pagoTasa` = 1): los 27
- [ ] abono parcial: no hay en noviembre → test unitario con la OC 877
      (`Egresos_Pagos_ResponseFM`)
- [ ] dos pagos a la misma factura, uno sin banco: OC 877 → test unitario
- [ ] un cargo aplicado a varias facturas: no hay en noviembre
- [ ] cargo aplicado en parte, con sobrante sin aplicar: no hay en noviembre
- [x] `Pago sin aplicar` (10) y `Pago no identificado` (38)
- [x] factura con conceptos de dos tipos: 1723 (Stock + Incrementable), 1832,
      1864 y 1865 (Stock + Gasto)
- [x] conceptos con IVA o ISR retenidos (14 compras, por ejemplo 1834 y 1851)
- [x] concepto con IEPS (OC 1644)
- [x] factura timbrada después del pago (1841, 1842)
- [x] cargo duplicado (anomalía 1): 7575/7555, 7656/7626 y los demás,
      tal como están en FileMaker
- [x] traspaso desde la cuenta de ingresos (9)
- [x] bodega Entregado (19), Pendiente (7) y `null` en gastos (85)
- [ ] estatus Vencida o Vigente: las 27 están liquidadas → test unitario
- [ ] factura sin CFDI: no hay en noviembre → test unitario
- [ ] factura o cargo en dólares: no hay en noviembre
- [ ] factura con más de 50 conceptos: la que más tiene trae 7

## Plan de implementación (aprobado e implementado 26/11/2026)

> **Estado:** backend y frontend hechos según este plan. El mapper, escrito
> aparte del script del borrador, da exactamente los dos esperados, ya
> aprobados en `__golden__/` (`cash-outflows.golden.spec.ts`, `hoy` =
> 2026-11-26). Se revisó en pantalla con un servidor simulado. Falta probar
> contra FileMaker real y comparar con el sistema anterior (fase 6).

Dos layouts y dos vistas, como Ingresos: **use case propio**, no
`BaseReportService`. Se copia la estructura de `cash-inflows` y se reutiliza
lo que ya está compartido.

### Backend (`repgen-backend/src/reports/`)

1. **Tipos** en `packages/shared-types/index.d.ts`: `TipoRenglonEgreso` (los
   4 tipos), `DetalleEgresos` (= `DetalleIngresos`) y
   `ReportCashOutflowRecord` con las llaves de
   [api_response.json](api_response.json). Se reexportan en
   `domain/cash-outflows/index.ts`.
2. **`infrastructure/cash-outflows/`**:
   - `cash-outflows.fields.ts`: layouts, campos y portales (`PagosCompra`,
     `Conceptos`, `contEgreso.ITM`).
   - `egresos-pagos.schema.json` y `egresos-bancos.schema.json`: los schemas
     de esta carpeta.
   - `cash-outflows.query.ts`: Pagos por la fecha del portal; Bancos por fecha,
     cargo `>0`, saldo `>0` y los permisos de banco del usuario
     (`getBankBaseFilters`, como Ingresos).
   - `cash-outflows.mapper.ts`: `cleanData(pagos, bancos, rango, detalle, hoy)`
     con la lógica de esta ficha.
3. **Se reutiliza, no se copia:**
   - De `shared/compras.ts`: `estatusCompra`, `serieFolioCompra` y
     `granTotalOriginal`.
   - Se mueve ahí la normalización del tipo de gasto (`TIPOS` de
     `purchase-items.mapper.ts`) y Compras por concepto la importa.
   - `enRango` y `tipoCambio` del mapper de Ingresos pasan a `shared/` y los
     usan los dos mapeadores.
4. **`application/cash-outflows/get-cash-outflows-report.use-case.ts`**: copia
   del de Ingresos, con caché de lo crudo compartida por las dos vistas
   (clave `egresos_…` con usuario). Se registra en `reports.module.ts` y en
   los `index.ts`, con dos endpoints en `reports.controller.ts`.
5. **Tests:**
   - `cash-outflows.golden.spec.ts` con `__golden__/` y `hoy` = 2026-11-26.
   - `cash-outflows.query.spec.ts`.
   - `cash-outflows.mapper.spec.ts`, un `it` por regla:
     - el traspaso se evalúa antes que proveedor;
     - `_concil_id_prov` 0 o vacío da no identificado;
     - un pago sin banco no sale (OC 877, movimiento 4224);
     - abono parcial prorrateado (OC 877, movimiento 4217);
     - pago fuera del rango;
     - estatus Vencida y Vigente;
     - factura sin CFDI;
     - un gasto no lleva bodega;
     - subtotales de 4 a 6 decimales redondeados por concepto.
   - Test del use case como el de Ingresos.

### Frontend (`repgen-frontend/src/features/reports/cash-outflows/`)

6. Copia de `cash-inflows/`:
   - `egresos.schema.json` (columnas de esta ficha, encabezados iguales a los
     de Ingresos y Compras cuando es el mismo `field`).
   - `columnas.ts`.
   - `calcularEgresos.ts`: total, los 4 tipos y desglose por banco.
   - `ReporteFlujoEgresos.tsx`: pestañas Facturas / Conceptos con
     `TabsVentas`, y en el panel "Por tipo" una línea "Traspasos entre
     cuentas".
   - Tests.
   - Ruta `/flujo_efectivo_egresos/:reportType` (lazy + precarga) y entrada en
     `Sidebar.tsx`, debajo de Ingresos.
   - `reportId`: `flujo_efectivo_egresos_facturas` y
     `flujo_efectivo_egresos_conceptos`.
7. Revisión en pantalla con el servidor simulado (puerto 3901) y el preview
   `repgen-frontend-mock`, usando los datos dorados.

### Fuera de este cambio

- **Traspasos en Ingresos** (decidido, por implementar): son unas 10 líneas
  en el mapper, el tipo y el panel de Ingresos. Va en un PR aparte después
  de este.
- `contBancoITM__::_id_banco` en `PagosCompra`: mientras no exista, un pago
  sin banco se reconoce por el nombre del banco vacío o el folio 0.
- Generalizar la pantalla de Ingresos y Egresos en un solo componente: no
  por ahora. Se copia (≈200 líneas) y se revisa si llega un tercer flujo.

### Antes de empezar (persona)

- ~~Copiar `datos-dorados/` a `__golden__/`~~ Hecho (26/11/2026).

Verificación: `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm typecheck:shared`.
