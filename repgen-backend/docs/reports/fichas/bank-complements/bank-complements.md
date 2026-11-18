# Ficha: Bancos con desglose de complementos

> Basada en el reporte FM "RELACIÓN DE PAGOS" (CSV "REPORTE B2 COMPLEMENTOS",
> base BBVA, periodo 01/10/2026 al 31/10/2026: 189 movimientos, 135 renglones
> de detalle). Los PENDIENTE se aprobaron el 18/11/2026 tal como los recomendaba la ficha.
> Guía: [docs/guides/COMO-AGREGAR-REPORTE.md](../../../../../docs/guides/COMO-AGREGAR-REPORTE.md)

- Nombre interno: `bank-complements`
- Endpoint: `reports/bancos-complementos/buscar`
- Ruta frontend y reportId: `/bancos/complementos`, reportId `bancos_complementos`.
  Bancos tiene dos pestañas (como Ventas con Facturas / Conceptos):
  **Movimientos** (`/bancos/movimientos`, el reporte de hoy, sigue con reportId
  `bancos`) y **Complementos** (este). `/bancos` redirige a Movimientos.
- Layout FileMaker: `apiExport_Bancos_Complementos` (tabla base `contBanco.ITM`)
- Tipo: **rango de fechas**
- Campo de fecha del rango: `_fecha` (la del movimiento de banco, igual que Movimientos)
- ¿Filtra por permisos del usuario?: **sí**, igual que Bancos:
  `contBanco.ITM|contBANCO_|_x_bancoID::datos_nombre` y `getBankBaseFilters`
  (incluye `_id_banco = 0`, las notas de crédito no bancarizadas).

> **Estado (18/11/2026): implementado, validado contra FileMaker.**
> Código: `repgen-backend/src/reports/*/bank-complements/` y
> `repgen-frontend/src/features/reports/bank-complements/`. El mapper produce
> exactamente `__golden__/esperado.json` (`bank-complements.golden.spec.ts`).
> Comparación (paso 6 de la guía), octubre 2026 BBVA, base real: la
> exportación de RepGen ("REPORTE A1 COMPLEMENTOS", 203 renglones) contra
> "Relación de pagos" de FM (B2): mismos 189 movimientos y 203 renglones, en
> el mismo orden; los 33 campos que trae B2 coinciden salvo el folio de 7509,
> que el CSV de FM recorta (`ZSD2-...1047858`) y RepGen da completo. RFC,
> forma de pago, estado, método de pago y venta ID no están en B2: no se
> compararon (salen directo de FileMaker).

## Qué muestra

El reporte de Bancos actual da un renglón por movimiento y solo resume a qué
se aplicó ("[7] Diferentes Facturas"). Este lo **desglosa**:

```
Movimiento (contBanco.ITM) 1─N Conciliación (contINGRESO / contEGRESO) 1─N Complemento (ITM) N─1 Factura
```

**Decidido: un renglón por complemento.** Los datos del movimiento y de la
conciliación se repiten en cada renglón.

| Caso                            | Renglones                                     | Ejemplo (octubre 2026)                   |
| ------------------------------- | --------------------------------------------- | ---------------------------------------- |
| Conciliación con N complementos | N                                             | 7390: 1 ingreso, 7 facturas, REP PA-2042 |
| Movimiento con 2 conciliaciones | uno por complemento de cada una               | 7388: ingresos 2957 y 2958, dos clientes |
| Conciliación sin complementos   | 1, con pago y factura en `null`               | 7360, 7421: egreso "SIN COMPLEMENTAR"    |
| Movimiento sin conciliar        | 1, con conciliación, pago y factura en `null` | 7526, 7488: SIN IDENTIFICAR              |

**Decidido: alcance = todos los movimientos del periodo**, incluidos los SIN
IDENTIFICAR, las notas de crédito no bancarizadas y las transferencias entre
bancos. Lo que queda sin conciliar de un movimiento conciliado en parte (7388:
$48) **no** genera renglón propio: se ve en `bancoSaldoPorIdentificar`.

En octubre 2026 (BBVA): 189 movimientos → 68 sin conciliar + 135 renglones de
conciliación/complemento = **203 renglones**.

