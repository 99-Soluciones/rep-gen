# Ficha: Cuentas por pagar (por compras)

> Basada en el reporte del ERP "Estado de cuenta: saldo general de proveedores"
> (CSV, corte 24/11/2026 10:49, 644 filas). Es la contraparte de
> [Cuentas por cobrar](../receivables/receivables.md): misma estructura, con
> proveedor en lugar de cliente y cargos y abonos al revés. Donde no se dice
> otra cosa, la regla es **la misma que en CxC**. Lo marcado **PENDIENTE** lo
> decide la persona dueña del reporte. Guía:
> [docs/guides/COMO-AGREGAR-REPORTE.md](../../../../../docs/guides/COMO-AGREGAR-REPORTE.md)

> **Estado (25/11/2026): implementado, falta probarlo contra FileMaker real.**
> Código: `repgen-backend/src/reports/*/payables/` y
> `repgen-frontend/src/features/reports/payables/`. El mapper produce
> exactamente los dos juegos de `__golden__/` (`payables.golden.spec.ts`) y,
> sobre la respuesta completa de SANS al 25/11/2026, los mismos totales que el
> ERP salvo las diferencias explicadas (5327 y decisión 10). Encabezados de
> banco: los mismos que en CxC porque el campo es el mismo (regla de
> `nombres-columnas.test.ts`): "Banco Cargo Saldo No Aplicado (A Favor)" y
> "Banco Abono Saldo No Aplicado (En Contra)", vistos desde la empresa (el ERP
> los rotula al revés en CxP).

- Nombre interno: `payables`
- Endpoint: `reports/cuentas-por-pagar/buscar`
- Ruta frontend: `/cuentas_por_pagar` (nueva entrada en el menú, después de Compras)
- ¿Filtra por permisos del usuario?: no, igual que CxC (el acceso se controla
  desde FileMaker).
- Vista por proveedor (resumen): segunda fase, igual que la pestaña "Clientes"
  de CxC. Esta ficha cubre solo la vista **por compras**.

## Decisiones (24/11/2026)

1. **Corte histórico, como CxC.** El usuario elige la fecha de corte (por
   defecto hoy) y el saldo se reconstruye a ese día: saldo de hoy + lo que se
   pagó o aplicó después del corte.
2. **Una compra existe al corte si `area_fechaEnPagos` ≤ corte** (fecha de
   aprobación, la misma del reporte de Compras). **No se exige UUID**: 292 de
   las 506 facturas de la muestra no lo tienen.
3. **"No pagar" como "No cobrar" en CxC**: salen, con saldo pendiente,
   vencido y por vencer en `0` y su saldo en `facturaNoPagarMonto`. El ERP lo
   suma también al saldo pendiente; RepGen no.
4. **Cargo no identificado** = cargo de banco con saldo ≠ 0 cuyo egreso no
   tiene proveedor **ni** cliente (comisiones y nómina incluidas). Un cargo
   con cliente es una devolución y ya sale en CxC.
5. **Proveedor Grupo** no se incluye (vacío en las 644 filas).
6. **Gran total en moneda original** = gran total MXN / TC, como en Compras
   (`facturaGranTotalOriginal`). En el ERP sale $0.00 casi siempre, incluso
   en USD: es un error del ERP.
7. **Provisiones**: segunda versión (fecha programada, monto provisionado,
   por provisionar y cuenta). Solo se podrían mostrar como están hoy.
8. Se agrega **`facturaDiasVencida`** (antigüedad), como en CxC.
10. **Aplicaciones a compras sin CFDI sí cuentan** (decidido 25/11/2026): un
    pago aplicado a una compra sin CFDI baja el saldo del cargo, igual que en
    la compra (decisión 2). El ERP no las descuenta y muestra el cargo con más
    saldo (folios 1357, 1384 y 2313 en SANS).
9. **Sin fecha de cancelación** (decidido 24/11/2026): FileMaker no la
   guarda. Una compra cancelada sale del área aprobada (pierde
   `area_fechaEnPagos`), así que desaparece también de cortes pasados, igual
   que en el reporte de Compras. Límite aceptado: una compra cancelada después
   del corte no sale en ese corte aunque ese día sí se debía.

## Fuentes: seis tipos de renglón

| Tipo en el ERP               | Filas | Total muestra  | `tipoTransaccion`           | Equivale en CxC a          |
| ---------------------------- | ----- | -------------- | --------------------------- | -------------------------- |
| Factura Vigente: Vencido     | 102   | $9,647,838.61  | `Factura vencida`           | Factura vencida            |
| Factura Vigente: Por Vencer  | 29    | $1,023,537.31  | `Factura por vencer`        | Factura por vencer         |
| Factura Cerrada: No Pagar    | 375   | $16,025,000.24 | `Factura cerrada: No pagar` | Factura cerrada: No cobrar |
| Cargos con Saldo por Aplicar | 76    | $423,794.44    | `Cargo por aplicar`         | Abono por aplicar          |
| Abono con Saldo por Aplicar  | 17    | $30,422.30     | `Abono por aplicar`         | Cargo por aplicar          |
| Cargos No Identificados      | 45    | $518,515.30    | `Cargo no identificado`     | Abono no identificado      |

