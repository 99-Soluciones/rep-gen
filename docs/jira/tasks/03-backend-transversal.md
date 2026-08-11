# DOC-3 — Backend: módulos transversales

**Tipo Jira:** Story / Task  
**Epic:** [DOC] RepGen — Documentación técnica y operativa  
**Component:** Backend

---

### SUB-3.1 — Bootstrap y AppModule

**Summary Jira:** `[DOC-3.1] Bootstrap NestJS y AppModule`

## Objetivo

Documentar arranque de la API y módulos cargados.

## Proceso de arranque (`main.ts`)

1. `NestFactory.create(AppModule)`
2. `helmet()` — headers de seguridad
3. CORS con `FRONTEND_URL`
4. `ValidationPipe` global (whitelist, transform)
5. `HttpExceptionFilter` global
6. Prefijo `api/v1/`
7. Listen en `PORT` (default 3000)

## AppModule (`app.module.ts`)

| Import | Rol |
|--------|-----|
| `ThrottlerModule` | 100 req/min global |
| `ConfigModule` | Variables de entorno globales |
| `LoggerModule` | Winston / HTTP logger |
| `AuthModule` | Login y JWT |
| `FileMakerModule` | Cliente FM |
| `ReportsModule` | Endpoints reportes |
| `UserModule` | Permisos bancos |
| `TenantModule` | Column labels |

`HttpLoggerMiddleware` aplicado a `/*path`.

## Criterios de aceptación

- [ ] Lista de variables `PORT`, `FRONTEND_URL`
- [ ] Endpoint health si existe (`app.controller.ts`)

---

### SUB-3.2 — Configuración y variables de entorno

**Summary Jira:** `[DOC-3.2] Variables entorno backend`

## Objetivo

Inventario de variables (sin valores secretos en Jira).

## Ubicaciones

- `repgen-backend/env-presets/.env.development.local`
- `repgen-backend/env-presets/.env.production`
- `.env` local (gitignored)

## Variables típicas (verificar en presets)

| Variable | Uso |
|----------|-----|
| `NODE_ENV` | Entorno |
| `PORT` | Puerto API |
| `FRONTEND_URL` | CORS |
| `JWT_SECRET` | Firma tokens |
| Variables FM | Host, base, credenciales Data API |

## Criterios de aceptación

- [ ] Tabla nombre / obligatorio / descripción
- [ ] Nota: secretos solo en vault / GitHub Secrets / DO App

---

### SUB-3.3 — Logging y observabilidad

**Summary Jira:** `[DOC-3.3] Logging backend RepGen`

## Objetivo

Cómo se registran requests y errores.

## Archivos

- `src/common/logger/logger.module.ts`
- `src/common/logger/logger.service.ts`
- `src/common/logger/http-logger.middleware.ts`

## Docs en repo

- `LOGGER_IMPLEMENTATION.md`
- `LOGGER_QUICK_START.md`
- `LOGGER_EXAMPLES.ts`

## Operación

- Logs rotados en `repgen-backend/logs/` (`combined-*.log`, `error-*.log`)

## Criterios de aceptación

- [ ] Niveles de log por entorno
- [ ] Qué buscar en `error-*.log` ante incidente

---

### SUB-3.4 — Manejo de errores HTTP

**Summary Jira:** `[DOC-3.4] Filtro excepciones HTTP`

## Objetivo

Formato de respuesta de error hacia el frontend.

## Archivo

`src/common/filters/http-exception.filter.ts`

## Criterios de aceptación

- [ ] Ejemplo JSON de error 4xx / 5xx (anonimizado)
- [ ] Relación con `ValidationPipe` (422)

---

### SUB-3.5 — Rate limiting (Throttler)

**Summary Jira:** `[DOC-3.5] Rate limiting API`

## Objetivo

Límites globales y por endpoint.

## Configuración

- Global: 100 requests / 60s (`AppModule`)
- Reportes bancos: `@Throttle({ limit: 20, ttl: 60000 })` en `reports.controller.ts`
- Auth login: 5 / 60s en `auth.controller.ts`

## Criterios de aceptación

- [ ] Tabla endpoint → límite
- [ ] Comportamiento esperado al exceder (429)