## Contrato de respuesta

`POST reports/bancos-complementos/buscar` recibe el mismo cuerpo que Bancos
(`dateRange`) y responde `{ "data": ReportBankComplementRecord[] }`. Ejemplo
con un renglón de cada tipo (datos anonimizados): [api_response.json](api_response.json).

- **Todas las filas traen las mismas 38 llaves.** Lo que no aplica al renglón
  va en `null` (p. ej. pago y factura de una conciliación sin complementos).
  Un texto que sí aplica pero viene vacío en FileMaker va en `""`; un número o
  una fecha vacíos, en `null`.
- Montos como número, fechas ISO `YYYY-MM-DD` (FileMaker manda `MM/DD/YYYY`).
- Los saltos de línea de FileMaker (`\r`) en textos se cambian por un espacio
  (7562 y 7563 traen uno en el concepto).
- Nombres con las convenciones de los reportes nuevos (`banco*`, `pago*`,
  `factura*`, como Ingresos y CxC), no los del reporte Bancos viejo
  (`nombre_banco`, `idTransaccionBanco`): es otro reportId, no hay vistas
  guardadas que romper. **Decidido (18/11/2026).**

### Columnas: encabezado de FM → respuesta → FileMaker

Prefijos: `B:` = `contBanco.ITM|contBANCO_|_x_bancoID::` (portal `Banco`),
`I:` = `contBanco.ITM|contINGRESO_|_x_bancoItmID::` (portal `contIngreso`),
`E:` = `contBanco.ITM|contEGRESO_|_x_bancoItmID::` (portal `contEgreso`),
`CI:` = `contBanco.ITM|CLIENTE.ingreso|_x_bancoItmID::` (en `contIngreso`),
`PE:` = `contBanco.ITM|PROV.egreso|_x_bancoItmID::` (en `contEgreso`),
`II:` = `contBanco.ITM|contINGRESO.ITM|_x_bancoItmID::` y `V:` = `contBanco.ITM|VENTA|_x_bancoItmID::` (portal `ComplementosIngreso`),
`EI:` = `contBanco.ITM|contEgreso.ITM|_x_bancoItmID::` y `PF:` = `contBanco.ITM|poFACTURA|_x_bancoItmID::` (portal `ComplementosEgreso`).

