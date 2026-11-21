# Guía de Evolution API — WhatsApp en el entorno de desarrollo

> Cómo entrar al Manager, cómo mandar un mensaje de prueba y dónde están los secretos.
> Decisión: [ADR-0033](../docs/adr/0033-evolution-api-para-whatsapp.md) · tarea **T-131**.
> Código del servicio: [`evolution/`](./evolution/) · registro en el servidor:
> [`servidor/levantar.sh`](./servidor/levantar.sh).

**Estado (2026-11-21):** el pod `idiky-evolution` está **desplegado** en Dev (imagen
`evoapicloud/evolution-api:v2.3.7`). La instancia oficial de IDIKY es **`Idiky_whatsapp`**
(mensaje de prueba llegó). El middleware de BLOKY Dev ya apunta a ella
(`EVOLUTION_INSTANCE` en `bloky-api.env`).

> **Las API keys no van en este documento ni en el chat.** Se leen en el servidor.

## 1. Qué es y qué no es

| | |
|---|---|
| **Qué** | Evolution API: puente WhatsApp (Baileys) para pruebas de mensajería de IDIKY |
| **Dónde** | Pod propio `idiky-evolution`, puerto **8086** — **no** dentro de BOB |
| **Quién opera** | Justo o Daniel (firewall + despliegue) |
| **Quién consume** | Por ahora a mano / pruebas; luego BOB, BLOKY o ALICE por HTTP con la API key |

No es WhatsApp Business API de Meta. Es un piloto técnico en Dev.

## 2. Entrar al Manager (interfaz web)

1. Tu IP tiene que estar en la regla **TCP 8086** de Lightsail (hoy: solo Justo y Daniel).
   Si cambias de red, avisa para actualizar la regla.
2. Abre en el navegador (sustituye `<ip>` por la del servidor Dev; está en
   `SERVER_URL` del secreto, o pídesela a Justo/Daniel):

   **`http://<ip>:8086/manager/`**

3. En el login:
   - **Server URL:** `http://<ip>:8086`
   - **API Key Global:** el valor de `AUTHENTICATION_API_KEY` (ver §3)

Todavía **no** hay túnel `evolution-dev.idiky.com`. Si hace falta HTTPS (QR/webhooks estables),
lo crea Daniel (ADR-0014); luego se cambia `SERVER_URL` y se redespliega.

## 3. Dónde está la API key (en el servidor)

```bash
ssh -i ~/.ssh/idiky_despliegue idiky@<ip>
grep AUTHENTICATION_API_KEY ~/.config/idiky/secretos/evolution.env
```

- Archivo: `~/.config/idiky/secretos/evolution.env` (permisos 600)
- También: `evolution-postgres.env` (base de Evolution; no se publica)
- **No** vuelvas a correr `infra/evolution/secretos.sh` si los archivos ya existen
- El Manager muestra además una key **por instancia**; para la API suele bastar la global

## 4. Comprobar que el servicio vive

```bash
ssh idiky@<ip> 'curl -s http://127.0.0.1:8086/salud'         # ok
ssh idiky@<ip> 'curl -s http://127.0.0.1:8086/revision.txt'  # commit publicado
```

Desplegar / redesplegar solo Evolution:

```bash
IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/idiky_despliegue \
  infra/desplegar.sh origin/main evolution
```

## 5. Enviar un mensaje de texto (prueba)

Número en formato internacional **sin** `+` ni espacios (Colombia: `57` + celular).

```bash
# En el servidor, con la key ya cargada (no la pegues en el historial compartido):
set -a; . ~/.config/idiky/secretos/evolution.env; set +a

curl -sS -X POST "http://127.0.0.1:8086/message/sendText/<nombre-de-la-instancia>" \
  -H "apikey: ${AUTHENTICATION_API_KEY}" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary '{"number":"57XXXXXXXXXX","text":"Hola desde IDIKY (prueba)"}'
```

Si el nombre de la instancia tiene espacios, codifícalo en la URL (`Justo%20Soto`).

**UTF-8:** el cuerpo tiene que ir en UTF-8. Desde PowerShell sin cuidado se rompen las tildes
(`está` → caracteres raros). Preferir `curl` en Git Bash o el envío desde el propio servidor.

Documentación de la API: rutas Evolution v2 (`/message/sendText`, `/instance/…`).

