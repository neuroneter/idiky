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
| `index.html` | **Terreno para arrastrar y configurar** (la vigente): arrastras del catálogo al terreno cuadriculado, sueltas donde va, tocas para configurar (pisos, apartamentos por piso, locales, cantidad), mueves, duplicas, quitas. Anillo de avance y ruta experta «Importar». Atajo `#demo` | Tercera idea, de Daniel: «una zona de dibujo donde arrastras las cosas y las configuras» |

**Lo que el prototipo no resuelve todavía:** la ruta experta con Excel, coeficientes, ubicación
en el mapa y fotos (son pasos siguientes del módulo), la versión táctil (el arrastre es HTML5,
solo funciona con ratón; el producto usará eventos de puntero) y el resumen para copropiedades
muy grandes (una torre se dibuja con máximo ocho pisos y muestra «24 pisos × 4»).
