#!/bin/sh
# Crea los secretos de Jitsi (T-78 · ADR-0016).
#
# Corre EN EL SERVIDOR, como `idiky`, UNA vez:
#
#   ssh idiky@<ip> 'sh -s' < infra/jitsi/secretos.sh
#
# Deja ~/.config/idiky/secretos/jitsi.env con permisos 600, que levantar.sh pasa a los cuatro
# contenedores del pod con --env-file. Si ya existe NO lo toca.
#
# Lo que este script NO puede inventar y hay que completar a mano:
#   PUBLIC_URL         la direccion con la que la gente llega a Jitsi. Es la que Jitsi escribe
#                      en su config.js. Mientras no haya nombre: http://<ip>:8085
#   JVB_ADVERTISE_IPS  la IP PUBLICA del servidor. El videobridge la anuncia a cada navegador
#                      como el sitio al que mandar el video. Sin esto no hay video: el
#                      contenedor solo se conoce por su IP privada de podman.
#
# Las dos claves que si genera son las de los servicios internos de Jitsi entre ellos (jicofo y
# el videobridge contra prosody). No son claves de personas: las cuentas de quien abre salas se
# crean aparte, con prosodyctl (ver infra/jitsi/README.md).
set -eu

[ "$(id -u)" -ne 0 ] || { echo "Se corre como idiky, no como root." >&2; exit 1; }

DIR="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos"
ARCHIVO="$DIR/jitsi.env"

if [ -f "$ARCHIVO" ]; then
  echo "Los secretos de Jitsi ya existen en $ARCHIVO: no se tocan."
  exit 0
fi

azar() {
  openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-40
}

umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"

cat > "$ARCHIVO" <<EOF2
JICOFO_AUTH_PASSWORD=$(azar)
JVB_AUTH_PASSWORD=$(azar)
PUBLIC_URL=http://CAMBIAR-POR-LA-IP-O-DOMINIO:8085
JVB_ADVERTISE_IPS=CAMBIAR-POR-LA-IP-PUBLICA-DEL-SERVIDOR
EOF2

chmod 600 "$ARCHIVO"
echo "Secretos creados en $ARCHIVO (no se muestran). FALTA completar a mano:"
echo "  PUBLIC_URL y JVB_ADVERTISE_IPS. Mientras digan CAMBIAR-POR..., levantar.sh no despliega jitsi."
ls -l "$ARCHIVO"
