# DOC-8 — Despliegue, CI/CD y entornos

**Tipo Jira:** Story / Task  
**Epic:** [DOC] RepGen — Documentación técnica y operativa  
**Component:** DevOps

**Fuente:** `docs/deployment/DEPLOYMENT.md` y `.github/workflows/` del monorepo.

**Nota:** desde la migración a monorepo, los deploys (Vercel y DigitalOcean) quedaron en modo manual (`workflow_dispatch`), pendientes de reconexión; el CI sí corre en push/PR a `main`.

---

### SUB-8.1 — Pipeline CI

**Summary Jira:** `[DOC-8.1] Workflow CI GitHub Actions`

## Archivos

- `.github/workflows/ci-backend.yml`
- `.github/workflows/ci-frontend.yml`

## Objetivo documentar

- Triggers: push y PR a `main` con filtro de rutas (`repgen-backend/**` o `repgen-frontend/**`, más `packages/**` y archivos raíz de pnpm); también `workflow_dispatch`
- Backend: typecheck `@repgen/shared-types`, lint, test, e2e (la app arranca), build, `docker build` de comprobación
- Frontend: typecheck `@repgen/shared-types`, lint, test con coverage, build

## Criterios de aceptación

- [ ] Rama protegida y checks requeridos
- [ ] Comandos exactos que ejecuta el workflow

---

### SUB-8.2 — Deploy frontend (Vercel)

**Summary Jira:** `[DOC-8.2] Deploy Vercel frontend`

## Archivo

`.github/workflows/deploy-vercel.yml`

## Secret

- `VERCEL_TOKEN`

## Config proyecto

- `repgen-frontend/vercel.json`
- Variables `VITE_*` en Vercel UI

## Criterios de aceptación

- [ ] URL producción y preview
- [ ] Cómo apuntar `VITE_API_URL` al backend

---

### SUB-8.3 — Deploy backend (DigitalOcean)

**Summary Jira:** `[DOC-8.3] Deploy DigitalOcean backend`

## Archivo

`.github/workflows/deploy-digitalocean.yml`

## Secrets

| Secret | Uso |
|--------|-----|
| `DO_API_TOKEN` | API DigitalOcean |
| `DOCR_REGISTRY_NAME` | Container registry (recomendado) |
| `DO_APP_ID` | Actualizar app existente (opcional) |
| `DO_REGISTRY_USERNAME` / `PASSWORD` | Registry alternativo |

## Artefactos

- `repgen-backend/Dockerfile`
- Imagen: `repgen-backend:latest` en DOCR o GHCR

## Criterios de aceptación

- [ ] Pasos rollback imagen anterior
- [ ] Health check post-deploy

---

### SUB-8.4 — Variables de entorno por entorno

**Summary Jira:** `[DOC-8.4] Matriz variables entorno`

## Ubicaciones

| Componente | Presets |
|------------|---------|
| Backend | `repgen-backend/env-presets/` |
| Frontend | `repgen-frontend/env-presets/` |

## Matriz (completar valores en vault, no en Jira)

| Variable | Dev local | Producción BE | Producción FE |
|----------|-----------|---------------|---------------|
| `FRONTEND_URL` | localhost:5173 | URL Vercel | — |
| `JWT_SECRET` | local | DO App secret | — |
| `VITE_API_URL` | localhost:3000 | URL API | Vercel env |

## Criterios de aceptación

- [ ] Tabla sin secretos reales
- [ ] Responsable de rotación JWT

---

### SUB-8.5 — Runbook post-deploy y rollback

**Summary Jira:** `[DOC-8.5] Runbook deploy rollback`

## Checklist post-deploy

1. `GET /api/v1/` health (si existe)
2. Login con token FM de prueba
3. Buscar reporte bancos con rango fecha corto
4. Revisar `logs/error-*.log` primeros 5 min

## Rollback

- DO App Platform: redeploy tag/imagen anterior
- Vercel: promote deployment anterior

## Criterios de aceptación

- [ ] Tiempos estimados y contactos
- [ ] Enlace a DEPLOYMENT.md
