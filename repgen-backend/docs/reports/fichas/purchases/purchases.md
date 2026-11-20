# Ficha: Compras (general)

> Basada en la respuesta del Data API de `apiExport_Compra`, octubre 2026
> (51 compras), cruzada con la de Conceptos del mismo rango. No hay
> reporte del ERP por factura: se compara contra Conceptos (decisión 1).
> Guía: [docs/guides/COMO-AGREGAR-REPORTE.md](../../../../../docs/guides/COMO-AGREGAR-REPORTE.md).
> Reporte hermano: [Compras por concepto](../purchase-items/purchase-items.md).
>
> La respuesta completa de octubre está en
> `src/reports/_namefields/Compra_ResponseFM.json` (no se sube). Muestra
> anonimizada: [Compra_ResponseFM](Compra_ResponseFM) (OC 1703, 1769, 1587)
> y [Compra.schema.json](Compra.schema.json) (28 campos; las 51 compras
> reales lo cumplen).

> **Estado (20/11/2026): implementado, sin probar contra FileMaker real.**
> Código: `repgen-backend/src/reports/*/purchases/` y
> `repgen-frontend/src/features/reports/purchases/`; las reglas compartidas
> con Conceptos (estatus, folio sin CFDI, moneda original) están en
> `infrastructure/shared/compras.ts`. El mapper produce exactamente
> `__golden__/esperado.json` (`purchases.golden.spec.ts`; copiado del
> borrador aprobado el 20/11/2026). Pendiente: probar con FileMaker.

- Nombre interno: `purchases` (decidido 20/11/2026)
- Endpoint: `reports/compras/buscar`
- Ruta frontend y reportId: `/compras/general`, reportId `compras` (decisión 6).
  Compras tiene dos pestañas: **Compras** (este) y **Conceptos**
  (`/compras/conceptos`, sin cambio). `/compras` lleva a Compras.
- Layout FileMaker: `apiExport_Compra` (tabla base `poFACTURA_`)
- Tipo: **rango de fechas**
- Campo de fecha del rango: `area_fechaEnPagos` (fecha en que se aprobó la compra)
- ¿Filtra por permisos del usuario?: **no**, igual que Conceptos.

## Alcance

Igual que Compras por concepto (decidido 20/11/2026): solo compras
aprobadas (con `area_fechaEnPagos`); una compra Cerrada conserva la fecha;
una cancelada o regresada desaparece también de periodos pasados. Aquí va
**un renglón por compra**.

## Cruce con Compras por concepto (octubre 2026)

- Las mismas 51 compras en los dos layouts.
- Proveedor, rep de compra, bodega, banco, entrega, saldo y UUID coinciden
  en las 51.
- Importe con descuento, IVA, IEPS, IVA e ISR retenidos y gran total de la
  compra = Σ de sus conceptos (cantidad × unitario) en 50 de 51.
- **OC 1749**: la compra dice 20,945.50 y sus conceptos suman −17,850.87.
  La compra deja fuera el "IVA a Cargo" negativo (saldo a favor), que se
  corrige en FileMaker (decidido en la ficha de Conceptos). Aquí la 1749 ya
  sale con el total correcto.

Mientras no se corrija la 1749, el "Resultado" de octubre es 856,912.77 en
este reporte y 818,116.36 en Conceptos.

## Contrato de respuesta

`POST reports/compras/buscar` recibe `dateRange` y responde
`{ "data": ReportPurchaseRecord[] }`. Ejemplo: [api_response.json](api_response.json).
Mismas reglas que Conceptos: mismas llaves en todas las filas; texto vacío
`""`; número o fecha vacíos o que no aplican `null`; fechas ISO; `\r` →
espacio; montos en MXN como vienen de FileMaker.

### Columnas

Prefijos: `P:` = `poFactura_|PROV_|_x_provID::`. Sin prefijo = campo de `poFACTURA_`.
Nombres de campo iguales a Conceptos (datos de la compra) y a Ventas (montos
de la factura) cuando es el mismo dato.

