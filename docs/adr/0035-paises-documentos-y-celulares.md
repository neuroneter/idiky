# ADR-0035 — Varios países: tipos de documento y celulares por país, definidos en BOB

- **Estado:** Aceptada (definida; por construir)
- **Fecha:** 2026-11-21
- **Decide:** Daniel (responsable de integración)
- **Amplía:** [ADR-0025](./0025-directorio-unico-y-mapa-de-ubicaciones.md) (el directorio único),
  RN-298 (la identidad en la cadena), RN-353 a RN-357 (una persona, un documento, un celular)
- **Relacionados:** RN-358 a RN-363, T-144 a T-146, [aviso a Justo §10](../avisos/justo.md)

## Contexto

IDIKY se piensa para **muchos países** (Daniel, 2026-11-21). Hasta hoy todo asumía Colombia:

- Los **tipos de documento** (CC, CE, PA, PPT, TI) estaban fijos en el código de BLOKY, del middleware y de BOB.
- La **validación** del número era una sola para todos (3 a 20 letras o números).
- El **celular** también: 10 dígitos que empiezan por 3 se volvían `+57`.
- La **identidad** de la persona era «tipo + número», sin país: un documento de otro país con el mismo número chocaría.

La copropiedad **ya tiene país** en BOB (su domicilio).

## Decisión

1. **BOB define los países y sus tipos de documento** (se editan ahí, sin desplegar):
   - **País:** código ISO (`CO`, `MX`, `ES`…), nombre, **indicativo** (`+57`) y la **regla del celular** (longitud del número
     nacional, mínima y máxima, y con qué puede empezar), un ejemplo y si está activo.
   - **Tipo de documento, por país:** código, nombre, la **regla de validación** (solo números o letras y números,
     longitud mínima y máxima y, si hace falta, un patrón), un ejemplo para mostrar, el orden y si está activo.
2. **El middleware lee ese catálogo de BOB**, lo guarda unos minutos y **valida con él** en todos los caminos (Unidades,
   CSV, «Dar acceso», ALICE, BOB): lo que no cumple la regla del tipo se rechaza con un mensaje claro que la dice. Si BOB no
   responde, usa el último catálogo que tenía (y, la primera vez, el de Colombia que trae el código).
3. **Por defecto, el país de la copropiedad** (Daniel: *el 99 % de las personas serán del mismo país de la propiedad*): en
   BLOKY y ALICE el formulario ya viene con el país de la copropiedad para el **documento** y para el **celular**, y solo se
   muestra «Otro país» para los pocos casos que lo necesitan.
4. **El país del documento y el del celular son independientes**: un extranjero puede vivir en Colombia con un celular de
   su país y su pasaporte.
5. **El pasaporte siempre está disponible**, con su **país emisor**, además de los tipos del país de la copropiedad.
6. **La identidad incluye el país del documento**: una persona es única por **país + tipo + número**, y el celular se guarda
   siempre completo con su indicativo (`+57…`, `+52…`). Las personas de hoy quedan con país `CO`.
7. **El hash de identidad de la cadena (RN-298) no cambia para las personas de Colombia** («TIPO:NUMERO», como hoy), para no
   dejar a nadie sin sus billeteras; para los demás países es «PAÍS:TIPO:NUMERO». Esto se confirma con Justo antes de
   construir (aviso §10).

## Consecuencias

- BOB (`BOB-Idiky`) tiene dos colecciones nuevas, con permiso de IDIKY, y la copropiedad toma su país de su domicilio.
- El middleware deja de tener los tipos fijos: `TIPOS_DOCUMENTO` y `celularParaCodigo` pasan a recibir el catálogo y el
  país; el directorio guarda `pais_documento` y la unicidad pasa a (país, tipo, número).
- BLOKY y ALICE piden el catálogo de la copropiedad (`GET /api/c/:id/catalogo-identidad`, y su par en `/api/app/…`) y
  arman los formularios con él.
- Mientras esto no exista, sigue funcionando lo de hoy con los tipos de Colombia.
