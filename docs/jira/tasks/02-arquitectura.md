# DOC-2 — Arquitectura y convenciones

**Tipo Jira:** Story / Task  
**Epic:** [DOC] RepGen — Documentación técnica y operativa  
**Component:** Architecture

**Fuente principal:** `PROUESTA_ARQUITECTURA.md`

---

### SUB-2.1 — Arquitectura backend por capas

**Summary Jira:** `[DOC-2.1] Capas NestJS backend`

## Objetivo

Documentar el patrón por feature en el backend de reportes.

## Capas

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Presentation | `reports/presentation/` | Controllers, DTOs |
| Application | `reports/application/` | Use cases, `BaseReportService` |
| Domain | `reports/domain/` | Tipos, contratos |
| Infrastructure | `reports/infrastructure/` | Mappers, field-maps, schemas JSON |

Módulos que **no** siguen aún el refactor completo: `auth/`, `filemaker/` (plan: mantener hasta migración).

## Criterios de aceptación

- [ ] Diagrama capas con ejemplo reporte *ventas*
- [ ] Referencia a `reports.module.ts` como wiring

---

### SUB-2.2 — Arquitectura frontend por features

**Summary Jira:** `[DOC-2.2] Estructura frontend features`

## Objetivo

Estado actual vs objetivo (`PROUESTA_ARQUITECTURA.md` §4).

## Estado actual

- **Objetivo parcial:** `src/features/reports/{banks,sales}/`, `src/app/`, `src/shared/`
- **Legacy coexistiendo:** `src/components/Reportes/`, `src/layout/`, `src/services/api.reportes.ts`

## Convención objetivo

```
features/reports/<nombre>/
  ui/          # Pantallas
  model/       # Tipos TS
  config/      # columnas AG Grid, schema JSON
  api/         # Llamadas HTTP del reporte
shared/ui/     # TablaDinamica, Filtros, etc.
```

## Criterios de aceptación

- [ ] Tabla «archivo legacy → destino»
- [ ] Nota de no romper imports durante migración

---

### SUB-2.3 — Convenciones de nombres y archivos

**Summary Jira:** `[DOC-2.3] Convenciones nombres RepGen`

## Reglas

- Archivos nuevos: **kebab-case** (`sales-field-map.ts`)
- Tipos: sufijo `.types.ts`
- Helpers: `.helper.ts`
- Schemas: `*-report.schema.json`
- Evitar prefijo `I` en interfaces nuevas
- Corregir typos conocidos: `bancos.columas.ts` → `bancos.columnas.ts`

## Criterios de aceptación

- [ ] Lista publicada en wiki del equipo
- [ ] Ejemplos de un reporte bien nombrado (sales)

---

### SUB-2.4 — Plan de migración y deuda técnica

**Summary Jira:** `[DOC-2.4] Plan migración arquitectura`

## Fases (resumen de PROUESTA_ARQUITECTURA.md §7)

| Fase | Acción | Riesgo |
|------|--------|--------|
| 1 | Normalizar typos, carpetas vacías, barrels | Bajo |
| 2 | Backend sales a capas | Medio |
| 3 | Backend banks | Medio |
| 4 | Frontend reports a features | Medio |
| 5 | Eliminar legacy | Medio-alto |

## Criterios de éxito migración

- Build BE y FE en verde
- Sin cambio funcional
- Nuevo reporte se agrega sin tocar módulos ajenos

## Criterios de aceptación

- [ ] Enlace a issues de desarrollo (si existen) por fase
- [ ] Checklist pre-merge para movimientos de archivos