- **Cargo por aplicar**: pago a un proveedor que todavía no se aplica del todo
  a sus compras (anticipo, pago de más).
- **Abono por aplicar**: dinero que devolvió un proveedor y no se ha aplicado.

**Dos layouts**, como en CxC:

| Fuente                 | Layout                   | Tabla base      | Copiar campos de                             | Datos dorados           |
| ---------------------- | ------------------------ | --------------- | -------------------------------------------- | ----------------------- |
| Facturas (compras)     | `apiExport_CxP_Facturas` | `poFACTURA_`    | `apiExport_Compra`                           | `entrada-facturas.json` |
| Bancos (cargos/abonos) | `apiExport_CxP_Bancos`   | `contBanco.ITM` | `apiExport_CxC_Bancos` (cliente → proveedor) | `entrada-bancos.json`   |

## Contrato de respuesta

`POST reports/cuentas-por-pagar/buscar` recibe `{ "fechaCorte": "YYYY-MM-DD" }`
y responde `{ "fechaCorte": "YYYY-MM-DD", "data": ReportPayablesRecord[] }`.
Ejemplo con un renglón de cada tipo y datos inventados:
[api_response.json](api_response.json).

Mismas reglas que CxC: todas las filas con las mismas llaves; lo que no aplica
al tipo va en `null`; montos como número y **en MXN**; fechas ISO; textos con
`trim()`. Nombres: `proveedor*` como en Compras; los campos que ya existen en
Compras con el mismo dato conservan su nombre (`compraId`,
`compraRepDeCompra`, `facturaFechaLimiteDePago`, `facturaGranTotalOriginal`,
`bodegaEntregaEstatus`…).

### Encabezados del ERP → respuesta → FileMaker

F = factura (vigente o No pagar) · C = cargo por aplicar · A = abono por
aplicar · N = cargo no identificado. **Fac.** = `CxP_Facturas`, **Ban.** =
`CxP_Bancos`. `P:` = `poFactura_|PROV_|_x_provID::` (igual que en Compras).
En Ban., el proveedor sale por la relación del egreso en cargos
(`contBanco.ITM|PROV.egreso|_x_bancoItmID::`, **PE:**) y del ingreso en abonos
(`contBanco.ITM|PROV.ingreso|_x_bancoItmID::`, **PI:**).

