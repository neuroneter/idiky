# 05 — Modelo de datos

Este modelo es el contrato entre la interfaz y los datos. En el demo vive en
`apps/pwa/src/dominio/tipos.ts`; cuando exista backend, será el esquema de la base de datos
y de la API.

## 1. Diagrama de entidades

```
Copropiedad 1──* Unidad 1──* Residencia *──1 Persona
     │              │
     │              ├──* Cuota *──1 Pago
     │              ├──* Reserva *──1 ZonaComun
     │              ├──* Pqrs 1──* MensajePqrs
     │              ├──* Correspondencia
     │              └──* Visitante
     │
     ├──* ZonaComun
     └──* Comunicado
```

Regla estructural: **todo dato cuelga de una `Copropiedad`**, directamente o a través de una
`Unidad`. No existen datos globales compartidos entre copropiedades.

## 2. Entidades

### Copropiedad
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Identificador |
| `nombre` | string | "Conjunto Residencial Altos del Bosque" |
| `nit` | string | Identificación tributaria |
| `direccion`, `ciudad` | string | |
| `tipo` | `'residencial' \| 'comercial' \| 'mixto'` | |
| `totalUnidades` | number | Derivado, para el tablero |
| `diasDescargos` | number | Días que tiene el copropietario para presentar descargos. **Sale del reglamento de esta copropiedad, no de la app** (RN-69) |
| `diasImpugnacion` | number | Días para impugnar la decisión. Mismo origen |
| `mesesReincidencia` | number | Meses que un antecedente en firme sigue agravando la multa. **También del reglamento** — doce en esta copropiedad (RN-72) |
| `quorumMinimo` | number | Coeficiente que hay que **superar** para sesionar. 50 por ley (art. 45); **el reglamento solo puede subirlo** (RN-28) |

### Unidad
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `copropiedadId` | string | |
| `torre` | string | "Torre 1", "Bloque A" |
| `numero` | string | "402" |
| `tipo` | `'apartamento' \| 'casa' \| 'local'` | |
| `area` | number | m² |
| `coeficiente` | number | % de participación (RN-19) |
| `parqueaderos` | string[] | Identificadores asignados |

### Persona
`id`, `nombres`, `apellidos`, `documento`, `email`, `telefono`.

### Residencia — vincula Persona ↔ Unidad
| Campo | Tipo | Notas |
|---|---|---|
| `rol` | `'propietario' \| 'arrendatario' \| 'autorizado'` | Define permisos (RN-02) |
| `desde` / `hasta` | fecha ISO | `hasta` vacío = vigente |
| `principal` | boolean | Contacto principal de la unidad |

### Cuota
| Campo | Tipo | Notas |
|---|---|---|
| `periodo` | `AAAA-MM` | |
| `tipo` | `'ordinaria' \| 'extraordinaria' \| 'interes' \| 'sancion'` | |
| `concepto` | string | Texto visible |
| `valor` | number | Moneda menor: **pesos enteros, sin decimales** |
| `fechaVencimiento` | fecha ISO | RN-23 |
| `estado` | `'pendiente' \| 'pagada' \| 'vencida'` | RN-04 |
| `pagoId` | string? | Presente cuando `estado = 'pagada'` |
| `origen` | `'reglamento' \| 'asamblea'` \| ausente | **Solo la ordinaria puede ir sin respaldo.** En la extraordinaria es siempre `'asamblea'` (RN-46) |
| `actaId` | string? | El acta que la aprobó |
| `referencia` | string? | Número y fecha del acta, o el artículo del reglamento |
| `justificacion` | string? | **Por qué se cobra y con qué acta**, citando su fecha. Obligatoria cuando hay respaldo (RN-47) |

### Pago
`id`, `unidadId`, `cuotaIds[]`, `valor`, `medio` (`'pse' \| 'tarjeta' \| 'transferencia' \| 'efectivo' \| 'otro'`), `referencia`, `fecha`, `comprobante` (consecutivo, RN-07).

### ZonaComun
| Campo | Tipo | Notas |
|---|---|---|
| `nombre`, `descripcion`, `icono` | string | |
| `aforo` | number | Personas |
| `requiereAprobacion` | boolean | Si no, la reserva nace `confirmada` |
| `horaInicio` / `horaFin` | `HH:mm` | Ventana operativa |
| `duracionBloqueHoras` | number | Tamaño de la franja reservable |
| `anticipacionMinimaHoras` | number | RN-10 |
| `cupoMensualPorUnidad` | number | RN adicional de uso justo |

### Reserva
`id`, `zonaId`, `unidadId`, `personaId`, `fecha` (`AAAA-MM-DD`), `horaInicio`, `horaFin`,
`estado` (`'solicitada' \| 'confirmada' \| 'rechazada' \| 'cancelada'`), `motivoRechazo?`, `creadaEn`.

### Pqrs y MensajePqrs
`radicado` (RN-12), `tipo` (`'peticion' \| 'queja' \| 'reclamo' \| 'sugerencia'`),
`categoria` (`'convivencia' \| 'mantenimiento' \| 'seguridad' \| 'administracion' \| 'otro'`),
`asunto`, `descripcion`, `estado` (`'abierta' \| 'en_gestion' \| 'resuelta' \| 'cerrada'`),
`fechaRadicacion`, `fechaLimite` (RN-13), `mensajes[]` con `autor` (`'residente' \| 'administracion'`).

### Comunicado
`titulo`, `cuerpo`, `categoria` (`'general' \| 'urgente' \| 'mantenimiento' \| 'asamblea'`),
`fijado`, `fechaPublicacion`, `vigenteHasta?`, `autor`, `leidoPor[]`.

### Correspondencia
`unidadId`, `tipo` (`'paquete' \| 'carta' \| 'domicilio'`), `remitente`, `observaciones`,
`fechaRecepcion`, `registradoPor`, `estado` (`'en_porteria' \| 'entregada'`), `recibidoPor?`,
`fechaEntrega?`.

> **`registradoPor` no es `recibidoPor`.** El primero es quien recibió el paquete del mensajero
> y responde por él mientras está en portería; el segundo es el residente que se lo lleva. Sin
> el primero, la cadena de custodia empieza en el aire: si el paquete se pierde, el registro no
> dice quién lo tenía (RN-52).

### Visitante
`unidadId`, `nombre`, `documento`, `placa?`, `vigenciaDesde`, `vigenciaHasta`, `codigo`
(único, RN-16/17), `recurrente`, `estado` (`'activo' \| 'vencido' \| 'revocado'`).

### Configuración de cartera de la copropiedad

> Del alcance del 2026-08-27: el interés de mora se calcula **según la normativa vigente en
> Colombia**, pero **cada copropiedad decide si lo cobra**, porque no todas lo hacen.

### ConfiguracionCartera
| Campo | Tipo | Notas |
|---|---|---|
| `copropiedadId` | string | Uno por copropiedad |
| `cobraInteresMora` | boolean | **El interruptor.** Si está apagado no se genera ningún interés (RN-42) |
| `diaVencimiento` | number | Hoy es una constante global (RN-23); pasa a ser de cada copropiedad |
| `baseCalculo` | `'saldo_vencido' \| 'cuota_vencida'` | Sobre qué se liquida **(?)** |
| `modificadaPor`, `modificadaEn` | string, fecha ISO | Quién encendió o apagó el cobro y cuándo |

### TasaInteres — la ley pone el techo, la asamblea pone la tasa

Hay una norma que regula el interés de mora, **pero cada copropiedad tiene su propio
reglamento y sus aprobaciones de asamblea**. La tasa que se cobra no es «la legal»: es la que
aprobó esa copropiedad, y la ley solo dice hasta dónde puede llegar.

| Campo | Tipo | Notas |
|---|---|---|
| `copropiedadId` | string | RN-01. La tasa es de cada copropiedad, no del sistema |
| `vigenciaDesde` / `vigenciaHasta` | fecha ISO | Cambia con el tiempo |
| `valor` | number | Tasa efectiva anual, en porcentaje |
| `origen` | `'reglamento' \| 'asamblea'` | Qué la autoriza |
| `actaId` | string? | El acta que la aprobó, cuando el origen es una asamblea. **Enlaza la cartera con el módulo de asambleas** (CU-A-20) |
| `referencia` | string | El artículo del reglamento, o el punto del orden del día |
| `justificacion` | string | Por qué se cobra esa tasa y en qué acta se aprobó, con su fecha (RN-47) |

> Sin la justificación, un copropietario que pregunte «¿por qué me cobran este interés?» recibe
> un número. Con ella, recibe la decisión que lo autoriza y dónde quedó escrita.

> **Por qué esto es una tabla y no una constante.** «Normativa vigente» significa una tasa que
> **cambia periódicamente** y que fija una autoridad externa —la certifica la Superintendencia
> Financiera—, con un **tope legal** por encima del cual el cobro es usura. Un número escrito
> en el código quedaría desactualizado y expondría a la copropiedad.
>
> **Quién la mantiene:** el administrador de cada copropiedad (decisión del equipo,
> 2026-08-27), **registrando qué la aprobó**. Como la teclea una persona, el sistema tiene que
> rechazar una tasa por encima del tope legal y avisar cuando la vigente está vencida.
>
> Lo que sigue sin resolverse y **no podemos suponer**: cuál es exactamente la tasa aplicable a
> propiedad horizontal y su tope según la Ley 675. Ver
> [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md) §3 quinquies.

