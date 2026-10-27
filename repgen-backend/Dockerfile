# Imagen del backend en el monorepo pnpm.
# El contexto de build es la RAIZ del monorepo (no esta carpeta):
#   docker build -f repgen-backend/Dockerfile -t repgen-backend .

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY repgen-backend/package.json repgen-backend/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile --filter generador-reportes-backend...
COPY packages/shared-types packages/shared-types
COPY repgen-backend repgen-backend
RUN pnpm --filter generador-reportes-backend run build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY repgen-backend/package.json repgen-backend/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile --prod --filter generador-reportes-backend...

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=prod-deps /repo ./
COPY --from=build /repo/repgen-backend/dist ./repgen-backend/dist
EXPOSE 3000
CMD ["node", "repgen-backend/dist/src/main.js"]
