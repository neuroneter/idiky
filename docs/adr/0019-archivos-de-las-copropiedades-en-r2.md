# ADR-0019 — Los archivos de las copropiedades en Cloudflare R2, y su versión digital en PostgreSQL

- **Estado:** Aceptada (2026-10-11)
- **Fecha:** 2026-10-11
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** [ADR-0015](./0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md) (un esquema por copropiedad),
  [ADR-0023](./0023-bloky-nativo-para-agentes.md) (BLOKY nativo para agentes), CU-B-10, CU-B-11, RN-240, RN-241

> El número estaba reservado desde el 2026-09-21 para «archivos en R2» (galería de fotos, CU-B-09).
> Se escribe ahora porque el primer archivo que BLOKY necesita guardar es el reglamento.

## Contexto

Hasta hoy BLOKY no guardaba archivos: el alta desde documentos (CU-B-10) leía el reglamento y lo
olvidaba (RN-187). Daniel (2026-10-11): el documento **debe quedar en los documentos de la
copropiedad**, y con él **una versión digital** que el futuro chat de IA pueda usar de forma nativa
para apoyar todas las tareas: responder qué dice el reglamento citando artículo y página.

Hacen falta dos cosas distintas:

- **El archivo** (PDF, luego fotos y planos): binario, a veces grande, que casi nunca se lee.
- **Su versión digital**: el texto página por página y el índice (capítulos, artículos), que se
  consulta mucho y se busca por palabras.

## Decisión

**1. Los archivos van en Cloudflare R2**, un bucket **privado** por entorno (`idiky-dev-documentos`
en desarrollo), con la clave `cp/<copropiedad>/documentos/<documento>.pdf`. Nadie entra al bucket
directamente: solo `bloky-api`, con un token de R2 limitado a ese bucket y a leer y escribir. Para
ver un archivo, la persona lo pide a la API, que comprueba su rol en esa copropiedad (ADR-0022) y
se lo entrega. No hay enlaces públicos.

**2. La ficha y la versión digital van en el esquema de cada copropiedad** (ADR-0015):
`documento` (qué es, quién lo subió, su huella SHA-256, dónde está en R2, el estado de la versión
digital y su índice) y `documento_pagina` (el texto de cada página en Markdown, con su índice de
búsqueda en español de PostgreSQL). Así la búsqueda y el chat no dependen de R2, y la versión
digital queda separada por copropiedad como todo lo demás.

**3. Sin librería de AWS.** R2 habla el protocolo S3; para subir y bajar un objeto basta firmar la
petición (AWS Signature V4), que son unas decenas de líneas con `node:crypto`. Se evita una
dependencia grande para dos operaciones.

**4. En desarrollo, una carpeta local.** Sin las variables de R2 (y solo con `BLOKY_ENTORNO=desarrollo`),
los archivos se guardan en `BLOKY_ARCHIVOS_DIR` (por defecto `./archivos`). En producción, sin R2,
los documentos no se guardan y la API lo dice.

**5. Nada se borra** (como el resto de BLOKY): un documento se **retira**. Subir el mismo archivo
otra vez (misma huella) reutiliza el que ya está.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| El PDF dentro de PostgreSQL (`bytea`) | Nada nuevo que configurar; se respalda con la base | Engorda la base y sus copias; no sirve para la galería de fotos | ❌ (Daniel eligió R2) |
| Carpeta en el disco del servidor | Simple | Se pierde con la máquina; no escala a varios servidores | ❌ Solo para desarrollo |
| **Cloudflare R2** | Ya se usa Cloudflare (túnel); sin costo de salida; 10 GB gratis al mes y luego ~0,015 US$/GB; sirve igual para fotos (CU-B-09) | Una cuenta y un token más que cuidar | ✅ |
| Amazon S3 | Estándar | Cobra la salida de datos; otra nube más | ❌ |
| El texto también en R2 | Todo en un sitio | Buscar y citar exigiría bajar archivos | ❌ El texto va en PostgreSQL |

## Consecuencias

- **Secretos nuevos** en `~/.config/idiky/secretos/bloky-api.env`: `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` y `R2_BUCKET`. Se ponen con `ssh -t` y `read -s`, nunca
  en el chat ni en git.
- **RN-187 cambia:** el documento ya **sí** se guarda (RN-240).
- **Datos personales (Ley 1581):** un reglamento o un acta pueden traer nombres. El bucket es
  privado, R2 cifra en reposo y solo se llega por la API con rol; la versión digital vive en el
  esquema de la copropiedad.
- **Respaldo:** la base y R2 se respaldan por separado; ADR-0015 §5 (respaldar) debe incluir R2.
- **Lo que abre:** la galería de fotos (CU-B-09), los planos y las actas usan el mismo almacén; el
  chat de IA (ADR-0023) busca en `documento_pagina` y cita documento y página.