| #   | Encabezado FM (B2)                                     | Campo                              | Encabezado RepGen                   | Tipo   | Origen (ingreso / egreso)                                                                     | Regla                                                   |
| --- | ------------------------------------------------------ | ---------------------------------- | ----------------------------------- | ------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Transaccion \| ID                                      | `bancoFolioTransaccion`            | Banco Transacción ID                | number | `__id_bancoITM`                                                                               |                                                         |
| 2   | Transaccion \| Fecha                                   | `bancoFecha`                       | Banco Fecha                         | date   | `_fecha`                                                                                      |                                                         |
| 3   | Banco \| Nombre y Numero                               | `bancoNombre`                      | Banco Nombre                        | text   | `B:datos_nombre`                                                                              | FM las junta: "BBVA Ingresos - 0120047430"              |
| 4   | (ídem)                                                 | `bancoNumeroCuenta`                | Banco Número de Cuenta              | text   | `B:datos_cuentaNumero`                                                                        |                                                         |
| 5   | Banco \| Cuenta Contable                               | `bancoCuentaContable`              | Banco Cuenta Contable               | text   | fieldData `contBanco.ITM\|satCUENTA_\|_satCuentaIDU::cuenta_codigoAg_v0_21_2_1`               | `B:cuentaContable_Temp_v0_20_2r` viene vacío: no se usa |
| 6   | Banco \| Moneda                                        | `bancoMoneda`                      | Banco Moneda                        | text   | `B:_idu_moneda`                                                                               |                                                         |
| 7   | Banco \| TC a MXN                                      | `bancoTipoDeCambio`                | Banco Tipo de Cambio                | number | `tc_tipoCambioValor_v0_26_1`                                                                  |                                                         |
| 8   | —                                                      | `bancoFormaPago`                   | Banco Forma de Pago                 | text   | `_idu_formaPago_v0_22_1`                                                                      | no está en B2; sí en Bancos                             |
| 9   | Transaccion \| Concepto Bancaria                       | `bancoConcepto`                    | Banco Concepto                      | text   | `mConceptoDeBancoTexto_v0_20_0`                                                               | `\r` → espacio                                          |
| 10  | Transaccion \| Monto Abono                             | `bancoAbono`                       | Banco Abono                         | number | `monto_ORIG_abono_v0_22_1`                                                                    | moneda del banco; vacío → `null`                        |
| 11  | Transaccion \| Monto Cargo                             | `bancoCargo`                       | Banco Cargo                         | number | `monto_ORIG_cargo_v0_22_1`                                                                    | ídem                                                    |
| 12  | Transaccion \| Saldo Corriente                         | `bancoSaldoResultante`             | Banco Saldo Resultante              | number | `monto_ORIG_bancoRunningSaldo`                                                                |                                                         |
| 13  | Transaccion \| Saldo Por Conciliar                     | `bancoSaldoPorIdentificar`         | Banco Saldo por Identificar         | number | `saldo_ORIG_porID_v0_22_1`                                                                    |                                                         |
| 14  | Transaccion \| Saldo Por Complementar                  | `bancoSaldoPorComplementar`        | Banco Saldo por Complementar        | number | `saldo_ORIG_porComplementar_v0_22_1`                                                          |                                                         |
| 15  | Transaccion \| Complemento Texto                       | `bancoTextoComplemento`            | Banco Texto al Complementar         | text   | `mConciliacionTexto_parteDelCOMPLEMENTO_v0_22_1`                                              | "[7] Diferentes Facturas", "SIN COMPLEMENTAR"           |
| 16  | Conciliacion \| Tipo de Transaccion + Emisor o Destino | `tipoTransaccion`                  | Tipo de Transacción                 | text   | calculado (paso 3)                                                                            |                                                         |
| 17  | Conciliacion \| ID Ingreso                             | `ingresoId`                        | Ingreso ID                          | number | `I:__id_ingreso` / `null`                                                                     |                                                         |
| 18  | Conciliacion \| ID Egreso                              | `egresoId`                         | Egreso ID                           | number | `null` / `E:__id_egreso`                                                                      |                                                         |
| 19  | —                                                      | `conciliacionEstado`               | Conciliación Estado                 | text   | `I:isT_Abierto_Cerrado` / `E:isT_Abierto_Cerrado`                                             | Abierto / Cerrado                                       |
| 20  | Conciliacion \| Monto Total                            | `conciliacionMontoTotal`           | Conciliación Monto Total            | number | `I:monto_MXN_GranTotal` / `E:monto_MXN_GranTotal`                                             | MXN                                                     |
| 21  | Conciliacion \| Monto Complementado                    | `conciliacionMontoComplementado`   | Conciliación Monto Complementado    | number | calculado: suma de `pagoGranTotalMxn` de sus complementos                                     | sin complementos → `0`                                  |
| 22  | Conciliacion \| Saldo Por Complementar                 | `conciliacionSaldoPorComplementar` | Conciliación Saldo por Complementar | number | calculado: monto total − complementado                                                        |                                                         |
| 23  | Conciliacion \| ID Cliente / ID Proveedor              | `clienteProveedorId`               | Cliente/Proveedor ID                | number | `I:_concil_id_cliente` o `I:_concil_id_prov` / `E:_concil_id_prov` o `E:_concil_id_cliente`   | el que no esté vacío                                    |
| 24  | Conciliacion \| ID Transferencia entre Bancos          | `bancoTransferenciaId`             | Banco Transferencia ID              | number | `I:_concil_id_egresoIDtransfer\|v0.18.1` / `E:_concil_id_ingresoIDtransfer\|v0.18.1`          |                                                         |
| 25  | Conciliacion \| Nombre                                 | `clienteProveedor`                 | Cliente/Proveedor Nombre Comercial  | text   | `CI:destLocal_dirNombreComercial` / `PE:local_NombreComercial`                                |                                                         |
| 26  | Conciliacion \| RFC o Grupo                            | `clienteProveedorRazonSocial`      | Cliente/Proveedor Razón Social      | text   | `CI:fiscal_RazonSocial` / `PE:fiscal_RazonSocial`                                             | ver paso 4                                              |
| 27  | —                                                      | `clienteProveedorRfc`              | Cliente/Proveedor RFC               | text   | `CI:fiscal_RFC` / `PE:fiscal_RFC`                                                             |                                                         |
| 28  | Complemento \| Monto                                   | `pagoGranTotalMxn`                 | Pago Gran Total (MXN)               | number | `II:app_MXN_GranTotal` / `EI:app_MXN_GranTotal`                                               |                                                         |
| 29  | Complemento \| Fecha Realizada                         | `pagoFecha`                        | Pago Fecha                          | date   | `II:fecha_ingresoITM_fechaDelComplemento` / `EI:fecha_egresoITM_fechaDelComplemento_v0_20_2r` |                                                         |
| 30  | Complemento \| Periodo Fiscal                          | `pagoPeriodoFiscal`                | Pago Periodo Fiscal                 | text   | `II:fecha_fiscalDisplay_v0_21_3_2r` / `EI:fecha_fiscalDisplay_v0_21_3_2`                      | "Octubre 2026", tal cual FM                             |
| 31  | Complemento \| Folio                                   | `pagoFolio`                        | Pago Folio                          | text   | calculado (paso 5)                                                                            |                                                         |
| 32  | Complemento \| UUID                                    | `pagoUuid`                         | Pago UUID                           | text   | `II:cfdiCompPago_uuid` / `EI:cPagoCFDI_UUID_v0_15_1`                                          | UUID del REP                                            |
| 33  | Relacionado \| Factura Folio                           | `facturaSerieFolio`                | Factura Serie y Folio               | text   | `V:cfdi_facturaSerieFolio_v0_18_1` / `PF:cfdi.serie\|v0.15.1` + "-" + `PF:cfdi_folio`         |                                                         |
| 34  | Relacionado \| Factura Fecha                           | `facturaFecha`                     | Factura Fecha                       | date   | `V:cfdi_FacturaFechaTimbrar` / `PF:cfdi_fecha`                                                |                                                         |
| 35  | Relacionado \| Factura Monto                           | `facturaGranTotal`                 | Factura Gran Total                  | number | `V:monto_GranTotal` / `PF:monto_MXN_GranTotal`                                                | ver Moneda                                 |
| 36  | Relacionado \| Factura UUID                            | `facturaUuid`                      | Factura UUID                        | text   | `V:cfdi_UUID` / `PF:cfdi.UUID`                                                                |                                                         |
| 37  | —                                                      | `facturaMetodoPago`                | Factura Método de Pago              | text   | `V:_idu_cdfi_metoPago` / `PF:cfdi_isPPDoPUE_v0_15_1`                                          | PPD / PUE                                               |
| 38  | —                                                      | `ventaId`                          | Venta ID                            | number | `II:_id_relacionado_Venta` / `null`                                                           |                                                         |

