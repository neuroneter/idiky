# Guía de Evolution API — WhatsApp en el entorno de desarrollo

> Cómo entrar al Manager, cómo mandar un mensaje de prueba y dónde están los secretos.
> Decisión: [ADR-0033](../docs/adr/0033-evolution-api-para-whatsapp.md) · tarea **T-131**.
> Código del servicio: [`evolution/`](./evolution/) · registro en el servidor:
> [`servidor/levantar.sh`](./servidor/levantar.sh).

**Estado (2026-11-14):** el pod `idiky-evolution` está **desplegado** en Dev (imagen
`evoapicloud/evolution-api:v2.3.7`). Se probó enviar un texto por WhatsApp y **llegó**.
Mañana se vincula un **número telefónico dedicado de IDIKY** y se documenta aquí.

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
| **Justo Soto** | Prueba personal de Justo (2026-11-14) | Vinculada; se envió mensaje de prueba con éxito |
| *(mañana)* | **Número dedicado de IDIKY** | Se crea y se documenta aquí; la de prueba personal no es la de producto |

No uses números de clientes reales en Dev.

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

## 8. Pendiente (próximo paso)

1. **Número telefónico especial de IDIKY** para WhatsApp (Justo + Daniel).
2. Vincularlo en Evolution y anotar en esta guía el nombre de la instancia «oficial» de Dev.
3. (Opcional) Túnel `evolution-dev.idiky.com` y actualizar `SERVER_URL`.
