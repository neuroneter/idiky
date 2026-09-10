# ADR-0007 — La transmisión de la asamblea la pone un tercero, no Idiky

- **Estado:** Aceptada
- **Fecha:** 2026-09-10

## Contexto

El tablero planteaba esta decisión como **«elegir proveedor de transmisión: costo por minuto,
grabación, ancho de banda»** (T-14). Al abrirla con Mary quedó claro que la pregunta estaba mal
puesta, por dos razones que llegaron en este orden.

**La primera: la copropiedad ya tiene con qué.** *«De lo que conozco, las asambleas se pueden
hacer por Zoom o por Meet»* (Mary, 2026-09-09). Si la asamblea ya ocurre ahí, el costo por
minuto no es de Idiky y la complejidad tampoco. Comprar o construir video sería competir con
Zoom en lo que Zoom ya hace bien, y hacerlo peor.

**La segunda, y es la que ordena todo: hay tres modalidades, no una.** *«Una asamblea puede ser
virtual o presencial; debemos partir de ahí»* (Mary). `Asamblea.modalidad` ya existía en el
modelo —`presencial | virtual | mixta`— pero se estaba diseñando como si todas fueran virtuales.

Puestas al lado, las tres modalidades dicen sola la respuesta:

| | Presencial | Virtual | Mixta |
|---|---|---|---|
| Dónde se reúnen | El salón | Zoom / Meet | Los dos a la vez |
| **Quién asiste y cuánto pesa** | Idiky | Idiky | Idiky |
| **La votación ponderada por coeficiente** | Idiky | Idiky | Idiky |
| **El acta** | Idiky | Idiky | Idiky |
| El video | *no hay* | de un tercero | de un tercero |

**La asistencia es la constante; el video es la variable.** Solo existe en dos de las tres
modalidades y en ninguna es el sistema de registro. Eso es justamente lo que permite que sea de
otro: si el video se cae, la asamblea no se cae — se cae el canal.

Y al revés: **Zoom no conoce los coeficientes y nunca los va a conocer.** El quórum ponderado
(RN-28), el voto ponderado (RN-27) y el acta son el pedazo insustituible, y ya son de Idiky.

## Decisión

**Idiky no transmite video en ninguna modalidad. Enlaza la herramienta que la copropiedad ya
use** —Zoom, Meet, la que sea— guardándola en `Asamblea.enlaceTransmision`, y **la modalidad
decide qué se pide y qué se muestra**:

| Modalidad | Se exige al convocar | Lo que ve el copropietario |
|---|---|---|
| `presencial` | **Lugar** | Dónde es y a qué hora |
| `virtual` | **Enlace** | El botón para entrar a la reunión |
| `mixta` | **Lugar y enlace** | Los dos, y escoge |

Es un **paso intermedio declarado, no una puerta cerrada** (decisión de Mary, 2026-09-09).
Enlazar es lo que se hace hoy; más abajo quedan escritos los criterios con los que habría que
decidir un proveedor embebido el día que haga falta, para no tener que reconstruir el
razonamiento.

**Sin dependencias nuevas.** Un enlace es un enlace: no entra ninguna librería, no hay SDK, no
hay costo por minuto y no cambia nada de Capacitor (ADR-0002).

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Enlazar Zoom / Meet** | Sin costo, sin dependencias, sin SDK. La copropiedad ya sabe usarlo | Salir de la app para ver, y volver para votar | ✅ **Elegida** |
| Proveedor embebido (LiveKit, Daily, Agora…) | Todo dentro de la app; una sola pantalla | Costo por minuto y por asistente; exige backend que hoy no existe (ADR-0008); SDK pesado contra ADR-0001 | Aplazada — ver criterios abajo |
| Difusión uno-a-muchos (HLS: Mux, Cloudflare Stream) | Mucho más barata que WebRTC para cientos de espectadores | Es de una sola vía: **no permite deliberar**, y la ley exige deliberar, no solo ver | Descartada |
| Desarrollo propio (WebRTC / SFU) | Control total | Meses de trabajo y operación permanente para reinventar Zoom | Descartada |

