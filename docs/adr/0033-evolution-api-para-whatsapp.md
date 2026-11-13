# ADR-0033 — Evolution API para WhatsApp en el entorno de desarrollo

- **Estado:** Aceptada (instalación en Dev)
- **Fecha:** 2026-11-12
- **Decide:** Justo (operador del entorno, con Daniel)
- **Relacionados:** [ADR-0011](./0011-entorno-de-desarrollo-en-contenedores.md),
  [ADR-0014](./0014-https-para-bloky-dev-con-tunel-de-cloudflare.md),
  [ADR-0029](./0029-entorno-de-desarrollo-en-aws-lightsail.md), T-131 ·
  [`infra/nuevo-servicio.md`](../../infra/nuevo-servicio.md)

## Contexto

Hace falta una instancia de [Evolution API](https://github.com/EvolutionAPI/evolution-api) en el
entorno de desarrollo para integrar WhatsApp (mensajes, QR de vinculación) sin meterla dentro de
BOB. Evolution es otro producto: API propia, PostgreSQL propio, Redis y sesiones en disco.

Meterla en el pod `idiky-gestion` mezclaría ciclos de vida (cada redespliegue de BOB tumbaría las
sesiones de WhatsApp), pelearía por RAM con Strapi y rompería el contrato de un servicio Idiky.

## Decisión

**Evolution API es un servicio propio del entorno**, no un contenedor de BOB:

| | |
|---|---|
| Carpeta | `infra/evolution/` (en el arnés `idiky`) |
| Pod | `idiky-evolution` |
| Puerto | **8086** (TCP; libre en 8086–8099) |
| Imagen API | `docker.io/evoapicloud/evolution-api:v2.2.3` (versión fija) |
| Piezas | nginx (proxy) · Evolution API · PostgreSQL 15 · Redis 7 |

```
pod idiky-evolution · red propia (slirp4netns)
│  publica :8086 → :80
├── idiky-evolution-proxy     nginx:1.28-alpine · 64 MB
│     /salud, /revision.txt; reenvia el resto a :8080
├── idiky-evolution-api       evoapicloud/evolution-api:v2.2.3 · 768 MB
│     volumen ~/datos/evolution/instances
├── idiky-evolution-postgres  postgres:15-alpine · 256 MB
│     volumen ~/datos/evolution/postgres
└── idiky-evolution-redis     redis:7-alpine · 128 MB
      volumen ~/datos/evolution/redis
```

### Reglas

1. **No usa la clave HTTP del entorno** (`auth_basic`): Evolution autentica con
   `AUTHENTICATION_API_KEY` (cabecera), igual que BOB con su login.
2. **Secretos fuera de git**, generados una vez con `infra/evolution/secretos.sh`.
3. **PostgreSQL y Redis solo dentro del pod** (sin puerto al host).
4. **Un número / instancia de prueba** en Dev; no producción ni datos reales de clientes.
5. **RAM acotada** (~1,2 GB del techo de `idiky`). Si el servidor se queda corto, se apaga este
   servicio o se sube de plan (ADR-0029), no se mete en BOB.
6. **HTTPS público** (webhooks y QR estables): ruta del túnel Cloudflare cuando haga falta
   (`evolution-dev.idiky.com` → `8086`), como BOB/BLOKY/Jitsi. Mientras tanto se usa
   `http://<ip>:8086` y hay que abrir **8086/tcp** en el firewall de Lightsail.

## Consecuencias

- Quien despliega: **responsable de integración o Justo**, solo este servicio:
  `infra/desplegar.sh origin/main evolution`.
- BOB, BLOKY o ALICE **consumen** Evolution por HTTP con la API key; no comparten base ni
  contenedor.
- WhatsApp (Baileys) no es un canal oficial de Meta Business API: sirve para **Dev y pruebas**.
  Un canal de producción se decide aparte (producto + cumplimiento).

## Alternativas descartadas

| Opción | Por qué no |
|---|---|
| Contenedor dentro del pod de BOB | Ciclo de vida y RAM mezclados; un `desplegar gestion` reinicia WhatsApp |
| Instalar Evolution a mano en el host | Fuera del contrato de ADR-0011; sin `/salud` ni despliegue reproducible |
| Twilio WhatsApp en lugar de Evolution | Ya hay Twilio para SMS; WhatsApp Business API es otro producto y otro costo. Evolution cubre el piloto técnico |
