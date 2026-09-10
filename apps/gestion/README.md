# apps/gestion — BOB, el back office de IDIKY

**BOB** es la aplicación con la que **la empresa IDIKY administra su propio negocio**: clientes,
planes, contratos, y el alta del Administrador y el Delegado de cada copropiedad. **No es para
las copropiedades**: esas usan **BLOKY** (el sistema de las copropiedades, por construir) y
**ALICE** (la app del propietario y residente). Tampoco es el backend de BLOKY (ADR-0008,
pendiente). Los nombres están en el glosario (`docs/02-glosario.md`).

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
| **Panel** | `http://<ip>:8082/admin`. El puerto está en la regla `Dev` de Azure desde el 2026-09-10 |
| **Acceso** | El login de Strapi. **No** lleva la clave del entorno (ADR-0012) |
| **Superadministrador** | Creado el 2026-09-10 como `admin@idiky.local`, antes de abrir el puerto; el responsable de integración lo cambió por sus datos. **No se comparte**: cada persona entra con su usuario |
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

## Qué hay en BOB

Lo que el refinamiento decidió que pertenece a BOB
([`docs/13-bob-copropiedades-y-contratos.md`](../../docs/13-bob-copropiedades-y-contratos.md)).
Construido el 2026-09-10.

| Tipo de contenido | Qué guarda |
|---|---|
| **Tipo de bien** | Catálogo de tipos de bien con **«se cobra»**. Arranca con apartamento, casa, local, oficina y consultorio (se cobran), y bodega, depósito, parqueadero y lote (no se cobran; el lote, por definir) |
| **Plan** | Nombre, condiciones, modalidad (`por_unidad` o `valor_fijo`), valor mensual, si restringe unidades y si está activo. Dura 12 meses |
| **Servicio adicional** | Nombre, descripción, valor mensual y si está activo. Dura 12 meses |
| **Copropiedad** | La ficha: NIT y dígito de verificación, tipo, uso, check de consejo de administración, estado, estrato, ubicación (componente con DIVIPOLA y geolocalización), resumen de bienes (componente repetible), unidades que se cobran, fotos y soportes |
| **Persona** | Quien ocupa un perfil raíz: nombre, documento, celular y correo. Existe una sola vez |
| **Asignación** | Una persona como **Administrador** o **Delegado** de una copropiedad, con su periodo, su estado, su soporte y, si aplica, la empresa administradora |
| **Contratación** | Un plan o un servicio adicional contratado. Guarda lo firmado y lo calculado |
| **Solicitud** | Pedidos de cambio o bloqueo de los perfiles raíz, con canal, soporte y resolución |

**Las reglas viven en el servidor** (`src/bob/middlewares.ts`), en un *middleware* del Document
Service. Se cumplen igual si el registro llega desde el panel, desde la API o desde otro código:

| Dónde | Regla |
|---|---|
| Copropiedad | El **dígito de verificación del NIT** se comprueba con el algoritmo de la DIAN. El estrato no va en uso comercial. En Colombia la ubicación exige el **DIVIPOLA de 8 dígitos**. Las **unidades que se cobran se calculan** del resumen de bienes, y un tipo de bien va una sola vez |
| Persona | El celular se guarda en formato internacional (un celular colombiano de 10 dígitos recibe el `+57`). No se repite el mismo documento |
| Asignación | **Un solo Administrador y un solo Delegado vigentes por copropiedad.** El Administrador y el Delegado no son la misma persona. El soporte del Delegado va con el check de consejo (acta del consejo o acta de la asamblea). Solo el Administrador puede ser una empresa. Una asignación finalizada lleva fecha de fin |
| Contratación | **Lo firmado se copia al contratar y no se edita**: si el plan cambia después, la contratación conserva su precio y sus condiciones. Se calculan el valor mensual total, el **prorrateo del primer mes con meses de 30 días** y la fecha de fin. Un plan que restringe unidades exige el máximo. No se contrata un plan inactivo |
| Solicitud | **El cambio de Delegado solo entra por `operaciones@idiky.com`.** Aprobar o rechazar exige la resolución |
| Todos | **Nada se borra**: se desactiva, se finaliza o se cancela |

Las reglas puras (dígito de verificación, celular, prorrateo, fecha de fin) están aparte, en
`src/bob/reglas.ts`, sin Strapi. **Las etiquetas, ayudas y columnas del panel** se definen en
`src/bob/panel.ts` y se aplican en cada arranque: si se cambian desde el panel, el siguiente
arranque las devuelve a lo que dice el código. Ahí también se siembran los tipos de bien.

**Lo que BOB no hace:** crear los perfiles internos de la copropiedad ni el árbol hasta la
unidad. Eso es de BLOKY.

### Probarlo

`scripts/probar-bob.mjs` levanta Strapi en tu máquina sobre una base SQLite desechable, recorre
las reglas (lo válido se acepta, lo inválido se rechaza con su mensaje) y borra la base al
terminar. No toca PostgreSQL ni el servidor:

```bash
cd apps/gestion
npm i --no-save better-sqlite3     # una vez; no cambia package.json ni el lockfile
node scripts/probar-bob.mjs        # 52 comprobaciones; sale con 1 si algo falla
```

**Al cambiar una regla, se corre antes de desplegar.**

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
| Título de la pestaña | `src/admin/app.tsx` · `bootstrap` | «BOB» en vez de «Strapi Admin», y «… \| BOB» en vez de «… \| Strapi». En el menú, «BOB · IDIKY». Se publicará en `bob.idiky.com` |
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

**El CSS del panel no se importa como hoja de estilos.** Con `import './algo.css'` la
compilación lo saca a un archivo aparte, pero el HTML que arma Strapi solo carga su
JavaScript y **nunca enlaza esa hoja**: el CSS existe en `dist/` y el navegador no lo ve. Se
importa como texto (`import css from './algo.css?raw'`) y `app.tsx` lo inyecta en un
`<style>` al arrancar. También pasó una vez.

## Lo que no se hace aquí

- **No se activa el código Enterprise (`ee/`) de Strapi.** Lo que haga falta de ahí se construye
  aparte: la auditoría es T-38 y su diseño está en ADR-0012.
- **No se guardan secretos en el repositorio.** En el servidor los genera
  `infra/gestion/secretos.sh`.
- **No se cargan datos reales** en el entorno de desarrollo: es HTTP, en un servidor que no es
  de IDIKY.
