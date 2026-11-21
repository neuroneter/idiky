# ADR-0036 — El correo de IDIKY sale por Amazon SES, desde idiky.com

- **Estado:** Aceptada (dominio verificado; envío por construir en el middleware)
- **Fecha:** 2026-11-21
- **Decide:** Daniel (responsable de integración)
- **Relacionados:** RN-356 (el primer ingreso valida un correo), RN-357 (cambiar celular o correo con segundo factor),
  T-143, [ADR-0029](./0029-entorno-de-desarrollo-en-aws-lightsail.md) (el entorno ya está en AWS)

## Contexto

El primer ingreso a ALICE pide **validar un correo con un código** y cambiar el celular usa el correo como segundo factor
(RN-356, RN-357). El middleware no enviaba correos, y `idiky.com` (en Cloudflare) no tenía ningún sistema de correo.

## Decisión

1. **El correo sale por Amazon SES**, en la misma cuenta de AWS del entorno (región **us-east-1**), desde `idiky.com`.
2. **Verificado con Easy DKIM** (2026-11-21): 3 registros CNAME `…._domainkey.idiky.com` → `….dkim.amazonses.com`, **solo
   DNS** (sin proxy de Cloudflare), y **DMARC** `_dmarc.idiky.com` = `v=DMARC1; p=none;`. La identidad quedó **verificada**.
   Sin dominio MAIL FROM propio por ahora: la firma DKIM ya alinea con DMARC.
3. **El middleware envía por la API de SES** (`SendEmail` v2, HTTPS), con la firma AWS v4 que ya usa para el almacén
   (ADR-0019): **sin librería nueva**. Detrás de una interfaz, como el SMS: **sin llaves, simulado** (el mensaje queda en el
   registro); con llaves, real. Remitente por defecto `IDIKY <no-responder@idiky.com>`.
4. **Credenciales:** un usuario de IAM **solo con `ses:SendEmail` y `ses:SendRawEmail`**, sus llaves en los secretos del
   servidor (`bloky-api.env`), nunca en el repositorio. Las crea Daniel en la consola.
5. **Sandbox mientras se desarrolla:** SES arranca en *sandbox* (200 correos al día, 1 por segundo, **solo a direcciones
   verificadas**). Alcanza para probar con los correos del equipo, que se verifican en SES. **Antes de salir con personas
   reales** se pide a AWS el acceso de producción (uso: códigos de un solo uso, transaccional, poco volumen).
6. **No se recibe correo en idiky.com** (no hay MX): el remitente es `no-responder@`.

## Consecuencias

- Costo: unos 0,10 US$ por cada 1.000 correos.
- Va por HTTPS: no le afecta que Lightsail bloquee el puerto 25.
- Cuando haya buzón de IDIKY, se agrega MX y se sube DMARC a `p=quarantine` con reportes.
- El flujo de ALICE (pedir el correo, enviar y verificar el código, cambiar celular o correo) es T-143, con Justo.
