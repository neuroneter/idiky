# Avisos para Justo — temas para hablar con Daniel

> **Para el agente de IA:** si quien abre la sesión es **Justo**, antes de cualquier tarea muéstrale
> los avisos **abiertos** de esta página, en palabras sencillas, y pregúntale si ya los habló con
> Daniel. **Vocabulario:** «el middleware de IDIKY» es el único punto de acceso a la capa de datos de
> IDIKY para BOB, ALICE, la app de BLOKY y cualquier otro sistema (hoy en `Bloky-Idiky/apps/bloky-api`,
> ADR-0025). Mientras un aviso esté abierto, **no construyas nada que lo contradiga** (abajo dice qué).
> Los avisos los abre y los cierra Daniel; cuando se resuelvan, se marcan ✅ con la fecha.

---

## 1. Las personas ya no viven en BOB — ✅ hecho (2026-10-21)

**Qué se decidió:** [ADR-0025](../adr/0025-directorio-unico-y-mapa-de-ubicaciones.md). Todas las
personas de IDIKY (también el Administrador y el Delegado) viven **solo en el directorio de BLOKY**.
BOB las gestiona con un módulo **«Personas del cliente»** que lee y escribe ese directorio por la
entrada de administración del **middleware de IDIKY**, y **no guarda copia**. En BOB queda solo el trámite (`solicitud`), con el
id de la persona. `persona` y `asignacion` **se van de BOB** al final de T-89 (primero se pasan los
datos al directorio y se verifican). **Hecho el 2026-10-20:** las 6 asignaciones y tu persona de prueba (Justo Soto, sin
asignaciones) ya están en el directorio, gestionadas por IDIKY, y **la copia desde BOB está apagada**: lo que se cree en
`persona` o `asignacion` de BOB ya no da acceso a BLOKY.

**Actualización del 2026-10-20:** Daniel decidió quitar **`asignacion`** de BOB (ya está fuera: nada tuyo la usaba).
**`persona` se queda** hasta que hablen, porque la usa `cuentas-polygon`; solo perdió su campo de asignaciones.

**Mientras se habla:** no construir nada nuevo sobre `persona` de BOB, y no quitarla
todavía (Strapi borra solas las tablas que su código ya no tiene). Daniel decidió (2026-10-20) **no ocultarlas ni
borrarlas hasta hablarlo contigo**: tu plugin `cuentas-polygon` usa `persona`, así que el retiro se hace cuando tú
hagas tus cambios. Mientras tanto, la gestión real ya está en BOB: el panel «Personas del cliente» de la ficha de
cada copropiedad y la página «Personas de IDIKY» del menú, con permisos «Ver» y «Gestionar» por rol (RN-270).

**Para hablar:** si el módulo «Personas del cliente» lo hace Justo o el equipo de BLOKY.

## 2. El plugin `cuentas-polygon` y los datos de la cadena — 🟡 adaptado; queda cómo se identifica la app (2026-10-21)

Hoy la `persona` de BOB guarda los datos del login con contratos inteligentes (`tipoAutenticador`,
`cuentaDia`, `hashCorreo`, `cuentaFinanciera`, `estadoCadena`…) y el plugin `cuentas-polygon` atiende
sus cinco acciones desde BOB (T-81, T-87). Con ADR-0025 esos datos pasan al **directorio de BLOKY**, y
la persona de ALICE se identifica ante el **middleware de IDIKY**, no ante los usuarios de Strapi.

**Para hablar:** ¿el plugin se queda en BOB (atendiendo sin guardar personas) o pasa al middleware
de IDIKY? Esto resuelve también T-87.

**Mientras se habla:** no agregar más campos de la cadena a la `persona` de BOB.

**Decidido por Daniel el 2026-10-21** (RN-298, RN-299, ya en el directorio de BLOKY Dev):
- La persona se identifica en la cadena con **`hash_identidad`**: HMAC-SHA256 con una clave secreta
  de IDIKY sobre **«TIPO:NUMERO»** del documento (`CC:52100200`). **Ya no con el hash del correo**,
  porque el correo cambia. Lo calcula **solo el middleware**: el teléfono no lo puede calcular. Los
  contratos no cambian (reciben un `bytes32`), pero el plugin y ALICE dejan de usar `hashCorreo`.
- Las dos cuentas son **`billetera_transaccional`** (tu `cuentaDia`: votaciones, ingresos,
  documentos) y **`billetera_financiera`** (tu `cuentaFinanciera`), como **columnas de la persona**
  del directorio.
