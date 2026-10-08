# Evaluación OData y revisión de arquitectura

Fecha: 2026-10-08

## Contexto

Este documento responde dos preguntas:

1. ¿Conviene migrar la integración con FileMaker de la **Data API** a **OData**?
2. ¿Qué tan bien está la arquitectura del proyecto, con énfasis en el frontend React, y qué cambiaría?

Datos de partida, confirmados con el equipo:

- **FileMaker Server:** 22.0.6.600 (2025). El equipo controla el archivo FM, así que puede crear TOs, campos calculados y cuentas con el privilegio `fmodata`.
- **Volumen:** un reporte trae menos de 5,000 registros en un rango de 1 mes.
- **Filtrado:** se queda **del lado del cliente** (AG Grid). La búsqueda global y los filtros en servidor no se reactivarán.

## Resumen ejecutivo

1. **OData sí conviene, pero no como prioridad #1 ni de golpe.** Se hace después de limpiar el código muerto, empezando con un *spike* medible en Bancos y un criterio explícito para decidir si se continúa. El beneficio principal es código más simple y robusto (sin sesiones, valores tipados, fechas ISO, filtros booleanos reales). No hay una ganancia de rendimiento garantizada.
2. **Había una fuga de datos.** La clave de caché de reportes no incluía al usuario, así que un usuario podía recibir durante 60 s el reporte de bancos filtrado con los permisos de otro del mismo tenant. *Corregido en la Fase 0.*
3. **Había otros problemas críticos en el backend** (*corregidos en la Fase 0*):
   - el rate limit global estaba prácticamente apagado (`ttl: 60` = 60 ms);
   - `JWT_SECRET` tenía `'default_secret'` como respaldo;
   - `MASTER_KEY` funcionaba en producción;
   - el tenant se interpolaba en la URL de FileMaker sin validarse;
   - los errores de FileMaker se trataban como "sin datos" y se cacheaban;
   - los permisos de bancos se cacheaban para siempre.
4. **Alrededor del 40–60 % de la lógica de filtros está muerta,** tanto en backend como en frontend. La búsqueda global está oculta, `filterModel` siempre llega vacío y se pide con `limit=999999`. Borrarla simplifica todo y abarata la migración a OData.
5. **El frontend está bien encaminado, pero tiene una migración de estructura a medias.** `features/`, `shared/` y `app/` son re-exports de las carpetas viejas. Además:
   - las dos pantallas duplican la misma orquestación;
   - AG Grid se registra completo (`AllCommunityModule`, con un chunk de 1,012 KB minificado);
   - no hay un cliente HTTP común.

---

## Parte 1: Data API → OData

### 1.1 Cómo se usa FileMaker hoy

- **Sesiones:** [`FileMakerService`](../../repgen-backend/src/filemaker/filemaker.service.ts) maneja sesiones por BD (mapa de tokens), un *cooldown* de autenticación, dedupe de logins y reintento ante 401. Antes de la Fase 0, ese patrón estaba copiado en 7 métodos.
- **Lecturas:** `_find` sobre layouts dedicados (`apiExport_bancoITM`, `apiExport_Venta`, `apiExport_VentaITM`) con `limit=999999`. Los datos relacionados llegan como **portales** y campos `TO::campo` con nombres como `contBanco.ITM|contBANCO_|_x_bancoID::datos_nombre` (ver [relations/](../../repgen-backend/src/filemaker/relations/)).
- **Mapeo:** `FieldMapHelper` + `*_PORTAL_SOURCE_BY_KEY` + esquemas Ajv con tipos `["number","string"]` (la Data API devuelve `""` en números vacíos) + `TypeGetters`.
- **Fechas:** se envían a FM en `MM/DD/YYYY` (`makeFilterString`) y se reciben en el mismo formato. `DateFormatUtils.formatDateToYMD` hace la conversión.
- **Queries:** la Data API solo permite OR entre *requests*, así que `makeFilterString` arma un producto cartesiano de permisos × campos de fecha × filtros × campos de búsqueda global. Ventas con búsqueda global = 3 × 20 = 60 requests. Con la UI actual, solo se usan fechas y permisos.
- **Escrituras:** `api_auth` (buscar y borrar el token de login) y `api_configReporte` (CRUD de vistas de columnas).

### 1.2 Qué se gana con OData en este proyecto