### Entidades de multas

> ✅ **Implementadas** (CU-A-22, CU-A-23, CU-R-29). Salieron del alcance que pidió Mary el
> 2026-08-27: el administrador debe poder cobrar **multas**, y antes definir cuáles existen.
>
> Aquel encargo decía «cuotas adicionales **y** multas». **Las cuotas adicionales no
> sobrevivieron**: el 2026-09-09 Mary aclaró que son lo mismo que las extraordinarias, así que
> `TipoCuota` nunca ganó el valor `'adicional'` y CU-A-24 se retiró (RN-73).

`TipoCuota` quedó en `'ordinaria' | 'extraordinaria' | 'interes' | 'sancion'`. Una multa
impuesta **no es una entidad nueva en la cartera**: es una `Cuota` con su tipo, así que entra
sola en el saldo (RN-03), en la imputación por antigüedad (RN-06), en la mora (RN-71) y en el
estado de cuenta del residente, sin tocar nada de eso.

### ConceptoSancion — el catálogo de multas

El subnivel que pidió Mary: el administrador define **qué multas existen** en su copropiedad
antes de poder imponer ninguna.

| Campo | Tipo | Notas |
|---|---|---|
| `copropiedadId` | string | RN-01 |
| `nombre` | string | «Ruido fuera de horario», «Mascota sin correa» |
| `descripcion` | string | Qué conducta se sanciona |
| `valor` | number | **Fijo, el que fija el documento.** No se ajusta al imponer (Mary, 2026-09-09) — se copia tal cual (RN-37, RN-49) |
| `origen` | `'reglamento' \| 'manual' \| 'asamblea' \| 'otro'` | **Qué la autoriza. Obligatorio** (RN-38) |
| `referencia` | string | El artículo del reglamento o del manual, la fecha del acta, o dónde lo diga el otro documento |
| `documento` | string? | **Solo con `origen: 'otro'`: cuál es el documento. Sin esto no se crea** |
| `actaId` | string? | El acta que la aprobó, cuando el origen es una asamblea del sistema |
| `activo` | boolean | Se desactiva, **no se borra**: las multas ya impuestas lo referencian (RN-40) |
| `inactivoDesde` | FechaISO? | Desde cuándo quedó inhabilitado |

**No lleva `justificacion`**, a diferencia de la cuota extraordinaria. Ahí la justificación
explica **para qué** se aprobó el cobro, que es un dato que no está en ningún otro campo; aquí
el «para qué» ya es la descripción de la conducta, y el respaldo es `origen` + `referencia`.
Un campo de prosa que repite lo que las columnas dicen se llena con lo primero que se ocurra.

> **Una multa solo existe si la contempla el reglamento, el manual de convivencia, un acta o
> un documento nombrado** (Mary, 2026-08-27 y 2026-09-08). No es un cobro que el administrador
> pueda inventar: por eso `origen` y `referencia` no son opcionales. Es la misma estructura que
> `TasaInteres`, y por la misma razón.

### Reincidencia — lo que pasa si la conducta se repite

> Campo opcional de `ConceptoSancion`. **Que sea opcional es la regla entera.**

| Campo | Tipo | Notas |
|---|---|---|
| `valor` | number | Valor a partir de la segunda vez. Tiene que ser mayor que el base |
| `origen` | `OrigenRespaldo` | **Su propio respaldo**, no el de la multa base |
| `referencia` | string | Dónde lo dice |
| `documento` | string? | Solo con `origen: 'otro'` |

> **El aumento necesita su propio respaldo** (Mary, 2026-09-09: *«la multa por reincidencia
> debe estar avalada por la asamblea, reglamento de propiedad horizontal, etc.»*). Agravar es
> sancionar más duro, así que pasa el mismo examen que la multa base y por la misma razón
> (RN-38).
>
> **Y no hereda la cita de la multa base**: es normal que el reglamento fije la multa y una
> asamblea posterior agrave la repetición. Si heredara, el expediente diría que el aumento
> sale de un artículo que no lo menciona.

### Sancion — el expediente sancionatorio

> ✅ **Implementada** (CU-A-23, CU-R-29). Dejó de ser propuesta el 2026-09-09, cuando Mary
> cerró la pregunta que la bloqueaba: *«el debido proceso ya está reglamentado»*.

| Campo | Tipo | Notas |
|---|---|---|
| `conceptoId` | string | Del catálogo (RN-38) |
| `concepto`, `valor` | string, number | **Copiados al imponer**, como el coeficiente (RN-37): si mañana el catálogo cambia, el expediente sigue diciendo por qué y por cuánto se sancionó |
| `respaldo` | string | **La norma, copiada al imponer**: «Manual de convivencia · Artículo 14, numeral 3». Se muestra en la cabecera del expediente, en las dos caras — es la mitad comprobable de la multa (RN-38) |
| `reincidencia` | boolean? | Si se impuso con el valor agravado. **Se guarda, no se recalcula**: mañana la unidad puede tener más sanciones firmes, y el expediente tiene que seguir diciendo que era la segunda vez cuando se impuso (RN-72) |
| `unidadId` | string | A quién se le impone |
| `hechos` | string | Qué pasó, cuándo y dónde. Es lo único que el copropietario puede controvertir |
| `estado` | `'notificada' \| 'en_estudio' \| 'resuelta' \| 'impugnada' \| 'firme' \| 'archivada'` | Seis etapas, cada una con un turno (RN-69) |
| `radicado` | string | `SAN-<año>-<consecutivo>` (RN-36) |
| `limiteDescargos` | fecha ISO | **Copiado al imponer** desde `Copropiedad.diasDescargos` |
| `limiteImpugnacion` | fecha ISO? | Copiado al resolver, desde `Copropiedad.diasImpugnacion` |
| `motivo` | string? | La motivación de la decisión |
| `cuotaId` | string? | La cuota que genera, **solo al quedar firme** (RN-39) |
| `actuaciones` | `ActuacionSancion[]` | La línea de tiempo, en orden de ocurrencia |
| `impuestaPor`, `fechaImposicion` | string, fecha ISO | |

### ActuacionSancion — cada cosa que pasó en el expediente

| Campo | Tipo | Notas |
|---|---|---|
| `fecha` | fecha ISO completa | |
| `autor` | `'administracion' \| 'copropietario'` | Quién actuó |
| `personaId` | string? | Quién en concreto |
| `titulo` | string | «Presentó descargos», «Se decidió sancionar» |
| `texto` | string? | El contenido: los descargos, la motivación, la impugnación |

> **Las actuaciones no se editan ni se borran: se agregan.** Un expediente es una secuencia, y
> lo que se revisa si la multa se controvierte es exactamente esa secuencia — si se notificó,
> si hubo plazo, si lo oyeron y si pudo impugnar. Por eso las dos caras de la app —consola y
> app del residente— **leen el mismo expediente en el mismo orden**: el día que discutan, tiene
> que haber un documento común sobre el cual discutir. Lo que cambia entre las dos pantallas es
> **qué se puede hacer**, no **qué se ve**.

> ⚠️ **Una multa no es un cobro cualquiera.** La Ley 675 de 2001 exige **debido proceso** antes
> de sancionar. Por eso la cuota nace en **un solo sitio del sistema** —`darFirmezaSancion`—
> y no hay ningún camino de la imposición a la cartera que se lo salte (RN-39).

### Entidades del módulo de asambleas y documentos

> **Propuestas, no implementadas.** Salen del alcance declarado el 2026-08-26
> ([`12-levantamiento-pendiente.md` §0](./12-levantamiento-pendiente.md)). Los campos
> marcados **(?)** dependen de preguntas todavía abiertas (§3 bis y §3 ter).

### Asamblea
| Campo | Tipo | Notas |
|---|---|---|
| `copropiedadId` | string | RN-01 |
| `tipo` | `'ordinaria' \| 'extraordinaria'` | |
| `numeroConvocatoria` | number | 1 = primera convocatoria, 2 = segunda **(?)** |
| `fechaHora` | fecha ISO completa | |
| `modalidad` | `'presencial' \| 'virtual' \| 'mixta'` | **Es el punto de partida** (ADR-0007): decide qué se exige al convocar y qué ve el copropietario |
| `numeroConvocatoria` | `1 \| 2` | **No es administrativo: cambia el quórum.** En segunda, sesiona cualquier número plural sea cual sea el coeficiente (art. 41, RN-28) |
| `lugar` / `enlaceTransmision` | string? | Según modalidad: presencial exige lugar, virtual exige enlace, mixta los dos. El enlace es el de **Zoom o Meet** — Idiky no transmite (ADR-0007) |
| `ordenDelDia` | `PuntoOrdenDelDia[]` | |
| `estado` | `'convocada' \| 'instalada' \| 'cerrada' \| 'cancelada' \| 'no_instalada'` | Nunca se borra |
| `quorumMinimo` | number | Porcentaje de coeficientes exigido (RN-28) **(?)** |
| `instaladaEn` / `cerradaEn` | fecha ISO? | |
| `convocatoriaDocumentoId` | string? | El PDF de la citación |

### PuntoOrdenDelDia
`id`, `orden` (number), `titulo`, `descripcion`, `seVota` (boolean), `estado`
(`'pendiente' | 'en_curso' | 'tratado'`).

### Asistencia
`asambleaId`, `unidadId`, `personaId`, `tipo` (`'presencial' | 'virtual'`),
`coeficiente` (**copiado al momento de registrar**, RN-37), `registradaEn`.

