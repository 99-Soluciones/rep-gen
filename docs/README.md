# RepGen — Documentación

Documentación transversal del monorepo. Lo que describe una pieza concreta del
código vive junto a esa pieza (`repgen-backend/docs/`, `repgen-frontend/docs/`)
y aquí solo se enlaza.

## Por dónde empezar

| Necesidad | Documento |
|-----------|-----------|
| Instalar y correr el proyecto | [README raíz](../README.md) |
| Agregar un reporte nuevo | [guides/COMO-AGREGAR-REPORTE.md](guides/COMO-AGREGAR-REPORTE.md) |
| Commits, ramas y pull requests | [guides/COMMITS-Y-PR.md](guides/COMMITS-Y-PR.md) |
| Desplegar (Vercel, DigitalOcean, secrets) | [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md) |
| Decisión Data API vs OData y hoja de ruta | [architecture/EVALUACION_ODATA_Y_ARQUITECTURA.md](architecture/EVALUACION_ODATA_Y_ARQUITECTURA.md) |
| Trabajo en curso: sesiones de FileMaker por uso (ERP) | [history/HANDOFF-erp-sesiones-por-uso.md](history/HANDOFF-erp-sesiones-por-uso.md) |

## Arquitectura en una página

```text
Navegador (React + AG Grid)  ──►  API NestJS (/api/v1)  ──►  FileMaker Data API
   filtra, ordena, exporta          rango o corte → filas       layouts apiExport_*
```

- **El backend trae todo el rango y el cliente filtra.** Cada endpoint de
  reporte recibe solo un rango de fechas (o un día de corte) y devuelve todas
  las filas que el usuario puede ver. Filtros, orden, totales y exportación
  ocurren en AG Grid.
- **Un reporte = cuatro piezas en `repgen-backend/src/reports/`:** contrato en
  `domain/` (re-exporta `packages/shared-types`), campos + mapper con las
  reglas de negocio en `infrastructure/<reporte>/`, use case en
  `application/<reporte>/` y un método en `presentation/reports.controller.ts`.
- **Dos formas de use case.** Rango con un layout: extiende
  `BaseReportService`. Fecha de corte o varios layouts: use case propio que usa
  `findAllRecords`, `cleanOrThrow` y `fetchCached` de `application/shared/`.
- **Caché de 60 s** por tenant + usuario + rango (los permisos son por
  usuario). "Actualizar datos" la salta con `refresh: true`.
- **FileMaker:** todo pasa por `FileMakerService`. Hay una sesión de la Data
  API por empresa y uso (`erp` para llamadas cortas, `reportes` para los finds
  pesados), porque una sesión atiende en fila.
- **Un registro que no cumple su schema responde 500 a propósito:** es
  preferible a un reporte con filas faltantes en los totales.
- **Tenant y usuario salen del JWT** (cookie httpOnly), nunca del cuerpo de la
  petición.
- **Frontend:** cada reporte es una carpeta en
  `repgen-frontend/src/features/reports/<reporte>/` (columnas desde un
  `*.schema.json`, cálculos de KPIs en funciones puras, la página). Lo común
  está en `features/reports/shared/`: `useReporteBase` (rango) o
  `useReporteCorte` (corte), `useReporteGrid`, `TablaDinamica`, vistas
  guardadas y exportación.

Reportes actuales: Bancos, Ventas (facturas y conceptos) y Cuentas por cobrar.

## Documentación junto al código

| Tema | Ruta |
|------|------|
| Reportes: flujo, fichas y ADRs de reglas de negocio | [`repgen-backend/docs/reports/INDEX.md`](../repgen-backend/docs/reports/INDEX.md) |
| Autenticación: sesión con cookie httpOnly | [`repgen-backend/docs/auth/AUTH_COOKIE_HTTPONLY.md`](../repgen-backend/docs/auth/AUTH_COOKIE_HTTPONLY.md) |
| Etiquetas de columnas por tenant | [`repgen-backend/docs/tenant/COLUMN_LABELS.md`](../repgen-backend/docs/tenant/COLUMN_LABELS.md) |
| Vistas guardadas (columnas, filtros y periodo) | [`repgen-frontend/docs/MODULO_CONFIGURACIONES_COLUMNAS.md`](../repgen-frontend/docs/MODULO_CONFIGURACIONES_COLUMNAS.md) |
| Diseño y producto del frontend | [`repgen-frontend/DESIGN.md`](../repgen-frontend/DESIGN.md), [`repgen-frontend/PRODUCT.md`](../repgen-frontend/PRODUCT.md) |
| Contratos de API compartidos | [`packages/shared-types/index.d.ts`](../packages/shared-types/index.d.ts) |
| Variables de entorno del backend | [`repgen-backend/.env.example`](../repgen-backend/.env.example) |
| Logging (Winston) | código en `repgen-backend/src/common/logger/`; guía en la skill `.claude/skills/nestjs-logging/` |

## Reglas para esta carpeta

- Un documento entra aquí solo si alguien lo va a seguir o consultar para
  trabajar en el código. Planes ya ejecutados y backlogs no se guardan: para
  eso está el historial de git.
- Si un documento describe un módulo concreto, va junto a ese módulo y aquí se
  enlaza.
