# Ficha: Compras por concepto

> Basada en el reporte FM "GASTOS" (CSV "Reporte compras Oct", periodo
> 01/10/2026 al 31/10/2026: 51 compras, 74 conceptos) y en la respuesta del
> Data API del mismo rango (74 registros).
> Guía: [docs/guides/COMO-AGREGAR-REPORTE.md](../../../../../docs/guides/COMO-AGREGAR-REPORTE.md)
>
> Respuesta cruda: [CompraITM_ResponseFM](CompraITM_ResponseFM) (3 registros
> anonimizados: OC 1703, 1769, 1587) y [CompraITM.schema.json](CompraITM.schema.json)
> (42 campos; los 74 registros reales lo cumplen). La respuesta completa
> de octubre está en `src/reports/_namefields/CompraITM_ResponseFM.json`
> (no se sube).

> **Estado (20/11/2026): implementado, sin probar contra FileMaker real.**
> Código: `repgen-backend/src/reports/*/purchase-items/` y
> `repgen-frontend/src/features/reports/purchase-items/`. El mapper produce
> exactamente `__golden__/esperado.json` (`purchase-items.golden.spec.ts`;
> copiado del borrador aprobado el 20/11/2026).
>
> **Comparación (paso 6), octubre 2026:** exportación de RepGen (A1, solo
> las 18 columnas visibles) contra "GASTOS" de FM (B1): mismos 74 conceptos
> y montos. Diferencias, todas esperadas y a favor de RepGen salvo nota:
> - Folio sin CFDI (13): RepGen vacío; FM "[OC#…] Falta CFDI" (decisión 3).
> - OC 1807: FM recorta el folio (`ZSD2-...1047858`); RepGen lo da completo.
> - Estatus (37): "Vencida" contra "Vigente: Vencida" (decisión 4).
> - Entrega (74): RepGen separa estatus y fecha (columna oculta "Bodega
>   Entrega Fecha"); FM las junta ("Entregado: 27/10/2026", "NO ENTREGADO", "-").
> - Tipo de concepto: RepGen normaliza mayúsculas; FM las mezcla.
> - Saldo: se repite por concepto en los dos. RepGen lo suma una vez por
>   compra (256,496.73); sumar la columna daría 388,686.49.
> - OC 1749: ver Anomalías.
> Totales de octubre: Resultado 818,116.36; facturas una vez por compra
> 856,912.77 (la diferencia es la OC 1749 más centavos); saldo 256,496.73.

- Nombre interno: `purchase-items` (decidido 20/11/2026).
- Endpoint: `reports/compras-conceptos/buscar`
- Ruta frontend y reportId: `/compras/conceptos`, reportId `compras_conceptos`.
  Compras tendrá dos pestañas, como Ventas: **Compras** (`apiExport_Compra`,
  después) y **Conceptos** (este).
- Layout FileMaker: `apiExport_CompraITM` (tabla base `poITM_|`)
- Tipo: **rango de fechas**
- Campo de fecha del rango: `poItm_|poFACTURA_|_x_facturaIDU::area_fechaEnPagos`
  (fecha en que se aprobó la compra)
- ¿Filtra por permisos del usuario?: **no** (decidido 20/11/2026).

## Alcance

**Decidido (20/11/2026):**

- Solo compras **aprobadas**: las que tienen `area_fechaEnPagos`. Una compra
  en Cotización o No aprobado no tiene la fecha y no aparece.
- Una compra aprobada que pasa a **Cerrado** (liquidada) conserva la fecha y
  sigue apareciendo.
- Una compra cancelada o regresada pierde la fecha y **desaparece también de
  los reportes de periodos pasados**. Se acepta: no hay registro histórico
  para reconstruirlo.
- El estatus es de la compra, no del concepto: no hay conceptos cancelados
  dentro de una compra aprobada.
- No hay devoluciones de compra.
- Un renglón por concepto (`poITM`). Los datos de la compra se repiten en
  cada concepto.

## Contrato de respuesta

`POST reports/compras-conceptos/buscar` recibe `dateRange` y responde
`{ "data": ReportPurchaseItemRecord[] }`. Ejemplo: [api_response.json](api_response.json).

- Todas las filas traen las mismas llaves. Texto vacío en FileMaker → `""`;
  número o fecha vacíos → `null`; lo que no aplica al renglón → `null`.
- Montos como número, fechas ISO `YYYY-MM-DD` (FileMaker manda `MM/DD/YYYY`).
- Los saltos de línea de FileMaker (`\r`) se cambian por un espacio. Hay en
  nombres de artículo (OC 1775, 1812, 1813) y en la cuenta contable del
  proveedor (OC 1800). El CSV de FM los cambia por un tabulador vertical
  (`\u000b`), que en Excel se ve pegado ("lainformación").
- Nombres de campo y encabezados iguales a Ventas cuando es el mismo dato
  (`articulo*`, `factura*`, `categoriadeProducto*`).

### Columnas: encabezado FM → respuesta → FileMaker

Prefijos: `F:` = `poItm_|poFACTURA_|_x_facturaIDU::`, `P:` = `poItm_|PROV_|_x_facturaIDU::`,
`I:` = `poItm_|inv.ITM_|_x_invItmID::`, `U:` = `poItm_|USER_|_x_facturaIDU::`,
`B:` = `poItm_|BODEGA_|_x_facturaIDU::`, `K:` = `poItm_|contBANCO_|_x_facturaIDU::`.
Sin prefijo = campo de `poITM`.

| #  | Encabezado FM | Campo | Encabezado RepGen | Tipo | Origen | Regla |
|----|---|---|---|---|---|---|
| 1  | Fecha Aprobado | `compraFechaAprobado` | Compra Fecha Aprobado | date | `F:area_fechaEnPagos` | |
| 2  | Número de OC | `compraId` | Compra ID | number | `poItm_\|PO_\|_x_po::__id_po` | FM muestra "OC# 1587"; aquí el número |
| 3  | Factura Rep Compra | `compraRepDeCompra` | Compra Rep de Compra | text | `U:userData_nombre_Completo` | trim |
| 4  | Proveedor Nombre | `proveedor` | Proveedor Nombre Comercial | text | `P:local_NombreComercial` | |
| 5  | Proveedor Razón Social | `proveedorRazonSocial` | Proveedor Razón Social | text | `P:fiscal_RazonSocial` | trim (OC 1804 trae espacio inicial) |
| 6  | — | `proveedorRfc` | Proveedor RFC | text | `P:fiscal_RFC` | no está en el CSV |
| 7  | Proveedor Cuenta Contable | `proveedorCuentaContable` | Proveedor Cuenta Contable | text | `P:cuentaContable_Temp_v0_20_2r` | `\r` → espacio |
| 8  | Factura UUID | `facturaUuid` | Factura UUID | text | `F:cfdi_UUID` | `""` si falta CFDI |
| 9  | Factura Folio | `facturaSerieFolio` | Factura Serie y Folio | text | `F:cfdi_serie_v0_15_1` + "-" + `F:cfdi_folio` | sin CFDI → `null` |
| 10 | Factura Fecha | `facturaFecha` | Factura Fecha | date | `F:cfdi_fecha` | sin CFDI → `null` |
| 11 | Factura Gran Total (MXN) | `facturaGranTotalMxn` | Factura Gran Total (MXN) | currency | `F:monto_MXN_GranTotal` | se repite por concepto |
| 12 | Factura Observaciones | `facturaObservaciones` | Factura Observaciones | text | `F:factura_observaciones_v0_18_1` | `\r` → espacio |
| 13 | Factura Status Actual | `facturaEstatus` | Factura Estatus | text | `F:area_is_Cotizacion_noAprobado_Pagos_Cerrado` + `F:saldo_fecha_pagoLimite` | ver decisión 4 |
| 14 | Factura Saldo Actual | `facturaSaldoActual` | Factura Saldo Actual | currency | `F:saldo_MXN_pendiente_GranTotal_saldoGeneral` | se repite por concepto |
| 15 | Fecha Límite de Pago | `facturaFechaLimiteDePago` | Factura Fecha Límite de Pago | date | `F:saldo_fecha_pagoLimite` | |
| 16 | Cuenta de Pago | `bancoNombre` | Banco Nombre | text | `K:datos_nombre` | FM junta nombre y cuenta: "BBVA Egresos - 0000000001" |
| 16b | (ídem) | `bancoNumeroCuenta` | Banco Número de Cuenta | text | `K:datos_cuentaNumero` | vacío en Tarjeta Clara y Caja Chica |
| 17 | Factura Moneda | `facturaMoneda` | Factura Moneda | text | `F:_idu_moneda\|v0_18_1` | |
| 18 | Factura Tipo de Cambio | `facturaTipoDeCambio` | Factura Tipo de Cambio | number | `F:tc_tipoCambioValor_v0_18_1` | |
| 19 | Factura Gran Total (En Moneda Timbrado) | `facturaGranTotalOriginal` | Factura Gran Total (Moneda Original) | currency | calculado | `facturaGranTotalMxn / facturaTipoDeCambio`, 2 decimales |
| 20 | Artículo SKU | `articuloSku` | Artículo SKU | text | `I:itm_SKU` | |
| 21 | Artículo Marca | `articuloMarca` | Artículo Marca | text | `I:itm_Marca` | |
| 22 | Artículo Nombre | `articuloNombre` | Artículo Nombre | text | `I:itm_Name` | `\r` → espacio |
| 23 | Artículo Nombre Completo | `articuloNombreCompleto` | Artículo Nombre Completo | text | `I:itm_Name_Display` | el CSV lo trae vacío; FileMaker sí lo tiene |
| 24 | Artículo Cuenta Contable | `articuloCuentaContable` | Artículo Cuenta Contable | text | `I:cuentaContable_ingresoOrInventario_v0_27_1` | vacío en los 74; el cliente no lo usa |
| 25 | Tipo De Venta, (2), (3), Clasificacion de Merchandising | `categoriadeProducto1`…`4` | Artículo Categoría 1…4 | text | `poItm_\|inv.ITM.classify1…4_\|_x_invItmID::name_v0_20_0` | encabezado de "Etiquetas de columnas" (`articulo.categoria1…4`), igual que Ventas. Vacías en los 74 |
| 26 | Tipo de Gasto | `tipoDeConcepto` | Artículo Tipo de Concepto | text | `is_stock_incrementable_gasto_costo` | FM mezcla mayúsculas (STOCK/Stock, GASTO/Gasto): se normaliza a `Stock`, `Gasto`, `Incrementable`, `Costo` |
| 27 | Cantidad | `cantidad` | Artículo Cantidad | number | `qty_Ordered` | puede ser decimal (OC 1724: 0.1) |
| 28 | Unidad | `unidadDeCompra` | Artículo Unidad de Compra | text | `"[" + I:_idu_satUnitUso + "] " + poItm_\|sat.UNITventa_\|_x_invItmID::unitNombre` | "[H87] Pieza", igual que FM; clave vacía → `""` (no pasa en octubre) |
| 29 | Precio Unitario (MXN) | `precioUnitario` | Artículo Precio Unitario | currency | `unit_MXN_importe_SINdescuento` | |
| 30 | — | `articuloImporteSinDescuentoMxn` | Artículo Importe sin Descuento (MXN) | currency | cantidad × unitario | **PENDIENTE 2** |
| 31 | — | `articuloDescuentoMontoMxn` | Artículo Descuento Monto (MXN) | currency | sin − con descuento | |
| 32 | Importe con Descuento (MXN) | `articuloImporteConDescuentoMxn` | Artículo Importe con Descuento (MXN) | currency | cantidad × `unit_MXN_importe_CONdescuento` | **PENDIENTE 2** |
| 33 | IVA (MXN) | `articuloIVAMxn` | Artículo IVA (MXN) | currency | cantidad × `unit_MXN_impuesto_trasladoIVA` | |
| 34 | IEPS (MXN) | `articuloIEPSMxn` | Artículo IEPS (MXN) | currency | cantidad × `unit_MXN_impuesto_trasladoIEPS` | |
| 35 | IVA Retenido (MXN) | `articuloIVARetenidoMxn` | Artículo IVA Retenido (MXN) | currency | cantidad × `unit_MXN_impuesto_retenidoIVA_v0_18_1` | |
| 36 | ISR Retenido (MXN) | `articuloISRretenidoMxn` | Artículo ISR Retenido (MXN) | currency | cantidad × `unit_MXN_impuesto_retenidoISR_v0_18_1` | |
| 37 | Gran Total (MXN) | `articuloGranTotalMxn` | Artículo Gran Total (MXN) | currency | cantidad × `unit_MXN_GranTotal` | |
| 38 | Bodega Nombre | `bodegaNombre` | Bodega Nombre | text | `B:bodega_nombre` | `Gasto` → `null` (FM muestra "-"); trim ("Primus ") |
| 39 | Bodega Entrega Status | `bodegaEntregaEstatus` | Bodega Entrega Estatus | text | calculado de `recibir_fecha` | `Gasto` → `null`; con fecha → `Entregado`; sin fecha → `Pendiente` |
| 40 | (ídem) | `bodegaEntregaFecha` | Bodega Entrega Fecha | date | `recibir_fecha` | vacía → `null` |

Comprobado contra el CSV (74 de 74 conceptos, emparejados por OC, nombre y
precio): las columnas 1–8, 11, 14, 16, 20–22, 26 y 27 coinciden. Los montos
32–37 (cantidad × unitario) coinciden al centavo en los 74. La entrega
calculada de `recibir_fecha` da el mismo texto que el CSV en los 74
("Entregado: 27/10/2026", "NO ENTREGADO", "-" en gastos).

**Decidido (20/11/2026): la entrega es por concepto.** Por eso sale de
`recibir_fecha` (de `poITM`) y no de `F:entrega_is_Entregado_Pendiente`, que
es de la compra.

Campos del layout que no van a la respuesta:
- `F:entrega_is_Entregado_Pendiente`: es de la compra; la entrega es por concepto.

**Trampa:** la unidad que usa FM es la **de uso/venta** del artículo
(`_idu_satUnitUso` + `sat.UNITventa`), no la de contenido
(`_idu_satUnitCont` + `sat.UNITcontenido`). La de contenido difería en 7
conceptos (OC 1759 "CINTA ADHESIVA": Pieza contra "[E48] Unidad de servicio";
vacía en 1752, 1777, 1800 ×3 y 1802). La de uso coincide en los 74.

## Lógica de negocio

1. **Búsqueda**: una petición por rango sobre `F:area_fechaEnPagos` en
   `apiExport_CompraITM` (`BaseReportService`, sin permisos).
2. **Un registro → un renglón.** Sin portales.
3. **Montos**: en MXN tal como vienen de FileMaker; la moneda y el tipo de
   cambio solo sirven para `facturaGranTotalOriginal`. Los montos del
   concepto (cantidad × unitario) se redondean a 6 decimales, como `tasa6`
   en Ingresos: quita el ruido de punto flotante (3200 × 12.39 =
   39648.000000000004) y conserva lo que muestra FM (22,499.999211). En octubre todo es MXN
   (TC 1): la conversión se valida con un segundo juego que tenga una compra en USD.
4. **Gasto vs. Stock**: un concepto `Gasto` no tiene bodega ni entrega
   (`null`). En octubre 56 conceptos son Gasto y 18 son Stock.
5. **Orden**: por `compraId` ascendente y, dentro de la compra, en el orden de
   FileMaker (el CSV va así: OC 1587, 1703, 1718…). FileMaker **no** devuelve
   los conceptos agrupados por compra (OC 1703 y 1724 salen partidas), así
   que el orden por `compraId` es necesario; con orden estable da el mismo
   orden que el CSV.
6. **Cuadre por compra**: Σ `articuloGranTotalMxn` de sus conceptos =
   `facturaGranTotalMxn` (± centavos). Cuadra en 50 de 51 compras; ver
   anomalía de OC 1749.

## Resumen / KPIs

**Decidido (20/11/2026):**

- "Resultado" = Σ `articuloGranTotalMxn` (lo que se aprobó comprar en el periodo).
- Panel lateral: importe con descuento, IVA, IVA retenido, ISR retenido, y
  total por `tipoDeConcepto` (Stock / Gasto).
- `facturaGranTotalMxn` y `facturaSaldoActual` se repiten en cada concepto:
  si se muestran en el pie, se suman **una vez por `compraId`**
  (`TotalesTabla.unaVezPor`, como Bancos Complementos).
- Una sola moneda (MXN).

## PENDIENTES

1. ~~Unidad de la compra~~ **Resuelto (20/11/2026):** el script de FM usa
   la unidad de uso del artículo (`_idu_satUnitUso` + `sat.UNITventa::unitNombre`).
   Agregada al layout; coincide con el CSV en los 74 conceptos. Ver columna 28.
2. ~~Montos del renglón~~ **Decidido (20/11/2026):** se calculan aquí como
   cantidad × unitario de FileMaker (coincide al centavo con el CSV en los 74).
3. ~~Compra sin CFDI~~ **Decidido (20/11/2026):** `facturaSerieFolio` y
   `facturaFecha` en `null`, `facturaUuid` en `""` (13 conceptos, 7 compras:
   1587, 1718, 1724, 1749, 1752, 1761, 1792).
   FM pone de folio "[OC#1587] Falta CFDI" y de fecha la de aprobado: es una
   diferencia esperada en la comparación.
4. ~~Estatus~~ **Decidido (20/11/2026):** `Liquidado` (área Cerrado) |
   `Vencida` (área Pagos y fecha límite < hoy) | `Vigente` (área Pagos, fecha
   límite ≥ hoy). "Hoy" es la fecha de la consulta, igual que el "Status
   Actual (20/11/2026)" de FM. En octubre: 37 Liquidado y 37 Vencida. FM
   escribe "Vigente: Vencida": diferencia de texto esperada en la comparación.
   Para los tests, "hoy" se inyecta (fecha fija).
5. ~~KPIs~~ **Decidido (20/11/2026):** ver "Resumen / KPIs".
6. ~~Encabezados nuevos~~ **Decidido (20/11/2026):** agregar "Compra" y
   "Proveedor" a `ENTIDADES` de `nombres-columnas.test.ts`, como se hizo con
   "Conciliación". Proveedor no usa "Cliente/Proveedor" porque aquí nunca es
   cliente.

## Anomalías de los datos (para decidir)

- **OC 1749 (SAT, impuestos de octubre)**: sus 5 conceptos suman
  −17,850.87 y la factura dice 20,945.50. "IVA a Cargo" es negativo
  (−38,796.37). El CSV de FM trae lo mismo. **En revisión** (la persona la
  revisa en FileMaker). El reporte la muestra tal cual viene.
  En la comparación: el total de la factura (20,945.50) es exactamente ISR
  retenido + IVA retenido (8,019.42 + 12,926.08); deja fuera el IVA a cargo
  negativo. Un IVA a cargo negativo es saldo a favor, no un pago: el total de
  la factura parece correcto y el concepto negativo es el que resta 38,796.37
  al "Resultado".
  **Decidido (20/11/2026): se corrige en FileMaker**, no con una regla en el
  reporte. Los datos dorados se quedan como están: documentan el caso de un
  monto negativo, y el mapper lo muestra tal cual venga.
- 20 conceptos con proveedor sin razón social ni RFC (OC 1749, 1792, 1802, 1807…).
- `factura_observaciones` vacía en 34; `cfdi_*` vacíos en 13 (sin CFDI).
- Rep de compra vacío en los 5 conceptos del SAT.
- OC 1817 ("Playera blanca") es la única con SKU y marca juntos; SKU vacío en 70 de 74.

## Casos que deben estar en los datos dorados

Borrador en [datos-dorados/](datos-dorados/): `entrada-conceptos.json`
(13 compras, 28 conceptos de octubre, anonimizados), `rango.json` (octubre;
`hoy` = 2026-10-31 para el estatus) y `esperado-borrador.json` (28 renglones,
armado desde el CSV del ERP con un script aparte).

`hoy` = 31/10/2026 y no 20/11 para que salgan los tres estatus: con el 20/11
todas las compras con saldo están vencidas.

- [x] Compra con conceptos Stock y Gasto mezclados (OC 1703)
- [x] Stock entregado (1703, 1724) y pendiente (1587, 1759, 1792)
- [x] Gasto: bodega y entrega en `null` (16 renglones)
- [x] FileMaker devuelve la compra partida (1703, 1724): el orden la junta
- [x] Compra sin CFDI: folio y fecha `null` (1587, 1724, 1749, 1792)
- [x] Servicio con IVA e ISR retenidos (1769) y flete con IVA retenido (1720)
- [x] Cantidad decimal (1724: 0.1 kg)
- [x] Nombre con `\r` (1775) y observaciones con `\r` (las pone el anonimizador)
- [x] Estatus Liquidado (12), Vencida (11) y Vigente (5, OC 1749 con límite 05/11)
- [x] Proveedor sin razón social ni RFC (1749, 1792)
- [x] Rep de compra vacío (1749)
- [x] Montos negativos y compra que no cuadra (1749)
- [x] Bodega distinta de SANS General (1792, 1802 Primus)
- [x] Unidad de uso distinta de la de contenido (1759 CINTA: E48) y sin unidad de contenido (1800, 1802 IPA)
- [x] Banco sin número de cuenta (1804 Tarjeta Clara, 1805 Caja Chica)
- [x] Razón social con espacio inicial (1804)
- [ ] Cuenta contable del proveedor con `\r` (1800): el anonimizador la
      reemplaza completa y el `\r` se pierde. Lo cubre el test unitario.
- [ ] Compra en USD, concepto con descuento, categorías llenas, tipo
      Incrementable o Costo, fecha límite = `hoy`: **no hay en octubre** →
      segundo juego (`__golden__/reciente/`) o test unitario.

Totales del borrador: Resultado (Σ `articuloGranTotalMxn`) = 233,137.14;
Stock 183,099.54, Gasto 50,037.60; Σ `facturaGranTotalMxn` una vez por
compra = 271,933.51 (la diferencia, 38,796.37, es la OC 1749); saldo una
vez por compra = 172,398.04.