| #     | Encabezado del ERP                        | Campo de respuesta             | Tipo   | Aplica  | Origen en FileMaker                                                 | Nota                                                                                           |
| ----- | ----------------------------------------- | ------------------------------ | ------ | ------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 0     | Fecha de Corte                            | `fechaCorte`                   | date   | F C A N | parámetro                                                           | también en la raíz                                                                             |
| 1     | Tipo de Transacción                       | `tipoTransaccion`              | text   | F C A N | calculado                                                           | ver tabla de tipos                                                                             |
| 2     | Proveedor ID                              | `proveedorId`                  | number | F C A   | Fac. `P:__id_prov` · Ban. `PE:__id_prov` / `PI:__id_prov` |                                                                                                |
| 3     | Proveedor Nombre Comercial                | `proveedor`                    | text   | F C A N | `P:` / `PE:` / `PI:` `local_NombreComercial` | `SIN IDENTIFICAR` en N                                                                         |
| 4     | Proveedor Razón Social                    | `proveedorRazonSocial`         | text   | F C A   | `P:` / `PE:` / `PI:` `fiscal_RazonSocial` |                                                                                                |
| 5     | Proveedor RFC                             | `proveedorRfc`                 | text   | F C A   | `P:` / `PE:` / `PI:` `fiscal_RFC` |                                                                                                |
| 6     | Proveedor Grupo Nombre                    | —                              |        |         |                                                                     | **excluido** (decisión 5)                                                                      |
| 7     | Proveedor Cuenta Contable                 | `proveedorCuentaContable`      | text   | F C A   | `P:` / `PE:` / `PI:` `cuentaContable_Temp_v0_20_2r` | `
` → espacio. **Revisar**: en `sans` trae nombres de empresa, no cuentas |
| 8     | Proveedor Acuerdos                        | `proveedorAcuerdos`            | text   | F C A   | `P:` / `PE:` / `PI:` `local_informacionAcuerdos_v0_21_1` (**falta en Bancos**) | `\r` → espacio                                                                                 |
| 9     | Factura Serie y Folio                     | `facturaSerieFolio`            | text   | F       | `cfdi_serie_v0_15_1` + "-" + `cfdi_folio`                           | sin CFDI → `null` (el ERP pone `[OC#n] Falta CFDI`; la OC va en `compraId`). `Sin Serie-4579` es una factura con CFDI cuya serie es "Sin Serie": sale igual que en el ERP |
| 10    | Factura Fecha                             | `facturaFecha`                 | date   | F       | `cfdi_fecha`                                                        | sin CFDI → `null`                                                                              |
| 11    | Factura UUID                              | `facturaUuid`                  | text   | F       | `cfdi_UUID`                                                         | `""` sin CFDI                                                                                  |
| 12    | Factura Observaciones                     | `facturaObservaciones`         | text   | F       | `factura_observaciones_v0_18_1`                                     | `\r` → espacio                                                                                 |
| 13    | Factura Moneda                            | `facturaMoneda`                | text   | F       | `_idu_moneda\|v0_18_1`                                              |                                                                                                |
| 14    | Factura GranTotal (Moneda)                | `facturaGranTotalOriginal`     | number | F       | calculado                                                           | gran total / TC (decisión 6)                                                                   |
| 15    | Factura Tipo de Cambio                    | `facturaTipoDeCambio`          | number | F       | `tc_tipoCambioValor_v0_18_1`                                        |                                                                                                |
| 16    | Factura GranTotal (MXN)                   | `facturaGranTotal`             | number | F       | `monto_MXN_GranTotal`                                               |                                                                                                |
| 17    | Factura Fecha Límite de Pago              | `facturaFechaLimiteDePago`     | date   | F       | `saldo_fecha_pagoLimite`                                            | vacía → `area_fechaEnPagos` (decidido 25/11/2026: sin plazo, se debe desde la aprobación)                                                        |
| 17b   | (nuevo)                                   | `facturaEstatus`               | text   | F       | calculado                                                           | `Vencida` · `Por vencer` · `No pagar`                                                          |
| 17c   | (nuevo)                                   | `facturaDiasVencida`           | number | F       | calculado: corte − límite de pago                                   | `0` si está por vencer (decisión 8)                                                            |
| 18    | Factura Fecha Cerrada                     | `facturaNoPagarFecha`          | date   | F       | `saldo_fechaCerrado_bancoITM_noPagar` | solo en "No pagar"; si no, `null`. **Ojo**: también trae fecha en compras liquidadas |
| 19    | Factura Rep de Compra                     | `compraRepDeCompra`            | text   | F       | `poFactura_\|USER.repComp_\|_x_repCompID::userData_nombre_Completo` |                                                                                                |
| 20    | Factura Saldo Pendiente                   | `facturaSaldoPendiente`        | number | F       | calculado: saldo de hoy + pagos posteriores al corte                | = vencido + por vencer; `0` en "No pagar"                                                      |
| 21    | Factura Saldo Vencido                     | `facturaSaldoVencido`          | number | F       | calculado                                                           |                                                                                                |
| 22    | Factura Saldo Por Vencer                  | `facturaSaldoPorVencer`        | number | F       | calculado                                                           |                                                                                                |
| 23    | Factura No Pagar Monto                    | `facturaNoPagarMonto`          | number | F       | calculado                                                           | saldo de una "No pagar"; si no, `0`                                                            |
| 24    | Factura No Pagar IVA                      | `facturaNoPagarIva`            | number | F       | `monto_MXN_tax_favorIVA` **Confirmado en 24/11/2026**               | solo en "No pagar"; si no, `0`                                                                 |
| 25    | Factura No Pagar IEPS                     | `facturaNoPagarIeps`           | number | F       | `monto_MXN_tax_favorIEPSenFactura` **Confirmado en 24/11/2026**     | solo en "No pagar"; si no, `0`                                                                 |
| 26    | Factura No Pagar Cerrada Por:             | `facturaNoPagarCerradaPor`     | text   | F       | `area_cerradoNoPagar_user_v0_21_3_5r` | solo se llena en "No pagar"; vacío en 54 de 375 en la muestra del ERP |
| 27    | Banco Saldo Abono No Aplicado (A Favor)   | `abonoSaldoNoAplicado`         | number | A       | calculado: saldo hoy + aplicaciones > corte                         | positivo                                                                                       |
| 28    | Banco Saldo Cargo No Aplicado (En Contra) | `cargoSaldoNoAplicado`         | number | C       | calculado: saldo hoy + aplicaciones > corte                         | positivo                                                                                       |
| 29    | Banco Saldo Transaccion ID                | `bancoFolioTransaccion`        | number | C A N   | Ban. `__id_bancoITM`                                                |                                                                                                |
| 30    | Banco Saldo IngresoID                     | `ingresoId`                    | number | A       | Ban. `contINGRESO_::__id_ingreso`                                   |                                                                                                |
| 31    | Banco Saldo EgresoID                      | `egresoId`                     | number | C       | Ban. `contEGRESO_::__id_egreso`                                     |                                                                                                |
| 32    | Banco Nombre                              | `bancoNombre`                  | text   | C A N   | Ban. `contBANCO_::datos_nombre`                                     |                                                                                                |
| 32b   | (nuevo, como CxC)                         | `bancoCuentaContable`          | text   | C A N   | Ban. `contBANCO_::cuentaContable_Temp_v0_20_2r`                     |                                                                                                |
| 33    | Banco Fecha                               | `bancoFecha`                   | date   | C A N   | Ban. `_fecha`                                                       |                                                                                                |
| 34    | Banco Monto                               | `bancoMonto`                   | number | C A N   | Ban. `monto_ORIG_cargo_v0_22_1` (A: `…abono…`) × TC                 | en MXN                                                                                         |
| 35    | Banco Referencia                          | `bancoReferencia`              | text   | C A N   | Ban. `mConceptoDeBancoTexto_v0_20_0`                                |                                                                                                |
| 36    | Banco Saldo Sin Identificar               | `cargoMontoSinIdentificar`     | number | N       | calculado: saldo hoy + aplicaciones > corte                         |                                                                                                |
| 37–40 | Provisiones (4 columnas)                  | —                              |        |         |                                                                     | **segunda versión** (decisión 7)                                                               |
| 41    | Entrega Factura Tiene Productos           | `compraTieneProductos`         | text   | F       | `entrega_isBtieneStock`                                             | FM manda `1` / `0` → `SI` / `NO` |
| 42    | Entrega Estatus                           | `bodegaEntregaEstatus`         | text   | F       | `entrega_is_Entregado_Pendiente`                                    | vacío en 288 de 506 en la muestra                                                              |
| 43    | Entrega Fecha Estimado de Llegada         | `bodegaFechaEstimadaDeEntrega` | date   | F       | `entrega_fechaETAorig`                                              |                                                                                                |
| 44    | Entrega Fecha de Entrega                  | `bodegaFechaDeEntrega`         | date   | F       | `entrega_fechaAlta` | en Compras la fecha real es por concepto; aquí va por factura                                  |
| 45    | (nuevo)                                   | `compraId`                     | number | F       | `poFactura_\|PO_\|_x_po::__id_po`                                   | equivale a `ventaId` en CxC                                                                    |