> El coeficiente se copia, no se referencia: si mañana cambia (CU-A-21), el quórum de una
> asamblea pasada debe seguir siendo el que fue.

### Poder
| Campo | Tipo | Notas |
|---|---|---|
| `asambleaId` | string | El poder es por asamblea (RN-31) |
| `unidadId` | string | Unidad representada |
| `otorganteId` / `apoderadoId` | string | Personas |
| `coeficiente` | number | Copiado al otorgarse (RN-37) |
| `estado` | `'otorgado' \| 'aceptado' \| 'rechazado' \| 'revocado' \| 'vencido'` | Nunca se borra |
| `soporte` | `'digital' \| 'fisico'` | Digital = otorgado en la app; físico = registrado por el administrador |
| `documentoId` | string? | El PDF del poder **(?)** |
| `validadoPor` / `validadoEn` | string? / fecha ISO? | CU-A-19 |
| `motivoRechazo` | string? | |

### Asistencia — quién estuvo, y con cuánto peso

> ✅ **Implementada** (ADR-0007). Entró el 2026-09-10, y conviene decir por qué se pudo:
> **registrar quién asistió y sumar coeficientes no exige saber cuánto quórum se necesita.**
> Son dos cosas distintas, y la segunda quedó resuelta el mismo día contra la norma (RN-28).

| Campo | Tipo | Notas |
|---|---|---|
| `asambleaId` | string | |
| `unidadId` | string | **Asiste la unidad, no la persona**: dos copropietarios del mismo apartamento no suman dos veces (igual que el voto, RN-27) |
| `personaId` | string | Quién marcó por la unidad. Va al acta |
| `forma` | `'presencial' \| 'virtual'` | **Pesan igual** (RN-75): la suma de coeficientes es una sola. Se lleva el reparto por separado porque **el acta lo exige** (art. 47), no porque una cuente menos |
| `coeficiente` | number | **Copiado al marcar** (RN-37): si el coeficiente cambia después, el acta de esta asamblea sigue diciendo con cuánto se contó |
| `registradaEn` | fecha ISO completa | |

> **La lista de asistentes de Zoom no reemplaza esto.** No conoce unidades ni coeficientes, y
> el quórum se mide en coeficientes (RN-28). Quien entra por el enlace **también** marca
> asistencia en Idiky, y es esa la que cuenta.
>
> **Lo virtual pesa lo mismo que lo presencial** (RN-75, Mary 2026-09-10). No es solo una
> decisión de producto: la Ley 675 art. 42 admite la reunión no presencial *«de conformidad con
> el quórum requerido para el respectivo caso»* —el mismo quórum— y el Decreto 398 de 2020
> art. 1 lo dice para las mixtas. Por eso `coeficiente` es **una sola suma**.

### Poder — quién representa a una unidad

> ✅ **Implementado** (CU-A-19, 2026-09-10). **La asamblea es de propietarios, y el poder es lo
> que deja entrar a quien no lo es** (Mary: *«puede entrar un externo si tiene poder»*).

| Campo | Tipo | Notas |
|---|---|---|
| `asambleaId` | string | Un poder vale para **una** asamblea |
| `unidadId` | string | La unidad representada. **El coeficiente es de ella**, no del apoderado |
| `otorgadoPor` | string | El propietario. **No se pregunta: se deriva** de la unidad (RN-51) |
| `apoderadoId` | string | El apoderado, **como persona del sistema** |
| `origen` | `'papel' \| 'app'` | **Qué lo respalda.** Ver abajo |
| `soporte` | `Soporte?` | Solo con `papel`: el documento firmado, fotografiado (ADR-0009) |
| `documentoId` | string? | Solo con `app`: el documento que emitió Idiky (RN-36, ADR-0006) |
| `registradoPor`, `registradoEn` | string, fecha ISO | El administrador (papel) o el propietario (app). **Darlo de alta es validarlo** en los dos casos: quien lo hace es quien tiene la potestad |
| `revocadoEn` | fecha ISO? | Presente = ya no representa. **No se borra** (RN-61) |

**El usuario temporal de asamblea.** Si el apoderado no existe, se le crea la `Persona` al
registrar el poder (Mary, 2026-09-10). Si su documento ya está, **se reutiliza** — la misma
regla del registro de personas (RN-61): un documento es una persona, no una fila por
formulario.

> **«Temporal» no es un campo ni un estado**, y esa es la parte bonita: es que **su única
> vinculación con la copropiedad es este poder**, y el poder muere con la asamblea. Lo que
> caduca por construcción no hay que acordarse de apagarlo. Un apoderado no tiene `Residencia`,
> no paga cuota, no aparece en la portería.

**Dos puertas, y lo que cambia es qué respalda el poder** (Mary, 2026-09-10). No compiten:

| | `papel` | `app` |
|---|---|---|
| Quién lo da de alta | El administrador | **El propietario, desde su teléfono** |
| Qué lo respalda | La firma del documento adjunto | **Su autenticación**: es su voto y lo está cediendo él |
| Qué guarda Idiky | La foto del papel (ADR-0009) | Un `Documento` con consecutivo y código (RN-36) |

El camino de papel **tiene que existir siempre**: un poder ante notario se produce fuera de
Idiky y la app no puede exigirle al mundo que use la app. El de la app existe porque no hay
razón para obligar a imprimir algo cuando quien lo otorga ya está autenticado.

> **Lo que sigue abierto es jurídico, no técnico:** si la ley exige documento escrito y
> firmado, la puerta `app` no basta por sí sola (§3 bis). Y su PDF espera al backend, como
> todos los documentos formales (ADR-0006): el demo emite el registro y lo muestra en pantalla,
> **sin fingir una descarga**.

**Y el poder decide quién vota.** Mientras la unidad esté representada, **el propietario no
vota** (RN-29, RN-30): serían dos personas con derecho al mismo voto y ganaría quien llegue
primero, que es justo lo que un poder resuelve. Si cambia de opinión, revoca y vota él. Se
comprueba en el repositorio, no solo escondiendo el botón (T-16).

### Acta — Ley 675 de 2001, artículo 47

> ✅ **Implementada** (CU-A-20, 2026-09-10). **Casi todo lo que la ley exige ya estaba
> registrado.**

El artículo 47 pide que el acta indique **si la reunión fue ordinaria o extraordinaria**, **la
forma de la convocatoria**, el **orden del día**, el **nombre y la calidad de los asistentes con
su unidad privada y su respectivo coeficiente**, y **los votos emitidos en cada caso**. Idiky
tiene las cinco cosas, así que el acta **no las copia: las lee**.

| Campo | Tipo | Notas |
|---|---|---|
| `asambleaId` | string | De la que da fe |
| `presidenteId`, `secretarioId` | string? | **Quienes la firman** (art. 47). Los elige la asamblea, así que no viven en `Asamblea`: al convocar todavía no se sabe |
| `desarrollo` | string | **Lo único que el sistema no puede saber**: intervenciones, proposiciones, compromisos |
| `estado` | `'borrador' \| 'aprobada'` | Aprobada, **no se edita** (RN-35). El estado que se **muestra** son tres, y se deriva: `estadoActa` intercala `en_verificacion` |
| `verificadores` | string[] | La **comisión verificadora**, si la hay. **Puede estar vacía**: la ley no la exige (RN-76) |
| `verificaciones` | `VerificacionActa[]` | Quién revisó, cuándo y qué anotó |
| `editadaEn` | fecha ISO? | Existe para una sola cosa: **una revisión vale sobre el texto que se revisó** (RN-76) |
| `limiteVerificacion` | fecha ISO | El término del reglamento y, en su defecto, **20 días hábiles** (art. 47). Copiado al generarla |
| `documentoId` | string? | Su consecutivo y código, al aprobar (RN-36) |
| `aclaraActaId` | string? | Si aclara otra: la original **no se toca** |

> **Por qué no se congela una copia al aprobar.** Porque no hace falta: una asamblea cerrada no
> admite asistencia nueva ni votos nuevos (RN-34), y **cada asistencia y cada voto guardan su
> propio coeficiente, copiado en su momento** (RN-37). Si mañana cambia el coeficiente de una
> unidad, el acta sigue diciendo con cuánto se contó. Lo que se congela es **el texto y el
> estado**, que es lo único que una persona podría cambiar después.
>
> Ahí se cobra una decisión vieja: copiar el coeficiente al marcar asistencia parecía redundante
> y es lo que hace que el acta valga.

> **El acta se niega a reportar decisiones sin quórum.** Si no se verificó, dice que la asamblea
> **no quedó habilitada para adoptar decisiones válidas** y ningún punto sale «aprobado». Un
> acta que constata que faltó quórum y a renglón seguido reporta aprobaciones se contradice a sí
> misma — y es exactamente la que se anula.

### Votacion
| Campo | Tipo | Notas |
|---|---|---|
| `asambleaId` / `puntoId` | string | |
| `pregunta` | string | |
| `opciones` | `{ id, texto }[]` | Mínimo dos |
| `mayoriaExigida` | `'simple' \| 'calificada' \| 'unanimidad'` | **(?)** |
| `estado` | `'preparada' \| 'abierta' \| 'cerrada' \| 'anulada'` | RN-34 |
| `abiertaEn` / `cerradaEn` | fecha ISO? | |
| `resultado` | `ResultadoVotacion?` | Se calcula al cerrar (CU-S-08) |
| `motivoAnulacion` | string? | |

