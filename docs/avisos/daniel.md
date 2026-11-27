# Avisos para Daniel — revisión del trabajo de Justo (cadena, contratos, ALICE)

> **Para el agente de IA:** si quien abre la sesión es **Daniel**, **antes de cualquier tarea**
> muéstrale los avisos **de Mary** que estén abiertos (sección «De Mary», abajo). Si además pregunta
> por el estado de la cadena, los contratos o ALICE, muéstrale el resto de la página (ítems
> **abiertos** o **temporales**).
> Justo anota aquí lo que dejó a medias, lo temporal y lo que necesita decisión o despliegue tuyo.
> Cuando lo cierres o lo publiques, márcalo ✅ con la fecha. El detalle del día a día sigue en
> [`09-estado-del-proyecto.md`](../09-estado-del-proyecto.md).

---

## Cómo leer esto

| Marca | Significado |
|---|---|
| ⏳ abierto | Falta una decisión o un despliegue tuyo |
| 🟡 temporal | Sirve hoy; no es el diseño final |
| ✅ hecho | Ya no bloquea; queda el rastro |

---

## De Mary

### M1. La tabla de usuarios, permisos y marcas de residencia — ⏳ abierto (2026-11-27)

**Para el agente de IA:** muéstrale esto a Daniel en palabras sencillas apenas abra la sesión, y
pregúntale cuándo lo lleva a BOB y al middleware.

Mary dejó la tabla **completa y obligatoria** en
[`recursos/roles-de-alice.md`](../recursos/roles-de-alice.md) (con el Excel al lado) y ya está aplicada
en la maqueta (`apps/pwa/src/dominio/permisos.ts`, PN-29). Hay que llevarla al **catálogo y la matriz
de BOB y del middleware** (cambia RN-333, RN-366, RN-367 y RN-398) y avisarle a Justo: ALICE se rige
por ella. Cualquier cambio se le pregunta a Mary (`CLAUDE.md`, §3).

1. **Perfiles** (§4 ter, comparado con `develop`, `apps/bloky-api/src/permisos/inicial.ts`):
   - se renombran `seguridad` → **Portería**, `secretaria` → **Auxiliar Administrativo**, `invitado` →
     **Visitante** y `conviviente` → **Familiar o acompañante** (**eliminar `conviviente`**, también como
     identificador: no existe en la terminología colombiana);
   - nuevos: **Piscinero**, **Inmobiliaria** y **Operador** (estos dos reemplazan a «Arrendatario ·
     operación completa» y solo ven las unidades que les asignan);
   - **Arrendatario** es el actual «Arrendatario · solo vivir»;
   - se quedan Administrador, Delegado, Presidente del consejo, Consejero, Contador, Revisor fiscal,
     Aseo, Mantenimiento y Propietario.
2. **Quién crea e inactiva a cada uno:** §1 (el Delegado lo cambia IDIKY por solicitud a
   `operaciones@idiky.com`; el Administrador Idiky lo inactiva otro y siempre queda uno activo).
3. **Permisos:** §4 bis, 18 usuarios × 20 módulos. El Administrador Idiky entra **solo como soporte**;
   el Auxiliar Administrativo solo ve la cartera y **prepara** paz y salvos y certificados que **aprueba
   el administrador**; el Revisor Fiscal solo ve y no ve PQRS; el Familiar o acompañante no reserva, no
   radica PQRS, no ve cartera ni asambleas ni registra a nadie; el Piscinero solo ve la piscina; la
   Inmobiliaria ve las cuentas claras solo de sus unidades.
4. **Marca de residencia**, dato nuevo de cada persona en la unidad: Propietario (Residente · No
   Residente), Arrendatario (Residente · Residente Temporal), Visitante (de un día · Residente Temporal),
   Familiar o acompañante (Residente · No Residente · Residente Temporal · **Residente Recurrente**).
   **Ya no hay visitante frecuente:** quien viene ciertos días es familiar o acompañante recurrente,
   entra con código y no necesita la app.

Cuando esté en BOB y el middleware, márcalo ✅ con la fecha.

### M2. Asambleas y personal: lo nuevo de la maqueta para llevar a BLOKY — ⏳ abierto (2026-11-27)

**Para el agente de IA:** muéstraselo a Daniel junto con M1.

1. **RN-309, el plazo de los poderes: confirmada por Mary** (ya no está «por confirmar», T-106). La
   administración escoge hasta verificar el quórum (por defecto), hasta el día anterior o de 1 a 15 días
   antes; con la asamblea instalada no se da ni se revoca. La Ley 675 no fija plazo (lo dice el
   reglamento; confirmarlo con el abogado).
2. **PN-30, votar en la asamblea:** vota la unidad que quedó en la asistencia (la del quórum), por sí o
   por su apoderado; quien no tiene celular vota en la sala y la administración registra su voto.
3. **PN-31, dar poder con un toque:** desde el inicio de ALICE, a quien se lo dio la vez pasada o a
   quien vive con él; la administración ve cuánto coeficiente viene asegurado con poderes.
