# 09 — Estado del proyecto (bitácora)

**Este es el documento que hay que leer primero al retomar el trabajo**, sea una persona
nueva o una sesión de IA distinta.

---

## Estado actual

| | |
|---|---|
| **Versión** | v0.1 — demo PWA navegable + demo contable |
| **Fase** | 1 de 5 ([roadmap](./07-roadmap.md)) |
| **Productos** | Dos: `apps/pwa/` (Mary) y `apps/contable/` (Jeimy). **Integrados en una sola rama el 2026-09-10** |
| **Sistema de gestión de IDIKY** | **Instalado en el entorno de desarrollo**: Strapi 5.53 + PostgreSQL 17 en un pod, puerto 8082 ([ADR-0012](./adr/0012-sistema-de-gestion-strapi.md), `apps/gestion/`). Todavía sin entidades; faltan abrir 8082 en Azure, el responsable y el disco de datos (T-37) |
| **Foco actual** | **La app del propietario.** Las de administrador y portería se trabajan después (Mary, 2026-08-28) |
| **Contable** | Cartera · Recaudos · Recibos de caja · Gastos · Pagos a proveedores · Ajustes · Plan de cuentas · Reportes. Partida doble sobre un PUC colombiano editable |
| **Backend** | No existe. Datos simulados en el navegador, en los dos. |
| **Autenticación** | El **flujo** está dibujado —documento, clave de 4 números, código en dispositivo nuevo, activación y **huella**— pero **no autentica**: no se guarda ninguna clave. La huella sí es real (WebAuthn); falta el servidor que la comprobaría ([ADR-0004](./adr/0004-autenticacion-demo.md)) |
| **Casos de uso** | 69 documentados: 36 ✅ en el demo, 11 🟡 a medias, 21 ⬜ pendientes, 1 ⛔ retirado |
| **Reglas de negocio** | 91 (RN-01…RN-91; RN-41 retirada). RN-75 a RN-91 vienen de la contable |
| **Compila** | Sí — `cd apps/pwa && npm run build` |
| **Entorno de desarrollo** | Los dos productos publicados en contenedores, con Podman sin root, en un servidor compartido que no se puede afectar. Abiertos al equipo con clave, por HTTP ([ADR-0011](./adr/0011-entorno-de-desarrollo-en-contenedores.md), [`infra/`](../infra/README.md)) |
| **Ortografía** | `cd apps/pwa && python3 herramientas/revisar-ortografia.py` — está en la definición de «terminado» |

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

Y del núcleo declarado como alcance, lo que falta es **la mitad jurídica de la asamblea** —
quórum, mayorías, poderes, acta—. Los documentos formales ya tienen criterio y camino
([ADR-0006](./adr/0006-documentos-formales.md)): el paz y salvo se emite, se ve y se guarda
como PDF desde el navegador. Lo que sí quedó de la asamblea: la citación, el orden del día, la
votación por coeficiente (CU-R-13, CU-R-20) y los coeficientes visibles al copropietario
(CU-R-24).

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
jurídicamente válidas**. Eso exige quórum verificable, poderes con tope legal, votación
ponderada por coeficiente y un acta que resista revisión. Nada de eso está construido y
buena parte **ni siquiera está definida** (ver §3 bis del levantamiento).

---

## Bitácora

> Formato: fecha · quién · qué se hizo · qué sigue. **Las entradas nuevas van arriba.**

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