## 6. Estado actual de las instancias (Dev)

| Instancia | Uso | Notas |
|---|---|---|
| **`Idiky_whatsapp`** | **Oficial de IDIKY en Dev** (2026-11-21) | Línea exclusiva de la plataforma. OTP de ALICE y avisos del middleware salen por aquí. `EVOLUTION_INSTANCE=Idiky_whatsapp` |
| **Justo Soto** | Prueba personal de Justo (2026-11-14) | Ya **no** la usa el middleware; se puede dejar o borrar en el Manager |

No uses números de clientes reales en Dev. La API key **no** va en git: vive en
`evolution.env` / `bloky-api.env` (§3).

## 7. Si algo falla

| Síntoma | Qué mirar |
|---|---|
| El Manager no carga | Firewall 8086 / tu IP cambió |
| Login «Unauthorized» | API Key Global incorrecta; léela otra vez del `.env` |
| «Scan QR» sin código | Imagen ≥ v2.3.7; `comun.env` con `CONFIG_SESSION_PHONE_VERSION` y cache local (ya en `main`). Borrar instancia y crear otra |
| Mensaje no llega | Instancia desconectada en el Manager; volver a escanear QR |
| Tildes rotas | Envío sin UTF-8 (§5) |
| Poca RAM en el servidor | Apagar `evolution` (ADR-0033); no meterlo en BOB |

Logs: `podman logs --tail 80 idiky-evolution-api` (no copiar líneas con secretos al chat).

## 8. Código de ingreso de ALICE (OTP por WhatsApp)

Con `EVOLUTION_*` en `bloky-api.env`, el middleware usa Evolution para el código de
`POST /api/app/acceso/enviar-codigo` (no Twilio). ALICE pide solo el celular y verifica con
`POST /api/app/acceso/verificar-codigo` → Bearer (docs/20, T-132).

## 8b. Desde el middleware (buscar por celular y avisar texto libre)

**T-132 · RN-331.** El middleware no habla con WhatsApp a mano: busca a la persona en el
directorio y Evolution manda el texto a **su** celular registrado.

**Desde el 2026-11-21 (T-139) exige el token de administración** (el de BOB, `BLOKY_ADMIN_TOKEN`) fuera de
desarrollo: sin él responde `401`. Antes era una puerta abierta y cualquiera podía mandar texto libre desde
el WhatsApp de IDIKY a cualquier celular del directorio.

```http
POST https://bloky-dev.idiky.com/api/app/whatsapp/enviar
Authorization: Bearer <BLOKY_ADMIN_TOKEN>
Content-Type: application/json; charset=utf-8

{ "celular": "3001234567", "texto": "Hola desde IDIKY (prueba)" }
```

- `200` → `{ ok, persona: { id, nombre }, pista }`
- `401 no_autorizado` (sin el token) · `404 no_existe` · `422 invalido` · `502 whatsapp_fallo` · `503 sin_whatsapp`

Variables en `~/.config/idiky/secretos/bloky-api.env` (no en git):

| Variable | Valor en Dev (2026-11-21) |
|---|---|
| `EVOLUTION_URL` | `http://10.0.2.2:8086` (host desde el pod de BLOKY) |
| `EVOLUTION_API_KEY` | la misma `AUTHENTICATION_API_KEY` de `evolution.env` (no en git) |
| `EVOLUTION_INSTANCE` | **`Idiky_whatsapp`** (oficial) |

Para reaplicar los secretos en el servidor (sin imprimir la key):

```bash
ssh idiky@<ip> 'sh -s' < infra/evolution/configurar-bloky-evolution.sh
# luego redesplegar BLOKY para que el pod lea el .env
IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> IDIKY_REF_BLOKY=origin/develop \
  infra/desplegar.sh origin/main bloky
```

En ALICE: `lib/servicios/whatsapp/cliente.dart` (`App-Idiky`).

## 9. Pendiente (próximo paso)

1. ~~Número / instancia oficial de IDIKY~~ → **`Idiky_whatsapp`** (hecho 2026-11-21).
2. (Opcional) Túnel `evolution-dev.idiky.com` y actualizar `SERVER_URL` / `EVOLUTION_URL`.
3. (Opcional) Retirar la instancia de prueba «Justo Soto» del Manager si ya no hace falta.