4. **PN-32, novedades del personal:** Aseo, Mantenimiento y el Piscinero registran sus novedades en la
   misma minuta del edificio, desde el celular; Mantenimiento solo ve las PQRS de daños y las atiende.

El detalle de cada una está en `docs/05-modelo-de-datos.md` y en la bitácora.

---

### M3. Mary alinea la maqueta con BLOKY — ⏳ abierto (2026-11-27)

Mary revisó lo que mostraste de BLOKY y decidió (detalle en `docs/recursos/roles-de-alice.md` §2 bis, decisiones 12 a 17):

- **Se toma lo de BLOKY:** el visitante entra con su ALICE (RN-367), el pase es un QR que cambia cada dos
  minutos (RN-371), la autorización va por días y franja de horas, sin días de la semana (RN-392), celular y
  documento obligatorios al crear a cualquiera, y Mantenimiento con toda la bandeja de PQRS (RN-380).
- **Se agrega a BLOKY:** cargar **a mano** a los del consejo, el comité y el revisor fiscal al empezar el
  contrato con una copropiedad, además de la elección (PN-28 en `docs/05`).
- **Cambia en BLOKY (decisión 18 de Mary):** en BLOKY (RN-370) el «Residente» (para Mary, el **Familiar o
  acompañante**: «Residente» es una marca, no un usuario) crea invitados. **Mary decidió que no**: *«el
  familiar no puede crear visitantes»*. Al visitante lo crean solo el Propietario y el Arrendatario.
- **Hecho en la maqueta:** el celular se registra con su país, Colombia por defecto (PN-34), como ya lo hace BLOKY.

## 1. Identificadores on-chain = `hashIdentidad` (RN-298) — ✅ hecho en código (2026-10-23); ⏳ redeploy Amoy

**Decisión de producto (ya tuya, RN-298):** la identidad en la cadena es el HMAC del documento, no
el correo. Lo calcula solo el middleware.

**Qué hizo Justo** (`SmartContrat-Idiky`, rama `feature/cuentas-quitar-login`, **sin merge a
`develop`/`main` todavía**):

| Antes (ABI Amoy 2026-10-17) | Ahora |
|---|---|
| `hashCorreo` | `hashIdentidad` |
| `cuentaPorHash` | `cuentaPorIdentidad` |
| `hashPorCuenta` | `identidadPorCuenta` |
| `calcularHash(string)` | eliminado |

Docs del repo de contratos alineadas. `forge test` en verde. En `BOB-Idiky` (local, rama del
plugin) se actualizaron las ABI de `registrar` y el lab `cadena/servicio`.

**Para ti:**

1. Revisar y mergear la rama de contratos cuando toque.
2. **Redeploy en Amoy** de las dos fábricas + paymaster (el despliegue del 17-oct sigue con la ABI
   vieja) y actualizar direcciones / env de BOB Dev.
3. Publicar BOB con las ABI nuevas cuando las fábricas nuevas estén arriba.

Detalle: bitácora 2026-10-23 · SmartContrat; `SmartContrat-Idiky/contracts/cuentas/README.md`.

---

## 2. Cómo se identifica ALICE (T-87) — ⏳ abierto · 🟡 temporal hoy

**Diseño natural (ADR-0025):** la app entra por el **middleware de IDIKY** con la sesión de la
persona, no por usuarios de Strapi.

**Hoy (temporal):** ALICE firma el alta por QR contra BOB (`/api/cuentas-polygon/...`) con
**JWT de users-permissions** (`ALTA_QR_JWT` por `--dart-define`). BOB no tiene usuarios finales;
ese JWT es solo de laboratorio / Dev.

**Para ti:** cerrar T-87 (¿el plugin se queda en BOB atendiendo sin guardar personas, o pasa al
middleware? ¿cómo autentica la app?). Hasta entonces Justo no debe inventar otro login.

**Diagnóstico de Justo (2026-11-05):**
[`docs/19-diagnostico-alice-sesion-y-polygon.md`](../19-diagnostico-alice-sesion-y-polygon.md) —
separa sesión (doc+SMS) de passkey (firma en el teléfono), muestra que el HTTP **sí** puede pasar
primero por el middleware sin sacar la privada, y deja opciones A–E + preguntas concretas (§6).

Ver también [`avisos/justo.md`](./justo.md) §2.

---

## 3. Plugin `cuentas-polygon` y directorio — ✅ adaptado en BOB Dev (2026-10-21)

Publicado: directorio + `hashIdentidad` + billeteras (RN-298, RN-299); `persona` salió de BOB.
Reto de alta `v2`. Consultas por documento, no por correo.

**Pendiente de prueba real:** firma del alta con un teléfono físico (assetlinks / AASA / RP_ID).

---

## 4. Vocabulario y capa de datos de ALICE — 🟡 temporal

En `App-Idiky`, `adaptador_api.dart` y algunos docs locales aún dicen «API de BLOKY». El arnés pide
«**middleware de IDIKY**» (ADR-0025). Cosmético / deuda; no bloquea el alta por QR.

