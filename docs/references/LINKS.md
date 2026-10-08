# Enlaces a documentación y código del monorepo

Rutas relativas dentro del monorepo — funcionan en GitHub, en el editor y en cualquier hosting futuro.

---

## Backend (`repgen-backend/`)

### Documentación

| Tema | Enlace |
|------|--------|
| Índice reportes | [docs/reports/INDEX.md](../../repgen-backend/docs/reports/INDEX.md) |
| Flujo funcional reportes | [EXPLICACION_FLUJO_REPORTES.md](../../repgen-backend/docs/reports/workflow/EXPLICACION_FLUJO_REPORTES.md) |
| Field map guide | [FIELD_MAP_GUIDE.md](../../repgen-backend/docs/reports/FIELD_MAP_GUIDE.md) |
| **DOC-4.4** Column labels (API) | [COLUMN_LABELS.md](../../repgen-backend/docs/tenant/COLUMN_LABELS.md) |
| ADRs ventas | [ADR/VENTAS/ADR-INDEX.md](../../repgen-backend/docs/reports/ADR/VENTAS/ADR-INDEX.md) |

### Código frecuente

| Tema | Enlace |
|------|--------|
| Reports controller | [reports.controller.ts](../../repgen-backend/src/reports/presentation/reports.controller.ts) |
| Base report service | [base-report.service.ts](../../repgen-backend/src/reports/application/shared/base-report.service.ts) |
| FileMaker service | [filemaker.service.ts](../../repgen-backend/src/filemaker/filemaker.service.ts) |
| Auth controller | [auth.controller.ts](../../repgen-backend/src/auth/auth.controller.ts) |
| Tenant controller | [tenant.controller.ts](../../repgen-backend/src/tenant/presentation/tenant.controller.ts) |

---

## Frontend (`repgen-frontend/`)

### Documentación

| Tema | Enlace |
|------|--------|
| **DOC-7.6** ColumnLabelsProvider | [COLUMN_LABELS_PROVIDER.md](../../repgen-frontend/docs/COLUMN_LABELS_PROVIDER.md) |

### Código frecuente

| Tema | Enlace |
|------|--------|
| Autenticación + provider | [AuthGate.tsx](../../repgen-frontend/src/features/auth/AuthGate.tsx), [App.tsx](../../repgen-frontend/src/app/App.tsx) |
| Column labels API | [column-labels.api.ts](../../repgen-frontend/src/features/reports/shared/api/column-labels.api.ts) |
| Schema ventas (labelSlot) | [ventas.schema.json](../../repgen-frontend/src/features/reports/sales/ventas.schema.json) |
| Reporte ventas | [ReporteVentas.tsx](../../repgen-frontend/src/features/reports/sales/ReporteVentas.tsx) |

---

## Tipos compartidos (`packages/shared-types/`)

| Tema | Enlace |
|------|--------|
| Contratos de API backend↔frontend | [index.d.ts](../../packages/shared-types/index.d.ts) |

---

## CI/CD (`.github/workflows/`)

| Tema | Enlace |
|------|--------|
| Guía de despliegue | [DEPLOYMENT.md](../deployment/DEPLOYMENT.md) |
| CI backend | [ci-backend.yml](../../.github/workflows/ci-backend.yml) |
| CI frontend | [ci-frontend.yml](../../.github/workflows/ci-frontend.yml) |
| Deploy Vercel | [deploy-vercel.yml](../../.github/workflows/deploy-vercel.yml) |
| Deploy DigitalOcean | [deploy-digitalocean.yml](../../.github/workflows/deploy-digitalocean.yml) |

---

## Enlaces internos (`docs/`)

| Tema | Ruta |
|------|------|
| Jira backlog | [jira/README.md](../jira/README.md) |
| Arquitectura objetivo | [architecture/PROUESTA_ARQUITECTURA.md](../architecture/PROUESTA_ARQUITECTURA.md) |
| Logging | [logging/LOGGER_IMPLEMENTATION.md](../logging/LOGGER_IMPLEMENTATION.md) |
| Cómo agregar reporte (checklist) | [jira/guides/COMO-AGREGAR-REPORTE.md](../jira/guides/COMO-AGREGAR-REPORTE.md) |
