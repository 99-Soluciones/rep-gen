# Cómo agregar un reporte nuevo en RepGen

Guía para que **una persona defina el reporte y un agente de IA lo programe**.
La persona es dueña de *qué* debe salir (layout de FileMaker, reglas de negocio,
datos dorados). El agente es dueño de *cómo* (código y tests que siguen los
patrones del repo). El reporte está terminado cuando pasan los tests de datos
dorados y la revisión humana.

Reportes de referencia para copiar:

| Reporte | Backend (`repgen-backend/src/reports/…`) | Frontend (`repgen-frontend/src/features/reports/…`) |
|---|---|---|
| Ventas por concepto | `*/salesitem/` | comparte UI con Ventas (pestaña) |
| Bancos | `*/banks/` (con filtro de permisos por usuario) | `banks/` |
| Ventas | `*/sales/` | `sales/` |
| Cuentas por cobrar | `*/receivables/` (fecha de corte, dos layouts, sin `BaseReportService`) | `receivables/` |
| Flujo de efectivo - Ingresos | `*/cash-inflows/` (rango, dos layouts, dos vistas de una sola consulta, sin `BaseReportService`) | `cash-inflows/` (dos pestañas) |

Ficha completa de ejemplo (la mejor plantilla para un reporte nuevo):
[repgen-backend/docs/reports/fichas/receivables/](../../repgen-backend/docs/reports/fichas/receivables/receivables.md).

---

## Reparto del trabajo

| Paso | Quién | Entregable |
|---|---|---|
| 1. Ficha del reporte | Persona (el agente ayuda a redactar) | `docs/reports/fichas/<nombre>/<nombre>.md` + `api_response.json` |
| 2. Layout en FileMaker | Persona | Layout `apiExport_<Nombre>`, su respuesta cruda y su schema |
| 3. Datos dorados | Persona captura y aprueba; el agente arma el borrador | `__golden__/entrada*.json` + `esperado.json` |
| 4. Backend | Agente | campos, mapper, use case, endpoint, tests |
| 5. Frontend | Agente | página, columnas, ruta, menú, tests |
| 6. Revisión y cuadres | Persona | checklist de la sección 6 |
| 7. Comparación con el sistema actual | Persona (el agente analiza las diferencias) | mismo corte/rango en ambos reportes, diferencias explicadas |

Las decisiones de los pasos 1–3 y 7 no se pueden delegar: un agente no sabe qué
columnas quiere el cliente ni cómo se calcula un neto con devoluciones. Sí puede
redactar, preguntar y armar borradores para que la persona los revise.

En CxC (el piloto) la validación de reglas con datos reales tomó ~3 días; es el
trabajo que más vale y el que no se automatiza.

---

## 1. Ficha del reporte (persona)

Una carpeta por reporte en `repgen-backend/docs/reports/fichas/<nombre>/`:

| Archivo | Qué es |
|---|---|
| `<nombre>.md` | La ficha (plantilla abajo). |
| `api_response.json` | Contrato: un renglón de ejemplo por tipo, datos inventados. |
| `<Layout>_ResponseFM` + `<Layout>.schema.json` | Respuesta cruda del Data API y su validación, uno por layout. |
| `datos-dorados/` | Borrador de los datos dorados mientras se revisan (luego van a `__golden__/`). |

**Preguntas obligatorias antes de escribir columnas** (cada una cambió el diseño de CxC):

- ¿Muestra lo que pasó **entre dos fechas** (rango) o **lo que se debe/tiene a un día** (fecha de corte)? Un reporte a fecha de corte necesita reconstruir saldos hacia atrás.
- ¿Cuántos **layouts/fuentes**? Una sola tabla base por layout.
- ¿Qué se **excluye** y qué se muestra aunque "no cuente"? (canceladas, "no cobrar", saldos negativos, residuos de centavos).
- ¿Qué pasa con algo **cancelado o modificado después** del corte/rango?
- ¿**Moneda**? ¿Se convierte a MXN o se separa?
- ¿Qué **fecha** cuenta para cada evento (depósito, complemento, timbrado)? Debe ser la misma en todas las fuentes.
- ¿Filtra por **permisos** (p. ej. bancos)?

