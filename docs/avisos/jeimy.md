# Avisos para Jeimy — temas pendientes

> **Para el agente de IA:** si quien abre la sesión es **Jeimy**, antes de cualquier tarea muéstrale
> los avisos **abiertos** de esta página, en palabras sencillas, y pregúntale si ya los habló con Daniel.
> Los avisos los abre y los cierra Daniel; cuando se resuelvan, se marcan ✅ con la fecha.

---

## 2. El correo de IDIKY (Amazon SES) — ⏳ verificar tu correo (2026-11-21)

El correo de IDIKY ya funciona: sale de **`IDIKY <no-responder@idiky.com>`** por Amazon SES
([ADR-0036](../adr/0036-correo-con-amazon-ses.md)). Todo lo que hay que saber está en
[`infra/correo-ses.md`](../../infra/correo-ses.md).

- **Para recibir correos de prueba**, Daniel agrega tu correo personal en Amazon y a ti te llega un correo de *Amazon Web
  Services* («Email Address Verification Request»; mira en Spam): **ábrelo y dale clic al enlace**. Sin eso, a tu correo
  no le llega nada de IDIKY mientras la cuenta esté en modo de prueba.
- **En tu demo** no se mandan correos reales (no hay backend): si una pantalla «envía un correo», se simula en el
  repositorio de datos y se muestra el correo oculto (`m•••@gmail.com`). Nunca pongas llaves de AWS en el código.

---

## 1. El entorno de desarrollo se mudó a AWS — ⏳ abierto (2026-11-03)

Desde el 2026-11-01 el entorno vive en **AWS Lightsail**
([ADR-0029](../adr/0029-entorno-de-desarrollo-en-aws-lightsail.md)). Para ti cambia:

- **La dirección de la contable publicada es otra.** Daniel te la pasa por un canal privado (no va en
  el repositorio). La clave del entorno es la misma. **En tu computador nada cambia**: la contable se
  sigue abriendo con doble clic.
- **Para desplegar ya no se toma la foto de LangFlow** (`verificar-vecino.sh`): el servidor es solo de
  IDIKY. Los pasos están en [`infra/guia-de-despliegue.md`](../../infra/guia-de-despliegue.md).
- **Tu llave de despliegue** hay que autorizarla en el servidor nuevo, si vas a desplegar.
