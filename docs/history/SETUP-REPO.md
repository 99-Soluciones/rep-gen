> **OBSOLETO (2026-08):** `repgen-docs` ya no es un repo independiente; es la carpeta `docs/` del monorepo. Se conserva como referencia histórica.

# Publicar `repgen-docs` en GitHub

## 1. Inicializar solo esta carpeta

```bash
cd repgen-docs
git init
git add .
git commit -m "docs: estructura inicial RepGen (Jira, arquitectura, referencias)"
```

## 2. Crear repo remoto

En GitHub: **New repository** → nombre `repgen-docs` → sin README (ya existe local).

```bash
git remote add origin git@github.com:TU_ORG/repgen-docs.git
git branch -M main
git push -u origin main
```

## 3. Configurar enlaces

Edita [references/REPOS.md](references/REPOS.md) y sustituye `TU_ORG` en [references/LINKS.md](references/LINKS.md).

## 4. Permisos

- Equipo dev: read (o write si documentan en PRs).
- No requiere secrets de Vercel/DO en este repo.

## 5. Integración Jira / Confluence

En el Epic o página principal, enlaza:

```text
https://github.com/TU_ORG/repgen-docs/tree/main/jira
```

## Contenido que sigue en otros repos

No copies aquí `repgen-backend/docs/reports/` ni `repgen-frontend/docs/` — enlázalos desde [references/LINKS.md](references/LINKS.md).
