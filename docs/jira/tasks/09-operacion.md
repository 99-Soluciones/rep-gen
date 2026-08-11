# DOC-9 — Operación y soporte

**Tipo Jira:** Story / Task  
**Epic:** [DOC] RepGen — Documentación técnica y operativa  
**Component:** Operations

---

### SUB-9.1 — Logs y diagnóstico

**Summary Jira:** `[DOC-9.1] Logs aplicación RepGen`

## Backend

- Carpeta: `repgen-backend/logs/`
- Archivos: `combined-YYYY-MM-DD.log`, `error-YYYY-MM-DD.log`
- HTTP logging vía middleware

## Qué buscar

| Síntoma | Archivo / patrón |
|---------|------------------|
| Error 500 API | `error-*.log` + stack trace |
| FM timeout | Mensaje FileMakerService |
| Auth fallida | AuthController / validateToken |

## Criterios de aceptación

- [ ] Retención de logs (días)
- [ ] Acceso en producción (DO logs vs archivos)

---

### SUB-9.2 — Errores frecuentes y resolución

**Summary Jira:** `[DOC-9.2] Troubleshooting RepGen`

## Tabla inicial (ampliar en operación)

| Error / síntoma | Causa probable | Acción |
|-----------------|----------------|--------|
| 401 en reportes | JWT expirado o ausente | Re-login |
| 429 | Throttle excedido | Esperar / revisar límites |
| 400 validation | filterModel inválido | Revisar DTO y payload FE |
| FM 401/403 | Credenciales FM o layout | Verificar env y relations |
| Tabla vacía | Rango fechas / permisos banco | Ajustar filtros |
| Columnas sin label | Tenant labels API | Ver SUB-4.4 |

## Criterios de aceptación

- [ ] Mínimo 6 entradas en tabla
- [ ] Proceso escalamiento a equipo FM

---

### SUB-9.3 — Performance y límites

**Summary Jira:** `[DOC-9.3] Performance y throttling`

## Límites documentados

- Global throttler: 100/min
- Reportes bancos: 20/min
- Login: 5/min
- Paginación default: 50 registros

## Cache

- `BaseReportService` — documentar TTL y clave

## Criterios de aceptación

- [ ] Recomendaciones `limit` para reportes grandes
- [ ] Herramienta load test si usan `autocannon` en monorepo

---

### SUB-9.4 — Contactos y responsabilidades

**Summary Jira:** `[DOC-9.4] RACI operación RepGen`

## Matriz (rellenar nombres en Confluence)

| Área | Responsable | Backup |
|------|-------------|--------|
| API NestJS | | |
| Frontend Vercel | | |
| FileMaker layouts | | |
| Infra DO / GitHub | | |

## Criterios de aceptación

- [ ] Horario soporte
- [ ] Canal Slack/Teams
