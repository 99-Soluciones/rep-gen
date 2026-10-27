---
target: src/features/reports
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-14T23-15-30Z
slug: src-features-reports
closed: true
---
# Critique: src/features/reports (run 4)
Method: dual-agent (A: design review · B: detector)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | View selector goes stale after Ventas tab switch |
| 2 | Match system / real world | 3 | Finance vocabulary, statement layout |
| 3 | User control and freedom | 3 | Guard covers only a saved view; ad-hoc work, tab switch, Limpiar unprotected |
| 4 | Consistency and standards | 2 | Periodo/Vista selects apply instantly, Desde/Hasta and columns modal are drafts; a few controls still lack the ring |
| 5 | Error prevention | 3 | Arrow keys on selects fire change → refetch |
| 6 | Recognition rather than recall | 3 | Selector doesn't show which views move dates |
| 7 | Flexibility and efficiency | 2 | No shortcuts, 3 presets, views per tab |
| 8 | Aesthetic and minimalist | 3 | ~10-control toolbar |
| 9 | Error recovery | 3 | Plain causes, retry only when useful |
| 10 | Help and documentation | 2 | Disabled reasons/hints only in title |
| Total | | 27/40 | Acceptable (edge of Good) |

Detector: 0 findings (src/features/reports, src/app/layout). Browser overlay skipped (FileMaker login).

## Priority issues
1. [P1] Ventas tab switch: ConfiguracionesColumnas not keyed by reportId → selector state (configSeleccionada, versionAnterior) leaks from Facturas into Conceptos while grid shows Conceptos default. harden
2. [P1] Guard only for saved views: "Ninguna" + filters, tab switch (setFilterModel(null)), Limpiar chip lose work silently. harden
3. [P2] Arrow keys on Periodo / Vista selects apply + refetch per keypress; "Personalizado" no-op. clarify + harden
4. [P2] Undo calls onVistaAplicada(null) even when user is on another view → wipes that view's baseline (phantom dot); undo not wrapped in guardando. harden
5. [P3] Disabled export reason / hints only in title (unreachable by keyboard/touch). audit

## Personas
Alex: no shortcuts, 3 presets, views per tab. Sam: export reason unreachable, guard alertdialog no focus trap, some controls still without ring (modal X, desktop tabs, sidebar links, popover Guardar, custom checkboxes). Lupita: tab switch wipes filters; CSV doesn't record filters/view; Facturas counts lack total line.

## Minor
"Descartar" → "Descartar cambios"; two undo lifetimes (menu vs toast); guard buttons stay enabled while saving; amber star; columnasVisibles naming.
