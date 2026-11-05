# ADR-0030 — Quién entra a una reunión con video y cómo se autoriza

- **Estado:** Aceptada (2026-11-03, responsable de integración). Las reglas de votación de §4 están
  **por confirmar con Mary**, que definió las de la asamblea (RN-210 en adelante).
- **Caso de uso:** [CU-B-15](../casos-de-uso/bloky.md#cu-b-15), segunda parte · **Tarea:** T-106.
- **Relacionados:** [ADR-0016](./0016-jitsi-propio-para-las-asambleas-virtuales.md) (Jitsi propio),
  [ADR-0025](./0025-directorio-unico-y-mapa-de-ubicaciones.md) (el directorio de personas),
  RN-276 a RN-280 (la primera parte de CU-B-15), RN-29 y RN-30 (un voto por unidad, los poderes),
  aviso 3 de Justo (`docs/avisos/justo.md`).
- **Reglas que nacen aquí:** RN-302 a RN-316 (`docs/05-modelo-de-datos.md`).

## Contexto

Hoy una sala de Jitsi se **abre** con una cuenta creada a mano en el servidor y se **entra** con el
enlace: quien lo recibe reenviado entra, y Jitsi no sabe quién es. Para una junta eso molesta; para
una asamblea no sirve, porque la asistencia es el quórum (RN-215) y cada unidad vota una sola vez
(RN-29). Ya estaba decidido que las reuniones son de BLOKY, que BOB solo da el cupo (RN-276) y que
**el middleware firma los pases** (aviso 3 de Justo).

## Decisión

### 1. Nadie entra sin un pase del middleware

Jitsi pasa a modo de pases firmados (JWT) y **no acepta entradas sin pase**. El pase lo firma el
middleware con una **llave privada**; Jitsi solo tiene la **pública**, así que quien comprometa Jitsi
no puede fabricar pases. El pase dice la sala, la persona y su rol (anfitrión, secretario o
participante), es de vida corta y el middleware lo renueva **mientras la reunión esté abierta**.

El **título** de la reunión es libre («Junta de Copropietarios 2027»); la **sala** técnica sigue
siendo un nombre al azar que nadie escribe (RN-280), como segunda protección.

### 2. Quién entra

| Quién | Entra | Vota |
|---|---|---|
| Propietario de una unidad, o su apoderado | Por derecho propio | Sí: **un solo votante por unidad** |
| Propietario que dio el poder | Sí | No: el voto es del apoderado |
| Anfitrión, sus suplentes y el secretario | Por su rol en la reunión | Según sean propietarios o apoderados |
| Arrendatario, residente, colaborador o externo (bomberos, seguridad, un asesor) | **Solo con invitación**, otorgada antes de empezar | No |

- **Una conexión por persona:** la nueva saca a la anterior (celular o computador). No es por unidad,
  para que el propietario que dio poder pueda entrar sin quitarle la pantalla a su apoderado.
- **Las invitaciones** las otorgan la Administración, la Junta o el anfitrión, desde que se crea la
  reunión hasta antes de que empiece; **solo por correo**, enviadas automáticamente por BLOKY, con un
  enlace personal. Durante la reunión no se agregan. Los invitados esperan en la **sala de espera**
  hasta que el anfitrión o el secretario los admiten.
- **Desde ALICE** la persona entra con su sesión. Si prefiere el computador, pide **«Enviarme el
  enlace al correo»**: llega al correo que tiene en el directorio (no a uno que escriba), es de un
  solo uso y vence pronto. **La votación sigue siempre en ALICE**, aunque el video esté en el
  computador.

### 3. Quién conduce

- **El anfitrión se define al crear la reunión** en BLOKY: puede ser un empleado, alguien de la Junta
  o un propietario, porque el Administrador puede faltar. Al crearla se dicen también **quiénes lo
  reemplazan** si se desconecta.
- **El secretario** se asigna antes o durante la reunión (a veces se elige por votación); durante la
  reunión lo asigna el anfitrión.
- **Estados:** *programada* → *abierta* (entra el anfitrión; quien llegue antes espera) → *cerrada*.
  **El horario no la cierra**: al acercarse la hora prevista hay avisos, y solo el anfitrión o el
  secretario la extienden o la terminan, antes o después. Al cerrarse, salen todos y no hay más pases.
- **Cámara y micrófono:** el secretario decide si cualquiera puede usarlos o solo la mesa directiva
  (la Administración y la Junta). Si no los abrió para todos, se habilitan a quien **se le da la
  palabra**, durante su intervención. Así una asamblea grande no satura el servidor.

### 4. Las votaciones (por confirmar con Mary)

- **El secretario abre cada votación** y le fija un **tiempo máximo**. Si se acaba sin quórum, puede
  **extenderla una vez**, sin superar el tiempo que fijó para esa votación.
- Puede **corregir la redacción** de una pregunta antes de abrirla; una vez abierta, queda bloqueada.
  Cada cambio guarda el texto anterior, quién y cuándo, para el acta.
- En una **extraordinaria** solo se decide lo del orden del día (Ley 675, art. 39). En una
  **ordinaria**, el punto de **proposiciones** puede terminar en votación.
- **Los poderes tienen plazo:** la Administración define en BLOKY hasta cuándo se pueden otorgar y
  revocar, y **nunca dentro de la ventana de la reunión**. Si no se revocó antes, queda.

## Formato del pase (propuesta, por acordar con Justo)

Para que Jitsi y el middleware encajen a la primera. Firmado con **RS256**; la cabecera lleva `kid`,
y Jitsi busca la llave pública por ese `kid` (por ejemplo, un servidor de llaves ASAP). **Sin
probar en `stable-11031`.**

```json
{
  "iss": "idiky-middleware",
  "aud": "jitsi",
  "sub": "jitsi-dev.idiky.com",
  "room": "idiky-<20 letras al azar>",
  "nbf": 0, "exp": 0,
  "context": {
    "user": { "id": "<personaId del directorio>", "name": "<nombre>", "moderator": true },
    "idiky": {
      "copropiedad": "<id>",
      "reunion": "<id>",
      "rol": "anfitrion | suplente | secretario | participante | invitado",
      "unidad": "<id o null>",
      "vota": false
    }
  }
}
```

- `moderator` es `true` solo para el anfitrión, el suplente que asumió y el secretario (RN-313, RN-314).
- `exp` es corto (minutos): el pase se renueva mientras la reunión esté abierta (RN-312).
- `vota` y `unidad` son informativos: **la votación no la decide Jitsi**, sino BLOKY y ALICE (RN-310).
- Una conexión por persona (RN-307): Jitsi saca la conexión anterior del mismo `user.id`.

## Consecuencias

- **El middleware** (`Bloky-Idiky/apps/bloky-api`) entrega los pases, envía las invitaciones y los
  enlaces al correo (T-109), lleva el estado de la reunión, la asistencia y las votaciones.
- **Jitsi** (`Jitsi-Streaming-Idiky`, Justo): modo de pases con la llave pública, sin invitados sin
  pase, el rol del pase manda, la sala espera al anfitrión, y avisa al middleware quién entra y sale.
  **Probado en `stable-11031` el 2026-11-04** lo primero: `AUTH_TYPE=jwt` con `JWT_ASAP_KEYSERVER`, sin
  invitados, `token_affiliation` y `JICOFO_ENABLE_AUTH=0` (con autenticación, jicofo hace moderador a todo
  el que trae pase). Falta que la sala espere al anfitrión y avisar quién entra y sale.
- **El cierre a tiempo de T-106 cambia**: no lo decide Jitsi por horario, lo decide una persona.
- **La capacidad** sigue siendo el límite (instancia de 4 GB): la regla de cámaras de §3 es lo que
  permite una asamblea grande sin una instancia aparte.
- **ALICE** necesita «Entrar a la reunión», «Enviarme el enlace al correo» y la votación en la
  reunión (Justo).
