#!/bin/sh
# Crea los secretos de BLOKY (T-75 · ADR-0008).
#
# Corre EN EL SERVIDOR, como `idiky`, UNA vez:
#
#   ssh idiky@<ip> 'sh -s' < infra/bloky/secretos.sh
#
# Deja dos archivos con permisos 600 en ~/.config/idiky/secretos/, que levantar.sh pasa a
# cada contenedor con --env-file. Si ya existen NO los toca.
#
# Lo que este script NO puede inventar y hay que completar a mano en bloky-api.env:
#   BOB_API_TOKEN     token de SOLO LECTURA creado en el panel de BOB
#                     (Configuracion > API Tokens > Read-only).
#   TWILIO_*          de .env.integraciones.local (infra/servidor/cargar-integraciones.sh
#                     ya las deja en integraciones.env; aqui se copian).
#   GOOGLE_* / MICROSOFT_* / YAHOO_*   cuando existan las aplicaciones registradas.
#   BLOKY_URL_PUBLICA la URL con la que la gente llega: http://<ip>:8083 mientras no haya
#                     dominio. Google y Microsoft exigen HTTPS para el retorno: hasta que
#                     BLOKY tenga dominio con certificado, esos dos canales solo funcionan
#                     en local (http://localhost:5173).
set -eu

[ "$(id -u)" -ne 0 ] || { echo "Se corre como idiky, no como root." >&2; exit 1; }

DIR="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos"
POSTGRES="$DIR/bloky-postgres.env"
API="$DIR/bloky-api.env"
INTEGRACIONES="$DIR/integraciones.env"

if [ -f "$POSTGRES" ] || [ -f "$API" ]; then
  echo "Los secretos de BLOKY ya existen en $DIR: no se tocan."
  exit 0
fi

azar() {
  openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-40
}

umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"
clave_base=$(azar)

cat > "$POSTGRES" <<EOF2
POSTGRES_DB=bloky
POSTGRES_USER=bloky
POSTGRES_PASSWORD=$clave_base
EOF2

{
  cat <<EOF2
BLOKY_ENTORNO=produccion
HOST=127.0.0.1
PORT=3000
BLOKY_DB_URL=postgres://bloky:$clave_base@127.0.0.1:5432/bloky
BLOKY_JWT_SECRET=$(azar)
BLOKY_HORAS_SESION=12
BLOKY_URL_PUBLICA=http://CAMBIAR-POR-LA-IP-O-DOMINIO:8083
# BOB corre en otro pod del mismo servidor y publica el 8082 en el host. Desde dentro de un
# pod con slirp4netns, 10.0.2.2 solo responde con allow_host_loopback=true (probado 2026-09-21):
# por eso aqui va la IP privada de la VM (hostname -I), que llega con cualquier red.
BOB_URL=http://10.0.2.2:8082
BOB_API_TOKEN=CAMBIAR-POR-EL-TOKEN-DE-SOLO-LECTURA-DE-BOB
EOF2
  if [ -f "$INTEGRACIONES" ]; then
    echo "# --- copiado de integraciones.env ---"
    grep -E '^(TWILIO_|GOOGLE_|MICROSOFT_)' "$INTEGRACIONES" || true
  else
    echo "# integraciones.env no existia: correr infra/servidor/cargar-integraciones.sh y pegar aqui TWILIO_*."
  fi
} > "$API"

chmod 600 "$POSTGRES" "$API"
echo "Secretos creados en $DIR (no se muestran). FALTA completar a mano en $API:"
echo "  BLOKY_URL_PUBLICA, BOB_API_TOKEN y, si no venian de integraciones.env, TWILIO_*."
ls -l "$DIR"