### Voto
`votacionId`, `unidadId`, `opcionId`, `emitidoPor` (personaId), `porPoder` (boolean),
`coeficiente` (copiado, RN-37), `fecha`.

> **Un voto por unidad y por votación** (RN-29). Si una persona representa cinco unidades,
> se registran cinco votos, no uno con peso quíntuple: el acta debe poder decir qué unidad
> votó qué.

### ResultadoVotacion
`porOpcion[]` (`opcionId`, `coeficiente`, `unidades`), `coeficienteTotalVotante`,
`coeficienteAbstenido`, `aprobada` (boolean), `consolidadoEn`.

### Acta
`asambleaId`, `numero` (consecutivo, RN-36), `estado`
(`'borrador' | 'en_revision' | 'aprobada' | 'aclarada'`), `contenidoGenerado` (armado por el
sistema), `contenidoManual` (lo que agrega el administrador), `aprobadaEn?`,
`documentoId?`, `actaAclaratoriaDe?` (referencia a otra acta, RN-35).

### Documento
Entidad transversal para **todo PDF formal** — paz y salvo, estado de cuenta, comprobante,
convocatoria, poder y acta.

| Campo | Tipo | Notas |
|---|---|---|
| `tipo` | `'paz_y_salvo' \| 'estado_cuenta' \| 'comprobante' \| 'convocatoria' \| 'poder' \| 'acta'` | |
| `numero` | string | Consecutivo por tipo (RN-36) |
| `copropiedadId` | string | RN-01 |
| `unidadId` | string? | Cuando aplica a una unidad |
| `emitidoEn` | fecha ISO | |
| `vigenteHasta` | fecha ISO? | Paz y salvo **(?)** |
| `estado` | `'vigente' \| 'anulado'` | **Nunca se borra** (O3): un anulado sigue existiendo y la verificación lo dice |
| `codigoVerificacion` | string | Aleatorio, va impreso junto al número. Con los dos, un tercero verifica el documento **sin la app** ([ADR-0006](./adr/0006-documentos-formales.md)) |
| `huella` | string | SHA-256 del archivo generado. El archivo **se guarda, no se regenera**: afirma un estado a una fecha |
| `archivo` | string | Referencia al PDF en el almacenamiento de objetos. Vacío mientras no exista backend |

## 3. Reglas de negocio

Referenciadas desde los casos de uso. **Si cambias una regla, actualiza este listado.**