## Campos que hay que crear o ubicar en FileMaker

**`apiExport_CxP_Facturas`** (partir de los campos de `apiExport_Compra`):

- [x] Proveedor ID (`P:` …)
- [x] Proveedor Acuerdos: `P:local_informacionAcuerdos_v0_21_1` (falta agregarlo en Bancos por `PE:` y `PI:`)
- [x] Fecha en que se marcó "No pagar" (Factura Fecha Cerrada): `saldo_fechaCerrado_bancoITM_noPagar`
- [x] Quién la marcó ("Cerrada por"): `area_cerradoNoPagar_user_v0_21_3_5r`
- [x] Monto pagado: `saldo_MXN_pagado_enPAGOS`
- [x] Factura tiene productos (SI/NO) - No hay productos en la muestra
- [x] Fecha de entrega real (por factura) - No hay entregas en la muestra
- [x] Fecha de cancelación: **no existe** (decidido 24/11/2026). Una compra
      cancelada sale del área aprobada (ver decisión 9)
- [x] **Portal de pagos de la compra** (equivale a `PagosVenta`): por cada
      aplicación de un egreso a la compra, monto MXN, TC del complemento y
      **fecha del complemento**. Con nombre de objeto, para pedir su `limit.` alto.
- [x] Confirmar qué valor de `area_is_Cotizacion_noAprobado_Pagos_Cerrado`
      (o qué otro campo) identifica "No pagar" y "Cancelada"; Cuando es "No pagar", se va a "Cerrado" y se valida con la fecha `P:saldo_fechaCerrado_bancoITM _noPagar`

**`apiExport_CxP_Bancos`** (duplicar `apiExport_CxC_Bancos`):

- [x] Cambiar `CLIENTE.egreso` / `CLIENTE.ingreso` por la relación al
      proveedor del egreso y del ingreso: ID, nombre comercial, razón social,
      RFC, cuenta contable, acuerdos - `contEGRESO_::_concil_id_cliente` y `contINGRESO_::_concil_id_cliente`
- [x] Proveedor del egreso y del ingreso (equivale a `_concil_id_cliente`).
- [x] Dejar `contEGRESO_::_concil_id_cliente` para excluir las devoluciones a clientes (decisión 4).
- [x] Quitar clasificaciones, rep de venta, rep de cobranza y crédito autorizado.

## Revisión de los layouts (25/11/2026)

Segunda respuesta: `apiExport_CxP_Facturas` (50 de 1,830 compras, OC
1703–1827) y `apiExport_CxP_Bancos` (los 6,965 movimientos). La muestra del
ERP es de otra base de datos, así que sus folios no se pueden buscar en `sans`.

**Ya cuadra:**

- Portal de pagos `PagosVenta` (`poFactura_|cont.EGRESO_ITM|_x_facturaIDU`):
  en las 50 compras, `monto_MXN_GranTotal` = `saldo_MXN_pagado_enPAGOS` +
  `saldo_MXN_pendiente_GranTotal_saldoGeneral`, y el pagado = Σ del portal.
- En 4 de las 29 liquidadas, `saldo_fechaCerrado_bancoITM_noPagar` es
  anterior a la fecha del complemento (p. ej. 10/05 vs. 10/08). El pago
  cuenta en la **fecha del complemento**, como en CxC.
- Bancos: los egresos sin proveedor tienen todos saldo 0 (327), así que un
  "cargo no identificado" es en la práctica un cargo **sin egreso**.

**Falta:**

1. ~~Ninguna "No pagar" en la muestra~~ **Resuelto** con la respuesta completa
   de Facturas (ver "Comparación con el ERP de SANS").
2. ~~Proveedor Acuerdos en Bancos~~ **Resuelto**: `PE:` y `PI:`
   `local_informacionAcuerdos_v0_21_1`. Se agregó también
   `contBanco.ITM|poFACTURA|_x_bancoItmID::_id_po` (solo sirvió para revisar
   los cargos; trae una sola OC por movimiento y no va al reporte).
