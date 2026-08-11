# RepGen — Documentación

Documentación transversal del producto RepGen (procesos, Jira, arquitectura, logging, deploy, onboarding). Vive en la carpeta `docs/` del monorepo; el código está en `repgen-backend/` y `repgen-frontend/`.

## Estructura de esta carpeta

```text
docs/
├── README.md                 ← Estás aquí
├── architecture/             ← Visión técnica global
├── deployment/               ← Guía de despliegue (secrets, Vercel, DigitalOcean)
├── logging/                  ← Guías Winston / NestJS
├── jira/                     ← Epic, tareas DOC-1…11, CSV import
├── references/               ← Enlaces a código y docs del monorepo
└── history/                  ← Docs de la era multi-repo (obsoletos, referencia)
```

## Por dónde empezar

| Necesidad | Documento |
|-----------|-----------|
| Backlog Jira (Epic + tareas) | [jira/README.md](jira/README.md) |
| Importar issues en Jira | [jira/jira-import-fase2-subtareas.csv](jira/jira-import-fase2-subtareas.csv) |
| Arquitectura objetivo | [architecture/PROUESTA_ARQUITECTURA.md](architecture/PROUESTA_ARQUITECTURA.md) |
| Añadir un reporte nuevo | [jira/guides/COMO-AGREGAR-REPORTE.md](jira/guides/COMO-AGREGAR-REPORTE.md) |
| Column labels (DOC-4.4 / 7.6) | [references/LINKS.md](references/LINKS.md) |
| Deploy / CI | [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md) |

## Documentación técnica junto al código (no duplicar)

La doc que acompaña al código sigue viviendo con él:

| Tema | Ruta |
|------|------|
| Flujo reportes, field maps, ADRs | [`repgen-backend/docs/reports/`](../repgen-backend/docs/reports/INDEX.md) |
| Column labels API | [`repgen-backend/docs/tenant/COLUMN_LABELS.md`](../repgen-backend/docs/tenant/COLUMN_LABELS.md) |
| ColumnLabelsProvider (React) | [`repgen-frontend/docs/COLUMN_LABELS_PROVIDER.md`](../repgen-frontend/docs/COLUMN_LABELS_PROVIDER.md) |
| Contratos de API compartidos | [`packages/shared-types/index.d.ts`](../packages/shared-types/index.d.ts) |

## Historia

Hasta 2026-08 RepGen vivía en cuatro repositorios separados (`repgen-backend`, `repgen-frontend`, `repgen-docs`, `repgen-workflows`). Los documentos que describían ese mundo están en [history/](history/).
