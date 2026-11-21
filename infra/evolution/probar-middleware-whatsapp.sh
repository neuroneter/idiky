#!/bin/sh
# Prueba local del endpoint T-132 (en el servidor).
set -e
# T-139: la ruta exige el token de administracion (se lee del secreto, nunca se imprime).
TOKEN=$(grep -E '^BLOKY_ADMIN_TOKEN=' "$HOME/.config/idiky/secretos/bloky-api.env" | cut -d= -f2-)
echo '{"celular":"3110000000","texto":"prueba"}' > /tmp/wa.json
echo '{"celular":"123"}' > /tmp/wa2.json
echo '--- desconocido (espera 404) ---'
curl -sS -X POST http://127.0.0.1:8083/api/app/whatsapp/enviar \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data-binary @/tmp/wa.json
echo
echo '--- invalido (espera 422) ---'
curl -sS -X POST http://127.0.0.1:8083/api/app/whatsapp/enviar \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data-binary @/tmp/wa2.json
echo
echo '--- salud ---'
curl -sS http://127.0.0.1:8083/api/salud
echo
