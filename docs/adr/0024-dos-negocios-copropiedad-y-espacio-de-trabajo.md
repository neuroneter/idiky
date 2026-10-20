# ADR-0024 — Dos negocios en BLOKY: la copropiedad y el espacio de trabajo

- **Estado:** Aceptada (2026-10-11). **Nota del 2026-10-20 (T-112, RN-285):** en BOB ya no hay un campo «negocio»
  aparte: lo dice el **tipo** de la copropiedad (conjunto o edificio = copropiedad; **oficina** = espacio de trabajo).
  BLOKY sigue guardando el negocio en su catálogo
- **Fecha:** 2026-10-11
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** [ADR-0013](./0013-bloky-dev-separada-del-demo.md), [ADR-0015](./0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md),
  [ADR-0022](./0022-directorio-de-acceso-impersonacion-y-consumo.md), CU-B-02, CU-B-03, CU-B-12, RN-252 a RN-257

## Contexto

El catálogo de «Arma tu copropiedad» tenía «Oficina» y «Locales» como estructuras, igual que la
torre y la manzana. Al revisar con Daniel cómo se arma una oficina (con Spot,
`spotvirtual.com`, como referencia) salieron **dos cosas distintas con el mismo nombre**:

1. En una **copropiedad** (Ley 675), una oficina o un local es una **unidad privada**: tiene dueño
   y coeficiente, y vive en una torre (en sus pisos de oficinas o de locales) o en un edificio o
   bloque propio dentro del conjunto. A la administración no le importa cómo está amoblada por
   dentro.
2. Una **oficina como negocio**: una empresa o un coworking que administra **un espacio de trabajo
   completo** por reservas: sus pisos, sus salas, sus puestos, quién los reserva y cuándo. Ahí lo
   que importa es justo el interior, como en Spot.

Daniel (2026-10-11): *Torre y Manzana son para conjuntos residenciales; Oficinas y Locales son otro
tipo de componentes… es una sola aplicación que tiene que entender las dos estructuras de negocio.*

## Decisión

**1. Cada cliente de BLOKY tiene un negocio: `copropiedad` o `espacio_trabajo`** (RN-252). Viene
de BOB, como el nombre: la ficha del cliente en BOB lleva el campo `negocio` (por defecto
`copropiedad`); BLOKY lo copia a su catálogo al aprovisionar y lo vuelve a leer si se aprovisiona
de nuevo. **Los dos negocios no se mezclan** en un mismo cliente: el negocio decide el menú, los
primeros pasos y qué se arma. Por ahora la ficha de BOB se sigue llamando «Copropiedad» para los
dos (renombrarla a «Cliente» es un cambio de BOB que se hará aparte); las rutas siguen siendo
`/c/<id>`.

**2. En una copropiedad, «oficina» y «local» son tipos de unidad, no estructuras** (RN-253). Las
estructuras que las contienen fuera de una torre se llaman **«Edificio de oficinas»** y **«Bloque
comercial»**. Por dentro se siguen guardando como `oficina` y `local` (no se migra nada): cambia el
nombre que ve la persona y la regla que los define.

**3. Un espacio de trabajo se arma en su planta, no en un terreno** (CU-B-12, RN-254 a RN-257).
Se toma de Spot lo que sirve para administrar:

| Spot | BLOKY |
|---|---|
| Plantillas de oficina por tamaño | Plantillas de piso: abierto, oficinas con pasillo, coworking, vacío |
| El plano visto desde arriba | La planta de cada piso, en metros y con cuadrícula |
| Salas con nombre, dibujando sus muros | **Recintos** rectangulares con tipo y nombre que se mueven y se ajustan arrastrando sus esquinas |
| Muebles | Solo los **puestos de trabajo**, porque son lo que se reserva |
| — | El área de cada recinto, la capacidad y si se puede reservar |

Muros libres (en ángulo), muebles decorativos, 3D y avatares quedan fuera: no ayudan a
administrar.

**4. Lo que se administra en un espacio de trabajo son las reservas** de puestos, salas y
oficinas privadas, por quién y cuándo. Ese módulo (CU-B-13) viene después de la planta, que es lo
que se reserva.

## Consecuencias

- BOB necesita el campo `negocio` en la ficha (repo `BOB-Idiky`). Hasta que se despliegue, todo
  cliente es `copropiedad` y nada cambia.
- BLOKY: una migración del esquema común (`negocio` en `bloky.copropiedad`), una del esquema de
  cada cliente (`planta`), las rutas `GET/PUT /api/c/:id/planta`, y la consola con dos menús.
- Las reglas de la planta viven en `apps/bloky-api/src/dominio/reglas.ts`, como todas las de BLOKY.
- El texto «copropiedad» de la consola se mantiene en las pantallas comunes; las del espacio de
  trabajo dicen «espacio de trabajo».