| Beneficio | Impacto concreto aquí |
|---|---|
| Autenticación sin sesión (Basic por request) | Desaparecen el mapa de tokens, `authInFlight`, el cooldown y el reintento 401; ya no se consumen sesiones de la Data API |
| `$filter` con `and`/`or`/paréntesis | Una sola query: `(fechaA ge X and fechaA le Y) or (fechaB …)`, sin explosión de requests |
| Valores tipados (Edm.Decimal, Edm.Date ISO 8601) | Se eliminan las uniones `["number","string"]` en Ajv, los `getNumber("")` y el parseo de `MM/DD/YYYY` |
| `$select` / `$expand(...;$select=...)` | Payload explícito por request, sin depender del diseño de un layout |
| `$batch` con transacciones | Cambiar la vista predeterminada (desmarcar la anterior y marcar la nueva) se vuelve atómico |
| `$count`, `$apply` (agregados, mejorados en 2025) | Opcional: KPIs calculados en el servidor. Con menos de 5k filas no hace falta |

### 1.3 Costos y riesgos

- **No ahorra cuota.** OData y la Data API comparten el mismo límite anual de transferencia saliente.
- **No hay benchmark publicado** que muestre que OData es más rápido. Hay que medirlo con datos reales (ver el spike).
- **Se reescribe la capa de infraestructura de cada reporte:**
  - field maps: `TO::campo` pasa a navegación + campo;
  - portales: pasan a `$expand`, que devuelve arrays;
  - esquemas Ajv;
  - `FieldMapHelper`.
- **El filtro por campos relacionados es limitado.** No se soportan los lambdas `any`/`all`. Existe la sintaxis `Relacion/campo eq …`, pero su semántica hay que verificarla en el spike. Esto afecta dos casos:
  - **Permisos de bancos:** hoy filtran por el *nombre* del banco relacionado. Deben pasar a filtrar por `_id_banco`, que es un campo local de `contBanco.ITM`. Para eso, `api_permisoBancos` tiene que devolver IDs.
  - **Fecha de devolución en ventas:** es un campo relacionado (`DEVO::cfdi_fechaTimbre`). Requiere un campo local almacenado o una segunda query.
- **Filtros de portal:** los que estén definidos en los layouts `apiExport_*` no se aplican en `$expand`. Hay que revisar cada portal.
- **Nombres:** las TOs con `|` y `.` y los campos que empiezan con `_` requieren comillas o codificación en `$filter`. La recomendación es crear **TOs dedicadas para OData** con nombres simples (`od_BancoITM`, `od_Banco`, `od_Cliente`…), igual que hoy existen los layouts `apiExport_*`.
- **Fechas en el frontend:** si el backend pasa a devolver ISO (`2026-10-01`), `formatearFecha` ([format.ag-grid.ts](../../repgen-frontend/src/utils/ag-grid/format.ag-grid.ts)) hace `new Date("2026-10-01")`, que es medianoche UTC. En México eso **se muestra como el día anterior**, así que hay que corregirlo antes de migrar. Lo mismo aplica a `inRangeDate` y `formatDateToYMD` en el backend.

### 1.4 Veredicto

**Conviene, en este orden: limpieza → spike → migración por reporte.**

Con el filtrado del lado del cliente, la query necesaria se reduce a "rango de fechas sobre 1–3 campos + permisos", lo que achica mucho lo que hay que portar. El valor principal es la simplificación (sin sesiones, valores tipados, ISO, filtros booleanos) y que la integración dependa de TOs estables en vez de layouts. No conviene migrar sin medir antes.

### 1.5 Plan de migración

**Paso 0: prerequisitos en FileMaker**
- Habilitar OData en el Admin Console.
- Crear una cuenta de solo lectura con el privilegio extendido `fmodata`.
- Crear TOs `od_*` con nombres simples para bancos y sus relaciones (relaciones de igualdad).
- Hacer que `api_permisoBancos` exponga el ID del banco.

**Spike (2–3 días, sin tocar código de producción)**