---

## 5. Lab `src/api/cadena` en BOB — 🟡 temporal (solo local)

Simulación con `SIMULAR_CADENA`. Sigue teniendo helpers y campos JSON llamados `hashCorreo` que
hacen `keccak256` de un correo: **no es el modelo de producto**. No abrir esas rutas en
producción. Las ABI de llamada a fábricas ya apuntan a `hashIdentidad` / `cuentaPorIdentidad`.

---

## 6. Contrato virtual firmado en cadena (aviso 5 / T-116) — ⏳ abierto

Solo decisión: cómo se firma y dónde vive la lógica. Justo no debe agregar campos de firma en BOB
mientras esté abierto ([`avisos/justo.md`](./justo.md) §5).

---

## 7. Jitsi / pases JWT (T-106) — 🟡 ALICE y presencia hechos (2026-11-15); queda sala de espera y webhooks

Los pases van en el **middleware** (ya firmados) y Jitsi Dev ya está en modo JWT. Justo no crea
endpoints de JWT en BOB.

**Hecho en ALICE (2026-11-15):** Asambleas lista reuniones reales (`GET …/reuniones`), Entrar pide
pase (`POST …/entrar`) y abre Jitsi con el SDK. Guía [`18`](../18-reuniones-con-video.md) §5.

**Hecho en middleware + BLOKY + ALICE (RN-190):** una persona, un dispositivo por reunión; traslado
con diálogo. Desplegado en BLOKY Dev (`394a419.bloky-c5b887a`).

**Te queda del aviso 3 de Justo:** sala espera al anfitrión; cámara/mic por permiso del secretario;
webhook de asistencia (entra/sale) hacia el middleware; kick forzado desde Prosody.

---

## 8b. Delegado / Administrador también en ALICE — ✅ aplicado; te enteramos (Justo, 2026-11-15)

**Qué había:** Delegado vigente (caso Justo Soto, CC 80821419) entraba a BLOKY y ALICE respondía
`403 sin_acceso` (RN-327 solo contaba residente/colaborador).

**Qué se hizo (opción B de [`docs/21`](../21-delegado-en-bloky-sin-acceso-a-alice.md)):** se amplió RN-327.
Administrador y Delegado vigentes entran a ALICE; `lugares` trae `administracion: { rol }` aunque no
tengan unidad. Middleware en `Bloky-Idiky` (T-132) + contrato en docs/20 §4.

**Para ti (cuando puedas):** qué pantallas ve quien entra **solo** por administración (reuniones sí /
votación de unidad no). El ingreso ya no bloquea.

---

## 8. Evolution API / WhatsApp en Dev (T-131, T-132, ADR-0033) — ✅ instancia oficial `Idiky_whatsapp` (2026-11-21)

**Cómo entrar y mandar mensajes:** [`infra/guia-de-evolution.md`](../../infra/guia-de-evolution.md)
(Manager, API key en el servidor, `sendText`, y **§8** el endpoint del middleware).

**Hecho:** firewall 8086; pod `v2.3.7`; mensaje de prueba ok.

**T-132 (Justo, 2026-11-15):** OTP de ALICE por WhatsApp en `/api/app/acceso/*` (Evolution) +
`POST /api/app/whatsapp/enviar` para texto libre. Middleware en BLOKY Dev; ALICE en `develop`.
Secretos `EVOLUTION_*` en el servidor.

**2026-11-21 — línea oficial:** instancia Evolution **`Idiky_whatsapp`**. `EVOLUTION_INSTANCE` en
`bloky-api.env` + BLOKY redesplegado (`ffcd6d8.bloky-96d7221`). Guía §6. Sigue opcional: túnel
`evolution-dev.idiky.com`.

---

## 18. Dos modos de invitado: visita de un rato vs varios días — ✅ respondido (Daniel, 2026-11-25)

> **Decisión (RN-392):** es **un solo rol** `invitado`. Se autoriza para uno o varios días y, si se quiere, solo unas horas
> de cada uno de esos días; sin horas, todo el día. La visita de un rato es un día con su franja. Ya está en el middleware
> (T-164, BLOKY Dev); en ALICE tiene que ser muy fácil de configurar (T-166).

**Hoy (RN-366 / RN-370):** un solo rol **`invitado`**, con `desde`/`hasta` en **días**. Misma pantalla y mismas reglas
para «viene un amigo esta tarde» y «la tía se queda una semana».

**Propuesta de Justo (ALICE → Mi unidad → Invitado):** un selector de **dos formas**:

| Modo | Caso de uso | Vigencia que pediría |
|---|---|---|
| **Visita / diario** | Estoy en casa; hoy viene un amigo. Lo registro como invitado y **de una** tiene acceso a la unidad (pase / confirmación). Puede ser franja horaria (desde–hasta hoy) o «hasta que se vaya» | Día de hoy + **hora** (relacionado con §17); o abierta hasta que portería/él cierre la visita |
| **Estancia / temporal** | Familiar o amigo que **vive unos días** en la unidad | Desde qué **día** hasta qué **día** (como hoy, sin obligar hora) |

