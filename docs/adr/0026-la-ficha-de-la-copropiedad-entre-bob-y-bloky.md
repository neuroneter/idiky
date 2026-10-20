# ADR-0026 — La ficha de la copropiedad: lo del contrato en BOB, lo de la copropiedad en BLOKY

- **Estado:** Aceptada (2026-10-20)
- **Fecha:** 2026-10-20
- **Decide:** Responsable de integración (Daniel)
- **Modifica a:** [docs/13 §5](../13-bob-copropiedades-y-contratos.md) (la ficha de la copropiedad en BOB)
- **Relacionados:** [ADR-0015](./0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md),
  [ADR-0017](./0017-ubicacion-y-plano-real-con-openstreetmap.md), [ADR-0019](./0019-archivos-de-las-copropiedades-en-r2.md),
  [ADR-0025](./0025-directorio-unico-y-mapa-de-ubicaciones.md), CU-B-03, CU-B-09, CU-B-11, T-107, T-110

## Contexto

La ficha de la copropiedad en BOB tenía datos que BLOKY también tiene, o que BLOKY construye mejor:

| En BOB | En BLOKY |
|---|---|
| Ubicación: país, DIVIPOLA, barrio, dirección, latitud y longitud | **CU-B-09:** la dirección, el punto en el mapa real, el vecindario y la demarcación |
| «Resumen de bienes»: cuántos hay de cada tipo, escrito a mano | **CU-B-03:** la estructura (torres, casas, oficinas, locales, parqueaderos, depósitos…) |
| Foto principal y más fotos | — |
| Escritura del reglamento | **CU-B-11:** los documentos de la copropiedad, guardados y transcritos |

Dos copias del mismo dato terminan diciendo cosas distintas. Daniel (2026-10-20): *«el resumen de bienes es
de BLOKY: es en esta herramienta donde definimos todos los bienes, la distribución y las zonas… Nombre,
NIT, dígito de verificación, tipo, uso, consejo de administración, estado, estrato y plan son datos con
los que se construye el contrato entre la copropiedad e IDIKY: son dominio de BOB, y BLOKY los puede ver
pero no modificar»*.

## Decisión

**Cada dato tiene un solo dueño** (RN-282), como las personas en ADR-0025:

| Dato | Dueño | El otro |
|---|---|---|
| Nombre, NIT y dígito, tipo, uso, negocio, consejo de administración, estado, estrato, plan y contrataciones | **BOB** | BLOKY lo **muestra** en el perfil, sin poder cambiarlo |
| **Domicilio del contrato:** país, DIVIPOLA, departamento, municipio y dirección de notificación | **BOB** | Es lo que piden el contrato y la factura electrónica. BLOKY lo ofrece como punto de partida al ubicar |
| **Certificado de existencia y representación legal** | **BOB** | Dice quién representa a la copropiedad ante IDIKY: es soporte del contrato |
| **Catálogo de tipos de bien** y cuáles **se cobran** | **BOB** | Es una regla comercial. BLOKY lo lee para contar las unidades que se cobran |
| La ubicación real (punto, barrio, vecindario, demarcación) | **BLOKY** | BOB la consulta por el middleware |
| Los bienes y las unidades | **BLOKY** | BOB consulta **cuántas hay de cada tipo y cuántas se cobran** (RN-283) |
| Las fotos | **BLOKY** (RN-284) | — |
| El reglamento y los demás documentos de la copropiedad | **BLOKY** (CU-B-11) | — |

1. **Salen de BOB:** el resumen de bienes (y su componente), las unidades facturables calculadas a mano, la
   foto principal, las fotos, la escritura del reglamento, y de la ubicación el barrio, el centro poblado, la
   latitud y la longitud. Los datos de BOB Dev eran de prueba: se pierden sin migrarlos (Daniel, 2026-10-20).
2. **Lo de BLOKY se llena después de aprovisionar** (T-107): primero se crea el cliente en BOB con lo del
   contrato, se aprovisiona, y lo demás lo llena la administración en BLOKY, o IDIKY desde BOB por el middleware.
3. **BOB ve lo de BLOKY en el panel «En BLOKY»** de la ficha: la ubicación y las unidades por tipo, con las
   que se cobran. **BLOKY ve lo de BOB en el perfil de la copropiedad**, de solo lectura, leído en BOB cada vez
   (no se copia).
4. **Las unidades se cuentan con la estructura de BLOKY** mientras no exista el registro de unidades
   (CU-B-06): apartamentos, casas, oficinas, locales, parqueaderos y depósitos, cada uno con el **código** de su
   tipo de bien en BOB. Cuando llegue CU-B-06, se cuentan las unidades registradas y nada cambia para BOB.

## Consecuencias

- La ficha de BOB queda corta y contractual; la vida de la copropiedad queda en un solo sitio.
- BOB necesita que BLOKY responda para mostrar la ubicación y las unidades. Si el middleware no responde,
  el panel lo dice; el contrato no se afecta.
- El tipo de bien gana un **código** fijo (`apartamento`, `casa`, `oficina`, `local`, `parqueadero`,
  `deposito`…) para que BLOKY y BOB hablen del mismo tipo aunque se le cambie el nombre.
- Strapi borra solas las columnas que se quitan: aquí se acepta porque los datos eran de prueba.

## Alternativas consideradas

| Opción | Veredicto |
|---|---|
| Dejar la ubicación completa en BOB y copiarla a BLOKY | Descartada: dos copias del mismo dato |
| Pasar también el domicilio a BLOKY | Descartada: el contrato y la factura lo necesitan antes de aprovisionar |
| Copiar en BLOKY los datos del contrato al aprovisionar | Descartada: se desactualizan; se leen en BOB cada vez |
