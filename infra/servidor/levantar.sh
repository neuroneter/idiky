#!/bin/sh
# Construye las imagenes de Idiky y (re)crea sus contenedores como servicios del usuario.
# T-35 · ADR-0011 · ADR-0012.
#
# Corre EN EL SERVIDOR, como el usuario `idiky` (nunca como root), desde la raiz de una
# copia del repositorio. Normalmente lo llama infra/desplegar.sh.
#
#   REVISION=abc1234 sh infra/servidor/levantar.sh
#
# Configuracion opcional, fuera del repositorio, en ~/.config/idiky/entorno:
#   IDIKY_HOST=127.0.0.1         # 0.0.0.0 para publicar hacia la red
#   IDIKY_PUERTO_PWA=8080
#   IDIKY_PUERTO_CONTABLE=8081
#   IDIKY_PUERTO_GESTION=8082
#   IDIKY_DATOS=$HOME/datos      # lo que persiste: PostgreSQL, archivos subidos, respaldos
#   IDIKY_MINIMO_DISCO_MB=3000   # con menos espacio libre no se construye nada
set -eu

[ "$(id -u)" -ne 0 ] || { echo "No se corre como root: los contenedores de Idiky van sin privilegios (ADR-0011)." >&2; exit 1; }

CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/entorno"
# shellcheck disable=SC1090
[ ! -f "$CONFIG" ] || . "$CONFIG"

REVISION="${REVISION:-sin-revision}"
IDIKY_HOST="${IDIKY_HOST:-127.0.0.1}"
IDIKY_PUERTO_PWA="${IDIKY_PUERTO_PWA:-8080}"
IDIKY_PUERTO_CONTABLE="${IDIKY_PUERTO_CONTABLE:-8081}"
IDIKY_PUERTO_GESTION="${IDIKY_PUERTO_GESTION:-8082}"
IDIKY_DATOS="${IDIKY_DATOS:-$HOME/datos}"
IDIKY_MINIMO_DISCO_MB="${IDIKY_MINIMO_DISCO_MB:-3000}"
UNIDADES="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
SECRETOS="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/secretos"

# Clave de acceso del entorno (clave-acceso.sh). Si la carpeta no existe, no se monta nada.
ACCESO="${XDG_CONFIG_HOME:-$HOME/.config}/idiky/nginx"
MONTAJE=""
[ ! -d "$ACCESO" ] || MONTAJE="--volume $ACCESO:/etc/nginx/idiky:ro"

LOCAL="$IDIKY_HOST"
[ "$LOCAL" != "0.0.0.0" ] || LOCAL=127.0.0.1

# El disco lo comparte la base de datos del otro servicio del servidor: si se llena, se cae.
# Con menos del minimo no se construye nada, y lo publicado sigue en pie.
disco_suficiente() {
  libre=$(df -Pm "$HOME" | awk 'NR == 2 {print $4}')
  if [ "$libre" -lt "$IDIKY_MINIMO_DISCO_MB" ]; then
    echo "Quedan $libre MB libres y el minimo es $IDIKY_MINIMO_DISCO_MB: no se construye nada. Lo publicado sigue en pie." >&2
    exit 1
  fi
}

# El servidor es compartido: construir cede la CPU (nice) y tiene tope de memoria.
#   construir <nombre> [archivo dentro de infra/] [memoria]
construir() {
  disco_suficiente
  echo "==> Construyendo idiky-$1 ($REVISION)"
  nice -n 15 podman build --memory "${3:-2g}" --build-arg "REVISION=$REVISION" \
    --tag "localhost/idiky-$1:actual" --file "infra/${2:-$1/Containerfile}" .
}

# Un contenedor por servicio web, publicado en IDIKY_HOST. La unidad de systemd la genera
# podman a partir del contenedor; con ella el servicio vuelve solo tras un reinicio.
levantar() {
  nombre="idiky-$1"
  echo "==> Levantando $nombre en $IDIKY_HOST:$2"
  systemctl --user stop "container-$nombre.service" 2>/dev/null || true
  podman rm --force --ignore "$nombre" >/dev/null
  # shellcheck disable=SC2086
  podman create --name "$nombre" --memory 256m --pids-limit 256 $MONTAJE \
    --publish "$IDIKY_HOST:$2:80" "localhost/$nombre:actual" >/dev/null
  mkdir -p "$UNIDADES"
  (cd "$UNIDADES" && podman generate systemd --new --files --name "$nombre" >/dev/null)
  podman rm "$nombre" >/dev/null
  systemctl --user daemon-reload
  systemctl --user enable --now "container-$nombre.service"
}