**Por qué:** el flujo mental y los controles no son los mismos; meter ambos en un solo par de fechas confunde y no
sirve bien a portería ni al pase.

**Qué habría que decidir contigo:**

1. ¿Son **dos modos del mismo rol** `invitado` (un campo `modo` / UX) o dos roles/paquetes en BOB?
2. Visita corta: ¿franja con hora (§17 B), «hasta que salga» (cierre en portería), o basta el día completo?
3. Estancia: ¿sigue solo con días, como ahora?
4. ¿El pase QR y «Adentro ahora» (T-149) cambian según el modo?

**Justo no implementó el selector.** Queda la pantalla actual (un invitado, fechas). Ver también §16 (datos al crear) y §17 (hora).

---

## 17. Vigencia del invitado: ¿solo día o también hora (franja)? — ✅ respondido: opción B (Daniel, 2026-11-25)

> **Decisión (RN-392):** días **y** franja de horas opcional (`horaDesde`, `horaHasta`), que la portería y el pase respetan
> (`fuera_de_horario`). Hecho en el middleware (T-164); contrato en docs/20 §5b.

**Contexto:** en ALICE (Mi unidad) el invitado ya elige **fecha y hora** en Desde/Hasta (por defecto hoy). Justo
quiere poder autorizar **franjas** (p. ej. «solo de 14:00 a 18:00») para visitas y para dar objetivo a otras personas
(portería, pase).

**Qué dice el arnés hoy (no se puede persistir la hora sin cambiarlo):**

| Pieza | Hoy |
|---|---|
| **RN-321 / RN-370** | Invitado con **fecha** de inicio y de fin (día calendario) |
| **BD** `residencia.desde` / `hasta` | Tipo **`date`**, no `timestamptz` (migración `016-residencias.sql`) |
| **Validación** `motivoInvitadoInvalido` | Solo `YYYY-MM-DD` |
| **Portería / vigencia** `residenciaVigente` · `veredictoDeIngreso` | Comparan con **`hoy`** (día), no con la hora |

ALICE muestra hora en la UI, pero al guardar manda solo el día. La hora **no llega** al middleware ni a portería.

**Propuesta de Justo:** que la vigencia del invitado pueda ser **día + hora** (franja), para que portería y el pase
respeten «todavía no» / «ya no» también por reloj.

| Opción | Efecto |
|---|---|
| **A. Mantener solo día** | Como hoy; la hora en ALICE sobra o es solo referencia |
| **B. Franja con hora** | Cambiar RN + columnas (`timestamptz` o `date`+`time`) + validación + portería/pase |

**Justo no tocó el middleware.** Mientras está abierto, ALICE sigue con selectores de hora pero el backend guarda el día.

---

## 16. ¿Al agregar a la unidad basta el celular (sin nombre ni cédula)? — ✅ respondido: opción A (Daniel, 2026-11-25)

> **Decisión (RN-394):** **siempre** se piden nombre y documento. Si el documento ya existe no se crea otra persona: solo
> su relación con la unidad, y se conserva el nombre que ya tenía (la respuesta trae `yaExistia: true`).

**Contexto:** en ALICE → **Mi unidad → Agregar**, hoy se piden **nombre, celular y documento** (conviviente /
arrendatario / invitado). Justo, al probar con Juan Luis, siente que es mucho: la otra persona **igual va a
comprobar/completar** sus datos en el primer ingreso.

**Propuesta de Justo:** al crear desde la unidad, **solo el celular** (o como mucho celular + algo mínimo). **No
obligar nombre ni número de cédula** ahí; eso lo confirma la persona cuando entre a la app.

**Hoy (RN-354, Daniel 2026-11-21; docs/20 §5):** *nadie se crea sin documento*. Al agregar residente/invitado hacen falta
**`nombre`, `celular`, `tipoDocumento` y `numeroDocumento`**. Motivo: el documento identifica a la persona antes de
crearla (revisión `otro_celular` / `celular_de_otra`); en el primer ingreso debe **coincidir** con lo reportado
(RN-356). RN-322 (nacer solo con celular) **quedó reemplazada** para lo nuevo.

**Justo no cambió ALICE ni el middleware** (respeta RN-354). Pide decisión:

| Opción | Efecto |
|---|---|
| **A. Mantener RN-354** | Sigue pidiendo nombre + celular + documento al agregar |
| **B. Alta mínima por celular** | Nueva regla / ajuste: crear con solo celular (¿y nombre opcional?); documento y nombre los completa la persona en el primer ingreso (vuelve algo como RN-322) |

**Mientras está abierto:** Mi unidad **sigue** pidiendo los cuatro campos.

---

## 15. Verificar en SES el correo `sotomadev@gmail.com` (prueba Juan Luis) — ✅ hecho (2026-11-25)

**Hecho por Daniel (2026-11-25):** creó la identidad `sotomadev@gmail.com` en SES (us-east-1). Justo abrió el enlace de
Amazon (o ya quedó verificada).

