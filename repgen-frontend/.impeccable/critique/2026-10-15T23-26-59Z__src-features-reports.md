---
target: src/features/reports
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-15T23-26-59Z
slug: src-features-reports
---
Method: dual-agent (A: design review · B: detector). Source-only review; detector run live.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Freshness stamp, live chip, "Calculado sobre X de Y", "—" before first load; age grows as "hace 1440 min" |
| 2 | Match System / Real World | 3 | Raw FileMaker field names as headers (Factura TipoDeCambio, Cliente Delegacion) |
| 3 | User Control and Freedom | 3 | No undo for deleting a view or applying the Columns modal |
| 4 | Consistency and Standards | 3 | Date panel Aplicar still `disabled`; Ventas currency notice less specific than Bancos |
| 5 | Error Prevention | 3 | Text filters can't exclude (no "No contiene"/"Distinto de") |
| 6 | Recognition Rather Than Recall | 2 | 44/74 columns with truncated headers and no tooltip; categorical filters by recall |
| 7 | Flexibility and Efficiency | 2 | No shortcuts; 3 date presets, no month stepping |
| 8 | Aesthetic and Minimalist Design | 3 | Ventas opens with every column visible |
| 9 | Error Recovery | 3 | Session expiry still a dead end; view-save errors only in a toast |
| 10 | Help and Documentation | 2 | No help for what a Vista is or first use |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict
Behavior is deeply domain-native (amount grammar, red ink, per-row currency, freshness stamp, statement summary). Visual layer still generic Tailwind; tenant branding is only --marca (no logo, logout to vendor site). Ventas default column sets are raw FileMaker dumps.
Detector: 0 findings in src/features/reports, src/app, src/shared.

## Priority Issues
- [P1] Ventas opens with 44 (Facturas) / 74 (Conceptos) visible columns, IDs/UUID first, headers truncated with no tooltip/wrap. Ship an "Esencial" default per report (8–12 columns, rest initialHide), wrapHeaderText/autoHeaderHeight or headerTooltip. → /impeccable distill + typeset
- [P1] Categorical filtering by recall only; no exclusion. Add set-style value filter for low-cardinality text columns; notContains/notEqual. → /impeccable shape
- [P2] Summary misses what a manager asks: no closing balance per account, other currencies dropped, no previous-period delta, two totals in Ventas. → /impeccable clarify
- [P2] Date changes slow: only 3 presets, no ‹ › stepper, Enter on Periodo select doesn't submit; age text unbounded. → /impeccable polish
- [P2] Columns modal unmounts its <dialog> without .close() → focus to body; export scope only for screen readers. → /impeccable harden

## Persona Red Flags
Alex: no shortcuts; ~5 steps to change month; report switch via drawer; no column reorder in modal.
Sam: focus lost after Columns modal; exit prompt anchored to views group, Cancel focuses Vista select; loading overlay status may not announce; 200% zoom stacks navbar/toolbar/strip.
Gerencia: month-to-date without comparison; key figure small at panel bottom; no closing balance; Ventas columns overwhelm.

## Minor Observations
Redundant "Reporte de" in h1; "Próximamente" items in nav; Ventas tab switch shows old rows under veil briefly; mobile tabs menu focus; Mostrar/Ocultar todas asymmetry, no "N de M visibles"; "Igual a" vs "Igual a (exacto)" subtle; invalid amount filter not reflected in chip.

## Questions to Consider
- Would a shipped "Esencial" view per report cover most sessions?
- Is a Bancos summary without balances an estado de cuenta?
- Should managers get a "Panorama" instead of a grid?
- Is the Ventas footer sum earning its place?
