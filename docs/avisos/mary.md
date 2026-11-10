# Avisos para Mary — temas pendientes

> **Para el agente de IA:** si quien abre la sesión es **Mary**, antes de cualquier tarea muéstrale los
> avisos **abiertos** de esta página, en palabras sencillas, y pregúntale si ya los habló con Daniel.
> Mientras un aviso esté abierto, **no construyas nada que lo contradiga**. Los avisos los abre y los
> cierra Daniel; cuando se resuelvan, se marcan ✅ con la fecha.

---

## 1. El entorno de desarrollo se mudó a AWS — ⏳ abierto (2026-11-03)

Desde el 2026-11-01 el entorno vive en **AWS Lightsail**
([ADR-0029](../adr/0029-entorno-de-desarrollo-en-aws-lightsail.md)). Para ti cambia:

- **La dirección de la PWA es otra.** Daniel te la pasa por un canal privado (no va en el repositorio).
  La clave del entorno es la misma.
- **Para desplegar ya no se toma la foto de LangFlow** (`verificar-vecino.sh`): el servidor es solo de
  IDIKY. Los pasos están en [`infra/guia-de-despliegue.md`](../../infra/guia-de-despliegue.md).
- **Tu llave de despliegue** hay que autorizarla en el servidor nuevo, si vas a desplegar.

**Mary, 2026-11-10:** *«de acuerdo»*. Queda pendiente que Daniel le pase la dirección nueva de la PWA por un canal privado. (El aviso lo cierra Daniel.)

## 2. Reuniones con video: dos reglas tuyas por confirmar — ⏳ abierto (2026-11-03)

Daniel definió quién entra a una reunión y cómo se conduce
([ADR-0030](../adr/0030-autorizacion-de-las-reuniones-con-video.md), RN-302 a RN-316). Dos reglas tocan
las de asamblea que tú definiste (RN-212 a RN-220), y **necesitan tu confirmación**:

- **RN-309, el plazo de los poderes:** la administración define hasta cuándo se puede otorgar y revocar
  un poder antes de la reunión, y nunca dentro de su ventana; si no se revocó antes, queda.

  **Mary, 2026-11-10:** de acuerdo con la fecha límite: *«para cada reunión hay una fecha límite
  para la entrega de poderes»*. Y pide algo más: *«si hay un propietario el cual tiene apoderado,
  debe quedar parametrizado en su perfil para evitar cada asamblea solicitar el poder»*. Esto
  **cambia RN-31** (hoy cada asamblea tiene sus propios poderes) y está por definir con Daniel: ver
  la propuesta del apoderado permanente en `docs/09-estado-del-proyecto.md` (2026-11-10).
- **RN-316, el secretario conduce las votaciones:** las abre con un tiempo máximo y puede extenderlo si
  no hay quórum, sin superar ese tiempo; puede corregir la redacción antes de abrirlas y luego quedan
  bloqueadas, con historia para el acta. En una extraordinaria, solo lo del orden del día; en una
  ordinaria, el punto de proposiciones puede terminar en votación.

**Además:** las asambleas y votaciones que construiste en la maqueta todavía **no están en BLOKY**, y
las reuniones con video las necesitan
([plan de CU-B-15](../casos-de-uso/bloky.md#plan-de-construcción-2026-11-03)). Conviene hablar con Daniel
del orden en que se pasan.

## 3. Residentes: quién crea a quién, y quién vota — ⏳ abierto (2026-11-05)

Daniel decidió cómo se crean los residentes en BLOKY y ALICE
([ADR-0032](../adr/0032-residentes-colaboradores-e-ingreso-de-alice.md)):

- La Administración crea **un residente por unidad**, con unidad y celular: el **administrador de la unidad** (RN-320). Él
  agrega a los demás de su unidad: residentes (administradores o no), **mascotas** (perfil sin usuario) e **invitados** con
  fecha de inicio y de fin (RN-321). Es la misma idea de tu **RN-63**, con estos nombres; si tu demo la muestra, conviene
  alinearla.
- **Para decidir contigo (T-127):** el rol de la unidad no dice si alguien es **propietario o arrendatario**, y eso importa
  para votar en asambleas (RN-51, RN-304). ¿Se pregunta al crear al residente, o lo marca después la Administración?

  **Mary, 2026-11-10:** *«la persona que crea BLOKY es el propietario»*. El residente que crea la
  Administración en BLOKY (el administrador de la unidad, RN-320) **es el propietario**, como en su
  RN-63, y **puede ser residente o no** (Mary, 2026-11-10: *«y este propietario puede ser residente o no»*;
  su condición residente / no residente, RN-68). Los arrendatarios y demás los agrega después el
  propietario desde ALICE (RN-321). Queda por
  definir con Daniel cómo se marca, en BLOKY, a un arrendatario que agrega el propietario, para que no
  vote (RN-51).

