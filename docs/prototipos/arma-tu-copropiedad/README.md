# Prototipo · «Arma tu copropiedad»

**Qué es:** bocetos clicables, en archivos HTML sin dependencias, de cómo podría sentirse el primer
día de un administrador en BLOKY: armar la estructura de su copropiedad sin formularios. Se
hicieron el 2026-09-21 con el responsable de integración, que quiere algo «sencillo, novedoso e
interactivo, como un juego». **No son código de producto**: son para mirar, tocar y decidir. Lo
que se apruebe pasa al caso de uso y, de ahí, a `apps/bloky/` en React (repo `Bloky-Idiky`).

**Cómo se abren:** doble clic en el archivo. `tokens.css` es una copia de
`apps/bloky/src/estilos/tokens.css` para que abran solos.

Tres versiones, en el orden en que se pensaron:

| Archivo | Idea | Estado |
|---|---|---|
| `preguntas.html` | **Asistente de preguntas:** una pregunta por pantalla con tarjetas grandes; la copropiedad se dibuja sola a la izquierda. Atajos `#2` y `#3` | Primera idea. Daniel la vio bien pero quiso algo menos guiado |
| `catalogo.html` | **Catálogo, como armar un avatar:** pestañas Estructura · Unidades · Espacios; tocas un objeto y aparece; tocas lo que ya está y lo ajustas. Atajo `#demo` | Segunda idea, de Daniel |
| `arrastrar.html` | **Terreno para arrastrar y configurar**: arrastras del catálogo al terreno cuadriculado, sueltas donde va, tocas para configurar (pisos, apartamentos por piso, locales, cantidad), mueves, duplicas, quitas. Anillo de avance y ruta experta «Importar». Atajo `#demo` | Tercera idea, de Daniel: «una zona de dibujo donde arrastras las cosas y las configuras» |
| `index.html` | **Asociaciones** (la vigente): lo anterior más dos relaciones con gestos distintos. **«Está dentro de»**: soltar un objeto encima de una torre o de una **Zona** (área que agrupa zonas comunes) lo mete dentro y se dibuja pegado a ella; «Sacar» o arrastrar fuera lo saca. **«Pertenece a»**: al tocar parqueaderos o depósitos se dibujan líneas hacia las torres a las que están asignados, con la cantidad por torre y el resto para visitantes; el puesto por puesto queda para la ficha del apartamento o el Excel. **La Agrupación es general** (pedido de Daniel): recibe torres, manzanas, locales y zonas comunes, tiene tipo (etapa, sector, bloque, zona social, zona comercial) y tamaño ajustable; es el «nivel del árbol de cualquier profundidad» de docs/13 §6. Atajo `#demo` | Cuarta idea, de Daniel: «poder asociar y que gráficamente se mire cómo se asocia» |

**Ajustes a la v4 (2026-10-03, Daniel):** lo que está dentro de una torre o agrupación **se
toca y se configura ahí mismo**, sin sacarlo (antes el panel no aparecía: era un error del
boceto). Una relación equivocada se deshace fácil: la **×** sobre lo que está dentro, arrastrarlo
fuera, el selector **«Está en»** del panel (suelto o dentro de cualquier torre o agrupación) y
**Deshacer** (botón, aviso o Ctrl/Cmd + Z). Quitar un contenedor deja sueltos sus contenidos.

