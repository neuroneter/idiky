#!/bin/sh
# Pone (o cambia) la clave de acceso al entorno de desarrollo (T-35 · ADR-0011).
#
# Corre EN EL SERVIDOR, como `idiky`. Genera una clave al azar, la muestra UNA vez y deja en
# ~/.config/idiky/nginx/ lo que levantar.sh monta en los dos contenedores.
#
#   sh infra/servidor/clave-acceso.sh                       # usuario "equipo"
#   IDIKY_USUARIO=otro sh infra/servidor/clave-acceso.sh
#
# La primera vez hay que volver a desplegar para que los contenedores monten la carpeta.
# Despues, cambiar la clave toma efecto de inmediato: nginx lee el archivo en cada peticion.
# Para quitar la clave: borrar ~/.config/idiky/nginx/ y volver a desplegar.
#
# No es autenticacion de la app (eso sigue fuera del alcance de la fase 1): es la puerta del
# entorno, para que no lo vea cualquiera que encuentre la IP.
set -eu

[ "$(id -u)" -ne 0 ] || { echo "Se corre como idiky, no como root." >&2; exit 1; }

USUARIO="${IDIKY_USUARIO:-equipo}"
DIR="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/nginx"
CLAVE=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-16)

mkdir -p "$DIR"
chmod 755 "$DIR"
# 644 porque la lee el usuario nginx dentro del contenedor. Fuera, /home/idiky no deja pasar
# a otros usuarios del servidor.
printf '%s:%s\n' "$USUARIO" "$(printf '%s' "$CLAVE" | openssl passwd -apr1 -stdin)" > "$DIR/htpasswd"
chmod 644 "$DIR/htpasswd"
cat > "$DIR/acceso.conf" <<'EOF'
auth_basic "Idiky - entorno de desarrollo";
auth_basic_user_file /etc/nginx/idiky/htpasswd;
EOF
chmod 644 "$DIR/acceso.conf"

echo "Usuario: $USUARIO"
echo "Clave:   $CLAVE"
echo "No se guarda en claro en ningun sitio: anotala ahora."
