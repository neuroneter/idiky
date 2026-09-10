#!/bin/sh
# Copia de la base de datos del sistema de gestion (T-37 · ADR-0012).
#
# Corre EN EL SERVIDOR, como `idiky`. Lo llama cada dia el temporizador
# idiky-gestion-respaldo.timer, que levantar.sh instala. A mano:
#
#   systemctl --user start idiky-gestion-respaldo.service
#
# Deja los ultimos 7 respaldos en $IDIKY_DATOS/respaldos/gestion/. OJO: estan en el mismo
# servidor, asi que protegen de un error (un borrado, una migracion mala), no de perder el
# servidor. Para eso hace falta sacarlos de aqui, y eso aun no existe.
set -eu

CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/entorno"
# shellcheck disable=SC1090
[ ! -f "$CONFIG" ] || . "$CONFIG"
DESTINO="${IDIKY_DATOS:-$HOME/datos}/respaldos/gestion"

mkdir -p "$DESTINO"
chmod 700 "$DESTINO"

nombre="$DESTINO/gestion-$(date -u +%Y-%m-%d_%H%M)"
# Sin pipefail en sh: primero el volcado a un archivo, para que un pg_dump fallido no deje
# un .gz que parece bueno.
podman exec idiky-gestion-postgres pg_dump -U gestion -d gestion --no-owner > "$nombre.sql.parcial"
gzip -c "$nombre.sql.parcial" > "$nombre.sql.gz.parcial"
rm -f "$nombre.sql.parcial"
mv "$nombre.sql.gz.parcial" "$nombre.sql.gz"

# El disco es compartido: se guardan los ultimos 7.
ls -1t "$DESTINO"/gestion-*.sql.gz | tail -n +8 | xargs -r rm -f

echo "Respaldo: $nombre.sql.gz ($(du -h "$nombre.sql.gz" | cut -f1))"