Plantilla de la ficha:

```markdown
# Ficha: <Nombre del reporte>

- Nombre interno (kebab, inglés como los demás): <p. ej. inventory>
- Endpoint: reports/<ruta-es>/buscar   (p. ej. inventarios/buscar; varias palabras con guion: cuentas-por-cobrar)
- Ruta frontend y reportId: /<ruta_es>  (varias palabras con guion bajo: cuentas_por_cobrar; ya existe en el menú como "Próximamente"?)
- Layout FileMaker: apiExport_<Nombre>
- Tipo: rango de fechas | fecha de corte
- Campo(s) de fecha del rango: <campo FM>, <campo FM>  (se combinan con OR)
- ¿Filtra por permisos del usuario?: no | sí → campo: <campo FM>

## Contrato de respuesta
- Mismas llaves en todas las filas; lo que no aplica va en null (no "" ni 0).
- Montos como número, fechas ISO YYYY-MM-DD, nombres como en Ventas.
- Tabla encabezado anterior → campo de respuesta → origen en FileMaker.

## Columnas
| Etiqueta | campo (camelCase) | tipo (text/number/date/boolean) | filtro lista? | oculta? | origen FM | regla |
|---|---|---|---|---|---|---|

## Lógica de negocio
- Pasos numerados de registro FM → fila: búsqueda (peticiones), tipo de
  renglón, cálculo de cada campo, exclusiones, orden de filas, cuadres.
- Cada regla con ejemplo y, si se decidió con alguien, "**decidido**" y por qué.
- Lo que falta decidir va como **PENDIENTE**; bloquea los datos dorados.

## Resumen / KPIs
- Qué cifra va en "Resultado", qué secciones en el panel lateral, en qué moneda.

## Casos que deben estar en los datos dorados
- [ ] registro normal
- [ ] campo vacío / null en FileMaker
- [ ] (cada regla de negocio de arriba)
```

Si una regla es discutible o se decidió con el cliente, además va un ADR en
`repgen-backend/docs/reports/ADR/<NOMBRE>/` (ver los de Ventas).

---

## 2. Layout en FileMaker (persona)

- [ ] Layout `apiExport_<Nombre>` solo con los campos de la ficha (menos campos = respuesta más chica).
- [ ] Portales identificados y con nombre de objeto (el mapper los lee por nombre; sin nombre, la llave es la ocurrencia de tabla y se rompe si la renombran).
- [ ] La cuenta de Data API tiene acceso al layout.
- [ ] Guardar la respuesta cruda (`<Layout>_ResponseFM`) y su schema en la carpeta de la ficha. Si después cambian nombres de campo en el layout, actualizar ambos **y recapturar las entradas doradas**.

Trampas de FileMaker que ya costaron tiempo:

- **Portales cortados a 50 renglones** por el Data API, aunque el layout muestre todos. El backend debe pedir `limit.<portal>` (`findRecords(..., portalLimits)`).
- **Cálculos almacenados desactualizados**: un cálculo almacenado no se recalcula cuando cambian registros relacionados (en CxC un saldo seguía en $1,440 hasta abrir el registro). Revisar si los saldos son almacenados.
- **Un campo con dos significados**: `saldo_fecha_liquidacion_bancoITM_noCobrar` trae la fecha de "no cobrar" o la del depósito; distinguir con el estatus.
- **Cancelar deja el saldo en 0**: para un corte anterior a la cancelación, el saldo se reconstruye (gran total − pagos hasta el corte).
- **Buscar en un campo de portal** trae el registro si *algún* renglón relacionado cumple: útil para "algún pago después del corte".
- **Campos de otra tabla dentro de un portal**: salen bien por renglón solo si esa tabla se relaciona *a través de* la tabla del portal. Comprobarlo con un registro de dos renglones distintos (en Ingresos: una venta con dos pagos de depósitos distintos).
- **Varios registros relacionados, un solo campo**: un depósito puede tener dos ingresos (dos clientes); un campo relacionado en el layout trae solo uno, y dos relaciones distintas pueden apuntar a ingresos distintos.
- **La fecha del reporte actual puede no ser la que se decidió**: en Ingresos el reporte anterior usaba la fecha del banco y la regla decidida fue la del complemento. Compararlo con una captura antes de programar.

