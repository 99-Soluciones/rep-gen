# DOC-7 — Frontend

**Tipo Jira:** Story / Task  
**Epic:** [DOC] RepGen — Documentación técnica y operativa  
**Component:** Frontend

---

### SUB-7.1 — Shell, routing y layout

**Summary Jira:** `[DOC-7.1] App shell y layout`

## Objetivo

Estructura de navegación y pantallas principales.

## Estado actual

- Entry: `src/main.tsx` → `src/app/App.tsx` (muestra `Autenticacion` si no hay sesión)
- Layout: `src/app/layout/` y legacy `src/layout/`
- Componentes: `Layout.tsx`, `Navbar.tsx`, `Sidebar.tsx`

## Criterios de aceptación

- [ ] Diagrama rutas / pantallas post-login
- [ ] Qué reportes aparecen en Sidebar

---

### SUB-7.2 — Autenticación UI

**Summary Jira:** `[DOC-7.2] Pantalla autenticación`

## Archivo

`src/features/auth/ui/Autenticacion.tsx`

## Flujo

1. Usuario obtiene token en FileMaker (proceso externo)
2. FE envía `POST {API}/auth/login-token` con `token` + `tenant`
3. Almacena JWT (verificar: localStorage / sessionStorage / memory)
4. Redirige a reportes

## Criterios de aceptación

- [ ] Variable `VITE_*` de URL API documentada
- [ ] Manejo de errores en UI

---

### SUB-7.3 — Reporte Bancos (UI)

**Summary Jira:** `[DOC-7.3] UI Reporte Bancos`

## Archivos

| Tipo | Ruta |
|------|------|
| Feature (objetivo) | `features/reports/banks/ui/ReporteBancos.tsx` |
| Legacy | `components/Reportes/ReporteBancos.tsx` |
| Columnas AG Grid | `config/ag-grid/Reportes/bancos/bancos.columas.ts` |
| Schema | `config/ag-grid/Reportes/bancos/bancos.schema.json` |

## Hook compartido

`shared/hooks/useReporteBase.ts` — paginación, fetch, filtros

## Criterios de aceptación

- [ ] Flujo usuario: filtros → buscar → tabla
- [ ] Endpoint llamado: `POST .../reports/bancos/buscar`

---

### SUB-7.4 — Reporte Ventas (UI)

**Summary Jira:** `[DOC-7.4] UI Reporte Ventas`

## Archivos

- `features/reports/sales/ui/ReporteVentas.tsx`
- `components/Reportes/ReporteVentas/` (tabs, tests)
- `config/ag-grid/Reportes/ventas/ventas.columnas.ts`
- `ventas.schema.json`

## Particularidades

- Tabs (`TabsVentas.tsx`) si aplica cabecera vs detalle
- Reglas de negocio reflejadas en totales/KPIs (`PanelKpiLateral`)

## Criterios de aceptación

- [ ] Relación UI ↔ reglas cancelación/devolución (SUB-6.5)

---

### SUB-7.5 — Componentes compartidos (tabla, filtros, KPI)

**Summary Jira:** `[DOC-7.5] Componentes shared reportes`

## Componentes

| Componente | Ubicación |
|------------|-----------|
| TablaDinamica | `shared/ui/TablaDinamica/` |
| Filtros / Drawer | `components/Reportes/Filtros/` (migrar a shared) |
| PanelKpiLateral | `shared/ui/PanelKpiLateral/` |
| ModalColumnas | selector columnas visibles |

## AG Grid utils

- `utils/ag-grid/export.ag-grid.ts`
- `utils/ag-grid/filters.ag-grid.ts`
- `config/ag-grid/Reportes/construir-columnas.ag-grid.ts`

## Criterios de aceptación

- [ ] Props principales de `TablaDinamica`
- [ ] Export Excel/CSV si aplica

---

### SUB-7.6 — ColumnLabelsProvider (etiquetas dinámicas en UI)

**Summary Jira:** `[DOC-7.6] ColumnLabelsProvider frontend`

**Documentación completa (frontend):**  
Ver **DOC-7.6** en [references/LINKS.md](../../references/LINKS.md) (repo `repgen-frontend`).

**Documentación E2E / API (backend):**  
Ver **DOC-4.4** en [references/LINKS.md](../../references/LINKS.md) (repo `repgen-backend`).

---

## Objetivo

Centralizar en React la carga y el uso de **encabezados de columna personalizados por tenant**, para que AG Grid (hoy en **ventas**) muestre nombres como «CANAL» o «LÍNEA» en lugar de «Clasificación 1» / «Categoría 1».

---

## Dónde vive en la app

```mermaid
flowchart TB
  LOGIN[Autenticacion - login OK] --> PROV[ColumnLabelsProvider tenant=tenantActivo]
  PROV --> ROUTER[BrowserRouter + Layout]
  ROUTER --> VENTAS[ReporteVentas]
  VENTAS --> HOOK[useColumnLabels.getLabel]
  HOOK --> AG[construirColumnasVentas + ventas.schema labelSlot]
```

