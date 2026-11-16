#!/bin/sh
# Prueba OTP de ALICE por WhatsApp (T-132). Uso en el servidor:
#   CELULAR=3001234567 sh infra/evolution/probar-otp-alice.sh
# El celular debe existir en el directorio con acceso a ALICE.
set -e
CELULAR="${CELULAR:?Pon CELULAR=3xxxxxxxxx}"
echo "{\"celular\":\"$CELULAR\"}" > /tmp/otp.json
echo "--- enviar-codigo ---"
curl -sS -X POST http://127.0.0.1:8083/api/app/acceso/enviar-codigo \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data-binary @/tmp/otp.json
echo
echo "Si respondio 200, revisa WhatsApp y valida con:"
echo "  echo '{\"celular\":\"$CELULAR\",\"codigo\":XXXXXX}' > /tmp/otp2.json"
echo "  curl -sS -X POST http://127.0.0.1:8083/api/app/acceso/verificar-codigo -H 'Content-Type: application/json; charset=utf-8' --data-binary @/tmp/otp2.json"
