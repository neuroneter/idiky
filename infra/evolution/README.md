# infra/evolution — Evolution API (WhatsApp) en Dev

Servicio **`evolution`**: pod `idiky-evolution`, puerto **8086**.  
Por qué existe: [ADR-0033](../../docs/adr/0033-evolution-api-para-whatsapp.md) · T-131.  
Contrato del entorno: [`../nuevo-servicio.md`](../nuevo-servicio.md).

> **No va dentro de BOB.** Es un pod aparte. BOB (u otros) lo consumen por HTTP con la API key.

## Piezas

| Contenedor | Imagen | Memoria | Qué hace |
|---|---|---|---|
| `idiky-evolution-proxy` | `nginx:1.28-alpine` | 64 MB | Único con puerto: `/salud`, `/revision.txt`, reenvía a la API |
| `idiky-evolution-api` | `evoapicloud/evolution-api:v2.2.3` | 768 MB | Evolution API (Baileys / WhatsApp) |
| `idiky-evolution-postgres` | `postgres:15-alpine` | 256 MB | Base de Evolution (solo dentro del pod) |
| `idiky-evolution-redis` | `redis:7-alpine` | 128 MB | Caché / pub-sub (solo dentro del pod) |

Datos en `~/datos/evolution/{postgres,redis,instances}`.

## Instalar

1. **Firewall Lightsail:** abrir **TCP 8086** (Justo o Daniel en la consola de AWS), si se va a
   usar por IP. Con túnel Cloudflare (`evolution-dev.idiky.com` → `10.0.2.2:8086`) el puerto
   público puede no hacer falta, pero conviene dejarlo para depurar.
   **Hecho el 2026-11-13:** la regla abre el 8086 **solo a las IP de Justo y de Daniel**, no a
   todo internet. Si cambias de red, pídele a Daniel que actualice la regla.

2. **Secretos, una vez**, desde una copia de `idiky` con `infra/evolution/`:

   ```bash
   ssh idiky@<ip> 'sh -s' < infra/evolution/secretos.sh
   ```

   Completar `SERVER_URL` en `~/.config/idiky/secretos/evolution.env` (sin `CAMBIAR-POR…`).

3. **Desplegar solo este servicio** desde `origin/main` de `idiky`:

   ```bash
   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main evolution
   ```

## Comprobar

```bash
ssh idiky@<ip> 'curl -s http://127.0.0.1:8086/salud'            # ok
ssh idiky@<ip> 'curl -s http://127.0.0.1:8086/revision.txt'     # commit
# Con la API key (no la pegues en el historial compartido):
ssh idiky@<ip> 'curl -s -H "apikey: $CLAVE" http://127.0.0.1:8086/'
```

La clave está en `evolution.env` (`AUTHENTICATION_API_KEY`). El manager/API de Evolution
escucha detrás del proxy en `/`.

## Crear una instancia de WhatsApp (piloto)

1. Con la API key, crear una instancia (documentación Evolution v2: `POST /instance/create`).
2. Pedir el QR (`GET /instance/connect/<nombre>`) y escanearlo con un **número de prueba**.
3. No usar números de clientes reales en Dev.

## Si algo sale mal

| Síntoma | Qué es |
|---|---|
| `levantar.sh` se detiene por `CAMBIAR-POR` | Falta `SERVER_URL` real en `evolution.env` |
| `/salud` ok pero la API no responde | Ver `podman logs idiky-evolution-api` (Postgres/Redis) |
| El servidor se queda sin RAM | Apagar `evolution` o subir de plan; no meterlo en BOB |
| QR no carga desde fuera | Falta túnel HTTPS o `SERVER_URL` incorrecta |