Un script `repgen-backend/scripts/spike-odata-bancos.mjs`, al estilo de `scripts/testapi.js`, que para el mismo tenant y un rango de 1 mes:
- ejecute la consulta actual de la Data API y su equivalente OData (`$select` + `$expand` + `$filter` por fecha e `_id_banco`);
- reporte la latencia p50/p95 en 10 corridas, el tamaño del payload y el número de registros;
- verifique:
  - la semántica de `Relacion/campo` en `$filter`;
  - si `$expand` admite `$filter`/`$select` anidados;
  - el límite de `$top` y el uso de `@odata.nextLink`.

**Criterio para continuar:** OData con latencia ≤ 120 % de la Data API, mismos registros y permisos expresables por ID. Si no se cumple, se queda la Data API (cuyo servicio ya quedó refactorizado en la Fase 0).

**Migración (si el spike pasa; estimación gruesa: 2–3 semanas)**
1. Crear `src/filemaker/odata.client.ts` mínimo: Basic auth, timeout, seguimiento de `nextLink` y parseo de errores.
2. Migrar los reportes en este orden: bancos → ventas → ventas por concepto. Para cada uno:
   - un mapper nuevo `filaOData → Report*Record`;
   - un **test golden** que compare la salida del mapper viejo y la del nuevo sobre el mismo snapshot;
   - una variable de entorno por reporte para alternar el transporte.
3. Después: etiquetas de columnas, features del tenant, configs de reporte (con `$batch`) y, al final, el login (`api_auth`).
4. Tras 1–2 semanas estable, borrar:
   - el camino de la Data API;
   - los layouts `apiExport_*`;
   - la configuración de portales de `FieldMapHelper`;
   - las uniones de tipos en Ajv.

---

## Parte 2: Revisión de arquitectura

### 2.1 Lo que está bien y se conserva

**Backend**
- Capas por feature (presentation, application, domain, infrastructure).
- Generador de field maps.
- Logger Winston estructurado.
- `ValidationPipe` con whitelist, helmet y throttling por ruta.
- Cookie httpOnly con proxy same-origin.
- Dedupe de requests en vuelo.

**Frontend**
- React 19 con **React Compiler activo** (preset de babel en `vite.config.ts`), así que no hacen falta `useMemo`/`useCallback` manuales.
- Uso correcto del patrón "ajustar estado durante el render" en lugar de efectos.
- Cancelación de efectos con una bandera.
- Columnas definidas por esquema JSON.
- Reducer para el menú de vistas.
- Etiquetas por tenant con respaldo en `sessionStorage`.
- Buena cobertura de tests de componentes.

**Monorepo**
- pnpm workspaces.
- Tipos compartidos solo como tipos.
- CI por app con path filters.

### 2.2 Backend: hallazgos

| # | Severidad | Hallazgo | Estado |
|---|---|---|---|
| B1 | **Crítico** | La clave de caché y la de requests en vuelo no incluían `user`. Bancos filtra por permisos de usuario, así que un usuario podía recibir el reporte de otro durante 60 s ([base-report.service.ts](../../repgen-backend/src/reports/application/shared/base-report.service.ts)) | Corregido |
| B2 | **Crítico** | `ThrottlerModule` con `ttl: 60`. En throttler v6 son milisegundos, así que el límite global real era de 100 req / 60 ms | Corregido |
| B3 | **Crítico** | `JWT_SECRET` tenía `'default_secret'` como respaldo en el módulo y en el guard | Corregido |
| B4 | **Crítico** | `MASTER_KEY` emitía un JWT (id 2) para **cualquier tenant**, también en producción | Corregido |
| B5 | **Alto** | El `tenant` del login se interpolaba en la URL de FM sin validarse. `encodeURI` no escapa `/ ? #` y `getRecord`/`create`/`edit`/`delete` no codificaban. Si faltaba el token o el tenant, la respuesta era 200 con `{message}` | Corregido |
| B6 | **Alto** | `findRecords`/`getAllRecords` no revisaban `response.ok` ni `messages[0].code`. Un error real (102 campo inexistente, 105 layout faltante, privilegios) se convertía en un reporte vacío **cacheado**. Solo el código 401 ("no records match") significa vacío | Corregido |
| B7 | **Alto** | Permisos de bancos guardados en un `Map` sin expiración: un acceso revocado persistía hasta reiniciar | Corregido |
| B8 | Medio | El patrón token→request→401→reauth estaba copiado 7 veces. `logoutFileMaker` (sin usar) no tenía timeout y leía `data.message.code` cuando la Data API devuelve `messages[]` | Corregido |
| B9 | Medio | `HttpExceptionFilter` devolvía al cliente el `message` de errores internos que no son HTTP | Corregido |
| B10 | Medio | Lógica de filtros muerta en producción: `fieldMapping`, `globalSearchFields`, `postFilterFunction`, `matchesExistingFilter`, la mitad de `makeFilterString`, DTOs con unos 80 campos de `filterModel` y la paginación (offset/limit) | Corregido (Fase 1) |
| B11 | Medio | Un registro de FM que no cumple el esquema Ajv lanza `BadRequestException` (400, aunque el problema es del servidor o de los datos) y tumba todo el reporte | Corregido (Fase 1): responde 500 |
| B12 | Bajo | 3 `CacheModule.register` separados (con el comentario "segundos" cuando son ms); `defaultMeta.timestamp` del logger fijado al arrancar; `getFeatures` descarga hasta 100 registros solo para saber si existe un layout; helpers muertos (`applyPersonaMovimientoFields`, `applyStringFieldMapping`/`applyNumberFieldMapping`) | Corregido (Fase 1) |
| B13 | Decisión de negocio | [banks.permissions.filter.ts](../../repgen-backend/src/reports/infrastructure/banks/banks.permissions.filter.ts) agrega siempre `{_id_banco: 0}` ("Temporal, validar con Eric"), así que todos los usuarios ven los movimientos no bancarizados | Pendiente |

