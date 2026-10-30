# Traspaso: ERP sobre el backend, sesiones por uso

**Fecha:** 2026-10-30
**Rama:** `feat/filemaker-sesiones-por-uso`, creada desde `developer` (`f9844fb`). Sin push ni despliegue.

## Contexto

Dirección aprobó construir el ERP sobre este backend (ADR-010). FileMaker sigue como fuente de verdad, sin PostgreSQL. Las lecturas van por layouts `API_*` y las escrituras por scripts `API_*`.

Los ADR y el spike **no están en este repositorio**. Viven en `OneDrive/Documentos/Migración ERP/GUIA/kit-documentacion-erp/docs`, carpeta sin git:

- `02-arquitectura/adr/ADR-010-erp-sobre-backend-de-reportes.md`: decisión y lista de lo que falta en el backend (§4).
- `02-arquitectura/adr/ADR-008-integracion-filemaker.md`: integración con FileMaker.
- `02-arquitectura/spike-integracion-filemaker.md`: experimentos E1–E9.

## Por qué existe este cambio

Una sesión de la Data API atiende en fila. Medido en el servidor real con `scripts/prueba-cola-sesion.mjs`, antes de actualizar a FileMaker Server 26:

| | Reporte | Misma sesión | Otra sesión |
| --- | --- | --- | --- |
| Sin reporte | — | 48 ms | 48 ms |
| Ronda 1 | 50.3 s | 48.2 s | 49 ms |
| Ronda 2 | 7.4 s | 5.3 s | 47 ms |

## Qué hay en la rama

1. `feat(filemaker)`: sesiones por `empresa + uso`, con usos `erp` (default) y `reportes`.
2. `feat(reports)`: `BaseReportService` consulta en la sesión `reportes`.
3. `chore(backend)`: script de prueba de cola, solo lectura.
4. `docs`: este traspaso.

`.vscode/settings.json` tiene cambios previos y queda fuera a propósito.

## Qué se probó

- Sobre el árbol completo: `tsc`, build y las 59 pruebas de Jest pasan. ESLint pasa en los cuatro archivos tocados.
- Servicio compilado contra un servidor falso con fila por sesión y un reporte de 1.5 s: la llamada corta en `erp` tardó 17 ms; en la misma sesión, 1,413 ms.
- **No probado:** contra FileMaker real, ni cada commit por separado.

## Siguientes pasos

### Antes de hacer push

- [ ] Revisar los cambios: `git diff developer...HEAD`.
- [ ] En `repgen-backend`, correr `pnpm exec tsc --noEmit -p tsconfig.json` y `pnpm test`.
- [ ] Probar los reportes en local.

### Antes de desplegar

- [ ] Revisar `FM_REQUEST_TIMEOUT_MS` en DigitalOcean. El default del código es 15 s y el repositorio no lo define para producción; el `.env` local usa 120 s. Si falta, un reporte de 50 s se corta a los 15 s.
- [ ] Confirmar que el servidor y la licencia acepten hasta 24 sesiones de la Data API (antes, hasta 12).

### Después de actualizar a FileMaker Server 26 (semana del 2026-11-02)

- [ ] Desde `repgen-backend`, repetir `node scripts/prueba-cola-sesion.mjs --confirmar`.
- [ ] Correr un reporte real.
- [ ] Empezar los experimentos del spike, primero E1 (Clerk).
- [ ] Ya desplegado, comparar el p95 de llamadas cortas durante reportes contra 37.3 s y revisar las sesiones en la Admin Console.

### Siguiente desarrollo (ADR-010 §4)

- [ ] Límite global de llamadas simultáneas a FileMaker.
- [ ] `runScript` y traducción de errores de FileMaker.
- [ ] Una cuenta genérica por empresa.
- [ ] Grupo de sesiones `erp`, con el primer endpoint de ERP y el número de E9.
- [ ] Login con proveedor de identidad y `PermisosGuard`.
- [ ] `trust proxy`, límites por usuario, `req.user`, permisos denegados por defecto y logs sin cuerpos.

## Pendientes fuera del código

- Identidad: propuesta Clerk Pro, sujeta a E1. Plan B: Re-Login por Data API.
- Licencias y límite anual de datos con el distribuidor de Claris.
- Revisión legal de identidades en un servicio externo.
- Versión actual del servidor: sin confirmar; el objetivo es la 26.
