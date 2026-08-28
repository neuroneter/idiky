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

### Entidades de multas y cobros adicionales

> **Propuestas, no implementadas.** Salen del alcance que pidió Mary el 2026-08-27: el
> administrador debe poder cobrar **cuotas adicionales** y **multas**, y dentro de multas
> definir cuáles existen.

`TipoCuota` gana un valor: pasa a ser
`'ordinaria' | 'extraordinaria' | 'adicional' | 'interes' | 'sancion'`. Una multa impuesta y
un cobro adicional **no son entidades nuevas en la cartera**: son `Cuota` con su tipo, así que
entran solos en el saldo (RN-03), en la imputación por antigüedad (RN-06) y en el estado de
cuenta del residente, sin tocar nada de eso.

### ConceptoSancion — el catálogo de multas

El subnivel que pidió Mary: el administrador define **qué multas existen** en su copropiedad
antes de poder imponer ninguna.

| Campo | Tipo | Notas |
|---|---|---|
| `copropiedadId` | string | RN-01 |
| `nombre` | string | «Ruido fuera de horario», «Mascota sin correa» |
| `descripcion` | string | Qué conducta se sanciona |
| `valor` | number | Valor sugerido; se puede ajustar al imponerla **(?)** |
| `origen` | `'reglamento' \| 'asamblea'` | **Qué la autoriza. Obligatorio** |
| `actaId` | string? | El acta que la aprobó, cuando el origen es una asamblea |
| `referencia` | string | El artículo del reglamento, o el punto del orden del día |
| `justificacion` | string | Qué autoriza esta multa y en qué acta o artículo, con su fecha (RN-47) |
| `activo` | boolean | Se desactiva, **no se borra**: las multas ya impuestas lo referencian (O3) |

> **Una multa solo existe si el reglamento la contempla o la asamblea la aprobó**
> (Mary, 2026-08-27). No es un cobro que el administrador pueda inventar: por eso `origen` y
> `referencia` no son opcionales. Es la misma estructura que `TasaInteres`, y por la misma
> razón.

### Sancion — la multa impuesta

| Campo | Tipo | Notas |
|---|---|---|
| `conceptoId` | string | Del catálogo |
| `unidadId` | string | A quién se le impone |
| `valor` | number | Copiado al imponerla, como el coeficiente (RN-37) |
| `hechos` | string | Qué pasó, cuándo y dónde |
| `estado` | `'propuesta' \| 'notificada' \| 'en_descargos' \| 'firme' \| 'anulada'` | **(?)** — ver la advertencia de abajo |
| `cuotaId` | string? | La cuota que genera, **solo cuando queda firme** |
| `impuestaPor`, `fechaImposicion` | string, fecha ISO | |