| ID | Regla | Dónde se implementa (demo) |
|---|---|---|
| RN-01 | Todo dato pertenece a una copropiedad; nunca se mezclan copropiedades. | `datos/repositorio.ts` |
| RN-02 | El rol efectivo del usuario se resuelve por la unidad activa. | `estado/SesionContext.tsx` |
| RN-03 | El saldo de una unidad = suma de cuotas `pendiente` + `vencida`. | `dominio/reglas.ts` |
| RN-04 | Una cuota es `vencida` si su vencimiento es anterior a hoy y no está pagada. | `dominio/reglas.ts` |
| RN-05 | Las cuotas extraordinarias se prorratean por coeficiente. | `dominio/reglas.ts` |
| RN-06 | Un pago se imputa primero a la deuda más antigua. | `dominio/reglas.ts` |
| RN-07 | Todo pago genera un comprobante con consecutivo único. | `datos/repositorio.ts` |
| RN-08 | Una unidad en mora no puede reservar zonas comunes. | `dominio/reglas.ts` |
| RN-09 | No puede haber dos reservas activas de la misma zona en la misma franja. | `dominio/reglas.ts` |
| RN-10 | La reserva exige la anticipación mínima de la zona. | `dominio/reglas.ts` |
| RN-11 | Cancelar con < 24 h puede acarrear sanción. | *pendiente* |
| RN-12 | Radicado PQRS: `PQRS-<AAAA>-<NNNN>`, consecutivo por copropiedad. | `datos/repositorio.ts` |
| RN-13 | SLA de PQRS: 15 días calendario. | `dominio/reglas.ts` |
| RN-14 | Una PQRS resuelta se cierra sola a los 5 días. | *pendiente* |
| RN-15 | Los comunicados `urgente` se destacan y no se ocultan. | `features/residente/InicioPage.tsx` |
| RN-16 | El código de visitante solo vale **dentro** de su vigencia: antes de `vigenciaDesde` está `programado`, después de `vigenciaHasta` está `vencido`. | `dominio/reglas.ts` |
| RN-17 | El código es de un solo uso salvo que sea recurrente. | *parcial* |
| RN-18 | El % de recaudo se calcula sobre las cuotas del periodo actual. | `dominio/reglas.ts` |
| RN-19 | La suma de coeficientes de una copropiedad es 100 %. | validado en la semilla |
| RN-20 | Toda unidad tiene al menos un propietario. | *pendiente* |
| RN-21 | Los días de mora se cuentan desde la cuota vencida más antigua. | `dominio/reglas.ts` |
| RN-22 | No se generan dos veces las cuotas ordinarias del mismo periodo. | `datos/repositorio.ts` |
| RN-23 | Vencimiento por defecto: día 10 del periodo. | `datos/repositorio.ts` |
| RN-24 | La primera respuesta de la administración pasa la PQRS a `en_gestion`. | `datos/repositorio.ts` |
| RN-25 | La correspondencia entregada no se edita. | `features/admin/CorrespondenciaAdminPage.tsx` |
| RN-26 | El paz y salvo solo se emite si el saldo de la unidad es cero, **incluida la cuota ya facturada del periodo aunque todavía no haya vencido**. Estar sin mora no basta. | `datos/repositorio.ts` (`emitirPazYSalvo`) |
| RN-27 | El voto en asamblea se pondera por el coeficiente de la unidad. **Confirmada por el equipo el 2026-08-26.** | `dominio/reglas.ts` (`pesoDelVoto`) |
| RN-28 | **Quórum: número plural de propietarios + más de la mitad de los coeficientes** (Ley 675 de 2001, art. 45, **verificada contra la norma el 2026-09-10**). Tres precisiones que de memoria se repiten mal: **(1) son dos condiciones**, y «número plural» significa mínimo dos propietarios — una sola unidad con el 60 % del edificio **no hace quórum**; **(2) se supera la mitad, no se alcanza**: con 50 exacto no hay, con 50,5 sí, así que «el 51 %» deja fuera asambleas válidas; **(3) el 50 + 1 no es esto**, es el umbral de la *decisión* (RN-74). Y la válvula de escape del art. 41: si la primera convocatoria no pudo sesionar, **la segunda sesiona con cualquier número plural, sea cual sea el coeficiente** — sin eso una copropiedad donde la gente no va quedaría paralizada. El piso es legal y **el reglamento solo puede subirlo** (`Copropiedad.quorumMinimo`). **La unidad de cuenta es la unidad, no la persona** (Mary, 2026-09-10: *«el quórum cuenta por unidad; pueden participar 3 propietarios pero solo es un voto para el quórum»*). Tres copropietarios del mismo apartamento pueden entrar los tres, y el apartamento cuenta **una vez**. El peso de esa cuenta es su coeficiente, presentes **y representados** (RN-30). La forma de asistir **no cambia el peso** (RN-75), así que la suma es una sola. | `dominio/reglas.ts` (`hayQuorum`, `faltaParaQuorum`) + `resumenAsistencia` |
| RN-29 | **Un voto por unidad y por votación** — confirmado por Mary el 2026-09-10: *«igual sucede con las votaciones de cada uno de los puntos: es un voto por unidad»*. Es la misma regla que RN-28 aplicada al punto: la unidad de cuenta es la unidad. Quien representa N unidades emite N votos (RN-30). | `dominio/reglas.ts` (`yaVoto`) + `repositorio.ts` (`emitirVoto` lo rechaza); **los poderes siguen pendientes** |
| RN-30 | **El apoderado no tiene que ser copropietario** (Mary, 2026-09-10: *«puede entrar un externo si tiene poder»*): un hijo, un abogado, alguien sin ninguna relación con el conjunto. La asamblea es de propietarios, y el poder es lo que deja entrar a quien no lo es. El apoderado se da de alta como **usuario temporal de asamblea** al registrar el poder, y el poder **lleva el papel adjunto**. **Una unidad, un representante** (RN-28, RN-29): no se acumulan dos poderes que se contradigan. **Lo que falta, y no impide el registro pero sí el control**: el **tope** de unidades y coeficientes que un apoderado puede acumular **(? — cifra por confirmar en la Ley 675)** y las **inhabilidades** (administrador, empleados, consejo). Mientras tanto la app **muestra el acumulado por apoderado y no rechaza a nadie**: inventar un tope sería peor que no tenerlo, porque diría «cumple» sin saber con qué. | `dominio/reglas.ts` (`acumuladoPorApoderado`) + `repositorio.ts` (`registrarPoder`) · **falta el tope** |
| RN-74 | **Las dos mayorías se miden sobre bases distintas, y confundirlas anula la votación** (Ley 675, arts. 45 y 46, verificada el 2026-09-10). La **simple** es «la mitad más uno de los coeficientes **representados en la respectiva sesión**»: la base es lo que asistió. La **calificada** es «el setenta por ciento (70 %) de los coeficientes **que integran el edificio**»: aquí la base sí es el edificio entero, y por eso es tan difícil — es a propósito. La calificada **se alcanza** (≥ 70 %); la simple **se supera** (> mitad). Exige calificada, entre otras: cambiar la destinación de bienes comunes, una extraordinaria que supere cuatro veces las expensas mensuales necesarias, gastos distintos de los necesarios, dar un bien común al uso exclusivo de una unidad, y la reconstrucción. **Ninguna decisión puede exigir más del 70 %**, salvo la extinción de la propiedad horizontal. | `dominio/reglas.ts` (`resultadoVotacion`, `mayoriaDelPunto`) |
| RN-75 | **La forma de asistir no cambia lo que pesa la unidad** (Mary, 2026-09-10: *«la asistencia virtual pesa igual que la presencial»*). No es solo criterio de producto: la **Ley 675 art. 42** admite la reunión no presencial *«de conformidad con **el quórum requerido para el respectivo caso**»* —el mismo quórum, no uno propio— y el **Decreto 398 de 2020, art. 1** lo escribe para las mixtas: *«Las disposiciones legales y estatutarias sobre convocatoria, quórum y mayorías de las reuniones presenciales serán igualmente aplicables a las reuniones no presenciales… y a las reuniones mixtas»*. Por eso `resumenAsistencia.coeficiente` es **una sola suma**. El reparto presencial/virtual se sigue llevando **para el acta** (art. 47 exige decir quién asistió y en qué calidad), no porque una forma cuente menos. La distinción que sí cambia si suma no es dónde estaba la persona sino **si es propietario o apoderado** (RN-51, RN-30). | `dominio/reglas.ts` (`resumenAsistencia`) + `componentes/HojaActa.tsx` |
| RN-76 | **La comisión verificadora del acta es opcional** (Mary, 2026-09-10: *«déjala como una opción para que el administrador seleccione, a veces hay revisión»*). La **Ley 675 no la exige**: el art. 47 pide presidente y secretario y no menciona ninguna comisión — la designa la asamblea o la impone el reglamento. De ahí la forma: `Acta.verificadores` es **una lista que puede estar vacía**. Vacía, el acta se aprueba como siempre; con gente, no se aprueba hasta que **todos** revisen. Y **una revisión vale sobre el texto que se revisó**: si el acta se edita después, esa revisión queda sin efecto y hay que volver a pedirla — lo contrario permitiría recoger las firmas y cambiar el texto después, que es el fraude que una comisión existe para impedir. **No se borra nada** (RN-61): la revisión queda con su fecha y el acta muestra que el texto cambió luego. El estado que se muestra —`borrador`, `en_verificacion`, `aprobada`— **se deriva, no se guarda**. | `dominio/reglas.ts` (`actaTieneComision`, `verificacionVigente`, `verificadoresPendientes`, `actaVerificada`, `estadoActa`) |
| RN-31 | El poder vale para **una sola asamblea** y vence al cerrarse. Está en el modelo, no en una comprobación: `Poder.asambleaId` lo ata a una, y `registrarPoder`/`otorgarPoder` rechazan una asamblea cerrada. Es lo mismo que hace temporal al usuario de asamblea (RN-30). | `dominio/tipos.ts` (`Poder.asambleaId`) + `repositorio.ts` |
| RN-32 | **Quien otorgó poder no puede votar esa unidad directamente.** Serían dos personas con derecho al mismo voto, ganando quien llegue primero — que es justo lo que un poder resuelve. Se comprueba en el repositorio; en la pantalla las opciones quedan **deshabilitadas, no escondidas** (Mary, 2026-09-10), para que quien dio poder siga viendo qué se decide en su unidad. | `repositorio.ts` (`emitirVoto`) |
| RN-33 | La citación se emite con la antelación mínima del reglamento. **(?)** | *pendiente* |
| RN-34 | Una votación cerrada no se reabre ni se modifica; se anula y se repite. | `dominio/reglas.ts` (`votacionRecibeVotos`) |
| RN-35 | **El acta se construye desde los datos registrados; aprobada, no se edita — se aclara con un acta nueva.** Ley 675 art. 47, verificada el 2026-09-10: la firman **presidente y secretario**, y hay **20 días hábiles** (o el término del reglamento) para verificarla y ponerla a disposición de los residentes. «A disposición» es literal: el copropietario la lee desde su app. Y **sin quórum el acta no reporta aprobaciones**, porque sin quórum no hubo decisiones válidas. La comisión verificadora, cuando la hay, se suma a lo que falta antes de aprobar (RN-76). | `dominio/reglas.ts` (`puedeGenerarActa`, `faltaEnActa`, `actaCongelada`, `limiteVerificacionActa`) + `componentes/HojaActa.tsx` |
| RN-36 | Todo documento formal lleva **consecutivo único por tipo** y un **código de verificación** aleatorio, y se comprueba desde fuera de la app sin exponer datos personales (ADR-0006). | `datos/repositorio.ts` (paz y salvo); falta la página pública de verificación |
| RN-37 | El coeficiente es histórico: se copia al usarlo y cambiarlo no altera asambleas ni votaciones cerradas. | `datos/repositorio.ts` (`emitirVoto` copia el coeficiente) |
| RN-38 | Solo se puede imponer una multa que exista en el catálogo, y un concepto solo entra al catálogo si lo contempla **el reglamento de propiedad horizontal, el manual de convivencia, un acta de asamblea, u otro documento que haya que nombrar** (Mary, 2026-09-08). **El administrador no define las multas**: las define la asamblea o ya están en esos documentos; él las parametriza (RN-49) y después **las aplica** (Mary, 2026-09-09: *«la multa la impone el administrador de acuerdo con las multas aprobadas en asamblea, en el reglamento de propiedad horizontal, etc.»*). Por eso la norma **se copia al expediente** (`Sancion.respaldo`) y se muestra al lado de los hechos: una multa se comprueba por sus dos mitades, y sin la cita «te multaron por ruido» es la palabra del administrador contra la del copropietario. El reglamento y el manual se citan por artículo; el acta, por fecha; **`otro` exige escribir cuál es el documento** — sin eso sería la puerta por donde se escapa el respaldo entero. | `dominio/reglas.ts` (`respaldoCompleto`) + `repositorio.ts` |
| RN-39 | Una multa genera cuota **solo cuando queda firme**, nunca al imponerla. Y queda firme por dos caminos: **se venció el plazo de impugnación sin que impugnara**, o **se resolvió la impugnación**. En el código eso es literal: `darFirmezaSancion` es **el único sitio del sistema** donde nace una `Cuota` de tipo `sancion`. Es lo que separa una sanción de un cobro. | `repositorio.ts` (`darFirmezaSancion`) + `dominio/reglas.ts` (`puedeQuedarEnFirme`) |
| RN-40 | Un concepto del catálogo no se borra: **se inhabilita**, porque las multas impuestas lo referencian. Los inhabilitados **siguen a la vista**, en su propia sección: esconderlos haría creer que se borraron. Mismo verbo que con las personas (RN-61), porque es lo mismo que pasa (Mary, 2026-09-09). | `repositorio.ts` (`cambiarEstadoConceptoSancion`) |
| ~~RN-41~~ | ⛔ **Retirada el 2026-09-09.** Decía que una cuota adicional exige concepto y valor explícitos y no se prorratea por coeficiente. **La figura no existe:** *«las cuotas adicionales son lo mismo que cuotas extraordinarias»* (Mary), y la extraordinaria sí se prorratea (RN-05) y sí la aprueba la asamblea (RN-46). El número no se reutiliza. | — |
| RN-42 | El interés de mora solo se calcula si la copropiedad lo tiene activado; apagado, no se genera ninguno. | *pendiente* |
| RN-43 | La tasa la aprueba la copropiedad —su reglamento o un acta de asamblea— y el sistema exige registrar cuál. La ley solo pone el techo: una tasa por encima del tope legal se rechaza. **(? — tope por confirmar)** | *pendiente* |
| RN-44 | El interés se liquida sobre lo vencido y genera una cuota de tipo `interes`, que entra en la cartera como cualquier otra. | *pendiente* |
| RN-45 | **Todo cobro que no sea la cuota ordinaria debe apuntar a qué lo autoriza**: el reglamento o un acta de asamblea. Aplica a extraordinarias, multas e intereses. Solo la ordinaria puede ir sin respaldo — es la del mes, la que el reglamento autoriza de una vez y para siempre. | `dominio/reglas.ts` (`respaldoDeCuotaCompleto`, `respaldoCompleto`) · falta el interés (RN-43) |
| RN-46 | Una cuota **extraordinaria** exige el acta de asamblea que la aprobó. No admite la opción «reglamento»: el reglamento dice que pueden existir extraordinarias, no que **esta** se cobre. Se comprueba en el repositorio, no solo en el formulario: `generarCuotas` la rechaza sin acta. | `dominio/reglas.ts` (`respaldoDeCuotaCompleto`) + `repositorio.ts` (`generarCuotas`) |
| RN-47 | El respaldo se **justifica por escrito**: el cobro exige una justificación que cite el acta y su fecha y diga para qué se aprobó. Sin ella el cobro no se crea. **El respaldo viaja en cada cuota**, no en un encabezado aparte, porque quien reclama lo hace desde su propia línea del estado de cuenta — ahí se lee, plegado, bajo «¿Por qué se cobra?». | `repositorio.ts` (`generarCuotas`) + `features/residente/CuentaPage.tsx` |
| RN-48 | La cuota extraordinaria tiene **destinación específica**: el concepto la describe en texto libre —cada obra es distinta— pero es la destinación que aprobó el acta, y el recaudo se destina a eso. La justificación obligatoria (RN-47) es lo que la deja escrita y comprobable. | `repositorio.ts` (`generarCuotas`) |
| RN-49 | **Parametrizar la cartera es facultad exclusiva del administrador de esa copropiedad**: qué cuotas, multas e intereses existen y cuánto valen. Ningún otro rol lo hace, y la comprobación no puede vivir solo en la interfaz. **Parametrizar no es decidir**: lo que el administrador traslada al sistema lo decidieron antes el reglamento, el manual de convivencia o la asamblea (RN-38, RN-43, RN-46). **Y no toca el caso**: al imponer una multa **no puede ajustar el valor** (Mary, 2026-09-09), que se copia del catálogo tal cual. Ese es el límite exacto entre parametrizar e imponer — si el valor se moviera caso por caso, volvería a estar decidiendo la sanción. En sanciones eso no vive en la interfaz: `imponerSancion` **no recibe un valor**, así que no hay por dónde pasarlo. | *parcial* (`App.tsx` protege la ruta; `generarCuotas` no comprueba **quién** llama, aunque sí comprueba **qué** se cobra — el respaldo de la extraordinaria y el valor de la multa están cerrados en el repositorio) |
| RN-50 | **Lo que cae en la cuenta de una unidad se sigue de la parametrización y de su regla, no de una decisión caso por caso.** El interés lo liquida el sistema (RN-42, RN-44), la multa exige un concepto del catálogo y quedar firme (RN-38, RN-39), la extraordinaria sale del acta (RN-46, RN-48). | *pendiente* |
| RN-51 | **Vota el propietario de la unidad**, no quien la habita: el voto va con la propiedad, igual que la cuota. *«La asamblea es para propietarios»* (Mary, 2026-09-10), así que el arrendatario puede entrar a oír pero no suma ni vota — y la pantalla se lo dice en vez de esconderle el botón. La única forma de que vote alguien que no es el propietario es el **poder** (RN-30). | `dominio/reglas.ts` (`puedeVotar`) + `repositorio.ts` |
| RN-53 | **La cuenta de un residente nace vinculada**: existe porque alguien lo registró en una unidad. La persona la **activa**, no la crea, y quien no está vinculado no entra. **Quién lo registra depende del eslabón (RN-63)**: la administración crea propietarios, el propietario crea a los demás de su unidad. | `features/auth/` (simulado, ADR-0004) |
| RN-54 | En un **dispositivo nuevo** se exige un **código de un solo uso** además de la clave. Desde la app se paga. | `estado/acceso.ts` (simulado) |
| RN-55 | La clave es de **4 números**, no una contraseña: la app la usan adultos mayores. Lo que sostiene esa decisión es que la clave **solo sirve en un dispositivo ya probado** (RN-54) y que **los intentos se acaban**; agotados, se vuelve a exigir el código. | `estado/acceso.ts` |
| RN-56 | La **huella** reemplaza teclear la clave en el dispositivo donde se registró. Nunca crea la cuenta ni sustituye la identidad, y **solo se ofrece donde hay lector**. | `servicios/plataforma.ts` (WebAuthn) |
| RN-52 | **La portería hace lo de la entrada, y nada más**: registra y entrega correspondencia y valida visitantes. **No accede a la cartera ni a las PQRS.** Quien recibe el paquete queda registrado en él. | `dominio/reglas.ts` (`puede`) + `LayoutPorteria` |
| RN-57 | **Los soportes se le exigen a quien se queda a dormir** (Mary, 2026-09-07): residente y residente temporal aportan foto del documento y foto de la persona, y sin las dos su registro no se puede autorizar. **El visitante no lleva fotos** y se autoriza en un solo paso. No es una comodidad, es seguridad: pedirle cédula fotografiada a quien viene a almorzar es el requisito que hace que la gente deje de registrar visitas y las meta sin avisar — un trámite que se evade protege menos que uno liviano que se cumple. | `dominio/reglas.ts` (`exigeSoportes`, `soportesCompletos`) |
| RN-58 | **Los soportes los adjunta la persona registrada, desde su propio dispositivo**, con su documento y el código que le pasó quien la registró. Una foto de cédula que sube un tercero no prueba nada sobre quién la subió. | `features/auth/AdjuntarPage.tsx` |
| RN-59 | **El vínculo lo crea la autorización, no el formulario.** Quien registró mira los soportes y responde; hasta ese momento no existe ni residencia ni visitante. Autorizar es decir «los vi y es quien dice ser», y por eso deja constancia de quién y cuándo. | `dominio/reglas.ts` (`puedeAutorizar`) + `repositorio.ts` |
| RN-60 | **Quién registra a quién**: el propietario registra residentes, arrendatarios y temporales de su unidad; el arrendatario, solo visitantes; el `autorizado`, a nadie. Darle a una autorización la facultad de traer más gente la convierte en una cadena sin dueño. | `dominio/reglas.ts` (`categoriasQuePuedeRegistrar`) |
| RN-61 | **Nada se borra: se inhabilita** (Mary, 2026-09-07). **El registro y la documentación no son lo mismo**: el registro se conserva como constancia; los soportes fotográficos se guardan solo el tiempo que la normatividad permita y después se eliminan (Mary, 2026-09-07). Así esta regla y el habeas data dejan de chocar. Y **rehabilitar es volver a registrar, no deshacer**: si la persona se vincula otra vez y sus fotos ya se eliminaron, el trámite se las pide de nuevo. Un residente se desvincula cerrando el vínculo con fecha; un visitante se revoca; un registro se rechaza o se retira. Dos razones, y la segunda es la que fija el modelo: (1) el histórico es lo único que después permite responder quién vivía aquí en tal fecha, o quién autorizó a quien recibió aquel paquete; (2) **«el residente puede pasarse a vivir a otro edificio que opere Idiky»** — inhabilitar cierra el vínculo con *esta* unidad, pero la persona sigue existiendo y llega a la siguiente con su historia. Por eso `Persona` y `Residencia` son entidades distintas, y al autorizar un registro la persona **se reutiliza por documento sin limitarse a la copropiedad**. | `repositorio.ts` + `dominio/reglas.ts` (`residenciaVigente`) |
| RN-62 | **La categoría decide la vigencia.** El residente se queda hasta que lo inhabiliten; el residente temporal **exige** fecha de fin; **el visitante es de un solo día** (Mary, 2026-09-07): se registra el día en que viene, y ese día entra y sale. **Ese día puede ser futuro** —hoy, mañana o el sábado—; lo que no se admite es un rango ni un día ya pasado. «Del mismo día» significa que entrada y salida coinciden, no «solo hoy». Sin ese tope, una autorización de visitante «del 5 al 20» sería un residente temporal sin sus soportes, y por ahí se colaría justo lo que RN-57 exige a quien se queda a dormir. Es también lo que hace barato no pedirle fotos: una autorización que caduca esta misma noche no es una llave. | `dominio/reglas.ts` (`exigeVigencia`, `soloUnDia`) |
| RN-63 | **La cadena de registro: cada eslabón crea el siguiente, y solo ese.** El operador de Idiky crea al administrador de la copropiedad; el administrador, a los propietarios; el propietario, a los demás de su unidad. Corrige RN-53: la cuenta sigue naciendo vinculada, lo que cambia es **quién** la vincula. Nadie se salta un eslabón — que el administrador creara arrendatarios directamente rompería que el propietario sepa quién vive en su unidad. | `dominio/reglas.ts` (`CADENA_DE_REGISTRO`) |
| RN-64 | **Cuando un registro queda autorizado —o rechazado después de que la persona adjuntó— se le avisa por mensaje de texto** (Mary, 2026-09-07). El aviso es parte de autorizar, no algo que la interfaz recuerde hacer: vive en el repositorio. El texto cambia con la categoría, porque lo que la persona tiene que hacer después es distinto — el visitante recibe **su código para la portería**, el residente que **ya puede activar su cuenta** (CU-R-25). Sin celular no sale mensaje, y la pantalla lo dice para que quien registró avise por su cuenta. | `servicios/mensajeria.ts` + `repositorio.ts` |
| RN-65 | **Quién inhabilita depende de quién creó** (Mary, 2026-09-07): lo que registró el propietario lo inhabilita él **o la administración**; lo que registró la administración, solo ella **o quien designe con el perfil**. Es la cadena de RN-63 leída al revés — se crea hacia abajo y se inhabilita hacia arriba, nunca hacia abajo. Lo que impide, y es el punto: **un propietario no puede sacar de la unidad a un copropietario que registró la administración** — si pudiera, dos dueños del mismo apartamento tendrían cada uno el botón para borrar al otro. Los vínculos que no salieron de un registro se tratan como creados por la administración. **Falta** el modelo de perfiles para «quien designe» (T-08). | `dominio/reglas.ts` (`puedeInhabilitar`) |
| RN-66 | **No se recoge una foto de cédula sin autorización de tratamiento de datos** (Ley 1581 de 2012). La autorización es **informada** —dice quién responde, qué datos, para qué, cuánto se guardan y qué derechos tiene el titular—, **expresa** —una casilla que la persona marca, nunca premarcada— y **registrada con su versión**: guardar solo «aceptó» deja sin saber *qué* aceptó, y el día que cambie el texto no se sabría a quién volver a preguntarle. La constancia vive en el registro, que no se borra. | `dominio/consentimiento.ts` + `repositorio.ts` |
| RN-67 | **Quién ve los soportes, y qué queda cuando los ve.** Mientras se decide, quien autoriza ve las dos fotos a la vista: compararlas *es* autorizar. **Ya autorizado, abrirlas es un acto deliberado que deja constancia** de quién y cuándo (Mary, 2026-09-07: la administración puede verlas, «con registro») — no por desconfianza, sino para que el día que un titular pregunte «¿quién vio mi documento?» la respuesta exista. Pueden: la administración siempre, y quien registró a la persona. **La portería ve el rostro y nunca el documento** — *«¿cómo reconoce al que ingresa?»* (Mary): para reconocer basta una cara; el documento es tener la identidad de alguien, y suele quedar en manos de personal externo que rota. Su consulta no deja constancia individual: mirar caras es su tarea de todo el día, y registrar cada mirada sería ruido que esconde los accesos que sí importan. | `dominio/reglas.ts` (`puedeVerSoportes`, `puedeVerRostros`) |
| RN-68 | **La marca de residente** (Mary, 2026-09-07). Dice si la persona **vive** en la unidad, y es distinta del título: **al crear un propietario se ofrecen las dos opciones** —vive aquí o no—, porque puede tenerla arrendada o vacía y sigue siendo propietario (vota, recibe la cuota, registra gente). **El arrendatario y el residente temporal la traen por defecto** —uno arrienda para vivir ahí, al otro se le llama temporal porque vive ahí un tiempo— y **el visitante nace sin ella**. Decide una cosa concreta: **quién aparece en la lista de rostros de la portería** (CU-P-03), que tiene que reconocer a quien entra a diario y no a quien viene dos veces al año. **Se ve siempre al registrar y solo se cambia en el propietario**: quien registra tiene que saber qué marca va a quedar antes de crear a la persona, pero en las otras categorías no hay nada que decidir. **Y no se repite en las demás vistas**: en una lista de residentes no aporta nada. | `componentes/Registro.tsx` (`marcaResidente`) + `Residencia.reside` |
| RN-69 | **El debido proceso sancionatorio, y sus plazos, los fija el reglamento de cada copropiedad** (Mary, 2026-09-09: *«el debido proceso ya está reglamentado»*). La app no los inventa: `diasDescargos` y `diasImpugnacion` son **parámetros de la copropiedad**, no constantes del código. El expediente pasa por seis etapas y **cada una tiene un turno**: notificada y resuelta esperan al copropietario; en estudio e impugnada, a la administración; firme y archivada no esperan a nadie. Y lo que sostiene todo lo demás: **el plazo se copia al imponer**, no se lee del parámetro de hoy — si la copropiedad cambia el término mañana, los expedientes abiertos conservan el que se les notificó. Cambiar las reglas a mitad del proceso es exactamente lo que el debido proceso prohíbe. **Lo lleva el administrador, de principio a fin** (Mary, 2026-09-09: *«quien hace el debido proceso es el administrador»*): él impone y él resuelve los descargos. No es un descuido que sea la misma persona — es que **no está decidiendo sobre la norma, está aplicándola**: la conducta y el valor los fijó antes la asamblea o el reglamento (RN-38, RN-49), y lo que él resuelve es si los hechos ocurrieron. Lo que sí lo controla es que todo quede escrito y que el copropietario pueda impugnar. | `dominio/reglas.ts` (`ETAPAS_SANCION`, `puedePresentarDescargos`, `puedeImpugnar`, `puedeQuedarEnFirme`) |
| RN-70 | **Una sanción en firme no se anula** (Mary, 2026-09-09: *«una multa no se anula porque para eso existe el debido proceso»*). El momento de deshacerla es **durante** el proceso —archivándola con su motivo—, no después. Es la consecuencia de tomarse el debido proceso en serio: si la multa se pudiera anular al final, las cinco etapas serían un trámite decorativo y el copropietario no tendría por qué usarlas. Por eso el código no tiene ninguna transición que salga de `firme`, y por eso tampoco hay que responder qué pasa con una multa anulada después de pagada: no puede haberla. | `dominio/reglas.ts` (`ETAPAS_SANCION`) — `firme` no tiene salida |
| RN-71 | **La mora no distingue el origen del cobro** (Mary, 2026-09-09: *«las multas como las cuotas ordinarias o extraordinarias cuentan como mora»*). Una multa en firme y vencida bloquea reservas (RN-08) y pesa en el paz y salvo (RN-26) igual que la cuota del mes. En el código eso ya era así porque ninguna regla de mora filtra por `Cuota.tipo` — pero era un supuesto, y ahora es una decisión: **una multa que no cuenta como mora es una multa que no se cobra**. | `dominio/reglas.ts` (`estaEnMora`, `calcularSaldo`, `calcularSaldoVencido`, `diasDeMora`) |
| RN-72 | **La reincidencia también necesita respaldo** (Mary, 2026-09-09: *«la multa por reincidencia debe estar avalada por la asamblea, reglamento de propiedad horizontal, etc.»*). Es RN-38 aplicada al agravante, y tiene dos mitades. La primera: si el catálogo tiene parametrizada la reincidencia —**con su propia cita**, que puede ser un documento distinto del de la multa base—, a partir de la segunda vez se impone el valor agravado, y el expediente dice que lo es. **La segunda mitad importa igual**: si nadie la parametrizó, **la multa no sube** por muchas veces que se repita la conducta; la app no agrava por su cuenta ni «porque es obvio». Solo cuentan las sanciones **en firme**: una archivada terminó en que no hubo infracción y una abierta no ha establecido nada, así que contarlas sería agravar con hechos que nadie probó (RN-69, RN-70). **Y caduca** (Mary, 2026-09-09: *«la reincidencia caduca al año»*): un antecedente deja de agravar cuando pasa la ventana que fija el reglamento —`Copropiedad.mesesReincidencia`, parámetro por lo mismo que los plazos del debido proceso—. Una multa de hace cuatro años no dice nada sobre quien vive allí hoy. **La ventana se cuenta desde la imposición del antecedente, no desde su firmeza**, y esa es la parte que hay que mirar dos veces: si contara desde la firmeza, un proceso largo —con descargos e impugnación— alargaría la ventana, y **quien se defendió quedaría expuesto más tiempo que quien no dijo nada**. Defenderse no puede costar caro. | `dominio/reglas.ts` (`vecesSancionada`, `multaAplicable`, `restarMeses`) + `repositorio.ts` |
| RN-73 | **No hay «cuota adicional»: lo que se cobra fuera de la ordinaria es la extraordinaria** (Mary, 2026-09-09: *«las cuotas adicionales se estipulan en la asamblea de propietarios»*, y enseguida: *«me retracto, las cuotas adicionales son lo mismo que cuotas extraordinarias»*). Las dos frases dicen lo mismo por dos caminos: si lo estipula la asamblea, ya es la extraordinaria — que es la que la asamblea aprueba (RN-46), con destinación específica (RN-48) y prorrateada por coeficiente (RN-05). La regla no agrega nada al modelo; **le quita**: `TipoCuota` no gana un valor `'adicional'`, CU-A-24 se retira y RN-41 con él. Dos nombres para una figura obligan a quien los lee a preguntarse en qué se diferencian, y la respuesta era «en nada». | `dominio/tipos.ts` (`TipoCuota` se queda en cuatro) |

