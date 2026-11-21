# El correo de IDIKY con Amazon SES (ADR-0036)

> Guía para personas y para la IA. Si vas a hacer que algo de IDIKY **mande un correo** (un código, un aviso, una
> invitación), o te toca **agregar a alguien para que reciba correos de prueba**, empieza aquí.

## 1. En corto

- Todo correo de IDIKY sale de **`IDIKY <no-responder@idiky.com>`** por **Amazon SES** (cuenta AWS de IDIKY, región
  **us-east-1 / N. Virginia**). `idiky.com` no tiene buzones: **nadie recibe en esa dirección**, solo se envía.
- **Solo el middleware de IDIKY envía correos** (repo `Bloky-Idiky`, `apps/bloky-api/src/correo/ses.ts`). BLOKY, ALICE,
  BOB y los demos **nunca** hablan con SES ni guardan llaves de AWS: le piden al middleware que envíe.
- La cuenta está en **modo de prueba (*sandbox*)**: **solo llegan correos a direcciones verificadas** (sección 4), hasta
  200 al día, uno por segundo. A una dirección sin verificar, SES responde
  `Email address is not verified` y el middleware devuelve `correo_rechazado`.
- **El primer correo real salió el 2026-11-21** y llegó a la bandeja de entrada (no a spam).

## 2. Estado (2026-11-21)

| Pieza | Estado |
|---|---|
| Identidad de dominio `idiky.com` en SES (us-east-1), con Easy DKIM | ✅ Verificada |
| DNS en Cloudflare: 3 CNAME `…._domainkey` (**solo DNS**, nube gris) y `_dmarc` TXT `v=DMARC1; p=none;` | ✅ Resolviendo |
| Usuario de IAM `idiky-correo-ses`, sin consola, política `enviar-correo-desde-idiky` (solo `ses:SendEmail` y `ses:SendRawEmail`, solo desde `*@idiky.com`) | ✅ |
| Llave del usuario guardada en el servidor (`bloky-api.env`) | ✅ BLOKY Dev envía de verdad (`real: true`) |
| Envío en el middleware y correo de prueba de administración | ✅ BLOKY Dev |
| Direcciones verificadas para pruebas | ✅ Daniel · ✅ Justo · ⏳ Mary · ⏳ Jeimy |
| Rutas para que las apps pidan un código al correo (ALICE, T-143) | ⏳ Por hacer, con Justo |
| Acceso de producción (enviar a cualquier correo) | ⏳ Antes de salir con personas reales (sección 6) |

## 3. Cómo funciona

```
ALICE / BLOKY ──(pide «mándale un código a este correo»)──▶ middleware de IDIKY ──HTTPS firmado──▶ Amazon SES ──▶ buzón
                                                              (único con la llave)                  (desde no-responder@idiky.com)
```

1. **El middleware** arma el correo y llama a la API v2 de SES (`POST https://email.us-east-1.amazonaws.com/v2/email/outbound-emails`),
   firmada con AWS v4 con la misma función que firma el almacén de archivos (`almacen/firma-s3.ts`, `servicio: 'ses'`).
   **No hay librería de AWS** (ADR-0036).
2. **Las llaves** viven solo en el servidor, en `~/.config/idiky/secretos/bloky-api.env`:

   | Variable | Para qué | Por defecto |
   |---|---|---|
   | `BLOKY_SES_ACCESO` | ID de la clave de acceso de `idiky-correo-ses` | — |
   | `BLOKY_SES_SECRETO` | Clave secreta | — |
   | `BLOKY_SES_REGION` | Región de SES | `us-east-1` |
   | `BLOKY_CORREO_REMITENTE` | Quién aparece como remitente | `IDIKY <no-responder@idiky.com>` |

3. **Sin llaves, el correo se simula:** no sale nada y el mensaje queda en el registro del middleware como
   `[simulado] correo a …`. Así funciona en el computador de cada quien y en las pruebas: nadie necesita llaves para
   programar.
4. **Por qué es seguro:** la llave solo puede *enviar*, y solo desde `@idiky.com`. Si se filtra, no sirve para leer ni
   cambiar nada de AWS, y se desactiva en IAM en un minuto. La llave existe solo porque Lightsail no admite roles de IAM:
   cuando IDIKY pase a EC2/ECS se cambia por un rol y se elimina.