**Comprobado (Justo, 2026-11-25):** prueba real desde BLOKY Dev (`POST /api/admin/correo/prueba`) → `enviado: true`,
`real: true`. SES acepta el destinatario.

**Uso:** **`sotomadev@gmail.com`** en «Tu correo» del primer ingreso de **Juan Luis Almonacid** (I1-101). Guía:
[`infra/correo-ses.md`](../../infra/correo-ses.md) §4.

---

## 14. ¿La app puede corregir el documento si no coincide con el de la Administración? — ✅ respondido: sí, una sola vez (Daniel, 2026-11-25)

> **Decisión (RN-391, RN-393, RN-395):** sí, la persona lo corrige ella misma **una sola vez**, en el momento en que se
> valida al entrar a ALICE (ya probó el celular con el código), y a la Administración le queda un aviso en BLOKY. **Después
> ALICE no puede permitir que la misma persona cambie su documento**: se le pide a IDIKY con foto por ambas caras y un
> código nuevo, e IDIKY lo evalúa. Hecho en el middleware (T-164 y T-165); la pantalla de BOB «Cambios de documento» está
> desplegada en BOB Dev (versión 0.6.0, con la ficha de verificación). **El permiso no hace falta todavía:** el 2026-11-25 los
> cuatro usuarios de BOB son Super Admin, que ya la ven; cuando exista un rol más limitado (por ejemplo «Soporte») hay que
> darle «Revisar cambios de documento» y, si aplica, «Impersonar». Falta probarla con una solicitud real.
> Contrato en docs/20 §2.

**Contexto:** en el primer ingreso (pantalla «Confirmar documento»), si el tipo/número no coinciden con
`directorio.persona`, el middleware responde `409 documento_no_coincide` y ALICE no deja seguir (RN-356).

**Propuesta de Justo:** que **prime lo que escribe la persona en la app** (ella conoce sus datos). Si difiere de lo que
puso la Administración, mostrar un diálogo: *«Estos datos no coinciden con los de la administración. ¿Estás seguro de
que son correctos y quieres actualizarlos?»* → si acepta, guardar lo de la app y continuar.

**Hoy (RN-356, Daniel 2026-11-21):** *deben coincidir con los que reportó la Administración; si no, no entra y se le dice
que hable con la Administración.* Motivo: no atar passkey/`hashIdentidad`/billeteras a una identidad equivocada.

**Justo no lo implementó** (respeta RN-356). Pide decisión:

| Opción | Efecto |
|---|---|
| **A. Mantener RN-356** | Sigue el rechazo duro; la Administración corrige el documento en BLOKY |
| **B. Aceptar corrección con confirmación** | Nueva regla / ajuste a RN-356: diálogo + actualizar documento (y ¿recalcular `hashIdentidad` si aún no hay billeteras?) |

**Mientras está abierto:** ALICE y el middleware **no** cambian el comportamiento de `documento_no_coincide`.

---

## 13. Celular temporal de Juan Luis Almonacid (Dev) — 🟡 temporal (Justo, 2026-11-24)

**Qué pasó:** Justo está construyendo **Mi unidad** en ALICE (T-148). Con su usuario (Justo Soto) entra a «Pruebas IDIKY»
pero **sin unidad** (es administración/delegado). El propietario de prueba **Juan Luis Almonacid · I1-101** tenía el celular
de prueba que terminaba en **1613**, al que Justo no recibe el OTP de WhatsApp.

**Cambio en BLOKY Dev** (`directorio.persona`, id `7e4e6cd6-0306-4c1b-b54b-10bf288ff87c`):

| | Celular |
|---|---|
| **Antes** | `+573004051613` |
| **Ahora (temporal)** | `+573104045015` |

**Por qué:** para que el OTP de Juan Luis llegue a un número que Justo controla y pueda probar Mi unidad.  
**No** se usó el celular de Justo Soto (`+573053996759`): un celular = una persona (RN-353).

**Para restaurar** (cuando termine la prueba o si el …1613 “no le funciona” a quien lo usaba):

```sql
UPDATE directorio.persona
SET celular = '+573004051613'
WHERE id = '7e4e6cd6-0306-4c1b-b54b-10bf288ff87c'
  AND nombre = 'Juan Luis Almonacid';
```

**Al cerrar:** devolver el celular al …1613 (o al que Daniel decida) y marcar ✅ aquí.

---

## 12. Propietario, arrendatario, visitantes y bitácora Merkle — 🟡 respondido con ajustes (Daniel, 2026-11-23)

**Documento a revisar con tu IA (ya en `main` del arnés `idiky`):**  
[`docs/23-propietario-arrendatario-y-vinculos.md`](../23-propietario-arrendatario-y-vinculos.md)  
(§0 idea central · §3 cadena · §7 billeteras y paquetes · §7b Merkle · **§10b decisiones D1–D8** · §12 preguntas)

**Qué pide Justo:** que autorices (o ajustes) el borrador para convertirlo en ADR + RN y poder seguir en ALICE
(Mi unidad, arrendatario, visitantes).

