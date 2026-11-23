# Avisos para Mary — temas pendientes

> **Para el agente de IA:** si quien abre la sesión es **Mary**, antes de cualquier tarea muéstrale los
> avisos **abiertos** de esta página, en palabras sencillas, y pregúntale si ya los habló con Daniel.
> Mientras un aviso esté abierto, **no construyas nada que lo contradiga**. Los avisos los abre y los
> cierra Daniel; cuando se resuelvan, se marcan ✅ con la fecha.

---

## 6. Lo que cambió hoy en BLOKY y la maqueta debería reflejar — ⏳ para revisar (2026-11-21)

Daniel construyó en BLOKY (el producto real) reglas nuevas que tocan pantallas de tu demo (consola del administrador y
ALICE). No hay que cambiar nada hoy, pero **no construyas en la maqueta algo que las contradiga**:

- **Una persona, un documento, un celular** (RN-353 a RN-356): al crear a alguien (residente, colaborador, registro de
  propietarios) se piden **nombre, celular, tipo y número de documento**, todo obligatorio. Si el documento ya existe con
  otro celular, se muestra el celular oculto (`300•••567`) y se acepta ese o no se sigue. Un celular nunca es de dos personas.
- **Primer ingreso a ALICE** (RN-356): código al celular → documento que debe coincidir con el que puso la Administración →
  **correo validado con un código** → datos básicos. Cambiar celular o correo pide el otro como segundo factor (RN-357).
- **Varios países** (ADR-0035, RN-358 a RN-363): el celular y el documento llevan país, por defecto el de la copropiedad
  (🇨🇴 +57) y «🌎 Otro país» para los pocos casos; el pasaporte siempre está.
- **Corregir antes del primer ingreso** (RN-364): la Administración puede corregir nombre, celular y documento de alguien
  solo mientras esa persona no haya entrado a la app.
- **Quién vota** (RN-365): ver el §4.

Las reglas completas están en [`05-modelo-de-datos.md`](../05-modelo-de-datos.md) y cómo se ve en BLOKY, en
[`casos-de-uso/bloky.md`](../casos-de-uso/bloky.md) (CU-B-07, CU-B-08, CU-B-14).

---

## 5. El correo de IDIKY (Amazon SES) — ⏳ verificar tu correo (2026-11-21)

El correo de IDIKY ya funciona: sale de **`IDIKY <no-responder@idiky.com>`** por Amazon SES
([ADR-0036](../adr/0036-correo-con-amazon-ses.md)). Todo lo que hay que saber está en
[`infra/correo-ses.md`](../../infra/correo-ses.md).

- **Para recibir correos de prueba**, Daniel agrega tu correo personal en Amazon y a ti te llega un correo de *Amazon Web
  Services* («Email Address Verification Request»; mira en Spam): **ábrelo y dale clic al enlace**. Sin eso, a tu correo
  no le llega nada de IDIKY mientras la cuenta esté en modo de prueba.
- **En tu demo** no se mandan correos reales (no hay backend): si una pantalla «envía un correo», se simula en el
  repositorio de datos y se muestra el correo oculto (`m•••@gmail.com`). Nunca pongas llaves de AWS en el código.

---

## 0. CU-R-34 (avatar en ALICE) — ⏳ revisar textos (2026-11-16)

Justo escribió el caso de uso **CU-R-34 — Personalizar mi avatar en ALICE** (rango CU-R tuyo) y ya
lo dejó en código (middleware + app en `develop`, T-90): crear el personaje si no lo tienen y
editar el que sale por defecto; mismas partes que el de BLOKY; se guarda en el directorio y lo
ven igual en el teléfono y en la web.