## Consecuencias

### Lo que se vuelve fácil

- **La asamblea presencial deja de ser un caso raro.** Era la modalidad más común y la que peor
  soportaba un diseño pensado solo para video.
- **El esfuerzo se va a donde nadie más lo hace**: asistencia, quórum ponderado, votación, acta.
- Se puede construir hoy, sin backend y sin proveedor.

### Lo que se vuelve difícil, y hay que resolver

**El ir y volver.** En el celular, abrir Zoom manda Idiky al fondo. Si el administrador abre una
votación mientras la persona mira la reunión, **no se entera**. Es el costo real de esta
decisión y no se puede tapar:

- La votación **queda abierta un tiempo**, no un instante — ya estaba dicho en CU-R-21 A1:
  *«la votación nunca debe depender del video»*. Con este ADR esa frase deja de ser una
  precaución y pasa a ser la arquitectura.
- Hace falta **notificación push** cuando se abre una votación (fase 2, ADR-0002).
- Mientras no haya push, la sala de la asamblea **dice cuándo se vota**, para que la persona
  sepa cuándo volver a mirar.

**La prueba.** La lista de asistentes de Zoom **no sirve** como registro de asistencia: no
conoce unidades ni coeficientes, y el quórum se mide en coeficientes (RN-28). Quien entra por
el enlace **también tiene que marcar asistencia en Idiky**, y es esa la que cuenta.

**Hay decisiones que la modalidad virtual no puede tomar, y eso este ADR no lo puede cambiar.**
El parágrafo del artículo 46 prohíbe adoptar las decisiones de mayoría calificada **en reuniones
no presenciales**, y lo adoptado en contravención es *absolutamente nulo*. Es el límite duro de
«la asamblea puede ser virtual»: puede serlo para casi todo, no para reformar el reglamento ni
para la extraordinaria grande. Idiky lo bloquea y lo dice (RN-77). Si esta copropiedad necesita
decidir uno de esos puntos, **la sesión tiene que ser presencial** — y conviene saberlo al
convocar, no el día de la votación.

**La grabación** queda en Zoom o Meet, fuera de Idiky. El acta la cita; no la guarda. Si el
equipo decide que la grabación es soporte del acta, hay que definir dónde vive y cuánto se
conserva — sigue abierto (CU-A-17 A2).

### Cuándo habría que reabrir esta decisión

Estos son los criterios para el día que se evalúe un proveedor embebido, para no volver a
empezar de cero:

1. **Que la asistencia por el enlace resulte imposible de conciliar** con el registro de Idiky
   en la práctica, y no solo en teoría.
2. **Que el ir y volver expulse gente de la votación** de forma medible: si con push la
   participación sigue cayendo cuando la asamblea es virtual, el video tiene que estar dentro.
3. **Que exista el backend** (ADR-0008): sin servidor no hay cómo emitir los tokens que
   cualquier proveedor exige, así que antes de eso la discusión es teórica.
4. **Que alguien pague el minuto.** Es costo variable por asistente y por hora; una asamblea de
   200 unidades no cuesta lo mismo que una de 12.

Si se reabre, la primera pregunta no es cuál proveedor sino **si el video debe ser
bidireccional para todos** o solo para quien tiene la palabra: es lo que separa un costo
manejable de uno que no lo es.

## Lo que este ADR **no** decide

- ~~**El quórum**~~ → **resuelto el 2026-09-10**, y por los dos lados. El umbral se verificó
  contra la Ley 675 arts. 41 y 45 (RN-28) y el peso de la asistencia virtual quedó decidido:
  **pesa igual que la presencial** (RN-75, Mary), que es además lo que dicen el art. 42 de la
  Ley 675 y el art. 1.º del Decreto 398 de 2020. Idiky ya **afirma** el quórum, citando el
  artículo. Lo que sigue abierto en
  [`../12-levantamiento-pendiente.md`](../12-levantamiento-pendiente.md) §3 bis es de este
  reglamento, no de la ley.
- **Si la grabación es soporte del acta** (CU-A-17 A2).