---

## 3. Datos dorados (persona)

Son la especificación ejecutable del reporte. El agente programa hasta que su
código produce exactamente `esperado.json` a partir de `entrada.json`.

Ubicación: `repgen-backend/src/reports/infrastructure/<nombre>/__golden__/`

| Archivo | Contenido |
|---|---|
| `entrada.json` | Arreglo `response.data` de un `_find` real sobre el layout (registros con `fieldData` y `portalData`). Capturarlo con Postman. |
| `esperado.json` | Arreglo de filas que debe devolver `cleanData`, **escrito por la persona** a partir del reporte que hoy usa el cliente (Excel, reporte FM). |
| `rango.json` | `{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }` usado para generar `esperado.json`. Un reporte a fecha de corte usa `corte.json` (`{ "fechaCorte": "YYYY-MM-DD" }`). |

Con varios layouts hay una entrada por layout (`entrada-facturas.json`,
`entrada-bancos.json`); se guarda la respuesta completa del `_find` y el test
lee `response.data`.

**Flujo del borrador** (el que mejor funcionó en CxC):

1. La persona captura las entradas (los mismos registros siempre; si se
   recapturan, que sean los mismos para que solo cambie lo esperado).
2. El agente elige una fecha/rango que haga que esos registros cubran la mayor
   cantidad de casos de la ficha (en CxC, corte 10/06/2024 con registros de 2024).
3. El agente arma `esperado-borrador.json` con un **script independiente que
   aplica la ficha**, no con el código del reporte, y señala qué casos cubre y
   cuáles faltan.
4. La persona lo revisa renglón por renglón, lo aprueba y lo copia a
   `__golden__/` como `esperado.json`. Desde ahí es la especificación.
5. Los casos que esos registros no cubren se agregan en un segundo juego
   (`__golden__/reciente/`, otro corte) con registros elegidos a mano.

Reglas:

- **Anonimizar** antes de subir: RFC, razón social, nombres, UUID, cuentas. Con
  `node scripts/anonimizar-datos-dorados.mjs docs/reports/fichas/<nombre>/datos-dorados`
  (desde `repgen-backend`), **antes** de armar el borrador. Usa el mismo
  reemplazo para el mismo valor en todas las entradas, así que relaciones y
  totales no cambian; si se vuelve a correr no cambia nada. Si el reporte trae
  otro campo sensible, se agrega su sufijo a `REGLAS` del script. Las
  respuestas reales completas van en `src/reports/_namefields/`, que está en
  `.gitignore` y nunca se sube.
- 10–30 registros bastan si cubren todos los casos de la ficha.
- `esperado.json` **nunca** se genera corriendo el código nuevo: sería comparar
  el código contra sí mismo. El borrador sale de un script aparte y lo aprueba la persona.
- El agente no modifica `__golden__/`. Si cree que `esperado.json` está mal, lo dice y se detiene.

---

## 4. Backend (agente)

### 4.1 Relación FileMaker

- [ ] `repgen-backend/src/filemaker/relations/_<nombre>.ts` con los nombres de ocurrencia de tabla (ver `_sales.item.ts`).
- [ ] Exportarla en `relations/index.ts`.

### 4.2 Campos y mapper

