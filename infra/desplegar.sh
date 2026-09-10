#!/bin/sh
# Publica una revision del repositorio en el entorno de desarrollo (T-35 · ADR-0011).
# Corre en la maquina de quien despliega.
#
#   IDIKY_SERVIDOR=idiky@<ip> infra/desplegar.sh              # lo que hay en HEAD
#   IDIKY_SERVIDOR=idiky@<ip> infra/desplegar.sh origin/main  # otra rama o commit
#   IDIKY_LLAVE=~/.ssh/mi-llave.pem ...                        # si la llave no es la de siempre
#
# La direccion del servidor no va en el repositorio a proposito.
set -eu

: "${IDIKY_SERVIDOR:?Falta el destino, p. ej. IDIKY_SERVIDOR=idiky@203.0.113.10}"
REF="${1:-HEAD}"

cd "$(git rev-parse --show-toplevel)"
REVISION=$(git rev-parse --short "$REF")

# Se sube lo que esta en git, no la carpeta de trabajo: lo publicado siempre es un commit.
if [ "$REF" = "HEAD" ] && [ -n "$(git status --porcelain)" ]; then
  echo "Aviso: hay cambios sin commit; no se publican. Se publica $REVISION." >&2
fi

ssh_idiky() {
  ssh ${IDIKY_LLAVE:+-i "$IDIKY_LLAVE"} -o BatchMode=yes "$IDIKY_SERVIDOR" "$@"
}

echo "==> Subiendo $REF ($REVISION) a $IDIKY_SERVIDOR"
git archive --format=tar "$REF" | ssh_idiky \
  'rm -rf ~/fuente.nueva && mkdir ~/fuente.nueva && tar -x -C ~/fuente.nueva && rm -rf ~/fuente && mv ~/fuente.nueva ~/fuente'

ssh_idiky "cd ~/fuente && REVISION=$REVISION sh infra/servidor/levantar.sh"
