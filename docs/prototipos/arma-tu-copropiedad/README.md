# Prototipo · «Arma tu copropiedad»

**Qué es:** bocetos clicables, en archivos HTML sin dependencias, de cómo podría sentirse el primer
día de un administrador en BLOKY: armar la estructura de su copropiedad sin formularios. Se
hicieron el 2026-09-21 con el responsable de integración, que quiere algo «sencillo, novedoso e
interactivo, como un juego». **No son código de producto**: son para mirar, tocar y decidir. Lo
que se apruebe pasa al caso de uso y, de ahí, a `apps/bloky/` en React.

**Cómo se abren:** doble clic en el archivo. `tokens.css` es una copia de
`apps/bloky/src/estilos/tokens.css` para que abran solos.

Tres versiones, en el orden en que se pensaron:

| Archivo | Idea | Estado |
|---|---|---|
| `preguntas.html` | **Asistente de preguntas:** una pregunta por pantalla con tarjetas grandes; la copropiedad se dibuja sola a la izquierda. Atajos `#2` y `#3` | Primera idea. Daniel la vio bien pero quiso algo menos guiado |
| `catalogo.html` | **Catálogo, como armar un avatar:** pestañas Estructura · Unidades · Espacios; tocas un objeto y aparece; tocas lo que ya está y lo ajustas. Atajo `#demo` | Segunda idea, de Daniel |
| `arrastrar.html` | **Terreno para arrastrar y configurar**: arrastras del catálogo al terreno cuadriculado, sueltas donde va, tocas para configurar (pisos, apartamentos por piso, locales, cantidad), mueves, duplicas, quitas. Anillo de avance y ruta experta «Importar». Atajo `#demo` | Tercera idea, de Daniel: «una zona de dibujo donde arrastras las cosas y las configuras» |
| `index.html` | **Asociaciones** (la vigente): lo anterior más dos relaciones con gestos distintos. **«Está dentro de»**: soltar un objeto encima de una torre o de una **Zona** (área que agrupa zonas comunes) lo mete dentro y se dibuja pegado a ella; «Sacar» o arrastrar fuera lo saca. **«Pertenece a»**: al tocar parqueaderos o depósitos se dibujan líneas hacia las torres a las que están asignados, con la cantidad por torre y el resto para visitantes; el puesto por puesto queda para la ficha del apartamento o el Excel. **La Agrupación es general** (pedido de Daniel): recibe torres, manzanas, locales y zonas comunes, tiene tipo (etapa, sector, bloque, zona social, zona comercial) y tamaño ajustable; es el «nivel del árbol de cualquier profundidad» de docs/13 §6. Atajo `#demo` | Cuarta idea, de Daniel: «poder asociar y que gráficamente se mire cómo se asocia» |

**Agregado el 2026-09-23 (v5, sobre el mismo `index.html`):**

- **La manzana ya crece.** Dibujaba una sola casa pasara lo que pasara con el contador; ahora pone
  una casa por casa, con la misma animación escalonada de los pisos de la torre, y un bloque `+N`
  punteado cuando pasa de ocho, para que el `+` nunca se sienta muerto.
