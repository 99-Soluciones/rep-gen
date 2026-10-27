---
target: src/features/reports
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\campo\\OneDrive\\Documentos\\Proyectos\\RepGen - copia\\repgen-frontend\\src\\features\\reports"
timestamp: 2026-10-15T19-13-27Z
slug: src-features-reports
closed: true
---
Method: dual-agent (A: design review · B: detector). Source-only inspection: no browser automation, and the app needs a live FileMaker login.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Chip counts filters but doesn't name them; KPI panel never states the date range |
| 2 | Match System / Real World | 3 | Ventas totals row is bold amounts with no label |
| 3 | User Control and Freedom | 3 | No guard on sidebar nav, Cerrar sesión or tab close: unsaved view work drops silently |
| 4 | Consistency and Standards | 3 | Breaks own DESIGN.md: `disabled`+`title` vs `aria-disabled`, banned `ring-4 ring-blue-100`, red negatives in KPIs but not grid |
| 5 | Error Prevention | 3 | Strong guards; gap = view selector not remembered per Ventas tab |
| 6 | Recognition Rather Than Recall | 2 | Filters on hidden/off-screen columns invisible; view period never shown; names cut at 160px |
| 7 | Flexibility and Efficiency | 2 | Zero shortcuts; amount filters equals-only, 1 condition, no range |
| 8 | Aesthetic and Minimalist Design | 3 | ~10 toolbar controls in 5 groups, wraps at 1366px |
| 9 | Error Recovery | 3 | Session expiry dead-ends at "vuelve a abrir desde FileMaker"; chip shows "0 registros" under error |
| 10 | Help and Documentation | 2 | KPI terms (Vigentes, Con devolución, Ganancia bruta) undefined |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict
Behavior is highly product-specific (statement-style Resumen, per-row currency, totals that refuse to sum balances, date draft, view guard, honest export toast). The look is category-interchangeable Tailwind admin; the ledger metaphor lives only in the Resumen, not in the grid (no red negatives, unlabeled Ventas totals, applied period shown as inputs rather than a statement).
Deterministic scan: 0 findings on src/features/reports and src/app/layout (exit 0). Browser overlay skipped (no browser tool, needs live backend).

## Priority Issues
- [P1] Applied filters not visible by name. Chip says "3 filtros", never which; filters on hidden columns stay active and invisible; KPI panel has no range. Fix: chip discloses filter tokens incl. "(columna oculta)"; KPI note prefixed with range. TablaDinamicaControles.tsx:57-80, EstadoKpi.tsx:64-76. → /impeccable clarify
- [P1] Unsaved work lost outside the view selector; view selection not remembered per Ventas tab. No beforeunload/useBlocker; Navbar.tsx:24 logs out in one click to an external site. useReportConfigs keeps the previous tab's list until the fetch resolves; useReporteGrid.ts restores grid per tab but not the selected view id nor calls fijarBase (traced, not reproduced). Fix: reuse 3-option dialog on nav/logout + beforeunload; store view id per report; fijarBase on restore. → /impeccable harden
- [P2] Layout fails 1366px laptops and 200% zoom. Toolbar wraps; below xl the Resumen sits under a full-viewport grid sized by calc tied to a navbar that can wrap (TablaDinamica.tsx:256). Fix: collapse Periodo/Desde/Hasta/Aplicar into one statement button; result strip above grid below xl; flex sizing. → /impeccable layout
- [P2] Amount filtering too weak for finance: equals/gt/lt only, maxNumConditions 1, floating input exact-equals (parametros-filtro.ts:77-110, construir-columnas.ts:180-183). Fix: "Entre", parse >5000 / 1000-5000, 2 conditions. → /impeccable shape
- [P2] DESIGN.md drift: no red negatives in grid cells; only blue-500/600/700 tokenised (blue-50..800 and grid hex hard-coded) so tenant rebrand comes out half-blue; ring-4 ring-blue-100 in AvisoSesionExpirada.tsx:47 and AuthGate.tsx:98; disabled "Actualizar vista" reason only in title (ConfiguracionesColumnas.tsx:405-420), same for FloatingFilterConLimpiar.tsx:145. → /impeccable polish

## Persona Red Flags
Alex: no shortcuts (only Escape); ~10 Tabs to Exportar; `>5000` in amount filter fails; ⋮ menu no arrow keys; no keyboard column reorder.
Sam: "Entendido" focus ring ~1.2:1; disabled Actualizar vista out of tab order with title-only reason; unlabeled Ventas totals row; live region says "3 filtros" but not which; at 200% zoom KPIs under full grid, double scroll.
Lucía (gerente): can't tell if KPIs are filtered or which range; footer total vs Facturación neta disagree with only a 12px note; session-expiry copy sends her to FileMaker she doesn't use; "Próximamente" items are live links to stubs.

## Minor Observations
Logout hard-coded to 99soluciones.com for every tenant; no tenant logo slot; chip reads "0 registros" under error overlay; filtered-to-zero empty state has no "Limpiar filtros" action; disabled export click gives mouse users no feedback; ModalColumnas group headers off the Label scale; panel width persisted but open/closed not; Ventas "Importes en MXN" static vs Bancos' dynamic count.

## Questions to Consider
- Should the applied state be one statement ("Septiembre 2026 · 340 registros · 3 filtros · Vista: Conciliación") that opens editors?
- Which total does a manager quote: footer or Facturación neta? Should KPIs drill into the grid?
- Is FileMaker really the only way back after session expiry?
- What happens with a tenant whose brand is red or green? Which meanings are immune to tenant color?
