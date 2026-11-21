# ADR-0034 — Los roles los define BOB, una matriz de permisos para BLOKY y ALICE, y la impersonación con pase firmado

- **Estado:** Aceptada (definida; por construir)
- **Fecha:** 2026-11-21
- **Decide:** Daniel (responsable de integración)
- **Reemplaza:** [ADR-0022 §5](./0022-directorio-de-acceso-impersonacion-y-consumo.md) (la impersonación)
- **Amplía:** [ADR-0025](./0025-directorio-unico-y-mapa-de-ubicaciones.md) (el catálogo de roles del directorio),
  [ADR-0032](./0032-residentes-colaboradores-e-ingreso-de-alice.md) (quién entra a ALICE)
- **Relacionados:** [CU-B-18](../casos-de-uso/bloky.md#cu-b-18), [docs/13 §9](../13-bob-copropiedades-y-contratos.md),
  RN-161, RN-327, RN-333 a RN-342, T-134 a T-137

## Contexto

IDIKY tiene tres aplicaciones con usuarios:

- **BOB** (Strapi): solo el equipo de IDIKY, con los usuarios y roles que ya trae Strapi.
- **BLOKY**: la copropiedad. Hasta hoy solo entraban el Administrador y el Delegado (RN-161).
- **ALICE**: la app de propietarios, residentes y colaboradores (RN-327).

El mismo día se había escrito un CU-B-18 con **perfiles libres por copropiedad**. Daniel lo
corrigió (2026-11-21): *el Administrador o Delegado usará los perfiles o roles que desde BOB se
definan, para mantener estandarizado todo el desarrollo.* Además, «Colaborador» no puede ser un solo
rol: un vigilante no ve lo mismo que la secretaria. Y la impersonación del ADR-0022 (el empleado de
IDIKY entra a BLOKY con su documento y su código) se reemplaza por un **módulo de BOB** que lleva a
BLOKY o a ALICE **con un pase firmado**.

## Decisión

### 1. Los roles son fijos y los define BOB

- BOB tiene el **catálogo de roles**, **igual para todas las copropiedades**. Ninguna copropiedad
  crea roles propios.
- Los roles se agrupan en **categorías**: Administración (Administrador, Delegado), Consejo de
  administración (Presidente del consejo, Consejero), **Colaboradores** (Secretaría, Seguridad,
  Aseo, Mantenimiento, Contador, Revisor fiscal…) y Residentes (administrador de la unidad,
  residente, invitado). «Colaborador» es la categoría, no un rol.
- **Delegado y Presidente del consejo son roles distintos**: el Delegado lo asigna BOB; el Presidente
  sale de ser presidente del consejo en CU-B-08. Pueden ser la misma persona.

### 2. Una matriz rol × módulo, única, administrada en BOB y aplicada por el middleware

- Para cada rol y cada módulo de BLOKY y de ALICE, cuatro permisos: **Ver · Crear · Editar ·
  Eliminar**. **Eliminar es anular o retirar**: nada se borra (regla del proyecto).
- La matriz es **una sola** para todas las copropiedades.
- **Se edita en BOB, se guarda en el middleware** (por su entrada de administración, ADR-0025): BOB
  no guarda ni la matriz ni las asignaciones en la base de Strapi.
- **El middleware la aplica en cada petición** (403 si falta el permiso), no solo la app escondiendo
  menús: ALICE es una app instalada y su API se puede llamar directamente.
- **La ley manda sobre la matriz**: lo que fija la Ley 675 (quién vota, quórum, citación, poderes,
  quién entra a la asamblea) no se configura en la matriz y ningún permiso lo contradice.
- Toda petición de BLOKY o de ALICE pasa por el middleware, también cuando necesita algo de BOB.

### 3. La impersonación: un módulo de BOB y un pase firmado por el middleware

- Pueden impersonar los usuarios de Strapi con el **rol de soporte** de Strapi, en cualquier
  copropiedad (no hace falta un permiso por copropiedad).
- En BOB (también desde el celular): se busca la copropiedad, se elige la **unidad** (para ALICE) o
  la copropiedad (para BLOKY) y el **rol**, y un botón lleva a BLOKY o a ALICE.
- **BOB le pide el pase al middleware** por su entrada de administración, diciendo quién (el usuario
  de Strapi), a dónde, con qué rol y en qué aplicación. **El middleware lo firma**; BOB nunca tiene la
  llave. El pase sirve **una vez** y vence a los **dos minutos** si no se usa.
- Se mantienen todas las protecciones del ADR-0022: se entra **con el rol, no como la persona**
  («*Ana (soporte IDIKY) actuando como Administrador*»), **solo lectura por defecto** y un **motivo**
  para escribir, una **franja visible**, la sesión **vence a las dos horas**, se le **avisa al
  Administrador** de la copropiedad y todo queda en la **auditoría** con el usuario de Strapi en cada
  acción. Impersonar no da más de lo que da el rol en la matriz.

## Alternativas consideradas

| Opción | Veredicto |
|---|---|
| Perfiles libres por copropiedad (el CU-B-18 de la mañana) | Descartada por Daniel: rompe el estándar entre copropiedades |
| Un solo rol «Colaborador» | Descartada: el vigilante vería lo mismo que la secretaria |
| Impersonar entrando a BLOKY con el documento y el código del empleado (ADR-0022 §5) | Reemplazada: exige que cada empleado esté en el directorio y no sirve para ALICE desde el celular |
| BOB firma el pase con su propia llave | Descartada: BOB se volvería una puerta de entrada con llave propia; firma el middleware |
| Guardar la matriz en la base de Strapi | Descartada por ADR-0025: solo el middleware toca las bases |

## Consecuencias

- Se reescribe **CU-B-18** (asignar roles de BOB a personas) y se rehacen **RN-333 a RN-339**; se
  agregan **RN-340 a RN-342**. Se amplían **RN-161** y **RN-327**. Los cargos del equipo (RN-261)
  pasan a ser roles de la categoría Colaboradores.
- BOB gana dos pantallas (docs/13 §9): **Roles y permisos** e **Impersonar**.
- ALICE debe leer los permisos que le da el middleware y esconder lo que no tiene (Justo, T-137).
- **No resuelve el voto**: quién vota y cómo (RN-29, RN-51, T-127) sigue en el aviso a Mary.