> ⚠️ **Una multa no es un cobro cualquiera.** En Colombia la Ley 675 de 2001 exige **debido
> proceso** antes de sancionar: el copropietario tiene que ser oído. Una app que permita
> imponer una multa de un toque y mandarla directo a la cartera puede producir **multas
> jurídicamente nulas** y demandas contra la administración.
>
> Por eso `Sancion` se modela con **estados** y no como una cuota inmediata: la cuota nace solo
> cuando la sanción queda `firme`. Cuántos estados hacen falta y quién decide en cada uno **es
> una pregunta para el reglamento de la copropiedad**, no un supuesto que podamos cerrar aquí.
> Ver [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md) §3 quater.

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
| `modalidad` | `'presencial' \| 'virtual' \| 'mixta'` | **(?)** |
| `lugar` / `enlaceTransmision` | string? | Según modalidad |
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
| `estado` | `'vigente' \| 'anulado'` | **Nunca se borra** (O3) |
| `codigoVerificacion` | string? | Para validar el documento después **(?)** |

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
| RN-28 | El quórum se mide en coeficientes (presentes + representados), no en personas. | *pendiente* |
| RN-29 | Un voto por unidad y por votación; quien representa N unidades emite N votos. | `dominio/reglas.ts` (`yaVoto`); los poderes siguen pendientes |
| RN-30 | Un apoderado no puede superar el tope de coeficientes que puede representar. **(? — cifra por confirmar en la Ley 675 de 2001)** | *pendiente* |
| RN-31 | El poder vale para una sola asamblea y vence al cerrarse (CU-S-09). | *pendiente* |
| RN-32 | Quien otorgó poder no puede votar esa unidad directamente. | *pendiente* |
| RN-33 | La citación se emite con la antelación mínima del reglamento. **(?)** | *pendiente* |
| RN-34 | Una votación cerrada no se reabre ni se modifica; se anula y se repite. | `dominio/reglas.ts` (`votacionRecibeVotos`) |
| RN-35 | El acta se construye desde los datos registrados; aprobada, no se edita — se aclara con un acta nueva. | *pendiente* |
| RN-36 | Todo documento formal lleva consecutivo único por tipo y es verificable. | `datos/repositorio.ts` (paz y salvo); falta el código de verificación |
| RN-37 | El coeficiente es histórico: se copia al usarlo y cambiarlo no altera asambleas ni votaciones cerradas. | `datos/repositorio.ts` (`emitirVoto` copia el coeficiente) |
| RN-38 | Solo se puede imponer una multa que exista en el catálogo, y un concepto solo entra al catálogo si el reglamento lo contempla o una asamblea lo aprobó. | *pendiente* |
| RN-39 | Una multa genera cuota **solo cuando queda firme**, nunca al proponerla. **(? — depende del debido proceso, Ley 675)** | *pendiente* |
| RN-40 | Un concepto del catálogo no se borra: se desactiva, porque las multas impuestas lo referencian. | *pendiente* |
| RN-41 | Una cuota adicional exige concepto y valor explícitos; no se prorratea por coeficiente. | *pendiente* |
| RN-42 | El interés de mora solo se calcula si la copropiedad lo tiene activado; apagado, no se genera ninguno. | *pendiente* |
| RN-43 | La tasa la aprueba la copropiedad —su reglamento o un acta de asamblea— y el sistema exige registrar cuál. La ley solo pone el techo: una tasa por encima del tope legal se rechaza. **(? — tope por confirmar)** | *pendiente* |
| RN-44 | El interés se liquida sobre lo vencido y genera una cuota de tipo `interes`, que entra en la cartera como cualquier otra. | *pendiente* |
| RN-45 | **Todo cobro que no sea la cuota ordinaria debe apuntar a qué lo autoriza**: el reglamento o un acta de asamblea. Aplica a extraordinarias, multas, intereses y cobros adicionales. | *pendiente* |
| RN-46 | Una cuota **extraordinaria** exige el acta de asamblea que la aprobó. No admite la opción «reglamento»: siempre es acta. | *pendiente* |
| RN-47 | El respaldo se **justifica por escrito**: el cobro exige una justificación que cite el acta y su fecha y diga para qué se aprobó. Sin ella el cobro no se crea. El copropietario la lee desde su estado de cuenta. | *pendiente* |
| RN-48 | La cuota extraordinaria tiene **destinación específica**: el concepto la describe en texto libre —cada obra es distinta— pero es la destinación que aprobó el acta, y el recaudo se destina a eso. | *pendiente* |
| RN-49 | **Parametrizar la cartera es facultad exclusiva del administrador de esa copropiedad**: qué cuotas, multas e intereses existen y cuánto valen. Ningún otro rol lo hace, y la comprobación no puede vivir solo en la interfaz. | *parcial* (`App.tsx` protege la ruta; `repositorio.ts` no comprueba quién llama) |
| RN-50 | **Lo que cae en la cuenta de una unidad se sigue de la parametrización y de su regla, no de una decisión caso por caso.** El interés lo liquida el sistema (RN-42, RN-44), la multa exige un concepto del catálogo y quedar firme (RN-38, RN-39), la extraordinaria sale del acta (RN-46, RN-48). | *pendiente* |
| RN-51 | **Vota el propietario de la unidad**, no quien la habita: el voto va con la propiedad, igual que la cuota. **(? — falta definir el rol `autorizado` y el apoderado, CU-R-23)** | `dominio/reglas.ts` (`puedeVotar`) + `repositorio.ts` |
| RN-52 | **La portería hace lo de la entrada, y nada más**: registra y entrega correspondencia y valida visitantes. **No accede a la cartera ni a las PQRS.** Quien recibe el paquete queda registrado en él. | *pendiente* (falta su consola, T-08) |

## 3 bis. El principio del respaldo

Tres requisitos distintos —la tasa de interés, las multas y las cuotas extraordinarias—
llegaron a la misma forma, así que conviene nombrarla una vez:

> **Ningún cobro que no sea la cuota ordinaria puede existir sin apuntar a qué lo autoriza:
> el reglamento de la copropiedad o un acta de asamblea.**

En el modelo eso son siempre los mismos tres campos: `origen`, `actaId` y `referencia`. Los
llevan `TasaInteres`, `ConceptoSancion` y `Cuota`.

**No todos admiten las mismas opciones**, y esa es la parte que importa:

| Cobro | Respaldo válido |
|---|---|
| Cuota ordinaria | Ninguno: es el cobro base de la copropiedad |
| **Cuota extraordinaria** | **Siempre un acta de asamblea.** No admite reglamento (RN-46) |
| Multa | Reglamento **o** acta (RN-38) |
| Interés de mora | Reglamento **o** acta (RN-43) |
| Cobro adicional | **(?)** por definir |

La extraordinaria es el caso más estricto, y por dos razones. Es un cobro que no estaba
previsto y que puede ser grande, así que la única forma de imponerlo es que los copropietarios
lo hayan votado. Y además **tiene destinación específica**: la asamblea no aprueba «una
extraordinaria», aprueba una extraordinaria **para algo** —impermeabilizar la cubierta, cambiar
el ascensor—.

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

> **Queda una frontera por definir:** ¿puede ajustar el valor de una multa al imponerla, o el
> valor del catálogo es fijo? Es exactamente el límite entre parametrizar e imponer, y sigue
> abierto en [`./12-levantamiento-pendiente.md` §3 quater](./12-levantamiento-pendiente.md).
> El modelo lo tiene marcado con **(?)** en `ConceptoSancion.valor`.

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