**Configurar cada cosa (2026-10-03, Daniel):** doble clic, clic derecho o «⚙ Configurar» abren
un popup con **dos pestañas: General** (nombre, relación con una torre o agrupación, descripción y
**condiciones y reglas de uso**, un renglón por punto, que se aceptan con el bloque «Acepta las
condiciones de uso»)
**y Flujo de uso**, donde vive todo lo demás («el flujo lo estructura», Daniel: se quitó la pestaña
de capacidad y horario). El flujo es el juego: se arrastran bloques de un catálogo y se encajan.
**Preguntas** (¿está en horario? —con sus franjas por día—, edad, hora, día, quién es, cuántos
van, ¿está en mora?) abren dos caminos, **Sí y No**, que se juntan debajo: así se combina
cualquier regla sin campos especiales. **Reserva y uso:** pide reserva previa (turno,
anticipación, plazo para cancelar), aforo (exclusivo o compartido), reservas al mes, horas por
uso. **Autorizaciones:** administración, consejo, adulto responsable, condiciones de uso.
**Pagos:** alquiler, reserva, aseo, mantenimiento, depósito u otro, cada uno con el documento que
lo autoriza (RN-45) y **cómo se paga** (Daniel, mismo día): **antes, por transferencia o
consignación** a una cuenta de la copropiedad: el residente **carga el soporte** (foto o PDF) hasta
X horas antes de empezar o después de reservar y **lo aprueba la administración**; mientras tanto
la reserva queda pendiente y, si vence el plazo sin soporte, se libera. **Con la cuota de
administración**: se suma a la siguiente cuenta de cobro (como el cobro por uso de zona, RN-119),
**sin revisión**. **En línea por IDIKY** (próximamente): se confirma solo, **sin revisión**. Al
probar, el pago puede estar aprobado, sin revisar, rechazado o sin pagar, y la línea de tiempo
muestra el límite para cargar el soporte. **Alertas:** por dónde (correo, SMS, llamada, app), a quién (quien reservó o
la red de colaboradores: todos, portería, zonas sociales, administración o un **grupo** creado
ahí mismo, p. ej. «Comité de reservas»), **cuándo** (al confirmarse, X minutos/horas/días antes de
empezar, al empezar, X después de terminar) y el mensaje, con `{nombre}`, `{espacio}`, `{fecha}`,
`{hora}`, `{personas}`. **Acceso:** el bloque **código de acceso**
(Daniel, mismo día) genera un PIN de 4, 6 u 8 dígitos o un QR; sirve una vez, mientras esté
vigente o uno por persona; vale desde X min antes de empezar hasta X min después de terminar; se
envía como una alerta (por dónde, a quién, cuándo), y tiene **«Se conecta con»**: hoy lo verifica
portería, y quedan anunciados —«próximamente»— cerradura inteligente, torniquete y lector de QR,
para conectar después los accesos automatizados. **Después de reservar** (Daniel, mismo día: «qué pasa cuando no
asiste y deja la zona sin usar, aunque no tenga costo»): ¿canceló?, ¿canceló con menos de N
horas?, ¿llegó dentro de los N minutos de espera? (lo marca portería o el uso del código),
**cancelar la reserva y liberar la zona**, y **multa** con el motivo que verá el residente y quién
la autoriza; **se carga directo** en la cuenta de cobro de administración y el residente, en la app, **la
puede refutar** diciendo por qué; la administración la **retira** (el cargo queda anulado, no se
borra) o la **mantiene** (Daniel, mismo día). La pieza «★ Camino completo» lo arma de un toque; al
probar se elige «después: llegó / no llegó / canceló con N h» y se ve **la multa como la ve el
residente en la app**, con la refutación y la respuesta. **Finales:** puede o no puede, con el porqué. Hay plantillas (salón con
alquiler, piscina con horarios, gimnasio por edades), **misiones** hasta «¡Flujo listo!» y
**Probar**: se elige a alguien (Sofía 10, Andrés 16, Marta 45, Carlos invitado), una ficha recorre
el flujo, se resalta el camino y a la derecha sale el veredicto, lo que debe cumplir, lo que paga y
la **línea de tiempo de las alertas**, cada una con su día y hora. **Las estructuras (torre, manzana, locales) no se reservan**: solo tienen General. **El flujo de una
agrupación se recorre primero** en todo lo que está dentro. Ejemplos en `#demo`.

**Mover sin saltos (2026-10-03, Daniel):** al soltar algo ya no salta arriba o abajo. Cada objeto
se ubica por su base central (así las torres de distinta altura quedan alineadas), y antes esa
base caía donde estaba el cursor: agarrar una torre por el techo la hacía subir toda su altura.
Ahora se recuerda el punto de agarre y cae donde se ve; la cuadrícula es de 10 px (antes 40), no se
sale del terreno y, con algo seleccionado, las **flechas** lo afinan de a 10 px (con Shift, de a 1).

**Otro espacio y Oficina (2026-10-03, Daniel):** para lo que el catálogo no trae, **«Otro
espacio»** abre «Crea tu espacio»: se busca y elige un ícono entre unos 50, en nueve grupos (salud y
bienestar: enfermería, sauna, turco, jacuzzi, spa, yoga, peluquería, zona húmeda; deporte: canchas,
tenis, fútbol, baloncesto, squash, golfito, trote, billar; niños: salón de niños, ludoteca,
guardería, piscina de niños, juegos; trabajo y estudio: puestos de trabajo, sala de reuniones,
coworking, biblioteca, estudio, auditorio, recepción; social: BBQ, terraza, mirador, cine,
salón comunal, capilla, cafetería, minimercado; servicios: lavandería, basuras, reciclaje,
correspondencia, oficina de administración, cuarto técnico, planta eléctrica, tanque de agua;
movilidad: bicicletero, carga de carros eléctricos, lavadero, motos; naturaleza y mascotas: huerta,
jardín, sendero, zona de mascotas) y se le pone nombre; el ícono se cambia después en General. En
Estructura, la **Oficina**: no es un edificio residencial, tiene pisos, puestos de trabajo por piso
y oficinas cerradas por piso (estas cuentan como unidades); como la torre, recibe cosas dentro —p.
ej. «Puestos de trabajo» y «Sala de reuniones» como espacios reservables, con su flujo—. En `#demo`:
«Torre empresarial», una enfermería y un sauna en la Zona social.

**Decidido sobre la v3 (2026-09-21):** el terreno es un croquis que se guarda; para las grandes bastan
Duplicar e Importar; el arrastre debe funcionar también en el teléfono (eventos de puntero).

**Lo que el prototipo no resuelve todavía:** la ruta experta con Excel, coeficientes, ubicación
en el mapa y fotos (son pasos siguientes del módulo), la versión táctil (el arrastre es HTML5,
solo funciona con ratón; el producto usará eventos de puntero) y el resumen para copropiedades
muy grandes (una torre se dibuja con máximo ocho pisos y muestra «24 pisos × 4»).