Columnas de B2 que **no** se replican:

- "Conciliacion Texto" del movimiento ("Yema / TIENDAS TRES B"): es el resumen
  de los nombres, y aquí cada renglón ya trae el suyo.
- "Conciliacion \| Cuenta Contable": en B2 trae nombres corridos o nada (130 de 135 vacíos).
- "Periodo Inicio / Final": es el rango pedido.

Campos del layout que no van a la respuesta: `_id_banco` (solo filtra),
`I:_concil_id_*`/`E:_concil_id_*` sobrantes, `I:special.Texto`,
`E:special.Razon`, `I:cfdiNotaCredOrCargo_SerieFolio_v0_20_2r`,
`E:cfdi_serieFolio_v0_18_1` (vacíos en toda la muestra; se revisan con el
segundo juego), `II:__idu_ingreso_itm`, `II:_id_relacionado_Egreso`,
`EI:_id_relacionado_Ingreso`, `EI:_idu_relacionado_PoFactura`,
`*:app_tc_complemento_v0_28_1`, y los campos sueltos de serie/folio/fecha del
REP y de la factura que solo sirven para armar `pagoFolio` y `facturaSerieFolio`.

## Lógica de negocio

### 1. Búsqueda

Una petición por rango sobre `_fecha` en `apiExport_Bancos_Complementos`, con
los filtros de permisos de Bancos (`BaseReportService`). Un complemento con
fecha fuera del rango sale igual si el movimiento está en el rango (7357:
movimiento del 2 oct, complemento del 12 nov, periodo fiscal Noviembre 2026).