**Resumen de la propuesta**

| | |
|---|---|
| Altas | Admin/Delegado suben **propietarios** por CSV (no implica que vivan) |
| Cadena | Propietario → arrendatario (fechas + facultades) / familia / visitantes |
| Login | `lugares` con todos los vínculos; **sin** auto-reclamo de apartamento |
| Visitantes | Usan **ALICE** (identidad multi-conjunto) |
| Billeteras | **Todos** activan la doble cartera en el primer ingreso (passkey) |
| Escala | El **paquete** (pase / gimnasio-piscina / operar), no las carteras |
| Cadena | BD operativa; **Merkle periódico** de altas y accesos; tokens on-chain = roles **estables** (ADR-0031) |

**Mientras está abierto:** Justo no construye rol arrendatario ni visitante nuevo en contra del docs/23; puede seguir
Mi unidad con residente/invitado (docs/20 §5).

**Al cerrar:** marcar ✅ aquí, abrir ADR (o pedir a Justo que lo redacte) y actualizar docs/20 / ADR-0032 si hace falta.

**Respuesta de Daniel (2026-11-23), revisada con su IA contra las RN, CU y ADR vigentes, y ajustada por él mismo:**

| # | Decisión | Respuesta final |
|---|---|---|
| **D1** | Cadena de altas, sin auto-reclamo | ✅ **Aprobada** (RN-320, RN-328, RN-354, RN-365) |
| **D2** | Propietario ≠ vive ahí | ✅ **Aprobada** → **RN-369**: no lo obliga a vivir ahí, pero sigue gestionando la unidad |
| **D3** | Arrendatario con fechas + facultades | 🟡 **Aprobada con ajuste** → **RN-366**: las facultades **no se marcan persona por persona**. Los roles son **estandarizados y los define BOB** (ADR-0034, RN-333): BOB tiene **paquetes como roles fijos** («Arrendatario · solo vivir», «Arrendatario · operación completa»…) y el propietario elige uno. **Se construye ya en BOB** (T-147) |
| **D4** | Visitantes usan ALICE | ✅ **Aprobada como la propuso Justo** → **RN-367**: el invitado **siempre** usa ALICE. *El plomero ya tiene su cuenta en IDIKY: se registra una única vez y cada edificio solo le extiende la invitación; es molesto la primera vez pero garantiza muchas cosas las siguientes* (Daniel). No hay pase sin app |
| **D5** | Doble cartera para todos | ✅ **Aprobada**: todos los que entran usan ALICE (D4), y todos activan las dos billeteras en el primer ingreso |
| **D6** | Lo que escala es el paquete | ✅ **Aprobada** (matriz de ADR-0034) |
| **D7** | BD + Merkle periódico; tokens solo roles estables | 🟡 **En principio, ADR aparte y fase posterior** (contrato, frecuencia, costo en Polygon, minuta de portería RN-236). No frena a ALICE |
| **D8** | Bitácora de portería e ingresos | 🟡 **En el mismo ADR que D7**. Todas las entradas quedan registradas desde ya en la base (RN-367) |

**Nombres (RN-366):** roles en la unidad = **propietario · arrendatario · conviviente · invitado** (con fechas). **Ningún rol
dentro de la copropiedad se llama «administrador»**: el «administrador de la unidad» pasa a ser **propietario**, para no
confundirlo con el Administrador de la copropiedad. El visitante **es** el invitado: se le extiende una invitación y entra con
ALICE.

**Preguntas de docs/23 §12:**
- **Varios propietarios por unidad:** sí pasa (herencias, parejas), pero vota uno por unidad (RN-365): hay que definir el
  **propietario principal**. → Mary (aviso §5 de Mary).
- **Retiros en cascada (RN-368):** cuando el propietario retira a un arrendatario o conviviente, se retira todo lo que ese
  usuario creó (personas y permisos); al vencer el arriendo, pasa solo.
- **Propietario no residente (RN-369):** sigue viendo la cartera y puede bloquear o finalizar al arrendatario.
- Lo demás (regla del recurrente, invitación por código, frecuencia del Merkle) queda para los ADR.

**Siguiente paso:** Justo redacta el **ADR** con D1–D6 tal como quedaron arriba (las reglas ya están: RN-366 a RN-369); el
de Merkle (D7–D8) va aparte. **Mientras tanto** sigue con «Mi unidad» en ALICE contra la API de hoy (docs/20 §5),
**sin construir nada que contradiga RN-366 a RN-369 ni ADR-0034** sin autorización de Daniel (aviso §9 de Justo).


---

## 11. Datos del usuario, unicidad y fecha de nacimiento — ✅ aprobado (2026-11-22)

Justo documentó en [docs/20 §0](../20-alta-e-ingreso-desde-alice.md) y **RN-192**:

- Un **celular** y un **documento** = una sola persona cada uno; **no se repiten** (RN-353, RN-354). Motivo: passkey y
  billeteras (`hashIdentidad`) no pueden quedar atadas a dos personas.
