# ADR-0027 — El arte del mundo de BLOKY: el Furniture Kit de Kenney (CC0)

- **Estado:** Aceptada (2026-10-23)
- **Fecha:** 2026-10-23
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** CU-B-08 (el mundo del equipo), CU-B-16 (el mundo de la copropiedad), RN-300, T-118

## Contexto

El mundo de BLOKY (CU-B-08, CU-B-16) se dibujaba con código: rectángulos, degradados y emojis. Daniel (2026-10-23): *la
gráfica es muy de niño de 5 años… busca alguna herramienta para algo un poco más elaborado*. Pidió probar
[Rosebud](https://rosebud.ai) y, mientras tanto, Kenney.

- **Rosebud** genera imágenes con IA desde su herramienta para agentes, pero el 2026-10-23 **la parte de recursos no
  respondía** en su servidor (404). Además: el plan gratis prohíbe todo uso comercial; los derechos comerciales empiezan en
  el plan de 30 USD al mes; sus términos dicen que Rosebud es dueño de lo generado; y sus modelos no reciben imagen de
  referencia, así que es difícil mantener un mismo estilo en todos los cuartos.
- **Kenney** publica paquetes de arte de juego con licencia **CC0** (dominio público: uso comercial sin permiso ni crédito).
  El *Furniture Kit* trae 140 piezas en isométrico (paredes, puertas, ventanas, pisos, muebles de oficina, sala, cocina y
  baño), del mismo ángulo que ya usa Estructura.

Se armó la portería con Kenney y se comparó con la anterior. Daniel: *me gusta mucho la primera imagen, la del arte de Kenney*.

## Decisión

1. **Los cuartos del mundo se dibujan con el Furniture Kit de Kenney**, en isométrico: piso de baldosas, dos paredes al
   fondo con puertas y ventanas, y muebles según lo que es cada lugar (`apps/bloky/src/features/equipo/sala-iso.tsx`).
2. **En el repositorio van solo los dibujos que se usan** (`apps/bloky/public/arte/kenney/`, hoy 47 PNG, 220 KB) y el texto
   de la licencia. No se agrega ninguna dependencia de código.
3. **Las personas siguen siendo las de BLOKY** (`Personaje.tsx`), a escala con las puertas del kit: el kit no trae
   personajes con la apariencia que se edita (RN-297).
4. **Lo que el kit no trae** (máquinas de gimnasio, piscina, juegos de parque) se busca primero en otro paquete CC0 de
   Kenney; Rosebud queda como opción cuando funcione, revisando antes el plan y la licencia.

## Consecuencias

- El mundo se ve como un juego de verdad, y cada mueble es una pieza suelta: eso permite que después se decore (T-118).
- Agregar un mueble es copiar su PNG y ponerlo en el diseño del cuarto; los nombres de los archivos son los del kit.
- **Se pueden derivar dibujos del kit** (CC0 lo permite): las puertas con el portal pintado dentro del vano salen de
  `wallDoorway_SE/SW` con `apps/bloky/herramientas/pintar-portales.py` (2026-10-23).
- Mientras no llegue su arte, el gimnasio, la piscina y el parque son un salón de espera con su tono de piso y su tablero.

## Alternativas consideradas

| Opción | Veredicto |
|---|---|
| Seguir dibujando con código | Descartada: es lo que se veía infantil |
| Rosebud (imágenes con IA) | Aplazada: no funcionaba el 2026-10-23, y su licencia exige un plan pago para uso comercial |
| LimeZu (*Modern Interiors*, pixel art) | No se probó: licencia comercial paga y otro estilo (pixel art), distinto del isométrico de Estructura |
| Un renderizador 3D (three.js) con los modelos del kit | Descartada por ahora: dependencia nueva y más pesada para el mismo resultado |