- Montado en `features/auth/ui/Autenticacion.tsx` **solo después** de autenticación exitosa.
- `tenantActivo` = `user.tenant` del login o `localStorage.usuario`.

---

## Módulos

| Archivo | Rol |
|---------|-----|
| `shared/api/column-labels.api.ts` | `GET /tenant/column-labels` + JWT desde `localStorage.jwt_reportes` |
| `shared/context/column-labels.context.ts` | Context, `resolverSlot`, cache `sessionStorage` |
| `shared/context/ColumnLabelsProvider.tsx` | Fetch al montar, estado, `refreshLabels` |
| `shared/context/useColumnLabels.ts` | Hook para componentes hijos |
| `shared/config/dynamic-column-slots.ts` | Tipos de slots válidos |
| `config/ag-grid/Reportes/construir-columnas.ag-grid.ts` | `LabelResolver` → `headerName` |
| `config/ag-grid/Reportes/ventas/ventas.schema.json` | `labelSlot` + `defaultHeader` |

---

## API del contexto (`useColumnLabels`)

| Propiedad | Uso |
|-----------|-----|
| `labels` | Respuesta completa `{ cliente, articulo }` |
| `getLabel("cliente.clasificacion1")` | Texto para encabezado o `undefined` → fallback |
| `isLoading` | Fetch en curso (no usado aún en UI ventas) |
| `error` | Último error de red (puede coexistir con cache) |
| `refreshLabels()` | Refetch manual |

---

## Flujo resumido

1. **Mount:** lee `sessionStorage` `repgen:column-labels:{tenant}` si existe (pintado rápido).
2. **Fetch:** `GET` con Bearer JWT; guarda en state + sessionStorage.
3. **Error:** si hay cache de sesión, sigue usando labels cacheadas.
4. **Consumo:** `ReporteVentas` → `useMemo(() => construirColumnasVentas(type, getLabel), [type, getLabel])`.
5. **Cambio tenant:** `key={tenant}` remonta provider y evita mezclar clientes.

---

## Ejemplo antes / después (ventas)

| labelSlot | defaultHeader | API devuelve | Encabezado en grid |
|-----------|---------------|--------------|-------------------|
| `cliente.clasificacion1` | Clasificación 1 | CANAL | **CANAL** |
| `cliente.clasificacion1` | Clasificación 1 | *(vacío)* | Clasificación 1 |
| `articulo.categoria1` | Categoría 1 | LÍNEA | **LÍNEA** |

Columnas sin `labelSlot` en schema → no usan el provider.

---

## Fallback (capas)

1. State React (último fetch OK)  
2. `sessionStorage` por tenant  
3. `defaultHeader` en `ventas.schema.json`  
4. Nombre de clave del schema  

---

## Tests

`components/Reportes/ReporteVentas/ReporteVentas.test.tsx` — mock de `useColumnLabels` con `getLabel` fijo (no prueba el provider real).

---

## Alcance actual y límites

- **Sí:** ventas (facturas y conceptos), 8 slots cliente/artículo.  
- **No:** reporte bancos, pantallas ComingSoon.  
- **No expuesto en UI:** `isLoading`, `error`, `refreshLabels` (disponibles en contexto).

---

## Criterios de aceptación (Jira)

- [ ] Enlace a `COLUMN_LABELS_PROVIDER.md` en la subtarea
- [ ] Diagrama árbol React en Confluence o Jira
- [ ] Tabla antes/después con al menos 2 columnas
- [ ] Documentado fallback sessionStorage + defaultHeader
- [ ] Nota: hook solo válido bajo `ColumnLabelsProvider`

---

### SUB-7.7 — Cliente API reportes

**Summary Jira:** `[DOC-7.7] Cliente HTTP reportes FE`

## Archivos

- `src/services/api.reportes.ts` (legacy centralizado)
- `src/shared/api/reports-api.ts` (objetivo)

## Patrón llamada

- Header `Authorization: Bearer <jwt>`
- Body: `{ globalSearch, filterModel, dateRange }`
- Query: `page`, `limit`

## Criterios de aceptación

- [ ] Tabla método → URL backend
- [ ] Manejo 401 / 429

---

### SUB-7.8 — Tests frontend

**Summary Jira:** `[DOC-7.8] Tests Vitest frontend`

## Config

- `vitest.config.ts`
- `src/setupTest.ts`

## Cobertura relevante

- `ReporteVentas.test.tsx`, `ReporteBancos.test.tsx`
- `TablaDinamica.test.tsx`, `Filtros.test.tsx`
- `useReporteBase.test.tsx`

## Comando

```bash
cd repgen-frontend
pnpm test
```

## Criterios de aceptación

- [ ] Cómo ejecutar tests en CI (si aplica)
- [ ] Umbral de cobertura actual (referencia `coverage/`)
