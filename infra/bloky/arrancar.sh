#!/bin/sh
# Arranque de la API de BLOKY dentro del pod (T-75 · ADR-0008).
# Igual que en BOB: espera a que PostgreSQL acepte conexiones antes de arrancar, para que
# systemd no reinicie el contenedor en bucle mientras la base inicializa.
set -eu

intentos=0
until node -e "require('net').connect(5432, '127.0.0.1').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"; do
  intentos=$((intentos + 1))
  if [ "$intentos" -ge 90 ]; then
    echo "PostgreSQL no acepto conexiones en 90 s" >&2
    exit 1
  fi
  sleep 1
done

exec node dist/servidor.js
