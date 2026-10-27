---
target: src/features/reports
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-15T20-52-14Z
slug: src-features-reports
closed: true
---
Method: dual-agent (A: design review · B: detector). Source-only: no browser automation in the review; app needs a live FileMaker login.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No "as of" time for the data; summary shows a dimmed $0.00 before the first load |
| 2 | Match System / Real World | 3 | Date filters say "Mayor/Menor que" (locale has "Después/Antes de"); Facturación neta vs Total MXN |
| 3 | User Control and Freedom | 3 | No way to re-query the same range (Aplicar disabled when unchanged; Reintentar only on error) |
| 4 | Consistency and Standards | 3 | `disabled` still in FiltroFechas/Menu/ModalColumnas; drawer has no velo |
| 5 | Error Prevention | 3 | Invalid amount = red border only |
| 6 | Recognition Rather Than Recall | 3 | View names cut at 160px (title only) |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; amount syntax invisible to sighted users |
| 8 | Aesthetic and Minimalist Design | 3 | Two "Próximamente" dead links in a 4-item sidebar |
| 9 | Error Recovery | 3 | View save after 401 says "Inténtalo de nuevo"; failed /tenant/features hides views silently |
| 10 | Help and Documentation | 2 | Filter syntax documented only for screen readers |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict
Behavior and copy are deeply product-specific (statement summary, red ink in grid, MXN-only totals with exclusions stated, amount syntax, date sentence, filters in words, end-to-end unsaved-work guard). Visual identity still category-generic Tailwind; tenant branding is one variable with no logo slot.
Detector: 0 findings in src/features/reports, src/app, src/shared (detector verified live on a probe file).

## Priority Issues
- [P1] No data freshness signal, no re-query. Add "Datos de las 10:42" + "Actualizar datos" calling existing reintentar. → /impeccable harden
- [P1] Amount syntax undiscoverable; invalid input unexplained on screen (sr-only text, title for read-only). Visible hint on focus/invalid; placeholder for currency columns. → /impeccable clarify
- [P2] Export button accessible name includes its description (sr-only span inside the button, BotonExportar.tsx:42). Move span out; exact-name test. → /impeccable audit
- [P2] Summary misreadable: $0.00 before first load; Facturación neta vs Total MXN; compact line doesn't say "filtrado". → /impeccable clarify
- [P2] Drawer lacks velo and inert main; "Próximamente" items are dead links. → /impeccable polish

## Persona Red Flags
Alex: no shortcuts; refresh needs a reload; syntax hidden; no column reorder in modal.
Sam: Export name is the long description; "Nueva vista" popover has no dialog role/trap; page title never changes; gray-500 on gray-100/blue-50 ≈4.4:1.
Patricia (manager): $0.00 before load; two totals; no prior-period comparison; session expiry points to FileMaker; logout to vendor site; no freshness.

## Minor Observations
Date filter operator labels; /tenant/features failure cached for session + toolbar shift; default view with period double-fetches; error page offers "Ir a Bancos" even when Bancos crashed; "Guardar como vista nueva" cancels the exit; ⋮ menu lacks menu role; TabsVentas/ModalColumnas SVGs lack aria-hidden; old rows visible under the loading veil while the date button already shows the new range.

## Questions to Consider
- Stale export vs losing an unsaved view on reload: which error is acceptable?
- Should summary and footer totals ever disagree?
- Is in-app re-authentication the missing feature?
- What visual element is RepGen's own once --marca and a logo are swapped?