### RegistroPersona — el trámite de entrada de una persona (CU-R-27, CU-R-28)

Registrar a alguien **son tres actos con tres actores**, y entre uno y otro pasa tiempo real:
se registra hoy, la persona adjunta esta noche, se autoriza mañana. Por eso es una entidad y
no un formulario.

| Campo | Qué es |
|---|---|
| `categoria` | `residente`, `residente_temporal` o `visitante`. Decide la vigencia (RN-62) y qué se crea al autorizar |
| `rol` | Solo para residentes: con qué título queda vinculado (propietario o arrendatario) |
| `creadoPor` | Quién lo registró. Es también quien lo autoriza (RN-59) |
| `codigo` | Lo que la persona escribe, junto con su documento, para abrir su registro y adjuntar (RN-58) |
| `fotoDocumento`, `fotoPersona` | Los dos soportes (RN-57). Ver [ADR-0009](./adr/0009-soportes-fotograficos.md) |
| `estado` | `esperando_soportes` → `esperando_autorizacion` → `autorizado`, o bien `rechazado` / `anulado` |
| `residenciaId`, `visitanteId` | Lo que produjo al autorizarse. Uno de los dos, según la categoría |

**Las dos esperas no se pueden juntar en un «pendiente».** En `esperando_soportes` la pelota
la tiene la persona registrada; en `esperando_autorizacion`, quien la registró. Decirle
«pendiente» a los dos es la forma segura de que ninguno haga nada.

