# Deployment guide — Vercel (frontend) & DigitalOcean (backend)

This document explains the secrets and steps required to use the GitHub workflows added to this repo:

- `.github/workflows/ci.yml` — CI + optional DOCR validation
- `.github/workflows/deploy-digitalocean.yml` — build, push backend image, deploy to DigitalOcean App Platform
- `.github/workflows/deploy-vercel.yml` — build & deploy frontend to Vercel

Follow these steps to configure GitHub, DigitalOcean and Vercel.

---

## 1) GitHub repository secrets (minimum)

Add these in GitHub → Settings → Secrets → Actions for the repository.

- `VERCEL_TOKEN` — token from Vercel (required for frontend deploy).
- `DO_API_TOKEN` — DigitalOcean token with `read`/`write` on Apps and Registry (required).
- `DOCR_REGISTRY_NAME` — (optional) your DigitalOcean Container Registry name (e.g. `myregistry`). If empty, workflows will push to GHCR by default.
- `DO_REGISTRY_USERNAME` / `DO_REGISTRY_PASSWORD` — (optional) registry credentials if you use a private registry other than DOCR.
- `DO_APP_ID` — (optional) numeric/alphanumeric App ID in DigitalOcean to update an existing App. If not set the workflow will create a new App.

Notes:
- `GITHUB_TOKEN` (Actions built-in) is used to login to GHCR; you typically do not need to add it manually.
- If you plan to use GHCR and your DO account cannot access GHCR private images, prefer pushing images to DOCR and set `DOCR_REGISTRY_NAME`.

---

## 2) DigitalOcean setup (recommended flow: DOCR + App Platform)

1. Create a DigitalOcean Container Registry (DOCR) (optional but recommended):

   - UI: DigitalOcean → Container Registry → Create Registry (choose short `name`)
   - Or use doctl:

     ```bash
     doctl registry create myregistry
     ```

2. Create a Personal Access Token in DigitalOcean (Settings → API → Tokens) and add it to GitHub as `DO_API_TOKEN`.

3. If using DOCR, add its name to GitHub as `DOCR_REGISTRY_NAME` (value: `myregistry`). The Actions workflow will `doctl registry login` and push images into `registry.digitalocean.com/myregistry`.

4. (Optional) If you want the workflow to update an existing App instead of creating a new one, get the App ID and add it as `DO_APP_ID`:

   ```bash
   doctl apps list
   # note the ID column
   ```

5. The DO deploy workflow generates a DO App spec (`do-app-spec.yaml`) that references the image either from DOCR or GHCR. If you need specific env vars (database credentials, JWT keys, etc.) set them in the spec or add them to the App in the DO UI. Example envs are: `NODE_ENV`, `PORT`, `FRONTEND_URL`, `JWT_SECRET`, etc.

6. If you prefer to configure the App fully in the DO UI, create the App manually and set the `image` to the DOCR path `registry.digitalocean.com/myregistry/repgen-backend:latest`. Then populate env vars in the App settings.

---

## 3) Vercel setup (frontend)

1. Create a Project in Vercel (link the GitHub repo) or use the Vercel UI to create a project.

2. Create a Vercel token (Account → Tokens → Create Token) and add it to GitHub as `VERCEL_TOKEN`.

3. (Optional) Add `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` to repository secrets to point the CLI to the exact project if repo is used across orgs.

4. The workflow runs `npx vercel repgen-frontend --prod --token $VERCEL_TOKEN --confirm`. If your project is linked correctly on Vercel, this will deploy the build directory. If not, you can link the project locally and push the resulting `project settings` to Vercel.

5. Ensure the production env var `VITE_API_URL` (or whatever you use in frontend) is set in Vercel to point at your backend public URL.

---

## 4) GHCR notes (if you do not use DOCR)

- We push images to GHCR at `ghcr.io/<owner>/repgen-backend:latest` by default. If you use GHCR and keep images private, ensure DigitalOcean App Platform can access GHCR images (you may need to supply credentials in the DO App or use DOCR instead).

---

## 5) Triggering and testing

1. Push to `main` or create a tag `v1.0.0` — this triggers the CI and deploy workflows.

2. Watch Actions → the workflow run logs. Key checks:
   - `Validate required secrets` step (fails fast if a required secret is missing).
   - `Build and push` steps for images (GHCR and DOCR pushes).
   - `Generate DO App spec` output (the spec is printed to logs for debugging).

3. On DigitalOcean, check App → Deployments for the created/updated App and its logs.

---

## 6) Troubleshooting tips

- `ERROR: Missing required secrets: DO_API_TOKEN` — add `DO_API_TOKEN` to GitHub Secrets.
- `ERROR: DOCR_REGISTRY_NAME must contain only lowercase...` — fix secret value to match pattern (2–63 chars, lowercase, numbers, hyphen; no leading/trailing hyphen).
- If App creation fails, download the generated `do-app-spec.yaml` from logs and validate it with `doctl apps spec validate --spec-file do-app-spec.yaml` locally (after adding your `DO_API_TOKEN`).

---

If you want, I can also:

- Add a short `README.md` section linking to this doc and listing the exact secrets to add.
- Add a small GitHub Action step to fail early if any commonly-required env var names for production (like `JWT_SECRET`, `FM_SERVER`) are not defined in DO App UI (this is possible but requires fetching the App and comparing keys).

Tell me which extra option you prefer and I will add it.
