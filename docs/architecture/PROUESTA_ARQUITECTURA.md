# Propuesta de Arquitectura Objetivo

Fecha: 2026-04-22

> **Nota (2026-10-08):** documento histórico. La estructura del frontend se implementó en la Fase 2, con ajustes respecto a esta propuesta. La estructura vigente está en [EVALUACION_ODATA_Y_ARQUITECTURA.md](EVALUACION_ODATA_Y_ARQUITECTURA.md).

## 1) Objetivo

- Mantener backend y frontend separados, con organización interna por feature de negocio.
- Estandarizar nombres para mejorar búsqueda, imports y onboarding.
- Permitir una migración gradual sin romper funcionalidad existente.

---

## 2) Arquitectura Objetivo - Backend

Base: NestJS por dominio funcional.

Estructura sugerida:

- src/
  - auth/
  - filemaker/
  - reports/
    - presentation/
      - reports.controller.ts
    - application/
      - shared/
        - base-report.service.ts
      - banks/
        - get-bank-report.use-case.ts
      - sales/
        - get-sales-report.use-case.ts
    - domain/
      - reports.types.ts
      - banks/
        - bank-report.types.ts
      - sales/
        - sales-report.types.ts
    - infrastructure/
      - shared/
        - reports-mapping-helpers.ts
      - banks/
        - bank-field-map.ts
        - bank-field-map.helper.ts
        - banks.mapper.ts
        - banks.movement.utils.ts
        - bank-report.schema.json
      - sales/
        - sales-field-map.ts
        - sales-field-map.helper.ts
        - sales.mapper.ts
        - sales-report.schema.json
        - sales-item-report.schema.json
  - common/
    - utils/
      - date.format.ts
      - mapping.utils.ts
      - type.getters.ts

Notas:

- reports.types.ts reemplaza ireports.ts.
- bank-report.types.ts reemplaza ireport.banks.ts.
- sales-report.types.ts reemplaza ireport.sales.ts.
- Se recomienda remover prefijo i en interfaces para estandarizar TypeScript.

---

## 3) Mapeo Exacto de Archivos - Backend

| Archivo actual                                     | Archivo destino                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| src/reports/reports.controller.ts                  | src/reports/presentation/reports.controller.ts                          |
| src/reports/reports.module.ts                      | src/reports/reports.module.ts (se queda, actualizando imports internos) |
| src/reports/base-report.service.ts                 | src/reports/application/shared/base-report.service.ts                   |
| src/reports/ireports.ts                            | src/reports/domain/reports.types.ts                                     |
| src/reports/utils/reports-mapping-helpers.ts       | src/reports/infrastructure/shared/reports-mapping-helpers.ts            |
| src/reports/use-cases/get-bank-report.use-case.ts  | src/reports/application/banks/get-bank-report.use-case.ts               |
| src/reports/use-cases/get-sales-report.use-case.ts | src/reports/application/sales/get-sales-report.use-case.ts              |
| src/reports/banks/ireport.banks.ts                 | src/reports/domain/banks/bank-report.types.ts                           |
| src/reports/banks/bank.field-map.ts                | src/reports/infrastructure/banks/bank-field-map.ts                      |
| src/reports/banks/bank.field-map.helper.ts         | src/reports/infrastructure/banks/bank-field-map.helper.ts               |
| src/reports/banks/banks.mapper.ts                  | src/reports/infrastructure/banks/banks.mapper.ts                        |
| src/reports/banks/banks.movement.utils.ts          | src/reports/infrastructure/banks/banks.movement.utils.ts                |
| src/reports/banks/bankReport.schema.json           | src/reports/infrastructure/banks/bank-report.schema.json                |
| src/reports/sales/ireport.sales.ts                 | src/reports/domain/sales/sales-report.types.ts                          |
| src/reports/sales/sales.field-map.ts               | src/reports/infrastructure/sales/sales-field-map.ts                     |
| src/reports/sales/sales.field-map.helper.ts        | src/reports/infrastructure/sales/sales-field-map.helper.ts              |
| src/reports/sales/sales.mapper.ts                  | src/reports/infrastructure/sales/sales.mapper.ts                        |
| src/reports/sales/salesReport.schema.json          | src/reports/infrastructure/sales/sales-report.schema.json               |
| src/reports/sales/salesItemReport.schema.json      | src/reports/infrastructure/sales/sales-item-report.schema.json          |
| src/utils/date.format.ts                           | src/common/utils/date.format.ts                                         |
| src/utils/mapping.utils.ts                         | src/common/utils/mapping.utils.ts                                       |
| src/utils/type.getters.ts                          | src/common/utils/type.getters.ts                                        |

No mover por ahora:

- src/auth/\*\*
- src/filemaker/\*\*

---

## 4) Arquitectura Objetivo - Frontend

Base: React + Vite por features con shared y app shell.

Estructura sugerida:

- src/
  - app/
    - App.tsx
    - main.tsx
    - layout/
      - Layout.tsx
      - Navbar.tsx
      - Sidebar.tsx
  - shared/
    - ui/
      - TablaDinamica/
        - TablaDinamica.tsx
      - Filtros/
        - Filtros.tsx
    - lib/
      - ag-grid/
        - export.ag-grid.ts
        - filters.ag-grid.ts
        - format.ag-grid.ts
        - construir-columnas.ag-grid.ts
        - filtros.ag-grid.ts
    - types/
    - styles/
      - index.css
    - utils/
      - date-formatted.ts
  - features/
    - auth/
      - ui/
        - Autenticacion.tsx
    - reports/
      - banks/
        - ui/
          - ReporteBancos.tsx
        - api/
          - reports-banks.api.ts
        - model/
          - bancos.types.ts
        - config/
          - bancos.columnas.ts
          - bancos.schema.json
      - sales/
        - ui/
          - ReporteVentas.tsx
        - api/
          - reports-sales.api.ts
        - model/
          - ventas.types.ts
        - config/
          - ventas.columnas.ts
          - ventas.schema.json

