# ADR-NNNN — La llave del teléfono para las cuentas Polygon es una passkey con verificación obligatoria

- **Estado:** Propuesta (número por asignar por el integrador)
- **Fecha:** 2026-10-15

## Contexto

El alta por QR de las cuentas Polygon (CU-R-01, instrucciones de BOB del 2026-10-15) pide que la
llave P-256 nazca en el teléfono y que su llave privada nunca salga de él: a BOB solo viajan la
clave pública (x, y) y la firma WebAuthn. ALICE está en Flutter (`App-Idiky`).

En Android e iOS la forma estándar de tener una llave P-256 que firme WebAuthn es una **passkey**
(Credential Manager y ASAuthorization). Las passkeys del gestor por defecto (Google Password Manager,
Llavero de iCloud) **se sincronizan cifradas de extremo a extremo** entre los dispositivos de la
cuenta. La llave privada no sale en claro ni la ve la app, pero tampoco vive solo en el chip seguro
de ese teléfono. El campo `tipoAutenticador: "dispositivo"` que pide BOB supone lo segundo.

## Decisión

ALICE crea una passkey ES256 con `userVerification: "required"` (huella, rostro o PIN del
teléfono en cada firma), RP ID fijo y configurable (`ALTA_QR_RP_ID`), y guarda el `credentialId`
en el almacenamiento seguro. `tipoAutenticador` se configura (`ALTA_QR_TIPO_AUTENTICADOR`, por
defecto `dispositivo`) hasta que BOB defina el valor para una passkey sincronizada.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| Passkey del sistema (paquete `passkeys`) | Estándar WebAuthn; la firma es la que BOB ya verifica; se recupera si se pierde el teléfono | Sincronizada: no es «solo el chip»; exige dominio asociado (`assetlinks.json`, `apple-app-site-association`) | **Elegida** |
| Llave en el Keystore/Secure Enclave, sin passkey | Nunca sale del chip; `dispositivo` sería exacto | No produce `clientDataJSON` ni `authenticatorData` WebAuthn: habría que fabricarlos y BOB los verifica exactos; si se pierde el teléfono se pierde la llave | Descartada por ahora |
| Llave de seguridad física (FIDO2) | Llave fuera de la nube | Hardware aparte para cada residente | Descartada |

## Consecuencias

- Para que el teléfono cree la passkey, el dominio del RP ID tiene que publicar
  `/.well-known/assetlinks.json` con la huella SHA-256 del certificado de la app, y
  `apple-app-site-association` con `webcredentials`.
- BOB tiene que aceptar en el `clientDataJSON` el origen `android:apk-key-hash:<hash>` de la app.
- **Pendiente en BOB:** un valor de `tipoAutenticador` para passkey sincronizada (por ejemplo
  `passkey`), que podría leerse de las banderas BE/BS del `authenticatorData`.
- Perder el teléfono no hace perder la cuenta mientras la cuenta de Google o Apple siga viva; a la vez,
  quien controle esa cuenta y el desbloqueo del teléfono controla la firma. Para montos altos conviene
  la doble firma que ya plantean los contratos (T-81).
