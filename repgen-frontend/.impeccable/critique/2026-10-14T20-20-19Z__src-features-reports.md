---
target: src/features/reports
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-14T20-20-19Z
slug: src-features-reports
closed: true
---
# Critique: src/features/reports (run 3)
Method: dual-agent (A: design review · B: detector)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | KPI panel shows $0.00 on load error; stale figures undimmed while loading |
| 2 | Match system / real world | 3 | "Exportar a Excel" delivers CSV; "Vista de columnas" now also holds filters + period |
| 3 | User control and freedom | 2 | Switching view / Ninguna discards unsaved work silently, no undo |
| 4 | Consistency and standards | 3 | Periodo applies instantly, dates need Aplicar; focus rings vary; drawer overlay transparent |
| 5 | Error prevention | 2 | One-click overwrite; period silently dropped on update; export enabled on error/0 rows |
| 6 | Recognition rather than recall | 3 | Unsaved dot says something changed, never what; off-screen filtered columns unnamed |
| 7 | Flexibility and efficiency | 2 | No column pinning UI; 3 presets; no shortcuts |
| 8 | Aesthetic and minimalist | 3 | 10-control toolbar; always-on Importes note |
| 9 | Error recovery | 3 | Grid error/retry solid; view save failures toast only |
| 10 | Help and documentation | 2 | title tooltips only |
| Total | | 26/40 | Acceptable |

Detector: 0 findings (src/features/reports, src/app/layout). Purple check off (morado-erp declared). Browser overlay skipped (FileMaker login).

## Priority issues
1. [P1] Ventas: 44/74 columns, no curated default, no pin UI (ColumnMenu not registered; schema has no hide/pinned). distill → layout
2. [P1] Unsaved view work lost on switch (handleSeleccionar); overwrite unguarded; periodo silently set null on update. harden → clarify
3. [P1] Export: raw amounts lose currency when Moneda hidden; button enabled on error/loading, success toast for 0 rows; "Excel" vs CSV. harden
4. [P2] State misreporting: KPI $0.00 on error; overlayNoRowsTemplate says "Cargando registros..." when filters exclude every row (TablaDinamica.tsx:313). harden
5. [P2] Keyboard/SR: ⋮ menu no menu semantics/arrows, focus lost on content swap, popover input not focused, drawer focus, weak focus rings in modal. audit → harden

## Personas
Alex: no pin, 3 presets, number filters default equals, 2 clicks per report switch.
Sam: focus to body on menu swap; ★ read aloud; unlabeled Ventas totals row.
Lupita: 74-col wall, USD/MXN mixed in export, filters lost on view compare, range only in date inputs.

## Minor
Totals label in a currency column formats "Total MXN" as $0.00; Próximamente links are live dead ends; Personalizado no-op; Ocultar todas → empty grid; stale BotonExportar comment; view select truncates without tooltip.
