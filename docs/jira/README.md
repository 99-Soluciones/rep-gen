# Documentación RepGen — Backlog para Jira

Este directorio contiene la estructura completa de documentación de **RepGen** lista para crear en Jira: un **Epic**, **10 tareas (Stories)** y **subtareas** con descripciones, diagramas y enlaces al código.

## Cómo usarlo

1. **Crear el Epic** — Copia el contenido de [00-EPIC.md](./00-EPIC.md) en un issue tipo *Epic*.
2. **Crear las tareas** — Por cada archivo en [tasks/](./tasks/), crea un issue *Story* o *Task* y enlázalo al Epic (*Epic Link* / *Parent*).
3. **Crear subtareas** — Dentro de cada tarea, crea *Sub-tasks* usando las secciones `### SUB-xxx` de cada archivo.
4. **Marcar progreso** — Usa los checkboxes `- [ ]` de cada subtarea como criterios de aceptación en Jira o en Confluence.

## Importación en Jira (campos: Summary, Description, Labels, Parent, Priority, …)

1. **[IMPORTACION-JIRA.md](./IMPORTACION-JIRA.md)** — mapeo con los campos de tu proyecto  
2. **[jira-import-fase1-epic-y-tareas.csv](./jira-import-fase1-epic-y-tareas.csv)** — Epic + 10 Tasks (`Parent` vacío)  
3. **[jira-import-fase2-subtareas.csv](./jira-import-fase2-subtareas.csv)** — 47 Sub-tasks (`Parent` = Summary de la Task)  

El archivo `jira-import.csv` anterior está obsoleto (usaba Epic Name / Work item Id, que no tenéis en el importador).

## Índice de tareas

| # | Archivo | Tema |
|---|---------|------|
| — | [00-EPIC.md](./00-EPIC.md) | Epic contenedor |
| 1 | [tasks/01-vision-general.md](./tasks/01-vision-general.md) | Visión, contexto, glosario |
| 2 | [tasks/02-arquitectura.md](./tasks/02-arquitectura.md) | Arquitectura y convenciones |
| 3 | [tasks/03-backend-transversal.md](./tasks/03-backend-transversal.md) | App, config, logging, errores |
| 4 | [tasks/04-auth-tenant.md](./tasks/04-auth-tenant.md) | Auth JWT, permisos, tenant |
| 5 | [tasks/05-filemaker.md](./tasks/05-filemaker.md) | Integración FileMaker |
| 6 | [tasks/06-reportes.md](./tasks/06-reportes.md) | Dominio reportes (núcleo) |
| 7 | [tasks/07-frontend.md](./tasks/07-frontend.md) | React, AG Grid, UI |
| 8 | [tasks/08-deploy-cicd.md](./tasks/08-deploy-cicd.md) | CI/CD, Vercel, DigitalOcean |
| 9 | [tasks/09-operacion.md](./tasks/09-operacion.md) | Logs, troubleshooting |
| 10 | [tasks/10-onboarding.md](./tasks/10-onboarding.md) | Setup local y primer cambio |
| 11 | [tasks/11-config-columnas.md](./tasks/11-config-columnas.md) | Configuraciones de columnas guardadas |

## Guías adicionales

| Guía | Uso |
|------|-----|
| [guides/COMO-AGREGAR-REPORTE.md](./guides/COMO-AGREGAR-REPORTE.md) | Checklist E2E para un reporte nuevo |
| [../references/LINKS.md](../references/LINKS.md) | Enlaces a backend, frontend y workflows (editar `TU_ORG`) |
| [PLANTILLA-SUBTAREA.md](./PLANTILLA-SUBTAREA.md) | Plantilla vacía para subtareas extra |

## Documentación en otros repositorios (no duplicar aquí)

| Tema | Dónde |
|------|--------|
| Reportes, field maps, ADRs | Repo **repgen-backend** → `docs/reports/` |
| DOC-4.4 Column labels API | **repgen-backend** → [ver LINKS.md](../references/LINKS.md) |
| DOC-7.6 ColumnLabelsProvider | **repgen-frontend** → [ver LINKS.md](../references/LINKS.md) |
| Arquitectura objetivo | Este repo → [architecture/PROUESTA_ARQUITECTURA.md](../architecture/PROUESTA_ARQUITECTURA.md) |
| Deploy / CI workflows | Repo **repgen-workflows** → `.github/DEPLOYMENT.md` |
| Logging (guías) | Este repo → [logging/](../logging/) |

## Labels y componentes sugeridos (Jira)

- **Labels:** `documentation`, `repgen`, `knowledge-base`
- **Components:** `Backend`, `Frontend`, `FileMaker`, `Reports`, `DevOps`

## Orden recomendado de ejecución

1. Tarea 1 + subtarea 6.1 (flujo reportes)
2. Tarea 8 (si hay despliegues activos)
3. Tareas 4, 5, 6
4. Tarea 7 (en paralelo con backend)
5. Tareas 2, 9, 10