Límite de portales: el máximo real es 7 complementos por movimiento (7390) y
2 conciliaciones (7388, 7403); el Data API corta en 50, así que no hace falta
pedir `limit.<portal>` por ahora.

### 2. De un registro a renglones

1. Conciliaciones = renglones de `contIngreso` + renglones de `contEgreso`, en ese orden.
2. Sin conciliaciones → **1 renglón** "Sin identificar" con todo lo de
   conciliación, pago y factura en `null`.
3. Por cada conciliación, sus complementos son los renglones de
   `ComplementosIngreso` con `II:_id_ingreso` = `I:__id_ingreso` (o de
   `ComplementosEgreso` con `EI:_id_egreso` = `E:__id_egreso`). **No** se
   asume que todos los complementos del movimiento son de la misma
   conciliación (7388).
4. Sin complementos → **1 renglón** con pago y factura en `null`.
5. Con complementos → un renglón por complemento, en el orden del portal.

### 3. Tipo de transacción

FM usa dos columnas ("PAGO DE" + "CLIENTE"); aquí van en una:

| Conciliación | ID no vacío   | `tipoTransaccion`           |
| ------------ | ------------- | --------------------------- |
| ingreso      | cliente       | `Pago de cliente`           |
| ingreso      | proveedor     | `Pago de proveedor`         |
| ingreso      | transferencia | `Transferencia desde banco` |
| egreso       | proveedor     | `Pago a proveedor`          |
| egreso       | cliente       | `Pago a cliente`            |
| egreso       | transferencia | `Transferencia a banco`     |
| ninguna      | —             | `Sin identificar`           |

En octubre BBVA solo aparecen `Pago de cliente` (92), `Pago a proveedor` (43)
y `Sin identificar` (68). **Decidido (18/11/2026): una sola columna.**

### 4. Nombre, razón social y RFC

Vienen de la conciliación, no del complemento (7388: cada ingreso es de un
cliente distinto; 7360: egreso sin complementos con su proveedor).

"RFC o Grupo" de B2 **no es el RFC**: en clientes trae la razón social y en
proveedores viene vacío aunque el proveedor la tenga (7360: SIGMA ETIQUETAS).
**Decidido (18/11/2026):** dar razón social y RFC por separado para clientes
y proveedores, como los demás reportes, en lugar de replicar "RFC o Grupo".

### 5. Folio del pago

Regla de FM (cuadra en los 135 renglones de B2):

1. Si el complemento tiene REP → serie-folio del REP: `II:cfdiCompPago_Serie` + "-" + `II:cfdiCompPago_Folio`
   (egreso: `EI:cPagoCFDI_serie_v0_15_1` + "-" + `EI:cPagoCFDI_folio_v0_15_1`). Ej. `PA-2042`.
2. Si no, y la factura es PUE → `Factura PUE` (no lleva REP; `pagoUuid` = `""`).
3. Si no → `""` (PPD todavía sin REP: 7377, 7522).

### 6. Orden

Fecha del movimiento, ID del movimiento y, dentro del movimiento, el orden
del paso 2 (el de FileMaker).

### 7. Cuadres para validar

Por movimiento, con los renglones de la muestra (los 17 cuadran):

- abono o cargo = Σ `conciliacionMontoTotal` (una vez por conciliación) + `bancoSaldoPorIdentificar`
- abono o cargo = Σ `pagoGranTotalMxn` + `bancoSaldoPorComplementar`
- por conciliación: `conciliacionMontoTotal` = `conciliacionMontoComplementado` + `conciliacionSaldoPorComplementar`

## Resumen / KPIs

**Decidido (18/11/2026):** abono y cargo se repiten en cada renglón del
mismo movimiento, así que el pie y los KPIs los suman **una vez por
`bancoFolioTransaccion`**; "Resultado" = abonos − cargos (neto, como
Bancos). `pagoGranTotalMxn` sí se suma por renglón. Sin sumar monedas
distintas (igual que `totalesBancos`): una cifra por moneda.

