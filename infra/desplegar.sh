#!/bin/sh
# Publica en el entorno de desarrollo uno o varios servicios, desde un commit (T-35 · ADR-0011).
# Corre en la maquina de quien despliega. Guia para el equipo: infra/guia-de-despliegue.md
#
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main pwa
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main contable
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main gestion
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main bloky
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main jitsi
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main todo
#
# Servicios: pwa (8080), contable (8081), gestion (8082, BOB), bloky (8083), tunel (ADR-0014) y
# jitsi (8085 y 10000/udp, ADR-0016). El codigo de gestion, bloky y jitsi vive en su propio
# repositorio y se trae de su origin/main (ADR-0017). Los que no se nombran siguen como estaban. `todo` NO
# incluye el tunel ni jitsi: los publica solo el responsable de integracion, nombrandolos.
# La direccion del servidor no va en el repositorio a proposito.
set -eu

: "${IDIKY_SERVIDOR:?Falta el destino, p. ej. IDIKY_SERVIDOR=idiky@203.0.113.10}"
if [ $# -lt 2 ]; then
  echo "Uso: infra/desplegar.sh <rama-o-commit> <pwa|contable|gestion|bloky|tunel|jitsi|todo> [otro servicio...]" >&2
  exit 2
fi
REF="$1"
shift

SERVICIOS=""
for servicio in "$@"; do
  case "$servicio" in
    pwa | contable | gestion | bloky | tunel | jitsi)
      case " $SERVICIOS " in *" $servicio "*) ;; *) SERVICIOS="$SERVICIOS $servicio" ;; esac
      ;;
    todo) SERVICIOS=" pwa contable gestion bloky" ;;
    *)
      echo "Servicio desconocido: $servicio. Son pwa, contable, gestion, bloky, tunel, jitsi o todo." >&2
      exit 2
      ;;
  esac
done
SERVICIOS="${SERVICIOS# }"

cd "$(git rev-parse --show-toplevel)"
git fetch -q origin
REVISION=$(git rev-parse --short "$REF")

# Se sube lo que esta en git, no la carpeta de trabajo: lo publicado siempre es un commit.
if [ "$REF" = "HEAD" ] && [ -n "$(git status --porcelain)" ]; then
  echo "Aviso: hay cambios sin commit; no se publican. Se publica $REVISION." >&2
fi

# BLOKY, BOB y Jitsi tienen su propio repositorio (ADR-0017), con las mismas rutas que tenian
# aqui. Su codigo se trae de GitHub y se pone encima de la copia de idiky, asi levantar.sh ve la
# carpeta de siempre. El de cada uno sale de su origin/main, salvo que se pida otro commit con
# IDIKY_REF_BLOKY, IDIKY_REF_GESTION o IDIKY_REF_JITSI.
#   repositorio_de <servicio> -> "<repositorio> <rutas...>" (vacio si el codigo vive en idiky)
repositorio_de() {
  case "$1" in
    bloky) echo "Bloky-Idiky apps/bloky apps/bloky-api infra/bloky" ;;
    gestion) echo "BOB-Idiky apps/gestion infra/gestion" ;;
    jitsi) echo "Jitsi-Streaming-Idiky infra/jitsi" ;;
  esac
}
ref_de() {
  case "$1" in
    bloky) echo "${IDIKY_REF_BLOKY:-origin/main}" ;;
    gestion) echo "${IDIKY_REF_GESTION:-origin/main}" ;;
    jitsi) echo "${IDIKY_REF_JITSI:-origin/main}" ;;
  esac
}
# Una copia sin carpeta de trabajo por repositorio, fuera de las carpetas del equipo: lo que se
# publica es lo que esta en GitHub, no lo que alguien tenga a medias en su maquina.
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/idiky/repos"
ORIGEN=$(git remote get-url origin)
traer_repositorio() {
  copia="$CACHE/$1.git"
  if [ ! -d "$copia" ]; then
    mkdir -p "$CACHE"
    git init -q --bare "$copia"
    git --git-dir="$copia" remote add origin "${ORIGEN%/*}/$1.git"
  fi
  git --git-dir="$copia" fetch -q origin
  echo "$copia"
}

