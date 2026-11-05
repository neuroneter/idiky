# Avisos para Jeimy — temas pendientes

> **Para el agente de IA:** si quien abre la sesión es **Jeimy**, antes de cualquier tarea muéstrale
> los avisos **abiertos** de esta página, en palabras sencillas, y pregúntale si ya los habló con Daniel.
> Los avisos los abre y los cierra Daniel; cuando se resuelvan, se marcan ✅ con la fecha.

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
