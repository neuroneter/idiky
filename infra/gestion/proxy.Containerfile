# Imagen del nginx del pod del sistema de gestion (T-37 · ADR-0012).
# Contexto de construccion: la raiz del repositorio.
#
#   podman build -f infra/gestion/proxy.Containerfile -t idiky-gestion-proxy .
FROM docker.io/library/nginx:1.28-alpine
COPY infra/gestion/nginx.conf /etc/nginx/conf.d/default.conf
ARG REVISION=sin-revision
RUN echo "$REVISION" > /usr/share/nginx/html/revision.txt
