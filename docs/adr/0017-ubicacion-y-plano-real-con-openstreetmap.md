# ADR-0017 — La ubicación y el plano real de la copropiedad, con OpenStreetMap (no Google Maps)

- **Estado:** Aceptada (2026-10-11)
- **Fecha:** 2026-10-11
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** CU-B-03 (el terreno), CU-B-09 (ubicación), RN-247 (agrupación como capa), RN-248, RN-249

> El número estaba reservado desde el 2026-09-21 como «Google Maps» para CU-B-09. Se escribe ahora,
> y la decisión cambia: OpenStreetMap.

## Contexto

Daniel (2026-10-11): el terreno de «Arma tu copropiedad» debe mostrar **las calles de acceso
reales** alrededor de la copropiedad, a partir de su dirección, para que *aunque se vea como juego,
se vea más real*. El dibujo es nuestro (isométrico, con el estilo de los dibujos de BLOKY), así que
hace falta **la geometría** de las calles, no una imagen de mapa.

Prueba con datos reales (Oasis, «Carrera 68 # 74-80», Barranquilla): OpenStreetMap encuentra la
Carrera 68 y la **esquina con la Calle 74**, pero no el número de la casa (en Colombia casi no
está cargado). Los servidores públicos gratuitos respondieron, y también fallaron por momentos.

## Decisión

**1. OpenStreetMap, no Google Maps.** Las condiciones de Google Maps Platform no permiten usar sus
datos fuera de un mapa de Google ni redibujarlos con estilo propio. Los datos de OpenStreetMap
(licencia ODbL) sí, **citando la fuente**: el plano muestra siempre «© OpenStreetMap».

**2. La dirección colombiana da el punto (RN-248).** «Carrera 68 # 74-80» es *sobre la Carrera 68,
a 80 m de la esquina con la Calle 74, hacia la 75*. BLOKY busca las dos vías en la ciudad, calcula la
esquina y avanza los metros por la vía. Si no encuentra la esquina, ubica la vía y lo dice
(«ubicación aproximada»). El administrador confirma antes de guardar.

**3. El vecindario se descarga una vez y se guarda (RN-249).** Las calles (con su nombre y tipo),
los edificios vecinos, los parques y, si existe, el polígono del conjunto, en un radio de unos
200 m, se guardan en el esquema de la copropiedad, ya pasados a metros alrededor del punto. El
terreno los dibuja sin volver a preguntar a nadie. Así no dependemos de servidores gratuitos que a
veces fallan, ni los cargamos.

**4. Los consulta la API, no el navegador.** `bloky-api` llama a Nominatim y a Overpass con una
identificación propia (como piden sus políticas de uso), probando varios servidores de Overpass.

**5. El plano.** Escala fija de **4 píxeles por metro** (una torre dibujada mide lo de una real) y
proyección **isométrica** alineada con la cuadrícula del terreno, con la flecha del norte. El
terreno crece para contener el vecindario y gana **zoom**. Al ubicarla por primera vez, la
copropiedad se centra en su punto.

**6. Demarcar sobre el mapa real, en pantalla partida (2026-10-11, Daniel).** El límite del lote
casi nunca está en OpenStreetMap, así que **la persona lo dibuja**: en el terreno, «🗺 Ver el mapa»
parte la pantalla en dos (el terreno y el mapa real), con una barra que se arrastra para dar más
ancho a uno u otro, y una ✕ que cierra el mapa. Sobre el mapa se marca **el lote** (un recuadro
que se ajusta moviendo sus esquinas) y **las entradas** (peatonal, vehicular, portería); lo
marcado aparece al instante en el terreno y queda guardado para todos (RN-250). Después: los
bloques y las calles de acceso.
- **Fondo del mapa:** «Calles» con los mosaicos de OpenStreetMap (uso interactivo normal, con su
  crédito, sin descargas en masa; si BLOKY crece, un proveedor o mosaicos propios) y «Satélite» con
  **Esri World Imagery**, cuyas condiciones permiten *usarla para trazar elementos y crear datos
  vectoriales*, mostrando su crédito (para uso comercial a gran escala, confirmar con Esri).
  **Google Maps no**: sus condiciones prohíben calcar sobre sus imágenes para crear datos propios.
- **Sin librería de mapas:** un mapa propio y liviano (mosaicos Web Mercator, arrastrar, zoom y una
  capa SVG para dibujar), como la firma de R2 y el lector de Markdown.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| Google Maps (Geocoding + Maps) | Mejor con direcciones colombianas | No deja redibujar sus datos con estilo propio; cobra por consulta | ❌ |
| Imagen de mapa de fondo (teselas) | Fácil | Rompe el estilo de juego; no sabemos dónde están las calles | ❌ |
| **OpenStreetMap (Nominatim + Overpass), guardado** | Geometría real, gratis, redibujable, todo Colombia | Calidad desigual; servidores públicos inestables | ✅ |
| Catastro abierto (Bogotá, Medellín, IGAC) | El límite exacto del lote | No cubre todo el país; formatos distintos | Después, para el límite |
| Demarcar sobre Google Maps | La foto más conocida | Sus condiciones prohíben calcar para crear datos propios; cobra por uso | ❌ |
| **Demarcar sobre OpenStreetMap + Esri, mapa propio** | Se puede calcar; sin dependencias | Hay que mantener el mapa propio | ✅ |
| Leaflet | Mapa completo y probado | Una dependencia y un ADR más, para usar poco de ella | ❌ por ahora |

## Consecuencias

- Una tabla nueva por copropiedad, `ubicacion` (una fila): dirección, ciudad, punto, cómo se
  ubicó, el vecindario en metros y el límite del lote si se conoce.
- El terreno deja de ser un rectángulo fijo de 1600 × 1000: con vecindario mide 3200 × 2200 y
  tiene zoom. El arrastre tiene en cuenta el zoom.
- **Atribución obligatoria** «© OpenStreetMap» en el plano.
- **Lo abierto:** dibujar o corregir el límite del lote a mano; el catastro abierto donde exista;
  que «Armar desde documentos» tome la dirección de la escritura y ubique sola la copropiedad
  (Daniel, 2026-10-11: *cuando carguemos un archivo, la creación del mapa y las estructuras tendrían
  que dibujarse en el plano*).