- Para **crear billeteras** bastan tipo + número de documento (+ passkey).
- Campos del primer ingreso: tipo/número de documento, nombre, celular, correo (con código) y **fecha de nacimiento**.

**Fecha de nacimiento — ✅ aprobada** (acuerdo telefónico Justo ↔ Daniel, 2026-11-22): va en `directorio.persona`
(`fecha_nacimiento`, `YYYY-MM-DD`), obligatoria en los datos básicos del primer ingreso (T-143). Falta construirla en el
middleware (migración + ruta) y en ALICE.

---

## 10. Resumen para Daniel — sesión Justo 2026-11-16 (cierre del día)

> Léelo primero si retomas ALICE / cadena / avatar. Detalle en la bitácora
> ([`09`](../09-estado-del-proyecto.md)).

### Qué quedó hecho hoy

| Tema | Dónde | Estado |
|---|---|---|
| **Alta billeteras primer login** (T-129 A2, sin QR) | Middleware + BOB servicio + ALICE + secreto | ✅ En Dev; ver §9b |
| **Secreto `IDIKY_CADENA_PROXY_TOKEN`** | `levantar.sh` + `conectar-cadena-proxy.sh` | ✅ Inyectado (= `BOB_API_TOKEN`); BOB y BLOKY publicados |
| **Billeteras de prueba** (3053996759 · Justo Soto) | `directorio.persona` en BLOKY Dev | ✅ Dos billeteras guardadas (2026-11-17 ~02:45 UTC) |
| **CU-R-34 + RN-191 + plan** (avatar en ALICE) | Arnés `docs/` · aviso Mary §0 | ✅ Documentado |
| **Avatar middleware** (T-90) | `Bloky-Idiky` `develop` · Dev `…bloky-180c909` | ✅ `GET`/`PUT /api/app/yo/apariencia` |
| **Avatar app** (T-90) | `App-Idiky` `develop` | ✅ Personaje + editor + barra; **falta probar en teléfono** |

### Ramas / revisiones (noche del 2026-11-16)

| Repo | Rama / revisión | Notas |
|---|---|---|
| `Bloky-Idiky` | `develop` (plantilla `Idiky_whatsapp` en `secretos.sh`) | Middleware Dev: billeteras + apariencia + WhatsApp oficial |
| `BOB-Idiky` | `develop` | Rutas `/servicio/alta*` + script secreto |
| `App-Idiky` | `develop` | Avatar, billeteras T-129, menú cuenta (cerrar sesión) |
| `idiky` (arnés) | `main` | Bitácora, CU-R-34, **`Idiky_whatsapp`**, este aviso |

**Billeteras (recordatorio):** se crean con **`hashIdentidad`** (RN-298) = HMAC del documento `TIPO:NUMERO`, no del correo (§1).

### Notas útiles

- **Passkey en emulador:** `NoCreateOptionException` casi siempre es PIN/cuenta Google/Play Services; `assetlinks.json` en `bob-dev.idiky.com` **sí** está bien. Tras crear billeteras en el teléfono, el mismo número en emulador **no** vuelve a pedir passkey.
- **Avatar:** no bloquea el ingreso; toque en la barra → editor. Mismo `persona.apariencia` que BLOKY.
- **Mary:** borrador CU-R-34 en su rango; aviso §0 en [`mary.md`](./mary.md).

### Qué NO cerró Justo (sigue abierto)

- A1 / T-87 (plugin en el middleware), RP ID → dominio del middleware, redeploy Amoy (§1).
- Probar avatar en teléfono y, si hace falta, pulir el dibujo.
- ~~Número WhatsApp dedicado de IDIKY~~ → **`Idiky_whatsapp`** (2026-11-21).

## 9c. Avatar en ALICE (CU-R-34 / T-90) — 🟡 código en `develop` (2026-11-16)