- **No pasan** al directorio `telefonoX`, `telefonoY`, `tipoAutenticador`, `estadoCadena` ni
  `errorCadena`.
- Las personas de prueba de BOB **no se migran**: las billeteras se crean de nuevo desde el directorio.

**Sigue para hablar:** si el plugin pasa al middleware, y cómo se identifica la app (T-87).

**Hecho por Daniel con la IA el 2026-10-21 (lee esto antes de tocar ALICE o el plugin):** el plugin
`cuentas-polygon` **ya no usa la persona de BOB**, y **`persona` se quitó de BOB** (aviso 1 cerrado).
Publicado en BOB Dev (`9d9fd77.gestion-e91e8f0`) y en el middleware (`9d9fd77.bloky-b1c232c`).

| Antes | Ahora |
|---|---|
| La persona en `api::persona.persona` de BOB | En el **directorio del middleware**; el plugin la lee y escribe por su entrada de administración (`server/src/directorio.ts`, con `BLOKY_URL` y `BLOKY_ADMIN_TOKEN`) |
| Identidad en la cadena = hash del correo | **`hashIdentidad`** (RN-298), que calcula el middleware. Se pasa a `registrar(hashIdentidad, x, y, tipo)`. Los contratos siguen recibiendo un `bytes32`; **2026-10-23** Justo renombró en Solidity `hashCorreo` → `hashIdentidad` (y `cuentaPorIdentidad`). Amoy del 17-oct hay que redeployar (ver [`daniel.md`](./daniel.md) §1) |
| `cuentaDia`, `cuentaFinanciera` | **`billeteraTransaccional`**, **`billeteraFinanciera`** en la persona del directorio (RN-299). Las respuestas traen **también** los nombres de antes |
| `telefonoX/Y`, `tipoAutenticador`, `estadoCadena`, `errorCadena` guardados | No se guardan: la passkey viaja en la firma del alta, y `estadoCadena` se deduce (`registrada` si tiene las dos billeteras) |
| Reto del alta `idiky.alta.v1:<op>:<hashCorreo>` | **`idiky.alta.v2:<op>:<hashIdentidad>`** (lo arma el servidor; el teléfono firma el que recibe) |
| `GET /api/cuentas-polygon/cuentas?correo=…` y alta por QR por correo | **`?tipoDocumento=CC&numeroDocumento=…`** (por correo responde 400) |
| Transferir a `correoDestino` | **`tipoDocumentoDestino` + `numeroDocumentoDestino`** |
| `personaDocumentId` = documentId de BOB | El **id de la persona en el directorio** |
| Al crear la persona, un *lifecycle* abría las cuentas | `registrar.abrirBilleteras()` al firmar el alta (o al crear con la passkey conocida) |

**Para ALICE (tú):** si la app consultaba cuentas o transfería **por correo**, tiene que pasar a **tipo y
número de documento**. El resto de las respuestas conserva los nombres de antes.

**No probado:** la firma real con un teléfono (no había uno). Sí se probó en el servidor: el plugin
habla con el directorio, encuentra a la persona por documento, trae su `hashIdentidad` y responde con
los dos juegos de nombres.

**Sigue para hablar (T-87 / A1):** si el plugin `cuentas-polygon` **se muda** al middleware. Mientras,
**A2 hecho en código (2026-11-16, T-129):** ALICE crea billeteras en el primer login solo por el
middleware (`/api/app/cadena/alta*`); BOB expone rutas de servicio con `IDIKY_CADENA_PROXY_TOKEN`.
Ya no hace falta `ALTA_QR_JWT` ni el QR en el ingreso. Detalle: [`daniel.md`](./daniel.md) §9b.

**Diagnóstico listo (2026-11-05):** Justo dejó el mapa completo —login doc+SMS como BLOKY, sesión vs
passkey, y si la firma Polygon puede pasar primero por el middleware— en
[`19-diagnostico-alice-sesion-y-polygon.md`](../19-diagnostico-alice-sesion-y-polygon.md). Usen ese
documento en la conversación; no construir otro login ni ampliar `ALTA_QR_JWT` hasta decidir.

## 3. Las reuniones con video son de BLOKY, no de BOB — 🟡 Jitsi ya en modo de pases; queda el resto (2026-11-04)

