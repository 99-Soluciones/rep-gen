# DOC-10 — Onboarding del desarrollador

**Tipo Jira:** Story / Task  
**Epic:** [DOC] RepGen — Documentación técnica y operativa  
**Component:** General

---

### SUB-10.1 — Prerrequisitos

**Summary Jira:** `[DOC-10.1] Prerrequisitos desarrollo RepGen`

## Herramientas

| Herramienta | Versión sugerida |
|-------------|------------------|
| Node.js | LTS (verificar `.nvm` o docs equipo) |
| pnpm | 8+ |
| Git | 2.x |
| Editor | VS Code / Cursor |

## Accesos necesarios

- Repositorio GitHub
- Credenciales FileMaker (dev) o VPN
- Token FM de prueba para login
- (Opcional) Vercel / DO solo para DevOps

## Criterios de aceptación

- [ ] Lista verificable día 1
- [ ] Quién solicita cada acceso

---

### SUB-10.2 — Setup local paso a paso

**Summary Jira:** `[DOC-10.2] Setup local RepGen`

## Backend

```bash
cd repgen-backend
cp env-presets/.env.development.local .env
# Editar .env con credenciales FM y JWT_SECRET
pnpm install
pnpm start:dev
# API: http://localhost:3000/api/v1/
```

## Frontend

```bash
cd repgen-frontend
cp env-presets/.env.development.local .env
# VITE_API_URL=http://localhost:3000/api/v1
pnpm install
pnpm dev
# UI: http://localhost:5173
```

## Verificación

1. API responde
2. Login con token FM + tenant de prueba
3. Abrir reporte bancos con rango corto

## Criterios de aceptación

- [ ] Tiempo estimado setup: ___ min
- [ ] Troubleshooting si FM no alcanzable

---

### SUB-10.3 — Comandos útiles

**Summary Jira:** `[DOC-10.3] Comandos CLI RepGen`

## Backend (`repgen-backend`)

| Comando | Uso |
|---------|-----|
| `pnpm start:dev` | Desarrollo con watch |
| `pnpm build` | Compilar |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | E2E |
| `pnpm lint` | ESLint |
| `pnpm generate:field-map --report X` | Scaffold reporte |

## Frontend (`repgen-frontend`)

| Comando | Uso |
|---------|-----|
| `pnpm dev` | Vite dev server |
| `pnpm build` | Build producción |
| `pnpm test` | Vitest |
| `pnpm lint` | ESLint |

## Raíz monorepo

- Revisar `package.json` raíz si hay scripts agregados

## Criterios de aceptación

- [ ] Tabla copiable en wiki
- [ ] CI ejecuta mismos comandos que local

---

### SUB-10.4 — Primer cambio guiado

**Summary Jira:** `[DOC-10.4] Ejercicio primer cambio`

## Ejercicio sugerido (bajo riesgo)

**Opción A:** Añadir o corregir una etiqueta en column labels (tenant)  
**Opción B:** Ajustar texto de UI en `ComingSoon` o Sidebar  
**Opción C:** Añadir campo al field map de un reporte (con FM de dev)

## Pasos

1. Crear rama `docs/ejercicio-nombre`
2. Cambio mínimo + test si aplica
3. PR con descripción y screenshot
4. Code review

## Criterios de aceptación

- [ ] Guía completada por al menos un dev nuevo
- [ ] Feedback incorporado a SUB-10.2