**CU-R-34** + **RN-191** + plan en [`residente.md`](../casos-de-uso/residente.md#cu-r-34). Contrato docs/20
`GET`/`PUT /api/app/yo/apariencia`.

| Pieza | Dónde |
|---|---|
| Middleware | `Bloky-Idiky` `develop` @ `180c909` — desplegado en Dev |
| ALICE | `App-Idiky` `develop` @ `85d89c7` — personaje, editor, barra |
| Guardado | `directorio.persona.apariencia` (RN-297) |

**Falta:** probar en teléfono; Mary puede revisar el texto del CU (aviso §0).

## 9b. Alta de billeteras en el primer login (T-129, A2) — ✅ listo en Dev (2026-11-16)

**Decisión de Justo (alineada con docs/19 A2):** ALICE solo habla con el middleware. El alta de
billeteras va en el primer login (después de WhatsApp), con passkey en el teléfono. **Sin QR** y
**sin `ALTA_QR_JWT`** en el flujo feliz.

| Pieza | Dónde |
|---|---|
| ALICE | `App-Idiky` `develop` — pasos Documento + Billeteras (tras WhatsApp) |
| Middleware | `Bloky-Idiky` `develop` — `POST /api/app/cadena/alta` y `…/firma` |
| BOB (servicio) | `BOB-Idiky` `develop` — `/api/cuentas-polygon/servicio/alta*` |
| Secreto | `IDIKY_CADENA_PROXY_TOKEN` = `BOB_API_TOKEN` (inyecta `levantar.sh`; también `infra/gestion/conectar-cadena-proxy.sh`) |
| Contrato | [`docs/20`](../20-alta-e-ingreso-desde-alice.md) §2b |

**Probar:** persona **sin** billeteras → WhatsApp → (documento si falta) → Crear billeteras → huella → entrar.

**Sigue abierto (no bloquea este flujo):** A1 (mudar el plugin al middleware), RP ID → dominio del
middleware, redeploy Amoy (§1), movimientos día a día por middleware.

---

## 9. Resumen para Daniel — sesión Justo 2026-11-15 (subido a GitHub)

> Léelo primero si retomas ALICE / reuniones / login. Detalle día a día en la bitácora
> ([`09`](../09-estado-del-proyecto.md)).

### Qué quedó hecho y dónde está

| Tema | Dónde | Estado |
|---|---|---|
| **Admin/Delegado entran a ALICE** (RN-327 ampliada) | `Bloky-Idiky` `develop` · BLOKY Dev | ✅ Desplegado |
| **OTP ALICE por WhatsApp** (T-132, Evolution) | Middleware + ALICE | ✅ Middleware en Dev; app en rama |
| **Asambleas = reuniones reales + Jitsi** (T-106, RN-325 Bearer en `/api/c`) | `App-Idiky` `feature/T-106-…` → `develop` | ✅ En GitHub |
| **Una persona, un dispositivo** (RN-190): 409 + traslado + latido 15 s | Middleware + ALICE + BLOKY web | ✅ BLOKY Dev `394a419.bloky-c5b887a` |
| **Diálogo de traslado en la web** (no `window.confirm`) | BLOKY `develop` | ✅ Desplegado |
| **Sesión persistente ALICE** (Bearer en Keystore/Keychain; `GET /yo` al abrir; Cerrar sesión) | `App-Idiky` | ✅ En GitHub (docs/20 §3) |
| **Alta billeteras primer login** (T-129 A2, sin QR) | Middleware + BOB servicio + ALICE | ✅ En Dev; ver §9b |
| **Avatar en ALICE** (CU-R-34 / T-90) | Middleware + app | 🟡 Código en `develop`; ver §9c y §10 |

### Ramas / revisiones (2026-11-15 noche; **actualizado 2026-11-16 en §10**)

| Repo | Rama / revisión | Notas |
|---|---|---|
| `Bloky-Idiky` | `develop` (ver §10: `180c909`) | Middleware Dev |
| `App-Idiky` | `develop` (ver §10: `85d89c7`) | Probar en teléfono |
| `idiky` (arnés) | `main` | Bitácora + avisos |

### Qué NO tocó Justo (sigue tuyo o abierto)

- Redeploy Amoy / `hashIdentidad` (§1).
- T-87: cómo firma ALICE Polygon sin JWT Strapi (§2).
- Pantallas de quien entra a ALICE **solo** como Admin/Delegado (§8b).
- Jitsi: sala espera anfitrión, permisos de cámara/mic, webhook asistencia (§7).
- ~~Número WhatsApp dedicado de IDIKY (§8)~~ → **`Idiky_whatsapp`** (2026-11-21).
- Renovación automática del Bearer a los 30 días (`POST /api/app/sesion/renovar`).
- Cerrar sesiones de ALICE desde BLOKY (T-128).

### Cómo probar en 2 minutos

1. ALICE: celular + código WhatsApp → Asambleas → Prueba1 → Entrar.
2. Matar la app y abrirla: debe entrar **sin** pedir código (sesión segura).
3. Cuenta → Cerrar sesión → vuelve a pedir celular.
4. En reunión en el teléfono → en BLOKY web «Entrar» → diálogo **Trasladar aquí** (no abre a ciegas).

---

## Ramas de Justo (estado 2026-11-16)

| Repo | Rama | Qué hay |
|---|---|---|
| `SmartContrat-Idiky` | `feature/cuentas-quitar-login` | Renombre identidad + docs; sin merge aún (§1) |
| `BOB-Idiky` | `develop` @ `561d905` | T-129 servicio alta + script secreto — **en Dev** |
| `App-Idiky` | `develop` @ `85d89c7` | WhatsApp, Asambleas/Jitsi, RN-190, sesión, T-129 billeteras, T-90 avatar |
| `App-Idiky` | `feature/CU-R-01-alta-qr-passkey` | Alta QR + passkey; JWT Strapi temporal (T-87) |
| `Bloky-Idiky` | `develop` @ `180c909` | T-129 billeteras + T-90 apariencia — **en Dev** |
| `idiky` | `Justo_dev` → `main` | Docs del día (CU-R-34, RN-191, §10) |

Si algo de esta lista ya lo cerraste o desplegaste, actualiza la marca aquí y una línea en la
bitácora.
