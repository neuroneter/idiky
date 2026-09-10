#!/bin/sh
# Comprueba que el otro servicio del servidor (LangFlow, detras de su propio nginx) sigue
# igual despues de un cambio de Idiky. T-35 · ADR-0011.
#
# Corre EN EL SERVIDOR, como `idiky`, sin sudo. Desde tu maquina:
#
#   ssh idiky@<ip> 'sh -s -- --base' < infra/servidor/verificar-vecino.sh   # ANTES del cambio
#   ssh idiky@<ip> 'sh -s'           < infra/servidor/verificar-vecino.sh   # DESPUES del cambio
#
# Con --base guarda una foto en ~/.config/idiky/vecino-base.txt. Sin argumentos toma otra y
# la compara: sale con 0 si todo sigue igual y con 1 si algo cambio.
#
# Solo mira lo que cualquier usuario puede ver: estado, PID y reinicios de sus servicios,
# puertos en escucha y el codigo HTTP de las rutas que usan sus consumidores. No ejecuta
# flujos de LangFlow: tendrian efectos.
#
# Despues de un reinicio del servidor el MainPID cambia a proposito; lo que importa ahi es que
# los servicios esten activos y las rutas respondan lo mismo.
set -eu

BASE="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/vecino-base.txt"

codigo() {
  # shellcheck disable=SC2086
  printf '%-32s %s\n' "$1" "$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 $2)"
}

foto() {
  systemctl show langflow.service nginx.service -p Id -p ActiveState -p MainPID -p NRestarts
  # Los puertos del vecino, no los de Idiky: esos cambian a proposito.
  ss -tlnH | awk '{print $4}' | grep -E ':(22|80|443|8443|7860)$' | sort -u
  codigo "7860 /health"             "http://127.0.0.1:7860/health"
  codigo "7860 /api/v1/version"     "http://127.0.0.1:7860/api/v1/version"
  codigo "80 / (redirige a https)"  "http://127.0.0.1/"
  codigo "443 / (clave de nginx)"   "https://127.0.0.1/"
  codigo "443 /api/v1/version"      "https://127.0.0.1/api/v1/version"
  codigo "443 OPTIONS /api/v1/run"  "-X OPTIONS https://127.0.0.1/api/v1/run/verificacion"
  codigo "443 /ws"                  "https://127.0.0.1/ws"
  codigo "8443 / (chat)"            "https://127.0.0.1:8443/"
  codigo "8443 /api/v1/version"     "https://127.0.0.1:8443/api/v1/version"
}

case "${1:-}" in
  --base)
    mkdir -p "$(dirname "$BASE")"
    foto > "$BASE"
    echo "Foto base guardada en $BASE:"
    cat "$BASE"
    ;;
  "")
    [ -f "$BASE" ] || { echo "No hay foto base. Corre primero con --base, ANTES del cambio." >&2; exit 2; }
    if foto | diff "$BASE" -; then
      echo "El vecino sigue igual que en la foto base del $(date -r "$BASE" '+%Y-%m-%d %H:%M %Z')."
    else
      echo "ALGO CAMBIO en el vecino (arriba, < es la base y > es ahora). Revisar antes de seguir." >&2
      exit 1
    fi
    ;;
  *)
    echo "Uso: verificar-vecino.sh [--base]" >&2
    exit 2
    ;;
esac
