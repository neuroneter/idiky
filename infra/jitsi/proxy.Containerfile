# nginx del pod de Jitsi: el unico contenedor del pod con puerto hacia afuera.
# T-78 · ADR-0011 · ADR-0016. Contexto de construccion: la raiz del repositorio.
#
#   podman build -f infra/jitsi/proxy.Containerfile -t idiky-jitsi-proxy .
#
# Existe por el contrato de infra/nuevo-servicio.md: Jitsi no responde /salud ni /revision.txt,
# y sus imagenes no se modifican. Este nginx los responde y reenvia el resto a jitsi/web.
FROM docker.io/library/nginx:1.28-alpine
COPY infra/jitsi/nginx.conf /etc/nginx/conf.d/default.conf

ARG REVISION=sin-revision
RUN mkdir -p /usr/share/nginx/html && echo "$REVISION" > /usr/share/nginx/html/revision.txt
