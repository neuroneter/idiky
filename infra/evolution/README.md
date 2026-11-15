# infra/evolution — Evolution API (WhatsApp) en Dev

Servicio **`evolution`**: pod `idiky-evolution`, puerto **8086**.  
Por qué existe: [ADR-0033](../../docs/adr/0033-evolution-api-para-whatsapp.md) · T-131.  
**Cómo usarlo (Manager, API key, enviar mensajes):** [`../guia-de-evolution.md`](../guia-de-evolution.md).

> **No va dentro de BOB.** Es un pod aparte. BOB (u otros) lo consumen por HTTP con la API key.

## Piezas

| Contenedor | Imagen | Memoria | Qué hace |
|---|---|---|---|
| `idiky-evolution-proxy` | `nginx:1.28-alpine` | 64 MB | Único con puerto: `/salud`, `/revision.txt`, reenvía a la API |
| `idiky-evolution-api` | `evoapicloud/evolution-api:v2.3.7` | 768 MB | Evolution API (Baileys / WhatsApp) + Manager en `/manager/` |
| `idiky-evolution-postgres` | `postgres:15-alpine` | 256 MB | Base de Evolution (solo dentro del pod) |
| `idiky-evolution-redis` | `redis:7-alpine` | 128 MB | Disponible en el pod; Baileys en Dev usa cache local (QR) |

Datos en `~/datos/evolution/{postgres,redis,instances}`.

## Instalar / redesplegar

1. **Firewall Lightsail:** TCP **8086** abierto **solo a las IP de Justo y Daniel** (2026-11-13).
   Si alguien cambia de red, actualizar la regla.
2. **Secretos:** ya creados en el servidor (`evolution.env`, `evolution-postgres.env`).
   **No** volver a correr `secretos.sh` si existen.
3. Desde `origin/main` de `idiky`:

   ```bash
   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main evolution
   ```

## Comprobar

```bash
ssh idiky@<ip> 'curl -s http://127.0.0.1:8086/salud'            # ok
ssh idiky@<ip> 'curl -s http://127.0.0.1:8086/revision.txt'     # commit
```

Manager: `http://<ip>:8086/manager/` — detalle en la [guía](../guia-de-evolution.md).

## Si algo sale mal

Ver la tabla de la [guía §7](../guia-de-evolution.md#7-si-algo-falla). En corto: no meter Evolution
en BOB; si no hay QR, imagen v2.3.7 + `comun.env` actual; si faltan tildes, enviar en UTF-8.
