# El correo de IDIKY con Amazon SES (ADR-0036)

Estado al 2026-11-21:

| Pieza | Estado |
|---|---|
| Identidad `idiky.com` en SES (us-east-1), Easy DKIM | ✅ **Verificada** |
| DNS en Cloudflare: 3 CNAME `…._domainkey` (solo DNS) y `_dmarc` TXT `v=DMARC1; p=none;` | ✅ Puestos y resolviendo |
| Usuario de IAM `idiky-correo-ses`, sin consola, con la política `enviar-correo-desde-idiky` (solo `ses:SendEmail` y `ses:SendRawEmail`, solo desde `*@idiky.com`) | ✅ Creado |
| Middleware: envío por la API de SES, simulado sin llaves; `POST /api/admin/correo/prueba` | ✅ En BLOKY Dev (`96d7221`) |
| Llaves del usuario en el servidor | ✅ 2026-11-21 (BLOKY Dev las usa: `real: true`) |
| Correos de prueba verificados (la cuenta está en *sandbox*) | ✅ el de Daniel (2026-11-21); cada persona más del equipo se verifica igual |
| Primer correo real por SES | ✅ 2026-11-21, de `no-responder@idiky.com` a Daniel |
| Acceso de producción (enviar a cualquier correo) | ⏳ antes de salir con personas reales |
| Acceso de producción de SES | ⏳ Antes de salir con personas reales (paso 4) |

## Lo que hace Daniel

1. **Crear la llave y guardarla en el servidor** (nadie más la ve):
   - Consola de AWS → IAM → Usuarios → `idiky-correo-ses` → *Credenciales de seguridad* → *Crear clave de acceso* →
     caso de uso *Aplicación que se ejecuta fuera de AWS*. Copia el **ID de la clave** y la **clave secreta** (se ve una vez).
   - En tu terminal (pide los dos valores sin mostrarlos y los deja en `bloky-api.env`):

     ```bash
     ssh -t -i ~/.ssh/id_rsa.pem idiky@<ip> 'read -r -p "ID de la clave: " A; read -rs -p "Clave secreta: " S; echo; f=~/.config/idiky/secretos/bloky-api.env; sed -i "/^BLOKY_SES_ACCESO=/d;/^BLOKY_SES_SECRETO=/d" "$f"; printf "BLOKY_SES_ACCESO=%s\nBLOKY_SES_SECRETO=%s\n" "$A" "$S" >> "$f"; echo listo'
     ```

   - Luego se vuelve a desplegar `bloky` (lo hace la IA o `infra/desplegar.sh`) para que el middleware las lea.
2. **Verificar los correos de prueba** (mientras SES esté en *sandbox* solo envía a direcciones verificadas): SES →
   Identidades → *Crear identidad* → *Dirección de correo electrónico* → el tuyo (y el de Justo). Llega un correo de AWS con
   un enlace: hay que abrirlo.
3. **Probar:** desde el servidor, `POST /api/admin/correo/prueba` con `{"para": "<tu correo verificado>"}` y la cabecera
   `x-bloky-quien` (lo hace la IA). Debe llegar «Correo de prueba de IDIKY» desde `no-responder@idiky.com`.
4. **Antes de salir con personas reales:** SES → *Panel de cuenta* → *Solicitar acceso de producción*. Uso: correo
   transaccional (códigos de un solo uso para entrar a la app y cambiar celular o correo), poco volumen, sin listas de
   difusión; se gestionan rebotes y quejas.