Nombres: carpeta y archivos con el nombre interno en inglés (`receivables`);
el endpoint en español con guion; la ruta del frontend y el `reportId` en
español con guion bajo. El `reportId` se guarda en las vistas de FileMaker:
una vez publicado no se cambia.

**Estilo para reportes nuevos** (el de `receivables/`): los nombres de campo
de FileMaker en constantes planas en `infrastructure/<nombre>/<nombre>.fields.ts`
y el mapper los lee directo de `fieldData` / `getPortalRows`. Sin
`FieldMapHelper`.

- [ ] `<nombre>.fields.ts`: layout(s), campos y portales.
- [ ] `<Layout>.schema.json` por layout: validación de los registros crudos (si un registro no cumple, el endpoint responde 500 a propósito; ver `cleanOrThrow`).
- [ ] `<nombre>.mapper.ts`: `cleanData(...)` con **todas** las reglas de negocio. Lo que no aplica va en `null`: usar parsers que devuelvan `null` (`fecha`, `numero`, `id`, `texto` de `receivables.mapper.ts`), no `TypeGetters` (devuelve `0` / `''`). Al segundo reporte que los necesite se mueven a `infrastructure/shared`, no se copian.
- [ ] Permisos por banco: reusar `getBankBaseFilters` (`infrastructure/banks`), no copiar el filtro.

Bancos, Ventas y Ventas por concepto usan el estilo anterior (`*-field-map.ts`
+ helper con `FieldMapHelper`). No se migran mientras no tengan datos dorados,
y no se copia ese estilo en reportes nuevos.

### 4.3 Tipo compartido

- [ ] Interfaz `Report<Nombre>Record` en `packages/shared-types/index.d.ts` (contrato backend ↔ frontend).
- [ ] En `domain/<nombre>/<nombre>-report.types.ts`: `export type { Report<Nombre>Record } from '@repgen/shared-types';` como en bancos.

### 4.4 Use case, módulo y endpoint

Reporte a fecha de corte o con varios layouts: **no extender `BaseReportService`**
(es de un layout con rango). Copiar `application/receivables/get-receivables-report.use-case.ts`:
consulta cada layout con `findAllRecords(..., portalLimits)` y limpia con
`cleanOrThrow` (`application/shared/report-query.ts`: sesión `'reportes'`, aviso
de truncado y 500 si un registro no cumple el schema), reutiliza la caché con
`fetchCached` (`application/shared/report-cache.ts`), valida la fecha (no
futura) y responde `{ fechaCorte, data }`. `toFileMakerDate` está en
`src/common/utils`. Las búsquedas van en
funciones puras `build<Fuente>Query(corte)` con su test.

- [ ] Reporte por rango con un layout: el use case extiende `BaseReportService` con `layoutName`, `cachePrefix`, `dateField`, `permissionFieldName`, `cleanDataFunction` (copiar `get-salesitem-report.use-case.ts` o, con permisos, `get-bank-report.use-case.ts`). `BaseReportService` ya usa la sesión de FileMaker `'reportes'`, la caché y el rango de fechas: no repetir nada de eso.
- [ ] Exportar en `application/index.ts` y `domain/index.ts`.
- [ ] Registrar en `providers` de `reports.module.ts`.
- [ ] Endpoint en `reports.controller.ts`, igual a los existentes:

```typescript
@Post('<ruta-es>/buscar')
@HttpCode(200)
@Throttle({ default: { limit: 20, ttl: 60000 } })
async get<Nombre>Reports(
  @Body() { dateRange }: SearchReportDto,
  @Request() req: AuthenticatedRequest,
): Promise<ReportResponse<Report<Nombre>Record>> {
  return this.reportService<Nombre>.fetchReport(dateRange, req.tenant, req.id);
}
```

### 4.5 Tests backend (obligatorios)

Test de datos dorados en `infrastructure/<nombre>/<nombre>.golden.spec.ts`:

```typescript
import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './<nombre>.mapper';
import entrada from './__golden__/entrada.json';
import esperado from './__golden__/esperado.json';
import rango from './__golden__/rango.json';

describe('<nombre> cleanData — datos dorados', () => {
  it('produce exactamente la salida esperada', () => {
    expect(cleanData(entrada as RawRecord[], rango)).toEqual(esperado);
  });
});
```

Con varios layouts y fecha de corte (ver `receivables.golden.spec.ts`):
`cleanData(facturas.response.data, bancos.response.data, corte.fechaCorte)`
comparado con `{ fechaCorte, data }`.

Campos renombrados en FileMaker: `entrada.json` es fijo, así que este test no
los detecta solo. Los detecta (a) el `required` del `*-report.schema.json`, que
en producción responde 500 con log en vez de un reporte con huecos, y
(b) volver a capturar `entrada.json` del layout cuando se toque FileMaker.

Además, un test unitario por cada regla de negocio de la ficha que no sea obvia
en los datos dorados (un `it` por regla, con el nombre de la regla). Los datos
del test deben parecerse a los reales: en CxC una prueba de "cancelada después
del corte" usaba saldo 100 y escondió que una cancelada real trae saldo 0.

---

## 5. Frontend (agente)

Carpeta plana `repgen-frontend/src/features/reports/<nombre>/` (como `banks/`):

- [ ] `<nombre>.schema.json`: columnas con `field`, `dataType`, `filtro: "lista"`, `oculta`. Las etiquetas y tipos salen de la ficha.
- [ ] `columnas.ts`: `ColumnBuilder` sobre el schema (copiar `banks/columnas.ts`).
- [ ] `Reporte<Nombre>.tsx`: `useReporteBase` + `useReporteGrid` + `TablaDinamica` + `toolbarReporte` + `PanelKpiLateral` (copiar `banks/ReporteBancos.tsx` y quitar lo que no aplique). El `reportId` de `useReporteGrid` y `toolbarReporte` es la ruta en español (`"bancos"`, `"cuentas_por_cobrar"`).
- [ ] Reporte a fecha de corte: `useReporteCorte` en vez de `useReporteBase`, y el selector de corte con botón "Aplicar" (copiar `receivables/ReporteCuentasPorCobrar.tsx`). Elegir la fecha no consulta; consulta al aplicar.
- [ ] Cálculos de KPIs en funciones puras `calcular<Nombre>.ts`, nunca dentro del componente.
- [ ] Ruta en `src/app/router.tsx` (lazy + precarga, como bancos/ventas) y quitar "Próximamente" de su entrada en `src/app/layout/Sidebar.tsx`.

Nombres de columnas (los cuida `shared/nombres-columnas.test.ts`, que revisa todos los `*.schema.json`):

- `<Entidad> <Dato>`: "Cliente Clasificación 1", "Factura Método de Pago", "Banco Nombre". Entidades: Cliente, Cliente/Proveedor, Factura, Artículo, Banco, Pago, Bodega, Venta, Devolución, Ingreso, Egreso. Una entidad nueva se agrega a la lista del test.
- Sin entidad solo los importes y tasas del renglón (Importe, Descuento, IVA, IEPS, ISR, Costo, Ganancia, Margen) y los datos del renglón mismo ("Tipo de Renglón", "Fecha Corte").
- Si el `field` ya existe en otro reporte, se copia su encabezado tal cual; el mismo dato se llama igual en todos.
- Palabras separadas y con acentos ("Tipo de Cambio", no "TipoDeCambio").
- Renombrar un encabezado no rompe las vistas guardadas (guardan el `field`); renombrar un `field` sí.

Convenciones de UI ya decididas (no reabrir sin preguntar):

- Fechas = navegar por periodos (`FiltroFechas`), no inputs libres. Excepción: un reporte a fecha de corte usa un solo día con "Aplicar".
- Sin atajos de teclado ni reordenar columnas por arrastre.
- Montos en monedas distintas nunca se suman juntos (ver `totalesBancos`).

