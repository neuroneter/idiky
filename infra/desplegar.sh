#!/bin/sh
# Publica en el entorno de desarrollo uno o varios servicios, desde un commit (T-35 · ADR-0011).
# Corre en la maquina de quien despliega. Guia para el equipo: infra/guia-de-despliegue.md
#
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main pwa
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main contable
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main gestion
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main todo
#
# Servicios: pwa (8080), contable (8081) y gestion (8082, BOB). Los que no se nombran siguen
# como estaban. La direccion del servidor no va en el repositorio a proposito.
set -eu

: "${IDIKY_SERVIDOR:?Falta el destino, p. ej. IDIKY_SERVIDOR=idiky@203.0.113.10}"
if [ $# -lt 2 ]; then
  echo "Uso: infra/desplegar.sh <rama-o-commit> <pwa|contable|gestion|todo> [otro servicio...]" >&2
  exit 2
fi
REF="$1"
shift

SERVICIOS=""
for servicio in "$@"; do
  case "$servicio" in
    pwa | contable | gestion)
      case " $SERVICIOS " in *" $servicio "*) ;; *) SERVICIOS="$SERVICIOS $servicio" ;; esac
      ;;
    todo) SERVICIOS=" pwa contable gestion" ;;
    *)
      echo "Servicio desconocido: $servicio. Son pwa, contable, gestion o todo." >&2
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

# BOB (gestion) solo desde lo que ya esta en main. Strapi ajusta la base de datos al codigo con
# el que arranca: con un codigo que no tiene los tipos de contenido de main, BORRA sus tablas y
# columnas, y con ellas los datos. levantar.sh ademas respalda la base antes de recrear el pod.
case " $SERVICIOS " in
  *" gestion "*)
    if ! git merge-base --is-ancestor "$REF" origin/main; then
      if [ "${IDIKY_GESTION_FUERA_DE_MAIN:-}" != "si" ]; then
        echo "No se despliega gestion (BOB) desde $REF: ese commit no esta en origin/main." >&2
        echo "Strapi borraria de la base de BOB lo que ese codigo no tenga. Solo el responsable de" >&2
        echo "integracion lo fuerza, con IDIKY_GESTION_FUERA_DE_MAIN=si." >&2
        exit 1
      fi
      echo "Aviso: se despliega gestion desde $REF, fuera de main (IDIKY_GESTION_FUERA_DE_MAIN=si)." >&2
    fi
    ;;
esac

# Para el registro del servidor: sin comillas ni caracteres que rompan la linea remota.
QUIEN=$(printf %s "${IDIKY_QUIEN:-$(git config user.name || echo desconocido)}" | tr -cd 'A-Za-z0-9 ._@-')
REF_LIMPIA=$(printf %s "$REF" | tr -cd 'A-Za-z0-9._/-')
ID="$(date -u +%Y%m%d-%H%M%S)-$REVISION"

ssh_idiky() {
  ssh ${IDIKY_LLAVE:+-i "$IDIKY_LLAVE"} -o BatchMode=yes "$IDIKY_SERVIDOR" "$@"
}

echo "==> Subiendo $REF ($REVISION) a $IDIKY_SERVIDOR · servicios: $SERVICIOS"
git archive --format=tar "$REF" | ssh_idiky "mkdir -p ~/despliegues/$ID && tar -x -C ~/despliegues/$ID"

# Un despliegue a la vez: si otra persona esta desplegando, este se detiene sin tocar nada (75).
# Cada despliegue queda en el registro, y se conservan las ultimas 3 copias del codigo.
ssh_idiky "cd ~/despliegues/$ID && flock -n -E 75 ~/.idiky-despliegue.lock env REVISION='$REVISION' IDIKY_SERVICIOS='$SERVICIOS' sh infra/servidor/levantar.sh; e=\$?
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \"\$(date -u +%FT%TZ)\" '$QUIEN' '$REF_LIMPIA' '$REVISION' '$SERVICIOS' \"\$([ \$e = 0 ] && echo ok || echo fallo-\$e)\" >> ~/despliegues/registro.tsv
  ls -1dt ~/despliegues/*-*/ 2>/dev/null | tail -n +4 | xargs -r rm -rf
  rm -rf ~/fuente ~/fuente.nueva
  if [ \$e = 75 ]; then echo 'Otro despliegue esta en curso en el servidor: no se toco nada. Intenta en unos minutos.' >&2; fi
  exit \$e"
