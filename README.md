# RepGen

Generador de reportes multi-tenant sobre FileMaker Data API. Monorepo pnpm con backend NestJS, frontend React y tipos compartidos.

## Estructura

```text
RepGen/
├── repgen-backend/          API NestJS 11 (auth JWT, reportes, FileMaker Data API)
├── repgen-frontend/         React 19 + Vite + Vitest + AG Grid + Tailwind
├── packages/
│   └── shared-types/        Contratos de API compartidos (solo tipos .d.ts)
├── docs/                    Documentación transversal (Jira, arquitectura, deploy)
└── .github/workflows/       CI por app + deploys (pendientes de reconexión)
```

## Requisitos

- **Node ≥ 22**
- **pnpm 11** — la versión exacta está pineada en el campo `packageManager`; con corepack habilitado (`corepack enable`) se usa sola.

## Quickstart

```bash
pnpm install
```

Variables de entorno: cada app lee su `.env` local (no versionado). Copia el preset que corresponda desde `repgen-backend/env-presets/` y `repgen-frontend/env-presets/` a `.env` en cada carpeta.

```bash
# Backend en http://localhost:3000 (requiere .env con credenciales FileMaker)
pnpm dev:backend

# Frontend en http://localhost:5173 (proxy /api → localhost:3000)
pnpm dev:frontend
```

## Scripts (desde la raíz)

| Script | Qué hace |
|--------|----------|
| `pnpm dev:backend` / `pnpm dev:frontend` | Arranca cada app en modo desarrollo |
| `pnpm build` | Build de todos los paquetes |
| `pnpm build:backend` / `pnpm build:frontend` | Build de una app |
| `pnpm test` | Tests de todos los paquetes |
| `pnpm test:backend` / `pnpm test:frontend` | Tests de una app |
| `pnpm lint` | Lint de todos los paquetes |
| `pnpm typecheck:shared` | Valida los tipos compartidos (`@repgen/shared-types`) |

Para cualquier otro script de una app: `pnpm --filter generador-reportes-backend <script>` (o `generador-reportes-frontend`).

## Tipos compartidos

Los contratos de la API (configs de columnas, labels de tenant, features) viven en [`packages/shared-types/index.d.ts`](packages/shared-types/index.d.ts) y los consumen ambas apps vía `import type`. Es un paquete de solo declaraciones: no admite código runtime.

## CI/CD y deploy

- **CI**: [`ci-backend.yml`](.github/workflows/ci-backend.yml) y [`ci-frontend.yml`](.github/workflows/ci-frontend.yml) corren solo cuando cambia su parte (path filters). Node 22 + pnpm del `packageManager`.
- **Deploy** ⚠ *pendiente de reconexión tras la migración a monorepo*: [`deploy-vercel.yml`](.github/workflows/deploy-vercel.yml) (frontend) y [`deploy-digitalocean.yml`](.github/workflows/deploy-digitalocean.yml) (backend) están en modo manual (`workflow_dispatch`); las instrucciones para reconectarlos están en la cabecera de cada workflow y en [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md).
- **Docker backend**: `docker build -f repgen-backend/Dockerfile -t repgen-backend .` — el contexto es la **raíz** del monorepo.

## Documentación

Índice completo en [docs/README.md](docs/README.md).