| #  | Campo | Encabezado RepGen | Tipo | Origen | Regla |
|----|---|---|---|---|---|
| 1  | `compraFechaAprobado` | Compra Fecha Aprobado | date | `area_fechaEnPagos` | |
| 2  | `compraId` | Compra ID | number | `poFactura_\|PO_\|_x_po::__id_po` | |
| 3  | `compraRepDeCompra` | Compra Rep de Compra | text | `poFactura_\|USER.repComp_\|_x_repCompID::userData_nombre_Completo` | trim |
| 4  | `proveedor` | Proveedor Nombre Comercial | text | `P:local_NombreComercial` | |
| 5  | `proveedorRazonSocial` | Proveedor Razón Social | text | `P:fiscal_RazonSocial` | trim |
| 6  | `proveedorRfc` | Proveedor RFC | text | `P:fiscal_RFC` | |
| 7  | `proveedorCuentaContable` | Proveedor Cuenta Contable | text | `P:cuentaContable_Temp_v0_20_2r` | `\r` → espacio |
| 8  | `facturaUuid` | Factura UUID | text | `cfdi_UUID` | `""` sin CFDI |
| 9  | `facturaSerieFolio` | Factura Serie y Folio | text | `cfdi_serie_v0_15_1` + "-" + `cfdi_folio` | sin CFDI → `null` |
| 10 | `facturaFecha` | Factura Fecha | date | `cfdi_fecha` | sin CFDI → `null` |
| 11 | `facturaObservaciones` | Factura Observaciones | text | `factura_observaciones_v0_18_1` | `\r` → espacio |
| 12 | `facturaEstatus` | Factura Estatus | text | `area_is_Cotizacion_noAprobado_Pagos_Cerrado` + `saldo_fecha_pagoLimite` | igual que Conceptos (Liquidado / Vencida / Vigente) |
| 13 | `facturaSaldoActual` | Factura Saldo Actual | currency | `saldo_MXN_pendiente_GranTotal_saldoGeneral` | |
| 14 | `facturaFechaLimiteDePago` | Factura Fecha Límite de Pago | date | `saldo_fecha_pagoLimite` | |
| 15 | `bancoNombre` | Banco Nombre | text | `poFactura_\|cont.BANCO_\|_x_bancoID::datos_nombre` | |
| 16 | `bancoNumeroCuenta` | Banco Número de Cuenta | text | `poFactura_\|cont.BANCO_\|_x_bancoID::datos_cuentaNumero` | vacío en Tarjeta Clara y Caja Chica |
| 17 | `facturaMoneda` | Factura Moneda | text | `_idu_moneda\|v0_18_1` | |
| 18 | `facturaTipoDeCambio` | Factura Tipo de Cambio | number | `tc_tipoCambioValor_v0_18_1` | |
| 19 | `facturaGranTotalOriginal` | Factura Gran Total (Moneda Original) | currency | calculado | gran total / TC, 2 decimales |
| 20 | `importeConDescuentoMxn` | Importe con Descuento (MXN) | currency | `monto_MXN_Importe_ConDescuento` | |
| 21 | `ivaMxn` | IVA (MXN) | currency | `monto_MXN_tax_favorIVA` | |
| 22 | `iepsMxn` | IEPS (MXN) | currency | `monto_MXN_tax_favorIEPSenFactura` | |
| 23 | `ivaRetenidoMxn` | IVA Retenido (MXN) | currency | `monto_MXN_tax_contraIVAretenido_v0_18_1` | |
| 24 | `isrRetenidoMxn` | ISR Retenido (MXN) | currency | `monto_MXN_tax_contraISRretenido_v0_18_1` | |
| 25 | `facturaGranTotalMxn` | Factura Gran Total (MXN) | currency | `monto_MXN_GranTotal` | |
| 26 | `bodegaNombre` | Bodega Nombre | text | `poFactura_\|BODEGA_\|_x_bodegaReceptorID::bodega_nombre` | tal cual, trim; vacío → `""` (decisión 3) |
| 27 | `bodegaEntregaEstatus` | Bodega Entrega Estatus | text | `entrega_is_Entregado_Pendiente` | tal cual (decisión 3) |
| 28 | `bodegaFechaEstimadaDeEntrega` | Bodega Fecha Estimada de Entrega | date | `entrega_fechaETAorig` | vacía → `null` (decisión 4) |

Sin importe sin descuento ni monto de descuento (decisión 5).

El campo de IVA retenido se llamaba `monto_MXN_tax_contraIVAretenido_v0_18._1`
(con punto); se renombró en FileMaker a `…_v0_18_1` el 20/11/2026, antes de
capturar los datos dorados. Mismos valores en las 51 compras.

## Lógica de negocio

1. **Búsqueda**: una petición por rango sobre `area_fechaEnPagos` en
   `apiExport_Compra` (`BaseReportService`, sin permisos).
2. **Un registro → un renglón.** Sin portales.
3. **Reglas compartidas con Conceptos**: estatus (decisión 4 de Conceptos),
   compra sin CFDI (folio y fecha `null`, UUID `""`), `\r` → espacio,
   moneda original = gran total / TC (TC vacío o 0 = sin conversión).
