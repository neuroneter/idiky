# Avisos para Daniel — revisión del trabajo de Justo (cadena, contratos, ALICE)

> **Para el agente de IA:** si quien abre la sesión es **Daniel** y pregunta por el estado de la
> cadena, los contratos o ALICE, muéstrale primero esta página (ítems **abiertos** o **temporales**).
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

## 8. Evolution API / WhatsApp en Dev (T-131, T-132, ADR-0033) — 🟡 desplegado; middleware en curso

**Cómo entrar y mandar mensajes:** [`infra/guia-de-evolution.md`](../../infra/guia-de-evolution.md)
(Manager, API key en el servidor, `sendText`, y **§8** el endpoint del middleware).

**Hecho:** firewall 8086; pod `v2.3.7`; mensaje de prueba ok (instancia «Justo Soto»).

**T-132 (Justo, 2026-11-15):** OTP de ALICE por WhatsApp en `/api/app/acceso/*` (Evolution) +
`POST /api/app/whatsapp/enviar` para texto libre. Middleware en BLOKY Dev; ALICE en
`feature/T-106-preparar-reuniones-video` (también en `develop` de App-Idiky tras el merge de hoy).
Secretos `EVOLUTION_*` ya en el servidor.

**Sigue:** número **dedicado de IDIKY** + documentarlo; opcional túnel `evolution-dev.idiky.com`.

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
| `Bloky-Idiky` | `develop` @ `180c909` (T-90) · antes T-129 en `d187292` | Middleware Dev: billeteras + apariencia |
| `BOB-Idiky` | `develop` @ `561d905` | Rutas `/servicio/alta*` + script secreto; desplegado fuera de main (`IDIKY_GESTION_FUERA_DE_MAIN`) |
| `App-Idiky` | `develop` @ `85d89c7` (T-90 avatar; incluye T-129 billeteras) | Probar avatar y passkey en teléfono físico |
| `idiky` (arnés) | `main` | Bitácora, CU-R-34, RN-191, docs/20, este aviso, Mary §0 |

### Notas útiles

- **Passkey en emulador:** `NoCreateOptionException` casi siempre es PIN/cuenta Google/Play Services; `assetlinks.json` en `bob-dev.idiky.com` **sí** está bien. Tras crear billeteras en el teléfono, el mismo número en emulador **no** vuelve a pedir passkey.
- **Avatar:** no bloquea el ingreso; toque en la barra → editor. Mismo `persona.apariencia` que BLOKY.
- **Mary:** borrador CU-R-34 en su rango; aviso §0 en [`mary.md`](./mary.md).

### Qué NO cerró Justo (sigue abierto)

- A1 / T-87 (plugin en el middleware), RP ID → dominio del middleware, redeploy Amoy (§1).
- Probar avatar en teléfono y, si hace falta, pulir el dibujo.
- Número WhatsApp dedicado de IDIKY (T-132).

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
- Número WhatsApp dedicado de IDIKY (§8).
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
