# RepGen

Monorepo pnpm: `repgen-backend` (NestJS + FileMaker Data API), `repgen-frontend` (React + AG Grid), `packages/shared-types` (contratos de API).

- Reporte nuevo: seguir [docs/guides/COMO-AGREGAR-REPORTE.md](docs/guides/COMO-AGREGAR-REPORTE.md) (con Claude Code, la skill `agregar-reporte` guía el flujo).
- Nunca modificar carpetas `__golden__/`: son la especificación escrita por una persona. Si parecen incorrectas, detenerse y avisar.
- Verificación antes de entregar: `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm typecheck:shared`.
- No hacer commits salvo que se pidan. Commits, ramas y PR: seguir [docs/guides/COMMITS-Y-PR.md](docs/guides/COMMITS-Y-PR.md) (mensajes en español, Conventional Commits, PR a `developer`).
