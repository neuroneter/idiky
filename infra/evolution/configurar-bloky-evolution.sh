#!/bin/sh
# T-132 — Copia AUTHENTICATION_API_KEY de evolution.env a bloky-api.env (EVOLUTION_*).
# Uso (desde la máquina con la llave): ssh idiky@<ip> 'sh -s' < infra/evolution/configurar-bloky-evolution.sh
# No imprime la key.
set -e
API="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos/bloky-api.env"
EVO="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos/evolution.env"
test -f "$API"
test -f "$EVO"
KEY=$(grep -E '^AUTHENTICATION_API_KEY=' "$EVO" | head -1 | cut -d= -f2-)
test -n "$KEY"
cp -p "$API" "$API.antes-evolution-t132"
grep -v -E '^EVOLUTION_(URL|API_KEY|INSTANCE)=' "$API" | grep -v '^# ADR-0033 / T-132' > "$API.tmp" || true
{
  cat "$API.tmp"
  echo '# ADR-0033 / T-132 — WhatsApp oficial Dev: Idiky_whatsapp (key desde evolution.env)'
  echo 'EVOLUTION_URL=http://10.0.2.2:8086'
  echo "EVOLUTION_API_KEY=$KEY"
  echo 'EVOLUTION_INSTANCE=Idiky_whatsapp'
} > "$API"
chmod 600 "$API"
rm -f "$API.tmp"
grep -E '^EVOLUTION_(URL|INSTANCE)=' "$API"
grep -c '^EVOLUTION_API_KEY=.' "$API"
echo secretos-ok