### 2.3 Frontend: hallazgos y qué cambiaría

**F1. Estado y props muertos** (mayor valor, menor riesgo)
- `useReporteBase` expone 15 valores, pero en producción solo se usan `datos`, `estaCargando` y las fechas. `textoBusqueda`, `busquedaActiva`, `modeloFiltros`, `paginaActual`, `limite` y `totalPaginas` nunca cambian.
- `EncabezadoReporte` recibe 9 props y en producción solo usa `titulo` y `encabezadoExtra`. El buscador vive en una rama con `mostrarBarraBusqueda = false`.
- `DrawerFiltros` solo lo importa su propio test.

*Cambio:* reducir el hook a `{datos, estaCargando, fechaDesde, fechaHasta, setFechas}`, quitar el *prop drilling* y borrar el código muerto. El request deja de enviar `globalSearch`, `filterModel`, `page` y `limit`.

**F2. Migración de estructura a medias**
- `features/**`, `shared/ui/**`, `shared/api/reports-api.ts`, `shared/utils/date-formatted.ts` y `app/layout/Layout.tsx` son **solo re-exports** de `components/`, `config/`, `interfaces/`, `services/`, `utils/` y `layout/`. Conviven dos árboles: unos imports usan el shim y otros la ruta real.
- Los barrels `features/reports/index.ts` y `features/auth/index.ts` hacen `export *` de módulos con `export default`, así que **no re-exportan nada**.

*Cambio:* mover los archivos reales y borrar los shims y las carpetas viejas. Estructura objetivo:

```text
src/
  app/            App.tsx, router.tsx, layout/(Layout, Navbar, Sidebar, navbarSlotContext)
  features/
    auth/         AuthGate.tsx, session.ts
    reports/
      banks/      ReporteBancos.tsx, columnas.ts, bancos.schema.json
      sales/      ReporteVentas.tsx, TabsVentas.tsx, KpiPanelVentas.tsx, useTotalesVentas.ts, columnas.ts, ventas.schema.json
      shared/     TablaDinamica/, FiltroFechas, AccionesTabla, ModalColumnas, ConfiguracionesColumnas/, PanelKpiLateral, CardsKpi,
                  useReporte.ts, useReporteGrid.ts, useReportConfigs.ts, column-labels/, api/, ag-grid/(construir-columnas, filtros, format)
  shared/         api/http.ts, utils/fechas.ts, ui/ComingSoon
```

**F3. Pantallas duplicadas**
- `ReporteBancos` y `ReporteVentas` repiten unas 60 líneas: `useReportConfigs`, `gridReadyRef`, `defaultAppliedRef` con el efecto de la config predeterminada, `filasVisibles`, `columnasVisibles` y el armado de la toolbar.

*Cambio:* un hook `useReporteGrid(reportId)` que devuelva `{referenciaGrid, columnasVisibles, setColumnasVisibles, filasVisibles, onGridListo, configs, refreshConfigs, actualizarFilasVisibles}`. Los KPIs siguen en cada pantalla.

