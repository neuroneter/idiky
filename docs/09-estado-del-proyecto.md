# 09 — Estado del proyecto (bitácora)

**Este es el documento que hay que leer primero al retomar el trabajo**, sea una persona
nueva o una sesión de IA distinta.

> Si en vez de retomar vienes a **entender o revisar la rama entera**, empieza por
> [`15-resumen-de-la-rama-de-mary.md`](./15-resumen-de-la-rama-de-mary.md): es el corte transversal —qué hay
> construido, qué se verificó contra la ley, qué está abierto— sin los 91 commits en orden.

---

## Estado actual

| | |
|---|---|
| **Versión** | v0.1 — demo PWA navegable + demo contable |
| **Fase** | 1 de 5 ([roadmap](./07-roadmap.md)) |
| **Productos** | `apps/pwa/` (Mary, la maqueta de ALICE y de la consola), `apps/contable/` (Jeimy), `apps/gestion/` (BOB) y, desde el 2026-09-21, **`apps/bloky/` + `apps/bloky-api/` (BLOKY Dev, el producto real, ADR-0013)** |
| **BOB** (back office de IDIKY) | **Instalado en el entorno de desarrollo**: Strapi 5.53 + PostgreSQL 17 en un pod, puerto 8082 y **`https://bob-dev.idiky.com`** (ADR-0014) ([ADR-0012](./adr/0012-sistema-de-gestion-strapi.md), `apps/gestion/`). Abierto al equipo, con la marca de IDIKY en el panel. Con el modelo de datos y, desde el 2026-09-21, **tres copropiedades de prueba** con sus perfiles raíz; faltan el responsable y el disco de datos (T-37) |
| **Foco actual** | **La app del propietario.** Las de administrador y portería se trabajan después (Mary, 2026-08-28) |
| **Contable** | Tres módulos: Cartera · Contabilidad (recaudos, pagos, ajustes, plan de cuentas) · Reportes. Partida doble sobre un PUC colombiano editable |
| **Backend** | **BLOKY tiene API propia desde el 2026-09-21** (`apps/bloky-api`, ADR-0008): Node + Fastify + PostgreSQL, lee BOB. Publicada en **`https://bloky-dev.idiky.com`** (túnel de Cloudflare, ADR-0014). **Desplegada y probada en el servidor de desarrollo** (pod `idiky-bloky`, puerto 8083, CU-B-01 contra el BOB real). El demo y la contable siguen con datos simulados en el navegador. |
| **Autenticación** | El **flujo** está dibujado —documento, clave de 4 números, código en dispositivo nuevo, activación y **huella**— pero **no autentica**: no se guarda ninguna clave. La huella sí es real (WebAuthn); falta el servidor que la comprobaría ([ADR-0004](./adr/0004-autenticacion-demo.md)) |
| **Casos de uso** | 71 documentados: 38 ✅ en el demo, 1 ✅ en BLOKY Dev (CU-B-01: SMS, Google y Microsoft probados con cuentas reales el 2026-09-21), 10 🟡 a medias, 21 ⬜ pendientes, 1 ⛔ retirado |
| **Reglas de negocio** | 97 del demo (RN-01…RN-97; RN-41 retirada) + 8 de BLOKY (RN-160…RN-167). RN-75 a RN-91 vienen de la contable; RN-92 a RN-97, de las asambleas y registros de Mary |
| **Compila** | Sí — `cd apps/pwa && npm run build` |
| **Entorno de desarrollo** | Los dos productos publicados en contenedores, con Podman sin root, en un servidor compartido que no se puede afectar. Abiertos al equipo con clave, por HTTP ([ADR-0011](./adr/0011-entorno-de-desarrollo-en-contenedores.md), [`infra/`](../infra/README.md)) |
| **Ortografía** | `cd apps/pwa && python3 herramientas/revisar-ortografia.py` — está en la definición de «terminado» |
| **Despliegue** | La contable se publica copiando la carpeta ([`14`](./14-despliegue-de-la-contable.md)). `infra/` está en la rama de infraestructura, no en `main` |

### Lo que funciona hoy

**Puerta:** ingreso con **clave de 4 números** —y solo la clave si el teléfono ya te conoce— ·
**huella** donde el aparato tiene lector · código de un solo uso en un dispositivo nuevo ·
activación y recuperación en tres pasos · **tamaño de la letra al 100 %, 125 % o 150 %**, que
aplica a toda la app (CU-R-26). Todo simulado salvo la huella, y cada pantalla lo dice.

**App del residente:** **registro de las personas de la unidad** —con foto del documento y de
la persona, que adjunta ella misma, y autorización de quien registró (CU-R-27, CU-R-28)— ·
inicio con resumen · estado de cuenta con saldo por cuota · pago simulado con recibo de caja
(PSE, Bre-B y tarjeta) · **informar un abono ya consignado diciendo a qué corresponde**
(CU-R-30) · **solicitudes** —zonas comunes, PQRS y el **paz y salvo, que se emite,
se ve y se guarda como PDF**— · **asambleas con votación ponderada por coeficiente y
asistencia según la modalidad** (CU-R-21) · cartelera de comunicados · autorización de
visitantes con código · consulta de correspondencia · consulta del coeficiente ·
**el proceso sancionatorio de su unidad, con descargos e impugnación** (CU-R-29).

**Consola del administrador:** **asambleas: convocar según la modalidad, instalar y ver la
asistencia con su coeficiente** (CU-A-12, CU-A-17) · **registro de propietarios**, con la tabla
de quién registró a quién (CU-A-26) · **el acta de la asamblea, armada con lo que exige el artículo 47**
(CU-A-20) · **catálogo de multas con su respaldo, y la reincidencia con el suyo** (CU-A-22) · **procesos sancionatorios con debido proceso completo** —notificar citando
la norma, oír, decidir, impugnar y dar firmeza (CU-A-23)— ·
tablero de indicadores ·
unidades y residentes con búsqueda,
ficha y vinculación · cartera con morosidad y estado de cuenta por unidad · **módulo de
pagos: bandeja de abonos por conciliar, imputación editable, recibos de caja y anulación
con traza** (CU-A-04, CU-A-27) · generación de
cuotas con previsualización **y la extraordinaria exigiendo el acta que la aprobó** (CU-A-05) ·
aprobación y rechazo de reservas · bandeja de PQRS con SLA ·
publicación de comunicados · registro y entrega de correspondencia.

**Aplicación contable (`apps/contable/`, se abre con doble clic):** cartera y recaudos con
abonos parciales · recibos de caja con anulación · gastos causados y pagos a proveedores con
comprobante de egreso y retenciones · comprobantes de ajuste con partida doble · PUC
colombiano editable en sus cinco niveles · tipos de comprobante con su asiento · estado de
resultados y situación financiera.

### Lo que NO existe

Backend, autenticación real, pagos reales, notificaciones push, apps nativas, presupuesto,
intereses de mora, informes exportables, modo oscuro. De la portería existe el puesto
(CU-P-01, CU-P-02) pero **no la minuta**: se valida el código del visitante, no se registra
el ingreso. Y **las dos aplicaciones todavía no intercambian información**: los abonos que la
contable muestra vienen sembrados (T-17).

Del núcleo declarado como alcance, **la mitad jurídica de la asamblea ya está construida**
—quórum, mayorías, poderes y acta, los cuatro verificados contra la Ley 675 entre el 9 y el 10
de septiembre—. Lo que falta ahí es de otra clase: el **PDF de verdad**, que espera al backend
([ADR-0006](./adr/0006-documentos-formales.md), ADR-0008); los documentos se ven en pantalla y
salen al imprimir, sin fingir una descarga.

### ⚠️ El demo v0.1 no es el producto

El demo se construyó sobre **supuestos de un conjunto residencial típico**, antes de tener
el levantamiento de requisitos. El 2026-08-26 el equipo declaró el alcance real
([`12-levantamiento-pendiente.md` §0](./12-levantamiento-pendiente.md)) y quedó claro que
**el demo cubre la mitad fácil del producto y no cubre el núcleo**:

| | |
|---|---|
| **Lo que el demo ya resuelve** | Cuota del mes, solicitudes al administrador (PQRS), zonas comunes |
| **Lo que el demo no resuelve y es el corazón del producto** | Asambleas completas (citación, transmisión, votación, poderes, acta) y documentos descargables |

Lo que hace difícil el producto no es la cartera: es que **una asamblea produzca decisiones
jurídicamente válidas**. Eso exige quórum verificable, poderes, votación ponderada por
coeficiente y un acta que resista revisión.

> 🔄 **Este párrafo decía «nada de eso está construido». Dejó de ser cierto el 2026-09-10.**
> Los cuatro están, y citando el artículo: quórum (RN-28, arts. 41 y 45), mayorías (RN-74,
> arts. 45 y 46), poderes por dos puertas (RN-30, y la ley **no fija tope**), y el acta
> armada con lo que exige el art. 47 (CU-A-20). De §3 bis quedan **dos** preguntas, las dos
> del reglamento de esta copropiedad, no de derecho general. Ver
> [`15-resumen-de-la-rama-de-mary.md`](./15-resumen-de-la-rama-de-mary.md) §4.

---

## Bitácora

> Formato: fecha · quién · qué se hizo · qué sigue. **Las entradas nuevas van arriba.**

### 2026-09-21 · BLOKY Dev · Sesión de IA (Claude) con el responsable de integración · Cómo se siente el primer día: «Arma tu copropiedad» (prototipo)

**La preocupación de Daniel:** que crear un edificio, un conjunto o sus unidades sea difícil para
un administrador. Quiere algo sencillo, novedoso e interactivo, «como un juego», que no se sienta
como configurar.

**La idea:** en vez de formularios, **una pregunta por pantalla con tarjetas grandes**, y a la
izquierda la copropiedad **se dibuja sola** con cada respuesta, con las siluetas del trazo de la
marca (BLOKY = bloques). Flujo: ¿qué es tu copropiedad? (edificio, torres, casas, mixto) → ¿cómo
está organizada? (patrones, no conceptos) → ¿cuántas torres, pisos, apartamentos por piso? (con
contadores, «todas iguales» por defecto y vista previa de los nombres) → **recompensa**: «96
apartamentos creados» y el edificio termina de construirse → ajustes finos sobre el dibujo
(tocar una torre, marcar locales en el primer piso, parqueaderos y depósitos como zona aparte) →
un **anillo de avance** con lo que falta (coeficientes, ubicación, fotos, régimen), todo
aplazable. Para las grandes, la **ruta experta**: arrastrar la hoja de Excel y ver el árbol antes
de confirmar. Lo que lo hace juego sin ser infantil: respuesta visual inmediata, hitos
celebrados, deshacer siempre y «puedes cambiarlo después». Sin motor de juegos: React, CSS y SVG.

**Tres prototipos clicables** en [`docs/prototipos/arma-tu-copropiedad/`](./prototipos/arma-tu-copropiedad/README.md)
(HTML sin dependencias, doble clic), en el orden en que se pensaron en la misma sesión:
`preguntas.html` (asistente de preguntas), `catalogo.html` (catálogo como armar un avatar, idea
de Daniel) e **`index.html`, la vigente: un terreno cuadriculado donde se arrastran torres,
manzanas, locales, parqueaderos y zonas comunes desde el catálogo, se sueltan donde van, y se
tocan para configurar** (pisos, apartamentos por piso, locales en el primer piso, cantidades),
mover, duplicar o quitar; anillo de avance y ruta experta «Importar». Encaja con el dominio: los
tipos de agrupación y de bien ya son catálogos de datos (docs/13 §6).

**Decisiones sobre la v3** (Daniel, misma sesión): **1)** el terreno es un **croquis que se
guarda**: la posición de cada torre, portería, entrada y zona común se conserva y servirá después
para el mapa, la portería y las fotos por zona; **2)** para las grandes bastan **Duplicar** e
**Importar desde Excel** (sin «agregar N torres»); **3)** el arrastre funciona **en computador,
tableta y teléfono**, con eventos de puntero (el prototipo, HTML5, solo sirve con ratón).
**A Daniel le gustó** («es lo que estaba pensando, se está haciendo divertido») y pidió
**asociaciones**: una zona común puede estar suelta o dentro de una estructura, varias zonas
comunes pueden formar una zona, los parqueaderos y locales pueden estar dentro de un edificio o
no, y los apartamentos se asocian a sus parqueaderos; y que se vea gráficamente. **Versión 4**
(`index.html`): dos relaciones con gestos distintos. **«Está dentro de»** (contención): soltar
encima de una torre o de una **Zona** lo mete dentro y se dibuja pegado. **«Pertenece a»**
(asignación): al tocar parqueaderos o depósitos se dibujan líneas hacia las torres asignadas,
con cantidad por torre y el resto de visitantes; el puesto por puesto queda para la ficha del
apartamento o el Excel. Encaja con docs/13 §6: un bien puede colgar de cualquier nivel, y un
parqueadero es bien privado o común de uso exclusivo asignado a una unidad. Pendiente: la
reacción de Daniel a la v4 y dos decisiones (dónde se asigna puesto por puesto; si al crear
parqueaderos se pregunta su naturaleza legal) para escribir el caso de uso «Armar la
estructura».

### 2026-09-21 · Integración · Sesión de IA (Claude) con el responsable de integración · El primer módulo con datos: «Configurar la copropiedad», decisiones

**Alcance acordado** (Daniel): lo que un administrador hace el primer día. Cinco piezas, en este
orden porque cada una necesita a la anterior: **1)** aprovisionar desde BOB (T-77, ADR-0015);
**2)** el **régimen legal como datos**: país + régimen; Colombia se siembra desde la Ley 675 de
2001 con el artículo citado en cada parámetro (tipos, usos, naturaleza de los bienes, cálculo de
coeficientes arts. 26-27, tolerancia del 100 %, consejo obligatorio art. 53, quórums); otro país
es otra fila; **3)** la **estructura y los bienes**: agrupaciones de cualquier profundidad y bienes
con tipo, naturaleza, área, matrícula y coeficiente, con **carga masiva desde hoja de cálculo**
(nadie escribe 1.200 apartamentos a mano); el coeficiente legal se captura del reglamento y el
sistema calcula una propuesta por área para comparar y valida la suma; **4)** **ubicación** en
mapa (lat/long ya está en la ficha de BOB), afinar el punto, marcar entradas y portería;
**5)** **galería de imágenes** con etiquetas (fachada, entrada, zona común, torre) reutilizables.

**Decisiones de herramientas** (cada una con su ADR al construirla):

- **Archivos: Cloudflare R2** (S3 compatible, sin cobro por descargas, sirve para fotos y
  documentos privados, ya viven en Cloudflare). Se descartó Cloudinary: cómodo para transformar
  imágenes, pero cobra por créditos que los documentos consumen igual y ata las URL. **Un bucket,
  una carpeta por copropiedad** (`copropiedades/<id>/galeria/…`, `…/documentos/…`): eliminar una
  copropiedad es borrar su carpeta, sin tocar las demás (pedido expreso de Daniel). Un bucket por
  copropiedad no sirve: R2 limita los buckets por cuenta. Miniaturas las hace BLOKY al subir.
- **Mapas: Google Maps** (proyecto IDIKY de Google Cloud, llave restringida por sitio).
- **El régimen de Colombia lo redacta la IA y lo revisa después alguien con criterio jurídico**
  al que se le dará acceso a BLOKY; los ajustes se aplican como migración de datos.

