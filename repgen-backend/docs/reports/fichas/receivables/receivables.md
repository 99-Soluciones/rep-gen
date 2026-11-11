# Ficha: Cuentas por cobrar

> Basada en el reporte de la versión anterior "Cuentas por cobrar al 1 nov"
> (CSV, corte 01/11/2026, 527 filas). Lo marcado **PENDIENTE** lo decide la
> persona dueña del reporte. Guía:
> [docs/guides/COMO-AGREGAR-REPORTE.md](../../../../../docs/guides/COMO-AGREGAR-REPORTE.md)

- Nombre interno: `receivables`
- Endpoint: `reports/cuentas-por-cobrar/buscar`
- Ruta frontend: `/cuentas_por_cobrar` (ya existe en el menú como "Próximamente")
- ¿Filtra por permisos del usuario?:No, de momento, solamente desde Filemaker, solamente los usuarios ciertos permisos podrán acceder en general, a todos los reportes, bancos si tiene permisos porque aunque sea administrador, no puede ver los bancos de los clientes si no tiene permisos.

## Decisión técnica: es una foto a fecha de corte, no un rango

Todos los reportes actuales traen lo que pasó **entre dos fechas**
(`BaseReportService.buildQuery` filtra por rango). Cuentas por cobrar muestra
**lo que se debe en un momento**: facturas emitidas en 2022 siguen apareciendo
si tienen saldo.

**Decidido: corte histórico.** El usuario elige la fecha de corte (por
defecto hoy) y el reporte muestra lo que se debía **al cierre de ese día**.
Ejemplo: una factura liquidada el 6 nov sale con saldo en un corte al 5 nov.

