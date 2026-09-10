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

## En el entorno de desarrollo

Instalado el 2026-09-10.

| | |
|---|---|
| **Panel** | `http://<ip>:8082/admin`, **cuando el puerto 8082 esté en la regla `Dev` de Azure**. Mientras tanto, por túnel: `ssh -N -L 8082:127.0.0.1:8082 idiky@<ip>` y `http://localhost:8082/admin` |
| **Acceso** | El login de Strapi. **No** lleva la clave del entorno (ADR-0012) |
| **Superadministrador** | `admin@idiky.local`, creado el 2026-09-10 antes de abrir nada. Su clave la tiene el responsable de integración; **no está en el repositorio ni se comparte** |
| **Usuarios del equipo** | Los crea un administrador en el panel: *Settings → Administration panel → Users*. Cada persona con el suyo |
| **Datos** | PostgreSQL 17 dentro del pod, sin puerto hacia afuera. **Solo datos ficticios** |
| **Respaldo** | Diario a las 08:30 UTC; se guardan 7, en el mismo servidor |
| **Desplegar** | `infra/desplegar.sh`, como el resto |

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
| `config/server.ts` · `logger.updates` | Sin avisos de versión nueva | Las versiones se suben con un commit que cambia `package.json` |
| `.env.example` | Telemetría apagada y sin avisos comerciales en el panel | — |
| — | Se quitó `@strapi/plugin-cloud` | Es para desplegar en Strapi Cloud, y no se usa |

## La marca de IDIKY en el panel

El panel no debe parecer de Strapi. Los colores, el logotipo y el ícono salen de la identidad
que definió Mary para la PWA (`apps/pwa/src/estilos/tokens.css` y
`apps/pwa/src/componentes/Logotipo.tsx`). **Los productos no comparten código: si la
identidad cambia allá, se cambia aquí también.**

| Qué | Dónde | Cómo |
|---|---|---|
| Ícono de la pestaña | `favicon.png` (raíz del proyecto) | Copia de `apps/pwa/public/icono-192.png`. Strapi lo sirve en `/favicon.ico` |
| Logo del login | `src/admin/extensions/idiky-logotipo.svg` | La casa y la palabra «idiky», en azul con la puerta fucsia |
| Logo del menú | `src/admin/extensions/idiky-icono.svg` | Copia de `apps/pwa/public/icono.svg` |
| Colores del panel | `src/admin/app.tsx` · `theme` | Azul de marca en enlaces, foco y selección; violeta de acción en el botón principal; los fondos y bordes de la PWA |
| Textos | `src/admin/app.tsx` · `translations` | «Bienvenido a IDIKY», «Ingresar»…, en tú como la PWA. **Español por defecto** |
| Título de la pestaña | `src/admin/app.tsx` · `bootstrap` | «IDIKY Gestión» en vez de «Strapi Admin» y «… \| Strapi» |
| Fondo del login | `src/admin/extensions/marca.css` | El degradado y la silueta de las torres de la puerta de la PWA, tarjeta redondeada y botón en píldora |

**Lo que hay que revisar al subir de versión de Strapi.** Strapi solo deja configurar logos,
colores y textos. El título de la pestaña y el fondo del login se logran observando la página
(`bootstrap`) y con CSS que se apoya en la estructura del login, porque sus clases son
generadas. Si una versión nueva cambia esa estructura, **el panel sigue funcionando, pero el
login vuelve a verse de Strapi**: se revisa `marca.css`.

**Si alguien sube logos desde el panel** (*Settings → Overview → Customization*), esos mandan
sobre los del código. Para volver a los de IDIKY, se borran ahí.

**Las imágenes SVG llevan comentarios XML**, y un comentario XML **no puede tener dos guiones
seguidos**: el SVG quedaría inválido y el navegador no lo dibujaría. Ya pasó una vez.

## Lo que no se hace aquí

- **No se activa el código Enterprise (`ee/`) de Strapi.** Lo que haga falta de ahí se construye
  aparte: la auditoría es T-38 y su diseño está en ADR-0012.
- **No se guardan secretos en el repositorio.** En el servidor los genera
  `infra/gestion/secretos.sh`.
- **No se cargan datos reales** en el entorno de desarrollo: es HTTP, en un servidor que no es
  de IDIKY.