3. **Portales de Bancos recortados a 6 renglones**: ningún portal trae más de 6, y en 6
   cargos (885, 886, 898, 997, 1004, 5754) lo aplicado no cuadra con el monto.
   El backend pide `limit.<portal>` alto; para capturar los datos dorados hay
   que pedirlo igual.

**PENDIENTE (revisar en FileMaker):**

- **Cuenta contable del proveedor**: `cuentaContable_Temp_v0_20_2r` sigue
  trayendo nombres de empresa (9 de 50 compras, 293 movimientos).

**Sin casos en la muestra** (van con test unitario o con otra captura): abono
por aplicar de un proveedor (los 5 abonos de proveedor tienen saldo 0),
compras en USD y saldos negativos.

**Sobran (no van al reporte):** importe con descuento, IVA e ISR retenidos,
bodega y banco de la compra, `area_isB_Aprobado`. No estorban si se quedan.

## Comparación con el ERP de SANS (25/11/2026)

Reporte del ERP de la misma base (`Test 25 Nov SANS CxP.csv`, corte
25/11/2026 10:11, 1,960 filas) contra las respuestas del 25/11.

| Tipo en el ERP               | Filas | Total ERP      |
| ---------------------------- | ----- | -------------- |
| Factura Vigente: Vencido     | 198   | $3,383,306.40  |
| Factura Vigente: Por Vencer  | 1     | $28,232.11     |
| Factura Cerrada: No Pagar    | 27    | $459,885.75    |
| Cargos con Saldo por Aplicar | 195   | $1,342,537.24  |
| Cargos No Identificados      | 1,539 | $23,284,727.71 |

**Cargos no identificados: cuadran al centavo.** Los 1,533 cargos sin egreso
de FileMaker salen en el ERP con el mismo folio y el mismo monto. Los otros 6
(1281, 2038, 6303, 6319, 6323, 6558) son cargos con proveedor cuyo egreso es
menor que el movimiento ($100 en 1281, centavos en los demás): el ERP saca el
sobrante como no identificado. Se **confirma** la regla de división de CxC
y la decisión 4: no se excluye ningún banco ni tipo de egreso.

**Facturas: cuadran al centavo** con la respuesta completa (1,735 compras
aprobadas): 198 vencidas ($3,383,306.40), 1 por vencer ($28,232.11) y 27
"No pagar" ($459,885.75), igual que el ERP, con estas dos reglas:

1. **Saldo = `monto_MXN_GranTotal` − `saldo_MXN_pagado_enPAGOS`**, no
   `saldo_MXN_pendiente_GranTotal_saldoGeneral`. En 18 compras `Pagos`
   (OC 665 de LABORATORIOS - ABC y 17 de Tres Guerras, OC 897–1342) ese campo
   dice 0 aunque no tienen ningún pago; el ERP las muestra vencidas por su
   gran total ($9,557.44). En las otras 1,717 los dos cálculos dan lo mismo,
   y el pagado es igual a Σ del portal de pagos. **PENDIENTE**: revisar en
   FileMaker por qué el saldo de esas 18 está en 0 (¿cálculo almacenado sin
   actualizar?).
2. **"No pagar" = `Cerrado` y saldo > 0.** Las 27 tienen usuario en
   `area_cerradoNoPagar_user_v0_21_3_5r` (Edgar 23, marisol99 4). La OC 107
   (Tres Guerras) está `Cerrado` con saldo −$279.56 (pagado de más) y sin
   usuario: el ERP no la muestra, RepGen tampoco. La OC 1 tiene usuario pero
   saldo 0: no sale.

Otros datos de la respuesta: las compras sin CFDI salen en el ERP con folio
`[OC#1718] Falta CFDI` (en RepGen, folio `null` y la OC en `compraId`); el
ERP antepone `[OC# n]` al folio de las "No pagar"; una OC puede tener varias
facturas (OC 158 tiene 50); la OC 873 no tiene fecha límite (Cerrado, saldo
0, no sale); el portal de pagos trae hasta 30 renglones (OC 418).

En otras bases el campo del usuario aún se llama
`area.cerradoNoPagar.user|v0.21.3.5r` (con puntos); hay que renombrarlo
antes de usar el reporte ahí.

**Cargos por aplicar: diferencias explicadas** (revisado en FileMaker el 25/11/2026).

| Folio | FileMaker (saldo) | ERP        | Causa |
| ----- | ----------------- | ---------- | ----- |
| 5327  | $26,100.00        | no sale    | error de captura: no se descontó la aplicación; **ya se corrigió** en FileMaker |
| 1357  | $226.00           | $19,090.00 | la aplicación de $18,864 va a la OC 220 |
| 1384  | $1,379.57         | $2,855.46  | la aplicación de $1,475.89 va a la OC 232 |
| 2313  | $4,060.00         | $11,560.00 | la aplicación de $7,500 va a la OC 432 |