FileMaker guarda el saldo de hoy; el saldo al corte **se reconstruye hacia
atrás**: saldo de hoy + lo que se pagó o aplicó después del corte (ver
[Lógica de negocio](#lógica-de-negocio)). Con corte = hoy da exactamente el
saldo de FileMaker.

Cambios a código compartido que esto implica (el agente los hace como primer
paso, con su test, antes del reporte):

- Backend: `ReportConfig` acepta condiciones de búsqueda propias en lugar de
  `dateField`; el endpoint recibe `fechaCorte` (un día) en lugar de
  `dateRange`. La caché es por tenant + usuario + `fechaCorte` (TTL de 60 s
  ya existente).
- Frontend: un solo selector de fecha de corte (por defecto hoy), sin
  comparación con periodo anterior; el encabezado muestra "Corte: <fecha>" y
  el botón Actualizar.

## Fuentes: cuatro tipos de renglón

El reporte mezcla cuatro orígenes en una sola tabla (columna "Tipo de transacción"):

| Tipo                                  | Filas en la muestra | Origen probable en FM                            | Saldo que aporta                                                         |
| ------------------------------------- | ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| Factura vigente: Vencida / Por vencer | 171 / 25            | Ventas (factura)                                 | Saldo pendiente = vencido + por vencer (cuadra en el 100% de la muestra) |
| Abono con saldo por complementar      | 101                 | Ingresos (pago del cliente no aplicado del todo) | Saldo no aplicado (en contra)                                            |
| Abono no identificado                 | 229                 | Movimientos de banco sin cliente                 | Monto sin identificar                                                    |
| Cargo por aplicar                     | 0                   | Egreso a un cliente (devoluciones, poco común)   | Saldo no aplicado (a favor del cliente)                                  |

**Decidido: dos layouts**, Uno de los layouts obtiene los datos de las tablas Ventas y Ingresos, y el otro obtiene los datos de la tabla Banco, donde indica si ese movimiento es de un cliente o no.

| Fuente                                         | Layout                   | Búsqueda                          | Datos dorados           |
| ---------------------------------------------- | ------------------------ | --------------------------------- | ----------------------- |
| Facturas                                       | `apiExport_CxC_Facturas` | timbrada ≤ corte y (saldo ≠ 0 o liquidada después del corte), no cancelada | `entrada-facturas.json` |
| Bancos (abonos y cargos)                       | `apiExport_CxC_Bancos`   | movimiento con fecha ≤ corte y (saldo ≠ 0 o aplicado después del corte)    | `entrada-bancos.json`   |

Respuesta cruda de cada layout y su validación:
`CxC_Facturas_ResponseFM` + `CxC_Facturas.schema.json`,
`CxC_Bancos_ResponseFM` + `CxC_Bancos.schema.json`.

"≠ 0" en FileMaker = dos peticiones (`>0` OR `<0`), o solo `>0` si el saldo
nunca es negativo. Un solo `esperado.json` con los tipos unidos.

Implementación: `GetReceivablesReportUseCase` consulta los dos layouts en la
sesión `'reportes'` y une el resultado; reutiliza la caché de los demás
reportes (`fetchCached`) sin generalizar `ReportConfig`, que sigue siendo de
un layout con rango.

## Contrato de respuesta

`POST reports/cuentas-por-cobrar/buscar` recibe `{ "fechaCorte": "YYYY-MM-DD" }`
(si falta, hoy en `America/Mexico_City`; una fecha futura responde 400) y responde
`{ "fechaCorte": "YYYY-MM-DD", "data": ReportReceivablesRecord[] }`.
Ejemplo con un renglón de cada tipo y datos inventados:
[api_response.json](api_response.json).

Reglas del contrato:

- **Todas las filas traen las mismas 42 llaves.** Si un campo no aplica al tipo
  de renglón va en `null`, no `""` ni `0`: un `0` en un saldo diría "saldo
  cero". Excel / Power Query y AG Grid ven siempre las mismas columnas.
- **Montos como número** (`5910.06`), sin `$` ni comas.
- **Fechas en ISO `YYYY-MM-DD`**: el frontend ya las interpreta (`parsearFecha`)
  y un consumidor de la API no las confunde con DD/MM. FileMaker las entrega
  como `MM/DD/YYYY`; el mapper las convierte.
- **`fechaCorte` va una vez en la raíz**, no repetida en cada fila. Amplía
  `ReportResponse` solo para este reporte.
- **Nombres** con las convenciones de Ventas: `cliente*`, `factura*`,
  `clasificacionN` = valor del cliente ("On Trade").
- **Sin etiquetas de clasificación en la respuesta.** El nombre de cada
  clasificación ("Canal", "Cadena"…) lo da el módulo `tenant`
  (`GET /tenant/column-labels` → `cliente.clasificacion1–4`), y el frontend lo
  pone como encabezado con `useColumnLabels().getLabel`, igual que en Ventas.
  Un consumidor de la API lo pide a ese mismo endpoint.
- **Todos los montos en MXN.** Los movimientos en otra moneda se convierten
  (paso 4), así las columnas se pueden sumar y los KPIs son un solo número.
  Sin sufijo `Mxn` en los nombres: aplica a todos los montos.

### Encabezados del reporte anterior → respuesta → FileMaker

F = factura · A = abono por aplicar · N = abono no identificado · C = cargo por aplicar.
Campo FM: **Fac.** = `CxC_Facturas`, **Ban.** = `CxC_Bancos`; los nombres son
relativos al layout (se omite el prefijo de la relación cuando es largo). En
Ban., los datos del cliente salen por `CLIENTE.ingreso` / `prefCliente.ingreso`
en abonos y por `CLIENTE.egreso` / `prefCliente.egreso` en cargos.

| #     | Encabezado anterior                 | Campo de respuesta         | Tipo     | Aplica | Origen en FileMaker                                                                                      | Nota                                                                                     |
| ----- | ----------------------------------- | -------------------------- | -------- | ------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 0     | Fecha Corte                         | `fechaCorte`               | date     | F A N C| parámetro de la petición                                                                                 | también en la raíz; el mismo valor en todas las filas (lo pidieron los usuarios)          |
| 1     | Tipo de Transaccion                 | `tipoTransaccion`          | text     | F A N C| calculado                                                                                                | `Factura vencida` · `Factura por vencer` · `Factura cerrada: No cobrar` · `Abono por aplicar` · `Abono no identificado` · `Cargo por aplicar` |
| 2     | Cliente ID                          | `clienteId`                | number   | F A C  | Fac. `CLIENTE_::___id_cliente` · Ban. `CLIENTE.ingreso::___id_cliente` (C: `CLIENTE.egreso::`)           |                                                                                          |
| 3     | Cliente Nombre Comercial            | `cliente`                  | text     | F A N C| `…::destLocal_dirNombreComercial` (ambos)                                                                | `SIN IDENTIFICAR` en N                                                                   |
| 4     | Cliente Razón Social                | `clienteRazonSocial`       | text     | F A C  | `…::fiscal_RazonSocial` (ambos)                                                                          |                                                                                          |
| 5     | Cliente RFC                         | `clienteRfc`               | text     | F A C  | `…::fiscal_RFC` (ambos)                                                                                  |                                                                                          |
| 6–9   | Canal / Cadena / Segmento / Zona    | `clasificacion1–4`         | text     | F A C  | Fac. `venta_\|cliente.ClassifyN\|_x_clienteID::name` · Ban. `prefCliente.ingreso\|_x_IDUclassifyN::name` (C: `prefCliente.egreso`) | valor del cliente (p. ej. "Centro de consumo"); encabezado desde `tenant/column-labels`  |
| 10    | Cliente Cuenta Contable             | `clienteCuentaContable`    | text     | F A C  | `…::cuentaContableTemp_v0_20_2r` (ambos)                                                                 |                                                                                          |
| 11    | Cliente Rep Ventas Vigente          | `clienteRepDeVenta`        | text     | F A C  | Fac. `USER.repVent_\|_x_clienteID::_idu_user_name` · Ban. `ingreso.user.repVent::_idu_user_name` (C: `egreso.user.repVent`) | el vigente del cliente                                                                   |
| 12    | Factura Serie y Folio               | `facturaSerieFolio`        | text     | F      | `cfdi_facturaSerieFolio_v0_18_1`                                                                         |                                                                                          |
| 13    | Factura Gran Total                  | `facturaGranTotal`         | number   | F      | `monto_GranTotal`                                                                                        |                                                                                          |
| 14    | Factura UUID                        | `facturaUuid`              | text     | F      | `cfdi_UUID`                                                                                              |                                                                                          |
| 15    | Factura Fecha                       | `facturaFecha`             | date     | F      | `cfdi_FacturaFechaTimbrar`                                                                               |                                                                                          |
| 16    | Factura Metodo Pago                 | `facturaMetodoPago`        | text     | F      | `_idu_cdfi_metoPago`                                                                                     | PPD / PUE                                                                                |
| 17    | Factura Días de Crédito             | `facturaDiasCredito`       | number   | F      | `credit_dias`                                                                                            | días de la venta (no los vigentes del cliente)                                           |
| 18    | Factura Fecha de Vencimiento        | `facturaFechaVencimiento`  | date     | F      | `saldo.FechaLimitePago`                                                                                  |                                                                                          |
| 19    | Factura Fecha de Liquidación        | —                          |          |        | `saldo_fecha_liquidacion_*`                                                                              | **excluido**: solo se usa en la búsqueda; vacía en toda la muestra                       |
| 19b   | Factura Días Vencida (nuevo)        | `facturaDiasVencida`       | number   | F      | calculado: corte − vencimiento                                                                           | días naturales si está vencida; `0` si está por vencer                                   |
| 20    | Factura Status                      | `facturaEstatus`           | text     | F      | calculado: `saldo.FechaLimitePago` vs. corte                                                             | `Vencida` · `Por vencer` · `No cobrar`                                                                 |
| 21    | Factura Rep Venta                   | `facturaRepDeVenta`        | text     | F      | `USER_\|_x_repVent::_idu_user_name`                                                                      | el de la factura                                                                         |
| 22    | Factura Rep Cobranza                | `facturaRepDeCobranza`     | text     | F      | `USER.repCobranza_::_idu_user_name`                                                                      |                                                                                          |
| 23    | Factura Saldo Pendiente             | `facturaSaldoPendiente`    | number   | F      | calculado: saldo de hoy + pagos de `PagosVenta` > corte                                                   | = vencido + por vencer                                                                   |
| 24    | Factura Saldo Vencido               | `facturaSaldoVencido`      | number   | F      | calculado                                                                                                | saldo pendiente si está vencida, si no `0`                                               |
| 25    | Factura Saldo Por Vencer            | `facturaSaldoPorVencer`    | number   | F      | calculado                                                                                                | saldo pendiente si no está vencida, si no `0`                                            |
| 26    | No Cobrar Gran Total                | `facturaNoCobrarGranTotal` | number   | F      | calculado                                                                                                | saldo de una factura "No cobrar"; si no, `0` (va después de saldo por vencer)            |
| 27    | No Cobrar IVA                       | `facturaNoCobrarIva`       | number   | F      | Fac. `monto_contraIVA`                                                                                   | IVA de la factura (viene en todas); se muestra solo si es "No cobrar" al corte, a pedido de clientes; si no, `0`|
| 28    | No Cobrar IEPS                      | `facturaNoCobrarIeps`      | number   | F      | Fac. `monto_contraIEPS`                                                                                  | IEPS de la factura (viene en todas); se muestra solo si es "No cobrar" al corte; si no, `0`|
| 28b   | Fecha No Cobrar (nuevo)             | `facturaNoCobrarFecha`     | date     | F      | Fac. `saldo_fecha_liquidacion_bancoITM_noCobrar`                                                         | solo en una factura "No cobrar" al corte; si no, `null` (también si viene vacía)          |
| 29    | Abono Saldo No Aplicado (En Contra) | `abonoSaldoNoAplicado`     | number   | A      | calculado: saldo hoy + aplic. > corte                                                                    | con cliente en el ingreso                                                                |
| 30    | Cargo Saldo No Aplicado (A Favor)   | `cargoSaldoNoAplicado`     | number   | C      | calculado: saldo hoy + aplic. > corte                                                                    | positivo = a favor del cliente; vacío en la muestra                                      |
| 31    | Abono Monto Sin Identificar         | `abonoMontoSinIdentificar` | number   | N      | calculado: saldo hoy + aplic. > corte                                                                    | sin cliente en el ingreso                                                                |
| 32    | Ingreso ID                          | `ingresoId`                | number   | A      | Ban. `contINGRESO_::__id_ingreso`                                                                        |                                                                                          |
| 33    | Egreso ID                           | `egresoId`                 | number   | C      | Ban. `contEGRESO_::__id_egreso`                                                                          | vacío en la muestra                                                                      |
| 34    | Banco Folio Transaccion             | `bancoFolioTransaccion`    | number   | A N C  | Ban. `__id_bancoITM`                                                                                     |                                                                                          |
| 35    | Banco Nombre                        | `bancoNombre`              | text     | A N C  | Ban. `contBANCO_::datos_nombre`                                                                          |                                                                                          |
| 35b   | Banco Cuenta Contable (nuevo)       | `bancoCuentaContable`      | text     | A N C  | Ban. `contBANCO_::cuentaContable_Temp_v0_20_2r`                                                          | cuenta contable del banco; vacía en la BD de los datos dorados (aún sin cuentas contables)                                                                |
| 36    | Banco Fecha                         | `bancoFecha`               | date     | A N C  | Ban. `_fecha`                                                                                            |                                                                                          |
| 37    | Banco Monto                         | `bancoMonto`               | number   | A N C  | Ban. `monto_ORIG_abono_v0_22_1` (cargo: `monto_ORIG_cargo_v0_22_1`) × `tc_tipoCambioValor_v0_26_1`      | en MXN                                                                                   |
| 38    | Banco Referencia                    | `bancoReferencia`          | text     | A N C  | Ban. `mConceptoDeBancoTexto_v0_20_0`                                                                     |                                                                                          |
| 39    | Venta ID                            | `ventaId`                  | number   | F      | Fac. `__id_venta`                                                                                        |                                                                                          |

Campos del layout que no van a la respuesta: `cfdi_FacturaFolio` (ya va en
serie-folio), `area__is_…_Cancelada` y `saldo_fecha_liquidacion_*` (solo
filtran), `saldo_Pendiente_GranTotal`, `saldo_ORIG_porComplementar_v0_22_1` y
los portales de pagos/aplicaciones (solo para calcular el saldo al corte),
`saldo_isPendiente_Cobrado_NoCobrar_Cancelado` (es el estatus de hoy, no sirve
para un corte pasado), `_id_banco`, `tc_tipoCambioValor_v0_26_1`, `_concil_id_cliente`.

**Decidido:** se agrega `facturaDiasVencida` (no existía en la versión
anterior) y se mantienen `cargoSaldoNoAplicado` y `egresoId`: los cargos a
favor existen (devoluciones), aunque son poco comunes.

## Lógica de negocio

Cómo se llega de los registros de FileMaker a `api_response.json`. El mapper
(`cleanData`) implementa exactamente estos pasos; cada regla tiene su caso en
los datos dorados. Lo marcado **PENDIENTE** bloquea los datos dorados de esa
parte.

### 1. Fecha de corte

- `fechaCorte` = el día que manda el usuario; si no manda ninguno, hoy en
  `America/Mexico_City`. Una fecha futura responde 400.
- Los saldos son **al cierre de ese día**: cuenta todo lo fechado hasta el
  día de corte inclusive (un pago del mismo día del corte sí resta).
- Las comparaciones usan **solo el día** (sin hora).

### 2. Consultas a FileMaker

Dos búsquedas en la sesión `'reportes'`. FileMaker solo sabe el saldo de hoy,
así que la búsqueda trae **todo lo que pudo tener saldo al corte** y el mapper
calcula el saldo real (paso 4). En una búsqueda de FileMaker cada petición
une sus condiciones con Y, y las peticiones entre sí con O.

**Facturas (`CxC_Facturas`)**: 4 peticiones, todas con
`cfdi_FacturaFechaTimbrar` `≤ corte` y `cfdi_UUID` no vacío, más una de omitir:

| Petición | Condición adicional                                  | Para qué                                    |
| -------- | ---------------------------------------------------- | ------------------------------------------- |
| 1        | `saldo_Pendiente_GranTotal` `>0`                     | facturas con saldo hoy                      |
| 2        | `saldo_Pendiente_GranTotal` `<0`                     | saldos negativos (sobrepagos)               |
| 3        | `PagosVenta::fecha_ingresoITM_fechaDelComplemento` `>corte` | con algún pago complementado **después** del corte |
| 4        | `area__is_…_Cancelada` = `Cancelada` y `cfdi_CANCEL_timestamp_v0_23_1r` `> corte 23:59:59` | canceladas **después** del corte (su saldo de hoy es 0) |
| omitir   | `area__is_…_Cancelada` = `Cancelada` y `cfdi_CANCEL_timestamp_v0_23_1r` `≤ corte 23:59:59` | canceladas en o antes del corte             |

- Se filtra por **fecha de timbrado**, no por `saldo.FechaLimitePago`: una
  factura emitida antes del corte se debe aunque todavía no venza. La fecha
  límite solo decide vencida / por vencer (paso 3). Una factura timbrada
  después del corte no existía ese día.
- Las facturas pagadas antes del corte no se traen (no cumplen ninguna
  petición): así la búsqueda no crece con toda la historia.
- `saldo_isPendiente_Cobrado_NoCobrar_Cancelado` **ya no filtra**: dice el
  estatus de hoy, y una factura cobrada después del corte hoy dice "Cobrado"
  pero al corte sí debía.
- UUID no vacío (**decidido**): una cotización o pedido sin factura no es
  cuenta por cobrar.
- **Portal `PagosVenta`**: en el layout muestra todos los pagos de la venta.
  Aun así, el Data API recorta los portales a 50 registros si la petición no
  dice otra cosa (la configuración del layout no lo evita), así que el backend
  manda `limit.PagosVenta` alto; si no, el saldo al corte sale mal sin aviso.
- **Fecha de cancelación**: `cfdi_CANCEL_timestamp_v0_23_1r` (timestamp). Una
  factura cancelada **después** del corte sí debía al corte y sale; solo se
  omiten las canceladas en o antes del corte. Una cancelada sin timestamp se
  omite siempre.
- **Petición 3 busca en el campo del portal**: en FileMaker, buscar en un
  campo relacionado trae el registro si **algún** renglón relacionado cumple.
  "Algún pago con complemento después del corte" es justo "al corte todavía
  debía ese pago". Se prefiere a `saldo_fecha_liquidacion_ingresoITM_v0_22_1r`
  (fecha en que la factura se liquida por completo) porque usa exactamente la
  misma fecha que el cálculo del paso 4; así búsqueda y cálculo no pueden
  diferir.

**Bancos (`CxC_Bancos`)**: todas las peticiones con `_fecha` `≤ corte`:

| Petición | Condición adicional                                                                        | Para qué                                    |
| -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| 1        | `monto_ORIG_abono_v0_22_1` `>0` y `saldo_ORIG_porComplementar_v0_22_1` `≠0`                | abonos con saldo hoy                        |
| 2        | `monto_ORIG_abono_v0_22_1` `>0` y portal: `fecha_ingresoITM_fechaDelComplemento` `>corte`  | abonos aplicados **después** del corte      |
| 3        | `monto_ORIG_cargo_v0_22_1` `>0`, `contEGRESO_::_concil_id_cliente` no vacío y saldo `≠0`   | cargos a un cliente con saldo hoy           |
| 4        | `monto_ORIG_cargo_v0_22_1` `>0`, egreso con cliente y portal de egresos: fecha `>corte`    | cargos aplicados **después** del corte      |

- **Portal de aplicaciones (agregado)**: `contBanco.ITM|contINGRESO.ITM|_x_bancoItmID`,
  un renglón por aplicación del abono a una venta (`__idu_ingreso_itm`,
  `app_MXN_GranTotal`, `_id_relacionado_Venta`,
  `fecha_ingresoITM_fechaDelComplemento`, `app_tc_complemento_v0_28_1`). No
  tiene nombre de objeto, así que su llave en el Data API es el nombre de la
  ocurrencia de tabla; el backend pide `limit.<esa llave>` alto, igual que en
  Facturas.
- **Petición 2 busca en el campo del portal**, igual que la petición 3 de
  Facturas: no hace falta un campo de "fecha de última aplicación"; la más
  reciente del portal es la del último abono aplicado.
- **Sin fecha de cancelación**: los pagos en Bancos no la guardan; solo
  Facturas la tiene (paso anterior).
- **Decidido: una aplicación cuenta en la fecha del complemento, en los dos
  layouts.** Un abono depositado antes del corte y complementado después
  sale al corte con su saldo sin aplicar, y la factura sigue debiendo ese
  monto. La misma aplicación resta en Bancos y en Facturas el mismo día, así
  que el dinero no sale dos veces ni ninguna.

Otro límite: un abono **identificado después** del corte (se le asignó
cliente después) sale como "por aplicar", aunque al corte era "no
identificado". Para corregirlo haría falta la fecha de identificación.
**Decidido**: aceptarlo.

**Cargos por aplicar** (devoluciones; poco comunes): un cargo de banco cuyo
egreso tiene cliente. Un cargo sin cliente (pago a proveedor, comisión) no es
de cobranza y no sale.

- **Cliente del cargo**: por la relación del egreso, `CLIENTE.egreso`
  (`___id_cliente`, `destLocal_dirNombreComercial`, `fiscal_RazonSocial`,
  `fiscal_RFC`, `cuentaContableTemp_v0_20_2r`), `prefCliente.egreso`
  (clasificaciones 1–4) y `egreso.user.repVent` (rep. de venta). Los abonos
  usan los mismos campos por el ingreso (`CLIENTE.ingreso`,
  `prefCliente.ingreso`, `ingreso.user.repVent`).
- **Portal de aplicaciones del egreso**: `contBanco.ITM|contEgreso.ITM|_x_bancoItmID`
  (`__idu_egreso_itm`, `app_MXN_GranTotal`, `_id_relacionado_Ingreso`,
  `fecha_egresoITM_fechaDelComplemento_v0_20_2r`, `app_tc_complemento_v0_28_1`).
  También sin nombre de objeto; el backend pide su `limit.` alto.
- **Petición 4**: `monto_ORIG_cargo_v0_22_1` `>0`, egreso con cliente y
  portal de egresos: `fecha_egresoITM_fechaDelComplemento_v0_20_2r` `>corte`
  (cargos aplicados **después** del corte).

### 3. Tipo de renglón

| Origen   | Condición                                                                              | `tipoTransaccion`       |
| -------- | -------------------------------------------------------------------------------------- | ----------------------- |
| Facturas | "No cobrar" al corte (paso 4)                                                          | `Factura cerrada: No cobrar` |
| Facturas | vencimiento **<** día de corte (y no es "No cobrar")                                                         | `Factura vencida`       |
| Facturas | vencimiento **≥** día de corte                                                         | `Factura por vencer`    |
| Bancos   | abono cuyo ingreso tiene cliente (`contINGRESO_::_concil_id_cliente` distinto de vacío y de 0) | `Abono por aplicar`     |
| Bancos   | abono sin cliente                                                                      | `Abono no identificado` |
| Bancos   | cargo con cliente (`contEGRESO_::_concil_id_cliente`)                                  | `Cargo por aplicar`     |

Una factura que vence el mismo día del corte es **por vencer**: así sale en la
versión anterior (vencimiento 01/11/2026, corte 01/11/2026 → "Por Vencer").

### 4. Cálculo de cada campo

**Facturas**

- `facturaFechaVencimiento` = `saldo.FechaLimitePago`. Si viene vacío
  (**decidido**): `facturaFecha` + `facturaDiasCredito` días.
- `facturaEstatus` = `No cobrar` si al corte ya estaba marcada así (ver abajo);
  si no, `Vencida` / `Por vencer`, con la misma regla del tipo.
- `facturaDiasVencida` = días naturales entre `facturaFechaVencimiento` y el
  día de corte si está vencida (vence 08/10, corte 01/11 → 24); `0` si está
  por vencer. Sirve para la antigüedad (0–30, 31–60, 61–90, +90).
- `facturaSaldoPendiente` = **saldo al corte** = `saldo_Pendiente_GranTotal`
  (saldo de hoy) + Σ `app_MXN_GranTotal` de los renglones de `PagosVenta` con
  `fecha_ingresoITM_fechaDelComplemento` **>** corte.
  - Se parte del saldo de hoy y no del gran total porque hay movimientos que
    bajan el saldo sin estar en el portal (notas de crédito, ajustes). Con
    corte = hoy no se suma nada y queda el saldo de FileMaker.
  - **Cancelada después del corte**: la cancelación deja su saldo de hoy en 0,
    así que saldo al corte = `monto_GranTotal` − Σ pagos de `PagosVenta` con
    fecha ≤ corte. Lo detectó la comparación con el ERP al 01/10/2026
    (F-2675 y F-2937, canceladas el 27/10).
  - **No cobrar** (**decidido**, a pedido de dirección y clientes): **sí sale**,
    con su saldo, para que se tome en cuenta en la contabilidad. Una factura
    `NoCobrar` conserva su `saldo_Pendiente_GranTotal`, así que entra por las
    peticiones de saldo. `facturaEstatus` = `No cobrar` si
    `saldo_isPendiente_Cobrado_NoCobrar_Cancelado` = `NoCobrar` y
    `saldo_fecha_liquidacion_bancoITM_noCobrar` ≤ corte o vacía (sin fecha no
    se sabe cuándo se marcó). Si se marcó después del corte, ese día era una
    factura normal. Hay que revisar el estatus: ese campo de fecha también
    trae la fecha del depósito en facturas cobradas (p. ej. F-31).
  - **Saldo de una "No cobrar"** (**decidido**, a pedido de dirección): va
    solo en `facturaNoCobrarGranTotal`; `facturaSaldoPendiente`,
    `facturaSaldoVencido` y `facturaSaldoPorVencer` van en `0`. Así el saldo
    pendiente es solo lo cobrable y el panel muestra "No cobrar (aparte)".
    En las demás facturas `facturaNoCobrarGranTotal` = `0`.
  - **Tipo y desglose de una "No cobrar"** (**decidido**): `tipoTransaccion` =
    `Factura cerrada: No cobrar`; `facturaNoCobrarIva` / `facturaNoCobrarIeps` =
    `monto_contraIVA` / `monto_contraIEPS` (**confirmado**: es el IVA / IEPS de
    toda factura, pero a pedido de los clientes solo se muestra en las
    "No cobrar"). En las demás facturas, incluida una marcada después del
    corte, van en `0`; en bancos, `null`.
  - **Moneda**: aunque la factura se timbre en otra moneda, FileMaker guarda
    el saldo y los pagos en MXN, así que la suma es directa en MXN.
- `facturaSaldoVencido` = saldo pendiente si está vencida; si no, `0`.
- `facturaSaldoPorVencer` = saldo pendiente si está por vencer; si no, `0`.
  Por construcción, pendiente = vencido + por vencer en cada fila (en la
  versión anterior cuadra en el 100% de las 196 facturas).
- Campos de abono y banco → `null`.

**Abonos por aplicar**

- `abonoSaldoNoAplicado` = **saldo al corte**, calculado **en moneda
  original** y al final pasado a MXN:
  1. cada aplicación del portal con `fecha_ingresoITM_fechaDelComplemento`
     **>** corte, en moneda original = `app_MXN_GranTotal` ÷
     `app_tc_complemento_v0_28_1` (el TC con el que se aplicó);
  2. saldo original al corte = `saldo_ORIG_porComplementar_v0_22_1` (hoy) + Σ (1);
  3. saldo en MXN = (2) × `tc_tipoCambioValor_v0_26_1` (el TC del depósito).

  Se parte del saldo de hoy porque hay abonos que se liquidan sin pasar por el
  portal (en los datos dorados, los movimientos 1 y 10: saldo 0 y portal
  vacío); restar el portal al monto los dejaría con saldo para siempre. En MXN
  el TC es 1 y todo queda igual.
- **Ingreso menor que el depósito** (**decidido**, igual que el ERP): la parte
  del depósito que no quedó en el ingreso del cliente no es suya.
  - sobrante = `monto_ORIG_abono_v0_22_1` × TC − `contINGRESO_::monto_MXN_GranTotal`
    (no menor que 0 ni mayor que el saldo).
  - `Abono por aplicar` = saldo − sobrante; el sobrante sale aparte como
    `Abono no identificado`, con el mismo folio de banco.
  - Ej. REVUELTA QUEER HOUSE: depósito $984, ingreso $960, aplicado $24 →
    $936 por aplicar + $24 no identificado.
  - Sin monto de ingreso, o con saldo negativo, no se divide.
- `bancoMonto` = `monto_ORIG_abono_v0_22_1` × `tc_tipoCambioValor_v0_26_1` (el
  movimiento completo en MXN; el saldo es la parte que aún no se aplica a
  facturas, nunca mayor que el monto).
- Datos del cliente desde `CLIENTE.ingreso` y `prefCliente.ingreso`.
- Campos de factura → `null`.

**Abonos no identificados**

- `abonoMontoSinIdentificar` = saldo al corte, con la misma regla.
- `cliente` = `SIN IDENTIFICAR`; el resto de los campos de cliente y
  clasificaciones → `null`.
- Campos de factura → `null`.

**Cargos por aplicar**

- `cargoSaldoNoAplicado` = saldo al corte, con la misma regla que los abonos (incluida la división: la parte del movimiento que no está en `contEGRESO_::monto_MXN_GranTotal` no sale, porque no es de cobranza)
  pero con el portal de egresos (`fecha_egresoITM_fechaDelComplemento_v0_20_2r`
  > corte). Va
  **positivo**: el nombre de la columna ya dice que es a favor del cliente.
- `bancoMonto` = `monto_ORIG_cargo_v0_22_1` × TC; `egresoId` = `contEGRESO_::__id_egreso`.
- Campos de factura y de abono → `null`.

**Todos**

- Fechas de FileMaker (`MM/DD/YYYY`) → `YYYY-MM-DD`. Fecha vacía → `null`.
- Textos con `trim()` (la versión anterior trae nombres como `"Ali  "`).
  Texto vacío en un campo que aplica al tipo → `""`; en uno que no aplica →
  `null`.
- Números con `TypeGetters.getNumber`; los montos se redondean a 2 decimales.

### 5. Exclusiones

| Caso                                  | Regla                                                  | Origen                                             |
| ------------------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| Factura o abono con saldo al corte 0  | no sale (`\|saldo\| < 0.005` tras redondear)            | anomalía de la versión anterior; pagadas el mismo día del corte |
| Renglón sin tipo (cliente sin montos) | no sale: no hay forma de generarlo con estas reglas    | anomalía de la versión anterior                    |
| Abono con saldo menor a $1            | **sí sale** (decidido: se muestra toda la información) | 41 casos en la muestra                             |
| Factura PUE con saldo                 | **sí sale**: señala un pago sin conciliar              | 14 casos en la muestra                             |

### 6. Orden de las filas

El test de datos dorados compara listas, así que el orden es parte del contrato:

1. Por tipo: `Factura vencida`, `Factura por vencer`, `Factura cerrada: No cobrar`, `Abono por aplicar`, `Cargo por aplicar`, `Abono no identificado`.
2. Dentro del tipo, por fecha ascendente: `facturaFechaVencimiento` en facturas, `bancoFecha` en abonos y cargos.
3. Desempate: `ventaId` en facturas, `bancoFolioTransaccion` en abonos y cargos.

### 7. Cuadres para validar

Con los mismos datos, el reporte nuevo debe cumplir:

- Σ `facturaSaldoPendiente` = Σ `facturaSaldoVencido` + Σ `facturaSaldoPorVencer`.
- Σ `abonoSaldoNoAplicado` ≤ Σ `bancoMonto` de los abonos por aplicar.
- **Con corte = hoy**, cada saldo es el de FileMaker (`saldo_Pendiente_GranTotal`,
  `saldo_ORIG_porComplementar_v0_22_1` × TC). Por construcción; si no, el
  mapper está sumando pagos que no son posteriores al corte.
- Contra la versión anterior con `fechaCorte` = `2026-11-01`: los cinco totales
  de "Resumen / KPIs".


## Anomalías de la versión anterior (decididas)

- 1 factura con gran total $0.00 y saldo $0.00 listada como vencida → se excluye (saldo cero).
- 41 abonos con saldo sin aplicar menor a $1 (residuos de redondeo, p. ej. $0.50) → salen.
- 1 renglón sin tipo de transacción (cliente de mostrador, sin montos) → se excluye.
- 14 facturas PUE con saldo (PUE = pagada en una exhibición) → salen: en teoría
  ya estarían pagadas, así que indican que falta conciliar el pago.
- Abonos no identificados desde 2023 → salen todos, sin antigüedad máxima.

## Resumen / KPIs

Cifras de la muestra al 01/11 (para validar el reporte nuevo):

| KPI                        | Monto         |
| -------------------------- | ------------- |
| Saldo pendiente (facturas) | $5,133,133.42 |
| · Vencido                  | $2,694,759.20 |
| · Por vencer               | $2,438,374.22 |
| Abonos no aplicados        | $2,602,110.33 |
| Abonos sin identificar     | $1,076,517.69 |

**PENDIENTE:** ¿Resultado principal = saldo pendiente, o neto (pendiente − abonos no aplicados)?
Sugerencia de panel lateral: vencido vs por vencer, antigüedad (0–30, 31–60,
61–90, +90 días vencida, con `facturaDiasVencida`), y abonos por aplicar.

## Casos que deben estar en los datos dorados

En lugar de `rango.json`, este reporte usa `corte.json`; el test es
`cleanData(entrada, corte)`. Primer juego (en `datos-dorados/`): los primeros 20
registros de cada layout con corte `2024-06-10`, elegido para que esos
registros cubran pagos antes y después del corte.

- [ ] factura liquidada **después** del corte (sale con su saldo al corte)
- [ ] factura con un pago antes y otro después del corte (solo resta el primero)
- [ ] pago fechado el mismo día del corte (sí resta)
- [ ] factura liquidada el mismo día del corte (no sale)
- [ ] factura timbrada después del corte (no sale)
- [ ] factura marcada no cobrar después del corte (sale como factura normal)
- [ ] factura no cobrar antes del corte o sin fecha (sale con estatus `No cobrar`)
- [ ] factura vencida con saldo parcial
- [ ] factura por vencer sin pagos
- [ ] factura que vence el mismo día del corte
- [ ] factura con saldo cero (no debe salir)
- [ ] factura cancelada antes del corte (no debe salir)
- [ ] venta sin UUID con saldo (no debe salir)
- [ ] factura sin `saldo.FechaLimitePago` (vencimiento calculado)
- [ ] abono con saldo por complementar (uno normal y uno menor a $1, ambos salen)
- [ ] abono depositado después del corte (no sale)
- [ ] abono en dólares con una aplicación (saldo convertido a MXN)
- [ ] factura cancelada sin timestamp de cancelación (no sale)
- [ ] abono aplicado después del corte (sale con su saldo al corte)
- [ ] factura cancelada después del corte (sale)
- [ ] abono con ingreso menor que el depósito (sale en dos renglones: por aplicar + no identificado)
- [ ] abono depositado antes del corte y complementado después (sale el abono con saldo y la factura sigue debiendo)
- [ ] factura con más de 50 pagos (el portal no se recorta)
- [ ] abono no identificado
- [ ] dos facturas con el mismo vencimiento (desempate por `ventaId`)
- [ ] cliente sin clasificaciones
- [ ] factura PUE con saldo (sale)
- [ ] cargo por aplicar a un cliente
- [ ] cargo aplicado después del corte (sale con su saldo al corte)
- [ ] cargo sin cliente (no sale)
- [ ] `facturaDiasVencida`: una vencida (días > 0) y una que vence el día del corte (0)
- [ ] nombre con espacios al final (se recorta)
