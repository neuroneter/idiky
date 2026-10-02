# ADR-0012 — Sistema de gestión de IDIKY: Strapi 5 con PostgreSQL

- **Estado:** Aceptada
- **Fecha:** 2026-09-10
- **Tareas:** T-37 (el sistema), T-38 (el módulo de auditoría)
- **Nombre:** desde el 2026-09-10 este sistema se llama **BOB**, el *back office* de IDIKY. Las
  otras aplicaciones son **BLOKY** (las copropiedades) y **ALICE** (el propietario y residente);
  ver el glosario

## Contexto

Además del producto que se vende a las copropiedades (la PWA y la contable), **la empresa
IDIKY necesita gestionar su propio negocio**. En palabras del responsable de integración:
*«un sistema general que será quien desde la compañía IDIKI gestione el negocio; este no es
para las propiedades, solo es para la parte administrativa de IDIKI»*.

Es un **tercer producto**, con otro usuario (el equipo de IDIKY) y otro dominio: clientes,
contratos, planes. Lo que tiene que dar:

- Modelar entidades del negocio sin construir cada pantalla a mano.
- Un panel con usuarios y roles.
- Una API que otros sistemas puedan consultar; por ejemplo, qué copropiedades tienen el
  servicio activo.

Restricciones:

- **Costos**, hoy y al salir a producción.
- **El entorno de desarrollo es un servidor compartido y escaso** (ADR-0011): 1 núcleo y 3 GB
  para todo `idiky`, y unos 6 GB libres en un disco que comparte la base de datos de LangFlow.
- **No es el backend del producto.** Ese sigue siendo ADR-0008, pendiente.

## Decisión

**Strapi 5, edición Community (licencia MIT), sobre PostgreSQL 17**, en `apps/gestion/`. La
auditoría —quién cambió qué—, que Strapi Community no trae, **se construye como módulo propio**
(T-38).

## Alternativas consideradas

La comparación se hizo con las fuentes oficiales, consultadas el 2026-09-10.

| | **Strapi 5** | **Directus 12** | Construirlo a mano |
|---|---|---|---|
| **Licencia** | **MIT, open source** | **MSCL** (mayo de 2026): código visible, no open source; cada versión pasa a GPLv3 a los 4 años | La nuestra |
| **Costo self-hosted** | **Gratis, sin límites** de usuarios, roles ni registros | Gratis completo con el *Open Innovation Grant* (menos de US$5M de ingresos **y** menos de 50 empleados), con clave anual que se renueva si se sigue cumpliendo. Sin el grant: Core con 3 usuarios, 25 colecciones y 5 flows; Team, US$499/mes | Horas de desarrollo |
| **Cómo guarda los datos** | Estructura interna de Strapi (borrador y publicado en filas separadas) | Tablas SQL normales | Las que se diseñen |
| **Reportes con SQL** | Incómodos | Directos, con tableros incluidos | Directos |
| **Auditoría** | Solo en Enterprise | Incluida | Por construir |
| **Personalización con código** | Alta: controladores, servicios, plugins | Media: extensiones | Total |
| **Despliegue** | Imagen propia; compilar el panel pide memoria | Imagen oficial, sin compilar | Imagen propia |
| **Requisitos** | Mín. 1 núcleo / 2 GB / 8 GB; recomendado 2+ / 4 GB+ / 32 GB+ | Mín. 0,25 vCPU / 512 MB; recomendado 2 vCPU / 2 GB | Según lo construido |
| **Veredicto** | **Elegida** | Descartada por la licencia | Descartada: sin ADR-0008, sería empezar el backend por el lado equivocado |

**Por qué Strapi y no Directus**, que en lo técnico encajaba mejor en varios puntos: **la
licencia**. La de Directus cambió en 2023 y otra vez en 2026, y hoy el uso gratuito depende de
un umbral que se revisa cada año. El responsable lo resumió: *«si bien no trae la auditoría la
podemos crear y se dejaría realizar este módulo; me gusta mucho Directus pero el tema de la
licencia me preocupa un poco»*. Construir la auditoría es trabajo acotado y queda en manos de
IDIKY; una licencia que cambia, no.

## Consecuencias

### Lo que Strapi es aquí, y lo que no

- **Es** el panel y la API de los datos administrativos de IDIKY.
- **No es** contabilidad ni facturación electrónica ante la DIAN: eso no se construye en
  Strapi.
- **No es** el backend del producto de las copropiedades (ADR-0008). Si algún día lo
  pareciera, se discute antes de que pase por acumulación.

### El modelo de datos vive en git

El *Content-Type Builder* de Strapi **solo funciona en modo desarrollo**, y lo que crea son
archivos del proyecto (`src/api/*/content-types/*/schema.json`). Por eso:

