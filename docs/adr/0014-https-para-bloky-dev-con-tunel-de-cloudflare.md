# ADR-0014 — HTTPS y dominio para BLOKY Dev con un túnel de Cloudflare

- **Estado:** Aceptada
- **Fecha:** 2026-09-21
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** [ADR-0008](./0008-backend-de-bloky.md) (Google y Microsoft exigen HTTPS),
  [ADR-0011](./0011-entorno-de-desarrollo-en-contenedores.md) (el servidor compartido y sus
  límites), T-35 (lo que faltaba: dominio y certificado), T-76

## Contexto

El ingreso a BLOKY con Google o Microsoft (CU-B-01) está construido, pero **los dos proveedores
solo devuelven a la persona a una dirección `https://`** (salvo `localhost`). BLOKY Dev vive en
`http://20.55.251.120:8083`, así que esos dos canales no funcionan en el entorno de desarrollo y
la puerta solo ofrece el código por SMS. También por ser HTTP la clave del entorno viaja sin
cifrar y el navegador apaga lo que exige contexto seguro (ADR-0011).

Restricciones que mandan:

- **Los puertos 80 y 443 son de LangFlow**, el otro servicio del servidor, y su nginx no es de
  este proyecto. Ningún certificado de Let's Encrypt se puede validar por HTTP ni por TLS
  desde este servidor.
- **No se puede configurar nada dentro de Azure** (ni reglas nuevas, ni IP estática, ni
  balanceadores): la suscripción no es del equipo. Sí se puede configurar el dominio
  `idiky.com`, que IDIKY tiene en GoDaddy.
- Todo lo de Idiky corre **sin root, dentro del usuario `idiky`**, con Podman 3.4.

## Decisión

**Un túnel de Cloudflare** (`cloudflared`) como servicio más del entorno, `infra/tunel/`,
que publica BLOKY Dev en **`https://bloky-dev.idiky.com`**:

1. **El DNS de `idiky.com` pasa a Cloudflare** (plan gratuito). El dominio sigue comprado en
   GoDaddy; solo cambian los servidores de nombres. Antes de cambiarlos se comprueba que
   Cloudflare tenga todos los registros actuales (la página web y, sobre todo, el correo).
2. **`cloudflared` corre en un contenedor sin puertos publicados** (`idiky-tunel`), con la
   versión fija en su `Containerfile` y el token en `~/.config/idiky/secretos/tunel.env`. Solo
   hace conexiones de salida hacia Cloudflare, así que no toca nginx, ni el cortafuegos, ni la
   regla `Dev` de Azure, y no depende de que la IP del servidor sea estática.
3. **El nombre público se define en el panel de Cloudflare** (túnel administrado remotamente):
   `bloky-dev.idiky.com` → `http://10.0.2.2:8083`, que es como un contenedor sin root llega al
   puerto del servidor donde ya escucha el nginx de BLOKY. **La clave del entorno sigue**: el
   túnel no la reemplaza, solo cifra el camino hasta el navegador.
4. `BLOKY_URL_PUBLICA` pasa a `https://bloky-dev.idiky.com`, con lo que la cookie de sesión
   va con `Secure` y el retorno de Google y Microsoft es `https://`.

`levantar.sh` lo trata como cualquier servicio (`construir`, `levantar_tunel`, `esperar`): su
salud es `/ready` del propio `cloudflared`, publicado **solo en `127.0.0.1:8084`** del servidor.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Túnel de Cloudflare** | Sin puertos, sin Azure, sin IP estática, certificado que se renueva solo, gratis | Un intermediario más entre el navegador y el servidor; el DNS del dominio tiene que estar en Cloudflare | **Elegida** |
| Caddy o certbot con validación por DNS en un puerto alto (`https://…:8083`) | Sin intermediario; el certificado queda en el servidor | Necesita acceso por API al DNS: GoDaddy ya no lo da a dominios sueltos; habría que mover el DNS igual, y además mantener el certificado y un servicio más | Descartada |
| Registro `A` en GoDaddy hacia la IP, sin certificado | Cero piezas | Sigue siendo `http://`: no resuelve nada de lo que motiva esta decisión; y la IP puede cambiar sin que nadie pueda fijarla en Azure | Descartada |
| Proxy de Cloudflare sobre un registro `A` (sin túnel) | Sin contenedor nuevo | El proxy no llega al 8083 sin una regla extra de puerto, el tramo Cloudflare→servidor seguiría en HTTP, y depende de la IP | Descartada |
| Una VM propia con 80 y 443 libres | Lo limpio | Cuesta, y el equipo no administra Azure | Después, si hace falta (ADR-0011) |

## Consecuencias

- BLOKY Dev tiene por fin una dirección con nombre y HTTPS. Google y Microsoft se activan con
  solo registrar las aplicaciones (`infra/bloky/credenciales-google-microsoft.md`).
- **Todo lo de `idiky.com` pasa por Cloudflare**, incluidos la página web y el correo. Es un
  cambio del dominio entero, no solo del entorno: quien lo haga revisa primero los registros.
- El túnel es un servicio más: se despliega con `infra/desplegar.sh origin/main tunel` (solo el
  responsable de integración), se verifica con `verificar-vecino.sh` como todos, y si se cae, el
  `8083` por IP sigue funcionando como hasta hoy.
- El token del túnel es un secreto con el poder de publicar cualquier cosa bajo ese nombre:
  vive en el servidor con permisos 600 y no se comparte por chats de grupo.
- Los demás servicios (PWA, contable, BOB) **no cambian**: siguen por IP y puerto. Darles nombre
  es agregar un *public hostname* más en el panel del mismo túnel, sin desplegar nada.
