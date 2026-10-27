---
target: src/features/reports
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-16T16-02-17Z
slug: src-features-reports
---
Method: dual-agent (A: design review · B: detector). Source-only review; detector run live.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Excellent; "Actualizar datos" doesn't refresh the previous-period comparison |
| 2 | Match System / Real World | 3 | Two Ventas totals; raw schema headers |
| 3 | User Control and Freedom | 3 | No undo for deleting a view; date browsing on a period view counts as unsaved |
| 4 | Consistency and Standards | 3 | Some plain `disabled` left; Cargos negative in summary, positive in grid |
| 5 | Error Prevention | 3 | Disagreeing Ventas totals invite misreporting |
| 6 | Recognition Rather Than Recall | 3 | Amount shorthand recalled (hint on focus); 44–74 Ventas columns |
| 7 | Flexibility and Efficiency | 3 | Views, stepper, shorthand; no shortcuts or global search |
| 8 | Aesthetic and Minimalist Design | 3 | Ventas opens as a wall of columns; chip can get long |
| 9 | Error Recovery | 3 | Comparison "No se pudo leer" has no retry |
| 10 | Help and Documentation | 2 | Nothing explains "Vistas"; export scope only for screen readers |
| **Total** | | **30/40** | **Good** |

## Design Specificity Verdict
Behavior deeply product-specific (statement summary with closing balances, per-currency, amount shorthand, list semantics, freshness). Visual layer generic; tenant branding only --marca.
Detector: 0 findings in src/features/reports, src/app, src/shared.

## Priority Issues
- [P1] Ventas has no default column opinion: 44/74 columns, IDs first. Add per-tab default-visible set (~10–12), money early. → /impeccable distill
- [P1] Browsing dates (‹ ›) on a view with a period counts as unsaved changes → arms exit guard and beforeunload; "Actualizar vista" then drops the period. Treat dates as browsing. → /impeccable clarify
- [P2] Two Ventas totals disagree; explanation only in the panel. → /impeccable clarify
- [P2] ⋮ menu: no role=menu/arrow keys, stays open on Tab-out with an invisible overlay swallowing the next click; list filter ArrowDown from search doesn't enter list. → /impeccable harden
- [P3] Sighted help missing: export scope, full view name in title only, Vistas never introduced. → /impeccable onboard

## Persona Red Flags
Alex: no shortcuts; 148 tab stops in Conceptos columns dialog; ⋮ stays open after Tab.
Sam: loading status mounted conditionally; option aria-label for default star unreliable; date button name doesn't contain visible text (label-in-name).
Gerencia: at ≥1280 with panel collapsed no result visible; filtered default view hides comparison; no overview.

## Minor Observations
Redundant "Reporte de"; Cargos sign inconsistency; export name "Exportar" on phones; "..." vs "…"; view selector truncation; comparison not refetched by Actualizar datos; logout to external domain.

## Questions to Consider
- Who owns Ventas' default columns?
- Is a date range part of a view or browsing?
- Why not apply the same filters to the previous period instead of dropping the comparison?
- Which number does the CFO get when footer and summary disagree?