Implementado así en el resumen, en "Flujo neto" y en la fila de totales de la
tabla (`TotalesTabla.unaVezPor`, agregado con visto bueno el 18/11/2026).

Panel lateral: abonos, cargos, pagos complementados (Σ `pagoGranTotalMxn`),
saldo por complementar y saldo por identificar (una vez por movimiento).

## Moneda

Abono, cargo y saldos del movimiento vienen en la moneda del banco (`ORIG`).
Montos de conciliación, pago y factura vienen en MXN: `V:monto_GranTotal`
(factura de venta) ya está en MXN aunque el nombre no lo diga (confirmado el
18/11/2026; Ingresos lo usa igual como `facturaGranTotalMxn`). Los montos del
movimiento se quedan en su moneda (la columna `bancoMoneda` lo dice). Se valida con el segundo juego cuando haya un
movimiento en USD.

## Encabezado "Conciliación"

El test `repgen-frontend/src/features/reports/shared/nombres-columnas.test.ts`
exige que cada encabezado empiece con una entidad conocida, y "Conciliación"
no está en la lista. **Decidido (18/11/2026):** agregar `"Conciliación"` a `ENTIDADES`
(una conciliación puede ser ingreso o egreso; repetir columnas por cada uno
duplicaría 4 columnas).

## Anomalías de los datos (para decidir)

- 7403: dos conciliaciones del mismo cliente; la factura relacionada es una
  remisión (`NOTA-3590`) con UUID `REMISIÓN-C607D8C9`. Se muestra tal cual.
- Razón social vacía en algunos clientes y proveedores (7403, 7377). Se muestra `""`.
- 7562 y 7563 son ingresos registrados en **BBVA Egresos**. Se muestran como
  "Pago de cliente" en ese banco, igual que FM.
- 7369, 7377, 7522: concepto bancario vacío.
- 7509: el CSV de FM recorta un folio largo de proveedor (`ZSD2-...1047858`);
  RepGen lo da completo (`ZSD2-6291047858`). Es una diferencia esperada en la comparación.

Comprobado contra los 135 renglones de B2 (respuesta completa de octubre):
pasos 2 y 5 y el monto complementado (= suma de los complementos) dan los
mismos renglones, en el mismo orden, salvo el folio recortado de 7509.

## Casos que deben estar en los datos dorados

En `repgen-backend/src/reports/infrastructure/bank-complements/__golden__/`:
[entrada-bancos.json](../../../../src/reports/infrastructure/bank-complements/__golden__/entrada-bancos.json) (17 movimientos, anonimizados),
[rango.json](../../../../src/reports/infrastructure/bank-complements/__golden__/rango.json) (octubre 2026) y [esperado.json](../../../../src/reports/infrastructure/bank-complements/__golden__/esperado.json)
(26 renglones, armado desde B2 con un script aparte y aprobado el 18/11/2026).

- [x] Conciliación con varios complementos y un REP (7390: 7 renglones, abonos parciales $0.47 / $0.53)
- [x] Movimiento con dos conciliaciones de clientes distintos y saldo sin identificar (7388: $48)
- [x] Dos conciliaciones del mismo cliente (7403)
- [x] Una conciliación, dos facturas (7348)
- [x] Complemento en un mes distinto al del movimiento (7357, Noviembre 2026)
- [x] Egreso sin complementos (7360, 7421)
- [x] Egreso con factura PPD sin REP: folio `""` (7377, 7522)
- [x] "Factura PUE" en ingreso (7383, 7403, 7407, 7530) y en egreso (7369)
- [x] Sin identificar: abono (7488) y cargo (7526)
- [x] Concepto con `\r` (7562, 7563) y concepto vacío (7369, 7377, 7522)
- [ ] Transferencia entre bancos (ingreso y egreso), nota de crédito no bancarizada
      (`_id_banco = 0`), movimiento en USD, egreso con REP de proveedor, egreso a
      cliente: **no hay en octubre BBVA** → segundo juego `__golden__/reciente/`.
