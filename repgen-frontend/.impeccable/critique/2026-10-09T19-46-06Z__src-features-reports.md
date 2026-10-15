---
target: report screens
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-09T19-46-06Z
slug: src-features-reports
---
# Critique: RepGen report screens (src/features/reports + shell), 2nd run
Method: dual-agent. Source-only (FileMaker login required; dev servers were up but unauthenticated).

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Silent export; no unsaved-view state |
| 2 | Match System / Real World | 3 | USD shown as MXN $; AG Grid built-in text in English |
| 3 | User Control and Freedom | 2 | No clear-all filters; "Ninguna" doesn't reset; loading veil covers toolbar |
| 4 | Consistency and Standards | 3 | Three commit models side by side |
| 5 | Error Prevention | 2 | One-click view overwrite; can hide every column |
| 6 | Recognition Rather Than Recall | 2 | Off-screen active filters invisible; "Igual a" default with no visible operator |
| 7 | Flexibility and Efficiency | 2 | No date presets; no cell copy; views don't save filters |
| 8 | Aesthetic and Minimalist Design | 3 | Dense toolbar (9-10 controls) |
| 9 | Error Recovery | 3 | Session-expiry message wrong in its most common case |
| 10 | Help and Documentation | 2 | Net figure calculation not explained |
| Total | | 25/40 | Acceptable (was 21) |

## Design Specificity
Behaviour product-specific (statement summary, date draft, honest totals); visual layer neutral by design; no per-client branding hook (hard-coded logo). Detector: 0 findings in the 4 targets (was 10).

## Priority Issues
- [P1] On a 401, useReporteBase.ts:96-99 empties the rows while AvisoSesionExpirada promises data remains. Fix: keep the rows and restore the range on 401. harden.
- [P1] formato.ts:35-39 hard-codes MXN, so Bancos USD amounts look like pesos. Format by the row's moneda. clarify.
- [P2] No clear-all or summary of active filters; no Spanish localeText (English noMatchingRows overlay). clarify.
- [P2] Saved views: silent overwrite, "Ninguna" does nothing, no filters saved. Product decision. shape.
- [P2] A11y in the grid area: no localeText, unlabeled floating filters, invisible separator focus, missing focus-visible rings, date input ring has no width, date errors only as toasts. audit, then harden.

## Persona Red Flags
Alex: no shortcuts or presets, sidebar stays open, no arrow keys in the menu, veil blocks the toolbar. Sam: unlabeled filters, English ARIA, invisible tab stop, N de M not announced, listbox used for navigation. Marisol: no cell copy, USD as pesos, footer total vs net mismatch, no "Mes anterior", views lose filters, "Devoluciones" twice.

## Minor Observations
Blank unknown routes; "Ruta no encontrada" copy; unfinished reports look active; Bancos count includes USD rows; red hover on close buttons; vh vs dvh; tenant hidden on mobile; export may produce formatted text.

## Questions
Date range as headline with presets? View = saved question? Which total is the truth when footer and net differ?
