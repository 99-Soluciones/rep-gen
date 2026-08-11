> **OBSOLETO (2026-08):** describe el workspace multi-repo anterior a la migración a monorepo. Hoy todo vive en un único repositorio; ver el [README raíz](../../README.md).

# Workspace local (multi-repo)

La carpeta `RepGen` en tu máquina puede contener varios clones sin ser un monorepo Git.

## Layout recomendado

```text
RepGen/
├── repgen-docs/          ← git: documentación
├── repgen-backend/       ← git: API (deploy DO)
├── repgen-frontend/      ← git: UI (deploy Vercel)
└── repgen-workflows/     ← git: Actions (opcional)
```

## Clonar

```bash
mkdir RepGen && cd RepGen
git clone git@github.com:99-Soluciones/repgen-docs.git
git clone git@github.com:lSheel/repgen-backend.git
git clone git@github.com:lSheel/repgen-frontend.git
##git clone git@github.com:TU_ORG/repgen-workflows.git   # opcional
```

## Desarrollo

| Acción | Directorio |
|--------|------------|
| API local | `repgen-backend` → `pnpm start:dev` |
| UI local | `repgen-frontend` → `pnpm dev` |
| Leer / editar doc Jira | `repgen-docs/jira/` |

Variables: copiar `env-presets` en cada repo de código (ver DOC-10 en `jira/tasks/10-onboarding.md`).
