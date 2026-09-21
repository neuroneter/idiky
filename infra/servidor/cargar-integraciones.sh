#!/bin/sh
# Sube al servidor las credenciales de integraciones (Twilio Verify; Google y Microsoft cuando
# existan), fuera del repositorio. T-35 · ADR-0011.
#
# Son de BLOKY, el sistema de las copropiedades. BOB (Strapi) no las usa: tiene su propio login.
#
# Corre en la maquina de quien tiene los valores:
#
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave>.pem infra/servidor/cargar-integraciones.sh
#
# Lee `.env.integraciones.local` (raiz del repositorio, ignorado por git), toma SOLO las
# variables conocidas y las deja en ~/.config/idiky/secretos/integraciones.env del servidor, con
# permisos 600. Reemplaza el archivo completo: lo que no este en el .local deja de estar alla.
#
# Los valores viajan por la entrada estandar de ssh: no quedan en la linea de comandos de
# ninguna de las dos maquinas y no se muestran. Del servidor solo se imprimen los nombres.
set -eu

: "${IDIKY_SERVIDOR:?Falta el destino, p. ej. IDIKY_SERVIDOR=idiky@203.0.113.10}"

cd "$(git rev-parse --show-toplevel)"
ORIGEN=.env.integraciones.local
[ -f "$ORIGEN" ] || { echo "No existe $ORIGEN: se copia de .env.integraciones.example y se llena." >&2; exit 1; }

# Solo estas, y solo con valor: el .local puede tener otras cosas, como un celular de prueba.
# Se quitan los comentarios al final de la linea, porque --env-file de podman no los quita.
PERMITIDAS='^(TWILIO_ACCOUNT_SID|TWILIO_AUTH_TOKEN|TWILIO_VERIFY_SERVICE_SID|TWILIO_API_KEY_SID|TWILIO_API_KEY_SECRET|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|MICROSOFT_CLIENT_ID|MICROSOFT_CLIENT_SECRET|MICROSOFT_TENANT_ID)=[^[:space:]#]'
lineas=$(grep -E "$PERMITIDAS" "$ORIGEN" | sed -E 's/[[:space:]]+#.*$//' || true)
[ -n "$lineas" ] || { echo "$ORIGEN no tiene valores que subir." >&2; exit 1; }

printf '%s\n' "$lineas" | ssh ${IDIKY_LLAVE:+-i "$IDIKY_LLAVE"} -o BatchMode=yes "$IDIKY_SERVIDOR" '
  set -eu
  umask 077
  d="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos"
  mkdir -p "$d"
  chmod 700 "$d"
  cat > "$d/integraciones.env.nuevo"
  chmod 600 "$d/integraciones.env.nuevo"
  mv "$d/integraciones.env.nuevo" "$d/integraciones.env"
  echo "En el servidor: $d/integraciones.env"
  ls -l "$d/integraciones.env"
  echo "Variables cargadas:"
  cut -d= -f1 "$d/integraciones.env" | sed "s/^/  /"
'