**F4. AG Grid completo**
- `ModuleRegistry.registerModules([AllCommunityModule])` se llama en 2 archivos y el chunk `ag-grid-community` pesa **1,012 KB** minificado.

*Cambio:* registrar una sola vez, en `TablaDinamica`, solo los módulos que se usan: `ClientSideRowModelModule`, `TextFilterModule`, `NumberFilterModule`, `DateFilterModule`, `CustomFilterModule` y `CsvExportModule`. Después, medir el chunk con `vite build`.

**F5. Sin cliente HTTP común**
- `API_URL` está definido en 4 archivos, y `fetch` + `credentials` + el parseo de errores se repiten.
- El 401 solo se maneja en reportes; en configs, etiquetas y features no.

*Cambio:* un `shared/api/http.ts` (unas 30 líneas) con `apiFetch<T>()` que resuelva URL base, cookies, JSON y el 401 como sesión expirada.

**F6. Tipos que divergen**
- `IVentaData`/`IBancoData` duplican `ReportSalesRecord`/`ReportBankRecord` del backend y ya difieren: `ventaId` y `clienteId` son `string` en el front y `number` en el back.

*Cambio:* mover los tipos de fila a `@repgen/shared-types`.

**F7. Auth y router mezclados**
- `Autenticacion.tsx` valida la sesión, monta el provider y define todas las rutas.
- El estado `autenticado` nunca se lee.
- `Navbar` hace `JSON.parse(localStorage…)` en cada render sin try/catch, así que truena si el valor está corrupto.
- La lectura de la clave legacy `usuario` está duplicada.

*Cambio:* separar en `AuthGate` (solo la sesión), `router.tsx` y `session.ts` (lectura segura del usuario).

**F8. Menores**
- `formatearFecha` no maneja ISO correctamente (prerequisito de OData, ver 1.3).
- La altura `calc(110vh - 230px)` provoca scroll de página.
- `filtroIgual` distingue mayúsculas y acentos, mientras que `filtroContiene` normaliza.
- El botón dice "Excel" pero exporta CSV.
- `PanelKpiLateral` escribe en `localStorage` en cada `mousemove`.
- `vite.config.ts` define a la vez `manualChunks` y `codeSplitting.groups`; hay que dejar uno.
- `FloatingFilterConLimpiar` usa la API imperativa (`forwardRef`/`useImperativeHandle`); conviene pasar a componentes reactivos de AG Grid.
- `fetchTenantFeatures` vive en `column-labels.api.ts`.

### 2.4 Lo que no se haría (YAGNI)

- **Redis para caché o sesiones:** solo hace falta si se escala a varias instancias.
- **Paginación en servidor o Infinite Row Model:** no se justifica con menos de 5k filas.
- **React Query:** con 3 hooks de fetch, `apiFetch` y los hooks actuales bastan.
- **Lazy routes:** todas las rutas usan AG Grid, así que separarlas no ahorra.
- **Gestor de estado global.**

---

## Parte 3: Hoja de ruta

| Fase | Contenido | Estimación gruesa | Estado |
|---|---|---|---|
| **0** | Correcciones críticas B1–B9 y este documento | 1–2 días | **Hecho (2026-10-08)** |
| 1 | Limpieza: B10–B12 y F1 (borrar filtros y paginación muertos en back y front); `formatearFecha` (F8) | 3–4 días | **Hecho (2026-10-08)** |
| 2 | Frontend: F2 estructura, F3 `useReporteGrid`, F4 módulos AG Grid, F5 `apiFetch`, F6 tipos compartidos, F7 AuthGate | 4–6 días | Pendiente |
| 3 | Prerequisitos en FileMaker, spike OData y decisión | 2–3 días | Pendiente |
| 4 | Migración a OData por reporte (si el spike pasa) | 2–3 semanas | Pendiente |

Pendiente con negocio: B13 (`_id_banco: 0`).

### Detalle de la Fase 0 aplicada

