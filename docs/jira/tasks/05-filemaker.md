# DOC-5 — Integración FileMaker

**Tipo Jira:** Story / Task  
**Epic:** [DOC] RepGen — Documentación técnica y operativa  
**Component:** FileMaker

---

### SUB-5.1 — FileMakerService — responsabilidades

**Summary Jira:** `[DOC-5.1] FileMakerService overview`

## Objetivo

Rol del servicio central de acceso a Data API.

## Archivos

- `src/filemaker/filemaker.service.ts`
- `src/filemaker/filemaker.module.ts`
- `src/filemaker/ifilemaker.ts` — contratos

## Responsabilidades típicas

- Autenticación / sesión con FileMaker Server
- Ejecutar finds con query construida
- Devolver `RawRecord[]` a capa de reportes
- Manejo de errores de conexión FM

## Criterios de aceptación

- [ ] Diagrama dependencias: Use Case → BaseReport → FileMakerService
- [ ] Variables de entorno FM listadas (sin valores)

---

### SUB-5.2 — Relaciones y layouts por reporte

**Summary Jira:** `[DOC-5.2] Relations FileMaker layouts`

## Objetivo

Mapa layout/relación → reporte.

## Archivos (`src/filemaker/relations/`)

| Archivo | Reporte / uso |
|---------|----------------|
| `_banks.ts` | Reporte bancos |
| `_sales.ts` | Reporte ventas |
| `_sales.item.ts` | Ítems de venta |
| `_column-labels.ts` | Etiquetas tenant |
| `index.ts` | Exportaciones |

Cada relación define prefijos de layout y portales usados en consultas.

## Criterios de aceptación

- [ ] Tabla relación → endpoint API
- [ ] Nota: cambios en FM requieren actualizar relations + field map

---

### SUB-5.3 — Contratos RawRecord y consultas

**Summary Jira:** `[DOC-5.3] RawRecord y FilterModel`

## Objetivo

Alinear con documentación funcional existente.

## Fuente de verdad

`repgen-backend/docs/reports/workflow/EXPLICACION_FLUJO_REPORTES.md` — §2 Contratos

## Resumen

**RawRecord**

- `fieldData`: campos del layout principal
- `portalData`: hijos (devoluciones, etc.)

**FilterModel** (desde AG Grid)

- `filterType`, `type`, `filter`

## Criterios de aceptación

- [ ] Enlace al doc en repo desde Jira
- [ ] Ejemplo JSON RawRecord anonimizado

---

### SUB-5.4 — Generador de field maps

**Summary Jira:** `[DOC-5.4] Script generate-field-map`

## Objetivo

Documentar automatización al crear reportes.

## Comando

```bash
cd repgen-backend
pnpm generate:field-map --report nombre-reporte
# opcional: --force
```

## Script

`repgen-backend/scripts/generate-field-map.mjs`

## Guía

`repgen-backend/docs/reports/FIELD_MAP_GUIDE.md`

## Criterios de aceptación

- [ ] Lista de archivos que genera el script
- [ ] Pasos manuales post-generación (relations, controller, module)
