#!/bin/sh
# Crea el archivo de secretos del tunel de Cloudflare (T-76 · ADR-0014).
#
# Corre EN EL SERVIDOR, como `idiky`, UNA vez. El token viaja por la entrada estandar, no por
# la linea de comandos (quedaria en el historial y en `ps`). Como la entrada estandar la ocupa
# el token, el script se copia primero (no vale `sh -s` < script, se pisan):
#
#   scp -i ~/.ssh/<llave> infra/tunel/secretos.sh idiky@<ip>:/tmp/
#   printf '%s\n' 'EL-TOKEN' | ssh -i ~/.ssh/<llave> idiky@<ip> 'sh /tmp/secretos.sh; rm /tmp/secretos.sh'
#
# Deja ~/.config/idiky/secretos/tunel.env con permisos 600, que levantar.sh pasa al contenedor
# con --env-file. Si ya existe NO lo toca: para cambiar el token, borrarlo primero.
#
# De donde sale el token: panel de Cloudflare > Zero Trust > Networks > Tunnels > el tunel
# `idiky-dev` > Configure > el comando de instalacion trae `--token eyJ...`; se copia solo el
# valor. Es un secreto: quien lo tenga puede publicar lo que quiera bajo ese nombre.
set -eu

[ "$(id -u)" -ne 0 ] || { echo "Se corre como idiky, no como root." >&2; exit 1; }

DIR="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos"
ARCHIVO="$DIR/tunel.env"

if [ -f "$ARCHIVO" ]; then
  echo "El secreto del tunel ya existe en $ARCHIVO: no se toca. Para cambiarlo, borrarlo y volver a correr." >&2
  exit 0
fi

IFS= read -r token || token=""
token=$(printf '%s' "$token" | tr -d '[:space:]')
case "$token" in
  eyJ*) ;;
  *) echo "El token no parece de Cloudflare (empieza por eyJ). No se creo nada." >&2; exit 1 ;;
esac

umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"
printf 'TUNNEL_TOKEN=%s\n' "$token" > "$ARCHIVO"
chmod 600 "$ARCHIVO"
echo "Listo: $ARCHIVO (600). Ahora: infra/desplegar.sh origin/main tunel"