4. **Orden**: por `compraId` ascendente.
5. **Cuadre**: Σ `facturaGranTotalMxn` de este reporte = Σ "una vez por
   compra" del panel de Conceptos (856,912.77 en octubre).

## Resumen / KPIs

**Decidido (20/11/2026)**, igual que Conceptos pero sin "una vez por
compra" (aquí cada renglón ya es una compra):

- "Resultado" = Σ `facturaGranTotalMxn` (compras aprobadas en el periodo).
- Panel: importe con descuento, IVA, IVA retenido, ISR retenido, gran
  total; saldo por pagar (Σ `facturaSaldoActual`); compras liquidadas,
  vencidas y vigentes (cuántas y cuánto saldo).
- Una sola moneda (MXN).

## PENDIENTES

1. ~~Reporte actual del ERP~~ **Decidido (20/11/2026):** no hay reporte de
   compras por factura en el ERP. La comparación (paso 6 de la guía) se hace
   contra Compras por concepto: cada compra = Σ de sus conceptos (paso 5), y
   los datos de la compra iguales a los que repite Conceptos. Los
   encabezados salen de Conceptos y Ventas.
2. ~~Agregar al layout~~ **Resuelto (20/11/2026):** se agregaron
   `cfdi_fecha` y `cont.BANCO::datos_cuentaNumero`; coinciden con Conceptos
   en las 51 compras.
3. ~~Bodega y entrega en compras de puro gasto~~ **Decidido (20/11/2026):**
   se dejan como vienen de FM. FM trae bodega "SANS General" y entrega
   "Entregado" en compras que solo tienen gastos (10 en octubre: OC 1719,
   1720, 1727, 1761, 1766, 1794, 1795, 1807…); este layout no sabe si la
   compra es de puro gasto. Es una diferencia esperada contra Conceptos,
   donde un gasto va sin bodega ni entrega.
4. ~~Fecha de entrega~~ **Decidido (20/11/2026):** `entrega_fechaETAorig`
   como "Bodega Fecha Estimada de Entrega" (11 compras en octubre, solo de
   Stock). La fecha real de recibido es por concepto y está en Conceptos.
5. ~~Descuento~~ **Decidido (20/11/2026):** sin importe sin descuento ni
   descuento; los descuentos son por concepto y están en Conceptos.
6. ~~Ruta y pestañas~~ **Decidido (20/11/2026):** pestañas **Compras**
   (`/compras/general`, reportId `compras`) y **Conceptos**
   (`/compras/conceptos`, reportId `compras_conceptos`). `/compras` lleva a
   Compras.
7. ~~KPIs~~ **Decidido (20/11/2026):** ver "Resumen / KPIs".

## Casos que deben estar en los datos dorados

Borrador en [datos-dorados/](datos-dorados/): `entrada-compras.json` (las
mismas 13 compras de octubre que los datos dorados de Conceptos,
anonimizadas), `rango.json` (octubre; `hoy` = 2026-10-31, igual que
Conceptos) y `esperado-borrador.json` (13 renglones), armado con un script
aparte: estatus, fechas, folio, saldo, banco y moneda salen del
`esperado.json` aprobado de Conceptos; los montos salen de la compra y el
script comprueba que cada uno sea Σ de sus conceptos (solo difiere la 1749).

- [x] Compra liquidada (4), vencida (8) y vigente (1: OC 1749, límite 05/11)
- [x] Compra sin CFDI: folio y fecha `null` (1587, 1724, 1749, 1792)
- [x] Compra con IVA e ISR retenidos (1769) y con IVA retenido (1720)
- [x] Compra con varios conceptos (1703, 1724, 1749, 1800, 1802)
- [x] OC 1749: total de la compra (20,945.50) distinto de Σ conceptos
- [x] Compra de puro gasto con bodega y "Entregado" (1720)
- [x] Con fecha estimada de entrega (1587, 1703, 1724, 1759, 1792, 1802) y sin ella
- [x] Entrega Pendiente (1587, 1759, 1792)
- [x] Proveedor sin razón social ni RFC (1749, 1792)
- [x] Banco sin número de cuenta (1804 Tarjeta Clara, 1805 Caja Chica)
- [x] Observaciones con `\r` (las pone el anonimizador)
- [ ] Cuenta contable con `\r`: el anonimizador la reemplaza → test unitario
- [ ] Compra en USD: **no hay en octubre** → test unitario

Totales del borrador: Resultado (Σ `facturaGranTotalMxn`) = 271,933.51,
igual al "una vez por compra" de los datos dorados de Conceptos; importe
con descuento 243,236.16; IVA 31,285.73; IVA retenido 282.54; ISR retenido
2,305.85; saldo 172,398.04.