**Para ti:** léelo en [`casos-de-uso/residente.md`](../casos-de-uso/residente.md#cu-r-34) y dile a
Daniel o a Justo si lo dejas como está o quieres cambiar el flujo / los textos.

## 1. El entorno de desarrollo se mudó a AWS — ⏳ abierto (2026-11-03)

Desde el 2026-11-01 el entorno vive en **AWS Lightsail**
([ADR-0029](../adr/0029-entorno-de-desarrollo-en-aws-lightsail.md)). Para ti cambia:

- **La dirección de la PWA es otra.** Daniel te la pasa por un canal privado (no va en el repositorio).
  La clave del entorno es la misma.
- **Para desplegar ya no se toma la foto de LangFlow** (`verificar-vecino.sh`): el servidor es solo de
  IDIKY. Los pasos están en [`infra/guia-de-despliegue.md`](../../infra/guia-de-despliegue.md).
- **Tu llave de despliegue** hay que autorizarla en el servidor nuevo, si vas a desplegar.

**Mary, 2026-11-10:** *«de acuerdo»*. Queda pendiente que Daniel le pase la dirección nueva de la PWA por un canal privado. (El aviso lo cierra Daniel.)

## 2. Reuniones con video: dos reglas tuyas por confirmar — ⏳ abierto (2026-11-03)

Daniel definió quién entra a una reunión y cómo se conduce
([ADR-0030](../adr/0030-autorizacion-de-las-reuniones-con-video.md), RN-302 a RN-316). Dos reglas tocan
las de asamblea que tú definiste (RN-212 a RN-220), y **necesitan tu confirmación**:

- **RN-309, el plazo de los poderes:** la administración define hasta cuándo se puede otorgar y revocar
  un poder antes de la reunión, y nunca dentro de su ventana; si no se revocó antes, queda.

  **Mary, 2026-11-10:** de acuerdo con la fecha límite: *«para cada reunión hay una fecha límite
  para la entrega de poderes»*. Y pide algo más: *«si hay un propietario el cual tiene apoderado,
  debe quedar parametrizado en su perfil para evitar cada asamblea solicitar el poder»*. Esto
  **cambia RN-31** (hoy cada asamblea tiene sus propios poderes) y está por definir con Daniel: ver
  la propuesta del apoderado permanente en `docs/09-estado-del-proyecto.md` (2026-11-10).
  **Mary, 2026-11-10: de acuerdo con la propuesta del apoderado permanente.**
- **RN-316, el secretario conduce las votaciones:** las abre con un tiempo máximo y puede extenderlo si
  no hay quórum, sin superar ese tiempo; puede corregir la redacción antes de abrirlas y luego quedan
  bloqueadas, con historia para el acta. En una extraordinaria, solo lo del orden del día; en una
  ordinaria, el punto de proposiciones puede terminar en votación.

  **Mary, 2026-11-10:** *«sí, de acuerdo con lo propuesto en votaciones»*. Con esto, Mary respondió
  los tres avisos; los cierra Daniel.

**Además:** las asambleas y votaciones que construiste en la maqueta todavía **no están en BLOKY**, y
las reuniones con video las necesitan
([plan de CU-B-15](../casos-de-uso/bloky.md#plan-de-construcción-2026-11-03)). Conviene hablar con Daniel
del orden en que se pasan.

## 3. Residentes: quién crea a quién, y quién vota — ⏳ abierto (2026-11-05)

Daniel decidió cómo se crean los residentes en BLOKY y ALICE
([ADR-0032](../adr/0032-residentes-colaboradores-e-ingreso-de-alice.md)):

- La Administración crea **un residente por unidad**, con unidad y celular: el **administrador de la unidad** (RN-320). Él
  agrega a los demás de su unidad: residentes (administradores o no), **mascotas** (perfil sin usuario) e **invitados** con
  fecha de inicio y de fin (RN-321). Es la misma idea de tu **RN-63**, con estos nombres; si tu demo la muestra, conviene
  alinearla.
- **Para decidir contigo (T-127):** el rol de la unidad no dice si alguien es **propietario o arrendatario**, y eso importa
  para votar en asambleas (RN-51, RN-304). ¿Se pregunta al crear al residente, o lo marca después la Administración?

  **Mary, 2026-11-10:** *«la persona que crea BLOKY es el propietario»*. El residente que crea la
  Administración en BLOKY (el administrador de la unidad, RN-320) **es el propietario**, como en su
  RN-63, y **puede ser residente o no** (Mary, 2026-11-10: *«y este propietario puede ser residente o no»*;
  su condición residente / no residente, RN-68). Los arrendatarios y demás los agrega después el
  propietario desde ALICE (RN-321). Queda por
  definir con Daniel cómo se marca, en BLOKY, a un arrendatario que agrega el propietario, para que no
  vote (RN-51).

  **Daniel, 2026-11-21 (RN-365):** *quien vota siempre es el propietario o el apoderado por el propietario, que puede ser
  el arrendatario u otro residente del mismo edificio o conjunto, al que él le quiera dar el poder.* Así, los que el
  propietario agrega desde ALICE no votan salvo que él les dé el poder. **Para ti:** tu RN-30 deja que el apoderado sea
  **externo**, y tu RN-217 que sea de **otra copropiedad**; Daniel habla de *otro residente del mismo edificio*. ¿Se
  restringe a residentes de la misma copropiedad, o se mantienen el externo y el de otra copropiedad?

## 4. Quién vota y con qué peso: lo que propone Daniel choca con reglas tuyas — 🟡 en parte respondido (2026-11-23)

**Tu respuesta (2026-11-23), sobre el punto 1:** *«depende por lo que se vote y eso lo define el administrador en la
parametrización: puede ser de cuando cite a la asamblea o desde la creación del edificio».* Quedó así en la maqueta
(RN-211): **desde la creación del edificio**, la base del mixto (`votoNoEconomicoMixto`); **al citar**, cada punto que
se vota dice si es **decisión económica** (coeficiente) o **no económica** (según el edificio), y la votación lo trae
marcado. Sin marcar al citar, se escoge al abrir la votación. Siguen abiertos los puntos 2, 3 y 4 con Daniel.

Daniel (2026-11-21), al definir roles y permisos ([ADR-0034](../adr/0034-roles-desde-bob-matriz-de-permisos-e-impersonacion.md)):
*una copropiedad puede definir quién tendrá la capacidad de voto por el % de su copropiedad; no se puede dar a menores de
edad, arrendatarios ni visitantes; solo a alguien creado en la APP en esa copropiedad como residente, con la marca de
dueño; y se puede transferir a un residente de otra copropiedad que cumpla lo mismo.* También: una persona puede tener
**varios inmuebles** en la misma copropiedad y **varios roles** a la vez (propietaria de una unidad y arrendataria de otra).

Lo que hay que conciliar (lo de la ley va de memoria: **confirmarlo con un abogado**):

1. **Por coeficiente o por unidad.** Daniel habla del % de copropiedad (Ley 675, art. 37: el voto de cada propietario
   equivale a su coeficiente). Tu **RN-29** dice *un voto por unidad*. Son incompatibles.
2. **«Solo un residente de la app».** La ley le da el voto al **propietario**, viva o no ahí (tu RN-51 y tu RN-68 ya lo
   reconocen: propietario residente o no).
3. **«No a arrendatarios».** La ley deja que el propietario se haga representar por poder y no prohíbe que el apoderado sea
   el arrendatario. Si se restringe, sería por **reglamento** de cada copropiedad (como tu tope de RN-220). Que el poder
   vaya a alguien de **otra copropiedad** ya está en tu RN-217.
4. **Menores de edad.** No pueden ser apoderados; un menor propietario vota por su representante legal. Hoy **no se guarda
   la fecha de nacimiento** — **2026-11-22:** ya se decidió capturarla (**RN-192**); falta construirla en el directorio y en ALICE (T-143).

**Para ti:** revísalo con Daniel. Nada de esto entra a la matriz de permisos: lo legal queda fijo (RN-337).