Las OC 220, 232 y 432 no tienen CFDI, pero están pagadas (`Cerrado`, pagado
= gran total): el ERP no descuenta las aplicaciones a compras sin CFDI.
**Decidido:** RepGen sí las descuenta (decisión 10). Con eso el total cuadra
exacto: ERP $1,342,537.24 − $27,839.89 (las tres aplicaciones) + $26,100
(5327, antes de corregirlo) + $100.17 (sobrantes que el ERP saca como no
identificados) = $1,340,897.52 de FileMaker.

## Lógica de negocio

### 1. Fecha de corte

Igual que CxC: el día que manda el usuario o hoy en `America/Mexico_City`;
una fecha futura responde 400; saldos al cierre de ese día; solo el día, sin hora.

### 2. Consultas a FileMaker

**Facturas (`CxP_Facturas`)**, todas con `area_fechaEnPagos` `≤ corte`:

| Petición | Condición adicional                                                            | Para qué |
| -------- | ------------------------------------------------------------------------------ | -------- |
| 1        | `area_is_Cotizacion_noAprobado_Pagos_Cerrado` = `Pagos`                         | abiertas (201 hoy); no se filtra por saldo porque el campo no es confiable en `Pagos` |
| 2        | `area_is_…` = `Cerrado` y `saldo_MXN_pendiente_GranTotal_saldoGeneral` `>0`     | "No pagar" (en `Cerrado` el saldo sí cuadra en las 1,534) |
| 3        | portal `PagosVenta`: `fecha_egresoITM_fechaDelComplemento_v0_20_2r` `>corte`    | liquidadas **después** del corte |

El portal de pagos se pide con `limit.PagosVenta` alto, como en CxC.

**Bancos (`CxP_Bancos`)**, todas con `_fecha` `≤ corte`:

| Petición | Condición adicional                                                                         | Para qué                                   |
| -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1        | `monto_ORIG_cargo_v0_22_1` `>0` y saldo `≠0`                                                | cargos con saldo hoy (con o sin proveedor) |
| 2        | `monto_ORIG_cargo_v0_22_1` `>0` y portal de egresos: fecha `>corte`                         | cargos aplicados después del corte         |
| 3        | `monto_ORIG_abono_v0_22_1` `>0`, ingreso con proveedor y saldo `≠0`                         | abonos de un proveedor con saldo hoy       |
| 4        | `monto_ORIG_abono_v0_22_1` `>0`, ingreso con proveedor y portal de ingresos: fecha `>corte` | abonos aplicados después del corte         |

Los cargos con cliente en el egreso se descartan en el mapper (decisión 4).
Un cargo con saldo y sin egreso es "no identificado", sin excluir ningún
banco ni tipo de movimiento (**confirmado** contra el ERP de SANS: 1,533 de
1,533).

### 3. Tipo de renglón

| Origen   | Condición                          | `tipoTransaccion`           |
| -------- | ---------------------------------- | --------------------------- |
| Facturas | "No pagar" al corte                | `Factura cerrada: No pagar` |
| Facturas | límite de pago **<** día de corte  | `Factura vencida`           |
| Facturas | límite de pago **≥** día de corte  | `Factura por vencer`        |
| Bancos   | cargo cuyo egreso tiene proveedor  | `Cargo por aplicar`         |
| Bancos   | abono cuyo ingreso tiene proveedor | `Abono por aplicar`         |
| Bancos   | cargo sin proveedor ni cliente     | `Cargo no identificado`     |

### 4. Cálculo de cada campo

Igual que CxC, cambiando los campos:

- **Saldo al corte de una factura** = `monto_MXN_GranTotal` −
  `saldo_MXN_pagado_enPAGOS` + Σ `app_MXN_GranTotal` del portal con fecha del
  complemento **>** corte (**confirmado** contra el ERP de SANS; el campo de
  saldo de FileMaker no se usa, ver comparación).
- **"No pagar"** = `Cerrado` y saldo > 0 (**confirmado**: 27 de 27). Un
  `Cerrado` con saldo negativo no sale. Estatus `No pagar` si
  `saldo_fechaCerrado_bancoITM_noPagar` ≤ corte (o vacía); su saldo va en `facturaNoPagarMonto` y el pendiente, vencido y por
  vencer en `0` (decisión 3). Marcada después del corte: factura normal.
- **Cargos y abonos**: saldo en moneda original (saldo de hoy + aplicaciones
  posteriores al corte ÷ TC del complemento) × TC del movimiento. Si el egreso
  (o ingreso) es menor que el movimiento, el sobrante sale como `Cargo no
identificado` con el mismo folio, como en CxC (**confirmado** contra el ERP
  de SANS: 6 casos).
- `facturaGranTotalOriginal` = `monto_MXN_GranTotal` / TC, 2 decimales (TC
  vacío o 0 = sin conversión).

### 5. Exclusiones

| Caso                                    | Regla                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Saldo al corte 0                        | no sale (`\|saldo\| < 0.005`)                                                |
| Cargo de banco con cliente en el egreso | no sale (es devolución de CxC)                                               |
| Saldos pequeños ($0.01, $0.05)          | **salen** (decidido 25/11/2026), como en CxC y en el ERP; así se cuadra al centavo |

### 6. Orden de las filas