Notas:

- api.reportes.ts puede separarse por feature (banks/sales).
- Se recomienda renombrar dateFormatted.ts a date-formatted.ts.
- Se recomienda corregir bancos.columas.ts a bancos.columnas.ts.

---

## 5) Mapeo Exacto de Archivos - Frontend

| Archivo actual                                            | Archivo destino                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| src/App.tsx                                               | src/app/App.tsx                                                                                           |
| src/main.tsx                                              | src/app/main.tsx                                                                                          |
| src/index.css                                             | src/shared/styles/index.css                                                                               |
| src/layout/Layout.tsx                                     | src/app/layout/Layout.tsx                                                                                 |
| src/layout/Navbar.tsx                                     | src/app/layout/Navbar.tsx                                                                                 |
| src/layout/Sidebar.tsx                                    | src/app/layout/Sidebar.tsx                                                                                |
| src/components/Autenticacion.tsx                          | src/features/auth/ui/Autenticacion.tsx                                                                    |
| src/components/Reportes/ReporteBancos.tsx                 | src/features/reports/banks/ui/ReporteBancos.tsx                                                           |
| src/components/Reportes/ReporteVentas.tsx                 | src/features/reports/sales/ui/ReporteVentas.tsx                                                           |
| src/components/Reportes/Filtros/Filtros.tsx               | src/shared/ui/Filtros/Filtros.tsx                                                                         |
| src/components/Reportes/TablaDinamica/TablaDinamica.tsx   | src/shared/ui/TablaDinamica/TablaDinamica.tsx                                                             |
| src/services/api.reportes.ts                              | src/features/reports/banks/api/reports-banks.api.ts + src/features/reports/sales/api/reports-sales.api.ts |
| src/interfaces/Reportes/interface.bancos.ts               | src/features/reports/banks/model/bancos.types.ts                                                          |
| src/interfaces/Reportes/interface.ventas.ts               | src/features/reports/sales/model/ventas.types.ts                                                          |
| src/config/ag-grid/Reportes/construir-columnas.ag-grid.ts | src/shared/lib/ag-grid/construir-columnas.ag-grid.ts                                                      |
| src/config/ag-grid/Reportes/filtros.ag-grid.ts            | src/shared/lib/ag-grid/filtros.ag-grid.ts                                                                 |
| src/config/ag-grid/Reportes/bancos/bancos.columas.ts      | src/features/reports/banks/config/bancos.columnas.ts                                                      |
| src/config/ag-grid/Reportes/bancos/bancos.schema.json     | src/features/reports/banks/config/bancos.schema.json                                                      |
| src/config/ag-grid/Reportes/ventas/ventas.columnas.ts     | src/features/reports/sales/config/ventas.columnas.ts                                                      |
| src/config/ag-grid/Reportes/ventas/ventas.schema.json     | src/features/reports/sales/config/ventas.schema.json                                                      |
| src/utils/dateFormatted.ts                                | src/shared/utils/date-formatted.ts                                                                        |
| src/utils/ag-grid/export.ag-grid.ts                       | src/shared/lib/ag-grid/export.ag-grid.ts                                                                  |
| src/utils/ag-grid/filters.ag-grid.ts                      | src/shared/lib/ag-grid/filters.ag-grid.ts                                                                 |
| src/utils/ag-grid/format.ag-grid.ts                       | src/shared/lib/ag-grid/format.ag-grid.ts                                                                  |

---

## 6) Convenciones Recomendadas

- Nombres de archivo en kebab-case.
- Tipos e interfaces con sufijo .types.ts.
- Helpers con sufijo .helper.ts.
- Schemas en kebab-case: por ejemplo sales-report.schema.json.
- Evitar mezcla de idiomas en nombres de archivo nuevos.

---

## 7) Plan de Migracion por Fases

### Fase 1 (Bajo riesgo)

- Normalizar nombres de archivos con typo o inconsistencia.
- Crear carpetas destino sin mover logica compleja.
- Mantener barrel files (index.ts) para compatibilidad temporal.

### Fase 2 (Backend - Sales)

- Mover sales a domain/application/infrastructure.
- Ajustar imports en use case, module y controller.
- Validar con build y pruebas.

### Fase 3 (Backend - Banks)

- Mover banks replicando patron de sales.
- Ajustar imports y validar.

### Fase 4 (Frontend - Reports)

- Mover ReporteVentas y ReporteBancos a features.
- Separar api.reportes.ts por feature.
- Centralizar ag-grid reusable en shared/lib.

### Fase 5 (Limpieza)

- Eliminar rutas legacy.
- Remover wrappers temporales y aliases transitorios.
- Actualizar README de ambos repos con nuevo arbol.

---

## 8) Criterios de Exito

- Build backend y frontend en verde.
- Sin cambios de comportamiento funcional.
- Imports mas cortos y previsibles.
- Nuevos reportes se agregan en feature sin tocar modulos no relacionados.
