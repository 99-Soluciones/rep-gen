# Commits, ramas y pull requests

Reglas para todo el que cambie el repo, persona o IA. Si un agente hace el
commit, sigue esta guía igual que una persona (`CLAUDE.md` la enlaza).

## Ramas

```
feat/cxc-fecha-no-cobrar ──PR──▶ developer ──PR (release)──▶ main
```

- Cada cambio va en su propia rama, que sale de `developer`:
  `<tipo>/<descripcion-corta>`, en minúsculas y con guiones.
  Ejemplos: `feat/reporte-cxc`, `fix/totales-ventas`, `docs/guia-commits`.
- El `<tipo>` es el mismo que en los commits (tabla de abajo).
- **Nunca** se hace commit directo a `developer` ni a `main`: todo entra por PR.
- `developer` pasa a `main` con un PR de liberación cuando se publica.
- La rama se borra después de fusionarla.

## Mensajes de commit

Formato [Conventional Commits](https://www.conventionalcommits.org/es/), en
**español**:

```
<tipo>(<alcance>): <qué cambia, en presente>

<cuerpo opcional: por qué, si no es obvio>

<pie opcional: BREAKING CHANGE, Refs, Co-Authored-By>
```

Ejemplo:

```
feat(cxc): agrega la fecha de "No cobrar" a las facturas cerradas

Se toma de saldo_fecha_liquidacion_bancoITM_noCobrar solo si el estatus
es NoCobrar: en las cobradas ese campo trae la fecha del depósito.
```

| Tipo       | Cuándo                                                       |
| ---------- | ------------------------------------------------------------ |
| `feat`     | Algo nuevo que el usuario ve o usa (reporte, columna, filtro) |
| `fix`      | Corrige un error                                             |
| `refactor` | Cambia código sin cambiar lo que hace                        |
| `perf`     | Más rápido o más ligero, mismo resultado                     |
| `style`    | Solo aspecto visual o formato (CSS, tokens)                  |
| `test`     | Solo pruebas                                                 |
| `docs`     | Solo documentación (guías, fichas, README)                   |
| `chore`    | Mantenimiento: scripts, configuración, limpieza              |
| `ci`       | Workflows de GitHub Actions y despliegue                     |

Dependencias: `chore(deps)` para actualizar y `fix(deps)` si corrige un error.

**Alcance**: el área que cambia, en minúsculas. Los que ya se usan:
`reports`, `cxc`, `sales`, `sales-item`, `banks`, `filemaker`, `auth`,
`tenant`, `report-configs`, `app`, `layout`, `shared-types`, `backend`,
`deps`. Si el cambio toca muchas áreas, se omite: `docs: …`.

Reglas del asunto (primera línea):

- Máximo **72 caracteres**, en minúscula, sin punto final.
- Verbo en presente: "agrega", "corrige", "quita", "muestra".
- Dice **qué cambia para quien lo usa**, no qué archivo se tocó:
  ✅ `fix(sales): los totales usan las mismas filas que la tabla`
  ❌ `fix: cambios en calcularVentas.ts`

**Cambio incompatible** (rompe el contrato de la API, una vista guardada o un
dato que otro sistema usa): `!` después del alcance y pie `BREAKING CHANGE:`.

```
feat(cxc)!: renombra facturaStatus a facturaEstatus en la respuesta

BREAKING CHANGE: el frontend anterior deja de mostrar la columna.
```

## Qué va en un commit

- **Un commit = un cambio coherente.** El código, sus pruebas y la
  documentación que cambia con él van juntos. Dos cambios sin relación van en
  dos commits.
- Antes de cada commit pasan: `pnpm test`, `pnpm lint`, `pnpm build` y
  `pnpm typecheck:shared`. No se usa `--no-verify`.
- Formatear y corregir lint **solo en los archivos tocados**; formatear
  carpetas enteras mete cambios ajenos (saltos de línea) al commit.

**Nunca** van en un commit:

- Secretos: `.env`, contraseñas, tokens, credenciales de FileMaker.
- Datos reales sin anonimizar (nombres, RFC, UUID, cuentas). Ver
  `scripts/anonimizar-datos-dorados.mjs` en
  [COMO-AGREGAR-REPORTE](COMO-AGREGAR-REPORTE.md).
- Cambios a `__golden__/` hechos por la IA: esas carpetas las escribe una persona.
- Archivos generados (`dist/`, `coverage/`) ni archivos personales del editor.

## Pull requests

- **Base**: `developer` (o `main` solo en el PR de liberación).
- **Título**: con el mismo formato que un commit; es el mensaje que queda en
  `developer`.
- **Descripción**: se llena la plantilla (`.github/pull_request_template.md`):
  qué cambia, por qué, cómo se probó y qué falta.
- **Un PR = un tema.** Si crece mucho (más de ~400 líneas de código, sin
  contar datos ni JSON de prueba), conviene partirlo.
- Se abre como **borrador** (draft) mientras no esté listo para revisión.
- **Revisión**: al menos una persona lo aprueba antes de fusionar, también
  cuando lo hizo la IA. CI debe estar en verde.
- **Fusión**: *Squash and merge* hacia `developer` (un commit por PR, con el
  título del PR). El PR de liberación a `main` usa *Create a merge commit*.

## Cuando la IA hace el commit o el PR

- Solo cuando la persona lo pide.
- Sigue esta guía completa: rama, formato, verificación y plantilla.
- Muestra el mensaje y la lista de archivos antes de hacer el commit si
  incluye algo que la persona no pidió.
- Deja el pie `Co-Authored-By:` del asistente, para que se sepa qué se hizo con IA.
- No hace `push --force`, no reescribe historia ya publicada y no fusiona PRs
  por su cuenta.