- **El modelo se diseña en local** (`npm run develop`) y **se commitea**.
- **En el servidor Strapi corre en modo producción**, sin *Content-Type Builder*.
- Un tipo de contenido creado dentro del contenedor **se pierde** en el siguiente despliegue:
  los contenedores usan `--rm` (ADR-0011).

### PostgreSQL

- **Versión 17**, la que Strapi 5 recomienda (mínimo 14).
- **Una base de datos por sistema**, con su propio usuario, dentro de un mismo servidor
  PostgreSQL. Así se ahorra en producción, donde un solo servidor administrado puede alojar
  esta base y la del backend del producto.

### Versiones

- **Strapi 5** y **Node 24 LTS**. Strapi 5 soporta 22, 24 y 26; la 24 tiene soporte más largo
  que la 22, que usa la PWA (son productos distintos).
- **Imágenes con versión fija**, como exige `infra/nuevo-servicio.md`.
- **No se activa el código `ee/` de Strapi.** Lo que Enterprise trae y aquí haga falta se
  construye aparte.

### El módulo de auditoría (T-38): diseño propuesto, a validar al construirlo

| | |
|---|---|
| **Dónde se engancha** | Un *Document Service middleware* (`strapi.documents.use(...)`), registrado en `register()` de `src/index.js`. Intercepta `create`, `update` y `delete`; qué pasa con `publish`, `unpublish` y `discardDraft` **se verifica al construirlo** |
| **Por qué ahí y no en *lifecycle hooks*** | En Strapi 5 los hooks de base de datos se disparan varias veces por operación con borrador y publicado (crear publicado dispara *create* y *delete*). La auditoría quedaría llena de eventos que nadie hizo. Strapi indica que la mayoría de los casos deben pasar por el Document Service |
| **Qué guarda** | Fecha, usuario (id, correo y si es del panel o un token de API), acción, tipo de contenido (`uid`), `documentId`, **cómo estaba antes** (se lee antes de `next()`), **cómo quedó** (el resultado de `next()`) y el origen (ruta, IP) |
| **De dónde sale el usuario** | `strapi.requestContext.get()?.state?.user`. **Limitación conocida: en GraphQL llega vacío.** Mientras eso no se resuelva, el sistema no expone GraphQL, o esas operaciones se marcan sin usuario |
| **Cómo se protege** | Su colección **no pasa por el middleware** (sin recursión), **no es visible ni editable** en el Content Manager y **ningún rol** puede actualizar ni borrar registros. Se consulta por una vista propia. Como todo en este repositorio: **no se borran registros** |
| **Lo que no cubre** | Cambios hechos directo en la base de datos o con `strapi.db.query`, que no pasan por el Document Service. La auditoría cubre lo que entra por el panel y la API |
| **Datos personales** | Antes y después pueden contener datos de contacto de clientes: aplica la Ley 1581, y el tiempo de conservación queda por definir |

### En el entorno de desarrollo (ADR-0011)

Es **el primer servicio con datos que se guardan**, así que resuelve lo que
`infra/nuevo-servicio.md` §5 dejó «sin probar». Condiciones antes de desplegar:

1. **Un disco de datos en Azure solo para Idiky** (32 GB). Strapi pide mínimo 8 GB y en el
   disco compartido quedan unos 6 GB. Si PostgreSQL lo llenara, se caería LangFlow.
2. **Subir el techo de `idiky` a 2 núcleos y 5 GB.** Strapi pide mínimo 2 GB, y compilar su
   panel se queda sin memoria con facilidad. Es seguro: la unidad de LangFlow lo limita a 0,8
   de un núcleo y 4 GB, y el servidor tiene 4 núcleos y 15 GB.
3. **Strapi y PostgreSQL en un *pod***, con **PostgreSQL sin puerto hacia afuera**; volúmenes
   en el disco nuevo; secretos (`APP_KEYS`, `JWT_SECRET`, la contraseña de la base) fuera del
   repositorio; y **copia diaria con `pg_dump`**.
4. **Puerto 8082, sin la clave del entorno.** Aquí se había escrito que la clave protegería
   `/admin` y solo no podía ir delante de la API. **Era un error**: el panel de Strapi también
   manda su propio token en la cabecera `Authorization`, la misma que usa la clave, así que la
   clave rompería el panel entero. **La puerta es el login de Strapi**, y el superadministrador
   se crea antes de abrir el puerto en Azure (ver la revisión, abajo).
5. **Datos ficticios.** El entorno es HTTP, con clave compartida, en un servidor que no es de
   IDIKY. Los clientes y contratos reales van en producción, con HTTPS y copias de seguridad.

**Lo que se vuelve fácil:** modelar entidades y tener panel, roles y API sin construir
pantallas, sin costo de licencia y sin depender de condiciones comerciales.