Sobre tu propuesta de pasar Jitsi a pases (JWT): el plan técnico está bien (modo `jwt`, sala de espera,
cierre a tiempo, prueba con dos personas), pero **cambia quién hace cada cosa**:

| En tu propuesta | Va en |
|---|---|
| El endpoint que entrega el enlace | **El middleware de IDIKY** (las reuniones son de BLOKY) |
| Firmar el pase (la clave se comparte entre Jitsi y **el middleware**) | **El middleware** |
| Responder la duración de la sala (Prosody pregunta) | **El middleware** — Jitsi necesita llegar a él |
| Revisar quién puede abrir la reunión | **El middleware** |
| — | **BOB:** solo si el cliente **puede** usar reuniones y **cuántas al mes** (falta ese campo en el plan o un servicio adicional) |

**Mientras se habla:** no crear en BOB el endpoint ni la firma de los pases.

**Hecho el 2026-10-20 (CU-B-15):** el derecho y el cupo ya están en BOB («Reuniones con video al mes» en el plan y en
el servicio adicional, copiado en la contratación), y BLOKY ya programa y cancela reuniones dentro del cupo, cada una con
su sala. **Falta lo tuyo (T-106):** Jitsi en modo `jwt`, que el middleware firme los pases y que la sala se cierre a tiempo.

**Actualización del 2026-11-03 ([ADR-0030](../adr/0030-autorizacion-de-las-reuniones-con-video.md), RN-302 a RN-316):**
Daniel definió quién entra y cómo se conduce. Lo que te toca en Jitsi: **modo `jwt` con la llave pública** (el
middleware firma con la privada), **sin entradas sin pase**, **el rol del pase manda** (anfitrión y secretario son
moderadores), **la sala espera al anfitrión**, **cámara y micrófono por permiso** del secretario, y **avisar al
middleware quién entra y sale**. **Cambia una cosa de tu plan:** la sala **no se cierra por horario**; la cierran el
anfitrión o el secretario (solo hay avisos). En ALICE: «Entrar a la reunión», «Enviarme el enlace al correo» y la
votación durante la reunión. Antes de construir, confirma qué de eso trae `stable-11031`.

**Hecho el 2026-11-03:** el middleware ya firma los pases con ese formato (RS256, `kid` `idiky-reuniones-1`) y sirve la
llave pública en `https://bloky-dev.idiky.com/api/jitsi/llaves/<sha256 del kid>.pem`, que es como la pide el servidor de
llaves ASAP de Jitsi. El pase sale de `POST /api/c/:id/reuniones/:rid/entrar`.

**Hecho el 2026-11-04 (Daniel): Jitsi ya está en modo de pases** en `Jitsi-Streaming-Idiky` (`main` y `develop`):
`AUTH_TYPE=jwt`, sin invitados anónimos ni cuentas. Probado: anfitrión → moderador; participante → participante;
sin pase → no entra. En BLOKY, `BLOKY_JITSI_ACEPTA_PASES=si`.

**Para ALICE (2026-11-05):** contrato en [`docs/18`](../18-reuniones-con-video.md) §5 (`/entrar`, roles, `servidor`/`sala`/`token`).

**Hecho 2026-11-15:** pestaña **Asambleas** lista reuniones reales del middleware con Bearer ALICE (RN-325);
Entrar abre Jitsi con el SDK. **Sesión persistente** (Bearer en almacén seguro + `GET /yo` al abrir).

**Hecho 2026-11-15 (RN-190):** una persona no puede estar dos veces en la misma reunión: el segundo dispositivo
pregunta si desea **trasladar**; el primero cierra por latido (ALICE hangUp / BLOKY cierra la pestaña). Diálogo
en la web (no `window.confirm`). BLOKY Dev `394a419.bloky-c5b887a`. Falta el kick forzado desde Prosody cuando
Jitsi avise quién entra y sale.

**Te queda de este aviso:** que la sala espere al anfitrión (hoy quien llega primero con pase entra a la sala vacía),
cámara y micrófono por permiso del secretario, y el webhook de asistencia hacia el middleware.
Resumen para Daniel: [`daniel.md`](./daniel.md) §9.

## 4. ALICE usa el mismo directorio y nunca toca una base — ⏳ abierto (2026-10-20)

ALICE **no tiene directorio propio**: entra por el middleware de IDIKY, el único que sabe dónde vive cada
cliente (el **mapa**, ADR-0025 §4). Ninguna app se conecta a una base de datos.

