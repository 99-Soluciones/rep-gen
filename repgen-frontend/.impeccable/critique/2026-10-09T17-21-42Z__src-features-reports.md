---
target: report screens
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-09T17-21-42Z
slug: src-features-reports
closed: true
---
# Critique: RepGen report screens (src/features/reports + shell)
Method: dual-agent. Source-only (app not runnable: no dev server, FileMaker backend required).

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | A failed load keeps the old rows; "Fechas aplicadas" toast fires before the data arrives |
| 2 | Match System / Real World | 3 | "Exportar a Excel" actually downloads a CSV |
| 3 | User Control and Freedom | 2 | No clear-all for filters, no Escape on the modal, an expired session wipes all filters |
| 4 | Consistency and Standards | 2 | Two "Guardar" buttons with different meanings; mixed Title Case; ComingSoon off-system |
| 5 | Error Prevention | 2 | Silent overwrite of a saved view; "Seleccionar Todas" ignores the search |
| 6 | Recognition Rather Than Recall | 3 | Filters on off-screen columns are invisible |
| 7 | Flexibility and Efficiency | 2 | No date presets, no Enter to apply dates, amount filters default to "equals" |
| 8 | Aesthetic and Minimalist Design | 3 | 9 equal-weight rainbow KPI cards |
| 9 | Error Recovery | 1 | Raw 500 errors; a failed first load reads "No se encontraron registros" |
| 10 | Help and Documentation | 1 | Only title tooltips |
| Total | | 21/40 | Acceptable |

## Design Specificity
Mostly the generic Tailwind admin look. The ledger north star isn't delivered in the grid: .ag-theme-quartz overrides are likely dead under theme={themeQuartz} (TablaDinamica.tsx:202, index.css:21-33), 49px rows, no totals row. Detector: 10 advisory findings, all in ComingSoon.css (9 true positives, 1 false positive).

## Priority Issues
- [P0] A failed load leaves stale/"empty" data under the new date range (useReporteBase.ts:56-60, FiltroFechas.tsx:41). harden.
- [P1] An expired session reloads, loses filters, shows "Acceso Denegado" and sends the user to 99soluciones.com (http.ts:41-44, AuthGate.tsx:94). harden.
- [P1] The grid is not a ledger: dead theme overrides, 49px rows, no totals row, calc(110vh-230px) causes a double scroll. layout.
- [P1] Keyboard/screen-reader gaps: hamburger has no focus or aria, the closed drawer is tabbable, the modal has no dialog role/trap/Escape, checkboxes have no focus ring, gray-400 contrast. audit, then harden.
- [P2] KPI panel noise (9 cards, decorative colours, no "filtered" caption) plus two meanings of "Guardar" and silent view overwrite. distill, then clarify.

## Persona Red Flags
Alex: no Enter-to-apply, no presets, no clear-all, no shortcuts, no Escape on the modal. Sam: focus gaps, tabbable hidden drawer, no dialog semantics, no h1, gray-400 contrast. Marisol: tenant not visible, KPIs not marked as filtered, no totals row, CSV named with the UTC download date instead of the range, stale period data.

## Minor Observations
Title Case copy; "Dashboard de metricas"; sidebar has 2 dead ends and Sales Item is missing; toasts over the user area; counts have no unit label.

## Questions
Totals in a footer row rather than a side panel? Who is the KPI panel for? Why list reports that don't exist?
