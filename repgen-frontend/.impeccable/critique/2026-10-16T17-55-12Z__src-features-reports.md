---
target: src/features/reports
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-16T17-55-12Z
slug: src-features-reports
---
Method: dual-agent (A: design review · B: detector)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | First load says "0 registros" / "Actualizando…" before anything loaded |
| 2 | Match System / Real World | 3 | Ventas footer defines itself negatively ("No es la facturación neta") |
| 3 | User Control and Freedom | 4 | Undo, Restaurar filtros, Volver a <periodo>, Cancel everywhere |
| 4 | Consistency and Standards | 3 | Columnas search focus not system ring; empty state lacks icon/exit; "..." vs "…" |
| 5 | Error Prevention | 4 | Unsaved-changes guard, aria-disabled with reasons, date constraints |
| 6 | Recognition Rather Than Recall | 3 | Money columns off-screen, must know they exist |
| 7 | Flexibility and Efficiency | 2 | No shortcuts; Columnas can't reorder |
| 8 | Aesthetic and Minimalist Design | 2 | First screen spent on IDs; TOTAL MXN beside empty cells |
| 9 | Error Recovery | 4 | Plain error + Reintentar; "Sin cifras" not $0.00 |
| 10 | Help and Documentation | 3 | Views hint, export scope now visible; amount syntax only on focus |
| **Total** | | **31/40** | **Good** |

## Design Specificity Verdict
Behavior and copy are authored for this product (Abonos/Cargos/Flujo neto, per-currency, Saldos al cierre, data age, "Calculado sobre X de Y"). Visual skin is deliberate plain Tailwind admin; the "Libro Mayor" idea lives in the panel while the grid opens like a database dump (IDs first, money off-screen).
Deterministic scan: 0 findings in 91 files; also 0 with all suppressions disabled. Browser overlay skipped: no mutable browser automation available.

## What's Working
1. Panel reads as a bank statement and states its scope honestly.
2. Trust and recovery: data age, undo + non-expiring second path, alertdialog with safe default, focusable disabled controls with reasons, export scope visible.
3. List filters: counts, Todos·Ninguno on search, arrows, "Todo menos…", chips in words.

## Priority Issues
- [P1] Money columns off-screen by default (Bancos Abono is 10th; Ventas leads with IDs/UUID). Fix: reorder defaults (Bancos: Fecha, Banco, Cuenta, Concepto, Abono, Cargo, Saldo, Moneda…), initially hide Id/RFC/contable/UUID. → /impeccable layout
- [P2] First load states falsehoods: "0 registros" and "Actualizando…" before any load. Fix: "Cargando…" / "Cargando datos…". → /impeccable harden
- [P2] Manager's headline buried at xl: result is 3rd panel row, comparison 12px gray. Fix: lead the panel with the result block, comparison at 14px. → /impeccable typeset
- [P2] Ventas totals still argue (footer disclaimer + panel note). Fix: footer Gran Total uses net logic, or positive label, or drop non-meaningful sums. → /impeccable clarify
- [P3] Clipped floating filters/headers; no reorder in Columnas; no shortcuts. → /impeccable polish

## Persona Red Flags
Alex: no shortcuts; Abono needs scroll/drag; ~10 tab stops before grid; views hint shifts Exportar; amount syntax only on focus.
Sam: 200% zoom leaves ~3 grid rows; panel collapse button overlaps panel edge; "··4560" read as punctuation; Columnas search ring; empty state without heading/exit.
Gerencia: no headline atop panel at xl; no total cash position in Bancos; filtered default view silently drops comparison; Ventas disclaimer invites distrust.

## Minor Observations
"..." vs "…"; export toast leads with long filename (4 lines); panel card 7px off grid card; toolbar wraps at 1440 with panel open; empty state lacks icon/exit.

## Questions to Consider
- Should the Ventas footer compute Facturación neta itself instead of disclaiming?
- Should Bancos' headline be cash position rather than flujo neto?
- Should each report ship one curated view instead of "— Ninguna —" in schema order?