**Para hablar:** cómo se arma el ingreso de ALICE con el login de contratos inteligentes sobre ese
directorio (T-80, T-81).

## 5. El contrato con la copropiedad será virtual, firmado con blockchain — ⏳ abierto (2026-10-21)

En BOB, el **Contrato** de cada copropiedad ya no tiene documento firmado ni notas: es la lista de **servicios** que tiene
(con su periodo, su ingreso y su cancelación, RN-290 a RN-293). La copropiedad elegirá sus servicios desde BLOKY y quedarán en
BOB por la API (T-116). Daniel quiere que **la aceptación sea un contrato virtual firmado con blockchain**.

**Para hablar:** cómo se firma (¿con la cuenta de la persona, ERC-4337?), qué se registra en la cadena (¿el contrato, cada
servicio que entra o sale?) y dónde vive esa lógica (¿`SmartContrat-Idiky`, el middleware de IDIKY?).

**Mientras se habla:** no agregar a BOB campos de firma ni documentos de contrato.

---

**Para entenderlo de un vistazo:** el diagrama
[`docs/diagramas/reuniones-y-usuarios.drawio`](../diagramas/reuniones-y-usuarios.drawio) (se abre en
app.diagrams.net → Abrir existente → GitHub). Página 1: quién guarda qué. Página 2: una reunión paso a
paso. Página 3: el mapa de dónde vive cada cliente.

## 6. Residentes, colaboradores y el ingreso de ALICE — ⏳ abierto (2026-11-05)

Daniel decidió el 2026-11-05 cómo se crean los residentes y los colaboradores y cómo entra ALICE
([ADR-0032](../adr/0032-residentes-colaboradores-e-ingreso-de-alice.md)). **El contrato exacto de la API está en
[docs/20](../20-alta-e-ingreso-desde-alice.md)**; el middleware lo construye en T-124. Lo que te toca saber:

- **Responde tus preguntas 2 y 3 de [docs/19](../19-diagnostico-alice-sesion-y-polygon.md):** ALICE recibe un **token Bearer**
  de 30 días que se renueva (no la cookie), y entran a ALICE los **residentes** (con su unidad y su rol) y los
  **colaboradores** (RN-327). Las preguntas 1, 4 y 5 siguen abiertas (T-129).
- ⚠️ **Actualizado el 2026-11-21 (§9 y §10):** ya **nadie nace sin documento**: la Administración crea al residente o al
  colaborador con nombre, celular **y documento**, y en el primer ingreso el documento que escribe la persona **debe
  coincidir**. Lo que sigue en este punto es lo de noviembre 5, para la historia.
- **(2026-11-05) Cambia lo que dejaste hoy:** el residente **nace sin documento** (la Administración solo pone unidad y celular), así que
  **el primer ingreso es por celular**; la primera vez ALICE le pide el **documento** y el nombre (`POST /api/app/yo/documento`),
  y si ya existía en otra copropiedad se unen. Después puede entrar con documento o celular. El ingreso por documento que
  hiciste sigue sirviendo para el segundo caso.
- **Las billeteras las manda crear ALICE** después de completar el documento, con la passkey (RN-322).
- **El ingreso devuelve dónde está la persona** (`lugares`): por copropiedad, sus unidades con el código (`T2-502`) y el rol
  en cada una, o su cargo si es colaborador. La persona elige la unidad y puede saltar sin volver a pedir código (RN-326).
  Tu `selector_residencias` encaja: ahora la lista viene del middleware y abarca varias copropiedades.
- **El administrador de la unidad gestiona a los suyos desde ALICE:** residentes (administradores o no), **mascotas** (perfil
  sin usuario) e **invitados con fecha de inicio y de fin** (RN-321). Se bloquea por unidad, no a la persona entera (RN-324).
- **Reuniones:** `…/reuniones` y `…/entrar` aceptarán el token; tu cliente de reuniones debe usar `/entrar` (no `/pase`).
- Tu tarea es **T-125**. **Actualización (2026-11-05, tarde): docs/20 §1 a §5 ya están en BLOKY Dev** (ingreso, token,
  documento, listado y gestión de la unidad). Falta el token en las reuniones (§6). Para probar con SMS real necesitas un
  número verificado en Twilio y que la Administración te cree como administrador de una unidad en BLOKY.


## 6b. Delegado / Administrador también en ALICE — ✅ RN-327 ampliada (2026-11-15)

