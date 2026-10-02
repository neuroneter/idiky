#!/usr/bin/env bash
# Hook SessionStart de Claude Code (ver .claude/settings.json).
#
# Se ejecuta al abrir una sesión en este repositorio y avisa, con palabras
# sencillas, si la rama de trabajo está atrasada. Existe porque dos veces
# (2026-09-10 y 2026-09-21) alguien siguió trabajando sobre una rama que no
# tenía el último `main` adentro, y eso costó renumerar todo.
#
# Salida: un JSON que Claude Code entiende. `systemMessage` se le muestra a
# la persona; `additionalContext` se lo lee Claude, que es quien debe explicar
# y ofrecer hacer el `git pull`.
set -u
raiz=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$raiz" || exit 0
rama=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0

json() { printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$1" "$2"; }

if ! git fetch --quiet origin 2>/dev/null; then
  json "Idiky · no pude consultar GitHub para saber si tu rama está al día (¿sin internet?). Cuando vuelva la conexión, ejecuta: git pull" \
       "No se pudo hacer git fetch. Antes de trabajar, pídele a la persona que revise su conexión y ejecuta git pull cuando sea posible."
  exit 0
fi

detras_remoto=$(git rev-list --count "HEAD..origin/$rama" 2>/dev/null || echo 0)
detras_main=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
sin_guardar=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

if [ "$detras_remoto" -gt 0 ]; then
  json "Idiky · tu rama ($rama) tiene $detras_remoto cambio(s) nuevos en GitHub que todavía no están en tu computador. Antes de trabajar, ejecuta:  git pull" \
       "LA RAMA ESTÁ ATRASADA: hay $detras_remoto commits en origin/$rama que no están en el computador de la persona (cambios sin guardar localmente: $sin_guardar). Antes de cualquier otra cosa, dile a la persona con palabras sencillas que hay que traer los cambios nuevos y que eso se hace con \`git pull\`; ofrécete a ejecutarlo tú. Si hay cambios sin guardar, primero haz commit de ellos. Si git pull reporta conflictos, no los resuelvas a ciegas: detente y dile que le avise al responsable de integración (Daniel). No empieces ninguna tarea hasta que la rama esté al día."
elif [ "$detras_main" -gt 0 ]; then
  json "Idiky · tu rama ($rama) no tiene los últimos cambios de main ($detras_main commit(s)). Claude te va a proponer traerlos ahora." \
       "LA RAMA NO TIENE EL ÚLTIMO MAIN: faltan $detras_main commits de origin/main en $rama. Antes de trabajar, explícale a la persona con palabras sencillas que hay que traer lo último de main a su rama, y hazlo tú: \`git merge origin/main\`, luego \`cd apps/pwa && npm run build\` si la rama toca la PWA, y \`git push\`. Si el merge reporta conflictos, ejecuta \`git merge --abort\` y dile que le avise al responsable de integración (Daniel) para que lo haga él. No empieces ninguna tarea hasta que la rama esté al día."
else
  json "Idiky · tu rama ($rama) está al día." \
       "La rama $rama está al día con GitHub y con main. Puedes trabajar normalmente."
fi
