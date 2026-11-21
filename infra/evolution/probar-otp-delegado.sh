#!/bin/sh
# Humo: Delegado Justo (3053996759) debe recibir codigo ALICE (RN-327 ampliada).
set -e
printf '%s' '{"celular":"3053996759"}' > /tmp/otp-delegado.json
curl -sS -w '\nHTTP:%{http_code}\n' -X POST http://127.0.0.1:8083/api/app/acceso/enviar-codigo \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data-binary @/tmp/otp-delegado.json
