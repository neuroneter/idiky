#!/bin/sh
# Consulta una persona del directorio por documento (no imprime el admin token).
set -e
DOC="${1:-80821419}"
TOKEN=$(grep -E '^BLOKY_ADMIN_TOKEN=' "$HOME/.config/idiky/secretos/bloky-api.env" | cut -d= -f2-)
test -n "$TOKEN"
curl -sS "http://127.0.0.1:8083/api/admin/personas?tipoDocumento=CC&numeroDocumento=$DOC" \
  -H "Authorization: Bearer $TOKEN" > /tmp/persona.json
python3 <<'PY'
import json
d=json.load(open("/tmp/persona.json"))
p=d.get("persona") or d
if not isinstance(p, dict) or not p.get("id"):
    print(json.dumps(d, ensure_ascii=False, indent=2)[:2000])
    raise SystemExit(1)
print("nombre:", p.get("nombre"))
print("celular:", p.get("celular"))
print("documento:", p.get("tipoDocumento"), p.get("numeroDocumento"))
print("origen:", p.get("origen"))
asig=p.get("asignaciones") or []
print("asignaciones:", len(asig))
for a in asig:
    print("-", a.get("rol"), a.get("estado"), a.get("copropiedadNombre") or a.get("copropiedadId"), "origen="+str(a.get("origen")))
PY
# ¿Tendría acceso ALICE por celular?
CEL=$(python3 -c 'import json; p=json.load(open("/tmp/persona.json")).get("persona") or {}; print(p.get("celular") or "")')
if [ -n "$CEL" ]; then
  echo "--- enviar-codigo ALICE con ese celular ---"
  echo "{\"celular\":\"$CEL\"}" > /tmp/cel.json
  curl -sS -X POST http://127.0.0.1:8083/api/app/acceso/enviar-codigo \
    -H 'Content-Type: application/json; charset=utf-8' \
    --data-binary @/tmp/cel.json
  echo
fi
