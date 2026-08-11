# FALLBACK sin uso actual: el deploy real del frontend es Vercel.
# OJO: este Dockerfile quedo escrito para el layout pre-monorepo (contexto en
# esta carpeta, con lockfile propio). Si algun dia se usa, hay que reescribirlo
# a contexto raiz como repgen-backend/Dockerfile (lockfile unico del workspace
# y dependencia @repgen/shared-types), y anadirle el rewrite /api que hoy hace
# vercel.json, porque nginx.conf no lo aplica.
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]