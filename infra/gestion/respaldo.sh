#!/bin/sh
# Copia de la base de datos del sistema de gestion (T-37 · ADR-0012).
#
# Corre EN EL SERVIDOR, como `idiky`. Dos usos:
#
#   systemctl --user start idiky-gestion-respaldo.service   # el diario (lo dispara el temporizador)
#   sh infra/gestion/respaldo.sh predespliegue              # antes de recrear el pod (levantar.sh)
#
# Deja los respaldos en $IDIKY_DATOS/respaldos/gestion/: se guardan los ultimos 7 diarios y los
# ultimos 5 de cada otra etiqueta, por separado, para que muchos despliegues no se lleven los
# diarios. OJO: estan en el mismo servidor, asi que protegen de un error (un borrado, una
# migracion mala), no de perder el servidor. Para eso hace falta sacarlos de aqui.
set -eu

CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/entorno"
# shellcheck disable=SC1090
[ ! -f "$CONFIG" ] || . "$CONFIG"
DESTINO="${IDIKY_DATOS:-$HOME/datos}/respaldos/gestion"
ETIQUETA=$(printf %s "${1:-}" | tr -cd 'a-z0-9-')

mkdir -p "$DESTINO"
chmod 700 "$DESTINO"

if [ -n "$ETIQUETA" ]; then
  prefijo="gestion-$ETIQUETA-"
  conservar=5
else
  prefijo="gestion-"
  conservar=7
fi
nombre="$DESTINO/$prefijo$(date -u +%Y-%m-%d_%H%M%S)"

# Sin pipefail en sh: primero el volcado a un archivo, para que un pg_dump fallido no deje
# un .gz que parece bueno.
podman exec idiky-gestion-postgres pg_dump -U gestion -d gestion --no-owner > "$nombre.sql.parcial"
gzip -c "$nombre.sql.parcial" > "$nombre.sql.gz.parcial"
rm -f "$nombre.sql.parcial"
mv "$nombre.sql.gz.parcial" "$nombre.sql.gz"

# El disco es compartido: se conservan los ultimos de cada tipo. Los diarios empiezan por el ano.
if [ -n "$ETIQUETA" ]; then
  ls -1t "$DESTINO"/gestion-"$ETIQUETA"-*.sql.gz | tail -n +$((conservar + 1)) | xargs -r rm -f
else
  ls -1t "$DESTINO"/gestion-2*.sql.gz | tail -n +$((conservar + 1)) | xargs -r rm -f
fi

echo "Respaldo: $nombre.sql.gz ($(du -h "$nombre.sql.gz" | cut -f1))"