5. **Firmas del dominio:** DKIM (los 3 CNAME) y DMARC hacen que Gmail, Outlook, etc. confíen en `idiky.com`. Si alguien
   borra esos registros en Cloudflare, los correos empiezan a caer en spam o a rebotar.

## 4. Agregar a alguien para que reciba correos de prueba (Mary, Jeimy, quien sea)

Mientras la cuenta esté en *sandbox*, cada correo que vaya a recibir mensajes de IDIKY se verifica **una vez**:

1. Quien tenga acceso a la consola de AWS (hoy, **Daniel**) entra a **Amazon SES → Identidades**, con la región
   **N. Virginia (us-east-1)** arriba a la derecha. *Cada región tiene su propia lista: en otra región no sirve.*
2. **Crear identidad** → marcar **Dirección de correo electrónico** (la de la derecha; **no** «Dominio», ese ya es
   `idiky.com`) → escribir el correo de la persona → dejar sin marcar «conjunto de configuración» e «inquilino» →
   **Crear identidad**, abajo a la derecha.
3. **La persona** recibe un correo de *Amazon Web Services* con el asunto **«Email Address Verification Request»**
   (puede caer en Spam o Promociones) y hace clic en el enlace. Eso solo lo puede hacer ella: llega a su bandeja.
4. En la lista, su correo pasa de **«Verificación pendiente»** a **«Verificado»**. Puede tardar un minuto. Si no le llegó,
   se entra a su correo en la lista y se usa **Reenviar**.
5. Listo: desde ese momento le llegan los correos de IDIKY.

> El correo que se verifica es el **personal** de la persona (Gmail, Outlook…). **No hay que crear correos
> `@idiky.com`**: esa dirección solo envía.

## 5. Mandar un correo desde el código

### En el middleware (repo `Bloky-Idiky`, `apps/bloky-api`)

- El enviador se crea **una vez** en `src/servidor.ts` (`const correo = cfg.ses ? crearEnviadorSes(cfg.ses) : crearCorreoSimulado(…)`)
  y se **pasa como dependencia** a las rutas que lo necesiten (hoy, `registrarRutasAdmin`). No crees otro enviador ni leas
  las variables de entorno en otra parte.
- Se usa así (tipo `EnviadorCorreo`, de `src/correo/ses.ts`):

  ```ts
  if (!correoValido(para)) return reply.code(422).send({ error: 'Escribe un correo válido.', codigo: 'invalido' })
  try {
    const r = await deps.correo.enviar({ para, asunto: 'Tu código de IDIKY', texto: `Tu código es ${codigo}. Vence en 10 minutos.` })
    // r.id: el MessageId de SES (o «simulado-N»). deps.correo.real dice si salió de verdad.
  } catch (e) {
    // (e as { codigo?: string }).codigo: 'correo_rechazado' (SES dijo 400: p. ej. destinatario sin verificar en sandbox)
    //                                    o 'correo_no_salio' (otro error o sin respuesta en 10 s).
  }
  ```

- `html` es opcional; **siempre** manda también `texto` (hay buzones que solo muestran texto).
- **Reglas:** nunca escribas en el registro el código de un solo uso de un correo real; no mandes el mismo correo en un
  ciclo (el *sandbox* permite uno por segundo); el asunto y el cuerpo en español y sin datos personales de más (como el
  documento completo).
- **Pruebas:** usa `crearEnviadorSimulado` o un `fetch` falso con `crearEnviadorSes(cfg, fetchFalso)`; las de humo no
  envían correos reales.

### En ALICE, BLOKY (la app) y cualquier otra app

- **No envían correos.** Le piden al middleware una acción («mándame un código al correo», «verifica este código») y él
  decide el texto y lo envía. Las rutas para el código al correo de ALICE (T-143, RN-356/RN-357) están **por hacer con
  Justo**: cuando existan, se documentan aquí.
- Nunca pongas llaves de AWS en una app ni en un repositorio.

### En los demos (`apps/pwa/` de Mary, `apps/contable/` de Jeimy)