**Hecho:** Administrador y Delegado vigentes entran a ALICE por defecto (opción B, docs/21). En
`lugares` llega `administracion: { rol }` aunque no haya unidad. Ya no hace falta crearte como
administrador de una unidad solo para probar el login.

**Aviso a Daniel:** en [`avisos/daniel.md`](./daniel.md) §8b — enterado; pendiente qué pantallas ve
quien entra solo por administración.

Caso tuyo (CC 80821419 / `3053996759`): tras el despliegue de BLOKY Dev con el cambio, Continuar →
código por WhatsApp debe pasar (ya no `403 sin_acceso`).

## 7. Evolution API / WhatsApp — 🟡 código de ALICE por WhatsApp (2026-11-15)

Pod en Dev; guía [`infra/guia-de-evolution.md`](../../infra/guia-de-evolution.md).

**Hecho (T-132):** el ingreso de ALICE (`/api/app/acceso/*`) manda el **código por WhatsApp** si hay
Evolution. La app en `feature/T-106-preparar-reuniones-video` pide solo celular. Texto libre:
`POST /api/app/whatsapp/enviar`.

**Hecho (2026-11-21):** instancia oficial **`Idiky_whatsapp`**. El middleware en Dev ya usa
`EVOLUTION_INSTANCE=Idiky_whatsapp` (guía [`infra/guia-de-evolution.md`](../../infra/guia-de-evolution.md) §6).

**Aparte, el SMS de BLOKY:** Twilio no entrega a Colombia y se pasará a **Amazon SNS cuando AWS apruebe la
cuenta** (bitácora 2026-11-12, T-18). Mientras tanto Twilio sigue: no lo quites ni construyas sobre SNS.

## 8. Roles desde BOB, permisos por módulo en ALICE e impersonación con pase — ⏳ abierto (2026-11-21)

Daniel decidió ([ADR-0034](../adr/0034-roles-desde-bob-matriz-de-permisos-e-impersonacion.md)):

- **Los roles los define BOB**, iguales para todas las copropiedades, y una **matriz rol × módulo** con **Ver · Crear ·
  Editar · Eliminar** (eliminar = anular o retirar) para BLOKY y **ALICE** (RN-333 a RN-336). La aplica el **middleware**
  en cada petición; ALICE debe pedir sus permisos y esconder lo que no tiene (T-137).
- **Módulos de ALICE** para la matriz (sacados de `App-Idiky` develop y del demo, confirmados por Daniel): Mi unidad y sus
  personas, Visitantes, Correspondencia, Reservas, Pagos y estado de cuenta, Paz y salvo, PQRS y solicitudes, Cartelera y
  comunicados, Asambleas y poderes, Reuniones con video, Proyectos, Directorio y Portería. Inicio y Mi cuenta, siempre.
  Si falta o sobra alguno, díselo a Daniel.
- **Varios roles**: los permisos en ALICE son la suma de los roles de la persona **en la unidad que eligió** (RN-339).
- **Impersonación** (RN-340, RN-341): soporte de IDIKY entra a ALICE desde un módulo de BOB, también en el celular, con un
  **pase de un solo uso firmado por el middleware**, para una unidad y un rol. ALICE debe abrir con ese pase y mostrar la
  franja «Soporte IDIKY actuando como…», en solo lectura salvo con motivo (T-136, T-137).
- **2026-11-21 — `POST /api/app/whatsapp/enviar` ya no es abierta (T-139):** fuera de desarrollo exige
  `Authorization: Bearer <BLOKY_ADMIN_TOKEN>` (401 sin él). Era un riesgo con el número de IDIKY: cualquiera mandaba texto
  libre. `ClienteWhatsApp` de ALICE no lo usa ninguna pantalla; si lo necesitas desde la app, habla con Daniel.
- **Prioridad (2026-11-21):** primero T-135 (la matriz en el middleware y los permisos en `/api/app/yo`, con el contrato en
  docs/20 antes de construir); tú puedes empezar T-137 con ese contrato. Luego los módulos de ALICE con servicio: Visitantes
  + Portería, Correspondencia, Cartelera, PQRS, Reservas.
- **2026-11-21 — Contrato de permisos listo para T-137:** [docs/20 §4b](../20-alta-e-ingreso-desde-alice.md). `GET /api/app/yo`
  agrega `roles` y `permisos` (por unidad y por lugar) y `permisosVersion`; los 13 identificadores de módulo; el 403
  `sin_permiso`; y los valores iniciales de la matriz. Es aditivo: lo que ya usas no cambia. Puedes empezar con datos de
  prueba mientras Daniel construye T-135.
