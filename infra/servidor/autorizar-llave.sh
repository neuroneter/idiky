#!/bin/sh
# Autoriza la llave SSH publica de una persona del equipo para desplegar en el entorno de
# desarrollo (entrar como `idiky`). T-35 · ADR-0011.
#
# Lo corre alguien que ya tiene acceso (el responsable de integracion), en su maquina:
#
#   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/servidor/autorizar-llave.sh ~/Descargas/mary.pub "Mary"
#
# Solo se recibe y se sube la llave PUBLICA (.pub). La privada nunca sale de la maquina de su
# duena. No usa sudo: agrega la linea a /home/idiky/.ssh/authorized_keys, sin repetirla.
#
# Para quitar el acceso a alguien: borrar su linea (termina en `idiky-<Nombre>`) de ese archivo.
#
# Con IDIKY_SOLO_VOLCADO_BOB=si la llave queda RESTRINGIDA: solo puede descargar el volcado de la
# base de BOB (T-119, BOB-Idiky/infra/gestion/traer-base-de-la-nube.sh). No abre una consola, no
# reenvia puertos y no puede ejecutar ningun otro comando, aunque lo pida:
#
#   IDIKY_SOLO_VOLCADO_BOB=si IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> \
#     infra/servidor/autorizar-llave.sh ~/Descargas/justo.pub "Justo"
set -eu

: "${IDIKY_SERVIDOR:?Falta el destino, p. ej. IDIKY_SERVIDOR=idiky@203.0.113.10}"
ARCHIVO="${1:?Falta el archivo de la llave publica (.pub)}"
NOMBRE="${2:?Falta el nombre de la persona}"

if grep -q "PRIVATE KEY" "$ARCHIVO" 2>/dev/null; then
  echo "$ARCHIVO es una llave PRIVADA: esa no se comparte ni se sube. Se usa el archivo .pub." >&2
  exit 1
fi
if ! ssh-keygen -l -f "$ARCHIVO" >/dev/null 2>&1; then
  echo "$ARCHIVO no es una llave publica SSH valida." >&2
  exit 1
fi

etiqueta=$(printf %s "$NOMBRE" | tr -cd 'A-Za-z0-9 ._-' | tr ' ' '_')
linea="$(awk 'NR == 1 {print $1, $2}' "$ARCHIVO") idiky-$etiqueta"
if [ "${IDIKY_SOLO_VOLCADO_BOB:-}" = "si" ]; then
  linea="restrict,command=\"/home/idiky/.local/bin/idiky-gestion-volcado-desarrollo\" $linea"
fi

printf '%s\n' "$linea" | ssh ${IDIKY_LLAVE:+-i "$IDIKY_LLAVE"} -o BatchMode=yes "$IDIKY_SERVIDOR" '
  set -eu
  IFS= read -r linea
  archivo="$HOME/.ssh/authorized_keys"
  cuerpo=$(printf %s "$linea" | awk "{print \$(NF-1)}")
  if grep -qF "$cuerpo" "$archivo"; then
    echo "Esa llave ya estaba autorizada."
  else
    printf "%s\n" "$linea" >> "$archivo"
    echo "Llave autorizada."
  fi
  echo "Llaves con acceso de despliegue:"
  ssh-keygen -l -f "$archivo" | awk "{print \"  \" \$2, \$3}"
'
