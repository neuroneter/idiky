# ADR-0028 — El mapa real de BLOKY con Leaflet

- **Estado:** Aceptada (2026-10-23)
- **Fecha:** 2026-10-23
- **Decide:** Responsable de integración (Daniel)
- **Modifica a:** [ADR-0017](./0017-ubicacion-y-plano-real-con-openstreetmap.md) §6 (el mapa real era un visor propio, sin librería)
- **Relacionados:** CU-B-09, CU-B-03, CU-B-10, RN-250, RN-251

## Contexto

La QA, usando Estructura (2026-10-23): *no entiendo cómo se define la ubicación del edificio en el mapa de la ciudad; es muy
complicado; cuando logré entender, súper sensible moverme en el mapa y entender cómo hacer el recuadro en la zona*.

El mapa real (`MapaReal.tsx`) era un visor Web Mercator propio, para no agregar dependencias (ADR-0017 §6). En la práctica:
cada giro de la rueda o del trackpad saltaba **un nivel entero de zoom** y acercaba **hacia el centro**, no hacia el cursor;
no tenía pellizco en el celular; y se comportaba distinto al terreno. El lote nacía como un rectángulo fijo de 60 × 40 m
que solo se ajustaba esquina por esquina.

## Decisión

1. **El mapa real usa [Leaflet](https://leafletjs.com) 1.9.4** (licencia BSD-2, ~42 KB comprimido, sin dependencias), en
   `apps/bloky`, directo (sin envoltorio de React). Zoom suave hacia el cursor de a cuarto de nivel, pellizco, arrastre fino.
2. Los fondos no cambian: satélite (Esri World Imagery) y calles (OpenStreetMap). Los datos tampoco: todo lo marcado sigue en
   metros alrededor del punto (RN-250), con las mismas rutas del middleware.
3. El lote **se dibuja arrastrando** de una esquina a la otra (un toque deja el recuadro de 60 × 40 m) y se ajusta **entero**:
   moverlo, girarlo y estirarlo por las esquinas; el lote que ya conoce el mapa de la ciudad se ofrece («Usar este lote»).

## Consecuencias

- La app de BLOKY pesa ~45 KB más (comprimida).
- En el celular, dibujar el lote arrastrando depende del navegador; tocar deja el recuadro, que luego se ajusta.
- El terreno de Estructura sigue con su propio lienzo (isométrico); el asistente «Ubicar la copropiedad» (segunda entrega)
  pone las torres sobre el satélite.

## Alternativas consideradas

| Opción | Veredicto |
|---|---|
| Arreglar el visor propio | Descartada: zoom fraccionario, anclado al cursor y pellizco son mucho trabajo para quedar igual |
| MapLibre GL | Descartada: más pesada (~200 KB) y pensada para mapas vectoriales; no hace falta |
| react-leaflet | Descartada: una dependencia más; se usa Leaflet directo |
