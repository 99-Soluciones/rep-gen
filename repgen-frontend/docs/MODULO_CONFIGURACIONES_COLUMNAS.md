# Vistas guardadas (configuraciones de columnas)

Cada usuario puede guardar varias **vistas** por reporte y marcar una como
predeterminada, que se aplica sola al abrir la pantalla. Cubre frontend,
backend y FileMaker.

## Qué guarda una vista

| Parte | Contenido |
|---|---|
| Columnas | `api.getColumnState()`: visibilidad, orden, ancho, orden de filas, fijadas |
| Filtros | `api.getFilterModel()`; `null` si no hay |
| Periodo | `mes_actual`, `mes_anterior` o `anio_en_curso`; `null` si la vista no toca las fechas. Es relativo: se resuelve a fechas al abrir la vista. |

El contrato es `ReportConfigResponse` en `packages/shared-types/index.d.ts`.

- **Por tenant:** cada tenant es una base FileMaker distinta; el tenant sale
  del JWT.
- **Por usuario y reporte:** se filtran por `userId` (del JWT) y `reportId`.
  Los `reportId` actuales son `bancos`, `ventas_facturas`, `ventas_conceptos`
  y `cuentas_por_cobrar`. Quedan guardados en FileMaker: no se renombran.

## FileMaker: layout `api_configReporte`

| Campo FM | Dominio | Notas |
|---|---|---|
| `_id_configRec` | `id` | Serial propio |
| `_idu_userRec` | `userId` | Dueño de la vista |
| `configReporte_idReporte` | `reportId` | |
| `configReporte_nombre` | `name` | Máximo 60 caracteres |
| `configReporte_columnsJSON` | columnas, filtros y periodo | Texto JSON (ver abajo) |
| `configReporte_esDefault` | `isDefault` | 0 / 1 |
| `configReporte_fechaCreacion` / `_fechaModificacion` | `createdAt` / `updatedAt` | Auto-enter en FM |

Columnas, filtros y periodo viven en el mismo campo de texto, como
`{ v: 2, columns, filters, periodo }`. Las vistas antiguas guardaban solo el
arreglo de columnas y se siguen leyendo (`report-config.mapper.ts`). Los
filtros tienen un tope de 16 KB.

**La función se activa sola por tenant:** `GET /tenant/features` responde
`{ reportConfigs: true }` si el layout `api_configReporte` existe en esa base
(caché de 10 minutos). El frontend lo consulta una vez por sesión
(`useTenantFeatures`) y, si es `false`, no muestra el selector de vistas.

## Endpoints (`/api/v1/report-configs`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/report-configs?reportId=` | Vistas del usuario para ese reporte |
| POST | `/report-configs` | Crea |
| PATCH | `/report-configs/:id` | Renombra, actualiza contenido o predetermina |
| DELETE | `/report-configs/:id` | Elimina |

Reglas que aplica el backend (FileMaker no tiene restricciones declarativas):

- **Dueño:** modificar o eliminar una vista ajena responde 403.
- **Una sola predeterminada** por usuario y reporte: al marcar una, se
  desmarca la anterior.
- **Nombre único** por usuario y reporte, sin distinguir mayúsculas ni
  espacios de más: repetirlo responde 409. La comprobación es consulta y
  después escritura, sin bloqueo; un campo único en FileMaker lo cerraría.
- **Crear devuelve el registro completo:** FileMaker responde un `recordId`
  interno distinto del serial `_id_configRec`, así que el use case lo vuelve a
  leer con `getRecord(recordId)`.

## Código

### Backend (`repgen-backend/src/report-configs/`)

| Archivo | Rol |
|---|---|
| `presentation/report-configs.controller.ts` y `dto/` | Endpoints y validación |
| `application/*.use-case.ts` | Obtener, crear, actualizar, eliminar |
| `application/nombre-vista.ts` | Regla de nombre único |
| `infrastructure/report-config-field-map.ts` | Campos de FileMaker y nombre del layout |
| `infrastructure/report-config.mapper.ts` | Registro FM ↔ vista; lee los dos formatos del JSON |

### Frontend (`repgen-frontend/src/features/reports/shared/`)

| Archivo | Rol |
|---|---|
| `api/report-configs.api.ts` | Llamadas HTTP |
| `useReportConfigs.ts` | Carga las vistas de un reporte |
| `useReporteGrid.ts` | Aplica la predeterminada una vez por reporte y lleva la cuenta de si hay cambios sin guardar |
| `ConfiguracionesColumnas/vista.ts` | Capturar y aplicar una vista, periodos, comparación "sin cambios", reglas del nombre |
| `ConfiguracionesColumnas/ConfiguracionesColumnas.tsx` | Selector, menú de acciones y "Guardar como…" |
| `AccionesTabla.tsx` | Monta el botón Columnas y, si el tenant tiene la función, el selector de vistas |
| `ModalColumnas.tsx` | Solo mostrar y ocultar columnas |

Cada página de reporte pasa su `reportId` a `useReporteGrid` y a la barra
(`toolbarReporte` o `AccionesTabla`).

## Comportamiento que no es obvio

- **Aplicar la predeterminada:** el grid puede estar listo antes o después de
  que llegue la lista de vistas. `useReporteGrid` espera a tener las dos cosas
  y la aplica una sola vez por reporte.
- **"Sin cambios" se compara grid contra grid.** Tras abrir o guardar una
  vista se toma una foto del estado del grid; AG Grid normaliza el JSON
  guardado, así que comparar contra él daría falsos cambios.
- **Salir con cambios sin guardar:** cambiar de reporte o cerrar sesión con
  una vista modificada pregunta antes (`shared/utils/salidaProtegida.ts` y
  `GuardiaSalida` en `app/router.tsx`). Las dos pestañas de Ventas cuentan
  como el mismo reporte.
- **Un reporte a fecha de corte** (Cuentas por cobrar) toma el último día del
  periodo de la vista como corte.
