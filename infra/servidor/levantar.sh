#!/bin/sh
# Construye las imagenes de Idiky y (re)crea sus contenedores como servicios del usuario.
# T-35 · ADR-0011.
#
# Corre EN EL SERVIDOR, como el usuario `idiky` (nunca como root), desde la raiz de una
# copia del repositorio. Normalmente lo llama infra/desplegar.sh.
#
#   REVISION=abc1234 sh infra/servidor/levantar.sh
#
# Configuracion opcional, fuera del repositorio, en ~/.config/idiky/entorno:
#   IDIKY_HOST=127.0.0.1        # 0.0.0.0 para publicar hacia la red
#   IDIKY_PUERTO_PWA=8080
#   IDIKY_PUERTO_CONTABLE=8081
set -eu

[ "$(id -u)" -ne 0 ] || { echo "No se corre como root: los contenedores de Idiky van sin privilegios (ADR-0011)." >&2; exit 1; }

CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/entorno"
# shellcheck disable=SC1090
[ ! -f "$CONFIG" ] || . "$CONFIG"

REVISION="${REVISION:-sin-revision}"
IDIKY_HOST="${IDIKY_HOST:-127.0.0.1}"
IDIKY_PUERTO_PWA="${IDIKY_PUERTO_PWA:-8080}"
IDIKY_PUERTO_CONTABLE="${IDIKY_PUERTO_CONTABLE:-8081}"
UNIDADES="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

LOCAL="$IDIKY_HOST"
[ "$LOCAL" != "0.0.0.0" ] || LOCAL=127.0.0.1

# El servidor es compartido: construir cede la CPU (nice) y tiene tope de memoria, para no
# quitarle recursos a lo que ya corre ahi.
construir() {
  echo "==> Construyendo idiky-$1 ($REVISION)"
  nice -n 15 podman build --memory 2g --build-arg "REVISION=$REVISION" \
    --tag "localhost/idiky-$1:actual" --file "infra/$1/Containerfile" .
}

# Cada producto en su contenedor, publicado solo en IDIKY_HOST. La unidad de systemd la
# genera podman a partir del contenedor; con ella el servicio vuelve solo tras un reinicio.
levantar() {
  nombre="idiky-$1"
  echo "==> Levantando $nombre en $IDIKY_HOST:$2"
  systemctl --user stop "container-$nombre.service" 2>/dev/null || true
  podman rm --force --ignore "$nombre" >/dev/null
  podman create --name "$nombre" --memory 256m --pids-limit 256 \
    --publish "$IDIKY_HOST:$2:80" "localhost/$nombre:actual" >/dev/null
  mkdir -p "$UNIDADES"
  (cd "$UNIDADES" && podman generate systemd --new --files --name "$nombre" >/dev/null)
  podman rm "$nombre" >/dev/null
  systemctl --user daemon-reload
  systemctl --user enable --now "container-$nombre.service"
}

esperar() {
  intentos=0
  until curl -fsS --max-time 2 "http://$LOCAL:$2/salud" >/dev/null 2>&1; do
    intentos=$((intentos + 1))
    if [ "$intentos" -ge 30 ]; then
      echo "idiky-$1 no respondio en $LOCAL:$2" >&2
      systemctl --user status "container-idiky-$1.service" --no-pager >&2 || true
      exit 1
    fi
    sleep 1
  done
  echo "    idiky-$1 responde en $IDIKY_HOST:$2 con la revision $(curl -fsS "http://$LOCAL:$2/revision.txt")"
}

# Se construye todo antes de detener nada: si la construccion falla, sigue en pie lo anterior.
construir pwa
construir contable
levantar pwa "$IDIKY_PUERTO_PWA"
levantar contable "$IDIKY_PUERTO_CONTABLE"
esperar pwa "$IDIKY_PUERTO_PWA"
esperar contable "$IDIKY_PUERTO_CONTABLE"

# Borra solo lo que ya nadie usa (capas intermedias, la imagen anterior). Lo publicado queda.
podman image prune --force >/dev/null
podman system df