Tests (obligatorios):

- [ ] `calcular<Nombre>.test.ts`: los KPIs calculados sobre las filas de `esperado.json` dan las cifras de la ficha.
- [ ] `columnas.test.ts`: orden de las primeras columnas y cuáles empiezan ocultas, según la ficha (ver `banks/columnas.test.ts`). Que cada `field` exista en `Report<Nombre>Record` lo cuida `pnpm build`.
- [ ] `Reporte<Nombre>.test.tsx`: render con API mockeada (ver `banks/ReporteBancos.test.tsx`).

---

## 6. Definición de terminado y revisión (persona)

El agente entrega solo cuando todo esto pasa:

```bash
pnpm test
```

```bash
pnpm lint
```

```bash
pnpm build
```

```bash
pnpm typecheck:shared
```

La persona revisa (15–30 min, no línea por línea):

- [ ] `__golden__/` no fue modificado por el agente (`git diff --stat` sobre esa carpeta).
- [ ] Las reglas de negocio están en `*.mapper.ts`, no en `BaseReportService`, el controller ni el componente.
- [ ] No hay helpers duplicados de `reports/infrastructure/shared` ni de `features/reports/shared`.
- [ ] El diff toca solo los archivos de esta guía (más `shared-types`, módulo, controller, router, sidebar).
- [ ] Prueba manual: login → periodo con datos → filtros → totales → exportar. Comparar 2–3 cifras con el reporte actual del cliente.
- [ ] Cuadres de la ficha (p. ej. con corte = hoy cada saldo es el de FileMaker).
- [ ] Comparación con el sistema actual: mismo corte/rango en ambos, exportar los dos y explicar cada diferencia (tabla por tipo de diferencia). No asumir que el sistema actual tiene razón: en CxC hubo diferencias donde el ERP estaba bien (canceladas, abonos divididos) y otras donde el reporte nuevo estaba bien.
- [ ] Logs del backend sin advertencias de "Reporte truncado" ni errores de formato FM.
- [ ] Entrada nueva en `repgen-backend/docs/reports/INDEX.md`.

---

## 7. Instrucción para el agente

Copiar y completar:

```text
Implementa el reporte <Nombre> siguiendo docs/guides/COMO-AGREGAR-REPORTE.md
(secciones 4 y 5). La especificación está en
repgen-backend/docs/reports/fichas/<nombre>/<nombre>.md y los datos dorados en
repgen-backend/src/reports/infrastructure/<nombre>/__golden__/.

- Usa como modelo el reporte <banks|salesitem|sales>.
- No modifiques __golden__/. Si crees que esperado.json está mal, detente y explica por qué.
- No cambies código compartido (BaseReportService, report-query, FileMakerService, features/reports/shared)
  sin preguntar primero.
- Termina cuando pasen pnpm test, pnpm lint, pnpm build y pnpm typecheck:shared,
  y lista las preguntas que la ficha no resolvió.

Con Claude Code, la skill `agregar-reporte` (.claude/skills/agregar-reporte/)
guía todo el flujo, desde la ficha.
```

---

## Anti-patrones

- Reglas de negocio en `BaseReportService`, el controller o el componente React.
- Nombres de campo FM escritos fuera de `<nombre>.fields.ts` (o `*-field-map.ts` en los reportes anteriores).
- Omitir `tenant` en consultas o en la clave de caché (lo pone `BaseReportService`; en un use case propio va a mano, con el usuario).
- Subir respuestas reales de FileMaker sin anonimizar, o credenciales.
- Generar `esperado.json` con el código que se está probando.
- Correr `prettier --write` o `eslint --fix` sobre carpetas enteras: reformatea y
  cambia saltos de línea (CRLF→LF) en archivos ajenos. Formatear solo los archivos tocados.
- Confiar en un saldo almacenado de FileMaker sin el cuadre "corte = hoy".