1. Por tipo, en el orden de la tabla de tipos de renglón.
2. Dentro del tipo, por fecha ascendente (límite de pago en facturas,
   `bancoFecha` en movimientos), como en CxC. El ERP ordena por proveedor;
   en la pantalla se puede reordenar.
3. Desempate: `compraId` y después el `recordId` de FileMaker en facturas
   (una OC puede tener varias facturas con la misma fecha límite y sin CFDI:
   17 empates en SANS, que `cfdi_UUID` no rompe porque viene vacío);
   `bancoFolioTransaccion` en movimientos. Decidido 25/11/2026: `recordId`
   viene en todo registro del Data API, así que no hace falta otro campo.

### 7. Cuadres

- Σ pendiente = Σ vencido + Σ por vencer (cuadra en las 131 vigentes de la muestra).
- Con corte = hoy, cada saldo es el de FileMaker.
- Contra el ERP con `fechaCorte` = `2026-11-24`: los totales de "Resumen / KPIs".

## Resumen / KPIs

Cifras de la muestra al 24/11/2026:

| KPI                        | Monto          |
| -------------------------- | -------------- |
| Saldo pendiente (vigentes) | $10,671,375.92 |
| · Vencido                  | $9,647,838.61  |
| · Por vencer               | $1,023,537.31  |
| No pagar (aparte)          | $16,025,000.24 |
| Cargos por aplicar         | $423,794.44    |
| Abonos por aplicar         | $30,422.30     |
| Cargos no identificados    | $518,515.30    |

**Decidido (25/11/2026):** el resultado principal es el **saldo pendiente**
(vencido + por vencer). Cargos por aplicar, abonos por aplicar, cargos no
identificados y "No pagar" van aparte en el panel.

## Anomalías del ERP

- "Factura GranTotal (Moneda)" en $0.00 incluso en USD → se calcula (decisión 6).
- 375 facturas "No pagar" desde 2023, muchas por centavos → salen aparte (decisión 3).
- "Banco Saldo Abono No Aplicado" viene sin formato de moneda (`707.39`) y la
  otra columna con `$`: sin efecto en RepGen.
- 54 "No pagar" sin "Cerrada por".

## Casos que deben estar en los datos dorados

Borrador del 25/11/2026, **revisado por la persona** (25/11/2026) en [datos-dorados/](datos-dorados/), sacado de las
respuestas completas de SANS (`src/reports/_namefields/CxP_*_ResponseFM.json`,
no se suben) y anonimizado. Dos juegos, porque los abonos de proveedor solo
tienen saldo en octubre de 2024:

| Juego | Corte | Entradas | Filas del borrador |
| ----- | ----- | -------- | ------------------ |
| `datos-dorados/` | 2026-07-15 | 12 compras, 7 movimientos | 15 |
| `datos-dorados/segundo/` | 2024-10-16 | 9 compras, 6 movimientos | 12 |

`esperado-borrador.json` sale de un script aparte que aplica esta ficha
(validado: con corte 25/11/2026 sobre la respuesta completa da los totales
del ERP de SANS). Se dejaron fuera los registros con portal recortado
(Bancos con 6 renglones; compras con pagado ≠ Σ portal).

Cubiertos (P = principal, S = segundo):

- [x] compra aprobada después del corte, no sale (P: OC 1455; S: OC 346)
- [x] compra sin CFDI con saldo: folio y fecha `null` (P: OC 1110, 1540; S: OC 39, 158, 335, 359)
- [x] compra pagada después del corte, sale con su saldo al corte (P: OC 1541; S: OC 158, 335, 359)
- [x] pago el mismo día del corte, liquidada ese día: no sale (P: OC 1545; S: OC 344)
- [x] "No pagar" antes del corte (P: OC 1, 395; S: OC 48, 53) y marcada después, sale como factura normal (P: OC 1540; S: OC 39)
- [x] "No pagar" de centavos (P: OC 1 $0.01; S: OC 48 $0.02, OC 53 $0.01)
- [x] `Cerrado` con saldo negativo, no sale (OC 107 en los dos)
- [x] saldo de FileMaker en 0 sin pagos: sale por gran total − pagado (P: OC 665)
- [x] vencida con pago parcial (P: OC 476, saldo $0.40)
- [x] vence el día del corte: por vencer, 0 días (P: OC 1541; S: OC 359)
- [x] serie "Sin Serie" con CFDI (P: OC 476, 1399; S: OC 53); texto con `
` (P: OC 1399)
- [x] proveedor con acuerdos (P: OC 875; S: OC 335) y sin RFC (P: OC 1, 1110, 1540)
- [x] cargo por aplicar (P: 1357, 2313, 5259, 6732; S: 1194, 1357, 2038)
- [x] cargo aplicado después del corte (P: 6732; S: 1194)
- [x] cargo depositado después del corte, no sale (P: 6733; S: 2039)
- [x] aplicación a compra sin CFDI que sí descuenta (1357 en los dos; P: 2313, decisión 10)
- [x] egreso menor que el movimiento: el sobrante sale como no identificado (S: 2038)
- [x] cargo no identificado (P: 691, 3642; S: 1628, 2038)
- [x] abono por aplicar de un proveedor (S: 2021)

Sin caso en SANS (van con test unitario):