- **2026-11-21 — T-135 en BLOKY Dev:** `GET /api/app/yo` ya trae `permisosVersion` y `roles`/`permisos` por lugar y por
  unidad (docs/20 §4b); también al validar el código. Las rutas de «Mi unidad» ya deciden con la matriz y responden
  `403 sin_permiso` con `modulo` y `accion`. Ojo: el **residente** ahora puede **ver** su unidad (`GET …/residencias`).
- **2026-11-21 — Dato de prueba para T-137 (corregido):** el administrador de la unidad **EC-201** de *Conjunto
  Residencial Altos del Bosque* es **Juan Luis Almonacid** (celular de prueba de Daniel, sin documento todavía: lo
  completa al entrar). `/api/app/yo` le da `administrador_unidad` con `mi_unidad` completo. La U-0133 ya no se usa
  (era de una estructura que no está en el terreno; su residencia quedó finalizada).

---

## 9. Una persona, un documento, un celular; primer ingreso con correo — ⏳ abierto (2026-11-21)

**Qué decidió Daniel:** [RN-353 a RN-357](../05-modelo-de-datos.md) (T-142 en el middleware y BLOKY, **T-143 es tuya**).
Lista de campos y unicidad, al día: [docs/20 §0](../20-alta-e-ingreso-desde-alice.md).

- **Identidad (no se repite):** un **celular** = una persona; un **documento** (país+tipo+número) = una persona. Ni el
  celular ni la cédula (u otro documento) pueden pertenecer a otro usuario: con la passkey y las billeteras, repetirlos
  mezclaría claves/cuentas (Justo, 2026-11-22; RN-353, RN-354, RN-298).
- **Un celular es de una sola persona** en todo IDIKY, y el **documento** identifica a la persona. La Administración ya crea
  a los usuarios de las unidades y a los colaboradores **con tipo y número de documento** (obligatorio) y BLOKY revisa antes.
- **Datos a capturar (primer ingreso):** tipo de documento, número, nombre, correo (validado), celular (ya lo trajo la
  Administración). **Fecha de nacimiento:** la pediste tú; **aún no está** en el directorio — hay que confirmarla con Daniel
  (aviso en [`daniel.md`](./daniel.md) §11).
- **Billeteras:** con tipo + número (→ `hashIdentidad`) + passkey bastan (§2b); no dependen del correo ni de la fecha.
- **Primer ingreso a ALICE (RN-356):** 1) código por el celular; 2) tipo y número de documento, que **deben coincidir** con los
  que reportó la Administración (`POST /api/app/yo/documento` ya lo revisa: si no coinciden responde 409
  `documento_no_coincide`); 3) **un correo, validado con un código**; 4) los datos básicos. Solo ahí
  entra. Las siguientes veces, solo el código del celular. Después: huella y facial.
- **Cambiar celular o correo (RN-357):** el celular nuevo se valida con su código **y** un código al correo validado; el correo
  nuevo, con su código **y** un código al celular. Mientras no exista en ALICE, lo hace soporte desde BOB.
- **Nunca existe una persona sin documento:** desde ya, `POST /api/app/c/:id/unidades/:uid/residentes` e `…/invitados` exigen
  **`nombre`, `celular`, `tipoDocumento` y `numeroDocumento`** (422 si falta). Si el documento ya está con otro celular, 409
  `otro_celular` (con `celularRegistrado` oculto: `300•••567`) y se reenvía con `aceptarCelularRegistrado: true` si el
  administrador de la unidad lo acepta; si el celular es de otra persona, 409 `celular_de_otra`. **Hay que pedir el documento en
  esos formularios de ALICE.**
- `POST /api/app/acceso/enviar-codigo` con un celular que tienen dos personas (datos viejos) responde 409 `celular_repetido`.
- **El correo ya sale** (2026-11-21): Amazon SES desde `no-responder@idiky.com`, en el middleware (`src/correo/ses.ts`, la
  dependencia `correo` de las rutas); tu Gmail ya está verificado para pruebas. Cómo funciona y cómo usarlo:
  [`infra/correo-ses.md`](../../infra/correo-ses.md).
