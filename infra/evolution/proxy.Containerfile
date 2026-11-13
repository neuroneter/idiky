# Imagen del nginx del pod de Evolution API (T-131 · ADR-0033).
# Contexto de construccion: la raiz del repositorio.
#
#   podman build -f infra/evolution/proxy.Containerfile -t idiky-evolution-proxy .
FROM docker.io/library/nginx:1.28-alpine
COPY infra/evolution/nginx.conf /etc/nginx/conf.d/default.conf
ARG REVISION=sin-revision
RUN echo "$REVISION" > /usr/share/nginx/html/revision.txt