EXTERNOS=""
for servicio in $SERVICIOS; do
  datos=$(repositorio_de "$servicio")
  [ -n "$datos" ] || continue
  set -- $datos
  copia=$(traer_repositorio "$1")
  ref=$(ref_de "$servicio")
  if ! sha=$(git --git-dir="$copia" rev-parse -q --verify --short "$ref^{commit}"); then
    echo "No existe $ref en $1." >&2
    exit 1
  fi
  # BOB (gestion) solo desde lo que ya esta en main. Strapi ajusta la base de datos al codigo
  # con el que arranca: con un codigo que no tiene los tipos de contenido de main, BORRA sus
  # tablas y columnas, y con ellas los datos. levantar.sh ademas respalda la base antes de
  # recrear el pod.
  if [ "$servicio" = gestion ] && ! git --git-dir="$copia" merge-base --is-ancestor "$sha" origin/main; then
    if [ "${IDIKY_GESTION_FUERA_DE_MAIN:-}" != "si" ]; then
      echo "No se despliega gestion (BOB) desde $ref: ese commit no esta en origin/main de $1." >&2
      echo "Strapi borraria de la base de BOB lo que ese codigo no tenga. Solo el responsable de" >&2
      echo "integracion lo fuerza, con IDIKY_GESTION_FUERA_DE_MAIN=si." >&2
      exit 1
    fi
    echo "Aviso: se despliega gestion desde $ref, fuera de main (IDIKY_GESTION_FUERA_DE_MAIN=si)." >&2
  fi
  EXTERNOS="$EXTERNOS $servicio:$sha"
  # La revision que se publica nombra tambien el commit de cada repositorio externo.
  REVISION="$REVISION.$servicio-$sha"
done

# Para el registro del servidor: sin comillas ni caracteres que rompan la linea remota.
QUIEN=$(printf %s "${IDIKY_QUIEN:-$(git config user.name || echo desconocido)}" | tr -cd 'A-Za-z0-9 ._@-')
REF_LIMPIA=$(printf %s "$REF" | tr -cd 'A-Za-z0-9._/-')
ID="$(date -u +%Y%m%d-%H%M%S)-$REVISION"

ssh_idiky() {
  ssh ${IDIKY_LLAVE:+-i "$IDIKY_LLAVE"} -o BatchMode=yes "$IDIKY_SERVIDOR" "$@"
}

# Se arma la carpeta del despliegue: idiky en $REF y, encima, las rutas de cada repositorio
# externo. Las rutas se vacian antes, por si $REF es de cuando ese codigo aun vivia aqui.
ARMADO=$(mktemp -d)
trap 'rm -rf "$ARMADO"' EXIT
git archive --format=tar "$REF" | tar -x -C "$ARMADO"
for par in $EXTERNOS; do
  set -- $(repositorio_de "${par%%:*}")
  repositorio="$1"
  shift
  for ruta in "$@"; do rm -rf "${ARMADO:?}/$ruta"; done
  git --git-dir="$CACHE/$repositorio.git" archive --format=tar "${par#*:}" -- "$@" | tar -x -C "$ARMADO"
  echo "    $repositorio en ${par#*:}"
done

echo "==> Subiendo $REF ($REVISION) a $IDIKY_SERVIDOR · servicios: $SERVICIOS"
tar -c -C "$ARMADO" . | ssh_idiky "mkdir -p ~/despliegues/$ID && tar -x -C ~/despliegues/$ID"

# Un despliegue a la vez: si otra persona esta desplegando, este se detiene sin tocar nada (75).
# Cada despliegue queda en el registro, y se conservan las ultimas 3 copias del codigo.
ssh_idiky "cd ~/despliegues/$ID && flock -n -E 75 ~/.idiky-despliegue.lock env REVISION='$REVISION' IDIKY_SERVICIOS='$SERVICIOS' sh infra/servidor/levantar.sh; e=\$?
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \"\$(date -u +%FT%TZ)\" '$QUIEN' '$REF_LIMPIA' '$REVISION' '$SERVICIOS' \"\$([ \$e = 0 ] && echo ok || echo fallo-\$e)\" >> ~/despliegues/registro.tsv
  ls -1dt ~/despliegues/*-*/ 2>/dev/null | tail -n +4 | xargs -r rm -rf
  rm -rf ~/fuente ~/fuente.nueva
  if [ \$e = 75 ]; then echo 'Otro despliegue esta en curso en el servidor: no se toco nada. Intenta en unos minutos.' >&2; fi
  exit \$e"