# El sistema de gestion es un pod: nginx, Strapi y PostgreSQL comparten la red del pod y se
# hablan por localhost. Solo el pod publica puerto, y ese puerto llega a nginx; Strapi y
# PostgreSQL no son alcanzables desde fuera del pod (ADR-0012).
# port_handler=slirp4netns conserva la IP real de quien llega: el login de Strapi limita
# intentos por IP, y sin esto todos llegarian desde la misma.
levantar_gestion() {
  pod="idiky-gestion"
  echo "==> Levantando el pod $pod en $IDIKY_HOST:$1"
  mkdir -p "$IDIKY_DATOS/gestion/postgres" "$IDIKY_DATOS/gestion/uploads"
  chmod 700 "$IDIKY_DATOS" "$IDIKY_DATOS/gestion"
  # Strapi corre como el usuario `node` (uid 1000 dentro del contenedor), no como root: la
  # carpeta de archivos subidos se le entrega dentro del espacio de usuarios de podman.
  # PostgreSQL no lo necesita: su imagen ajusta los permisos de su carpeta al arrancar.
  podman unshare chown 1000:1000 "$IDIKY_DATOS/gestion/uploads"
  systemctl --user stop "pod-$pod.service" 2>/dev/null || true
  podman pod rm --force --ignore "$pod" >/dev/null
  podman pod create --name "$pod" --network slirp4netns:port_handler=slirp4netns \
    --publish "$IDIKY_HOST:$1:80" >/dev/null
  podman create --pod "$pod" --name "$pod-postgres" --memory 512m --pids-limit 256 \
    --env-file "$SECRETOS/gestion-postgres.env" \
    --volume "$IDIKY_DATOS/gestion/postgres:/var/lib/postgresql/data" \
    docker.io/library/postgres:17-alpine >/dev/null
  podman create --pod "$pod" --name "$pod-strapi" --memory 1536m --pids-limit 512 \
    --env-file "$SECRETOS/gestion-strapi.env" \
    --volume "$IDIKY_DATOS/gestion/uploads:/opt/app/public/uploads" \
    "localhost/idiky-gestion:actual" >/dev/null
  podman create --pod "$pod" --name "$pod-proxy" --memory 64m --pids-limit 64 \
    "localhost/idiky-gestion-proxy:actual" >/dev/null
  mkdir -p "$UNIDADES"
  (cd "$UNIDADES" && podman generate systemd --new --files --name "$pod" >/dev/null)
  podman pod rm --force "$pod" >/dev/null
  systemctl --user daemon-reload
  systemctl --user enable --now "pod-$pod.service"
}

# Respaldo diario de la base (infra/gestion/respaldo.sh). Se copia fuera de ~/fuente porque
# esa carpeta se reemplaza en cada despliegue.
instalar_respaldo_gestion() {
  mkdir -p "$HOME/.local/bin" "$UNIDADES"
  install -m 755 infra/gestion/respaldo.sh "$HOME/.local/bin/idiky-gestion-respaldo"
  cp infra/gestion/idiky-gestion-respaldo.service infra/gestion/idiky-gestion-respaldo.timer "$UNIDADES/"
  systemctl --user daemon-reload
  systemctl --user enable --now idiky-gestion-respaldo.timer >/dev/null 2>&1
}

#   esperar <nombre> <puerto> [ruta] [segundos]
esperar() {
  ruta="${3:-/salud}"
  limite="${4:-30}"
  intentos=0
  until curl -fsS --max-time 2 "http://$LOCAL:$2$ruta" >/dev/null 2>&1; do
    intentos=$((intentos + 1))
    if [ "$intentos" -ge "$limite" ]; then
      echo "idiky-$1 no respondio $ruta en $LOCAL:$2 en $limite s" >&2
      systemctl --user status "container-idiky-$1.service" "pod-idiky-$1.service" --no-pager >&2 2>/dev/null || true
      exit 1
    fi
    sleep 1
  done
  if [ "$ruta" = "/salud" ]; then
    echo "    idiky-$1 responde en $IDIKY_HOST:$2 con la revision $(curl -fsS "http://$LOCAL:$2/revision.txt")"
  else
    echo "    idiky-$1 responde $ruta (tras $intentos s)"
  fi
}

# Los secretos del sistema de gestion no estan en git. Se comprueba antes de detener nada.
if [ ! -f "$SECRETOS/gestion-postgres.env" ] || [ ! -f "$SECRETOS/gestion-strapi.env" ]; then
  echo "Faltan los secretos del sistema de gestion. Se crean una vez: ssh idiky@<ip> 'sh -s' < infra/gestion/secretos.sh" >&2
  exit 1
fi

# Se construye (y se descarga) todo antes de detener nada: si algo falla, sigue en pie lo anterior.
construir pwa
construir contable
construir gestion gestion/Containerfile 3g
construir gestion-proxy gestion/proxy.Containerfile
podman pull --quiet docker.io/library/postgres:17-alpine >/dev/null

levantar pwa "$IDIKY_PUERTO_PWA"
levantar contable "$IDIKY_PUERTO_CONTABLE"
levantar_gestion "$IDIKY_PUERTO_GESTION"
instalar_respaldo_gestion

esperar pwa "$IDIKY_PUERTO_PWA"
esperar contable "$IDIKY_PUERTO_CONTABLE"
esperar gestion "$IDIKY_PUERTO_GESTION"
# Strapi tarda en arrancar, y la primera vez crea todas sus tablas.
esperar gestion "$IDIKY_PUERTO_GESTION" /_health 240

# El disco del servidor es compartido y escaso: se borra toda imagen que no use un
# contenedor en marcha, incluidos Node y las capas de construccion. Lo publicado queda; el
# costo es volver a bajar las imagenes base en el siguiente despliegue.
podman image prune --all --force >/dev/null
podman system df
df -h "$HOME" | tail -1
