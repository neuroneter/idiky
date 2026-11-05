# 19 — Diagnóstico: ALICE ante el middleware y las firmas Polygon (T-87)

> **Para quién:** Justo y Daniel, para cerrar [T-87](./11-tablero-de-trabajo.md) sin inventar otro
> login ni otro camino a la cadena.
> **Estado:** diagnóstico para discutir (2026-11-05). **No es un ADR:** no decide; ordena hechos,
> opciones y lo que la firma del teléfono exige.
> **Relacionado:** [ADR-0025](./adr/0025-directorio-unico-y-mapa-de-ubicaciones.md) ·
> [aviso Justo §2](./avisos/justo.md) · [aviso Daniel §2](./avisos/daniel.md) ·
> [CU-B-01](./casos-de-uso/bloky.md#cu-b-01) · [CU-R-01](./casos-de-uso/residente.md#cu-r-01) ·
> [docs/18](./18-reuniones-con-video.md) §5.2 · RN-298 · RN-299 · plugin `cuentas-polygon` (BOB) ·
> [`SmartContrat-Idiky`](https://github.com/neuroneter/SmartContrat-Idiky) (`contracts/cuentas/`).

---

## 1. Qué problema resolvemos

Hay que responder, juntos, a esto:

1. **Cómo se identifica ALICE (el teléfono) ante IDIKY** cuando ya no existen usuarios finales en
   BOB (Strapi users-permissions).
2. **Cómo pasan las transacciones Polygon** (alta de billeteras y movimientos) si la **passkey
   firma en el teléfono** y la llave privada **nunca** sale de él.
3. **Si ese camino puede (y debe) pasar primero por el middleware de IDIKY**, que es el único punto
   de acceso a la capa de datos (ADR-0025).

Hoy conviven un diseño natural (sesión en el middleware) y un atajo de laboratorio (JWT de Strapi
en `ALTA_QR_JWT`). T-87 cierra esa brecha.

---

## 2. Dos identidades distintas (no mezclarlas)

| | Identidad de la **persona** | Credencial de **cadena** (passkey) |
|---|---|---|
| **Para qué** | Abrir sesión en IDIKY: ver unidades, pedir pase de reunión, consultar datos | Autorizar UserOps / alta de billeteras en Polygon |
| **Qué es** | Tras documento + código SMS (mismo patrón que BLOKY) | Par P-256 WebAuthn; privada en el teléfono |
| **Dónde vive** | Cookie/token de sesión en el middleware (`bloky_sesion` hoy) | Chip / gestor de passkeys; pública (x, y) solo viaja al firmar el alta |
| **Quién la comprueba** | Middleware (Twilio Verify / OIDC) | Quien atiende `…/firma` (hoy BOB; a decidir) + contratos on-chain |
| **¿Se sustituyen?** | No. Tener passkey **no** reemplaza el login SMS | Tener sesión **no** firma la UserOp |

Sin la primera, ALICE no puede llamar rutas protegidas del middleware. Sin la segunda, no hay
movimientos en Polygon aunque la sesión esté abierta.

---

## 3. Hechos de hoy (inventario)

### 3.1 Ingreso (persona) — middleware, listo para la web

Patrón de BLOKY (**CU-B-01**), que ALICE va a clonar en Flutter:

1. `POST /api/acceso/identificar` — `{ tipoDocumento, numeroDocumento }`
2. `POST /api/acceso/enviar-codigo` — SMS al **celular registrado** en el directorio (Twilio Verify)
3. `POST /api/acceso/verificar-codigo` — abre sesión; hoy solo **`Set-Cookie: bloky_sesion=…`**

- La persona se busca por **documento**, no por el número que digite el usuario.
- El celular confirma canal; no es la clave de búsqueda.
- Solo entran roles raíz (**Administrador / Delegado**) vía `copropiedadesAccesibles`. Propietario /
  residente reciben `sin_acceso` hasta abrir ALICE.
- Flutter: la cookie `Secure` funciona por `https://bloky-dev.idiky.com`; **no hay Bearer** todavía
  ([docs/18](./18-reuniones-con-video.md) §5.2).

### 3.2 Directorio y cadena off-chain — middleware

- Personas y billeteras (`billeteraTransaccional`, `billeteraFinanciera`) viven en el **directorio**.
- `hashIdentidad` (RN-298) = HMAC del documento; **solo el middleware** lo calcula (clave
  `BLOKY_CLAVE_IDENTIDAD_CADENA`). El teléfono **no** puede ni debe calcularlo.
- BOB lee/escribe el directorio con `BLOKY_URL` + `BLOKY_ADMIN_TOKEN` (entrada de administración).

### 3.3 Operaciones Polygon — plugin en BOB (temporal de identidad)

Prefijo `/api/cuentas-polygon` (sesión **users-permissions** de Strapi):

| Ruta | Quién | Qué |
|---|---|---|
| `GET /cuentas?tipoDocumento=&numeroDocumento=` | App | Lee billeteras vía directorio |
| `POST /operaciones` / `…/qr` | BOB / lab | Abre operación + `challenge` |
| `GET /operaciones/:id` | App | Resumen + reto a firmar |
| `POST /operaciones/:id/firma` | App | Verifica WebAuthn; alta o envía UserOp |

- **Alta:** el teléfono manda `telefonoX`/`telefonoY` + firma WebAuthn del reto
  `idiky.alta.v2:<op>:<hashIdentidad>`. BOB verifica, llama fábricas, guarda billeteras en el
  directorio.
- **Movimiento día a día:** solo firma del teléfono sobre el `userOpHash`.
- **Movimiento financiero:** firma del teléfono **+** firma de Idiky (`PK_MOVIMIENTO` / KMS a futuro).
- **Gas:** lo paga el paymaster de Idiky; el residente no manda ETH.
- **Temporal ALICE:** `ALTA_QR_JWT` (JWT de un usuario de Strapi de laboratorio). **No es producto.**

### 3.4 Contratos (`SmartContrat-Idiky`)

- Dos cuentas ERC-4337 por persona (día a día / financiera = RN-299).
- Challenge on-chain del movimiento = `userOpHash` (32 bytes); la passkey firma WebAuthn.
- Redeploy Amoy pendiente tras renombre `hashIdentidad` (aviso Daniel §1).

---

## 4. La firma del teléfono: qué puede y qué no puede hacer el middleware

### 4.1 Lo que **nunca** pasa por el servidor

```
Passkey (privada P-256)  ──permanece──▶  teléfono
```

Ni el middleware ni BOB reciben la privada. Solo viajan:

- pública (x, y) en el **alta**;
- material WebAuthn (`authenticatorData`, `clientDataJSON`, `r`, `s`, índices) en cada **firma**.

### 4.2 Flujo de un movimiento (con middleware delante)

```
ALICE                    middleware de IDIKY              (opcional) BOB / servicio cadena         Polygon
  │                              │                                    │                              │
  │ 1. Sesión (doc + SMS)        │                                    │                              │
  │─────────────────────────────▶│                                    │                              │
  │                              │                                    │                              │
  │ 2. «Quiero transferir / votar…»                                   │                              │
  │─────────────────────────────▶│ 3. Arma UserOp + challenge         │                              │
  │                              │    (y firma Idiky si es financiera)│                              │
  │                              │───────────────────────────────────▶│ (si el plugin sigue en BOB)  │
  │ 4. challenge / userOpHash    │◀───────────────────────────────────│                              │
  │◀─────────────────────────────│                                    │                              │
  │                              │                                    │                              │
  │ 5. Passkey firma en el teléfono (huella / PIN)                    │                              │
  │                              │                                    │                              │
  │ 6. POST …/firma  (solo la firma, sin privada)                     │                              │
  │─────────────────────────────▶│ 7. Verifica WebAuthn               │                              │
  │                              │    Empaqueta signature ERC-4337    │                              │
  │                              │───────────────────────────────────▶│ 8. EntryPoint.handleOps ─────▶│
  │ 9. tx / estado               │◀───────────────────────────────────│◀─────────────────────────────│
  │◀─────────────────────────────│                                    │                              │
```

**Sí: todo el HTTP de la app puede pasar primero por el middleware.** La firma criptográfica ocurre
en el teléfono entre el paso 4 y el 6; el middleware solo **transporta y verifica** el resultado, y
(o un servicio detrás) **envía** la UserOp.

### 4.3 Qué aporta el middleware en ese camino

| Responsabilidad | ¿Middleware? | Motivo |
|---|---|---|
| Sesión de la persona (doc + SMS) | **Sí, ya** | CU-B-01; único login de producto |
| Resolver persona → `hashIdentidad` | **Sí, solo él** | RN-298 |
| Decidir si esa persona puede operar (rol, unidad, mora…) | **Sí** | Reglas de negocio off-chain |
| Pedir / devolver el `challenge` | **Sí** (directo o proxy) | ALICE no habla con Strapi |
| Verificar firma WebAuthn | Sí o el servicio de cadena detrás | Hoy está en el plugin BOB |
| Firmar mitad Idiky (cuenta financiera) | Servicio con KMS; **no** en el APK | `llaveMovimiento` |
| Enviar UserOp al EntryPoint | Servicio con RPC + paymaster | Llaves de operador |
| Custodiar la passkey | **No** | Solo el teléfono |

---

## 5. Opciones para cerrar T-87

### A. Sesión en el middleware + ALICE solo habla con el middleware (recomendación de diseño)

1. Login Flutter = mismo patrón que la web (documento → SMS → sesión).
2. Ampliar sesión para Flutter: devolver **token Bearer** (o aceptar cookie **y** `Authorization`).
3. Abrir acceso a roles de ALICE (propietario, arrendatario, residente…), no solo Admin/Delegado.
4. Rutas de cuentas/operaciones expuestas en el middleware; por detrás:
   - **A1.** El plugin se **muda** al middleware, o
   - **A2.** El middleware **proxy** a BOB con credencial de servicio (como Personas del cliente); ALICE nunca ve BOB.

| A favor | En contra |
|---|---|
| Cumple ADR-0025 | Hay que implementar Bearer + roles ALICE |
| Un solo host para la app (`bloky-dev`) | A1 = mudanza; A2 = BOB sigue siendo dependencia interna |
| La firma del teléfono encaja sin cambiar el modelo criptográfico | Cerrar permisos del plugin (ya no users-permissions para la app) |

### B. Sesión middleware + app sigue llamando BOB con otro token

Tras el SMS, el middleware emite un token que BOB acepta (JWT firmado por IDIKY, no usuario Strapi).

| A favor | En contra |
|---|---|
| Menos mudanza del plugin | ALICE conoce dos bases URL (middleware y BOB) — choca con «un solo punto de acceso» |
| | Hay que enseñar a Strapi a confiar ese JWT |

### C. API key de la app + sesión de persona

Además de la sesión, un secreto embebido (`ALICE_CLIENT_ID`).

| A favor | En contra |
|---|---|
| Auditar «vino de ALICE» | El secreto en el APK se extrae; **no** autentica persona ni firma cadena |
| | Complemento opcional de A, no solución de T-87 |

### D. Seguir con `ALTA_QR_JWT` (Strapi)

| A favor | En contra |
|---|---|
| Ya prueba el alta en Dev | **Descartada como producto** (avisos §2). BOB no tendrá usuarios finales |

### E. Passkey como único login (sin SMS)

| A favor | En contra |
|---|---|
| Un factor menos | No hay passkey antes del alta; el alta necesita persona en directorio |
| | Mezcla las dos identidades de §2; no es el patrón web acordado |

**Fuera de discusión de producto:** la app no calcula `hashIdentidad`; no guarda llaves de Idiky;
no habla RPC de Polygon directamente en la v1 (el servidor arma y envía la UserOp).

---

## 6. Propuesta para la conversación (Justo → Daniel)

Sin decidir por Daniel, esto es lo que el diagnóstico sugiere alinear:

1. **Login ALICE = CU-B-01 en Flutter** (documento → Twilio → sesión), no login por celular suelto.
2. **T-87 identidad app = sesión de persona en el middleware** (opción **A**), con Bearer para móvil.
3. **Polygon:** el teléfono solo firma challenges; **todo el HTTP pasa por el middleware** (A1 o A2).
4. **`ALTA_QR_JWT`:** se apaga cuando A esté en Dev; hasta entonces solo laboratorio.
5. **Roles:** definir qué asignaciones del directorio abren ALICE (y con qué unidad activa, CU-R-01).

### Preguntas concretas para Daniel

1. ¿Plugin `cuentas-polygon` **se muda** al middleware (A1) o el middleware **proxy** a BOB (A2)?
2. ¿Bearer en `verificar-codigo` además de la cookie, o solo cookie con jar en Flutter?
3. ¿Qué roles del directorio entran a ALICE en la primera entrega?
4. ¿El RP ID de la passkey sigue siendo `bob-dev.idiky.com` o pasa a un dominio del middleware /
   ALICE (`assetlinks` / AASA)?
5. ¿Movimientos financieros en Dev siguen con `PK_MOVIMIENTO` en env, o ya hay fecha de KMS?

### Mientras tanto (Justo)

- No inventar otro mecanismo de sesión ([docs/18](./18-reuniones-con-video.md) §5.2).
- Se puede **prototipar** el UI de ingreso (documento → continuar → código) contra los endpoints
  actuales con una persona que ya entre a BLOKY (Admin/Delegado / suplente de prueba).
- No ampliar el uso de `ALTA_QR_JWT` más allá del laboratorio del alta.
- Reuniones (`/entrar`) y cadena comparten el mismo requisito de sesión: al cerrar T-87 se
  desbloquean los dos.

---

## 7. Criterio de «T-87 cerrado»

| Hecho | Evidencia |
|---|---|
| ALICE obtiene sesión sin usuario Strapi | Login doc + SMS → token/cookie del middleware |
| ALICE no llama a BOB en el camino feliz | Todas las URLs base = middleware |
| Alta Polygon con passkey vía ese camino | QR → challenge → firma en teléfono → billeteras en directorio |
| Un movimiento de prueba (día a día) | UserOp confirmada en Amoy con firma del teléfono |
| Documentado | Este doc actualizado a «decidido» + ADR si cambia arquitectura del plugin |

---

## 8. Referencias rápidas de código

| Pieza | Dónde |
|---|---|
| Ingreso middleware | `Bloky-Idiky/apps/bloky-api/src/acceso/` |
| Sesión cookie JWT | `…/acceso/sesion.ts` (`bloky_sesion`) |
| Directorio + billeteras | `…/directorio/` · RN-298/299 |
| Plugin operaciones / firma | `BOB-Idiky/apps/gestion/src/plugins/cuentas-polygon/` |
| Contratos cuentas | `SmartContrat-Idiky/contracts/cuentas/` |
| Guía reuniones + sesión Flutter | [`18-reuniones-con-video.md`](./18-reuniones-con-video.md) §5.2 |
| Passkey sincronizada (propuesta) | [`adr/propuesta-passkey-sincronizada-alta-qr.md`](./adr/propuesta-passkey-sincronizada-alta-qr.md) |