- Los demos **no tienen backend** (fase 1): **no envían correos reales**. Si una pantalla del demo «manda un correo»,
  se simula en el repositorio de datos (`repositorio.ts` / `repositorio.js`): se muestra un aviso tipo «Te enviamos un
  código a m•••@gmail.com» y el código de prueba es fijo. No llames al middleware ni a SES desde un demo.
- Lo que sí sirve de esta guía para el demo: el **remitente** (`IDIKY <no-responder@idiky.com>`), que el correo se
  muestra **oculto** (las primeras letras y el dominio) y que el producto real enviará por el middleware.

## 6. Probar que el correo funciona

Desde el servidor (lo hace la IA o Daniel; el token de administración está en el mismo `bloky-api.env`):

```bash
ssh -i ~/.ssh/id_rsa.pem idiky@<ip> 'T=$(grep "^BLOKY_ADMIN_TOKEN=" ~/.config/idiky/secretos/bloky-api.env | cut -d= -f2-); curl -s -X POST http://127.0.0.1:8083/api/admin/correo/prueba -H "authorization: Bearer $T" -H "x-bloky-quien: <tu nombre>" -H "content-type: application/json" -d "{\"para\":\"<correo verificado>\"}"'
```

| Respuesta | Qué significa |
|---|---|
| `{"enviado":true,"real":true,"id":"…"}` | Salió por SES. Debe llegar «Correo de prueba de IDIKY». |
| `{"enviado":true,"real":false,…}` | Sin llaves: simulado (mira el registro del middleware). |
| `correo_rechazado` · `Email address is not verified` | El destinatario no está verificado (sección 4) o falta abrir el enlace. |
| `correo_rechazado` · otro mensaje | SES no aceptó el correo (remitente fuera de `@idiky.com`, cuenta suspendida…). |
| `correo_no_salio` | Error de red o de SES; reintentar y mirar el registro. |

## 7. Lo que falta y cómo se hace

1. **Acceso de producción** (antes de residentes reales): SES → *Panel de cuenta* → **Solicitar acceso de producción**.
   Tipo de correo: **transaccional**; sitio: `https://idiky.com`; uso: códigos de un solo uso para entrar a la app y
   cambiar celular o correo, poco volumen, sin listas de difusión; los rebotes y quejas se atienden (se deja de enviar a
   un correo que rebota). Amazon responde en uno o dos días. Después ya no hay que verificar a nadie.
2. **El código al correo en ALICE** (T-143): rutas en el middleware y pantallas en ALICE, **con Justo conectado**.
3. **Plantilla de secretos:** agregar `BLOKY_SES_ACCESO`, `BLOKY_SES_SECRETO`, `BLOKY_SES_REGION` y
   `BLOKY_CORREO_REMITENTE` (vacías) a `Bloky-Idiky/infra/bloky/secretos.sh`, para que un servidor nuevo las tenga.
4. **Al salir de Lightsail:** cambiar la llave por un rol de IAM y eliminar la llave.

## 8. Cambiar o revocar la llave

- **Cambiarla** (por rotación o si se filtró): IAM → Usuarios → `idiky-correo-ses` → *Credenciales de seguridad* →
  *Crear clave de acceso* (caso de uso *Aplicación que se ejecuta fuera de AWS*) → guardarla en el servidor con este
  comando, que la pide **sin mostrarla**, y volver a desplegar `bloky`:

  ```bash
  ssh -t -i ~/.ssh/id_rsa.pem idiky@<ip> 'read -r -p "ID de la clave: " A; read -rs -p "Clave secreta: " S; echo; f=~/.config/idiky/secretos/bloky-api.env; sed -i "/^BLOKY_SES_ACCESO=/d;/^BLOKY_SES_SECRETO=/d" "$f"; printf "BLOKY_SES_ACCESO=%s\nBLOKY_SES_SECRETO=%s\n" "$A" "$S" >> "$f"; echo listo'
  ```

  Luego, en IAM, **desactivar y eliminar** la llave vieja.
- **La IA nunca ve ni escribe la llave**: solo comprueba que esté (por su largo) y vuelve a desplegar.