- **Oficina**, con una mecánica propia. Se dibuja **vista desde arriba** —planta, no fachada—:
  salas de reunión arriba y puestos de trabajo abajo. Cada puesto **se toca en la planta** para
  volverlo *fijo* (tiene dueño, no entra a la reserva) o *reservable* (cualquiera lo aparta por
  día); esa distinción es de la que vive una aplicación de reserva de puestos, y es lo que la
  separa de la torre, que se configura solo con contadores. En el inspector: puestos, salas de
  reunión, cuántos quedan reservables y fijos, y los atajos «Todos reservables» / «Todos fijos».
  Se mete dentro de una torre o de una Agrupación como cualquier otra cosa, y se duplica.
  La referencia que dio Daniel es [Wiser XP](https://wiserxp.com/es-solucion-completa-e-intuitiva/):
  oficinas → plantas → zonas → puestos, con puestos dedicados frente a flexibles.
- **La Agrupación también está en Espacios, y ahora se relaciona con una estructura.** Es el mismo
  objeto general de siempre (no se duplicó el concepto), pero ahora se alcanza desde la pestaña
  donde uno está colocando amenidades, y nace distinta según de dónde se saque: de Estructura sale
  «Etapa 1», de Espacios sale «Zona común 1». Sirve para el caso que faltaba: **un piso completo o
  una zona entera con varias amenidades**. Se le agregaron los tipos **Piso** (con «¿qué piso?»),
  Zona común, Terraza y Sótano.
  Y sobre todo: una Agrupación **no podía relacionarse con nada**, solo recibir cosas. Ahora tiene
  **«pertenece a»** —la misma mecánica de líneas de los parqueaderos—: en el inspector, «¿De quién
  es?» lista las torres, manzanas y otras agrupaciones con un interruptor cada una, y al
  seleccionarla se dibujan las líneas. Vacío significa «es de toda la copropiedad». No deja
  relacionarla con algo que ya tiene adentro (Etapa 2 no se ofrece a sí misma ni a sus torres).
- De paso, cuatro errores que salieron al revisar: tocar algo **dentro de una Agrupación** no abría
  el inspector (el id se guardaba como texto en los manejadores en línea y como número en los del
  terreno, y la búsqueda comparaba con `===`), **Duplicar** dejaba la copia compartiendo las listas
  de asignados con el original, los conteos decían «1 casas», y el título de una Agrupación repetía
  el tipo («Etapa · Etapa 2») cuando el nombre ya lo decía.

**Agregado el 2026-09-23 (v6, después de cuatro casos reales de Daniel):**

Daniel dio cuatro construcciones para probar el modelo —**Life72** (19 pisos, cada tramo con un uso
distinto), **Altos del Cacique** (tres torres sobre un edificio base, con sótanos), **Residencias
Familiares** (etapas y cuadras de casas) y una **copropiedad militar** (un complejo que contiene un
conjunto, oficinas, restaurantes, clínica y cancha de golf). Las cuatro formas salen de las mismas
piezas, así que la estructura aguantó; lo que faltaba era otra cosa. Ver la bitácora del 2026-09-23
en `docs/09-estado-del-proyecto.md` para el análisis completo.

- **Espacio, con nombre libre y ícono a elegir.** El catálogo era una lista fija de ocho amenidades
  y los cuatro casos nombran cerca de treinta: coworking, zona húmeda, billar, ludoteca, BBQ,
  parque de mascotas, consultorio, sala de cirugía, cafetería. Ningún catálogo va a alcanzar. Ahora
  se arrastra **Espacio**, se le escribe el nombre y se le elige el ícono entre dieciséis. Además
  entraron como fichas propias BBQ, Coworking y Cancha, que se repitieron en varios casos.
- **Las Agrupaciones se anidan.** Antes solo recibían cosas: `destinoEn` las descartaba de una.
  Los casos lo piden todo el tiempo —`Piso 4 → Zona de juegos → billar, juegos de mesa, ludoteca`;
  `Terraza → zona de ejercicios → piscina`; `Etapa → cuadra → casas`—. Se dibujan como caja dentro
  de la caja, no como ícono, y al soltar algo **gana la caja más interna**. No se puede meter una
  Agrupación dentro de sí misma ni de lo que ya contiene.
- **Tercera relación: «se bloquea con»** (de Residencias Familiares: reservar el salón de fiestas
  deja la piscina ocupada). Se marca en las dos a la vez y se dibuja con **línea blanca punteada y
  una × en el medio** — no en rojo, porque `tokens.css` reserva el rojo de error para la plata.
  Ahora el tablero tiene tres relaciones con tres gestos: **está dentro de** (soltar encima),
  **pertenece a** (interruptor, línea fucsia) y **se bloquea con** (interruptor, línea punteada).
- **El nombre se escribe en el inspector**, ya no en una ventana del navegador. Renombrar era un
  `prompt()`, que además bloquea la página.
- Dos trampas de nombres corregidas: `.nombre` era a la vez el título del croquis y el campo nuevo,
  y `.pin.zona` se llamaba igual que la Agrupación (es un pin ancho: ahora `.pin--area`).

**Decidido sobre la v3 (2026-09-21):** el terreno es un croquis que se guarda; para las grandes bastan
Duplicar e Importar; el arrastre debe funcionar también en el teléfono (eventos de puntero).

**Lo que el prototipo no resuelve todavía:** la ruta experta con Excel, coeficientes, ubicación
en el mapa y fotos (son pasos siguientes del módulo), la versión táctil (el arrastre es HTML5,
solo funciona con ratón; el producto usará eventos de puntero) y el resumen para copropiedades
muy grandes (una torre se dibuja con máximo ocho pisos y muestra «24 pisos × 4»; una oficina
dibuja hasta 24 puestos y el resto quedan reservables). De la Oficina falta lo que viene después
de armar el espacio: los atributos de cada puesto (doble pantalla, zona o «barrio»), las cabinas
telefónicas, y **el flujo de reserva en sí** —esto configura el espacio, no lo reserva—. De los cuatro
casos quedan pendientes, en este orden: **enlazar los espacios reservables con `ZonaComun`** (que ya
existe en `docs/05` con aforo, franjas y aprobación), **los accesos** —portería y entrada son
adornos: no saben a qué recinto dan paso ni quién lo cruza— y **abrir el edificio**: la pila de
pisos por tramos, con sótanos y ramificada sobre una base común. Eso último rehace buena parte del
dibujo y por eso va de último.