- [ ] compra en USD (gran total original = MXN / TC)
- [ ] compra con un pago antes y otro después del corte (en SANS cada compra se paga en una sola fecha)
- [ ] cargo con cliente en el egreso, no sale (ningún egreso tiene cliente)
- [ ] compra sin fecha límite (solo OC 873, con saldo 0)
- [ ] dos facturas de la misma OC con la misma fecha límite: desempate por `recordId` (17 empates en SANS, ninguno en el borrador)
- [ ] portal con más de 50 pagos

Anomalías para revisar en el borrador:

- OC 1 ("No pagar" de $0.01): sin proveedor y sin moneda en FileMaker. Sale con proveedor `""` y moneda `""`.
- El abono 2012 tiene una aplicación sin fecha de complemento: el script la toma como aplicada antes de cualquier corte. No está en el borrador.
- El anonimizador pone "Cliente Ejemplo NN" también a proveedores (es el mismo tipo de reemplazo).

## Resumen por proveedor (25/11/2026)

> **Estado (25/11/2026): implementado**, falta probarlo contra FileMaker real.
> `resumirPorProveedor` (`payables-por-proveedor.ts`) produce exactamente
> `__golden__/esperado-proveedor.json` de los dos juegos (aprobados por la
> persona el 25/11/2026). Pestaña "Proveedores" en
> `/cuentas_por_pagar/proveedores`, reportId `cuentas_por_pagar_proveedores`.

Segunda vista del mismo reporte, como la pestaña "Clientes" de CxC: una fila
por proveedor con sus saldos sumados, sin el desglose por factura. En el ERP
la pestaña existe pero aún no está habilitada, así que **no hay reporte del
ERP para comparar**: el diseño copia el resumen por cliente de CxC (que sí se
cuadró contra el ERP en 721 clientes).

**Decidido** (espejo de CxC):

- Mismos dos layouts y la misma consulta en caché que la vista por compras;
  sin layouts nuevos. El resumen suma las filas del detalle ya calculadas al
  corte, así que cuadra con él por construcción.
- Solo salen los proveedores con algún saldo distinto de 0.
- Pestaña "Proveedores" junto a "Facturas" en Cuentas por pagar, con la misma
  fecha de corte (`/cuentas_por_pagar/facturas` y `/cuentas_por_pagar/proveedores`;
  la de facturas conserva el reportId `cuentas_por_pagar`).
- Endpoint `reports/cuentas-por-pagar-por-proveedor/buscar`, mismo
  `{ "fechaCorte" }` de entrada.
- Se agrupa por `proveedorId` (por nombre si no hay id, como la OC 1 sin
  proveedor). Datos del proveedor: de cualquiera de sus filas.
- Orden por nombre comercial; los cargos no identificados se juntan en una
  última fila "EGRESOS SIN IDENTIFICAR", solo con "Pagos (No Aplicados)", que
  no suma al Saldo Fiscal.

Columnas: datos del proveedor (nombre comercial, razón social, RFC, cuenta
contable, acuerdos) y estos saldos:

| Columna | Campo | Cálculo |
| --- | --- | --- |
| Facturas Vigentes (Vencidas) | `facturaSaldoVencido` | Σ del detalle |
| Facturas Vigentes (Por Vencer) | `facturaSaldoPorVencer` | Σ del detalle |
| Facturas Vigentes (Total) | `facturaSaldoPendiente` | Vencidas + Por Vencer |
| Facturas No Pagar | `facturaNoPagarMonto` | Σ del detalle |
| Pagos (No Aplicados) | `cargoSaldoNoAplicado` | Σ de cargos por aplicar |
| Devoluciones (No Aplicadas) | `abonoSaldoNoAplicado` | Σ de abonos por aplicar |
| Saldo a Favor Total | `proveedorSaldoAFavor` | Pagos + Devoluciones no aplicados |
| Saldo Fiscal | `proveedorSaldoFiscal` | Vigentes + No Pagar − Saldo a Favor |

Sin columnas de rep: en CxP el rep de compra es de la factura, no del proveedor.

**Decidido (25/11/2026):**

- Las devoluciones no aplicadas restan en el Saldo Fiscal, igual que en CxC.
- Una compra sin proveedor sale como "SIN PROVEEDOR" en el resumen (en el
  detalle el nombre sigue vacío, como viene de FileMaker).

Borrador en `datos-dorados/esperado-proveedor-borrador.json` (12 filas) y
`datos-dorados/segundo/esperado-proveedor-borrador.json` (10 filas), sacados
con un script aparte a partir de los `esperado.json` aprobados. Casos:

- Proveedor con facturas y pagos no aplicados que se compensan: Saldo Fiscal 0
  (segundo juego, "Cliente Ejemplo 04": pagó $13,929.28 el 16/10/2024 y lo
  aplicó después del corte).
- Proveedor con dos cargos por aplicar (principal, "Cliente Ejemplo 02").
- Proveedor solo con devolución no aplicada (segundo, "Cliente Ejemplo 03").
- Proveedor solo con "No pagar", también de centavos.
- Compra sin proveedor (OC 1): fila "SIN PROVEEDOR".
- Cargos no identificados juntos al final.