- **B1:** el `cacheKey` de `BaseReportService` incluye el `user`.
- **B2:** el throttler global usa `ttl: 60000`.
- **B3:** `JwtModule` usa `getOrThrow('JWT_SECRET')`, así que la app no arranca sin la variable. El guard usa el secreto del módulo.
- **B4:** la master key solo se acepta si `NODE_ENV !== 'production'`.
- **B5:**
  - nuevo `LoginTokenDto`; el tenant solo admite letras, dígitos, espacio, `_` y `-`, y el `ValidationPipe` responde 400 si no cumple;
  - `FileMakerService` codifica BD, layout y recordId con `encodeURIComponent`;
  - ⚠ **antes de desplegar**, confirmar que los nombres reales de las BD cumplen ese patrón.
- **B6 + B8:**
  - un único `request()` privado en `FileMakerService` (token, timeout, una reautenticación ante 401, errores de FM como excepción);
  - el código FM 401 se devuelve como resultado vacío solo en `find`/`getAll`;
  - se eliminó `logoutFileMaker`, que no tenía llamadores.
- **B7:** los permisos de bancos usan `CACHE_MANAGER` con un TTL de 5 min.
- **B9:** los errores que no son HTTP responden `Internal server error`; el detalle sigue en el log.

### Detalle de la Fase 1 aplicada

**Contrato nuevo de `POST /reports/{bancos|ventas|ventas-por-concepto}/buscar`**
- Body: `{ dateRange: { startDate, endDate } }` con fechas `YYYY-MM-DD` (DTO común `SearchReportDto`). No hay query params.
- Respuesta: `{ data }` con todos los registros del rango.
- ⚠ **Backend y frontend se despliegan juntos.** Con `forbidNonWhitelisted`, un frontend anterior (que envía `globalSearch`/`filterModel`) recibe 400.

**Backend**
- `BaseReportService.fetchReport(dateRange, dbName, user)` reemplaza a `fetchFromFileMakerWithFilters`.
- La query queda en "permiso × campo de fecha" y la caché se indexa por tenant + usuario + rango.
- Se eliminaron:
  - `fieldMapping`, `globalSearchFields`, `postFilterFunction` y `matchesExistingFilter`;
  - los tipos `Filter*Model`/`FilterModel`;
  - los 3 DTOs con unos 80 campos;
  - la paginación;
  - el ajuste especial de `abono`/`cargo`.
- **B11:** si un registro no cumple el esquema Ajv, la respuesta es 500 y se registra en el log. No se descarta el registro en silencio, porque faltarían filas en los totales.
- **B12:**
  - `getAllRecords` acepta `limit` y features/etiquetas piden 1 registro;
  - se quitó el `timestamp` fijo del logger;
  - se borraron los helpers muertos;
  - los 3 `CacheModule` siguen separados (cada uno con su propio límite de entradas) y solo se corrigió el comentario de unidades.
- Las plantillas de `generate:field-map` y `scripts/testapi.js` usan el contrato nuevo.

**Frontend**
- **F1:** `useReporteBase` expone solo `{datos, estaCargando, fechaDesde/Hasta}`. `EncabezadoReporte` recibe solo `titulo` y `encabezadoExtra`. Se borraron el buscador oculto y `DrawerFiltros`.
- **F8:** `formatearFecha` interpreta `YYYY-MM-DD` como fecha local. Los tests de Vitest corren en `America/Mexico_City` para que ese desfase también se detecte en CI (que corre en UTC).

---

## Fuentes (OData)

- [Claris: API solution comparison](https://help.claris.com/en/odata-guide/content/api-solution-comparison.html)
- [Claris: Query option $filter](https://help.claris.com/en/odata-guide/content/query-option-filter.html)
- [Claris: Query option $expand](https://help.claris.com/en/odata-guide/content/query-option-expand.html)
- [Claris: OData unsupported features](https://help.claris.com/en/odata-guide/content/odata-unsupported-features.html)
- [Claris: About the OData API limit](https://help.claris.com/en/server-help/content/config-fmodata-limits.html)
- [Claris: Query option $apply (FM22)](https://help.claris.com/archive/fm22/en/odata-guide/content/query-option-apply.html)
- [DB Services: OData in FileMaker 2025](https://dbservices.com/blog/odata-whats-new-in-filemaker-2025)
- [ProofKit: relationships in FM OData](https://proofkit.dev/docs/fmodata/relationships)
- [Beezwax: OData for FileMaker](https://blog.beezwax.net/odata-for-filemaker-new-player-in-an-old-game/)