**Un registro no se borra nunca** (RN-61). Un registro rechazado es justamente el que hay que
poder consultar después.

### Mensaje — lo que sale de la copropiedad hacia afuera (RN-64)

Cuando el registro queda autorizado, la persona recibe un **mensaje de texto**. Se guarda
aunque el demo todavía no lo envíe: *un mensaje que se manda y no queda escrito es un mensaje
que después nadie puede probar que se mandó*, y «yo nunca recibí nada» es la discusión más
común de una copropiedad.

El texto lo redacta `servicios/mensajeria.ts` y no la pantalla, porque **un SMS no tiene dónde
volver a preguntar**: quien lo recibe está en la calle, sin contexto, y el mensaje tiene que
traer las tres cosas que le permiten actuar —de qué copropiedad le hablan, qué pasó y qué hace
ahora—. Escrito suelto en cada pantalla, en dos meses hay cuatro versiones y una olvida el
código.

## 3 bis. El principio del respaldo

Tres requisitos distintos —la tasa de interés, las multas y las cuotas extraordinarias—
llegaron a la misma forma, así que conviene nombrarla una vez:

> **Ningún cobro que no sea la cuota ordinaria puede existir sin apuntar a qué lo autoriza:
> el reglamento de propiedad horizontal, el manual de convivencia, un acta de asamblea —o
> cualquier otro documento, siempre que se diga cuál.**

