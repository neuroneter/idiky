#!/bin/sh
# Prepara un servidor Ubuntu 22.04 para el entorno de desarrollo de Idiky (T-35 · ADR-0011).
#
# Se corre UNA vez, con un usuario que tenga sudo. Es idempotente: correrlo de nuevo no
# cambia nada que ya este hecho.
#
#   ssh admin@servidor 'sudo sh -s -- "ssh-ed25519 AAAA... alguien"' < infra/servidor/preparar-servidor.sh
#
# Lo que hace, y nada mas:
#   1. Instala Podman y lo minimo para correrlo sin root, sin paquetes recomendados.
#   2. Crea el usuario `idiky`, con sus rangos de UID/GID subordinados.
#   3. Le activa linger, para que sus contenedores sigan vivos sin sesion abierta.
#   4. Si recibe una llave publica, la autoriza para entrar como `idiky`.
#
# Lo que NO hace: no toca nginx, ni el firewall, ni iptables, ni ningun servicio que ya
# corra en el servidor. Los contenedores de Idiky corren con los permisos de `idiky`.
set -eu

USUARIO=idiky
LLAVE="${1:-}"

[ "$(id -u)" -eq 0 ] || { echo "Se corre con sudo." >&2; exit 1; }

# En Ubuntu 22.04, needrestart reinicia servicios por su cuenta cuando apt corre sin
# interaccion. En un servidor compartido eso es justo lo que no puede pasar.
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=l NEEDRESTART_SUSPEND=1
PAQUETES="podman uidmap slirp4netns fuse-overlayfs"
apt-get install -y --no-install-recommends $PAQUETES \
  || { apt-get update && apt-get install -y --no-install-recommends $PAQUETES; }

# El paquete de Ubuntu habilita solo la API de podman como root, el auto-update y el
# arranque de contenedores root, y la API para todos los usuarios. Idiky no usa ninguno:
# corre sin root y con unidades propias. Se apagan para que el servidor quede como estaba.
systemctl disable --now podman.socket podman.service podman-auto-update.timer \
  podman-auto-update.service podman-restart.service
systemctl --global disable podman.socket podman.service

if ! id "$USUARIO" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$USUARIO"
fi

# useradd suele asignar los rangos solo; si no lo hizo, se toma el siguiente libre.
for archivo in /etc/subuid /etc/subgid; do
  if ! grep -q "^$USUARIO:" "$archivo"; then
    inicio=$(awk -F: 'BEGIN { m = 100000 } { if ($2 + $3 > m) m = $2 + $3 } END { print m }' "$archivo")
    echo "$USUARIO:$inicio:65536" >> "$archivo"
  fi
done

loginctl enable-linger "$USUARIO"

# Todo lo del usuario (contenedores, construcciones, la red de usuario que recibe el trafico)
# queda con techo: dos nucleos de CPU y 5 GB. Si el entorno se satura -una construccion
# pesada, trafico desde internet- choca contra su techo y no contra lo que ya corre en el
# servidor. Subio de 1 nucleo y 3 GB con el sistema de gestion (ADR-0012): Strapi pide 2 GB
# minimo. Sigue siendo seguro: la unidad de LangFlow lo limita a 0,8 nucleos y 4 GB, y el
# servidor tiene 4 nucleos y 15 GB.
systemctl set-property "user-$(id -u "$USUARIO").slice" CPUQuota=200% MemoryMax=5G

if [ -n "$LLAVE" ]; then
  CASA=$(getent passwd "$USUARIO" | cut -d: -f6)
  install -d -m 700 -o "$USUARIO" -g "$USUARIO" "$CASA/.ssh"
  touch "$CASA/.ssh/authorized_keys"
  grep -qxF "$LLAVE" "$CASA/.ssh/authorized_keys" || echo "$LLAVE" >> "$CASA/.ssh/authorized_keys"
  chown "$USUARIO:$USUARIO" "$CASA/.ssh/authorized_keys"
  chmod 600 "$CASA/.ssh/authorized_keys"
fi

echo "==> Listo"
podman --version
id "$USUARIO"
grep "^$USUARIO:" /etc/subuid /etc/subgid
loginctl show-user "$USUARIO" -p Linger