**Lo que se vuelve difícil:** la auditoría y el historial se construyen y se mantienen; los
reportes con SQL directo son incómodos por la estructura interna de Strapi; y compilar el
panel pide recursos que el servidor compartido apenas tiene.

## Revisión — 2026-09-10: instalado en el entorno de desarrollo

El mismo día, con la autorización del responsable de integración (*«subamos el tope de idiky
y realicemos la instalación en el contenedor de la base de datos Postgres y los dos servicios»*).

**Cómo quedó**

| | |
|---|---|
| **Pod `idiky-gestion`** | nginx (el único con puerto, 8082) + Strapi 5.53 sobre Node 24 + PostgreSQL 17, hablándose por `localhost` |
| **Puertos en el servidor** | Solo 8082. **5432 y 1337 no aparecen**: comprobado con `ss` |
| **Imagen de Strapi** | Una sola etapa: con dos, sus ~700 MB de dependencias quedarían duplicados en disco. Corre sin root (usuario `node`) |
| **Techo de `idiky`** | Subió a 2 núcleos y 5 GB |
| **Secretos** | Generados una vez en el servidor (`infra/gestion/secretos.sh`), con permisos 600, fuera del repositorio |
| **Respaldo** | `pg_dump` diario a las 08:30 UTC; se guardan 7 |

**Lo que se midió**

| | |
|---|---|
| **Despliegue completo** | Unos 3 minutos. `npm ci` tarda 29 s y compilar el panel, 32 s |
| **Memoria de `idiky`** | Pico de 4,6 GB al construir, dentro de su techo de 5 GB. En reposo: Strapi 137 MB, PostgreSQL 92 MB |
| **LangFlow durante la construcción** | 200 en todas las muestras, entre 2 y 4 ms; `verificar-vecino.sh`, sin cambios |
| **Disco** | De 6,2 GB libres a 4,9 GB. Las seis imágenes del entorno suman 1,3 GB |
| **Arranque** | Strapi responde `/_health` 10 s después de crearse el pod; tras reiniciar el pod, 7 s |

**Lo que se comprobó**

- **Nadie más puede registrarse como administrador**: el superadministrador se creó por la API
  de primer uso antes de abrir el puerto, y un segundo intento responde 400.
- **El login funciona por HTTP**: la cookie de sesión de Strapi no lleva la marca `secure`.
- **La API pública responde 403** sin token.
- **El registro abierto de usuarios está apagado** en la base (`allow_register: false`), y nginx
  responde 403 en esa ruta.
- **Los datos sobreviven** a reiniciar el pod y a un redespliegue completo, que lo borra y lo
  recrea.
- **El respaldo es íntegro**: contiene las 41 tablas y el administrador.

**Lo que se hizo distinto de lo previsto**

- **Sin el disco de datos de Azure** (condición 1). Se instaló en el disco compartido con un
  freno: `levantar.sh` **no construye nada con menos de 3 GB libres**, y lo publicado sigue en
  pie. El disco propio sigue siendo necesario antes de cargar datos reales.
- **La clave del entorno no va delante de Strapi** (condición 4, corregida arriba).

**Lo que falta**

- ~~Abrir 8082 en la regla `Dev` de Azure y comprobar que Strapi ve la IP real de quien llega.~~
  **Hecho el mismo día**: la regla incluye 8082, y nginx registra la IP pública de quien llega,
  así que el límite de intentos de login cuenta por persona.
- **Sacar los respaldos del servidor**: hoy protegen de un error, no de perder la VM.
- **El responsable y las primeras entidades**, y después **el módulo de auditoría** (T-38).

## Fuentes

- [Strapi 5 — requisitos de despliegue](https://docs.strapi.io/cms/deployment)
- [Strapi — planes self-hosted](https://strapi.io/pricing-self-hosted)
- [Strapi 5 — Document Service middlewares](https://docs.strapi.io/cms/api/document-service/middlewares)
- [Strapi 5 — lifecycle hooks y Document Service](https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/lifecycle-hooks-document-service)
- [Strapi 5 — requests y `requestContext`](https://docs.strapi.io/cms/backend-customization/requests-responses)
- [Strapi issue #10027 — `ctx.state.user` vacío en GraphQL](https://github.com/strapi/strapi/issues/10027)
- [Strapi issue #23887 — memoria al compilar el panel](https://github.com/strapi/strapi/issues/23887)
- [Directus — cambio de licencia v12 (MSCL)](https://directus.com/resources/directus-v12-license-change)
- [Directus — precios y tiers](https://directus.com/pricing)
- [Directus — requisitos de self-hosting](https://directus.com/docs/self-hosting/requirements)