En el modelo eso son siempre los mismos tres campos: `origen`, `actaId` y `referencia`. Los
llevan `TasaInteres`, `ConceptoSancion` y `Cuota`.

**No todos admiten las mismas opciones**, y esa es la parte que importa:

| Cobro | Respaldo válido |
|---|---|
| Cuota ordinaria | Ninguno: es el cobro base de la copropiedad |
| **Cuota extraordinaria** | **Siempre un acta de asamblea.** No admite reglamento (RN-46) |
| Multa | Reglamento, **manual de convivencia**, acta, u **otro documento nombrado** (RN-38) |
| Interés de mora | Reglamento **o** acta (RN-43) |
| Cobro adicional | **(?)** por definir |

La extraordinaria es el caso más estricto, y por dos razones. Es un cobro que no estaba
previsto y que puede ser grande, así que la única forma de imponerlo es que los copropietarios
lo hayan votado. Y además **tiene destinación específica**: la asamblea no aprueba «una
extraordinaria», aprueba una extraordinaria **para algo** —impermeabilizar la cubierta, cambiar
el ascensor—.

**El manual de convivencia es un origen aparte, no «el reglamento»** (Mary, 2026-09-08). Son
dos documentos distintos: el **reglamento de propiedad horizontal** es el constitutivo —se eleva
a escritura pública y se registra, y define coeficientes, bienes comunes y órganos—, mientras
que el **manual de convivencia** lo adopta la asamblea para regular el día a día: horarios,
mascotas, ruido, uso de zonas comunes. **En la práctica el catálogo de sanciones suele vivir en
el manual**, no en el reglamento, así que obligar a citar «reglamento» donde la conducta está en
el manual haría que la referencia no se pudiera comprobar.

Los tres son rastreables, pero se citan distinto: el reglamento y el manual por **artículo**, el
acta por **fecha**. Y el manual, aunque lo apruebe la asamblea, se cita como manual: quien
quiera verificar la multa busca el artículo, no el acta que adoptó el documento hace seis años.

**Y hay un cuarto origen, `otro`** (Mary, 2026-09-08): *«tal vez pueden existir otros documentos
que establezcan estas multas»*. Es cierto —una resolución del consejo, un reglamento interno de
una zona común, un convenio— y una lista cerrada obligaría a forzar el caso dentro de una
opción que no le corresponde, que es peor que admitirlo.

**Pero `otro` exige nombrar el documento.** Sin ese campo obligatorio sería la puerta por donde
se escapa el principio entero: bastaría marcar «otro» para no justificar nada, y el respaldo
dejaría de ser comprobable. Nombrándolo sigue siéndolo — «Resolución del consejo de
administración N.º 12 del 3 de marzo, artículo 4» se puede ir a buscar; «otro» a secas, no.

Es la misma forma de la decisión sobre el `concepto` de la extraordinaria: **el campo es
abierto, el dato no es discrecional**.

**Lo que no cambia: el administrador no decide las multas.** Las define la asamblea, o ya están
en el reglamento o en el manual (Mary, 2026-09-08). El administrador **parametriza** —traslada
al sistema lo que esos documentos dicen— y esa distinción es toda RN-49: la facultad de operar
el catálogo es suya; la de crear la sanción, no.

**El `concepto` sí es texto libre** (Mary, 2026-08-27), y tiene que serlo: el «para qué» puede
ser un proyecto de mejora de zonas comunes, la reparación de un daño del edificio, automatizar
la entrada, y no hay lista que las cubra todas. Lo que no es libre es **el hecho**: la
destinación que se escribe es la que aprobó la asamblea, no una que invente el administrador
(RN-48). El campo es abierto; el dato no es discrecional.

**El respaldo se justifica por escrito** (Mary, 2026-08-27). Los tres campos van con un cuarto,
`justificacion`, donde el administrador escribe **para qué se aprobó el cobro y en qué acta,
citando su fecha**. Sin esa justificación el cobro no se crea (RN-47).

Eso deja el principio a la vista del copropietario: en vez de un número suelto lee «aprobada en
la asamblea del 15 de marzo para impermeabilizar la cubierta».

> **Se consideró exigir el acta adjunta y se dejó para después** (Mary, 2026-08-27). La
> justificación escrita es más débil que el documento —quien la escribe puede equivocarse en la
> fecha, o citar un acta que no dice eso—, y el copropietario no puede verificarla por su
> cuenta. Se acepta a cambio de no meter en la fase 1 una capacidad que la app no tiene:
> **almacenar archivos que suben los usuarios**. Cuando exista (fase 2, ADR-0006), el adjunto
> se suma a la justificación; no la reemplaza, porque el texto sigue siendo lo que se lee de un
> vistazo en el estado de cuenta.

La consecuencia práctica: cuando un copropietario pregunte «¿por qué me cobran esto?», el
sistema siempre puede responder con un acta o un artículo, en vez de con un número suelto.

## 3 ter. Quién puede cobrar

**Parametrizar la cartera es facultad del administrador de esa copropiedad, desde su perfil**
(Mary, 2026-08-27). Vale para todo lo que se cobra: cuota ordinaria, extraordinaria, multa,
cobro adicional e interés de mora. En la app del residente no existe ninguna acción que origine
un cobro —consulta, descarga y paga— y esa asimetría es deliberada: quien debe el dinero no
puede tocar lo que debe.

Y es **el administrador de esa copropiedad**, no cualquier administrador (RN-01, y la misma
precisión que Mary hizo para la tasa de interés). Un cobro creado desde el perfil equivocado es
un cobro de otra copropiedad.

**Parametrizar no es lo mismo que cobrar**, y la palabra que usó Mary vale la pena tomarla al
pie de la letra, porque separa dos actos que hasta ahora iban juntos:

| | Qué es | Quién |
|---|---|---|
| **Parametrizar** | Definir **qué existe y cuánto vale**: el valor de la ordinaria, el catálogo de multas, la tasa de interés y si se cobra, los conceptos de cobro adicional | El administrador de la copropiedad, y **solo él** (RN-49) |
| **Que el cobro caiga en una unidad** | Que aparezca en el estado de cuenta de un apartamento concreto | **Se sigue de la parametrización y de su regla** (RN-50) |

La distinción importa porque acota la facultad del administrador. No puede decidir «a esta
unidad le cobro tanto de interés»: lo que hace es fijar la tasa, y el sistema la liquida sobre
lo vencido (RN-42, RN-44). No puede inventar una multa: la impone escogiéndola de un catálogo
que el reglamento o la asamblea autorizaron (RN-38), y solo genera cuota cuando queda firme
(RN-39). No escribe una extraordinaria: la traslada del acta (RN-46, RN-48).

Dicho de otro modo, el administrador **configura la regla; no toca el caso**. Eso es también lo
que protege al administrador —el punto que Mary planteó con el interés—: cuando el copropietario
reclama, el cobro no es una decisión suya sobre esa unidad, es la regla vigente aplicada a
todas.

> ✅ **La frontera quedó definida** (Mary, 2026-09-09): *«el administrador no puede ajustar el
> valor»*. El del catálogo es fijo, y se copia al imponer (RN-37). Es la respuesta que hace
> verdadera toda esta sección: si el valor se pudiera mover al imponer la multa, el
> administrador estaría decidiendo sobre el caso concreto y no solo configurando la regla.
>
> Y no vive en la interfaz: **`imponerSancion` no recibe un valor**, así que no hay por dónde
> pasarlo. Una regla que solo esconde un campo se salta el día que alguien llame a la función
> desde otro sitio.

> ⚠️ **Hoy esto vive solo en la interfaz.** `App.tsx` protege `/admin` con `Protegida
> rol="admin"`, pero `generarCuotas()` no recibe quién la llama ni lo comprueba: la regla es una
> puerta en la pantalla, no en los datos. En el demo no tiene consecuencia —cada quien corre su
> propia copia—, pero **es exactamente la clase de comprobación que no puede quedarse en el
> cliente** cuando haya backend: allí el servidor vuelve a verificar rol y copropiedad, sin
> confiar en que la petición venga de la consola. Queda en T-16.

## 4. Convenciones de datos

- **Fechas:** siempre ISO 8601 (`AAAA-MM-DD` o completa). Nunca formatos locales en el dato.
- **Dinero:** enteros en pesos, sin decimales. El formato se aplica solo al mostrar.
- **Identificadores:** cadenas legibles con prefijo (`uni-`, `cuo-`, `res-`, `pqr-`).
- **Nunca borrar:** los registros se anulan o cierran, no se eliminan (trazabilidad, O3).
