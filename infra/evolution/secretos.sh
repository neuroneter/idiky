#!/bin/sh
# Crea los secretos de Evolution API (T-131 · ADR-0033).
#
# Corre EN EL SERVIDOR, como `idiky`, UNA vez:
#
#   ssh idiky@<ip> 'sh -s' < infra/evolution/secretos.sh
#
# Deja ~/.config/idiky/secretos/evolution.env y evolution-postgres.env (600).
# Si ya existen NO los toca.
#
# Completar a mano despues:
#   SERVER_URL  la URL publica con la que llegan webhooks y el manager
#               (http://<ip>:8086 o https://evolution-dev.idiky.com cuando exista el tunel).
# Mientras diga CAMBIAR-POR..., levantar.sh no despliega evolution.
set -eu

[ "$(id -u)" -ne 0 ] || { echo "Se corre como idiky, no como root." >&2; exit 1; }

DIR="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos"
API="$DIR/evolution.env"
PG="$DIR/evolution-postgres.env"

umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"

azar() {
  openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-40
}

if [ ! -f "$PG" ]; then
  PG_PASS=$(azar)
  cat > "$PG" <<EOF
POSTGRES_DB=evolution
POSTGRES_USER=evolution
POSTGRES_PASSWORD=$PG_PASS
EOF
  chmod 600 "$PG"
  echo "Creados secretos de PostgreSQL en $PG"
else
  echo "Los secretos de PostgreSQL ya existen en $PG: no se tocan."
  # shellcheck disable=SC1090
  . "$PG"
  PG_PASS=$POSTGRES_PASSWORD
fi

if [ ! -f "$API" ]; then
  API_KEY=$(azar)
  cat > "$API" <<EOF
AUTHENTICATION_API_KEY=$API_KEY
SERVER_URL=http://CAMBIAR-POR-LA-IP-O-DOMINIO:8086
DATABASE_CONNECTION_URI=postgresql://evolution:${PG_PASS}@127.0.0.1:5432/evolution
CACHE_REDIS_URI=redis://127.0.0.1:6379/1
EOF
  chmod 600 "$API"
  echo "Creados secretos de Evolution en $API (no se muestran)."
else
  echo "Los secretos de Evolution ya existen en $API: no se tocan."
fi

echo "FALTA completar a mano SERVER_URL en $API."
echo "Mientras diga CAMBIAR-POR..., levantar.sh no despliega evolution."
ls -l "$API" "$PG"
