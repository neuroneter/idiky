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

## 7. Jitsi / pases JWT (T-106) — ⏳ abierto

Los pases y el cierre de sala van en el **middleware**, no en BOB ([`avisos/justo.md`](./justo.md)
§3). Justo no crea endpoints de JWT en BOB.

---

## Ramas locales de Justo (sin subir / sin merge, estado al 2026-10-23)

| Repo | Rama | Qué hay |
|---|---|---|
| `SmartContrat-Idiky` | `feature/cuentas-quitar-login` | Renombre identidad + docs; quitar `contracts/login/` (trabajo local mezclado) |
| `BOB-Idiky` | `feature/T-81-plugin-cuentas` | ABI nuevas + well-known local; el plugin en `develop`/`main` ya usa directorio |
| `App-Idiky` | `feature/CU-R-01-alta-qr-passkey` | Alta QR + passkey contra bob-dev; JWT Strapi temporal |
| `idiky` | `Justo_dev` | Bitácora y este aviso; puede ir por delante de `origin/Justo_dev` |

Si algo de esta lista ya lo cerraste o desplegaste, actualiza la marca aquí y una línea en la
bitácora.