**R2 quedó configurado el mismo día** (Daniel, guiado): bucket `idiky-dev` (ubicación automática,
quedó en ENAM), acceso público desactivado, política CORS para `https://bloky-dev.idiky.com` y
`http://localhost:5173` (GET, PUT, HEAD), token `bloky-dev` de **lectura y escritura de objetos
solo en ese bucket**, sin vencimiento. Comprobado desde la Mac con una petición S3 firmada
(SigV4): lista el bucket, 200. Las cinco variables (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`) están en `bloky-api.env` del servidor (copia
previa `.antes-r2`); la API las usará cuando exista el módulo de archivos (ADR-0016).

**Google Maps quedó configurado el mismo día** (Daniel, guiado): proyecto `IDIKY` de Google
Cloud, **Maps JavaScript API** y **Geocoding API** habilitadas, llave restringida al sitio
`https://bloky-dev.idiky.com/*` (falta agregar `http://localhost:5173/*` para probar en local).
Comprobado: con ese sitio como referente, Google entrega la librería de mapas sin errores.
**Hallazgo:** una llave restringida por sitio **no sirve para los servicios de servidor** de
Google (la Geocoding API por HTTP responde «API keys with referer restrictions cannot be used
with this API»); en el navegador, la geocodificación se hace con el `Geocoder` de la propia
Maps JavaScript API, que sí la acepta. Si la API de BLOKY necesitara geocodificar del lado del
servidor, se crea una segunda llave restringida por IP. `GOOGLE_MAPS_API_KEY` está en
`bloky-api.env` del servidor (copia previa `.antes-maps`): la API la entregará a la app cuando
exista el módulo de ubicación (ADR-0017).

**Qué sigue:** la próxima sesión escribe los casos de uso del módulo, ADR-0016 (archivos en R2) y
ADR-0017 (Google Maps), y siembra el régimen de Colombia. Todo lo externo está resuelto.

### 2026-09-21 · Integración · Sesión de IA (Claude) con el responsable de integración · La capa de datos de BLOKY, decidida (ADR-0015, T-77)

**La pregunta de Daniel:** con el ingreso listo, ¿el stack aguanta todo lo que sigue, hace falta
un *middleware*, y cómo se manejan las dos fuentes (BOB para lo comercial, una base por
copropiedad para la operación) sin que los datos de una unidad se mezclen con los de otra?

**Respuesta y decisión** ([ADR-0015](./adr/0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md)):

- **La API ya es el *middleware***: la app no toca BOB ni la base; `apps/bloky-api` combina las
  dos fuentes. No hace falta otra capa; hace falta que esta crezca con orden. El stack (Node +
  Fastify + PostgreSQL, ADR-0008) cubre todo el alcance; lo que irá llegando con su ADR son
  tareas programadas, archivos, PDF/correo y PostgreSQL administrado.
- **Un esquema de PostgreSQL por copropiedad**, estructuralmente idéntico, más un esquema común
  con las sesiones y el **catálogo de copropiedades**. El repositorio se abre por copropiedad y el
  esquema sale del catálogo, nunca de la petición. Las grandes pueden mudarse a una base propia
  sin cambiar código (Daniel espera más de 500 copropiedades, muy diversas).
- **Se aprovisiona desde BOB con un botón** en la ficha de la copropiedad, que llama a una API de
  administración de BLOKY (token propio). Aprovisionada, el botón da paso a «Respaldar» y, si
  está retirada, «Eliminar» con código de un solo uso al superadministrador y respaldo previo.
  «Nada se borra» sigue: retirar es lo normal; eliminar, la excepción controlada.

**Cerrado en la misma sesión:** el superadministrador es el rol Super Admin de BOB (quien pide la
baja elige a quién va el código); la retención del respaldo la elige quien pide la baja (6
meses, 1 o 2 años); y la estructura evoluciona con migraciones versionadas por esquema, con la
disciplina de *expandir y contraer* y respaldo antes de migrar. La higiene de secretos y el túnel
sobrante quedan como pendientes de bajo riesgo por ser entorno de desarrollo.

**Qué sigue:** documentar los casos de uso (aprovisionar en BOB; estructura y
unidades en BLOKY) y construir T-77 junto con el primer módulo de datos.

### 2026-09-21 · BLOKY Dev · Sesión de IA (Claude) con el responsable de integración · Yahoo probado; iconos en las opciones de ingreso (CU-B-01)

**Yahoo funcionó** con una cuenta real en `https://bloky-dev.idiky.com`: los cuatro canales
(SMS, Google, Microsoft, Yahoo) están probados de punta a punta. Credenciales de Yahoo cargadas
en `bloky-api.env` (copia previa `bloky-api.env.antes-yahoo`).

**Iconos en «¿Cómo quieres confirmar que eres tú?»** (pedido de Daniel: que la elección sea
visual). `componentes/IconoCanal.tsx` dibuja los cuatro como SVG, del mismo tamaño, con las
marcas que cada proveedor permite en su botón de ingreso y el SMS en el azul de IDIKY. Sin
imágenes descargadas ni dependencias: no dependen de la red y escalan con la letra. La opción
pasa a fila (icono · texto · flecha), con foco visible.

**El panel de marca, rehecho** (Daniel: «falta algo»): BLOKY grande como nombre de la aplicación,
«El sistema de tu copropiedad» debajo, la frase de valor, los cuatro módulos como etiquetas y
«Una aplicación de idiky» como firma pequeña; siluetas más grandes. En el celular solo el nombre,
el lema y la firma.

**Dos pasos en vez de tres** (Daniel): «Documento» y «Autenticación». El «Código» del SMS no
era un paso aparte, es parte de autenticarse; con Google, Microsoft o Yahoo ni siquiera existe.

**Higiene pendiente (Daniel):** borrar el túnel sobrante en Cloudflare; regenerar los tres
secretos (Google, Microsoft, Yahoo), que pasaron por el chat de la sesión.

### 2026-09-21 · BLOKY Dev · Sesión de IA (Claude) con el responsable de integración · Yahoo, el tercer proveedor del ingreso (CU-B-01)

**Por qué:** Daniel quiere cubrir «los tres correos más usados en Latinoamérica»: Gmail,
Hotmail/Outlook y Yahoo. Outlook ya estaba cubierto por la aplicación de Microsoft (es la misma
cuenta personal que Hotmail, Live y MSN, y RN-167 ya los reconocía).

**Qué se hizo:** Yahoo entra como proveedor OpenID Connect igual que los otros dos
(`oidc.ts`: `request_auth`, `get_token`, `certs`, emisor `api.login.yahoo.com`). Diferencias
que quedaron resueltas: Yahoo se identifica ante su servidor de tokens con `Authorization:
Basic` (los otros lo hacen en el cuerpo; nunca las dos a la vez), y **no acepta retornos a
`localhost`**, así que solo se prueba en el entorno con dominio. `YAHOO_CLIENT_ID` y
`YAHOO_CLIENT_SECRET` en la configuración, ruta `/api/acceso/yahoo`, botón «Entrar con Yahoo»
en la puerta, RN-167 reconoce `yahoo.*`, `ymail.*` y `rocketmail.*`. La guía tiene su sección
«2 bis». Pruebas: dieciséis, todas pasan; la base no cambia (las columnas son texto).

**Estado:** desplegado sin credenciales (el botón no aparece hasta que existan). Pendiente:
Daniel registra la aplicación en developer.yahoo.com, se cargan los dos valores y se prueba con
un correo de Yahoo en una persona de prueba.

### 2026-09-21 · BLOKY Dev · Sesión de IA (Claude) con el responsable de integración · Los tres canales del ingreso funcionan: SMS, Google y Microsoft (CU-B-01 completo)

**Qué se hizo:** Daniel registró la aplicación en Microsoft Entra (pantalla por pantalla, con
la guía): registro `BLOKY` para «todos los usuarios de cuentas Microsoft» (lo que deja entrar a
Hotmail y Outlook), las dos direcciones de retorno y un secreto a 24 meses. Se cargaron
`MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` y `MICROSOFT_TENANT_ID=common` en
`bloky-api.env` (copia previa `bloky-api.env.antes-microsoft`) y se reinició el pod. Con un
Hotmail como correo de la persona de prueba María Camila Restrepo (CC 1000000002), **entró a
BLOKY con Microsoft** desde `https://bloky-dev.idiky.com`. Antes, en la misma sesión, había
entrado con Google (Olga, CC 1000000001) y por SMS.

**Estado de CU-B-01:** completo en el entorno de desarrollo, con los tres canales probados con
cuentas reales y la regla RN-167 (solo el proveedor del correo). Google sigue «en pruebas» en
su consola: solo entran los correos de la lista de usuarios de prueba, hasta que se publique.

**Pendientes de higiene, no urgentes:**
- **Regenerar los dos secretos** (Google y Microsoft) y reemplazarlos en `bloky-api.env`:
  durante el registro pasaron por el chat de la sesión de IA. Un minuto en cada consola.
- Borrar en Cloudflare el túnel que se creó por error (no es `idiky-dev`), si aún existe.
- El secreto de Microsoft vence en septiembre de 2028: anotado en T-76.

### 2026-09-21 · BLOKY Dev · Sesión de IA (Claude) con el responsable de integración · Entrar con Google funciona; solo se ofrece el proveedor del correo (RN-167)

**Qué pasó:** con el dominio y HTTPS listos, Daniel registró la aplicación en Google Cloud
siguiendo `infra/bloky/credenciales-google-microsoft.md` (proyecto `IDIKY`, pantalla de
consentimiento externa «en pruebas», cliente web con los dos retornos). Las credenciales se
cargaron en `bloky-api.env` del servidor (copia previa `bloky-api.env.antes-google`), se reinició
el pod y la puerta ofreció «Entrar con Google». Con su Gmail como correo de la persona de
prueba en BOB y como usuario de prueba en Google, **entró a BLOKY con Google** desde
`https://bloky-dev.idiky.com`. Primera sesión real por un proveedor externo.

**Regla nueva, RN-167** (pedida por Daniel al ver la pantalla): a la persona se le ofrece
**solo el proveedor de su correo**: Gmail → Google; Hotmail, Outlook, Live o MSN → Microsoft;
otro dominio → solo SMS. Antes, con las dos aplicaciones configuradas, todo el mundo habría
visto los dos botones. `proveedorDelCorreo` en `reglas.ts`, documentada en `docs/05`, dos
pruebas nuevas en `pruebas/humo.ts` (catorce en total, todas pasan).

**Qué sigue:** registrar la aplicación de Microsoft (paso E de la guía) y cargar sus valores;
poner un Hotmail u Outlook en una persona de prueba para verlo. Yahoo es posible (OpenID
Connect) y queda para cuando haya una persona real con Yahoo. Un dominio de empresa no se
sabe si es de Google Workspace o de Microsoft 365 mirándolo: si aparece el caso, se puede
deducir del registro MX.

### 2026-09-21 · Integración · Sesión de IA (Claude) con el responsable de integración · BLOKY Dev ya tiene HTTPS: `https://bloky-dev.idiky.com` (T-76, ADR-0014)

**Qué se hizo, en el orden en que pasó**

1. **DNS de idiky.com a Cloudflare** (Daniel, guiado paso a paso). Antes de mover: el dominio
   solo tenía la `A` de la web (`20.83.154.178`), sin correo ni `TXT`, así que el riesgo era
   mínimo. En Cloudflare quedaron `idiky.com` y `www` en «DNS only» (la web sigue directa) y
   se quitó el `CNAME _domainconnect` de GoDaddy. Servidores de nombres: `dale` y `olga`
   `.ns.cloudflare.com`. Propagó en minutos; Cloudflare lo marcó «Active» en menos de una hora.
2. **Túnel `idiky-dev`** creado en Zero Trust (Daniel). El token se guardó en el servidor con
   `infra/tunel/secretos.sh` (corregido: el script se copia primero y el token va por la
   entrada estándar; con `sh -s < script` se pisaban). Se probó la red antes de desplegar:
   `10.0.2.2` solo llega al servidor con `allow_host_loopback=true`; la IP privada de la VM
   llega con cualquier red. `levantar_tunel` quedó con esa opción.
3. **Desplegado** con `infra/desplegar.sh origin/main tunel`: `idiky-tunel` «Healthy» en el
   panel, cuatro conexiones con Cloudflare, `/ready` en `127.0.0.1:8084`. LangFlow igual
   antes y después.
4. **Ruta** `bloky-dev.idiky.com` → `http://10.0.2.2:8083` (Daniel, en el panel). Comprobado
   desde fuera: `/salud` 200, `/api/salud` 200, `/` 401 (la clave del entorno sigue),
   certificado válido de Cloudflare.
5. **`BLOKY_URL_PUBLICA=https://bloky-dev.idiky.com`** en `bloky-api.env` (copia previa en
   `bloky-api.env.antes-tunel`) y reinicio del pod. Desde ahora la cookie de sesión es
   `Secure`: **el ingreso solo funciona por el nombre**, no por `http://20.55.251.120:8083`
   (esa dirección sigue sirviendo la página, pero la sesión no se guarda).

6. **BOB también por nombre:** ruta `bob-dev.idiky.com` → `http://10.0.2.2:8082` en el mismo
   túnel (Daniel). Sin tocar el servidor: Strapi no tiene grabada su dirección y el nginx del pod
   pasa el `Host`. Comprobado: `/admin` 200 con sus recursos relativos, `/_health` 204, la API
   sin token 403. BLOKY sigue hablando con BOB por dentro (`10.0.0.4:8082`).

**Qué sigue:** registrar las aplicaciones de Google y Microsoft
(`infra/bloky/credenciales-google-microsoft.md`), cargar los cuatro valores en `bloky-api.env`,
reiniciar el pod y probar los tres canales. La PWA y la contable pueden tener nombre igual,
con una ruta más cada una, cuando Mary y Jeimy lo pidan.

### 2026-09-21 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · Camino a Google y Microsoft: HTTPS con túnel de Cloudflare (T-76, ADR-0014)

**Qué pasó:** al probar el ingreso a BLOKY en el servidor con los datos de prueba, la puerta solo
ofrece «Código por SMS». El responsable de integración quiere que la persona pueda entrar también
con su cuenta de Gmail o de Hotmail/Outlook (no un código al correo). Ese ingreso **ya está
construido** (CU-B-01, ADR-0008) y se enciende solo con las credenciales de las dos aplicaciones;
lo que lo tiene apagado es que Google y Microsoft **exigen `https://`** para devolver a la
persona, y BLOKY Dev vive en `http://20.55.251.120:8083`.

**Restricciones:** los puertos 80 y 443 son de LangFlow; no se puede configurar nada dentro de
Azure (la suscripción no es del equipo); sí se puede configurar `idiky.com`, que está en GoDaddy
apuntando a otra máquina (la página web).

**Qué se decidió y se dejó listo** ([ADR-0014](./adr/0014-https-para-bloky-dev-con-tunel-de-cloudflare.md)):

- **Un túnel de Cloudflare** como servicio nuevo del entorno, `infra/tunel/` (`cloudflared`
  con versión fija, sin puertos hacia internet, token en `~/.config/idiky/secretos/tunel.env`).
  Publica BLOKY Dev en **`https://bloky-dev.idiky.com`** sin abrir puertos, sin Azure y sin
  depender de la IP. Registrado en `levantar.sh` y `desplegar.sh` (`infra/desplegar.sh
  origin/main tunel`, solo el responsable de integración); su salud es `/ready` en
  `127.0.0.1:8084`. **Todavía no está desplegado**: falta el token.
- **La guía para registrar las aplicaciones** en Google Cloud y Microsoft Entra:
  `infra/bloky/credenciales-google-microsoft.md`. Microsoft se registra para «cualquier
  organización y cuentas personales», que es lo que deja entrar a Hotmail y Outlook.com.

**Qué sigue, y quién:**

1. Daniel: crear la cuenta de Cloudflare, agregar `idiky.com`, **revisar que queden la web y el
   correo (MX, TXT)** y cambiar los servidores de nombres en GoDaddy.
2. Daniel: cuando Cloudflare diga «activo», crear el túnel `idiky-dev` (Zero Trust → Networks →
   Tunnels), agregar el nombre público `bloky-dev.idiky.com` → HTTP `10.0.2.2:8083`, y pasar el
   token por canal privado.
3. Daniel: registrar las aplicaciones con la guía y pasar los cuatro valores por canal privado.
   Con ellos se prueba el flujo completo **en local** (`http://localhost:5173`) sin esperar el
   dominio.
4. Integración: `secretos.sh` del túnel, desplegar `tunel`, poner `BLOKY_URL_PUBLICA=https://bloky-dev.idiky.com`
   y las credenciales en `bloky-api.env`, redesplegar `bloky`, probar los tres canales.

### 2026-09-21 · BLOKY Dev · Sesión de IA (Claude) a pedido del responsable de integración · La puerta se adapta al aparato (CU-B-01, CU-R-26)

**Por qué:** al probar el ingreso en el servidor, la puerta era una tarjeta centrada sobre el
degradado, igual en todos los tamaños: en el computador quedaba pequeña y con mucho vacío, y no
decía qué es BLOKY ni en qué paso va la persona. El responsable de integración pidió una puerta
«súper bien diseñada para todos los dispositivos», manteniendo los colores.

**Qué se hizo** (`apps/bloky/`, sin dependencias nuevas, solo CSS y los tokens de ALICE):

- **Una sola puerta que cambia de forma** (`features/acceso/Puerta.tsx` + `estilos/base.css`):
  en el **celular**, la marca compacta arriba y el formulario como hoja blanca pegada al borde
  de abajo, con zonas seguras; en la **tableta** (desde 700 px), tarjeta centrada; en el
  **computador** (desde 960 px), dos paneles: la marca con una frase de valor y las siluetas a
  la izquierda, el formulario sobre blanco a la derecha.
- **Los tres pasos** (Documento · Cómo entras · Código) arriba del formulario, con el activo en
  fucsia y los hechos en azul.
- **Tamaño de la letra** (CU-R-26) en la puerta, como en ALICE: `estado/preferencias.ts`,
  `componentes/ControlTamanoTexto.tsx` y `componentes/SiluetaTorres.tsx` se copiaron del demo
  (ADR-0013). Misma clave de almacenamiento: quien escogió la letra en ALICE la encuentra igual.
- Comprobado con capturas a 390, 768 y 1440 px. `npm run build` pasa.

**Qué sigue:** desplegar `bloky` desde `main` cuando se integre; probar en un teléfono real el
comportamiento con el teclado abierto; y, en el interior, el control de letra en el perfil.

### 2026-09-21 · BLOKY Dev desplegado y probado · Sesión de IA (Claude) a pedido del responsable de integración · T-75 cerrada

**Qué se hizo:** se probó el ingreso a BLOKY (CU-B-01) en el servidor de desarrollo, contra el
BOB real y con las tres copropiedades de prueba sembradas esa misma tarde. Commit desplegado:
`dfc061e` (`/revision.txt`); el `205919c` que vino después solo toca documentación. El pod
`idiky-bloky` tiene sus tres contenedores arriba y `/api/salud` dice `ok`, entorno `produccion`,
canal `sms`. El 8083 responde desde afuera (Azure ya lo deja pasar).

**Qué respondió cada prueba** (por la API del pod, desde el contenedor de nginx):

| Prueba | Esperado | Respondió |
|---|---|---|
| Identificar CC 1000000001 (Olga Lucía Henao) | 200, rol `administrador`, canal `sms` con pista | 200 · «Conjunto Residencial Altos del Bosque» · `administrador` · pista `••• 0001` ✅ |
| Identificar CE 1000000004 (Sandra Milena Ortiz) | 200, rol `delegado` | 200 · «Edificio Torres del Parque» · `delegado` · pista `••• 0004` ✅ |
| Identificar CC 1000000005 (copropiedad suspendida, RN-162) | 403 `sin_acceso` | 403 `sin_acceso` ✅ |
| Identificar CC 999 (no existe) | 404 `no_registrado` | 404 `no_registrado` ✅ |
| Enviar código por SMS a CC 1000000001 | Falla: el celular es ficticio y el entorno es `produccion` | 500 `interno`; en el registro, «Twilio Verify respondio 403 al enviar el codigo». **Esperado**, no se insistió |
| `GET /api/sesion` sin cookie | 401 | 401 `sin_sesion` ✅ |
| nginx sin la clave del entorno: `/`, `/ingreso`, `/api/acceso/identificar` | 401 | 401 en los tres ✅ (la puerta del entorno sigue puesta; `/salud`, `/revision.txt` y `/api/salud` pasan sin clave, como está previsto) |

El tramo que en el servidor no se puede recorrer con un celular inventado —código correcto,
cookie `bloky_sesion` httpOnly, `GET /api/sesion` con cookie, `POST /api/salir` y el bloqueo
al quinto error (RN-166)— se recorrió en la Mac con `npm run probar` sobre el mismo commit,
contra un BOB simulado: **todo pasó**. `verificar-vecino.sh` después de las pruebas: LangFlow
sigue igual.

**Lo que no se hizo:** las pruebas por nginx **con** la clave del entorno. La clave no está en
claro en ningún sitio (solo su hash en `htpasswd`, README de infra §6), así que se probó la API
por dentro del pod y, por fuera, solo que nginx la exige. El recorrido en el navegador
(`/ingreso`) queda para cuando alguien con la clave lo abra.

**Qué sigue:**
- **Regenerar el token «bloky-api» en BOB** (Configuración → API Tokens): el actual se compartió
  por chat. Al cambiarlo, actualizar `BOB_API_TOKEN` en `~/.config/idiky/secretos/bloky-api.env`
  del servidor y redesplegar solo `bloky` (`infra/desplegar.sh origin/main bloky`).
- Para recibir el SMS de verdad, volver a correr `sembrar-pruebas.mjs` con las variables
  `PRUEBA_*` y un celular real (los datos reales quedan solo en BOB).
- Sugerencia menor para la API: cuando Twilio rechaza el envío, el registro guarda solo el
  código HTTP; guardar también el cuerpo de la respuesta ahorraría un viaje al panel de Twilio.
- Google y Microsoft siguen a la espera de credenciales y HTTPS (ADR-0008).

### 2026-09-21 · Datos de prueba en BOB · Sesión de IA (Claude) a pedido del responsable de integración · Tres copropiedades sembradas

**Qué se hizo:** se corrió `apps/gestion/scripts/sembrar-pruebas.mjs` (T-75, commit `5d41eca`)
dentro del contenedor `idiky-gestion-strapi` del servidor de desarrollo, contra el PostgreSQL de
BOB. Se eligió la opción de **datos ficticios**: la Administradora de la copropiedad activa es
una persona inventada, con un celular que no existe, así que ningún SMS sale de verdad. Todo se
creó a la primera (exit 0); el contenedor se mantuvo en ~190 MB de los 1,5 GB de tope.

**Qué quedó en BOB** (verificado por la API con el token de solo lectura y visible en
`/admin` → Content Manager → Copropiedad):

| Copropiedad | Estado | Perfiles raíz vigentes |
|---|---|---|
| Conjunto Residencial Altos del Bosque (Bogotá) | activa | Administradora Olga Lucía Henao (CC 1000000001) · Delegada María Camila Restrepo (CC 1000000002) |
| Edificio Torres del Parque (Medellín, con consejo) | en_implementacion | Administrador Jorge Enrique Valencia (CC 1000000003, empresa Administra Bien SAS) · Delegada Sandra Milena Ortiz (CE 1000000004) |
| Conjunto Mirador de la Sabana (Chía) | suspendida | Administrador Andrés Felipe Gómez (CC 1000000005) |

Además: cinco personas, el plan «Básico por unidad» y una contratación vigente de Altos del
Bosque. Los NIT, documentos y celulares son inventados (rangos 1000000001-5 / 3000000001-5).

**Para probar el ingreso a BLOKY (CU-B-01):** CC 1000000001 y CE 1000000004 deben entrar;
CC 1000000005 no debe entrar (copropiedad suspendida, RN-162). El código por SMS se ve en el
registro de la API mientras el entorno lo simule.

**Qué sigue:** el script es idempotente; si hace falta cambiar la Administradora de Altos del
Bosque por una persona real (para recibir el SMS), se vuelve a correr con las variables
`PRUEBA_*` y los datos reales quedan solo en BOB, nunca en el repositorio.

### 2026-09-21 · Incidente: BOB caído · Sesión de IA (Claude) a pedido del responsable de integración · No estaba caído

**Síntoma reportado:** Firefox decía «No se puede conectar» en `http://20.55.251.120:8082/admin`,
con la regla `Dev` del grupo de seguridad de Azure ya abierta para 8080-8083.

**Qué se revisó, como `idiky` y sin sudo:** el servidor lleva 59 días encendido (no se reinició),
tiene 4,9 GB libres y 12 GB de memoria disponible, `Linger=yes`. Las siete unidades de Idiky están
activas desde el 2026-09-10 con **cero reinicios**; `podman pod ps` muestra el pod `idiky-gestion`
corriendo con sus tres contenedores; en el servidor `/salud` responde 200 en 8080, 8081 y 8082 y
`/_health` de Strapi 204; `/revision.txt` dice `d6e05f2`, el último despliegue registrado. El
proxy de BOB tiene tráfico de internet en todas las horas del día (rastreadores incluidos) y
ningún error de nginx. Desde la Mac del responsable, `/admin` en el 8082 da **200**, doce
conexiones en paralelo dan 200, y el proxy registra esa misma IP pública llegando bien.

**Causa raíz:** no hubo caída de BOB ni del servidor. Lo que Firefox vio fue algo del lado del
cliente o del camino: lo más probable es que la prueba se hiciera **antes de que la regla `Dev`
terminara de aplicarse** (Azure tarda entre segundos y unos minutos en propagar un cambio del
grupo de seguridad) o desde una red que bloquea puertos altos.

**Qué se hizo:** nada en el servidor. No se reinició el pod porque estaba sano y la evidencia no
lo justificaba. `verificar-vecino.sh` antes y después: LangFlow sigue igual.

**Qué queda:** si a Daniel le vuelve a fallar, probar en una ventana privada de Firefox y, si
persiste, comparar con `curl -sI http://20.55.251.120:8082/admin` desde la misma máquina y red.
Dato aparte: en el 8083 no hay nada escuchando todavía (BLOKY Dev no se ha desplegado); la regla
ya lo permite.

### 2026-09-10 · Sesión de IA (Claude), a pedido de Jeimy · Lista para desplegar

**Qué se hizo**

Documentar la contable para que alguien que no la escribió pueda **publicarla en el servidor
de desarrollo** sin preguntar nada: [`14-despliegue-de-la-contable.md`](./14-despliegue-de-la-contable.md).

Lo que quedó escrito, y por qué cada cosa:

| Tema | Lo que hay que saber |
|---|---|
| Qué se publica | La carpeta `apps/contable/` **tal cual**. No hay construcción, y agregársela "ya que estamos publicando" rompe la única condición que la hace utilizable ([ADR-0010](./adr/0010-stack-aplicacion-contable.md)) |
| Qué necesita el servidor | Servir archivos estáticos y mandar `Cache-Control: no-cache`. Nada más: no necesita reescritura de rutas ni CORS |
| **La caché** | Los archivos no llevan hash en el nombre. Sin `no-cache`, después de desplegar la aplicación **abre, se ve bien y se comporta como la versión anterior** — un síntoma peor que un error |
| Los datos | `localStorage`, clave `idiky.contable.bd`: cada quien tiene los suyos, desplegar no los toca, y lo hecho con doble clic no aparece al entrar por HTTP (son orígenes distintos) |
| La semilla | Si cambia de forma, **subir `VERSION_ESQUEMA`** en `js/datos.js`, en el mismo commit: así cada navegador siembra de nuevo solo |
| Qué revisar después | Seis puntos de cinco minutos. El que importa: estado de situación financiera con **descuadre 0** — si no lo está, algún `js/` no llegó o llegó viejo, y la consola dice cuál |

**Un arreglo de despliegue.** Al servir la aplicación por HTTP, cada visita dejaba un `404`
de `favicon.ico` en el registro del servidor: el navegador lo pide solo cuando la página no
declara icono. Ahora `index.html` trae el icono **incrustado como SVG**, con los colores de
marca: no es una petición más, y el registro queda limpio.

**Verificación** — las ocho suites de Chromium siguen pasando. Además, servida bajo una
subruta (`/idiky/contable/`) en un servidor HTTP de verdad: carga, concilia un abono, emite
el recibo, los estados cuadran y **no pide ni un archivo que no exista**.

**Lo que apareció al revisar las ramas**

- La rama de Mary ya estaba **integrada en `main`** por completo.
- **`infra/` no está en `main`**: vive en la rama de infraestructura
  (`claude/infra-podman-1wkn5z`), junto con ADR-0011 (entorno en contenedores) y ADR-0012
  (BOB, el back office con Strapi). Ahí ya está previsto el contenedor de la contable, con su
  `nginx.conf` y el `no-cache` puesto, y el script `infra/desplegar.sh` que publica un commit.
- Por eso, al cerrar esta sesión, `main` tiene la contable al día pero **todavía no tiene con
  qué desplegarla**. Falta integrar la rama de infraestructura (T-35).

**La numeración, después de integrar.** Esta rama traía la numeración anterior de la contable
y adopta la de `main`: **RN-26…RN-42 son RN-75…RN-91**, **T-10…T-22 son T-20…T-32**,
CU-R-18 es CU-R-30, CU-A-18 es CU-A-27 y **ADR-0006 es ADR-0010**. Las tareas nuevas de esta
sesión entran en el rango libre: **T-40** (menú de tres entradas) y **T-41** (guía de
despliegue). Integrar la infraestructura y desplegar ya tenía número: es **T-35**.

**Qué sigue**

1. Integrar la rama de infraestructura en `main` y desplegar (T-35).
2. Declarar y pagar a la DIAN las retenciones acumuladas en `2365` y `2368` (T-31).
3. Crear y editar tipos de comprobante desde la pantalla (T-29).

### 2026-09-10 · Sesión de IA (Claude), a pedido de Jeimy · Un solo módulo de Contabilidad

**Qué se hizo**

El menú pasó de **ocho entradas a tres**: Cartera · Contabilidad · Reportes.

Cada documento tenía su propia ventana —recaudos, recibos de caja, gastos, pagos, ajustes,
plan de cuentas— y el administrador tenía que saber en cuál estaba lo que buscaba. Ahora se
agrupan por **lo que uno hace**, no por el tipo de documento:

| Sección de Contabilidad | Qué reúne |
|---|---|
| **Recaudos** | Los abonos por conciliar arriba y el libro de recibos abajo, **en la misma página**. Conciliar un abono y revisar su recibo es un trabajo, no dos ventanas. |
| **Pagos** | El ciclo completo de la plata que sale: gastos causados → cuentas por pagar → comprobantes de egreso → proveedores. |
| **Ajustes** | Igual que antes. |
| **Plan de cuentas** | Igual que antes. |

Cartera y Reportes se quedaron fuera a propósito: son de **consultar**, no de registrar, y
son lo que más se abre. Meterlas dentro las habría enterrado un nivel.

**Un detalle que apareció al juntar:** en la sección de Pagos convivían una pestaña "Por
pagar" y un filtro "Por pagar" de la lista de gastos, en la misma pantalla. La pestaña se
renombró a **"Cuentas por pagar"**. También se quitó la fila de indicadores del libro de
recibos, que repetía lo que ya dice la de arriba en la página combinada.

**Verificación** — ocho suites en Chromium, todas pasan. La nueva comprueba que el menú
quede en tres entradas, que Contabilidad agrupe las cuatro secciones, que en Recaudos se
pueda conciliar un abono y ver su recibo aparecer en el libro de abajo sin cambiar de
ventana, que en Pagos se registre un gasto y quede en cuentas por pagar, y que los enlaces
que cruzan de un módulo a otro abran la sección correcta. Los estados siguen cuadrando.

**Nota técnica:** `vista-contabilidad.js` no pinta nada por su cuenta — lleva la sección
activa y le pasa el contenedor a la vista que corresponde. Cada pantalla sigue viviendo en su
propio archivo, así que esto fue una reorganización del menú, no una reescritura.

**Qué sigue**

1. Declarar y pagar a la DIAN las retenciones acumuladas en `2365` y `2368` (T-31).
2. Crear y editar tipos de comprobante desde la pantalla (T-29).
3. Abono parcial a un gasto: hoy o se paga completo o no se paga.
### 2026-09-10 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · Cada quien despliega lo suyo desde main (T-35)

**El pedido:** *«documenta todo para que tanto Mary como Yei puedan desde sus espacios de trabajo
pedir cargar lo que llevan en main y desplegar directamente en el servidor»*. Con una precisión
que ordena todo: *«lo que Yei y Mary están haciendo son mockups; no serán los espacios de
desarrollo, estos no están creados todavía»*.

**Antes de documentar hubo que arreglar el despliegue**, porque no era seguro que cada una lo
usara sola:

- **`desplegar.sh` publicaba los tres servicios a la vez.** Mary, al publicar su maqueta, habría
  reconstruido BOB con lo que tuviera su rama.
- **Y eso podía borrar datos.** Se verificó en el código de Strapi: su comparación de esquemas
  **elimina las tablas y columnas** que el código con el que arranca no tiene. Desplegar BOB desde
  una rama sin sus tipos de contenido se habría llevado copropiedades, personas y contratos.
- **Dos despliegues simultáneos** pisaban la misma carpeta del servidor.

**Cómo quedó:**

| | |
|---|---|
| **Por servicio** | `infra/desplegar.sh <rama> <pwa\|contable\|gestion\|todo>`: los servicios que no se nombran no se tocan |
| **BOB solo desde `main`** | Se niega a publicar `gestion` desde un commit que no esté en `origin/main`; forzarlo exige `IDIKY_GESTION_FUERA_DE_MAIN=si` |
| **Respaldo antes de recrear BOB** | Si el respaldo falla, no se toca el pod. Los previos al despliegue se guardan aparte (5) de los diarios (7) |
| **Un despliegue a la vez** | `flock` en el servidor: el segundo se detiene sin tocar nada |
| **Registro** | `~/despliegues/registro.tsv`: fecha, persona, rama, commit, servicios y resultado. Se guardan las últimas 3 copias |
| **Acceso** | `autorizar-llave.sh` agrega la llave **pública** de una persona, sin sudo y sin repetirla |

**Probado en el servidor, una cosa por vez:** los tres rechazos (sin servicio, servicio
desconocido, BOB fuera de `main`); publicar solo `pwa`, con la contable y BOB conservando su
revisión y **el pod de BOB sin reiniciarse**; un segundo despliegue frenado por el candado; BOB con
el permiso explícito, con **respaldo previo de 44 KB** y los datos intactos; y una llave de prueba
que se autorizó, entró, se quitó y dejó de entrar. LangFlow, igual a la foto base al final.

**La guía**, [`infra/guia-de-despliegue.md`](../infra/guia-de-despliegue.md), está escrita para
que Mary y Jeimy —o su IA— la sigan paso a paso: quién despliega qué, la llave SSH de la primera
vez, la foto de LangFlow antes y después, qué hacer con cada mensaje de error, qué no se hace, y la
frase para pedírselo a Claude Code. `CLAUDE.md` le recuerda a cualquier IA las tres reglas: solo el
servicio de quien lo pide, solo desde `main`, y LangFlow antes y después.

**Lo que se dejó escrito para no confundirse:** `pwa` y `contable` son **maquetas**. **BLOKY y
ALICE todavía no tienen espacio de desarrollo**; cuando se creen, tendrán su propio servicio,
puerto y responsable.

**Qué falta para que Mary y Jeimy desplieguen:**

1. **Integrar esta rama a `main`.** Hoy `infra/`, BOB y la guía viven en
   `claude/infra-podman-1wkn5z`, que se integra sin conflictos. Sin eso, desde `main` no hay qué
   desplegar.
2. **Sus llaves públicas**, autorizadas con `autorizar-llave.sh`.
3. **La dirección del servidor y la clave del entorno**, por un canal privado.
4. **Jeimy puede no tener `git` ni `ssh`** (ADR-0010): mientras no exista el despliegue automático,
   el responsable de integración despliega por ella.

---

### 2026-09-10 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · BOB ya crea copropiedades, perfiles raíz, planes y contratos (T-37, T-39)

**El pedido:** *«generemos los ajustes ahora en BOB para que podamos ver un poco cómo se crean
estos perfiles, la creación de los planes, etc., lo que pertenece a BOB»*.

**Qué quedó en BOB.** Ocho tipos de contenido —tipo de bien, plan, servicio adicional,
copropiedad, persona, asignación, contratación y solicitud— y dos componentes, ubicación y bien
por tipo. Todo sale de [`13-bob-copropiedades-y-contratos.md`](./13-bob-copropiedades-y-contratos.md)
y el detalle está en `apps/gestion/README.md`.

**Las reglas viven en el servidor**, en un middleware del Document Service, no en los
formularios. Se cumplen igual si el registro llega por el panel, por la API o por otro código:

- **El dígito de verificación del NIT** se comprueba con el algoritmo de la DIAN.
- **Las unidades que se cobran se calculan** del resumen de bienes: parqueaderos, depósitos y
  bodegas no suman.
- **Un solo Administrador y un solo Delegado vigentes por copropiedad**, que no pueden ser la misma
  persona. El soporte del Delegado depende del check de consejo, y solo el Administrador puede
  ser una empresa.
- **Lo firmado se copia al contratar y no se edita**: subir la tarifa del plan no cambia una
  contratación. Se calculan el total, el prorrateo con meses de 30 días y la fecha de fin.
- **El cambio de Delegado solo entra por `operaciones@idiky.com`.**
- **Nada se borra.**

**Cómo se probó antes de tocar el servidor.** Strapi se levantó en local sobre una base SQLite
desechable, con `better-sqlite3` instalado sin guardarlo en el proyecto, y un script recorrió las
reglas: **52 de 52 comprobaciones**, cada una aceptando lo válido y rechazando lo inválido con su
mensaje. El script quedó en `apps/gestion/scripts/probar-bob.mjs` para repetirlo al cambiar una
regla. La prueba encontró un error de tipos antes del despliegue, no después.

**Verificado en el servidor:** Strapi respondió en 5 s; están las diez tablas nuevas; los nueve
tipos de bien quedaron sembrados (se cobran apartamento, casa, local, oficina y consultorio); las
etiquetas en español y las columnas quedaron guardadas en el panel; la API pública de los tipos
nuevos responde 403; y LangFlow sigue igual a la foto base.

**Decisiones de implementación que quedaron escritas en docs/13 §8:** los 12 meses cuentan desde
el día del contrato; el prorrateo usa la convención comercial (el 1 es mes completo y el 31 cuenta
como 30); una contratación solo edita su estado, sus notas y el contrato firmado; y el lote quedó
sin cobro mientras se decide.

**Las etiquetas del panel están en código** (`src/bob/panel.ts`) y se aplican en cada arranque:
lo que se cambie desde el panel vuelve a lo que dice el código.

**Qué sigue:** que el equipo cree en BOB una copropiedad de prueba con sus dos perfiles raíz, un
plan y una contratación, y diga qué sobra o falta; resolver lo abierto de docs/13 §7 (los dos
choques con reglas existentes, IVA, renovación, bordes del prorrateo); y el módulo de auditoría
(T-38).

---

### 2026-09-10 · Integración · Sesión de IA (Claude) con el responsable de integración · BOB, BLOKY y ALICE, y lo que BOB tiene que saber de una copropiedad

**Los nombres.** Al hablar de «el administrador de IDIKY» y «el administrador de propiedades»
la conversación se enredó: eran dos sistemas con casi el mismo nombre, y llegó a parecer que
Strapi usaría Twilio. El responsable propuso bautizarlos, y quedaron así:

| | Qué es | Quién entra y cómo |
|---|---|---|
| **BOB** | El *back office* de IDIKY (Strapi, `apps/gestion`) | El equipo de IDIKY, con el login de Strapi. **No usa Twilio** |
| **BLOKY** | El sistema de las copropiedades (por construir; backend en ADR-0008) | Administrador, Delegado y los perfiles que ellos creen: **un código por SMS o por correo, o Google o Microsoft** |
| **ALICE** | La app del propietario y residente (hoy, el demo de `apps/pwa`) | Propietarios y residentes |

Se descartó «NIDO» para BLOKY (el responsable quería algo que aludiera a las unidades) y
«BLOCK» tal cual, porque en programación es una palabra corriente y confunde las búsquedas.
**BLOKY** sale de «bloque» y de la terminación de IDIKY. La página web será **IDIKY**, y todo
se presenta como aplicaciones de IDIKY.

**El panel de Strapi pasó a llamarse BOB**: la pestaña dice «BOB», el menú «BOB · IDIKY» y el
login «BOB · ingresa con tu cuenta» (antes, «IDIKY Gestión» y «Sistema de gestión»). Se
publicará en **`bob.idiky.com`**; en palabras del responsable, *«funcionalmente el usuario ya lo
entenderá»*. El dominio y HTTPS siguen pendientes (T-35).

**Lo que se decidió sobre cómo entra una copropiedad a BOB** (refinamiento en curso):

- **Planes**: nombre, condiciones y modalidad **por unidad** o **valor fijo**. **Servicios
  adicionales** (asesoría financiera, legal…) con valor mensual y **12 meses** de duración. El
  precio **se copia al contratar**, como en el resto del proyecto (RN-37, RN-85).
- **Se cobra solo por unidades residenciales o comerciales.** Parqueaderos, depósitos y zonas
  comunes no cuentan, siguiendo el criterio de la Ley 675 (art. 53).
- **BOB crea solo dos perfiles por copropiedad: el Administrador y el Delegado.** «Delegado»
  porque la Ley 675 **no crea la figura de presidente del consejo**, y el consejo solo es
  obligatorio en comerciales y mixtas de más de 30 bienes privados: la copropiedad lleva un check
  «tiene consejo de administración», y con él el Delegado es el presidente del consejo; sin él,
  lo nombra la asamblea (verificado en la norma).
- **El Delegado puede pedir desde BLOKY el retiro o bloqueo del Administrador**, pero **el nuevo
  lo crea IDIKY en BOB**. Al construir esa solicitud debe cumplir la ley: el administrador lo
  remueve la asamblea, o el consejo si existe (art. 50), así que va con el acta.
- **Un administrador puede tener varias copropiedades**, y en pocos casos ser además propietario
  o residente: la persona existe una vez y tiene asignaciones por copropiedad.
- **BOB guarda la ficha y el resumen** (cuántos bienes de cada tipo, para cotizar y cobrar);
  **el árbol completo hasta la unidad nace en la implementación y es de BLOKY**.
- **Ubicación**: dirección, geolocalización, **DIVIPOLA de 8 dígitos** (departamento, municipio,
  centro poblado), estrato (1 a 6, solo uso residencial) y fotos.
- **Jerarquía propuesta**: agrupaciones de cualquier profundidad (etapa, torre, bloque, manzana,
  piso…) con tipos que son datos, y bienes con su **naturaleza**: un parqueadero puede ser bien
  privado con coeficiente o bien común de uso exclusivo sin él (art. 22).
- **Ingreso a BLOKY**: **un solo código por intento**, por el canal que la persona elija, para
  no pagar dos envíos. Las credenciales de Twilio Verify ya están en el servidor
  (`infra/servidor/cargar-integraciones.sh`) y **un SMS de prueba salió desde allá**; todavía
  no las usa ningún servicio.

**Y en la misma sesión se respondieron las cinco preguntas que quedaban**, y todo quedó reunido
en [`13-bob-copropiedades-y-contratos.md`](./13-bob-copropiedades-y-contratos.md):

- **El cambio del Delegado se pide a `operaciones@idiky.com`**: como es el superusuario de
  BLOKY, no hay quién lo pida desde adentro.
- **Se cobra por las unidades del contrato.** Si el contrato fija un rango y el plan lo
  restringe, **BLOKY no deja cargar unidades facturables por encima del máximo**.
- **Todo plan dura 12 meses**, y el primer mes se **prorratea con meses de 30 días**.
- **El Administrador crea en BLOKY todos los perfiles internos**; el Delegado tiene lo mismo, más
  la solicitud de cambio o bloqueo del Administrador.
- **Oficinas y consultorios se cobran; bodegas, parqueaderos y zonas comunes no.**

**Dos de esas respuestas chocan con reglas que ya existen**, y quedaron como pendientes en vez de
darse por hechas: si «lo mismo que el Administrador» alcanza los actos que el repo reserva al
administrador (RN-49, el debido proceso de CU-A-23), y si «todos los perfiles internos» quita al
propietario el registro de las personas de su unidad, que Mary ya construyó (CU-R-27, RN-63).
Siguen abiertos también el IVA, la renovación y los bordes del prorrateo.

**Dos cuidados con Twilio:** el servicio de Verify se llama «OKMor» y así firma los SMS, así que
conviene uno llamado IDIKY; y el Auth Token pasó por la conversación al quedar en la plantilla,
así que conviene regenerarlo (o pasar a una API Key) y volver a subirlo.

---

### 2026-09-10 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · El panel de Strapi con la marca de IDIKY (T-37)

**El pedido:** con el puerto 8082 ya abierto y el superadministrador cambiado por sus datos, el
responsable pidió *«que este login parezca de IDIKY no de Strapi, lo mismo con el ícono tanto
de la página de inicio como de la pestaña del explorador»*, revisando los estilos de Mary. Al
ver el primer resultado agregó: *«poner el mismo fondo que usa Mary en la página de acceso de
la PWA»*.

**Qué quedó.** Todo sale de la identidad de Mary (`tokens.css`, `Logotipo.tsx`, la puerta de la
PWA); los productos no comparten código, así que se copió y se dejó dicho de dónde viene:

| | |
|---|---|
| **Pestaña** | El ícono de la PWA (`favicon.png`) y el título «IDIKY Gestión» en vez de «Strapi Admin» |
| **Login** | El logotipo (la casa con la puerta fucsia y «idiky»), «Bienvenido a IDIKY», «Ingresar»; el degradado y las torres de la puerta de la PWA, la tarjeta redondeada y el botón violeta en píldora |
| **Menú** | El ícono de la PWA como logo, y «IDIKY · Sistema de gestión» |
| **Todo el panel** | Los colores de Mary con sus papeles: azul en enlaces, foco y selección; violeta en el botón principal; los fondos y bordes de la PWA. Español por defecto, en tú, sin recorridos ni avisos de pago de Strapi |

**Lo que no se pudo igualar:** en la PWA el logotipo va en blanco **encima** de la tarjeta; en
Strapi va **dentro**, porque ese lugar lo decide su código y no los estilos.

**Verificado con Chrome sin ventana**, con perfil limpio: el título de la pestaña, los textos en
español, que el favicon servido es byte a byte el de IDIKY, y capturas del login antes y
después. LangFlow, sin cambios. **El celular no quedó verificado**: Chrome en macOS no deja
achicar la ventana por debajo de unos 500 px, y la captura sale cortada también sin los
estilos.

**Dos trampas, y las dos costaron un despliegue** (quedaron en `apps/gestion/README.md`):

- **El logotipo no se dibujaba.** Su comentario XML decía `--color-marca`, y un comentario XML no
  puede llevar dos guiones seguidos: el SVG era inválido. Se vio en una vista previa local antes
  de desplegar.
- **El fondo no aparecía, aunque el CSS estaba en la compilación.** Con `import './marca.css'`
  Strapi saca el CSS a una hoja aparte que su HTML nunca enlaza. Ahora se importa como texto
  (`?raw`) y el panel lo inyecta al arrancar.

**Hay que saberlo al subir de versión de Strapi:** logos, colores y textos son configuración
oficial; el título de la pestaña y el fondo del login se apoyan en la estructura de la página.
Si una versión nueva la cambia, el panel sigue funcionando pero el login vuelve a verse de
Strapi, y se revisa `src/admin/extensions/marca.css`.

**De paso se cerraron dos pendientes:** 8082 está en la regla `Dev` de Azure, y nginx registra
la IP pública real de quien llega, así que el límite de intentos de login de Strapi cuenta por
persona.

**Qué sigue:** el responsable del sistema y sus primeras entidades; el disco de datos y sacar
los respaldos del servidor antes de datos reales; el módulo de auditoría (T-38).

---

### 2026-09-10 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · El sistema de gestión, instalado (T-37)

**El pedido:** *«subamos el tope de idiky y realicemos la instalación en el contenedor de la
base de datos Postgres y los dos servicios»*.

**Qué quedó en el entorno**

- **Un pod, `idiky-gestion`**: nginx (el único con puerto, 8082), Strapi 5.53 sobre Node 24 y
  PostgreSQL 17, hablándose por `localhost`. PostgreSQL y Strapi **no tienen puerto en el
  servidor**.
- **El techo de `idiky` subió a 2 núcleos y 5 GB.**
- **`apps/gestion/`**, el proyecto Strapi en TypeScript, sin el plugin de Strapi Cloud. Apaga
  el registro abierto de usuarios en cada arranque y confía en la IP que le pasa nginx.
- **Secretos generados en el servidor**, fuera del repositorio; **respaldo diario** con
  `pg_dump`; y **un freno de disco**: `levantar.sh` no construye nada con menos de 3 GB libres.

**Lo que se comprobó, porque aquí nada se da por hecho**

| | |
|---|---|
| **LangFlow** | 200 en todas las muestras durante la construcción (2–4 ms); `verificar-vecino.sh` sin cambios después del despliegue y después del redespliegue |
| **Recursos** | `idiky` llegó a 4,6 GB construyendo, dentro de su techo; en reposo Strapi usa 137 MB y PostgreSQL 92 MB. Disco: de 6,2 a 4,9 GB libres |
| **Nadie se adelanta** | El superadministrador se creó antes de abrir el puerto, y un segundo registro de administrador se rechaza |
| **Por HTTP** | El login funciona: la cookie de sesión de Strapi no exige HTTPS |
| **Cerrado** | La API pública responde 403; el registro abierto está apagado en la base y nginx lo bloquea |
| **Persistencia** | Los datos sobreviven a reiniciar el pod (vuelve en 7 s) y a un redespliegue que lo recrea |
| **Respaldo** | Íntegro, con las 41 tablas y el administrador |

**Dos cosas que salieron distinto de lo escrito, y quedaron corregidas en ADR-0012**

- **La clave del entorno no va delante de Strapi.** Yo había escrito que protegería `/admin`, y
  era un error: el panel de Strapi manda su propio token en la cabecera `Authorization`, la
  misma de la clave. La puerta es el login de Strapi.
- **Se instaló sin el disco de datos de Azure**, que sigue sin agregarse. En su lugar, el freno
  de 3 GB. Antes de cargar datos reales, el disco propio sigue siendo necesario.

**Tres hallazgos que quedaron en «Trampas conocidas» (`infra/README.md` §10):** `du` dice que la
base pesa 4 KB porque `idiky` no puede leerla por fuera (`podman unshare du` dice 50 MB); con
`NODE_ENV=production`, `npm ci` omite TypeScript y la compilación falla; y los errores
`relation … does not exist` de PostgreSQL en el primer arranque son Strapi creando su esquema.

**La receta se actualizó con lo probado.** `infra/nuevo-servicio.md` §5 ya no dice «sin
probar» sobre pods, volúmenes, secretos, orden de arranque, servicios que no son nginx ni
tareas programadas: el sistema de gestión es el ejemplo a copiar.

**Qué sigue**

1. **Agregar 8082 a la regla `Dev` de Azure** y comprobar desde internet que Strapi ve la IP
   real de quien llega.
2. **El responsable del sistema y sus primeras entidades.** Se modelan en local y van a git.
3. **El disco de datos de Azure** y **sacar los respaldos del servidor**, antes de datos reales.
4. **El módulo de auditoría** (T-38).

---

### 2026-09-10 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · Un tercer producto: el sistema de gestión de IDIKY (ADR-0012)

**De dónde sale.** El responsable de integración planteó que, además del producto para las
copropiedades, **la empresa necesita gestionar su propio negocio**: *«un sistema general que
será quien desde la compañía IDIKI gestione el negocio; este no es para las propiedades»*. Y
aclaró que la PWA y la contable desplegadas hoy **son el demo**, que Mary y Jeimy siguen
trabajando; los servicios de desarrollo de verdad se irán creando a partir de aquí.

**La decisión: Strapi 5 con PostgreSQL 17**, en `apps/gestion/`. Él propuso Strapi y
PostgreSQL; antes de construir nada se comparó con **Directus**, que no conocía y que en lo
técnico encajaba mejor en varios puntos (tablas SQL normales, auditoría incluida, sin
compilar). **Se eligió Strapi por la licencia**: la de Directus cambió en mayo de 2026 y su uso
gratuito depende de un umbral que se revisa cada año; la de Strapi es MIT. En sus palabras:
*«si bien no trae la auditoría la podemos crear y se dejaría realizar este módulo; me gusta
mucho Directus pero el tema de la licencia me preocupa un poco»*.

**Lo que quedó escrito en [ADR-0012](./adr/0012-sistema-de-gestion-strapi.md):**

- **Qué es y qué no.** No es contabilidad ni facturación DIAN, y **no es el backend del
  producto** (ADR-0008 sigue pendiente). Se escribió explícito, porque un sistema con API y base
  de datos tiende a volverse el backend de todo por acumulación.
- **El modelo de datos se diseña en local y va a git.** El *Content-Type Builder* de Strapi solo
  funciona en modo desarrollo; algo modelado dentro del contenedor del servidor se perdería en
  el siguiente despliegue.
- **El diseño del módulo de auditoría (T-38), verificado contra la documentación de Strapi 5**:
  se engancha en el *Document Service* y no en los *lifecycle hooks*, que en v5 se disparan
  varias veces por operación. Queda escrito lo que no cubre —cambios directos a la base y, por
  ahora, GraphQL— y que sus registros no se editan ni se borran.
- **Cinco condiciones para el entorno de desarrollo**, porque es el primer servicio con datos:
  disco de datos propio en Azure, techo de `idiky` a 2 núcleos y 5 GB, *pod* con PostgreSQL sin
  puerto hacia afuera, la clave del entorno solo sobre `/admin` y datos ficticios.

**Identificadores:** ADR-0012, T-37 (el sistema) y T-38 (la auditoría), tomados después de
comprobar los máximos en la rama.

**Qué sigue** (T-37 está bloqueada por esto):

1. **Agregar el disco de datos en Azure** (32 GB).
2. **Autorizar el techo de `idiky` en 2 núcleos y 5 GB.**
3. **Definir quién es responsable del sistema de gestión y cuáles son las primeras entidades**
   (p. ej. copropiedades cliente, contratos, planes).

---

### 2026-09-10 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · Cómo crear otro servicio, escrito para quien venga después (T-35)

**El pedido:** *«documentemos como quedo todo en el repositorio indicando como esta configurado
el contenedor para que si requiero crear otro servicios la IA pueda leer esto y entender como
crear otro servicios»*.

**Qué se escribió**

| Archivo | Para qué |
|---|---|
| `infra/README.md` (reescrito) | **Cómo está armado**: del commit al contenedor, el camino de una petición, los techos de recursos, la unidad de systemd tal como quedó en el servidor, las imágenes, la clave, cómo operar, **lo que vive fuera de git** y las trampas que ya costaron tiempo |
| `infra/nuevo-servicio.md` (nuevo) | **La receta**: la lista previa, el contrato de un servicio (puerto 80, `/salud`, `/revision.txt`, clave, imágenes con versión fija), los puertos libres (8082–8099), cómo registrarlo en `levantar.sh`, cómo verificarlo y qué documentar |
| `infra/servidor/verificar-vecino.sh` (nuevo) | La verificación de LangFlow, que hasta hoy vivía fuera del repositorio |
| `CLAUDE.md` §4 y `docs/06-arquitectura.md` §7 | Los punteros para que un agente llegue a lo anterior |

**Dos decisiones que conviene conocer:**

- **La verificación de LangFlow pasó a ser un script del repositorio, no una lista de pasos.**
  Una lista se salta; un script que dice «sigue igual» o sale con error, no. Corre como `idiky`,
  sin `sudo`, y no lleva la IP ni el dominio del servidor. Se probó en los dos sentidos: la foto
  base de hoy **coincide con la de antes de instalar nada** (mismos PID, cero reinicios, mismos
  códigos), y contra una foto alterada **detecta el cambio y sale con error**.
- **Lo que no está resuelto quedó escrito como no resuelto.** Datos persistentes, contenedores
  que se hablan entre sí, servicios que no son nginx y secretos tienen cada uno un camino
  sugerido **marcado «sin probar»**, con la instrucción de que quien lo haga primero lo pruebe y
  quite la marca. Un agente que lee «así se hace» sobre algo que nunca se hizo lo da por hecho.

**El comando de la clave elegida se documentó probándolo.** Así se puso la clave actual. Se
corrió tal como quedó escrito, con la misma clave, y las dos apps siguieron respondiendo 401 sin
ella y 200 con ella.

**Qué sigue:** lo mismo de la entrada anterior. HTTPS y dominio, y el pipeline.

---

### 2026-09-10 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · El entorno de desarrollo, sin tocar al vecino (T-35, ADR-0011)

**De dónde salió.** El pedido fue preparar la infraestructura de desarrollo «según lo acordado
en la bitácora del 2026-09-10». **La bitácora no tenía ese acuerdo**: solo nombraba T-35 como
siguiente paso. La decisión se tomó en esta sesión, con el responsable de integración, y quedó
escrita en [ADR-0011](./adr/0011-entorno-de-desarrollo-en-contenedores.md) para que no vuelva a
pasar.

**La restricción que manda todo.** El único servidor disponible es una VM compartida donde
corre LangFlow, de otro proyecto, con servicios que lo consultan. En palabras del responsable:
*«hay que garantizar que langflow siga funcionando en los puertos y rutas que usa ya que hay
servicios que lo consultan»*.

**Qué se construyó**

| | |
|---|---|
| **Motor** | Podman 3.4 **sin root**, el de Ubuntu 22.04. Se descartaron Docker (daemon root que reescribe `iptables` en un servidor ajeno) y el LXD que ya estaba instalado (no deja una receta reproducible en el repositorio) |
| **Aislamiento** | Un usuario propio, `idiky`, que no puede leer los archivos de LangFlow. La red va en espacio de usuario: no toca `iptables` |
| **Contenedores** | `idiky-pwa` compila con `npm run build` y sirve con nginx. `idiky-contable` **copia la carpeta tal cual**, así que ADR-0010 queda intacto: sigue abriéndose con doble clic |
| **Publicación** | Primero solo en `127.0.0.1`, por túnel SSH. **Al final del día, abierto al equipo con clave** (ver abajo) |
| **Despliegue** | `infra/desplegar.sh` sube **un commit** con `git archive` y reconstruye en unos 30 s. `/revision.txt` dice qué está publicado |

**Cómo se comprobó que LangFlow no cambió.** No bastaba con decir que Idiky no toca nginx:

- **Se tomó una línea base antes de instalar nada**: estado y PID de los servicios, qué
  proceso escucha en cada puerto, y el código de respuesta de 12 rutas desde dentro del
  servidor —con el nombre del sitio— y 6 desde internet. Se repitió después de cada cambio y
  **salió idéntica todas las veces**.
- **Durante la primera construcción se midió `/health` cada 6 s**: 48 de 48 respuestas 200,
  entre 2 y 4 ms.
- **No se ejecutaron flujos reales** para probar, porque tendrían efectos. Se revisó el log de
  nginx.
- **Dos alarmas, con su explicación**, porque así hay que buscarlas la próxima vez: los
  `OPTIONS` sin `POST` eran del propio verificador (`curl`), y los seis errores 500 en la hora
  del cambio eran de un endpoint de LangFlow que **ya fallaba igual el 2 de septiembre**: el
  servicio externo que consulta tiene un certificado inválido.

**Lo que el paquete hizo por su cuenta, y se deshizo.** Ubuntu habilita solos la API de Podman
como root, el auto-update, el arranque de contenedores root y la API para todos los usuarios.
Idiky no usa nada de eso, así que `preparar-servidor.sh` lo apaga.

**La huella en el servidor:** 11 paquetes nuevos, sin actualizar ninguno de los existentes; el
usuario `idiky` con *linger*; unos 200 MB de disco. `iptables` no cambió: el ruleset de nft
solo cambió en los contadores del agente de Azure. Cómo deshacerlo todo está en
[`infra/README.md`](../infra/README.md).

**Lo que hay que saber a partir de ahora**

- **Todo lo de Idiky vive dentro del usuario `idiky`.** Quedó como regla en `CLAUDE.md` §6.
- **Abrirlo a la red no es cambiar un número.** Sobre `http://<ip>` el navegador apaga el
  *service worker* y la huella, que exigen contexto seguro. Hace falta HTTPS, y no por el nginx
  de LangFlow.
- **Sin backend no hace falta Compose.** Cuando ADR-0008 traiga una base de datos se revisa
  ADR-0011: el disco es escaso, y los datos nunca van en `/mnt`, que en Azure se borra al
  apagar la VM.
- **El reinicio del servidor no se probó**, porque tumbaría a LangFlow. Los servicios están
  habilitados con *linger* y deberían volver solos; la primera vez que el servidor se reinicie,
  hay que mirarlo.

**Y en la misma sesión, abierto al equipo con clave.** En Azure se agregó la regla `Dev`
(prioridad 340, TCP 8080 y 8081), y **tuvo que quedar abierta a cualquier origen**: Mary y
Jeimy no tienen IP fija. Con la red abierta, la protección tiene que estar en otro sitio, y se
puso **antes** de escuchar hacia afuera:

- **Una clave de acceso en los dos nginx** (`clave-acceso.sh`). Sin clave, todo responde 401
  salvo `/salud`, `/revision.txt` y el manifest. El responsable la aprobó: *«si me gusta lo de
  la clave para llegar al demo»*. **No es la autenticación de la app**, que sigue como dice
  ADR-0004: es la puerta del entorno. La clave no está en el repositorio.
- **Un techo de un núcleo y 3 GB para todo el usuario `idiky`**, puesto por systemd. Sin root,
  Podman no puede limitar la CPU, y el tráfico que llegue a 8080 y 8081 lo atienden procesos de
  `idiky`. Si el entorno se satura, choca contra su techo y no contra LangFlow.
- **El despliegue se vigiló a sí mismo:** si al abrir el demo hubiera respondido sin clave, lo
  volvía a cerrar en el acto. Respondió 401.

**Verificado desde internet:**
- Sin clave y con clave equivocada, las dos apps responden 401. Con la correcta, 200, y
  también sus archivos.
- nginx arranca aunque la carpeta de la clave no esté montada.
- LangFlow, otra vez **idéntico a la línea base**.

**Qué sigue**

1. Compartir el usuario y la clave con Mary y Jeimy por un canal privado. Las llaves SSH solo
   hacen falta para desplegar.
2. HTTPS y dominio (resto de T-35). Sin eso la clave viaja sin cifrar y la PWA no tiene
   *service worker* ni huella. No se hará por el nginx de LangFlow.
3. El pipeline: desplegar al integrar en `main`, en vez de a mano.

---

### 2026-09-10 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · Las dos ramas en una

**Qué se hizo**

Hasta hoy el trabajo vivía en dos ramas que nunca se habían juntado: la de Mary
(`claude/repository-review-c0p1wd`, 89 commits: identidad visual, acceso, asambleas,
sanciones, registro de personas, paz y salvo, portería) y la de Jeimy
(`claude/repository-review-1fbujq`, 11 commits: la aplicación contable y el módulo de pagos
con abonos parciales en la PWA). Se integraron las dos en `claude/idiky-work-review-ugp3xj`,
en este orden:

1. **Merge de la rama de Mary** sobre la base común (sin conflictos: la base no había cambiado).
2. **Renumeración de los identificadores de la rama de Jeimy** en un commit propio, antes de
   mezclar, porque las dos numeraron en paralelo y chocaron con significados distintos:
   RN-26…42 → **RN-75…91**; T-10…22 → **T-20…32**; CU-R-18 → **CU-R-30**; CU-A-18 →
   **CU-A-27**; ADR-0006 (stack de la contable) → **ADR-0010**. Se conservó la numeración de
   la PWA porque es la más extensa y la que más documentos citan.
3. **Merge de la rama de Jeimy** con 18 archivos en conflicto, resueltos así:
   - **Modelo de pagos: se adoptó el de Jeimy.** La cuota lleva `saldo` y el estado `abonada`;
     el pago lleva `imputaciones`, `recibo` de caja y estados `reportado | aplicado | anulado`
     (RN-75 a RN-79). Desaparecen `Cuota.pagoId`, `Pago.cuotaIds`, `Pago.comprobante` y el
     consecutivo `comprobante`, que ahora es `recibo`. Todo lo de Mary que dependía del saldo
     (paz y salvo, sanciones, extraordinaria con respaldo) se calcula ahora sobre `cuota.saldo`.
     La cuota que crea una sanción en firme nace con `saldo = valor`.
   - **`VERSION_ESQUEMA` sube a 21**, para que el navegador de cada quien regenere la semilla.
   - **Bre-B** (medio de pago que agregó Mary) entra también en las pantallas de Jeimy:
     bandeja de pagos del administrador e informar abono del residente.
   - **La ortografía del texto visible** de las pantallas de Jeimy (24 palabras sin tilde) se
     corrigió con la herramienta de Mary, que es parte de la definición de «terminado».
   - En los documentos se conservaron **las dos versiones completas**: las reglas RN-75…91,
     los casos de uso CU-R-30 y CU-A-27, las tareas T-20…32 y todas las entradas de bitácora
     de las dos ramas, **ordenadas por fecha** (abajo se mezclan las de Mary y las de Jeimy).
4. `npm run build` y `revisar-ortografia.py` pasan sobre el resultado.

**Lo que hay que saber a partir de ahora**

- **Esta rama es la base de todo lo que sigue.** Las ramas originales de Mary y Jeimy quedan
  como historial; no se sigue trabajando en ellas. Cada nueva rama sale de la integrada.
- **`main` se creó a partir de esta rama** el mismo día, por decisión del responsable de
  integración. Hasta entonces el repositorio no la tenía, aunque toda la documentación la
  nombraba. Falta marcarla como rama por defecto en GitHub (Settings → Branches).
- **Antes de inventar un identificador nuevo (RN, CU, T, ADR), mirar el máximo en la rama
  integrada.** Si dos personas van en paralelo, se reservan rangos y se anotan en el tablero.
  Fue lo que causó los choques que hoy tocó deshacer.
- Jeimy va a encontrar que su bitácora decía que «asambleas, paz y salvo y portería no
  existen»: **ya existen**, los construyó Mary en su rama. Y Mary va a encontrar un módulo de
  pagos nuevo en `/admin/pagos` y una cuenta con abonos por conciliar.
- Hay **dos herramientas de empaquetado** del demo (`empaquetar-demo.py` de Mary,
  `empaquetar.mjs` de Jeimy). Las dos funcionan; unificarlas queda en T-34.

**Qué sigue**

1. El responsable de integración marca `main` como rama por defecto en GitHub y avisa al equipo.
2. Mary y Jeimy recorren el demo integrado y validan la cartera sobre el modelo de saldo
   (T-33): paz y salvo, sanciones y abonos parciales en la misma unidad.
3. Despliegue de infraestructura (T-35) y, con él, el ADR-0008 del backend.
4. T-17: definir qué intercambian la PWA y la contable; hoy la contable siembra los abonos.
### 2026-09-21 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · BLOKY Dev nace con su puerta (CU-B-01)

**El pedido:** *«definir la primera parte de BLOKY… dejar el BLOKY demo que ya tenemos y crear
BLOKY Dev, basada en los casos de uso del demo, sin afectar la demo ni traernos todo, solo lo
que vayamos desarrollando. El primer módulo es el ingreso: la copropiedad ya tiene que existir en
BOB y existir el Administrador y el Delegado, o como mínimo uno de los dos».*

**Tres decisiones, tomadas con el responsable de integración:**

1. **El backend de BLOKY es una API propia** ([ADR-0008](./adr/0008-backend-de-bloky.md), el que
   llevaba pendiente desde agosto): Node 22 + TypeScript + Fastify con PostgreSQL, en su propio
   pod. **Lee BOB con un token de solo lectura y nunca lo escribe.** Se descartó meter el ingreso
   dentro de Strapi: BLOKY entero (cartera, asambleas, residentes) habría terminado viviendo dentro
   del back office de la empresa.
2. **BLOKY Dev se construye aparte del demo, módulo por módulo** ([ADR-0013](./adr/0013-bloky-dev-separada-del-demo.md)):
   `apps/bloky/` (React + Vite) y `apps/bloky-api/`. Del demo se traen los casos de uso, las reglas,
   `tokens.css` y el logotipo; **no** las pantallas ni la semilla. El demo no se toca.
3. **Cómo se entra** (decisión del responsable de integración): la persona escoge **código por
   SMS al celular registrado en BOB**, o **Google/Microsoft con el correo registrado en BOB**. No
   hay contraseña. El código por correo de Twilio salió: el correo entra por el proveedor.

**Qué se construyó** (CU-B-01, [`casos-de-uso/bloky.md`](./casos-de-uso/bloky.md)):

| Pieza | Dónde | Qué hace |
|---|---|---|
| Reglas | `apps/bloky-api/src/dominio/reglas.ts` | RN-160 a RN-166: identidad en BOB, asignación vigente, copropiedad activa o en implementación, código al celular de BOB, correo del proveedor igual al de BOB, sesión de 12 h revocable, cinco intentos |
| Cliente de BOB | `apps/bloky-api/src/bob/cliente.ts` | Lee `personas` con sus asignaciones y copropiedad por la API REST de Strapi 5 |
| Ingreso | `apps/bloky-api/src/acceso/` | Twilio Verify por REST (o simulado en desarrollo), OpenID Connect con Google y Microsoft verificando el `id_token` con las llaves del proveedor, sesión en cookie httpOnly con JWT |
| Datos propios | `apps/bloky-api/src/datos/` | Repositorio con dos adaptadores (memoria y PostgreSQL) y migraciones SQL que se aplican al arrancar: `sesion`, `intento_ingreso`, `estado_oauth` |
| La app | `apps/bloky/src/features/acceso/` e `inicio/` | Documento → ¿por dónde? → código → adentro, con la o las copropiedades y el rol. El interior está vacío a propósito |
| Servicio | `infra/bloky/`, `levantar.sh`, `desplegar.sh` | Pod `idiky-bloky` en el **8083**: nginx (app + `/api`), API y PostgreSQL. Secretos con `infra/bloky/secretos.sh` |

**Verificación:** `npm run probar` en la API recorre el caso de uso completo contra un BOB de
mentira: 12 comprobaciones (404, 403, 409, pistas, código simulado, código malo, sesión y cookie,
salir, bloqueo al quinto intento, Google sin configurar). `npm run build` pasa en las dos apps.
El flujo por SMS también se recorrió en Chromium con la app de verdad.

**Lo que no se pudo hacer desde esta sesión: desplegar.** El entorno remoto de Claude Code no
tiene salida al servidor (ya estaba comprobado el día 10). Queda para hacerlo desde la Mac del
responsable de integración, en este orden:

1. En BOB, crear un **token de API de solo lectura** (Configuración → API Tokens).
2. `ssh idiky@<ip> 'sh -s' < infra/bloky/secretos.sh` y completar en
   `~/.config/idiky/secretos/bloky-api.env`: `BOB_API_TOKEN`, `BLOKY_URL_PUBLICA=http://<ip>:8083`
   y, si no venían de `integraciones.env`, las `TWILIO_*`.
3. Agregar el **8083** a la regla `Dev` del grupo de seguridad de Azure.
4. `IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main bloky`,
   con `verificar-vecino.sh` antes y después.
5. Comprobar que la API alcanza BOB desde dentro del pod (`BOB_URL=http://10.0.2.2:8082`, el host
   de slirp4netns; si no responde, la IP privada de la VM).

**Lo que queda abierto**

- **Google y Microsoft exigen HTTPS** para volver a BLOKY: en `http://<ip>:8083` solo funciona el
  SMS. Darle dominio y certificado a BLOKY es tema del entorno (ADR-0011 §6). En local
  (`http://localhost:5173`) sí se pueden probar con las aplicaciones registradas.
- Los perfiles internos (portería y los que creen el Administrador y el Delegado) entrarán por la
  misma puerta cuando existan en BOB o en BLOKY (docs/13 §3.5).
- `tokens.css` está copiado: un cambio de identidad en el demo hay que copiarlo a BLOKY.

---

### 2026-09-21 · Integración · Sesión de IA (Claude) a pedido del responsable de integración · Infraestructura y Mary entran a `main`

**Qué se hizo**

Once días después de la primera integración, `main` había avanzado solo por un lado (Jeimy trajo
`main` a su rama y la adelantó) y dos ramas se habían quedado fuera:

1. **La rama de infraestructura** (`claude/infra-podman-1wkn5z`, 23 commits del 2026-09-10):
   `infra/` con un contenedor por producto bajo Podman sin root (ADR-0011), **BOB** en
   `apps/gestion/` con Strapi 5 y PostgreSQL 17 (ADR-0012), la guía de despliegue por servicio y
   los nombres BOB, BLOKY y ALICE. Entró con conflictos solo en `CLAUDE.md`, esta bitácora, el
   tablero y el índice de docs; se conservaron las dos versiones.
2. **La rama de Mary** (`claude/repository-review-c0p1wd`, 7 commits del 10 al 17): asistencia
   virtual y comisión verificadora, mayoría calificada, el poder enviado en foto y la marca
   «No obligatorio» en el registro. **Siguió sobre su base anterior a la integración**, así que
   volvió a numerar en paralelo y chocó con `main`: sus RN-75…80 eran ya las reglas de pagos de
   la contable, y su CU-R-30 era «informar un abono». Se renumeró en un commit propio antes de
   mezclar, igual que con Jeimy el día 10: **RN-75…80 → RN-92…97**, **CU-R-30 → CU-R-31**, su
   tarea T-20 → **T-42**, y su resumen de rama pasa de `docs/13` a
   [`docs/15`](./15-resumen-de-la-rama-de-mary.md) porque el 13 ya lo usa BOB.
   Conflictos en la semilla y cuatro documentos, resueltos conservando ambos lados.
3. `VERSION_ESQUEMA` sube a **22**: Mary y la integración habían llamado 21 a cambios distintos.
4. `npm run build`, `revisar-ortografia.py` y la prueba de humo en Chromium pasan.

**Estado del catálogo tras el recuento:** 70 casos de uso (38 ✅, 10 🟡, 21 ⬜, 1 ⛔) y 97 reglas
(RN-41 retirada).

**Lo que hay que saber a partir de ahora**

- **Mary y Jeimy siguen en sus ramas de larga vida** (decisión del responsable de integración,
  2026-09-21): no se borran ni se reemplazan. Lo que cambia es el ciclo: **antes de cada sesión
  traen `main` a su rama** con `git merge origin/main`, y el integrador lleva la rama a `main`.
  Jeimy lo hizo así el día 10 y su trabajo entró sin fricción; Mary lo tiene pendiente (T-43).
  La rama `claude/infra-podman-1wkn5z` queda como historial.
- **Cada quien tiene un rango de identificadores reservado** (tabla en el
  [tablero](./11-tablero-de-trabajo.md) §0). Es lo único que evita una tercera renumeración.
- `infra/` está en `main`: la PWA, la contable y BOB se publican con
  [`infra/guia-de-despliegue.md`](../infra/guia-de-despliegue.md).

**Qué sigue**

1. Mary crea su rama desde `main` y valida que sus pantallas de asambleas y registros se ven
   igual sobre la semilla 22 (T-43).
2. T-33: validar la cartera integrada (paz y salvo, sanciones, abonos) en el demo publicado.
3. ADR-0008, el backend de BLOKY: ya hay entorno donde ponerlo.

---

### 2026-09-17 · Mary + IA (Claude) · Las preguntas para el abogado, consolidadas

Mary preguntó qué debe revisar el abogado sobre datos personales. Quedaron **siete puntos** en
[`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md) §3 sexies, ordenados por
peso: el rostro como dato biométrico, el plazo de conservación de las fotos y el consentimiento
del apoderado son los tres que **bloquean producción**; el texto de la política, el
almacenamiento, quién ve qué (RN-67) y la marca «No obligatorio» (RN-97) se resuelven con
texto o configuración. Se agregó la fila de RN-97 a la tabla. Sin cambios de código.

**Lo que sigue:** enviarle la lista al abogado y volcar sus respuestas en la tabla de §3 sexies.

---

### 2026-09-17 · Mary + IA (Claude) · La marca «No obligatorio»: el administrador exime de las fotos (RN-97)

El equipo pidió, *«revisando con el equipo y la experiencia»*, una opción para el administrador:
**una marca «No obligatorio»** para que quien no quiera adjuntar la foto ni el documento no lo
haga, y entre *«con la contraseña que le asigna Idiky cuando el administrador o propietario lo
crea»*.

**Es una excepción a RN-57, y se construyó como excepción, no como interruptor.** Tres límites:
la pone **solo el administrador** —al crear el registro, con una casilla, o después desde el
detalle—; se pone **sobre un registro concreto**, no sobre la copropiedad, porque un ajuste
general dejaría RN-57 sin efecto de un clic; y **queda escrito quién la puso y cuándo**. Con la
marca el registro no espera nada de la persona: pasa directo a «falta autorizar», quien lo creó
lo autoriza sin fotos, y la marca se ve en la tabla y en el detalle —también en la app del
propietario, que autoriza los suyos sabiendo que el administrador eximió a esa persona—. Se
quita mientras el registro está en curso; sin fotos, vuelve a esperarlas.

**«La contraseña que le asigna Idiky» ya existía: es el código de registro.** Hasta hoy servía
solo para adjuntar (RN-58). Ahora, con el registro autorizado, **también activa la cuenta**: la
pantalla de activación lo acepta en lugar del código de un solo uso, y el detalle del registro
marcado lo muestra como lo que es —la clave para entrar—. Sigue sin autenticar nada de verdad
(ADR-0004); lo que cambia es que la persona sin fotos tiene un camino completo hasta adentro.

**Al visitante no le aplica**, y se dice: ya no lleva fotos desde RN-57. El equipo lo nombró en
la lista y por eso queda anotado, no porque haya que hacer nada.

**Verificado.** 15 comprobaciones directas sobre el repositorio (esbuild + node: nace por
autorizar con la marca, se autoriza sin fotos, el código activa solo autorizado, marcar y quitar
mueven el estado, con fotos quitar no retrocede, decidido no se marca, visitante no aplica) y
18 con Playwright: el administrador crea con la casilla y autoriza, la persona activa su cuenta
con el código de registro y entra, y un registro que esperaba fotos se marca y se desmarca.
`npm run build` y la ortografía en verde.

**Lo que sigue:** con dos reglas nuevas en el mismo día sobre quién ve qué documento (RN-96 y
RN-97), la revisión del abogado sobre datos personales (§4 del levantamiento) es lo que más
pesa.

---

### 2026-09-17 · Mary + IA (Claude) · La tercera puerta del poder: el propietario envía la foto (CU-R-31, RN-96)

Mary preguntó cómo llega el poder —*«lo genera el propietario desde la app o lo envía»*— y al
oír que el de papel solo lo registraba la administración, pidió la tercera puerta: que el
propietario **lo envíe él, «adjuntando una foto del documento»**. **Con foto y no con PDF, a
propósito**: es lo que el teléfono ya sabe hacer (ADR-0009) y no deja bloqueantes; recibir
archivos sigue esperando al backend.

**Lo que la distingue de las otras dos puertas es quién vio el papel.** En CU-A-19 lo tuvo el
administrador en la mano; en CU-R-23 no hay papel, respalda la sesión. Aquí lo vio el
propietario, y lo que hace válido un poder en papel es que la administración lo vea. De ahí
RN-96: el poder nace **«por validar»** y **mientras espera no representa** —la unidad la vota
su propietario como si el poder no existiera, y los botones de votar siguen habilitados—. Sí
**ocupa el lugar**: no se admite otro poder para esa unidad hasta retirarlo, o habría dos
representantes en cola. La administración lo ve arriba, con número, lo abre con la hoja y la
foto delante y lo **valida** o lo **rechaza con motivo**; el rechazo se conserva (RN-61) y el
propietario lo lee tal cual, para corregir y reenviar. Al validar se vuelve a comprobar que no
llegó otro por la puerta de papel entre el envío y la decisión.

**Un formulario para las dos puertas del propietario.** Los datos del apoderado son los mismos;
cambia lo que se pide —la foto, primero, como en la puerta del administrador— y lo que se dice:
que no vale hasta que lo validen. La hoja del poder lo lleva escrito en el pie: pendiente,
validado o rechazado por la administración.

**Verificado.** 22 comprobaciones directas sobre el repositorio (esbuild + node: sin foto no se
envía, solo el propietario, esperando no representa pero ocupa el lugar, rechazo sin motivo no
vale, el rechazado libera el lugar y se conserva, validar dos veces no, retirado no se valida,
carrera con un poder en papel) y 25 con Playwright recorriendo las dos caras: envío, rechazo
con motivo, motivo a la vista del propietario, reenvío, validación y unidad representada.
`npm run build` y la ortografía en verde.

**Lo que sigue:** la pregunta de §4 sobre el apoderado como titular de datos pesa más ahora,
porque sus datos y su firma los sube el propietario desde su teléfono. Y notificar al
propietario del rechazo por fuera de la app (SMS o WhatsApp) va con T-18.

---

### 2026-09-17 · Mary + IA (Claude) · La comisión tiene plazo, y lo pone el administrador (RN-95)

Mary cerró la pregunta chica que había dejado RN-93: *«para la revisión del acta debe existir
un plazo máximo que lo define el administrador»*. No es del reglamento: es **por acta**, y lo
escribe el administrador al marcar a la comisión. Y hacía falta, porque la comisión opcional
tal como quedó tenía un agujero: **un solo miembro que no revisara dejaba el acta en borrador
para siempre**, y con ella las decisiones de la asamblea. Una figura que existe para garantizar
el acta no puede ser la que la bloquee.

**Lo que el administrador decide y lo que no.** Decide la fecha. Alrededor hay dos cosas fijas:
**no puede pasar del término del art. 47** —el acta tiene que estar a disposición en esos veinte
días hábiles con o sin revisión, y un plazo de comisión más largo obligaría a incumplir la ley
para respetarlo— y **con comisión el plazo es obligatorio**: sin él, no se aprueba. Si el
término legal ya pasó cuando se designa la comisión (la asamblea cerrada de la semilla, por
ejemplo), el tope deja de aplicarse: el acta ya va tarde y acortar más a la comisión no lo
remedia; la pantalla lo dice en vez de dejar un campo sin fecha posible.

**Vencido el plazo, la espera termina y no se borra nada.** Las revisiones que faltan dejan de
detener el acta, **ya no se registran** —un plazo máximo que admite revisiones después no es
máximo— y la hoja dice quién no revisó dentro del plazo y hasta cuándo lo tuvo (RN-61). El
estado derivado vuelve a `borrador`, no se queda en `en_verificacion`. Todo se exige en el
repositorio, no solo en el `max` del campo (T-16).

**Un error que salió de la prueba y no del razonamiento.** Con el plazo vencido, el campo
mostraba «no puede estar en el pasado» —estaba juzgando el plazo ya guardado como si el
administrador lo estuviera escribiendo—. Ahora solo se valida lo que cambia; lo vencido se
dice aparte, como lo que es.

**Verificado.** 15 comprobaciones directas sobre el repositorio (esbuild + node: rechaza el
pasado, rechaza más allá del art. 47, rechaza la revisión tardía, aprueba con el plazo vencido
y conserva al verificador) y 23 con Playwright sobre la pantalla del administrador y la hoja.
`npm run build` y la ortografía en verde.

**Lo que sigue:** de §3 bis quedan dos preguntas —el tope de poderes del reglamento y la mixta
para el abogado— y la del apoderado como titular de datos (§4). Que el miembro de la comisión
revise **desde su propia app** sigue siendo la extensión natural de CU-A-20.

---

### 2026-09-10 · Mary + IA (Claude) · La mayoría calificada, y una puerta cerrada que no teníamos (RN-94)

Mary respondió lo que faltaba de mayorías: *«considero que se utiliza mayoría simple, no es
necesario mayoría calificada»*. Como respuesta al levantamiento es buena y cierra la pregunta:
**el reglamento de esta copropiedad no agrega puntos** a la lista del art. 46, y en la práctica
casi todo va por simple — que es además lo que la app hace por defecto.

**Lo que no se puede hacer es tratarla como opcional**, y conviene dejarlo escrito. El art. 46
cierra diciendo que lo adoptado en contravención suya es *absolutamente nulo*, y que las
mayorías superiores que ponga un reglamento **se tienen por no escritas**. O sea que el umbral
no está a disposición de nadie: una copropiedad no lo rebaja, solo se encuentra con que casi
nunca le aplica. Por eso la lista legal se queda en el código (RN-74) aunque el reglamento no
agregue nada.

**Y al verificar el artículo apareció algo que no teníamos, que es lo que valió la pena.** Su
parágrafo dice:

> «Las decisiones previstas en este artículo **no podrán tomarse en reuniones no presenciales**,
> ni en reuniones de segunda convocatoria, salvo que en este último caso se obtenga la mayoría
> exigida por esta ley».

No es un umbral más alto: es una **puerta cerrada**. Y el demo la estaba cruzando: su asamblea
estrella es **mixta** y su punto 2 —la extraordinaria de $40.000.000 para la cubierta— exige
mayoría calificada. Idiky abría la votación, sumaba coeficientes y el acta habría reportado
«se APRUEBA» una decisión que nace nula. Es el peor error posible en este módulo, porque nadie
se entera hasta que alguien impugna, y para entonces el acta firmada es la prueba en contra.

Arreglado en RN-94, y en las tres capas: el orden del día se lo advierte al administrador
**cuando todavía puede llevar el punto a una sesión presencial**; al copropietario los botones
le quedan deshabilitados —no escondidos, como pidió Mary para los poderes— con el motivo a la
vista; **el repositorio lo rechaza igual** aunque se le quite el `disabled` al botón (T-16, y
está comprobado quitándoselo); y el acta deja la constancia del parágrafo en vez de reportar
una aprobación.

**Dos precisiones del alcance.** La segunda convocatoria **no** se bloquea: la ley la admite si
aun así se obtiene el 70 %, y eso ya lo exigía `resultadoVotacion`. Y **la mixta se trata como
no presencial por deducción, no por cita**: el art. 46 dice «no presenciales» y en 2001 no
existía la mixta; quien la trae al caso es el Decreto 398 de 2020. Se tomó el camino
conservador —restringe, no habilita— y quedó anotada como pregunta para el abogado: si una
mixta con quórum presencial suficiente sí puede, se afloja en una línea.

De paso, **CU-R-13 pasó a ✅**: su ficha seguía diciendo que faltaban la mayoría, el quórum y
los poderes, y las tres cosas entraron entre ayer y hoy.

**Verificado con Playwright, 14 comprobaciones nuevas** (`calificada`, `calificada2`), más las
nueve suites anteriores en verde.

**Lo que sigue:** de §3 bis queda **una** pregunta del reglamento —si fija tope de poderes por
apoderado— más dos nuevas que salieron de construir: el término propio de la comisión
verificadora, y la de la mixta para el abogado.

---

### 2026-09-10 · Mary + IA (Claude) · Dos preguntas de §3 bis, respondidas (RN-92, RN-93)

Mary respondió dos de las cuatro preguntas que quedaban abiertas del levantamiento, y las dos
se pudieron cerrar el mismo día porque **ninguna pedía inventar nada**: una tenía norma detrás
y la otra pedía justamente que la app no impusiera una.

**«La asistencia virtual pesa igual que la presencial» (RN-92).** Se verificó contra la norma
antes de tocar código, como con el quórum, y la norma dice lo mismo por dos lados: la
**Ley 675 art. 42** admite la reunión no presencial *«de conformidad con el quórum requerido
para el respectivo caso»* —el mismo quórum, no uno propio— y el **Decreto 398 de 2020, art. 1**
lo escribe para las mixtas: las reglas de convocatoria, quórum y mayorías de las presenciales
*«serán igualmente aplicables»*. Así que la suma de coeficientes es **una sola**. El reparto
presencial/virtual se sigue llevando, pero por otra razón: **el acta lo exige** (art. 47). Al
copropietario conectado la pantalla se lo dice —*«conectado cuentas igual que en el salón»*—
porque es exactamente la duda de quien participa desde el sofá.

**«La comisión verificadora déjala como una opción… a veces hay revisión» (RN-93).** Es la
respuesta correcta y la Ley 675 la respalda por omisión: el art. 47 pide presidente y
secretario y **no menciona ninguna comisión**. La designa la asamblea o la exige el
reglamento, así que la app no puede ni imponerla ni ignorarla. Quedó como una lista que **puede
estar vacía**: sin nadie marcado el acta se aprueba directo, como siempre; con gente, no se
aprueba hasta que todos revisen.

Lo que salió al construirla, y es la parte que valía la pena: **una revisión vale sobre el
texto que se revisó**. Si el acta se edita después, esa revisión queda sin efecto. Lo contrario
—recoger las firmas y cambiar el texto luego— es precisamente el fraude que una comisión existe
para impedir. Y **no se borra nada** (RN-61): la revisión queda con su fecha y la hoja dice
«revisó el tal día; el texto se modificó después». Guardar sin cambiar nada **no** cuenta como
edición, o un clic distraído tumbaría el trabajo de la comisión.

También se dice, sin impedirlo, cuando quien presidió o hizo de secretario **también revisa**:
vacía la figura, pero lo decidió la asamblea al designar y ninguna norma lo prohíbe. Mismo
criterio que el tope de poderes — Idiky pone el dato delante, no inventa la prohibición.

**Dos textos que ya eran falsos y se corrigieron de paso.** La pantalla de poderes seguía
diciendo *«falta el tope que fija la Ley 675»* cuando la revisión del día anterior había
establecido que **la ley no fija ninguno** —lo puede fijar el reglamento—; y un comentario del
panel de asistencia seguía diciendo que el umbral estaba sin decidir cuando ya se declaraba el
quórum citando el artículo. Tres comprobaciones de Playwright afirmaban también lo viejo y se
actualizaron.

**Verificado con Playwright, 31 comprobaciones nuevas** (`comision`, `mixta`) más las siete
suites anteriores en verde: que la comisión sea de verdad opcional; que designar bloquee la
aprobación y diga por qué; que la observación entre en la hoja; que editar deje las revisiones
sin efecto y que guardar sin cambios no; que la hoja muestre lo invalidado en vez de
esconderlo; y que el acta de una sesión no presencial cite el art. 42 y el Decreto 398.

**Lo que sigue:** de §3 bis quedan **dos** preguntas, las dos del reglamento de esta
copropiedad: qué puntos somete a mayoría calificada, y si fija tope de poderes por apoderado.
Apareció una tercera, más chica: si el reglamento le da a la comisión un término propio para
revisar (hoy corre el supletorio de 20 días hábiles del art. 47). Y quedó anotada la extensión
natural del CU-A-20: que el miembro de la comisión revise **desde su propia app**, la misma
forma de dos puertas que ya tiene el poder.

---

### 2026-09-10 · Mary + IA (Claude) · El acta, y lo que la norma ya había respondido (CU-A-20)

Antes de escribir una línea, verifiqué el **artículo 47 de la Ley 675** — la costumbre que
Mary instaló el día anterior con *«revisa la norma»*. Y la norma resultó ser **casi un
inventario de lo que Idiky ya tenía**:

| El art. 47 exige | De dónde sale |
|---|---|
| Si fue ordinaria o extraordinaria | `Asamblea.tipo` |
| La forma de la convocatoria | `Asamblea.citacion` |
| El orden del día | `Asamblea.ordenDelDia` |
| Nombre y calidad de los asistentes, su unidad y su **coeficiente** | `Asistencia` |
| Los **votos emitidos en cada caso** | `Voto` |

**Ahí se cobró una decisión vieja.** Copiar el coeficiente al marcar asistencia y al votar
(RN-37) parecía redundante —está en la unidad, ¿para qué duplicarlo?—. Es **exactamente lo que
hace que el acta valga**: si mañana cambia el coeficiente de una unidad, el acta sigue diciendo
con cuánto se contó. Y por eso el acta **no congela una copia de nada**: la asamblea cerrada ya
no admite asistencia ni votos nuevos, y cada dato guarda su propio número. Lo que se congela es
**el texto y el estado**, que es lo único que una persona podría cambiar después.

**Lo único que faltaba: presidente y secretario**, que la firman. Se eligen **solo entre quienes
asistieron** — ofrecer toda la copropiedad dejaría firmar como presidente a alguien que no fue.

**La hoja se ve mientras se edita**, no un formulario a un lado. Un acta es un documento que
alguien va a leer entero; escribirla a ciegas en campos sueltos es cómo salen las actas que no
cuadran con lo que pasó.

**Un problema que se vio en la primera captura, y era serio.** El acta decía *«no se verificó el
quórum»* y a renglón seguido reportaba puntos **aprobados**. Sin quórum no hay decisiones
válidas: un acta que dice las dos cosas se contradice a sí misma, y es justo la que se anula.
Ahora, sin quórum, dice que la asamblea **no quedó habilitada para adoptar decisiones** y ningún
punto sale aprobado — cada votación queda «como constancia de lo actuado, sin producir efectos».

**Y dos plazos que la norma trajo**: la verificación y la puesta a disposición tienen el término
del reglamento y, en su defecto, **20 días hábiles**. Hizo falta `sumarDiasHabiles`, que salta
sábados y domingos pero **no festivos** —eso exige el calendario colombiano de cada año, que la
app no tiene—, así que calcula **el plazo más corto posible**: nunca dice que hay más tiempo del
que hay.

**Aprobada, no se edita** (RN-35). Para corregirla se emite un **acta aclaratoria** que la
referencia; la original no se toca. Es la misma idea que la sanción archivada y el poder
revocado: lo que ya produjo efectos se explica, no se borra.

**Verificado con Playwright, 20 comprobaciones**: que no se ofrezca acta antes de cerrar; que al
levantarla ya traiga quórum, asistentes y votos con su artículo; que aprobar quede bloqueado
diciendo qué falta; que al aprobar se numere y se congele; que el copropietario la lea **a
disposición** desde su app con las dos firmas; y que sin quórum ningún punto salga aprobado.

**De paso, RN-32 quedó marcada como implementada**: quien otorgó poder no vota esa unidad, y ya
estaba construido desde ayer.

**Lo que sigue:** de §3 bis quedan cuatro preguntas, y **ninguna es de derecho general**: son de
esta copropiedad —qué puntos exigen mayoría calificada según su reglamento, si fija tope de
poderes, si designa comisión verificadora— más si la asistencia virtual pesa igual que la
presencial. El módulo de asambleas, con eso, está completo hasta donde la ley alcanza.
*(Las dos últimas quedaron respondidas al día siguiente — ver la entrada de arriba.)*


---

### 2026-09-10 · Mary + IA (Claude) · La asamblea parte de su modalidad (ADR-0007)

ADR-0007 llevaba desde el 26 de agosto pendiente, planteado como *«elegir proveedor de
transmisión: costo por minuto, grabación, ancho de banda»*. **Dos frases de Mary lo dieron
vuelta, y la decisión terminó siendo que no hay proveedor que elegir.**

La primera: *«las asambleas se pueden hacer por Zoom o por Meet»*. Si la copropiedad ya tiene
con qué, ese costo no es de Idiky y esa complejidad tampoco.

La segunda, y es la que ordena todo: *«una asamblea puede ser virtual o presencial; debemos
partir de ahí»*. Yo había saltado a **cómo** hacer el video cuando la pregunta anterior era
**qué tipo de asamblea es**. `modalidad` ya existía en el modelo y se estaba diseñando como si
todas fueran virtuales.

Puestas al lado, las tres modalidades dicen solas la respuesta: **la asistencia es la
constante; el video es la variable.** Solo existe en dos de las tres, y en ninguna es el
sistema de registro. Por eso puede ser de un tercero sin que Idiky pierda nada — y al revés,
**Zoom no conoce los coeficientes y nunca los va a conocer**.

**La decisión que parecía la más cara resultó la más barata**: enlazar una reunión es un
enlace, no un SDK. Sin dependencias nuevas, sin costo por minuto, sin backend.

**Lo que se construyó:**

- **Consola del administrador → Asambleas** (nueva). Convoca preguntando **primero la
  modalidad**, porque decide qué más hace falta: presencial exige lugar, virtual exige enlace,
  mixta los dos. El botón se deshabilita diciendo qué falta, y `convocarAsamblea()` lo vuelve a
  comprobar. Instala, ve la asistencia llegar con su coeficiente, y cierra.
- **Sala del copropietario**, que cambia con la modalidad: dónde es, el botón para entrar a la
  reunión, o los dos. Y **marcar asistencia diciendo cómo** — en el salón o conectado.
- La entidad `Asistencia`, con su forma y su coeficiente copiado (RN-37).

**Cuatro decisiones que conviene revisar:**

- **Asiste la unidad, no la persona** (RN-27): dos copropietarios del mismo apartamento no
  suman dos veces. Y si alguien se pasa del salón a la reunión, **se corrige la forma, no se
  duplica** — en una mixta es normal.
- **El arrendatario puede entrar pero no cuenta** (RN-51), y la pantalla se lo dice en vez de
  esconderle el botón.
- **Se suma, pero no se declara quórum.** Registrar quién asistió y sumar coeficientes es
  aritmética y se puede hacer hoy; el umbral, si lo virtual pesa igual que lo presencial y cómo
  entran los poderes son derecho, y están sin decidir (RN-28). Las dos pantallas lo dicen.
- **Se nombra el costo de la decisión en vez de taparlo.** Al abrir Zoom en el celular, Idiky se
  va al fondo; la sala avisa *«las votaciones se hacen aquí, no en la reunión»*. Con push (fase
  2) mejora; mientras tanto, se dice.

**Verificado con Playwright, 30 comprobaciones** entre las dos caras: que la modalidad decida
qué se pide al convocar (presencial no pide enlace, virtual no pide lugar, mixta los dos), que
el bloqueo diga qué falta, que instalar abra el panel de asistencia, que marcar sume el
coeficiente correcto (43,2 % → 51,4 %), que el arrendatario vea la explicación y no el botón, y
que en ninguna pantalla se afirme que hay quórum.

**De paso, un arreglo en el revisor de ortografía.** Entre dos cadenas vacías seguidas
—`{ titulo: '', descripcion: '' }`— la heurística de «prosa entre comillas» tomaba el código de
en medio por texto y pedía tildar el nombre de un campo. Comprobado que el arreglo no lo ciega:
una tilde de verdad sigue saliendo.

**CU-A-17 y CU-R-21 cambiaron de nombre**, porque los dos suponían que Idiky ponía el video:
ahora son «Instalar la asamblea y llevar la asistencia» y «Entrar a la asamblea y marcar mi
asistencia».

**Y en la misma sesión, los poderes** (CU-A-19). Mary aportó cuatro cosas seguidas, y tres de
ellas **confirmaron lo que ya estaba construido**: *«la asamblea es para propietarios»*
(RN-51), *«el quórum cuenta por unidad: pueden participar 3 propietarios pero solo es un voto»*
(RN-28) y *«igual con las votaciones de cada punto: un voto por unidad»* (RN-29, que el
repositorio ya rechazaba). La cuarta era nueva: **«puede entrar un externo si tiene poder»**.

**El apoderado casi nunca tiene cuenta en Idiky**, y de ahí salió todo lo demás: lo registra el
administrador, y si esa persona no existe **se le crea un usuario temporal de asamblea**. Lo
bonito del modelo es que «temporal» **no es un campo ni un estado**: es que su única vinculación
con la copropiedad es el poder, y el poder muere con la asamblea. Lo que caduca por
construcción no hay que acordarse de apagarlo.

**Aquí me equivoqué de camino y conviene dejarlo escrito.** Mary dijo primero que el poder se
creara *en la app* y se descargara sin salir del flujo; alcancé a construirlo así —documento
emitido con consecutivo, como el paz y salvo— y después ella corrigió: *«este poder se da por
fuera de la aplicación»*. Y me preguntó cuál era mi propuesta. La respuesta que dimos, y que
sostiene lo construido: **los dos caminos existen, pero solo uno funciona hoy**. Un poder ante
notario se produce fuera de Idiky y la app no puede exigirle al mundo que use la app; y el
otorgamiento desde la app depende de si la ley admite firma electrónica —pregunta abierta de
§3 bis— y aun entonces el PDF esperaría al backend (ADR-0006). Así que se construyó el de
papel, y el otro queda escrito para cuando el abogado responda.

**Lo que el sistema no hace:** aplicar un **tope** de unidades por apoderado. Escribí que «la
cifra la fija la Ley 675 y no la tenemos», y **eso resultó falso**: al revisar la norma al día
siguiente quedó claro que **la ley no fija ningún tope**. Lo puede fijar el reglamento —la
práctica común son tres o cuatro— y este no lo ha hecho. La pantalla **pone el acumulado
delante** de quien registra y dice que no está rechazando a nadie.

**Y una consecuencia que conviene no dejar pasar:** el poder lleva nombre, documento y firma de
alguien **que no es residente**, y hoy no se le pide autorización de tratamiento de datos — lo
trae el administrador, no él (RN-66). Quedó anotado en §3 sexies, que dejó de llamarse «las
cédulas del registro de personas» para llamarse «los documentos con datos personales».

**De paso, dos arreglos de interfaz:** el detalle de la asamblea **se esconde mientras se
registra un poder** —dos modales encimados dejan dos fondos oscurecidos y un «cerrar»
ambiguo—; y quité de la app una afirmación mía que no era de Mary: la modalidad mixta decía que
*«las dos formas suman al mismo quórum»*, y eso es **justo una de las preguntas abiertas**.
Ahora dice lo que sí hace: llevar las dos cuentas por separado.

**Y enseguida la segunda puerta.** Mary, al ver la comparación: *«me gusta la opción de que el
propietario lo haga en la APP, perdón, no pensé en ese camino»*. Así que **conviven las dos**,
que era lo que yo había propuesto: no compiten, y lo que cambia es **qué respalda cada poder**.

| | `papel` | `app` |
|---|---|---|
| Quién lo da de alta | El administrador | El propietario, desde su teléfono |
| Qué lo respalda | La firma del documento adjunto | **Su autenticación**: es su voto y lo cede él |
| Qué guarda Idiky | La foto del papel | Un documento con consecutivo y código (RN-36) |

La de papel **no se quita**: un poder ante notario se produce fuera de Idiky. La de la app
existe porque no hay razón para obligar a imprimir algo cuando quien lo otorga ya está
autenticado. El administrador ve las dos en la misma lista, marcadas por origen.

**La validación común se extrajo a una función aparte** (`prepararPoder`), y no por elegancia:
si mañana cambia quién puede otorgar, o la regla de una unidad un representante, tiene que
cambiar en los dos caminos a la vez o **uno se vuelve el hueco por donde se cuela lo que el
otro impide**.

**Dos errores encontrados al construirlo, y el segundo salió del primero:**

- **La propietaria que ya había dado poder seguía viendo los botones de votar.** Se vio en una
  captura. Si votaba ella y luego el apoderado, el segundo se rechazaba — pero el primero no
  debió permitirse: serían dos personas con derecho al mismo voto, ganando quien llegue primero,
  que es justo lo que un poder resuelve. Arreglado **en el repositorio**, no escondiendo el
  botón (T-16), y la pantalla dice por qué no están.
- Al arreglarlo apareció el otro: la comprobación de RN-51 corría antes y **el apoderado no
  tiene residencia**, así que nunca habría podido votar. Las dos comprobaciones ahora viven
  juntas porque son **una sola pregunta**: ¿quién puede votar por esta unidad?

**Verificado con Playwright, 17 comprobaciones** en esta parte: que el formulario del
propietario no pida foto, que emita el documento con número y código, que al otorgar
desaparezcan los botones de votar y se explique por qué, que el administrador lo vea marcado
como «Otorgado en la app», y que revocar anule el documento y devuelva el voto.

**Y faltaba lo más obvio, que Mary encontró enseguida:** *«debe ser posible que el propietario
que da el poder y el administrador que lo recibe lo pueda ver, no encuentro en dónde verlo»*.
Tenía razón — el número del documento aparecía, pero **el documento no se podía abrir en
ninguna de las dos caras**. Registrar un poder que después nadie puede leer no sirve el día que
alguien lo impugne.

Ahora existe `HojaPoder`, con el patrón del paz y salvo: se lee en pantalla y sale al imprimir.
**Es la misma hoja en las dos caras**, y eso es deliberado: el apoderado llega mostrando algo y
la administración tiene que estar leyendo eso mismo. Dice a quién representa, **con qué
coeficiente** —que es lo que se está cediendo— y cómo se otorgó; y cuando llegó en papel, la
consola muestra debajo **la foto del documento firmado**.

**Y los botones de votar quedan deshabilitados, no escondidos** (Mary: *«si el propietario da
poder no puede votar, es decir que los botones quedan inhabilitados»*). Yo los había escondido;
su palabra es mejor: a la vista pero sin pulsarse, quien dio poder **sigue viendo qué se está
decidiendo en su unidad**, que es información suya aunque no sea su voto.

**Un detalle del documento que conviene notar:** decía *«identificado con documento»*, la
fórmula notarial de siempre — y se lo decía a una mujer. El sistema no sabe el género de nadie,
así que ahora dice **«con documento»**: lo mismo, y no se equivoca nunca.

**Y al final del día, el quórum.** Mary: *«el quórum por normativa el 50 + 1, pero revisa la
norma»* — y revisarla dio tres correcciones, una de ellas mía:

| Lo que se decía | Lo que dice la Ley 675 (verificada el 2026-09-10) |
|---|---|
| «el quórum es 50 + 1» | El 50 + 1 es la **mayoría decisoria**, no el quórum — y sobre lo **representado en la sesión**, no sobre el total (art. 45) |
| «o el 51 % de la sumatoria» | El quórum es **«más de la mitad»**: 50,5 % alcanza. Y exige además **número plural** de propietarios |
| *(mío)* «el tope de poderes que fija la Ley 675» | **La ley no fija ningún tope.** Lo puede fijar el reglamento. Lo había escrito en la app y en los documentos |

**La tercera es la que más importa como lección:** afirmé que una cifra la fijaba la ley y no la
teníamos, cuando lo que pasaba es que **la ley no la fija**. No es lo mismo «falta un dato» que
«no hay dato que buscar»: lo primero deja una tarea abierta para siempre, lo segundo convierte
la pregunta en una **decisión de la asamblea**. Corregido en los dos sitios.

**Tres precisiones que de memoria se repiten mal**, y por eso quedaron escritas en el código:

- **Son dos condiciones, no una.** «Número plural» significa mínimo dos propietarios: una sola
  unidad con el 60 % del edificio **no hace quórum**. Es lo que impide que un dueño mayoritario
  sesione solo.
- **Se supera la mitad, no se alcanza.** Con 50 exacto no hay quórum; con 50,5 sí. El «51 %»
  deja fuera asambleas válidas.
- **Las dos mayorías se miden sobre bases distintas.** La simple, sobre lo representado; la
  calificada, sobre el edificio entero. Confundirlas es lo que anula una votación.

**Lo construido:** `hayQuorum` con la segunda convocatoria del art. 41 —que sesiona con
cualquier número plural, y es lo que impide que una copropiedad quede paralizada porque la
gente no va—, `resultadoVotacion` con las dos bases, y `Asamblea.numeroConvocatoria`. Las dos
pantallas **dejaron de decir «no puedo afirmar el quórum» y lo afirman citando el artículo**:
un veredicto sin su regla es un número que nadie puede comprobar.

**Y la mayoría de cada punto se ve antes de votar, no después.** Saber que la extraordinaria
necesita el 70 % del edificio cambia cómo se lee la papeleta: es la diferencia entre «opino» y
«esto no va a pasar sin más gente».

**Verificado con Playwright, 10 comprobaciones**: que con 43,2 % diga que no hay quórum y
cuánto falta; que al superar la mitad lo haya; que en segunda convocatoria baste un número
plural citando el art. 41; y que cada punto muestre su mayoría sobre la base correcta.

**Lo que sigue:** de las once preguntas de §3 bis quedan **cinco**. Y la que más pesa ya no es
de derecho sino de esta copropiedad: **qué puntos de su reglamento exigen mayoría calificada**,
y **si fija un tope de poderes** — que resultó ser una decisión suya, no un dato que buscar.

---

### 2026-09-09 · Mary + IA (Claude) · El debido proceso sancionatorio (CU-A-23, CU-R-29)

Mary desbloqueó lo que llevaba desde el 27 de agosto detenido: *«el debido proceso ya está
reglamentado, genera una vista para administrador y propietario del debido proceso»*.

**Lo que esa frase resolvió no fue el flujo, fue de quién es la decisión.** El bloqueo no era
técnico: era que la app no podía inventar los pasos ni los plazos de un proceso con
consecuencias jurídicas. La respuesta es que **ya están escritos, en el reglamento de cada
copropiedad**. Así que `diasDescargos` y `diasImpugnacion` son **parámetros de la
copropiedad**, no constantes del código (RN-69) — la app lleva el proceso, no lo define.

**Seis etapas, y cada una con un turno**: notificada y resuelta esperan al copropietario; en
estudio e impugnada, a la administración; firme y archivada no esperan a nadie. Las dos
pantallas se ordenan por eso, no por fecha ni por valor. Un proceso en el que los dos creen que
espera al otro es un proceso que se vence solo, y un plazo vencido es una multa que se cae.

**Los dos lados leen el mismo expediente** (`componentes/Expediente.tsx`): los mismos hechos,
las mismas actuaciones, el mismo orden. Si cada uno viera su propia versión, el día que
discutan no habría un documento común sobre el cual discutir. Lo que cambia entre la consola y
la app es **qué se puede hacer**, no **qué se ve**.

**Tres decisiones que conviene revisar:**

- **El plazo se copia al imponer**, no se lee del parámetro de hoy. Si la copropiedad cambia el
  término mañana, los expedientes abiertos conservan el que se les notificó. Cambiar las reglas
  a mitad del proceso es exactamente lo que el debido proceso prohíbe.
- **La cuota nace en un solo sitio del sistema**: `darFirmezaSancion`. Ni al imponer, ni al
  resolver. No hay ningún camino del expediente a la cartera que se lo salte, y eso es lo que
  separa una sanción de un cobro (RN-39).
- **Resolver antes de que venza el plazo de descargos se permite, pero se advierte.** Prohibirlo
  sería suponer un reglamento que no conocemos; hacerlo en silencio sería ayudar a anular la
  sanción. La pantalla lo dice con todas las letras.

**En la app del residente se dice en voz alta que todavía no hay nada que pagar.** Mientras el
proceso vive, la multa no es una deuda. Por eso el enlace también está en el estado de cuenta,
que es donde la persona viene a mirar qué debe: confundir las dos cosas es lo que hace que la
gente pague por miedo en vez de defenderse.

**El menú del administrador quedó con dos entradas, no una:** *Multas* es el catálogo
—parametrizar— y *Procesos* es imponer y resolver. Son dos cosas distintas y por eso son dos
sitios (RN-49).

**Verificado con Playwright, la cadena completa**: el propietario ve el proceso en su inicio,
presenta descargos y el expediente pasa a «Descargos por revisar» → la administración lo
resuelve con motivación y arranca el plazo de impugnación → el propietario impugna → la
administración resuelve la impugnación y da firmeza → **y ahí, y solo ahí, la multa aparece en
su estado de cuenta con el radicado** (el saldo pasó de $ 4.466.000 a $ 4.646.000).

**Y en la misma sesión Mary cerró las cinco preguntas que quedaban** de §3 quater:

- *«La multa la impone el administrador de acuerdo con las multas aprobadas en asamblea, en el
  reglamento de propiedad horizontal, etc.»* → el administrador **aplica**, no decide. De ahí
  salió un campo nuevo: `Sancion.respaldo` **copia la norma al imponer** y la muestra en la
  cabecera del expediente, en las dos caras, junto a los hechos. Una multa se comprueba por sus
  dos mitades; sin la cita, «te multaron por ruido» es la palabra del administrador contra la
  del copropietario. El administrador también la ve **antes** de abrir el proceso, al elegir la
  conducta: para saber qué está aplicando.
- *«Quien hace el debido proceso es el administrador»* → el mismo de principio a fin. Que
  imponga y resuelva no es un descuido: no está decidiendo sobre la norma sino sobre si los
  hechos ocurrieron. Lo que lo controla es que todo quede escrito y que se pueda impugnar
  (RN-69).
- *«Una multa no se anula porque para eso existe el debido proceso»* → **RN-70**, y disuelve la
  pregunta por la multa anulada después de pagada: no puede haberla. El momento de deshacerla
  es archivarla durante el proceso; el código no tiene ninguna transición que salga de `firme`.
  Es la consecuencia de tomarse el debido proceso en serio — si la multa se pudiera anular al
  final, las cinco etapas serían decorativas.
- *«Las multas como las cuotas ordinarias o extraordinarias cuentan como mora»* → **RN-71**.
  Ya funcionaba así, porque ninguna regla de mora filtra por tipo de cuota, pero era un
  supuesto; ahora es una decisión. Una multa que no cuenta como mora es una multa que no se
  cobra.

**Y la quinta, en la misma sesión:** *«la multa por reincidencia debe estar avalada por la
asamblea, reglamento de propiedad horizontal, etc.»* → **RN-72**, que es RN-38 aplicada al
agravante. Tiene dos mitades y la segunda importa igual que la primera:

- Si el catálogo tiene la reincidencia parametrizada —**con su propia cita**, que puede ser un
  documento distinto del de la multa base—, a partir de la segunda vez se impone el valor
  agravado y el expediente dice que lo es.
- **Si nadie la parametrizó, la multa no sube**, por muchas veces que se repita. La app no
  agrava por su cuenta. Y eso se dice en pantalla al abrir el proceso: «esta unidad ya fue
  sancionada una vez por esta conducta, pero el valor no cambia: ningún documento dice que esta
  multa suba al repetirse». Sin ese aviso, quien lo viera creería que el sistema se olvidó de
  aplicarlo.

**Solo cuentan las sanciones en firme.** Una archivada terminó en que **no hubo infracción** y
una abierta no ha establecido nada; contar cualquiera de las dos sería agravar una multa con
hechos que nadie probó, que es justo lo que el debido proceso existe para impedir.

**Y la caducidad, que había dejado abierta, Mary la cerró en la misma sesión:** *«la
reincidencia caduca al año»*. Un antecedente deja de agravar pasada la ventana, que es un
**parámetro de la copropiedad** (`mesesReincidencia`) por lo mismo que los plazos del debido
proceso: la fija el reglamento, no la app. Una multa de hace cuatro años no dice nada sobre
quien vive allí hoy.

**La ventana se cuenta desde la imposición del antecedente, no desde su firmeza**, y es la
decisión de esta parte que conviene mirar dos veces. Si contara desde la firmeza, un proceso
largo —con descargos e impugnación— alargaría la ventana, y **quien se defendió quedaría
expuesto más tiempo que quien no dijo nada**. Defenderse no puede costar caro.

También hubo que cambiar el texto: «esta unidad ya fue sancionada una vez por esta conducta»
pasó a decir **«…en el último año»**. Sin la ventana, la frase invita a creer que cuenta
cualquier antecedente, que es justo lo que dejó de ser cierto.

**Verificado con Playwright en los tres bordes**: un antecedente de hace 3 meses agrava
($ 360.000); uno de hace 13 meses no agrava, vuelve a $ 180.000 y **ni se menciona**; y uno de
hace ~11,6 meses todavía agrava.

**Y con la última respuesta se cerró todo lo que bloqueaba las multas:** *«el administrador no
puede ajustar el valor»*. Era **el límite entre parametrizar e imponer** (RN-49) y quedó del
lado correcto: el valor sale del catálogo y se copia tal cual. Lo confirmé en el código y no es
una restricción de pantalla — **`imponerSancion` no recibe un valor**, así que no hay por dónde
pasarlo. Una regla que solo esconde un campo se salta el día que alguien llame a la función
desde otro sitio.

**Y la última no se respondió: se disolvió.** Mary primero dijo *«las cuotas adicionales se
estipulan en la asamblea de propietarios»* y enseguida *«me retracto, las cuotas adicionales
son lo mismo que cuotas extraordinarias»*. Las dos frases llevan al mismo sitio: si lo estipula
la asamblea, **ya es la extraordinaria** — la que ella aprueba (RN-46), con destinación
específica (RN-48) y prorrateada por coeficiente (RN-05).

**RN-73 no agrega nada al modelo: le quita.** `TipoCuota` nunca ganó el valor `'adicional'`,
**CU-A-24 se retiró** y **RN-41 se retiró con él**. Alcancé a escribir el caso de uso corregido
sobre la premisa de que eran dos figuras distintas; lo dejé en el documento tachado, con qué
decía y por qué era un error, porque quien lea el histórico se va a topar con RN-41 y con
menciones a un tipo de cuota que nunca existió y tiene que poder saber por qué desaparecieron.

Dos nombres para una figura obligan a quien los lee a preguntarse en qué se diferencian, y aquí
la respuesta era «en nada». La retractación **simplificó el modelo**.

**Lo que queda vivo de ese encargo** es el trabajo que la figura inventada estaba tapando: que
la cuota extraordinaria **exija el acta que la aprobó** (RN-46). Hoy `generarCuotas()` la crea
sin pedirla, y es lo que tiene a CU-A-05 en 🟡.

Con esto **§3 quater es la primera sección del levantamiento que se cierra entera**.

---

### 2026-09-09 · Mary + IA (Claude) · La extraordinaria exige su acta (CU-A-05 → ✅)

Lo que la «cuota adicional» estaba tapando. RN-46 y RN-47 llevaban desde el 27 de agosto
escritas y sin implementar: `generarCuotas()` creaba extraordinarias sin pedir el acta.

**La ordinaria sigue sin pedir nada, y eso es la regla, no una excepción.** Es la del mes, la
que el reglamento autoriza de una vez y para siempre. Todo lo demás es un cobro que alguien
decidió en algún momento, y el copropietario tiene derecho a saber quién y cuándo (RN-45).

**No basta con marcar «asamblea»: hace falta cuál acta y para qué.** «Aprobado en asamblea» sin
fecha no se puede comprobar, y sin destinación no se puede reclamar el día que la plata se va a
otra cosa (RN-47, RN-48). Por eso son dos campos y los dos son obligatorios.

**Tres decisiones que conviene revisar:**

- **El botón se deshabilita diciendo qué falta**, en vez de dejar pulsar y contestar «falta el
  acta». Un formulario que rechaza después de intentar enseña a escribir cualquier cosa con tal
  de pasar.
- **La comprobación vive en el repositorio, no solo en el formulario.** `generarCuotas()`
  rechaza la extraordinaria sin respaldo aunque la llamen desde otro sitio. Una regla que solo
  esconde un campo se salta el día que alguien no pase por esa pantalla — es lo mismo que ya
  hacía `imponerSancion` con el valor.
- **El respaldo viaja en cada cuota, no en un encabezado aparte.** Duplica el texto doce veces,
  y aun así es lo correcto: quien reclama lo hace desde **su** línea del estado de cuenta, no
  desde una tabla de lotes de facturación que nunca va a ver.

En la app del residente se lee plegado, bajo **«¿Por qué se cobra?»**. Cerrado por defecto:
quien viene a ver cuánto debe no necesita leer el acta, pero quien se pregunta «¿y esto qué
es?» tiene que encontrarla sin salir de la pantalla.

**Verificado con Playwright los cuatro estados**: la ordinaria no pide acta y genera; la
extraordinaria sin acta queda bloqueada y dice por qué; con acta pero sin el «para qué» sigue
bloqueada; completa, genera — y el copropietario ve la justificación y la cita del acta en su
estado de cuenta.

**Con esto RN-45, RN-46, RN-47 y RN-48 dejan de estar pendientes**, y CU-A-05 sale de 🟡. La
cartera queda con un solo hueco de respaldo: **el interés de mora** (RN-43), que sigue esperando
la respuesta de §3 quinquies.

**Lo que sigue:** ADR-0007 (transmisión en vivo), sin bloqueos.

---

### 2026-09-09 · Mary + IA (Claude) · El catálogo de multas (CU-A-22)

Construido en la consola del administrador, con el modelo que quedó corregido ayer: **el
administrador parametriza, no decide**.

**Dos decisiones ordenan la pantalla:**

- **El respaldo se pregunta primero**, antes que la conducta y el valor. Es lo que decide si el
  concepto puede existir (RN-38); un formulario que lo pregunta de último invita a escribir la
  multa primero y buscarle sustento después.
- **Cada origen pide lo suyo.** El reglamento y el manual piden artículo, el acta pide fecha, y
  «otro documento» pide además cuál es. Pedir «referencia» a secas deja que cada quien escriba
  una cosa distinta, que es lo que hace que después nadie pueda comprobar nada. La forma de
  cada cita vive en `ORIGENES_RESPALDO`, no repartida por la interfaz.

**Los inhabilitados siguen a la vista**, en su propia sección y con la fecha en que dejaron de
ofrecerse. Esconderlos haría creer que se borraron, y las multas impuestas los citan (RN-40).
Se pueden habilitar de nuevo: a veces la reforma que dejó un concepto sin sustento se revierte.

**Y se llaman así por decisión de Mary**: *«dar de baja por Inhabilitar y reactivar por
Habilitar»*. Es el mismo verbo que ya usan las personas (RN-61), y tiene que serlo — es
exactamente lo mismo que pasa: el registro queda, deja de estar disponible. Dos palabras para
una sola idea obligan a quien las lee a preguntarse si son cosas distintas.

**La semilla trae cuatro conceptos del manual de convivencia y uno del reglamento**, más uno
inactivo que salió de un acta. Es a propósito: el catálogo de sanciones vive en el manual en la
práctica, y el inactivo hace visible de entrada que dar de baja no borra.

**Dos cosas que decidí y conviene revisar:**

- **No se editan los conceptos.** Para corregir uno se da de baja y se crea de nuevo, que es lo
  que ya exigía el flujo A4 cuando cambia el documento. Editar en sitio sería cómodo para
  arreglar una palabra y peligroso para todo lo demás: el valor y el respaldo son lo que la
  multa copia al imponerse (RN-37).
- **Se quitó `justificacion` de la entidad.** A diferencia de la cuota extraordinaria —donde la
  justificación explica **para qué** se aprobó el cobro, un dato que no está en ningún otro
  campo—, aquí el «para qué» ya es la descripción de la conducta y el respaldo son `origen` y
  `referencia`. Un campo de prosa que repite lo que las columnas dicen se llena con lo primero
  que se le ocurra a quien lo llena.

De paso, un arreglo que toca toda la app: **los botones ya no parten su texto en dos líneas**.
«Agregar concepto» salía en dos renglones dentro de una fila apretada; un botón es una acción,
no un párrafo. Verificado que no rompe ninguna otra pantalla.

**Verificado con Playwright**: el catálogo lista activos e inactivos con su respaldo a la vista;
«otro» sin nombrar el documento no crea el concepto y dice por qué; con el documento sí; dar de
baja mueve el concepto a su sección en vez de borrarlo; y un nombre repetido entre los activos
se rechaza.

**Lo que sigue:** CU-A-23, imponer una multa — que necesita el debido proceso de la Ley 675
(RN-39, sin resolver).

---

### 2026-09-08 · Mary + IA (Claude) · El manual de convivencia, y quién define las multas

Al proponerle el catálogo de multas resumí mal la regla: dije que *«el administrador define las
infracciones y sus montos»*. Mary corrigió: **«el administrador no define las multas, estas las
define la asamblea normalmente, o están ya establecidas en el reglamento de propiedad
horizontal o el manual de convivencia»**, y luego: **«de acuerdo, el administrador
parametriza»**.

La documentación ya lo decía bien —RN-38 exige el respaldo desde el 2026-08-27— así que el
error fue de mi resumen, no del modelo. Pero la corrección destapó algo que sí faltaba.

**El manual de convivencia no estaba en el modelo.** El respaldo admitía «reglamento o acta», y
son dos documentos distintos:

- El **reglamento de propiedad horizontal** es el constitutivo: se eleva a escritura pública y
  se registra, y define coeficientes, bienes comunes y órganos.
- El **manual de convivencia** lo adopta la asamblea para regular el día a día —horarios,
  mascotas, ruido, uso de zonas comunes—, y **en la práctica el catálogo de sanciones suele
  vivir ahí**.

Obligar a citar «reglamento» donde la conducta está en el manual haría que la referencia **no
se pudiera comprobar**, que es justo lo que el principio del respaldo existe para evitar. Los
tres se citan distinto: reglamento y manual por **artículo**, acta por **fecha**. Y el manual,
aunque lo apruebe la asamblea, se cita como manual: quien quiera verificar la multa busca el
artículo, no el acta que adoptó el documento hace seis años.

**Y quedó dicho lo que RN-49 daba por entendido:** parametrizar no es decidir. La facultad de
operar el catálogo es del administrador; la de crear la sanción, no. Es la misma distinción que
ya regía la extraordinaria —el administrador la traslada del acta, no la escribe— aplicada a
las multas.

**Y un cuarto origen, «otro documento»** (Mary: *«tal vez pueden existir otros documentos que
establezcan estas multas»*). Es cierto —una resolución del consejo, un reglamento interno de
una zona común, un convenio— y una lista cerrada obligaría a forzar el caso raro dentro de una
opción que no le corresponde, que es peor que admitirlo.

**Con una condición que es la que lo hace útil en vez de peligroso: «otro» exige nombrar el
documento.** Sin ese campo obligatorio sería la puerta por donde se escapa el principio entero
—bastaría marcarlo para no justificar nada, y el respaldo dejaría de ser comprobable—.
«Resolución del consejo N.º 12 del 3 de marzo, artículo 4» se puede ir a buscar; «otro» a
secas, no. Es la misma forma de la decisión sobre el concepto de la extraordinaria: **el campo
es abierto, el dato no es discrecional**.

Se agregaron dos flujos alternativos a CU-A-22: **si se reforma el manual**, los conceptos
afectados se dan de baja y se crean de nuevo citando el artículo nuevo —no se editan en sitio,
porque una multa impuesta bajo el manual anterior tiene que seguir apuntando al texto que la
respaldaba (RN-37)—; y si se escoge «otro» sin escribir cuál, **el concepto no se crea**.

Sin cambios de código: CU-A-22 sigue sin construirse, y ahora arranca con el modelo correcto.

---

### 2026-09-07 · Mary + IA (Claude) · La marca de residente

Justo después de precisar que «residente» es una marca y no un título, Mary la convirtió en una
decisión del producto: **al crear un propietario se ofrecen las dos opciones, vive aquí o no**.
Y completó la tabla en tres mensajes seguidos: el **arrendatario** la trae por defecto, el
**residente temporal** también, y el **visitante** nace sin ella.

Tiene sentido en cuanto se dice en voz alta: un propietario puede tener su apartamento
arrendado o vacío y **sigue siendo propietario** —vota, recibe la cuota, registra gente—; lo
único que cambia es que no vive ahí. El arrendatario arrienda para vivir ahí, y al temporal se
le llama temporal precisamente porque vive ahí un tiempo.

**Para qué sirve, en concreto:** decide **quién aparece en la lista de rostros de la portería**
(CU-P-03). El portero tiene que reconocer a quien entra a diario, no a quien viene dos veces al
año, y llenarle la lista de caras que no va a ver hace más difícil encontrar las que sí.

**Y una corrección de alcance que mejoró el resultado:** yo había puesto «· no vive aquí» en la
lista de personas de la unidad. Mary: *«la marca solamente se debe ver cuando se crea el
usuario, en las demás vistas es innecesaria»*. Tiene razón — la marca hace su trabajo por
detrás, y repetirla en cada lista es ruido que no cambia ninguna decisión de quien la lee.

**Y una precisión sobre dónde se ve:** el selector aparece en **las cuatro categorías**, para
que quien registra sepa qué marca va a quedar antes de crear a la persona; pero **solo se puede
cambiar en el propietario**, porque en las demás no hay nada que decidir. En las otras se ve el
valor, deshabilitado, con la razón escrita al lado.

La regla de qué marca lleva cada categoría vive en una sola función (`marcaResidente`), para
que no se conteste distinto en cada pantalla.

---

### 2026-09-07 · Mary + IA (Claude) · «Residente» es una marca, no un título

Mary precisó algo del modelo que el glosario tenía mal escrito: *«la denominación de residente
es una marca que se le coloca a los usuarios con rol de propietario o arrendatario»*, y
*«residente no es otro usuario»*.

El código ya lo hacía bien —`RolUsuario = 'residente'` es con qué cara de la app entra la
persona, y `Residencia.rol` es su título— pero **el glosario decía que «Residente / Tenedor»
equivalía a `Residencia.rol = 'arrendatario'`**, que es justo confundir la marca con el título.
Un documento que dice eso lleva a un error concreto: creer que «residente» es lo contrario de
«propietario» y escribir un permiso al revés.

Quedó separado en tres sitios:

- **El glosario** distingue las dos entradas: «Arrendatario / Tenedor» es un título; «Residente»
  es la marca que llevan por igual el propietario y el arrendatario.
- **Los tipos** lo dicen donde se van a leer: `RolUsuario` explica que la marca no es el título,
  y `RolResidencia` explica por qué «residente» no aparece entre los títulos.
- **Los perfiles del demo** se nombran por su título: «Propietaria al día», «Propietario en
  mora», «Propietario sin deuda». Antes decían «Residente al día», que es la ambigüedad de la
  que salió esta conversación — y de la pregunta de Mary sobre qué significaban.

En el formulario de registro la categoría «Residente» se queda, porque ahí sí es la marca: al
escogerla, lo siguiente que se pregunta es el título.

---

### 2026-09-07 · Mary + IA (Claude) · Quién ve la foto, y qué queda cuando la ve

Mary aprobó las dos propuestas que le hice sobre el acceso a los soportes, y **corrigió una**.
La corrección es la parte interesante.

**Lo aprobado:** la administración puede ver la foto del documento después de autorizada,
**con registro**. Así quedó: mientras se decide, las fotos están a la vista —compararlas *es*
autorizar, y pedir un clic extra ahí sería estorbo—; ya autorizado se guardan, y abrirlas es un
acto deliberado que deja constancia de quién y cuándo. No por desconfiar de la administración,
sino para que el día que un titular pregunte «¿quién vio mi documento?» la respuesta exista.

**La corrección:** yo había concluido que la portería no necesitaba ver fotos. Mary:
*«corrige, pero la portería debe poder ver la foto porque, ¿cómo reconoce al que ingresa?»*.

Tenía razón y mi razonamiento estaba al revés: un portero que nunca vio la cara de quien vive
ahí no puede distinguirlo de un desconocido, y menos de noche o en un turno nuevo. Yo había
tomado «la ve a diario» como si el portero fuera siempre el mismo y conociera a todos, que es
justo lo que no pasa en un puesto donde rota el personal.

Así que la portería tiene su pantalla (CU-P-03) y **ve el rostro, nunca el documento**. Es la
diferencia entre *reconocerte* y *tener tu identidad*: para lo primero basta una cara; lo
segundo suele quedar en manos de personal de una empresa externa. Su consulta no deja
constancia individual, y es deliberado — mirar caras es su trabajo de todo el día, y registrar
cada mirada sería ruido que esconde los accesos que sí importan.

**Un efecto secundario que hay que tener presente:** desde que el visitante no lleva fotos
(RN-57), el portero **no tiene cara que comparar con un visitante**; a ellos los valida por
código y documento. La foto sirve para los residentes, que son los que entran a diario.

**Dos hallazgos de la revisión:**

- El campo `fotoPersona` del visitante quedó muerto al quitarle los soportes y **se eliminó**.
  Un campo que nunca se llena miente sobre el modelo.
- La pantalla de la portería **no mostraba a los residentes temporales**: los filtré por «sin
  fecha de salida» en vez de por vigencia. Es la tercera vez que aparece el mismo error, y son
  justo los que el portero no conoce de vista.

---

### 2026-09-07 · Mary + IA (Claude) · El consentimiento de tratamiento de datos

Mary pidió implementar la autorización de tratamiento de datos y su aceptación. Es la primera
de las cinco preguntas de habeas data del ADR-0009, y la única que se podía responder desde la
app.

**Los tres requisitos de la Ley 1581, y cómo quedó cada uno:**

| | |
|---|---|
| **Informada** | Cinco puntos: quién responde, qué datos, para qué, cuánto se guardan, qué derechos tiene. El responsable es **la copropiedad, con su NIT** — no Idiky, que es la herramienta |
| **Expresa** | Una casilla que nace **sin marcar**. Nada de «al continuar aceptas»: eso no es autorización, es una trampa con letra pequeña |
| **Registrada** | Queda la versión aceptada y la fecha. Guardar solo «aceptó» deja sin saber **qué** aceptó; con la versión, el día que cambie el texto se sabe a quién volver a preguntarle |

**Va antes de las cámaras, no debajo del botón.** Quien ya tomó las dos fotos no vuelve a leer
nada, y una casilla al final de un formulario largo se marca sin mirar. Aquí se lee primero y
se decide antes de sacar la cédula.

**La política va plegada pero completa**, no resumida: el resumen de una política de datos es
la política que nadie puede leer entera.

**Y una corrección de Mary que resolvió el choque que estaba anotado.** El texto que escribí
prometía que las fotos se eliminan al inhabilitar a la persona, cosa que el sistema no hace.
Al señalarlo, ella precisó: *«me refería a conservar el registro; la documentación se debe
guardar el tiempo que la normatividad lo permita»*.

Eso desarma la contradicción que llevaba anotada desde la mañana entre RN-61 («nada se borra»)
y el habeas data: **el registro y la documentación no son lo mismo**. El registro se conserva
como constancia; los soportes tienen plazo legal. Ninguna de las dos reglas cede, y RN-61 quedó
precisada así.

Y lo completó con la pieza que faltaba del ciclo: *«si el registro se habilita nuevamente y ya
no tenemos los documentos, se solicitan nuevamente»*. O sea **rehabilitar es volver a
registrar, no deshacer la inhabilitación** — el trámite pide las fotos otra vez si ya no están.
El modelo ya lo permitía sin saberlo: el bloqueo de registros duplicados solo mira los que
están *en curso*, no los cerrados. Ahora está escrito, y la política se lo advierte a la
persona, que merece saber por qué se los podrían pedir dos veces.

**Lo que falta, y es importante decirlo:** el texto **es un borrador de trabajo, no un
documento revisado por un abogado**. Sirve para que el equipo discuta sobre algo concreto en
vez de sobre una idea. El punto más delicado: **la foto del rostro puede considerarse dato
biométrico**, y los datos sensibles tienen requisitos adicionales —el titular no está obligado
a autorizarlos y hay que decírselo—. También falta el plazo concreto de conservación y el
proceso que borra las fotos cuando se cumple.

---

### 2026-09-07 · Mary + IA (Claude) · El aviso por mensaje, y quién puede inhabilitar

Dos reglas nuevas que cierran huecos del registro de personas.

**RN-64 — cuando el registro queda autorizado, la persona recibe un mensaje de texto.** Era el
hueco que quedaba: la persona adjuntaba sus documentos y nunca se enteraba del desenlace.

Está hecho con el mismo patrón de la huella: **una interfaz propia**
(`servicios/mensajeria.ts`) que redacta el mensaje de verdad y lo deja escrito, pero no lo
envía — en la fase 2 solo se cambia el cuerpo por el proveedor que se elija (T-18, sin
decidir). No se simula un «enviado ✓» que no ocurrió; la app muestra el texto exacto que
saldría, que es lo que permite revisarlo antes de que exista quien lo mande.

Tres decisiones que vale la pena que queden:

- **El texto se redacta en el servicio, no en la pantalla.** Un SMS no tiene dónde volver a
  preguntar: quien lo recibe está en la calle, sin contexto, y el mensaje tiene que traer las
  tres cosas que le permiten actuar —de qué copropiedad le hablan, qué pasó y qué hace ahora—.
  Suelto en cada pantalla, en dos meses hay cuatro versiones y una olvida el código.
- **El texto cambia con la categoría**, porque lo que la persona tiene que hacer después es
  distinto: el visitante recibe su código de portería; el residente, que ya puede activar su
  cuenta. Mandarle a los dos «tu registro fue aprobado» los deja igual de perdidos.
- **El aviso vive en el repositorio, no en la interfaz**: es parte de autorizar. Si dependiera
  de que cada pantalla lo llame, la primera que se olvide deja a alguien esperando un mensaje
  que nunca sale. Y **los mensajes se guardan**: uno que se manda y no queda escrito es uno que
  nadie puede probar que se mandó, y «yo nunca recibí nada» es la discusión más común de una
  copropiedad. Sin celular no sale mensaje, y la pantalla lo dice para que quien registró avise
  por su cuenta.

**RN-65 — quién inhabilita depende de quién creó.** *«Lo que crea el propietario lo puede
inhabilitar el propietario o el administrador de la propiedad, y lo que crea el administrador
lo puede inhabilitar el administrador o quien este designe con el perfil»* (Mary).

Es **la cadena de RN-63 leída al revés**: se crea hacia abajo y se inhabilita hacia arriba,
nunca hacia abajo. Lo que impide es concreto: **un propietario no puede sacar de la unidad a un
copropietario que registró la administración** — si pudiera, dos dueños del mismo apartamento
tendrían cada uno el botón para borrar al otro y ganaría el que llegara primero.

**Y por qué inhabilitar y no borrar, dicho por Mary:** *«el residente puede pasarse a vivir a
otro edificio que opere Idiky, por eso lo de inhabilitar nada más»*. Eso fija el modelo: la
persona y su vínculo con la unidad son entidades distintas, e inhabilitar cierra el vínculo con
**esta** unidad mientras la persona sigue existiendo. Por eso al autorizar un registro la
persona se reutiliza **por documento y sin limitarse a la copropiedad**: quien se muda de un
conjunto a otro es la misma persona, no una nueva.

**Pendiente:** «o quien este designe con el perfil». Delegar la facultad exige un modelo de
perfiles que todavía no existe (T-08); hoy la administración la ejerce directamente.

---

### 2026-09-07 · Mary + IA (Claude) · Quién mete gente a una unidad, y con qué soportes

La pieza más grande desde que arrancó el demo. Mary pidió que el propietario pueda **crear y
dar de baja propietarios y arrendatarios**, que el residente pueda hacer lo mismo con
**visitantes**, que en todos los casos se exija **foto del documento y foto de la persona**,
que haya una **categoría** —residente, residente temporal o visitante—, que **los soportes los
adjunte la propia persona registrada desde su app**, y que después de eso **el propietario o
arrendatario autorice**.

**Lo que corrigió sobre la marcha, y cambió el modelo:**

1. *«Tienen razón, no se borran, se inhabilitan»* — le había marcado que «eliminar» choca con
   la regla del proyecto. Ahora es RN-61 y es la palabra que usan los botones: **Inhabilitar**,
   no «desvincular», que no le dice nada a quien lo lee.
2. *«El administrador de Idiky crea al administrador del edificio, el administrador del
   edificio crea a un propietario, y el propietario a otros propietarios de su propiedad»* —
   esto resolvió la tensión que le había planteado con RN-53. **No se le quita la facultad a la
   administración: se delega por eslabones** (RN-63). Y de paso apareció un actor que el modelo
   no tenía: **el operador de Idiky**, por encima de la copropiedad. Su consola es de otra
   fase; el eslabón queda escrito para que no se olvide.

**La tesis del diseño:** registrar a alguien **son tres actos con tres actores**, no un
formulario. Registrar (quien responde por la unidad), adjuntar (**la propia persona**) y
autorizar (quien registró, después de mirar las fotos). El rodeo tiene una razón concreta:
*una foto de cédula que sube un tercero no prueba nada sobre quién la subió*. Que la traiga la
propia persona es lo que convierte el trámite en un soporte.

De ahí salen dos decisiones que se notan en la interfaz:

- **Las dos esperas no se juntan en un «pendiente».** En `esperando_soportes` la pelota la
  tiene la persona registrada; en `esperando_autorizacion`, quien la registró. Decirle
  «pendiente» a los dos es la forma segura de que ninguno haga nada.
- **La pantalla de adjuntar vive fuera de la sesión.** Quien tiene que subir sus documentos no
  es nadie todavía para la copropiedad. Pedirle que active una cuenta para poder subir los
  soportes que hacen falta para autorizarle la cuenta es un círculo, y es donde el trámite se
  muere. Se identifica con su documento y el código, como el paz y salvo.

**Un trámite, tres consolas.** El administrador registra propietarios, el propietario registra
residentes y arrendatarios, el arrendatario registra visitantes: cambia quién escoge qué
categoría, no el trámite. Vive en `componentes/Registro.tsx` — dos formularios distintos para
lo mismo acaban pidiendo cosas distintas, y el modelo de datos diría que los dos traen soportes.

**El visitante entra por aquí, pero sin fotos y en un solo paso.** Vale dejar el camino
completo, porque la conclusión no fue la primera respuesta y el recorrido es la parte útil.

Se le planteó a Mary que para una visita de una tarde el trámite completo es pesado y que cabía
una vía rápida; respondió *«no, déjala así»*. Al revisarlo ella misma vio lo que faltaba: **el
caso pesado que tenía en mente —el apartamento de un propietario que está en Airbnb— no es un
visitante, es un residente temporal**, y esa categoría ya existía. De ahí salió el criterio, en
sus palabras: **«el trámite le corresponde a quien se queda a dormir»**, precisado después como
*«el trámite del documento de identidad y la foto son para los usuarios con marca de residente
y residente temporal»* y *«el visitante no requiere de fotos»*.

Así quedó RN-57. **Y la razón de fondo es de seguridad, no de comodidad**: pedirle cédula
fotografiada a quien viene a almorzar es el requisito que hace que la gente deje de registrar
visitas y las meta sin avisar. Un trámite que se evade protege menos que uno liviano que se
cumple. El huésped de Airbnb sí duerme ahí, usa las zonas comunes y la portería lo ve a diario:
ahí las dos fotos valen lo que cuestan.

**Y el visitante es de un solo día**, lo que cierra la regla: se escoge el día en que viene, no
un rango. Sin ese tope, una autorización «del 5 al 20» sería un residente temporal sin sus
soportes, y por ahí se colaría lo que RN-57 le exige a quien se queda a dormir. Es también lo
que hace barato no pedirle fotos — *una autorización que caduca esta misma noche no es una
llave*. En el formulario eso es **un solo campo de fecha**, no dos: dos campos donde solo cabe
una fecha invitan a poner un rango y después rebota la regla.

**El visitante sigue dejando registro** —queda escrito quién lo dejó entrar y cuándo—; lo que
se alivió es el requisito, no el rastro. En el código el registro de un visitante nace
`autorizado` y crea el visitante en el acto, así que hay un solo camino de entrada a la unidad
y una sola tabla que responde «¿quién autorizó a esta persona?».

Los dos ejemplos de Mary —el huésped de Airbnb y la visita de una tarde— pasaron al texto que
la gente lee al escoger. La ayuda decía «se queda un tiempo definido», que obliga a traducir el
caso propio; ahora se reconoce de una.

**Las fotos:** [ADR-0009](./adr/0009-soportes-fotograficos.md). Se capturan con
`<input type="file" capture>` —el HTML de siempre, cero dependencias, funciona igual dentro de
Capacitor— y se reducen a 720 px antes de guardarse: el demo entero vive en `localStorage`, que
da unos 5 MB, y dos fotos de cámara sin reducir llenan la cuota en el primer registro. Ahí la
app deja de guardar **en silencio**.

**Y lo que de verdad es difícil de esta funcionalidad no es la foto, es el dato.** Una cédula
es un dato personal cubierto por la Ley 1581 de 2012. Cuánto se conserva, quién la ve, y qué
pasa al inhabilitar a alguien —donde RN-61 «nada se borra» **choca de frente** con el derecho a
que sí se borre— está sin decidir y queda en el levantamiento (§3 sexies). No bloquea el demo;
bloquea producción.

**Tres fallos que solo aparecieron al probarlo en el navegador**, y los tres valen como nota:

- El registro se guardaba **sin unidad**: el formulario compartido mandaba `unidadId: undefined`
  y, al ir después en el objeto, pisaba la unidad de la sesión. Un `undefined` explícito no es
  lo mismo que una clave ausente.
- **Un residente temporal desaparecía al autorizarlo.** El selector daba por vigente todo
  vínculo «sin fecha de fin», que alcanzaba solo porque ninguno la tenía; los temporales sí la
  tienen. Ahora `residenciaVigente()` es la única definición.
- **Los títulos de sección salían blancos sobre blanco dentro de las hojas.** La app los pinta
  en blanco porque van sobre el degradado, y un modal es hijo de la misma app. Pasó dos veces
  hoy —el perfil y el registro— antes de arreglarlo donde se arregla una vez.

**Verificado de punta a punta con Playwright**, en los tres perfiles que Mary pidió ver:
propietaria (tres categorías) → adjuntar con dos fotos reales → autorizar viendo los soportes →
la persona aparece en «Viven aquí»; arrendataria (solo visitantes, y la pantalla le dice por
qué); administradora (registra propietarios, escoge unidad, ve la tabla con **quién registró a
quién**). Sin errores de consola.

**Lo que falta:** avisarle a la persona cuando la autorizan; el código viaja por pantalla y no
por mensaje (como el de ingreso, ADR-0004); y la consola del operador de Idiky.

---

### 2026-09-07 · Mary + IA (Claude) · El tamaño de la letra, en la puerta

Mary retomó el tema de las fuentes y pidió **un botón de accesibilidad en la pantalla inicial
con tres tamaños**. Al ver la primera propuesta la corrigió: *«implementa los tres niveles más
usados»* — **100 %, 125 % y 150 %**, los del zoom del navegador y la escala de pantalla del
sistema. Es mejor que lo que yo había puesto (1 / 1.2 / 1.4): quien alguna vez agrandó la letra
de su computador reconoce esos números, así que ahora el porcentaje se muestra en el botón en
vez de esconderse detrás de «Grande».

**Por qué va en la puerta y no en el perfil.** Quien no alcanza a leer la pantalla de ingreso
no puede entrar a buscar el ajuste adentro. Un control de accesibilidad detrás del acceso le
sirve a todo el mundo menos a quien lo necesita.

**Cómo está hecho, en una línea:** un multiplicador `--escala-texto` sobre los tokens
`--texto-*` (`estilos/tokens.css`), escrito como `data-texto` en el `<html>`. **Ninguna
pantalla tuvo que enterarse**: crecen la app del residente, las dos consolas y la
previsualización del paz y salvo. La preferencia es del aparato, no de la copropiedad, así que
vive en `estado/preferencias.ts` y **no pasa por el repositorio** — misma razón que
`estado/acceso.ts`.

Se agranda **la letra, no el espacio**. Si crecieran también `--e1..--e7`, la pantalla se
estiraría entera y en el tamaño mayor cabría menos que antes: letras grandes y el doble de
desplazamiento para leer lo mismo.

**Dos cosas que solo aparecieron al probarlo al 150 % en el navegador**, y que valen como nota
de diseño:

- La **barra inferior** quedó como el único texto con tope (crece hasta el 125 %). Son cinco
  celdas fijas que no pueden reflujar, y al 150 % «Solicitudes» y «Asambleas» quedaban pegadas.
  Se lo puede permitir porque ninguna etiqueta va sola: cada una tiene su icono encima.
- Los **cuatro accesos del inicio** pasan a dos filas de dos en el tamaño mayor. La alternativa
  era encoger la letra, que es justo lo que Mary pidió que no pasara.

También se arregló el marcador de posición del campo de documento: con la letra al 150 % «Sin
puntos ni espacios» se cortaba a la mitad. Ahora la pista va en tamaño normal y sin el
espaciado de los dígitos; lo que se teclea sigue grande.

**Verificado en el navegador** (Playwright, iPhone 390×844 y escritorio 1280): los tres niveles
aplican, la preferencia sobrevive a recargar, no hay desbordamiento horizontal en el inicio ni
en la consola del administrador, y no hay errores de consola.

**Y dónde va el control, que Mary precisó enseguida:** *«está bien solo en la puerta cuando
estás creando tu usuario, después debe cambiarlo en la configuración»*, con la observación que
lo explica — *«la mayoría de las personas seleccionan el tamaño de letra apenas ingresan porque
es un tema de dificultad al leer»*. O sea: **se escoge una vez, al principio**, y lo de adentro
es para corregir, no para descubrir. Quedó en tres sitios: ingresar, **activar la cuenta** —que
es literalmente donde se crea el usuario, y donde faltaba— y **Tu perfil**, junto a la huella,
porque las dos son preferencias de este teléfono y no de la copropiedad.

En el perfil las tres opciones salen **desplegadas**: la hoja de ajustes ya está abierta y
esconderlas detrás de otro toque no ahorra nada. En la puerta van plegadas, donde no se puede
gastar media pantalla en algo que la mayoría toca una sola vez.

**Un error que valió la pena:** el título de la sección salió blanco sobre blanco. Dentro de la
app `.titulo-seccion` se pinta en blanco para el fondo degradado, y la hoja de perfil es
blanca. Una clase que depende del fondo donde suele vivir se rompe la primera vez que se la
saca de ahí.

**Lo que falta:** las consolas de administrador y portería no tienen dónde cambiarlo — heredan
lo que se escogió en la puerta, que es de donde vienen sus usuarios.

---

### 2026-08-28 · Mary + IA (Claude) · El puesto de portería

Mary pidió la propuesta, la aprobó y pidió construirla. Quedó en tres pantallas y con su
perfil en el demo: **Jairo Alberto Pineda · Portería · turno de la mañana**.

**La tesis que ordena el diseño:** la portería no es una app más pequeña, es **un puesto de
trabajo**. Alguien de pie, con un paquete en una mano, al que interrumpen cada tres minutos y
que entrega el turno a las seis. De ahí salen cuatro decisiones, y dos contradicen a propósito
lo que acabábamos de construir para el propietario:

1. **La sesión es del turno, no de la persona.** Nada de «recordar este dispositivo» ni huella:
   eso es correcto en el teléfono de un propietario y un agujero en un equipo donde se turnan
   tres personas. El botón de salir dice «Cerrar turno».
2. **Dos acciones, no un menú.** Validar visitante y registrar paquete son el 90 % del día, en
   botones de 76 px: la otra mano sostiene el paquete.
3. **Lo pendiente primero.** Los paquetes sin entregar y los visitantes de hoy son lo que un
   turno hereda del anterior; si hay que buscarlos, se pierden.
4. **No ve cartera ni PQRS** (RN-52). Ahora la lista de permisos vive en `reglas.ts` y el menú
   se arma con `puede()`: un permiso que solo existe como pestaña escondida no es un permiso.

**Lo que esto destapó y ya está cerrado:** hasta hoy **nadie podía validar el código de un
visitante**. El residente lo generaba (CU-R-10, que figuraba como ✅) y en la entrada no había a
quién presentárselo. Un caso de uso puede estar terminado en una app y tener la otra mitad en el
aire; esta es la clase de hueco que solo aparece cuando se dibuja el rol que falta.

La pantalla de validación distingue **las tres formas de no servir** —todavía no, ya venció,
revocado—, porque cada una se resuelve distinto: la primera llamando al residente, la segunda
pidiendo un código nuevo. «Código inválido» para las tres deja al portero sin saber qué sigue.

**Lo que falta, dicho en la pantalla:** la **minuta** —registrar el ingreso, no solo validarlo—
espera las respuestas de T-08. Y la pregunta que puede cambiar el diseño: **¿la cuenta es de la
persona o del puesto?** Si es del puesto, «quién recibió el paquete» deja de ser confiable, que
era la razón de crear el rol.

---

### 2026-08-28 · Mary + IA (Claude) · Huella, clave de 4 números y una puerta que te reconoce

Tres pedidos de Mary sobre el acceso, y el tercero es el que ordena a los otros dos.

1. **Ingreso con huella.**
2. **«Después de creado el usuario solamente debe solicitarle la contraseña.»**
3. **«La contraseña debe ser algo muy sencillo porque tenemos adultos mayores»**, y —lo que lo
   deja claro— *«entiendo los temas de seguridad que se deben implementar pero también debemos
   tener en cuenta todos nuestros usuarios»*.

**La clave pasa a ser 4 números** (RN-55). Una contraseña con mayúsculas y símbolos, tecleada en
un teléfono por alguien de 70 años, es la barrera que hace que la persona deje de entrar y
vuelva a llamar a la administración: es decir, la que hace que la app no sirva. Y la seguridad
no baja, **cambia de sitio** — que es la respuesta honesta a su tensión:

- la clave **solo sirve en un dispositivo ya probado** con un código de un solo uso (RN-54);
- **los intentos se acaban**: cinco fallos y hay que volver a pedir el código;
- quien quiera **entra con huella** y no teclea nada.

Es el razonamiento de la clave del cajero: cuatro dígitos bastan cuando hacen falta la tarjeta y
un número limitado de intentos. Sin el límite de intentos, cuatro dígitos se prueban enteros en
un rato — por eso el límite no es un adorno, es lo que sostiene la decisión.

**La puerta tiene dos caras.** Si alguien ya entró en ese teléfono, muestra su nombre y pide
solo la clave; si no, pide documento y clave. «No soy yo» vuelve al camino largo.

**La huella (RN-56) es real, y eso importa decirlo bien.** Se usa WebAuthn, el estándar del
navegador: el lector es de verdad y el dedo también. Lo que no existe todavía es el servidor que
comprobaría la credencial, así que el demo se queda con que el dispositivo confirmó la identidad
de su dueño. **Donde no hay lector, la opción no se ofrece**: no se simula una huella, porque
fingir que se leyó un dedo es la clase de mentira que después nadie descubre.

Con esto nace `servicios/plataforma.ts`, que **ADR-0002 había dejado escrito antes de que
hiciera falta**: las capacidades del dispositivo entran por una interfaz propia con dos
implementaciones. El ingreso con huella es la primera que la necesitaba.

**Detalle de accesibilidad que vale por sí solo:** los campos de números —cédula, código y
clave— van grandes, centrados y espaciados. No es decoración: es lo que decide si la persona
entra o llama a la administración.

---

### 2026-08-28 · Mary + IA (Claude) · El paz y salvo se imprime, y un modelo real corrigió el modelo de datos

Dos correcciones de Mary sobre el ADR que acababa de escribir, y las dos mejoraron el producto.

**1. «No es necesario estar conectado con nadie».** Yo había razonado sobre un instrumento que
un tercero verifica en línea; lo que la copropiedad emite es **un soporte que el propietario
adjunta a un trámite**. Con esa premisa, exigir servidor y conexión para producir una hoja que
hoy firma el administrador es desproporcionado.

Así que los documentos que el residente se lleva —paz y salvo, estado de cuenta, comprobante—
**se imprimen desde el teléfono**: un bloque `.hoja-documento` y una hoja `@media print` que
oculta el resto de la app. El sistema operativo ofrece «Guardar como PDF». Sin servidor, sin
conexión y **sin agregar una sola dependencia**. El acta y la convocatoria siguen esperando el
backend, porque son instrumentos de la copropiedad y algún día pueden exigir firma.

**CU-R-12 queda terminado.** Era el más viejo de los pendientes de fase 1.

**Y una vista previa dentro de la app** (Mary: «es necesario verlo en la app, por si hay
errores ajustarlos»). El botón «Ver cómo queda» muestra el documento en pantalla, tal como
saldrá impreso. El aspecto del certificado quedó definido **una sola vez** y lo usan las dos
caras —la previa y el papel—: tenerlo dentro de `@media print` obligaba a repetirlo, y dos
copias del mismo documento se separan en cuanto alguien toca una. De paso resuelve que el marco
del demo publicado bloquee el diálogo de impresión: la previa se ve igual.

**Un perfil nuevo en la semilla: un propietario que no debe nada** (Mary). Sin él nadie podía
emitir un paz y salvo sin pagar primero, porque el saldo incluye lo ya facturado (RN-26) y a
todo el mundo se le factura el mes siguiente por anticipado. Jorge Enrique Valencia, Torre 1
apto 202, pagó por adelantado — un caso normal, y el que hay que poder mostrar. De paso, el
botón de la tarjeta con saldo pendiente ahora lleva a **pagar**, no a mirar el estado de
cuenta: quien entró ahí quería su certificado.

**2. El modelo real.** Mary aportó un paz y salvo de verdad —el del Edificio Cocora— y leerlo
corrigió dos supuestos míos que ya estaban en el código:

- **El documento no dice «vale 30 días»; dice hasta qué día la unidad está al día.** No es la
  caducidad del papel, es el alcance de lo que certifica. El campo pasó de `vigenteHasta` a
  **`cubiertoHasta`**, y con él se fue el chip de «Vencido» del historial: un certificado no
  caduca solo, y decir que sí era decir algo falso.
- **Nombra el parqueadero** y admite **varios propietarios**. Las dos cosas estaban en el
  modelo de datos sin usarse; ahora salen impresas.

De paso responde **quién firma** —el administrador, con cédula, cargo y contacto—, que era una
de las preguntas abiertas de §3 ter.

La lección para lo que viene: **pedir el documento real antes de diseñar la pantalla**. Media
hora de leer un paz y salvo de verdad corrigió lo que dos días de suponer habían dejado torcido.

---

### 2026-08-28 · Mary + IA (Claude) · ADR-0006, los documentos formales

Escrito y aceptado. Era el que bloqueaba más trabajo: cinco casos de uso esperaban un PDF
—paz y salvo, estado de cuenta, comprobante, convocatoria y acta—.

El criterio que ordenó toda la decisión: **un documento formal no es un dibujo bonito de unos
datos; es una afirmación que un tercero va a usar para tomar una decisión, y tiene que poder
comprobarse sin la app.** Quien recibe el paz y salvo —una notaría, un banco, quien va a
comprar el apartamento— no tiene Idiky instalado.

De ahí salen cinco decisiones:

1. **Se generan en el servidor, nunca en el cliente.** La razón no es el rendimiento: la app
   corre en el teléfono de quien tiene interés en el resultado, y un cliente modificado puede
   pintar «está a paz y salvo» sobre una unidad en mora. Además, el día que lleven firma
   electrónica, la llave privada no puede vivir en miles de teléfonos.
2. **Se dibujan con HTML y CSS**, no con un lenguaje de coordenadas: la identidad ya está
   escrita en `tokens.css`, y volver a escribirla en otro idioma la desincroniza. Un paz y
   salvo con un azul distinto al de la app parece falso.
3. **El archivo se guarda, no se regenera.** Un paz y salvo dice que la unidad no debía nada
   *el 15 de marzo*; regenerarlo en junio produciría otro documento con el mismo número.
4. **Se verifica desde fuera**: número consecutivo más un código aleatorio, y una página
   pública que responde solo tipo, unidad, fecha y si está vigente o anulado. Nada de nombres,
   cédulas ni montos: quien verifica necesita saber que el papel es auténtico, no la vida
   financiera del propietario.
5. **Un documento no se borra, se anula**, y la verificación lo dice — que es justo lo que hay
   que saber si presentan una copia vieja.

**La consecuencia incómoda, dicha de frente:** los PDF no existen hasta que exista el backend.
Los cinco casos de uso quedan bloqueados por ADR-0008, no por esta decisión. Lo que sí se puede
hacer antes es lo que ya hace el paz y salvo: emitir y registrar el documento.

En el demo entró la parte que sí se puede: el certificado ya trae su **código de verificación**
—sin las letras que se confunden al dictarlo, la I con el 1 y la O con el 0— y la pantalla
explica para qué sirve. `codigoVerificacion` deja de ser una pregunta abierta en el modelo.

**Lo que el ADR no responde, a propósito**, porque es de producto y sigue en §3 ter: quién
firma el paz y salvo, cuánto vale (los 30 días de hoy son un supuesto), si el comprobante tiene
requisitos fiscales, y si el paz y salvo necesita autorización previa del administrador.

---

### 2026-08-28 · Mary + IA (Claude) · La puerta de la app

Mary señaló el hueco de fondo: **«lo que hemos trabajado son las pantallas adentro de la app»**.
Cierto —cartera, asambleas, solicitudes— y la puerta no existía: en su lugar había una lista de
perfiles, que es un atajo de demostración y no una pantalla de producto.

Tres decisiones suyas la definieron:

1. **Se identifica con el documento.** Es lo que la administración ya tiene de cada propietario
   y no cambia cuando cambia el correo o el celular.
2. **Contraseña y, en un teléfono nuevo, además un código de un solo uso** (RN-54). Desde la
   app se paga plata; el segundo factor solo en dispositivo nuevo evita que el trámite estorbe
   todos los días.
3. **La cuenta nace vinculada** (RN-53): la administración registra la unidad y sus residentes
   (CU-A-02), y la persona **activa** su cuenta —no la crea—. Nadie entra a una copropiedad
   sin que la administración lo haya puesto ahí.

De ahí salieron tres pantallas: ingreso, activación en tres pasos (documento → código →
contraseña) y recuperación, que es el mismo trámite con otro texto. Todas con el degradado de
la marca: es la primera pantalla que ve alguien, y la única donde la marca se ve antes de que
empiece a leer datos.

**Lo que el demo no hace, y lo dice.** No guarda ninguna contraseña —ni cifrada ni en claro—,
acepta cualquiera con la longitud mínima, y el código se muestra en pantalla. Guardar
credenciales de mentira enseñaría la forma equivocada, y un código que nunca llega haría el
demo inmostrable. Cada pantalla lo advierte. ADR-0004 quedó actualizado con esa tabla.

El atajo de perfiles sigue, plegado debajo: hace falta para mostrar la consola del
administrador sin teclear cédulas. Ya no es la puerta.

**Y las torres del fondo también** (Mary): la puerta y el interior son el mismo edificio. Al
llevarlas allá se sacaron a `componentes/SiluetaTorres.tsx`: estaban dibujadas a mano dentro
del cascarón del residente, y un dibujo repetido en dos sitios se desincroniza el día que
alguien cambia uno.

Un efecto secundario que vale la pena: como el acceso arma la sesión desde la persona y su
residencia, **los doce residentes de la semilla pueden entrar con su documento**, no solo los
tres perfiles. El demo se siente menos maqueta.

---

### 2026-08-28 · Mary + IA (Claude) · El rol de portería, y Bre-B como medio de pago

**Se crea el rol de portería** (Mary). Salió de una pregunta suya: ¿quién debería registrar los
paquetes que llegan? El administrador no: el domiciliario llega a las siete de la noche o un
sábado, y un registro hecho al día siguiente pierde la hora real. Además **registrar es asumir
la custodia**, y el portero suele ser empleado de una empresa de vigilancia externa — con la
cuenta del administrador vería la cartera de todos.

De ahí salen tres cosas, y el orden importa porque **la app del propietario va primero** (Mary):

1. **El rol existe en el modelo:** `RolUsuario` ya admite `porteria`, y RN-52 dice qué puede
   hacer —correspondencia y validar visitantes— y qué no: cartera y PQRS, no.
2. **El hueco que la pregunta destapó, tapado:** `Correspondencia.registradoPor`. La entidad
   guardaba quién *retira* el paquete pero no quién lo *recibió* del mensajero. Si se pierde, el
   registro no decía quién lo tenía.
3. **La consola de la portería queda documentada, no construida** (CU-P-01, CU-P-02, ámbito
   nuevo `CU-P`). Se alcanzó a escribir y se dejó fuera al confirmar Mary el orden. Ahí queda
   dicho lo que falta decidir: la minuta, los turnos, si se registra el ingreso además de
   validarlo.

Vale anotar lo que CU-P-02 deja a la vista: **hoy nadie puede validar el código de un
visitante**. El residente lo genera (CU-R-10) y en la entrada no hay a quién presentárselo. Es
la mitad que le falta a un caso de uso que figura como ✅.

**Bre-B entra como medio de pago** (Mary). El sistema de pagos inmediatos del Banco de la
República: se paga con una llave desde el banco propio y llega al instante. Está en la pantalla
de pago del residente y en el registro manual del administrador. La opción lleva una línea que
explica qué es: es nuevo y un medio de pago que hay que adivinar no se usa. **Integrarlo de
verdad es decisión de fase 2**, como PSE: el demo lo simula.

**Cerrar sesión toma color** (Mary eligió entre dos propuestas): relleno azul suave de marca,
el mismo del avatar que está arriba en esa hoja, para que el bloque se lea como parte del
perfil. Ni violeta —el color de la acción principal, y salir no lo es— ni rojo, reservado para
la plata.

**Y tres defectos del revisor de ortografía.** Descartaba las líneas que contuvieran `id: '`, y
`{ id: 'pse', texto: 'PSE / debito a cuenta' }` lleva las dos cosas: el descarte se llevaba por
delante el texto visible. Así llevaban semanas «debito» y «credito» en la pantalla de pago.
Tampoco seguía los comentarios `/* … */` que no empiezan con `{`, ni descartaba las líneas de
una unión de tipos (`| 'mas'`). Corregidos los tres, y de paso entró `mas` → `más` al
diccionario: la forma sin tilde existe, pero equivale a «pero» y no aparece en una interfaz.
Salieron «la deuda mas antigua», «Que vas a pagar» y «Cuanto pesa tu voto».

---

### 2026-08-27 · Mary + IA (Claude) · Un destino, una identidad

Mary vio dos caminos al mismo sitio: el acceso directo del inicio y la pestaña de la barra.
Mi primera lectura fue quitar el acceso directo, y me corrigió: **no se elimina del inicio**.
Tenía razón, y la corrección afina la regla.

El problema no era que el destino apareciera dos veces —el acceso del inicio y la pestaña son
dos alcances distintos, la mano a lo de hoy y la navegación permanente—. El problema era que se
**veía** como dos destinos: el acceso llevaba el ícono de PQRS y caía en el segmento de PQRS,
mientras la pestaña llevaba la bandeja y caía en la vista. Dos dibujos y dos aterrizajes para
el mismo sitio.

**Ahora se repite entero:** mismo ícono, mismo nombre y mismo aterrizaje (`/app/solicitudes`).
Y el contador aparece **una sola vez**, en el acceso del inicio, junto a los de Visitantes y
Paquetes, que es donde se compara con ellos. Quedó escrito en las convenciones como «un
destino, una identidad».

De paso quedó nombrada una regla que no existía: `solicitudesEsperandoRespuesta()` en
`reglas.ts` suma la PQRS sin cerrar y la reserva sin aprobar, porque la persona las vive igual
—«pedí algo y no me han contestado»— aunque en el modelo sean dos entidades. El acceso directo
antes contaba solo las PQRS. El paz y salvo no cuenta: se emite solo, no lo aprueba nadie.

---

### 2026-08-27 · Mary + IA (Claude) · Asambleas en el menú y Solicitudes unificado

Tres pedidos de Mary sobre la barra inferior del residente, en orden:

1. **Asambleas entra al menú.** Es donde el copropietario decide, y no tenía pestaña.
2. **Reservas y PQRS se unifican en Solicitudes.** Son la misma acción vistas desde quien la
   hace: pedirle algo a la administración.
3. **Solicitudes son tres, no dos:** reservar zona común, radicar una PQRS y **generar el paz
   y salvo**.
4. **En asambleas se vota**, y vale para la ordinaria y para la extraordinaria.

La barra queda en cinco: Inicio · Cuenta · Solicitudes · Asambleas · Cartelera. Las rutas
viejas (`/app/reservas`, `/app/pqrs`) redirigen, por si alguien las dejó guardadas en la
pantalla de inicio del teléfono.

**Lo que se construyó de asambleas, y lo que no.** Entraron `Asamblea`, `PuntoOrdenDelDia`,
`Votacion` y `Voto`; el residente ve la citación y el orden del día (CU-R-20), vota los puntos
(CU-R-13) y ve el conteo por coeficiente. Quedaron fuera **a propósito** `Asistencia`, `Poder`
y el quórum: dependen de RN-28 y RN-30, que el equipo no ha confirmado (T-10, T-11).

De ahí la línea que se respetó en la pantalla: **la app cuenta los votos, pero no dice si el
punto se aprobó.** Contar por coeficiente es aritmética y ya está resuelto (RN-27); declarar
aprobado exige la mayoría exigida y el quórum de instalación, que es derecho y no se escribe de
memoria. La pantalla lo dice en voz alta en vez de inventarlo.

**Regla nueva: vota el propietario (RN-51).** Sale de la palabra que usó Mary. El arrendatario
usa la copropiedad pero no decide sobre ella: el voto va con la propiedad, igual que la cuota.
Falta definir el rol `autorizado` y el apoderado (CU-R-23). La comprobación quedó en el
repositorio y no solo en la pantalla, que es lo que pedía T-16: esconder un botón no es una
regla.

**Paz y salvo (CU-R-12), a medias y con la mitad que faltaba dicha.** Se implementó lo decidido
—RN-26 (saldo cero) y RN-36 (consecutivo)—: el certificado se emite, queda registrado y se ve
en pantalla. **Falta el PDF**, que es ADR-0006.

Y una pregunta que apareció construyéndolo, ya respondida: ¿«saldo cero» incluye la cuota del
periodo que aún no vence? **Sí, incluye lo ya facturado** (Mary, 2026-08-27). Estar sin mora no
basta: el certificado afirma que la unidad no debe nada, y lo facturado se debe. Como el caso
desconcierta —no estoy atrasado y aun así no puedo emitir—, la pantalla lo explica cuando el
saldo existe pero no hay nada vencido.

**De paso, la ortografía.** El revisor solo miraba las pantallas, no los datos de ejemplo —que
es justo lo que se lee en una demostración—. Se extendió a `semilla.ts` y aparecieron 78
palabras sin tilde («salon social», «orden del dia», «informe de gestion»). Se corrigieron
todas. Se le agregó además una comprobación nueva: **la pregunta se abre y se cierra**; cuatro
frases nuevas se habían escrito «Aprueba el presupuesto?». Lo que la herramienta no puede
decidir —`esta`/`está`, `cual`/`cuál`— se corrigió a mano, y queda dicho en las convenciones
que ahí no hay diccionario que valga.

---

### 2026-08-27 · Mary + IA (Claude) · Parametrizar la cartera, no cobrar caso por caso

Mary precisó la palabra: el administrador de la copropiedad es quien tiene el rol para
**parametrizar** las cuotas, las multas y los intereses. Vale la pena tomarla al pie de la
letra, porque separa dos actos que hasta ahora iban juntos en RN-49:

- **Parametrizar** es definir qué existe y cuánto vale —el valor de la ordinaria, el catálogo
  de multas, la tasa y si se cobra, los conceptos adicionales—. Es facultad exclusiva del
  administrador de esa copropiedad (RN-49).
- **Que el cobro caiga en una unidad** se sigue de esa parametrización y de su regla, no de una
  decisión caso por caso (RN-50, nueva). El interés lo liquida el sistema sobre lo vencido; la
  multa se escoge del catálogo y solo genera cuota cuando queda firme; la extraordinaria se
  traslada del acta.

El administrador **configura la regla; no toca el caso**. Eso es lo mismo que protege al
administrador cuando el copropietario reclama: el cobro no es una decisión suya sobre esa
unidad, es la regla vigente aplicada a todas.

**Y deja una frontera con nombre:** ¿puede ajustar el valor de una multa al imponerla? Si puede,
sí está decidiendo sobre el caso. Estaba marcado con **(?)** en el modelo; ahora se sabe por qué
importa. Sigue en §3 quater del levantamiento.

---

### 2026-08-27 · Mary + IA (Claude) · Cobrar es una facultad del administrador

Mary cerró quién origina un cobro: **solo el administrador, desde su perfil** (RN-49). Aplica a
todo lo que entra en la cartera —ordinaria, extraordinaria, multa, cobro adicional, interés—.
En la app del residente no hay ninguna acción que cree un cobro, y esa asimetría es
deliberada: quien debe el dinero no puede tocar lo que debe.

Con una precisión que ya había aparecido con la tasa de interés: es **el administrador de esa
copropiedad**, no cualquiera con perfil de administrador (RN-01).

**Y esto destapó una deuda concreta.** Hoy la regla vive solo en la interfaz: `App.tsx` protege
`/admin`, pero `generarCuotas()` en el repositorio **no recibe quién la llama ni lo comprueba**.
En el demo da igual —cada quien corre su copia—, pero es justo la clase de comprobación que no
puede quedarse en el cliente: con backend, el servidor tiene que verificar rol y copropiedad sin
confiar en que la petición venga de la consola. Anotado en T-16, que ya recogía «validar las
reglas en el repositorio y no solo en la UI»; ahora tiene un primer caso con nombre.

---

### 2026-08-27 · Mary + IA (Claude) · El respaldo se justifica, y la extraordinaria tiene destino

Cuatro precisiones de Mary que endurecieron el principio del respaldo, en orden:

**1. La extraordinaria siempre se aprueba en asamblea.** No admite la opción «reglamento» que
sí tienen las multas y la tasa: su respaldo es siempre un acta (RN-46).

**2. El respaldo se justifica por escrito.** Primero se planteó exigir el acta **adjunta**, y
Mary lo corrigió: en su lugar va una **casilla de justificación que alude al acta y a su
fecha** (RN-47). Sin ella el cobro no se crea, y el copropietario la lee desde su estado de
cuenta.

Vale dejar dicho el costo, porque la razón para adjuntar era buena: un acta citada a mano es
más débil que el documento —la fecha puede estar mal, o el acta puede no decir eso— y el
copropietario no puede verificarla solo. Se acepta a cambio de no meter en la fase 1 una
capacidad que la app no tiene: **almacenar archivos que suben los usuarios**. Cuando exista
(fase 2, ADR-0006), el adjunto **se suma** a la justificación; no la reemplaza, porque el texto
es lo que se lee de un vistazo.

**3. La extraordinaria tiene destinación específica.** La asamblea no aprueba «una
extraordinaria», aprueba una extraordinaria **para algo** (RN-48). Escribir otra cosa es cobrar
por algo que nadie votó.

**4. Y el concepto sí es texto libre.** Segunda corrección de Mary, sobre la conclusión que yo
había sacado del punto 3: el «para qué» puede ser un proyecto de mejora de zonas comunes,
reparar un daño del edificio, automatizar la entrada —no hay lista que las cubra—. El campo es
abierto; lo que no es discrecional es **el hecho** que describe. La distinción que importa: no
se restringe el formato del dato, se exige que corresponda a lo aprobado, y eso lo sostiene la
justificación del punto 2, no un menú desplegable.

**Dos consecuencias que exceden la cartera**

- **Recibir archivos sigue pendiente, ahora sin bloquear la fase 1.** No hay nada en el demo ni
  en el modelo que guarde un PDF subido por alguien: dónde viven, qué tamaño se admite, quién
  puede verlos. Queda anotado en ADR-0006, que hasta ahora solo trataba **generar** documentos.
  Generar un PDF y recibir uno son problemas distintos.
- **La destinación específica es dato contable.** Lo recaudado por una extraordinaria tiene que
  poder cruzarse con lo gastado en esa destinación, y eso vive en la aplicación contable de
  Jeimy. Es el primer caso concreto de lo que las dos apps tienen que intercambiar (T-17).

**El demo hoy incumple RN-46.** `CarteraPage` genera extraordinarias sin pedir acta, así que
CU-A-05 pasó de ✅ a 🟡.

---

### 2026-08-27 · Mary + IA (Claude) · El principio del respaldo

Mary precisó que **las multas solo se dan si están en el reglamento de copropiedad o fueron
aprobadas en asamblea**. Es la tercera vez que aparece la misma forma —ya había pasado con la
tasa de interés, y aplica igual a las cuotas extraordinarias—, así que se nombró como regla
transversal (RN-45) en vez de repetirla caso por caso:

> **Ningún cobro que no sea la cuota ordinaria puede existir sin apuntar a qué lo autoriza: el
> reglamento de la copropiedad o un acta de asamblea.**

En el modelo son siempre los mismos tres campos: `origen`, `actaId` y `referencia`. Los llevan
`TasaInteres` y `ConceptoSancion`.

**Y eso destapó un hueco que nadie había señalado:** `Cuota` **no los tiene**, así que una
cuota extraordinaria hoy se puede generar sin acta que la respalde. Una extraordinaria sin
respaldo es tan impugnable como una multa inventada. Queda en RN-45, pendiente.

La consecuencia práctica del principio: cuando un copropietario pregunte «¿por qué me cobran
esto?», el sistema siempre puede responder con un acta o un artículo, y no con un número
suelto.

---

### 2026-08-27 · Mary + IA (Claude) · Multas y cobros adicionales entran al alcance

Mary pidió que el administrador pueda cobrar **cuotas adicionales** y **multas**, y que dentro
de multas exista un subnivel para definir cuáles existen. Salió de una pregunta suya: dónde se
elige el concepto de un pago.

**Lo que la pregunta destapó.** El residente no elige concepto a propósito —RN-06 imputa a la
deuda más antigua—, pero al revisarlo apareció que `TipoCuota` ya contemplaba `interes` y
`sancion` y **nada en la app los generaba**. Eran valores muertos en el modelo.

**Lo documentado** — CU-A-22 (catálogo de multas), CU-A-23 (imponer una multa), CU-A-24 (cuota
adicional), más las entidades `ConceptoSancion` y `Sancion` y las reglas RN-38 a RN-41.
`TipoCuota` gana `'adicional'`.

Una decisión de modelado que evita trabajo: **una multa y un cobro adicional no son entidades
nuevas en la cartera, son `Cuota` con su tipo**. Así entran solos en el saldo, en la imputación
por antigüedad y en el estado de cuenta, sin tocar nada de eso.

**⚠️ CU-A-23 queda bloqueado, y no por falta de tiempo.** La Ley 675 de 2001 exige **debido
proceso** antes de sancionar: hay que oír al copropietario. Una app que imponga una multa de un
toque y la mande directo a la cartera puede producir **multas nulas** y demandas contra la
administración. Por eso `Sancion` se modeló con estados —propuesta, notificada, en descargos,
firme— y la cuota nace **solo cuando queda firme** (RN-39).

Cuántos estados hacen falta, quién impone, quién resuelve los descargos y con qué plazo **sale
del reglamento de la copropiedad**, no de un supuesto nuestro. Las preguntas quedaron en
[`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md) §3 quater.

**Qué sí se puede construir ya:** el catálogo (CU-A-22) y la cuota adicional (CU-A-24). Ninguno
tiene consecuencias jurídicas.

**El interés de mora, configurable por copropiedad**

Mary añadió: se calcula según la normativa vigente en Colombia, pero **cada copropiedad decide
si lo cobra**, porque no todas lo hacen. Eso cerró en parte una pregunta que estaba abierta
desde el arranque. Quedó como CU-A-25 y RN-42.

La parte técnica que obliga a decidir: **«normativa vigente» significa una tasa que cambia y
que fija una autoridad externa**, con un tope legal por encima del cual el cobro es usura. Un
número escrito en el código quedaría desactualizado y expondría a la copropiedad. Por eso la
tasa se modeló como `TasaInteres`, un dato **con vigencia y fuente** (RN-43), y no como una
constante.

**La ley pone el techo, la asamblea pone la tasa.** Mary precisó que, aunque hay una norma que
regula el interés de mora, **cada copropiedad tiene su propio reglamento y sus aprobaciones de
asamblea**. Eso cambió el modelo para mejor: `TasaInteres` no guarda solo un número, guarda
**qué lo autoriza** — el artículo del reglamento o el acta de la asamblea que lo aprobó. Y esa
referencia al acta **enlaza el módulo de cartera con el de asambleas** (CU-A-20).

Sin eso, un copropietario que pregunte «¿por qué me cobran este interés?» no tiene respuesta.
Con eso, la respuesta es un acta o un artículo.

**Quién mantiene la tasa: el administrador de cada copropiedad** (Mary, 2026-08-27). Eso tiene
una consecuencia de diseño: si la teclea una persona, se puede equivocar o dejarla vieja, y
cobrar por encima del tope es usura. Así que el sistema **rechaza una tasa sobre el tope legal
y avisa cuando la vigente está vencida** (RN-43). No evita el error, pero lo hace visible.

Lo que **no se escribió y no se debe escribir de memoria**: cuál es la tasa aplicable y su
tope. Eso hay que verificarlo en la ley, igual que el tope de poderes de asamblea — y ahora es
más urgente, porque el freno del sistema depende de conocer ese tope.

Con el interruptor y sin las respuestas se puede construir CU-A-25, pero no el cálculo.

---

### 2026-08-27 · Mary + IA (Claude) · Las tildes, y una herramienta para no perderlas

Mary: «cuidado con el tema de la ortografía, dice mucho de la calidad de una aplicación».
Tenía razón y el alcance era mayor de lo que parecía: **toda la interfaz estaba escrita sin
tildes**, no solo la palabra que señaló.

**Por qué no bastaba arreglarlo a mano.** La primera pasada dejó fuera frases que estaban
solas en su línea, sin etiquetas alrededor —«Generar codigo de acceso» entre ellas—. Por eso
se hizo `herramientas/revisar-ortografia.py`, que recorre el texto visible y falla si encuentra
algo. Entra en la definición de "terminado".

**Lo difícil no era encontrar, era no dañar.** El detector marcaba de entrada
`sesion!.personaId`, `telefono: ''` y `descripcion?: string`, que son código. Y marcaba
`autor: 'administracion'`, que es el **valor del dominio** que distingue quién escribió un
mensaje: con tilde se rompería la comparación. La regla que los separa quedó escrita en las
convenciones y dentro de la herramienta:

> Una etiqueta visible nunca es una sola palabra en minúscula.

Con eso, `texto: 'Peticion'` se corrige y `id: 'peticion'` se respeta.

---

### 2026-08-27 · Mary + IA (Claude) · El botón de confirmar quedaba bajo la barra

**El síntoma.** Al abrir el modal para radicar una PQRS o autorizar un visitante, el botón de
confirmar aparecía **partido por la barra inferior**. Y no era solo visual:
`document.elementFromPoint` en el centro del botón devolvía la barra, así que **el botón no
recibía el toque**.

**La causa fue un efecto colateral del degradado.** Para poner el contenido sobre la zona de
marca se le había dado `z-index: 1` a `.contenido-movil`. Eso **crea un contexto de
apilamiento**, y los modales de las pantallas viven dentro de ese contenedor: su `z-index: 60`
dejó de competir con la barra inferior (30) y pasó a competir solo dentro de la caja. La barra
ganaba.

Se quitó el `z-index`. `position: relative` sin `z-index` basta para quedar sobre la zona de
marca, porque entre elementos posicionados sin `z-index` decide el orden del DOM — y no crea
contexto de apilamiento.

De paso, el fondo del modal descuenta `env(safe-area-inset-bottom)`: sin eso, en un teléfono
con muesca el botón queda pegado al borde y encima del indicador del sistema.

**La lección, que vale para lo que viene:** `z-index` no es un número global. Cada
`position` + `z-index` encierra a sus hijos. Antes de poner uno, hay que preguntarse qué queda
atrapado dentro — aquí quedaron atrapados todos los modales de las pantallas.

---

### 2026-08-27 · Mary + IA (Claude) · Dos ajustes de texto

**Un solo nombre para el mismo número.** El inicio decía «Valor adeudado» y el estado de
cuenta «Saldo total», del mismo dato y para la misma persona. Ahora los dos dicen **«Valor
adeudado»**. «Saldo» se queda en la consola del administrador, donde quien lee es contable, y
en el código (`calcularSaldo`, RN-03): el nombre del dominio no cambia, cambia lo que lee la
persona.

**Fuera el título repetido.** En Zonas comunes la barra superior decía «Zonas comunes» y justo
debajo el título de sección lo repetía. Se eliminó el segundo.

---

### 2026-08-27 · Mary + IA (Claude) · Decisión final: degradado completo y acción en violeta

Mary eligió, viendo las versiones renderizadas: **el degradado cubre el fondo de toda la app
del residente**, fijo a la pantalla, y **el color de acción es un violeta tomado del propio
degradado** (`#812485`, al 60 % del recorrido).

Se había propuesto lo contrario —volver a una banda— con el argumento de que el degradado a
pantalla completa no dejaba trabajar a los demás colores. El argumento era correcto en los
hechos y equivocado en la conclusión: **los cinco problemas ya estaban resueltos** uno por uno,
así que el costo estaba pagado. La decisión era de producto, no técnica. La banda se revirtió.

**Dos cosas que el violeta obligó a resolver**

1. **El chip del filtro puede disolverse en el fondo.** El violeta sale del degradado, así que
   en algún punto del scroll coincide con él. El filtro elegido lleva ahora un **filo claro**
   que lo despega siempre. Regla general: todo control apoyado directamente sobre el
   degradado, sin tarjeta debajo, necesita ese filo.
2. **La puerta del logotipo perdió su brillo.** Usaba `--color-acento`, así que se volvió
   violeta y se apagó contra el azul. Pasa a `--color-marca-claro` —el fucsia del extremo del
   degradado—: **el logotipo no es un control** y no debe cambiar si mañana cambia el color de
   los botones.

---

### 2026-08-27 · Mary + IA (Claude) · El inicio deja de ser cajas blancas

**El diagnóstico**

Mary: «el inicio está muy básico, queremos una app que tenga también una marca». Lo que lo
hacía verse básico no era la falta de color: era que **todo pesaba igual**. Barra, saldo,
accesos y secciones eran bloques del mismo tamaño apilados, y las cuatro tarjetas eran
rectángulos blancos idénticos que se leían como una sola mancha.

**Zona de marca**

El encabezado y el saldo dejan de ser dos bloques y pasan a ser uno: el degradado ocupa el
tercio superior, con borde inferior curvo para que lea como un techo sobre el contenido. El
monto va directo sobre el degradado y los accesos flotan montados sobre el borde. Detrás, una
**silueta de torres** al 9 % de opacidad, con el mismo trazo del logotipo: es la copropiedad,
no una textura cualquiera.

En el inicio la barra pierde su fondo y **deja de ser pegajosa a propósito**: transparente y
pegajosa dejaría pasar el contenido por debajo.

El chip rojo de mora no se lee sobre el fucsia, así que en la zona de marca la alarma la da el
contraste —blanco translúcido— y no el tono.

**Cada sección con su carácter**

| Sección | Tratamiento | Por qué |
|---|---|---|
| Comunicado | Borde azul a la izquierda | Es texto editorial; un icono competiría con el chip de categoría |
| Tu unidad | Distintivo en azul suave | |
| Próxima reserva | **Bloque de calendario** (2 · SEP) | Una reserva es una fecha, y así se reconoce sin leer |
| Portería | **Superficie fucsia** | El fucsia significa acción en toda la app: algo te espera y no lo has resuelto |

Y los encabezados dejaron de ser todos la misma etiqueta gris en mayúsculas: ahora el título
tiene peso y, donde hay más que ver, la acción vive en el encabezado («Ver cartelera»).

**El degradado pasa a cubrir toda la vista, fijo a la pantalla**

Mary quiso probar el degradado en toda la pantalla y no solo en el tercio superior. Se probó
la versión directa —el degradado estirado con el alto del contenido— y **se descartó**: el
color de cada punto acababa dependiendo de cuántos datos tuviera la persona. Con tres
comunicados y dos reservas, la misma zona de la pantalla sería de otro color, y la marca
dejaría de ser una constante.

La versión que quedó fija el degradado **a la pantalla, no al contenido** (`position: fixed`
limitado al ancho de la columna móvil), y el contenido pasa por encima al desplazarse.

Cubrir todo el fondo cuesta dos señales, y las dos se recuperaron en otro soporte:

| Señal perdida | Cómo se recuperó |
|---|---|
| «Ver cartelera» era azul y por eso se leía como tocable; en blanco plano se confundía con el título | Pasa a una pastilla translúcida |
| La portería avisaba con superficie fucsia, que sobre fondo fucsia desaparece | Avisa con un filo fucsia a la izquierda, igual que el comunicado con el suyo |

El texto blanco se midió en todo el recorrido del degradado: 12,2:1 en el extremo azul, 9,2:1
a la mitad y 5,4:1 en el fucsia. Pasa AA en los tres puntos.

**El degradado pasa a todas las vistas del residente**

Ya no es solo el inicio: el degradado fijo es el fondo de toda la app del residente. Eso obligó
a dos correcciones:

- Los textos que van **sueltos, sin tarjeta** —títulos de sección en mayúsculas, párrafos de
  ayuda— estaban en gris oscuro y quedaban ilegibles sobre el color. Pasan a blanco.
- **La alerta de mora parecía un enlace.** Era una pastilla translúcida, idéntica a las de
  «Ver cartelera» y «Ver reservas», que son navegación. El dato más alarmante de la app
  —«$ 4.119.500 vencido · 78 días de mora»— estaba vestido de control. Ahora es una pastilla
  **blanca sólida con el rojo dentro**: el blanco le devuelve al rojo un fondo donde se lee, y
  la solidez la distingue de los controles translúcidos.

Esto último es la misma lección de ayer con el botón de cerrar sesión, al revés: allá se usó
el rojo donde no correspondía, aquí se le quitó el soporte donde sí hacía falta.

**El botón primario pasa al color de acción**

El azul marino de los botones se enturbiaba sobre el degradado. Pero el problema de fondo era
otro: **la regla decía una cosa y el código hacía la contraria.** El fucsia estaba definido
como «lo que puedes hacer» y todas las acciones de la app —pagar, reservar, radicar,
autorizar— usaban el azul, que es el color de «dónde estás».

La prueba estaba en el CSS: **`.boton--acento` existía con el estilo fucsia y no lo usaba
ninguna pantalla.** El color de acción estaba definido y muerto.

Ahora `.boton--primario` es fucsia y `.boton--acento` se eliminó, porque pasaron a ser lo
mismo. Texto blanco sobre el botón: 5,37:1, y 7,20:1 presionado.

El **filtro elegido** siguió el mismo camino, por la misma razón. Eso dejó dibujada la línea
entre los dos colores, que quedó escrita en las convenciones: **lo que se navega es azul
—la pestaña activa, la barra, el lateral— y lo que se acciona es fucsia.** Un filtro no es un
sitio donde estás, es un control que tocaste.

**La parte blanca**

Las tarjetas tenían filete de 1 px más una sombra apenas visible, y esa combinación es la que
las hacía ver de maqueta. Perdieron el filete, se apoyan solo en la sombra y el fondo se
profundizó de `#f5f5fb` a `#eceef7` para que se despeguen.

> ⚠️ **Al oscurecer el fondo, `--color-texto-tenue` se cayó del contraste AA** (bajó a
> 4,41:1). Hubo que oscurecerlo con él, a 4,62:1. **Los grises van amarrados al fondo:** si se
> vuelve a tocar `--color-fondo`, hay que volver a medirlos.

**Tres defectos encontrados al verificar**

1. **Texto centrado en las tarjetas.** `.fila` reparte con `space-between`, así que separaba
   el distintivo del contenido. Se creó `.tarjeta__cuerpo`. Regla: **`.fila` es para repartir,
   no para agrupar.**
2. **El hueco inferior no descontaba la safe-area**, que la barra inferior sí suma a su alto.
3. Un tercer «defecto» resultó no serlo: en capturas con `fullPage` la barra inferior aparece
   cortando el contenido, porque es `position: fixed`. En la app no ocurre.

---

### 2026-08-27 · Mary + IA (Claude) · El círculo «MR» dejó de cerrar la sesión

**El hallazgo**

Mary, recorriendo el demo, preguntó qué era el círculo «MR» de la barra: **creyó que era el
botón de volver**. En realidad son sus iniciales y **cerraba la sesión de un toque, sin
preguntar**. Si la persona que construye el producto lo leyó mal, cualquier residente lo hará.

Tres defectos en un solo control:

| | |
|---|---|
| Parecía identidad, hacía una acción | Un avatar invita a «ver quién soy», no a salir |
| Sin etiqueta visible | Solo tenía `title`, que en un teléfono no se muestra nunca |
| Destructivo e inmediato | Un toque accidental terminaba la sesión, sin confirmar |

Y medía 38 px, cuando el mínimo recomendado para el dedo son 44.

**Qué se hizo**

Se evaluaron tres salidas —abrir el perfil, un botón «Salir» explícito, o mover el perfil a
los accesos del inicio— y Mary eligió la primera: **el círculo abre una hoja de perfil** con
el nombre completo, el rol, la unidad y el correo, y dentro está «Cerrar sesión».

Arregla los tres defectos de una vez: el círculo significa lo que la gente espera, la app gana
el único sitio donde el residente ve quién es para el sistema, y la salida queda detrás de un
paso deliberado, que es lo que corresponde a algo irreversible.

**El botón de la hoja salió del rojo**

La primera versión pintaba «Cerrar sesión» con el rojo de error, y Mary notó que los colores
de la hoja no eran los de la app. Tenía razón, y el fallo era contra **nuestra propia regla**:
el rojo está reservado para la plata —mora, cuota vencida, cartera vencida—
([`08-convenciones.md`](./08-convenciones.md)). Cerrar sesión no es un error ni pierde nada, y
pintarlo de rojo le quitaba fuerza a la señal que sí tiene que alarmar. Ahora es un botón
neutro.

Vale como recordatorio: la regla estaba escrita y aun así se rompió al primer intento. Si
aparece un color fuera de los tokens de la superficie donde está, es un error, no una
variación.

**La barra, alineada**

La unidad y el avatar estaban centrados contra las dos líneas de la izquierda, así que
flotaban entre el logotipo y el título sin pertenecer a ninguno. Ahora la fila se alinea
abajo: quedan a la altura del título de la pantalla, que es la línea que la persona lee.

**Pendiente de decidir por el equipo**

La hoja muestra el rol tal como está en el modelo: «Propietario». Es el término legal, pero se
muestra igual para todas las personas. Si el equipo quiere una forma neutra, hay que cambiar
el vocabulario del dominio, no solo esta pantalla.

---

### 2026-08-27 · Mary + IA (Claude) · La marca en las vistas interiores y el botón de volver

**Qué se hizo**

*La marca en la barra.* El logotipo solo aparecía en el inicio. Se evaluaron dos ubicaciones
para llevarlo al resto de la app del residente y **Mary eligió la segunda**:

| Opción | Dónde va | Veredicto |
|---|---|---|
| 1 | Arriba a la derecha, sobre «Torre 1 · 402» | Descartada: el logotipo cambiaba de lado según la pantalla —izquierda en el inicio, derecha en las demás— y una marca que se mueve no se memoriza. Además la esquina derecha es la zona de controles (unidad y avatar), y una marca no es un control |
| **2 — aplicada** | Arriba a la izquierda, encabezando la barra, con el contexto debajo | La marca queda **en el mismo sitio en todas las pantallas**, inicio incluido. El saludo no se perdió: en el inicio pasa a la línea de abajo |

Cayeron dos reglas de CSS que quedaron sin uso: `.barra-superior__saludo` y
`.barra-superior__marca-unidad`.

*El botón de volver.* Tenía `padding: 0` y medía **unos 21 px de alto**, cuando el mínimo
recomendado para tocar con el dedo son **44 px**. Ahora es un botón de verdad, con borde,
fondo y foco visible, en `componentes/BotonVolver.tsx`.

Y estrenó tres pantallas que no tenían ninguna: **mi unidad, visitantes y correspondencia**
se abren desde los accesos directos del inicio y **no tienen pestaña en la barra inferior**,
así que la única salida era acertarle a la pestaña de inicio. El botón nombra su destino
(«Inicio», «Mi cuenta») en vez de decir solo «Volver», que obliga a recordar de dónde vienes.

---

### 2026-08-27 · Mary + IA (Claude) · Logotipo y tipografía — T-09 cerrada

**Qué se hizo**

Se cerró la identidad visual con el encuadre que dio Mary: **el público va de los 18 a los 60
años**. Eso convirtió la tipografía en un problema de legibilidad medible y no de gusto.

**Logotipo.** La casa de la marca seguida del nombre, en un componente
(`componentes/Logotipo.tsx`) que ahora usan las tres pantallas donde aparecía la palabra
escrita a mano: acceso, pantalla de carga y lateral de la consola. Va limpio sobre la
superficie, sin bloque de color detrás.

Se probaron y descartaron dos alternativas, las dos con la prueba delante:

| Descartada | Por qué |
|---|---|
| La casa dentro de una de las íes (`id⌂ky`) | Al tamaño de la barra lateral la casita se vuelve una mancha, y obliga a descifrar qué letra es. Caro para un nombre que hay que leer y decir en voz alta |
| La i en fucsia | **Desaparece** contra el extremo fucsia del degradado de marca |

**Tipografía.** Se mantiene la fuente del sistema, como decisión y no por omisión: es la que
cada persona ya lee en su teléfono, y respeta el tamaño de letra que tenga configurado en
Ajustes — que para alguien de 60 no es un detalle. Una tipografía propia exige ADR (peso,
funcionamiento sin conexión, ADR-0002).

Lo que sí cambió son dos cosas medibles:

| | Antes | Ahora |
|---|---|---|
| Tamaño base | 15 px | **16 px** |
| Texto más pequeño | 11,5 px | **12,8 px** |
| `--color-texto-tenue` sobre el fondo | **2,92:1 — no cumplía AA** | **4,70:1** |
| `--color-texto-suave` | 5,68:1 | 7,00:1 |

El gris tenue era el problema serio: se usa en las fechas de la cartelera y en las notas al
pie, o sea justo en texto chico, y no alcanzaba el mínimo de contraste.

**Una trampa de CSS que apareció al hacerlo**

`.lateral__marca span` estilaba cualquier `span` dentro de la marca de la consola. Al meter el
componente —que renderiza spans por dentro— el nombre del logotipo heredaba el estilo del
subtítulo. Se cambió por la clase `.lateral__marca-sub`. Vale la regla general: **no estilar
por etiqueta dentro de un contenedor que va a recibir componentes.**

**El logotipo entra a la app del residente**

Al revisar el resultado apareció un hueco: el logotipo solo se veía en el acceso, en el
destello de carga y en la lateral de la consola. **Dentro de la app del residente no había
marca en ninguna pantalla** — justo la cara que más se usa.

Se resolvió en la barra superior del inicio: donde decía «Inicio» ahora va el logotipo. Decir
«Inicio» cuando ya estás en el inicio no informa nada, así que el sitio estaba libre. En las
demás pantallas el título se queda, porque ahí sí dice dónde estás.

**Qué sigue**

T-09 queda cerrada. Subir la base de 15 a 16 px movió todas las pantallas; se revisaron
acceso, inicio del residente, estado de cuenta y consola sin desbordes, pero conviene que el
equipo recorra el resto del demo.

---

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Pagos a proveedores

**Qué se hizo**

Jeimy señaló que el módulo llamado "Pagos" no estaba diseñado para pagos: era una copia del
de recibos de caja. Tenía razón, y el problema era de raíz — **ese módulo es la plata que
ENTRA**, y no existía el de la plata que SALE.

- **"Pagos" pasó a llamarse "Recaudos"** y nació **Pagos a proveedores**, con su documento
  propio: el comprobante de egreso.
- **Directorio de proveedores**, con NIT, razón social, tipo de persona, dirección, cuenta
  del PUC contra la que se causa lo que factura, y sus tarifas de retención.
- **Un egreso retiene.** Baja la cuenta por pagar por el valor bruto y lo reparte entre lo
  retenido —que queda como pasivo, porque es plata de la DIAN— y lo que sale de caja (RN-91).
- **Causar un gasto dejó de ser pagarlo.** Se le quitó la casilla "ya está pagado": un gasto
  nace por pagar, y se paga emitiendo el egreso. Eran dos hechos económicos distintos
  metidos en un solo formulario.

**Sobre consultar la DIAN**

Jeimy pidió buscar el proveedor en la base de la DIAN. Se le explicó que **no existe una API
pública y gratuita** para eso —el RUT se consulta con autenticación y automatizarlo es un
servicio de terceros de pago— y que además la aplicación abre desde un archivo local, sin
servidor (ADR-0010). Ella respondió que por ahora bastaba con poder crear al proveedor, y así
quedó.

Lo que sí es real: **el dígito de verificación se calcula con el algoritmo de la DIAN**,
verificado contra cuatro NITs de dominio público (RN-90). De paso apareció que el NIT del
demo tenía mal el DV: `901.234.567-8` cuando le corresponde `-7`.

La consulta quedó aislada en una sola función, `Idiky.proveedores.consultarNit`: el día que
haya backend, conectar un servicio real es cambiar solo su cuerpo.

**Verificación** — siete suites en Chromium, todas pasan. La nueva comprueba el DV contra
NITs conocidos, el rechazo de un DV equivocado y de un NIT repetido, que Recaudos y Pagos
sean módulos distintos, que las retenciones se liquiden bien (2 % sobre 38.000.000 = 760.000,
ICA 0,966 por mil = 36.708), que lo retenido quede como **pasivo y no como menor pago**, que
anular el egreso devuelva el gasto a por pagar, y que no se pueda pagar dos veces el mismo
gasto. El balance sigue cuadrando en todos los casos.

**Qué sigue**

1. Falta declarar y pagar las retenciones a la DIAN: hoy se acumulan en `2365` y `2368` y
   nada las descarga (T-31).
2. Los gastos de un mismo proveedor se pagan juntos, pero no se puede hacer un abono parcial
   a un gasto: o se paga completo o no se paga.
3. Sigue pendiente que el contador valide los códigos del PUC (T-27).

---

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Tipos de comprobante

**Qué se hizo**

El administrador dejó de tener que saber contabilidad para registrar un ajuste.

Cada **tipo de comprobante** trae ahora su asiento definido, y son datos configurables, no
código. Para registrar un ajuste se elige el tipo, la fecha y el valor —y el propietario si
el tipo lo pide—; el sistema arma el asiento y se lo muestra antes de guardar. Antes había
que elegir cuenta por cuenta y cuadrar el débito contra el crédito a mano.

- **Nueve tipos sembrados.** Cinco que registra el administrador (intereses de mora, sanción,
  provisión de cartera, traslado al fondo de imprevistos, comisión bancaria) y cuatro que
  genera el sistema (causación de cuotas, recibo de caja, causación de gasto, comprobante de
  egreso). Los del sistema no se registran a mano, pero **se muestran con sus cuentas**:
  saber contra qué mueve un recibo de caja es lo que hace auditable el módulo.
- **Consecutivo propio por tipo** (RN-88): `NI-00001` los intereses, `NP-00001` las
  provisiones. Como en cualquier libro contable.
- **Gastos ya no pide la cuenta:** la categoría la decide, y la pantalla la informa.
- **El comprobante libre queda como salida de emergencia**, con una nota que dice lo obvio:
  si el ajuste se repite, hay que hacerle su tipo.

**Dos bugs que aparecieron al probar**

1. Los comprobantes sembrados gastaban `NI-00001` y `NP-00001`, pero los tipos arrancaban su
   consecutivo en 1: el primer comprobante del usuario habría **repetido el número**. Ahora
   el consecutivo se deriva de lo sembrado, así que sigue siendo correcto si mañana se agrega
   otro comprobante a la semilla.
2. El contador de comprobantes libres arrancaba en 3, herencia de cuando todos compartían
   consecutivo.

**Verificación** — seis suites en Chromium, todas pasan. La nueva comprueba lo esencial: que
en el formulario de ajustes **no quede ni una sola opción de cuenta** que el administrador
tenga que elegir, y lo mismo en el de gastos; que el asiento se muestre armado; que cada tipo
use su consecutivo; que se exija el propietario cuando corresponde; y que no se pueda
registrar a mano un tipo del sistema.

**Qué sigue**

1. Los tipos se ven y se usan, pero todavía no se crean ni se editan desde la pantalla: hay
   que agregar ese formulario para que el equipo defina los suyos sin tocar código (T-29).
2. Sigue pendiente que el contador valide los códigos (T-27).
3. Sigue pendiente el intercambio de información con la PWA (T-22).

---

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Los cinco niveles del PUC

**Qué se hizo**

El plan de cuentas pasa a tener la jerarquía completa del PUC, explícita:
**Clase · Grupo · Cuenta · Subcuenta · Auxiliar**.

- **Faltaba un nivel.** El auxiliar de ocho dígitos no existía, y el de seis estaba mal
  llamado "auxiliar" cuando en el PUC es **subcuenta** (el auxiliar es de siete u ocho).
  Corregido en el modelo y en toda la interfaz.
- **El código ya no se escribe entero: se arma por niveles.** Se elige la clase, de ahí el
  grupo, de ahí la cuenta, y solo se escriben los dos dígitos que el nivel nuevo agrega. El
  prefijo del padre se muestra fijo. Así es imposible teclear un código huérfano, que antes
  el sistema tenía que rechazar después.
- **La tabla muestra el nivel de cada cuenta** y se puede filtrar por nivel.
- **Regla nueva (RN-87):** abrirle una subcuenta a una cuenta transaccional la convierte en
  título, porque el movimiento baja al nivel nuevo. Si un parámetro estaba usando esa cuenta,
  la operación se bloquea con el motivo: si no, los documentos nuevos irían a un título.

**Verificación** — cinco suites en Chromium, todas pasan. La nueva cubre la cascada: que solo
el primer selector arranque habilitado, que elegir un padre habilite el siguiente, que avise
mientras el código está incompleto y si ya existe, que abrir un auxiliar convierta a la
subcuenta en título, y que el bloqueo por parámetro en uso funcione. Los estados y el balance
de prueba siguen cuadrando.

**Qué sigue**

1. Sigue pendiente que el contador valide los códigos (T-27).
2. Falta exportar el balance de prueba y el libro auxiliar a CSV.
3. Sigue pendiente el intercambio de información con la PWA (T-22).

---

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · PUC editable

**Qué se hizo**

El plan de cuentas dejó de ser una constante del código: ahora es un **PUC colombiano
editable** que vive en los datos, con 86 cuentas a la medida de una copropiedad. Se agregan,
se renombran y se desactivan desde la nueva pantalla **Plan de cuentas**, que además trae el
**balance de prueba**.

- **Códigos de cuatro dígitos según el PUC** (Decreto 2650). Los de seis son auxiliares
  propios de la copropiedad, nivel que el PUC deja a criterio de cada entidad. Como una
  copropiedad es una ESAL, el grupo 41 se adaptó a sus conceptos (cuotas de administración,
  extraordinarias, intereses) en vez de los del PUC de comerciantes, que van por sector.
- **Parámetros:** qué cuenta usa cada documento, editable en la misma pantalla.
- **Cada documento guarda su cuenta** (RN-85). Es la decisión de fondo: cambiar un parámetro
  afecta a los documentos futuros, no a los pasados, así que reconfigurar el plan **no mueve
  la contabilidad de un mes cerrado**.
- Los estados pasaron a presentarse en **dos niveles**: la cuenta con su total y los
  auxiliares debajo. Volver a "Servicios" como una sola línea habría escondido vigilancia,
  aseo y servicios públicos, que es justo lo que mira la asamblea.

**Verificación** — cuatro suites en Chromium, todas pasan. La nueva cubre lo que importa: que
se rechace una cuenta huérfana y un código de largo inválido, que no se pueda desactivar una
cuenta que un parámetro está usando, que los documentos guarden sus cuentas, y —lo más
importante— que **cambiar un parámetro no reescriba los documentos viejos** mientras los
nuevos sí usan la cuenta nueva. Las cifras de los estados no cambiaron con la migración.

**⚠️ Lo que hay que hacer antes de usar esto en contabilidad real**

Los códigos son la adaptación convencional del PUC para propiedad horizontal, no una verdad
revelada. **El contador de la copropiedad tiene que revisarlos.** Se dejó todo editable y con
la advertencia en la propia pantalla.

**Qué sigue**

1. Que el contador valide el plan y ajuste lo que haga falta.
2. Falta exportar el balance de prueba y el libro auxiliar a CSV; el motor ya los calcula.
3. Sigue pendiente el intercambio de información con la PWA (T-22).

---

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Ajustes y partida doble

**Qué se hizo**

Módulo de **Ajustes**: comprobantes contables que mueven cuentas sin que entre ni salga
plata. Causar intereses de mora, provisionar cartera, cargar una sanción, trasladar
excedentes al fondo de imprevistos. Con plantillas para los casos que más se repiten, y con
la opción de armar el asiento desde cero.

**El cambio de fondo está debajo.** Hasta ahora el motor trabajaba con cuentas implícitas:
sabía sumar caja, cartera, anticipos y cuentas por pagar, pero esas cuentas no existían en
ninguna parte. Para poder decir "debito esta cuenta y credito esta otra" hubo que escribirlas:
ahora hay un **plan de cuentas** (`js/plan-de-cuentas.js`) y el motor lleva **partida doble**.
Todo lo que pasa —cuotas, pagos, gastos, ajustes— se convierte en asientos, y los estados se
arman sumando saldos de cuentas.

Eso no cambió ninguna cifra de lo que ya existía; sí cambió de dónde salen.

**Verificación** — las tres suites pasan. La nueva prueba de ajustes verifica lo que importa:
que un comprobante descuadrado **se rechace** (con el motivo en pantalla), que uno cuadrado
entre, que un ajuste a cartera llegue al saldo del cliente y a su extracto marcado como
ajuste, y que al anularlo el efecto se deshaga y el balance siga cuadrando.

**Dónde va cada cosa** — si entró o salió plata, es Pagos o Gastos. Si solo hay que mover
cuentas, es Ajustes. Quedó escrito en la pantalla del módulo, porque es la confusión natural.

**Qué sigue**

1. El plan de cuentas es corto y está fijo en el código. Si el equipo necesita el PUC real o
   cuentas propias, hay que hacerlo editable (T-25).
2. Falta el libro auxiliar por cuenta en pantalla: el motor ya lo calcula
   (`auxiliarDeCuenta`), pero no hay reporte que lo muestre.
3. Sigue pendiente el intercambio de información con la PWA (T-22).

---

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Reportes y estados financieros

**Qué se hizo**

`apps/contable/` gana dos módulos: **Gastos** y **Reportes**.

- **Reportes** (3): movimientos por cliente y fechas —el extracto donde cartera y pagos se
  juntan en una sola línea de tiempo, con saldo corrido—, **estado de resultados** y
  **estado de situación financiera**. Se imprimen o se guardan como PDF, y se bajan en CSV.
- **Gastos.** No estaba en lo pedido, pero un estado de resultados sin egresos no es un
  estado de resultados: solo tendría la mitad de arriba. Se agregó lo mínimo — causar un
  gasto, marcarlo pagado, anularlo con motivo — para que los dos estados sean reales.
- **Motor contable** (`js/contabilidad.js`): por causación, no por caja (RN-80 a RN-82).
  Todo hecho económico mueve cuatro cuentas, y de ahí el balance **cuadra por construcción**.

**Verificación** — el estado de situación financiera cuadra, y **sigue cuadrando** después
de conciliar un abono, registrar un gasto por pagar y anular un recibo; cada operación se
probó midiendo el descuadre, que se mantuvo en cero. Nueve pasos en Chromium abriendo el
archivo desde el disco, sin errores de consola. La impresión se verificó aparte: oculta la
barra lateral y los controles, y deja el documento solo.

**Dos cosas que hay que saber al leer los reportes**

1. **Hay dos cifras de cartera y las dos son correctas.** El módulo de Cartera muestra todo
   lo que deben, incluidas las cuotas ya facturadas del mes siguiente; el balance muestra
   solo lo causado a la fecha de corte. La pantalla lo explica al pie.
2. **"Caja y bancos" no es un saldo bancario conciliado**, es lo recaudado menos lo pagado.
   Para que lo fuera haría falta registrar saldos de apertura y una conciliación bancaria.

**Qué sigue**

1. Falta el resto de la contabilidad: proveedores como entidad, presupuesto anual contra
   ejecución, y saldos de apertura para que caja sea un saldo real (T-23).
2. Sigue pendiente definir el intercambio de información con la PWA (T-22).
3. RN-80 a RN-82 son **solo de la contable**: la PWA no tiene gastos ni estados. No hay que
   duplicarlas allá.

---

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Aplicación contable

**Qué se hizo**

Nace el segundo producto del repositorio: [`apps/contable/`](../apps/contable/README.md),
la aplicación de cartera, pagos y recibos de caja del administrador.

- **Sin compilación, a propósito** ([ADR-0010](./adr/0010-stack-aplicacion-contable.md)).
  HTML, CSS y JavaScript planos: se abre con doble clic en `index.html`. No es una
  preferencia técnica — quien la desarrolla no puede instalar nada en su computador, y un
  stack que el equipo no puede ejecutar no es un stack.
- **Tres módulos:** Cartera (quién debe y estado de cuenta por unidad), Pagos (bandeja de
  abonos informados por conciliar, y registro de lo que llega por fuera) y Recibos de caja
  (el libro, con los anulados).
- **Las mismas reglas que la PWA**, traducidas a JavaScript con los mismos números `RN-xx`.

**Restricciones medidas, no supuestas.** Al abrir un archivo desde el disco, Chromium
bloquea los módulos ES (`import`/`export`) y el `fetch` de archivos locales. Por eso el
código usa `<script src>` clásicos y los datos viven dentro de un `.js`. Está en el ADR.

**Verificación** — recorrido completo en Chromium abriendo `index.html` desde el disco:
nueve pasos de punta a punta sin errores de consola, y la anulación revisada aparte —
devuelve al saldo exactamente el valor del recibo, lo deja en el libro marcado como anulado,
y el consecutivo no se reutiliza (RC-00051 anulado, el siguiente es RC-00052).

**Corrección de rumbo.** La sesión anterior construyó cartera y pagos dentro de la PWA
creyendo que era el entregable de Jeimy. No lo era: **Jeimy trabaja en la contable, Mary en
la PWA.** Lo de la PWA se queda —la consola de Mary necesitaba cartera igual— pero el
entregable de Jeimy es este.

**Qué sigue**

1. **Definir qué información intercambian las dos aplicaciones y en qué dirección** (T-22).
   Hoy los abonos informados vienen sembrados en `apps/contable/js/datos.js`; ese es el
   punto exacto por donde se van a conectar.
2. **Decidir el alcance del resto de la contable** (T-23): egresos y gastos, proveedores,
   plan de cuentas, balances. Lo entregado es cuentas por cobrar; el otro lado no existe.
3. Ojo con las reglas duplicadas: una `RN-xx` que cambie hay que cambiarla en los dos
   productos el mismo día (§2.1 de `10-equipo-y-orquestacion.md`).

---

### 2026-08-26 · Mary + IA (Claude) · Identidad visual: azul y fucsia

**Qué se hizo**

Mary pidió una paleta con fucsia y azul, **combinados**, no uno subordinado al otro. Se
propusieron dos direcciones (azul de marca con fucsia de acento, y la inversa) y se eligió
combinarlas repartiendo el trabajo entre las dos:

- **Azul tinta `#1d2e7a` = estructura.** Dónde estás: barra superior, lateral del admin,
  botón primario, pestaña activa, foco, enlaces.
- **Fucsia `#c41e8c` = acción y atención.** Qué puedes hacer: contadores, botón de acento.
- **Las dos juntas** en una sola superficie por pantalla: la tarjeta de saldo del residente y
  la barra lateral de la consola, con un degradado de azul a fucsia. Es la firma de la marca.

Los neutros dejaron de ser grises verdosos y ahora tiran a azul (`#f5f5fb`, texto `#171935`):
un gris neutro al lado de un color saturado se ve sin decidir.

**Una decisión que conviene no deshacer sin pensarlo**

En este producto **el rojo significa plata** — mora, cuota vencida, cartera vencida. En la
primera propuesta con fucsia dominante ese rojo perdía fuerza, porque el fucsia le quedaba
cerca en tono y competía justo con la señal que más tiene que alarmar. Por eso el fucsia
quedó como acento y no como color de marca, y el rojo mandó solo. Está anotado en el
encabezado de `tokens.css` y en [`08-convenciones.md`](./08-convenciones.md).

**Sobre el degradado**

Se probó una versión con más peso del azul (el azul puro pasada la mitad del recorrido) y se
descartó: Mary prefirió el reparto original, donde la tarjeta de saldo recorre el degradado
completo de azul a fucsia. La lateral de la consola sí mantiene el azul más tiempo, porque es
una barra alta que el administrador tiene delante todo el día.

De ese intento sí quedó algo: los dos degradados salieron del CSS de los componentes y pasaron
a `tokens.css` como `--degradado-marca` y `--degradado-marca-vertical`. Estaban repartidos
entre `base.css` y `layout.css`, así que reequilibrar la marca obligaba a editar dos archivos
y acordarse de los dos. Ahora es cambiar unos números en el archivo donde vive la identidad,
que es lo que dicen las convenciones.

**Qué se tocó**

`tokens.css` (paleta, reparto y degradados), `base.css` y `layout.css` (pasan a consumir el
token), los dos SVG del logo, los PNG del manifest, el `theme-color` y el `background_color`. El empaquetador
del demo ahora **lee `--color-marca` de los tokens**, para que el `theme-color` no se
desactualice en el próximo cambio de identidad.

Verificado en Chromium a 390×844 y 1280×800, sin errores de consola.

**Qué sigue**

T-09 sigue en curso: faltan el **logotipo definitivo** y la **tipografía** (hoy usa la fuente
del sistema). Los colores ya están.

---

### 2026-08-26 · Mary + IA (Claude) · Revisión del repositorio y alcance declarado

**Qué se hizo**

*Revisión del código existente.* Se verificó que el demo compila (`npm run build` pasa) y
que las reglas del [`CLAUDE.md`](../CLAUDE.md) se están cumpliendo: ninguna pantalla importa
`semilla.ts` ni `almacen.ts`, y las 16 pantallas declaran su caso de uso. Se encontraron
**cuatro bugs y tres deudas de arquitectura** (T-15 del tablero):

| Hallazgo | Dónde | Estado |
|---|---|---|
| **Fechas y horas en UTC**: `formatearFechaHora()` cortaba la cadena sin convertir. Un pago a las 8:30 p.m. del 26 se mostraba como «27 ago, 01:30» | `utilidades/formato.ts` | ✅ Corregido |
| **La PWA no tenía íconos instalables**: `index.html` apuntaba a un PNG inexistente y el manifest solo declaraba SVG | `public/`, `manifest.webmanifest` | ✅ Corregido |
| **Visitante autorizado a futuro aparecía activo hoy**: no se validaba `vigenciaDesde` | `dominio/reglas.ts` | ✅ Corregido (nuevo estado `programado`) |
| **Doble toque perdía escrituras**: `ejecutar()` clonaba la `bd` del closure | `estado/DatosContext.tsx` | ✅ Corregido (referencia + candado) |
| *Deuda:* las reglas se validan **solo en la UI** — `crearReserva()` no llama a `validarReserva()`. Al pasar a backend, la validación queda del lado equivocado | `datos/repositorio.ts:205` | ⬜ Abierta |
| *Deuda:* `imputarPago()` (RN-06) es código muerto; `PagoPage` reimplementa la imputación | `dominio/reglas.ts:113` | ⬜ Abierta |
| *Deuda:* RN-22 no filtra por copropiedad, viola RN-01 | `datos/repositorio.ts:175` | ⬜ Abierta |

No hay pruebas, ni linter, ni CI.

*Alcance declarado.* Mary describió el producto que se quiere construir: cuota del mes,
informe de estado de cuenta, paz y salvo descargable, comprobante de pago, solicitudes al
administrador, zonas comunes, citaciones de asamblea, transmisión en vivo, votaciones,
poderes entre copropietarios, acta y coeficientes.

**Decisiones que esto obligó**

1. **La asamblea pasa a ser el núcleo del producto.** Seis de los doce puntos pedidos son
   asamblea. Estaba en la fase 4 del roadmap; **se movió a la fase 2**.
2. **Se agregaron 12 casos de uso** al catálogo (CU-R-18…24, CU-A-17…21) y 3 de sistema
   (CU-S-07…09). El catálogo pasó de 33 a 45 casos de uso.
3. **Se agregaron 12 reglas de negocio** (RN-26 a RN-37) para poderes, quórum, votación,
   acta y documentos. Todas marcadas *pendiente*: ninguna está implementada.
4. **Se modeló el módulo de asambleas y documentos** en `05-modelo-de-datos.md`: Asamblea,
   PuntoOrdenDelDia, Asistencia, Poder, Votacion, Voto, ResultadoVotacion, Acta y Documento.
5. **Dos ADR quedan bloqueando trabajo**: ADR-0006 (generación de PDF) y ADR-0007
   (transmisión en vivo). Sin ellos no se puede empezar ni el paz y salvo ni la asamblea
   transmitida.

**Lo que se construyó**

- **CU-R-24 — Consultar mi coeficiente** (`MiUnidadPage.tsx`, ruta `/app/unidad`, con acceso
  desde el inicio). Muestra el coeficiente y, sobre todo, **qué determina**: la cuota del mes
  y el peso del voto en asamblea. El peso del voto sale de `pesoDelVoto()`, que es la única
  definición de RN-27 — cuando se construya la votación debe llamar ahí, no volver a leer
  `unidad.coeficiente`.
- **Los cuatro bugs corregidos** (tabla de arriba). Los íconos PNG de la PWA se generan con
  `apps/pwa/herramientas/generar-iconos.py`, un rasterizador de librería estándar: no había
  ImageMagick en el entorno y agregar una dependencia de imagen rompía la regla del
  `CLAUDE.md`. Si cambia el logo, hay que volver a correrlo.

Verificado en Chromium a 390×844 con zona horaria de Bogotá: el comprobante de un pago hecho
a las 18:35 ahora dice «26 ago, 18:35» y no la hora UTC. Sin errores de consola.

**Cómo mostrar el demo**

Se agregó `apps/pwa/herramientas/empaquetar-demo.py`, que empaqueta `dist/` en **un solo HTML
autocontenido**. Sirve para mostrarle el demo a alguien que no tiene el repositorio ni Node:
se abre con doble clic o se sube a cualquier hosting estático.

```bash
cd apps/pwa && npm run build && python3 herramientas/empaquetar-demo.py
```

Funciona porque el demo no tiene backend. **Cada persona que lo abra tiene su propia copia de
los datos en su navegador**: nadie ve lo que hace el otro. Para una demostración es una
ventaja; para trabajar sobre los mismos datos no sirve, y eso es justamente lo que resuelve
la fase 2a.

**Lo que quedó marcado como supuesto, no como decisión**

El quórum en coeficientes y el tope de poderes se escribieron como supuestos con **(?)**, no
como reglas cerradas. (El **voto ponderado por coeficiente** sí quedó confirmado por Mary ese
mismo día: RN-27 pasó de supuesto a regla implementada.) En particular, **el tope
legal de poderes de la Ley 675 de 2001 no se escribió con una cifra concreta porque no se
verificó el artículo** — implementar RN-30 con un número inventado sería un error con
consecuencias jurídicas. Es la tarea T-11.

**Qué sigue**

1. Responder §3 bis (asambleas) y §3 ter (documentos) del levantamiento — **bloquean el
   diseño del núcleo**.
2. Decidir si visitantes, correspondencia y cartelera siguen en el producto: están
   implementados pero nadie los mencionó (T-12).
3. Escribir ADR-0006 y ADR-0007 (T-13, T-14).
4. Confirmar la asignación de zonas: Mary indicó que trabajará en la app móvil, hoy
   asignada a Jeimy en `10-equipo-y-orquestacion.md` (T-03).

---

### 2026-08-26 · Sesión de IA (Claude), a pedido de Jeimy · Cartera y pagos

**Qué se hizo**

Módulo de cartera y módulo de pagos, separados a propósito: cartera responde *quién debe y
por qué*, pagos maneja *la plata que entra*.

- **Abonos parciales.** El modelo era todo-o-nada: una cuota se pagaba completa o no se
  pagaba. Ahora `Cuota` tiene `saldo` además de `valor`, y `Pago` tiene `imputaciones[]`
  con cuánto se aplicó a cada cuota (RN-75, RN-76).
- **Recibo de caja.** El antiguo `comprobante` era un número suelto; ahora el pago **es**
  el recibo: consecutivo `RC-<NNNNN>` que se asigna al aplicarlo, y que se anula con motivo
  en vez de borrarse (RN-77, RN-78).
- **El propietario informa a qué corresponde su abono** (CU-R-30). Consigna por fuera,
  reporta desde su app con el concepto escrito por él, y el pago queda `reportado` sin
  tocar la cartera hasta que la administración lo concilia (RN-79).
- **Conciliación** (CU-A-27): el administrador ve lo que el propietario escribió, con el
  reparto por antigüedad ya sugerido, y lo ajusta antes de aplicar.
- De paso: `imputarPago` (RN-06) estaba definida y sin usar, y las pantallas reimplementaban
  el orden por su cuenta. Ahora la regla se usa de verdad. También se corrigió RN-22, que
  buscaba cuotas duplicadas sin filtrar por copropiedad.

**Verificación** — `npm run build` pasa. Recorrido completo en navegador (Chromium): los dos
flujos de punta a punta y la anulación, que devuelve al saldo exactamente el valor del
recibo y deja el registro marcado, no borrado.

**Supuestos que hay que confirmar con el equipo**

Se construyó sin haber cerrado tres decisiones. Si alguna cambia, cambia el módulo:

1. **El propietario informa antes, no después.** Se asumió el flujo de dos caras
   (reportar → conciliar). La alternativa era un simple campo de texto que digita el
   administrador: mucho menos trabajo, y menos útil.
2. **La deuda es de la unidad, no de la persona.** Es como funciona en propiedad
   horizontal, pero si se quiere un estado de cuenta consolidado por propietario con
   varios inmuebles, hay que agregarlo.
3. **No hay intereses de mora ni saldo a favor aplicable.** El excedente de un pago se
   guarda como `saldoAFavor` pero todavía no se puede usar contra una cuota futura.

**Nota de zonas (docs/10):** este trabajo tocó `dominio/`, `datos/`, `features/admin/` y
`features/residente/` — o sea las zonas de los tres. Vale la pena revisarlo juntos antes de
seguir repartiendo tareas por zona.

> **Corrección posterior, misma fecha.** Este módulo se construyó a pedido de Jeimy, pero
> quedó dentro de la PWA, que es el producto de **Mary**. Jeimy trabaja en la **aplicación
> contable de escritorio**, que es un programa aparte y todavía no tiene stack ni ubicación
> definidos (ver [`10-equipo-y-orquestacion.md`](./10-equipo-y-orquestacion.md) §1.1).
> Lo construido **sirve igual**: la consola necesitaba cartera y pagos. Pero no es el
> entregable de Jeimy, y las reglas RN-75 a RN-79 son justamente la parte que las dos
> aplicaciones van a compartir.

**Qué sigue**

1. Confirmar o corregir los tres supuestos de arriba.
2. Decidir si el saldo a favor se aplica automáticamente al generar la cuota siguiente.
3. Sigue pendiente cerrar [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md).

---

### 2026-08-26 · Sesión de IA (Claude) · Arranque del repositorio

**Qué se hizo**

- Estructura del repositorio: `docs/` (documentación) y `apps/pwa/` (demo).
- Documentación base: visión y alcance, glosario del dominio de propiedad horizontal,
  actores y matriz de permisos, catálogo de 33 casos de uso con su detalle, modelo de datos
  con 25 reglas de negocio numeradas, arquitectura, convenciones, roadmap de 5 fases.
- Cinco ADR: stack, estrategia multiplataforma, capa de datos con adaptadores,
  autenticación simulada, código visual de visitantes.
- Demo PWA funcional (React + TypeScript + Vite) con 20 casos de uso implementados,
  datos simulados persistentes e instalable como PWA.
- Documentación de trabajo en equipo para Jeimy, Mary y Daniel: zonas de propiedad de
  código, protocolo para archivos compartidos, flujo de git y tablero de tareas.
- Documento de levantamiento pendiente con las preguntas abiertas del producto.

**Decisiones tomadas** — ADR-0001 a ADR-0005 (ver [`adr/`](./adr/)).

**Qué sigue**

1. El equipo responde [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md).
2. Recorrer el demo y anotar observaciones aquí mismo.
3. Ajustar el catálogo de casos de uso al alcance real antes de construir más.

**Advertencia para quien retome:** no des el alcance del demo por definitivo. Léelo como
"esto es lo que se puede hacer con esta arquitectura", no como "esto es lo que el producto
va a ser".
