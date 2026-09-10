#!/bin/sh
# Crea los secretos del sistema de gestion (T-37 · ADR-0012).
#
# Corre EN EL SERVIDOR, como `idiky`, UNA vez:
#
#   ssh idiky@<ip> 'sh -s' < infra/gestion/secretos.sh
#
# Deja dos archivos con permisos 600 en ~/.config/idiky/secretos/, que levantar.sh pasa a
# cada contenedor con --env-file. Nunca van al repositorio ni se muestran.
#
# Si ya existen NO los toca: cambiar la contrasena de la base aqui no la cambia dentro de
# PostgreSQL, y cambiar APP_KEYS o ENCRYPTION_KEY invalida sesiones y tokens ya emitidos.
set -eu

[ "$(id -u)" -ne 0 ] || { echo "Se corre como idiky, no como root." >&2; exit 1; }

DIR="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos"
POSTGRES="$DIR/gestion-postgres.env"
STRAPI="$DIR/gestion-strapi.env"

if [ -f "$POSTGRES" ] || [ -f "$STRAPI" ]; then
  echo "Los secretos ya existen en $DIR: no se tocan."
  exit 0
fi

# Sin comillas ni caracteres raros: --env-file de podman no interpreta comillas.
azar() {
  openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-40
}

umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"
clave_base=$(azar)

cat > "$POSTGRES" <<EOF
POSTGRES_DB=gestion
POSTGRES_USER=gestion
POSTGRES_PASSWORD=$clave_base
EOF

cat > "$STRAPI" <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=1337
IS_PROXIED=true
STRAPI_TELEMETRY_DISABLED=true
FLAG_NPS=false
FLAG_PROMOTE_EE=false
APP_KEYS=$(azar),$(azar),$(azar),$(azar)
API_TOKEN_SALT=$(azar)
ADMIN_JWT_SECRET=$(azar)
TRANSFER_TOKEN_SALT=$(azar)
JWT_SECRET=$(azar)
ENCRYPTION_KEY=$(azar)
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=gestion
DATABASE_USERNAME=gestion
DATABASE_PASSWORD=$clave_base
DATABASE_SSL=false
EOF

chmod 600 "$POSTGRES" "$STRAPI"
echo "Secretos creados en $DIR (no se muestran):"
ls -l "$DIR"
