# Imagen del nginx del pod de BLOKY: sirve la app compilada y reenvia /api a la API
# (T-75 · ADR-0011 · ADR-0013). Contexto de construccion: la raiz del repositorio.
#
#   podman build -f infra/bloky/app.Containerfile -t idiky-bloky-app .
FROM docker.io/library/node:22-alpine AS construccion
WORKDIR /app
COPY apps/bloky/package.json apps/bloky/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/bloky/ ./
RUN npm run build

FROM docker.io/library/nginx:1.28-alpine
COPY infra/bloky/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /app/dist/ /usr/share/nginx/html/
ARG REVISION=sin-revision
RUN echo "$REVISION" > /usr/share/nginx/html/revision.txt
