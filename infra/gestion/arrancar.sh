#!/bin/sh
# Arranque de Strapi dentro del pod del sistema de gestion (T-37 · ADR-0012).
#
# PostgreSQL arranca en el mismo pod y, la primera vez, tarda en inicializar su carpeta de
# datos. Si Strapi arranca antes, falla al conectar, systemd lo reinicia en bucle y termina
# rindiendose. Por eso se espera a que PostgreSQL acepte conexiones TCP: durante la
# inicializacion la imagen oficial solo escucha por socket, asi que el puerto abierto
# significa que ya esta lista.
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

exec ./node_modules/.bin/strapi start
