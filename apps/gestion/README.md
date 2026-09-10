# apps/gestion — Sistema de gestión de IDIKY

El sistema con el que **la empresa IDIKY administra su propio negocio**: clientes, contratos,
planes. **No es para las copropiedades** (esas usan `apps/pwa` y `apps/contable`) y **no es el
backend del producto** (ADR-0008, pendiente).

| | |
|---|---|
| **Qué es** | Strapi 5, edición Community (licencia MIT), en TypeScript |
| **Base de datos** | PostgreSQL 17 |
| **Por qué así** | [ADR-0012](../../docs/adr/0012-sistema-de-gestion-strapi.md): se comparó con Directus y se eligió Strapi por la licencia |
| **Tareas** | T-37 (el sistema) · T-38 (el módulo de auditoría) |
| **Dónde corre** | En el entorno de desarrollo, en el pod `idiky-gestion`, puerto 8082 ([`infra/README.md`](../../infra/README.md)) |

## La regla que más importa: el modelo se diseña en local

El *Content-Type Builder* de Strapi —donde se crean las colecciones y sus campos— **solo
funciona en modo desarrollo**, y lo que crea son **archivos** en `src/api/`. Por eso:

1. **Se modela en tu máquina**, con `npm run develop`.
2. **Se hace commit** de lo que Strapi generó en `src/api/` y `src/components/`.
3. **Se despliega**. En el servidor Strapi corre en modo producción, sin *Content-Type
   Builder*: cualquier colección creada ahí se perdería en el siguiente despliegue.

Los **datos** (los registros) no van a git: viven en PostgreSQL.

## Desarrollar en local

Necesitas Node 22 o 24 y un PostgreSQL 17. Lo más simple es PostgreSQL en un contenedor, con
los mismos datos de acceso que trae `.env.example`:

```bash
# Una vez
podman run -d --name gestion-postgres -p 127.0.0.1:5432:5432 \
  -e POSTGRES_DB=gestion -e POSTGRES_USER=gestion -e POSTGRES_PASSWORD=gestion_local \
  -v gestion-postgres:/var/lib/postgresql/data docker.io/library/postgres:17-alpine
# (con Docker es el mismo comando cambiando podman por docker)

cd apps/gestion
cp .env.example .env         # y cambia los secretos por valores al azar
npm install
npm run develop              # panel en http://localhost:1337/admin
```

La primera vez, el panel pide crear el administrador. **Ese usuario es solo de tu máquina.**

| Comando | Para qué |
|---|---|
| `npm run develop` | Desarrollo, con *Content-Type Builder* y recarga |
| `npm run build` | Compila el panel, como lo hace la imagen |
| `npm run start` | Modo producción, como en el servidor |
| `npm run strapi -- <comando>` | La CLI de Strapi |

## Lo que ya está configurado

| Dónde | Qué | Por qué |
|---|---|---|
| `src/index.ts` · `bootstrap` | Apaga en cada arranque el registro abierto de usuarios finales | Este sistema lo usa el equipo, que entra por el panel. El nginx del pod también bloquea la ruta |
| `config/server.ts` · `proxy.koa` | Confía en `X-Forwarded-For` cuando `IS_PROXIED=true` | Detrás de nginx, sin esto el límite de intentos de login bloquearía a todos a la vez |
| `.env.example` | Telemetría apagada y sin avisos comerciales en el panel | — |
| — | Se quitó `@strapi/plugin-cloud` | Es para desplegar en Strapi Cloud, y no se usa |

## Lo que no se hace aquí

- **No se activa el código Enterprise (`ee/`) de Strapi.** Lo que haga falta de ahí se construye
  aparte: la auditoría es T-38 y su diseño está en ADR-0012.
- **No se guardan secretos en el repositorio.** En el servidor los genera
  `infra/gestion/secretos.sh`.
- **No se cargan datos reales** en el entorno de desarrollo: es HTTP, en un servidor que no es
  de IDIKY.