- **Del middleware hará falta** (lo hacemos juntos): las rutas para enviar el código al correo, guardar el correo validado y las rutas de
  cambio de celular y correo. Dime qué contrato prefieres para escribirlo en docs/20.

**Mientras se habla:** no construyas en ALICE un cambio de celular que no pida el segundo factor, ni un primer ingreso que
deje entrar sin documento cuando la Administración lo reportó.

---

## 10. Varios países: documentos y celulares por país — 🟡 listo en el middleware, falta ALICE (2026-11-21)

**Qué decidió Daniel:** [ADR-0035](../adr/0035-paises-documentos-y-celulares.md), RN-358 a RN-364. **T-146 es tuya.** Daniel
lo probó en BLOKY y pidió que el **login de ALICE** lo tenga en cuenta.

**Lo que ya está en BLOKY Dev (middleware `a5d8e43.bloky-bd4a324`, que incluye tu `Idiky_whatsapp`; BOB
`570790b.gestion-ccb1b79`, ya desplegado con los 11 países):**

- **BOB define los países y sus documentos** (panel: *Países* y *Tipos de documento*). Hoy hay **11**: CO, VE, EC, PE, MX, AR,
  CL, ES, US, PA, BR, cada uno con su indicativo, la regla de su celular, sus documentos con su regla y el pasaporte.
- **`GET /api/app/catalogo-paises`** — **público, sin token**, para la pantalla de ingreso:
  `{ paisPorDefecto: 'CO', paises: [{ codigo, nombre, indicativo, celularLongitudMinima, celularLongitudMaxima,
  celularEmpiezaCon: string[], celularEjemplo, tipos: [{ codigo, nombre, soloNumeros, longitudMinima, longitudMaxima,
  patron, ejemplo, esPasaporte, orden }] }] }`.
- **`GET /api/app/c/:copropiedadId/catalogo-identidad`** — con token: `{ pais, paises }`, donde `pais` es el de la
  copropiedad (por defecto en los formularios dentro de la app).

**Qué tiene que hacer ALICE**

1. **Login (antes de la sesión):**
   - Un **selector de país del celular**, con 🇨🇴 **+57 por defecto** y la lista del catálogo.
   - Validar con la regla del país (longitud y con qué empieza) y mostrar el ejemplo.
   - Mandar a `POST /api/app/acceso/enviar-codigo` y `…/verificar-codigo` el celular **completo con su indicativo**
     (`+525512345678`). Sin el `+`, el middleware lo toma como de Colombia.
2. **Primer ingreso (RN-356), después del código:**
   - Pedir **país del documento** (por defecto el de la copropiedad), **tipo** (los del país) y **número**, y validarlo con la
     regla del tipo.
   - `POST /api/app/yo/documento`: si la Administración ya lo registró, **tiene que coincidir** (si no, 409
     `documento_no_coincide`).
   - Después, el **correo validado con su código** y los datos básicos. Para el correo falta la ruta del middleware: la
     hacemos juntos (T-143).
3. **Al agregar residentes e invitados:** pedir **nombre, celular y documento**. El país del celular y el del documento van
   por defecto en el de la copropiedad y se pueden cambiar con «Otro país».
   - Se mandan `paisCelular` y `paisDocumento`.
   - 422 trae el mensaje de la regla.
   - 409 `otro_celular` trae `celularRegistrado` (`300•••567`) y se reenvía con `aceptarCelularRegistrado: true` si se acepta.
   - 409 `celular_de_otra` si el celular es de otra persona.
4. **`celular_repetido` (409)** en el login: el celular lo tienen dos personas (datos viejos); se resuelve en BOB.

**Hay que hablar el hash de identidad (RN-363):** la propuesta es que **no cambie para Colombia** («TIPO:NUMERO», así nadie
pierde sus billeteras) y que para otros países sea «PAÍS:TIPO:NUMERO». Mientras no se decida, el middleware deja el hash
**vacío** para documentos de otros países. ¿Te sirve así con lo que ya tienes en la cadena?

**Mientras se habla:** no fijes en ALICE listas de tipos de documento ni reglas de celular solo para Colombia: léelas del
catálogo.

**El contrato completo, al día el 2026-11-21**, con los cuerpos, las respuestas y todos los códigos de error (§1.0 países,
§1.1 `celular_repetido`, §2 `documento_no_coincide`, §2c el correo, §5 el alta con documento, §6 quién vota):
[docs/20](../20-alta-e-ingreso-desde-alice.md).
