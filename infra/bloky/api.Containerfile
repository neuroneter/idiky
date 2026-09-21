# Imagen de la API de BLOKY para el entorno de desarrollo (T-75 · ADR-0011 · ADR-0008).
# Contexto de construccion: la raiz del repositorio.
#
#   podman build -f infra/bloky/api.Containerfile -t idiky-bloky-api .
#
# Dos etapas: la primera compila TypeScript con las dependencias de desarrollo; la segunda
# solo lleva las de produccion, que son cuatro y pesan poco.
FROM docker.io/library/node:22-alpine AS construccion
WORKDIR /app
COPY apps/bloky-api/package.json apps/bloky-api/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/bloky-api/ ./
RUN npm run build

FROM docker.io/library/node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY apps/bloky-api/package.json apps/bloky-api/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=construccion /app/dist/ ./dist/
# Las migraciones son .sql: tsc no las copia.
COPY apps/bloky-api/src/datos/migraciones/ ./dist/datos/migraciones/
COPY infra/bloky/arrancar.sh /usr/local/bin/idiky-arrancar
USER node
EXPOSE 3000
CMD ["sh", "/usr/local/bin/idiky-arrancar"]

ARG REVISION=sin-revision
LABEL org.opencontainers.image.revision=$REVISION
