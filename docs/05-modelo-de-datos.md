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
`fechaRecepcion`, `estado` (`'en_porteria' \| 'entregada'`), `recibidoPor?`, `fechaEntrega?`.

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

> Sin `origen` y sin `referencia`, un copropietario que pregunte «¿por qué me cobran este
> interés?» no tiene respuesta. Con ellos, la respuesta es un acta o un artículo.

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
| RN-26 | El paz y salvo solo se emite si el saldo de la unidad es cero. | *pendiente* |
| RN-27 | El voto en asamblea se pondera por el coeficiente de la unidad. **Confirmada por el equipo el 2026-08-26.** | `dominio/reglas.ts` (`pesoDelVoto`) |
| RN-28 | El quórum se mide en coeficientes (presentes + representados), no en personas. | *pendiente* |
| RN-29 | Un voto por unidad y por votación; quien representa N unidades emite N votos. | *pendiente* |
| RN-30 | Un apoderado no puede superar el tope de coeficientes que puede representar. **(? — cifra por confirmar en la Ley 675 de 2001)** | *pendiente* |
| RN-31 | El poder vale para una sola asamblea y vence al cerrarse (CU-S-09). | *pendiente* |
| RN-32 | Quien otorgó poder no puede votar esa unidad directamente. | *pendiente* |
| RN-33 | La citación se emite con la antelación mínima del reglamento. **(?)** | *pendiente* |
| RN-34 | Una votación cerrada no se reabre ni se modifica; se anula y se repite. | *pendiente* |
| RN-35 | El acta se construye desde los datos registrados; aprobada, no se edita — se aclara con un acta nueva. | *pendiente* |
| RN-36 | Todo documento formal lleva consecutivo único por tipo y es verificable. | *pendiente* |
| RN-37 | El coeficiente es histórico: se copia al usarlo y cambiarlo no altera asambleas ni votaciones cerradas. | *pendiente* |
| RN-38 | Solo se puede imponer una multa que exista en el catálogo, y un concepto solo entra al catálogo si el reglamento lo contempla o una asamblea lo aprobó. | *pendiente* |
| RN-39 | Una multa genera cuota **solo cuando queda firme**, nunca al proponerla. **(? — depende del debido proceso, Ley 675)** | *pendiente* |
| RN-40 | Un concepto del catálogo no se borra: se desactiva, porque las multas impuestas lo referencian. | *pendiente* |
| RN-41 | Una cuota adicional exige concepto y valor explícitos; no se prorratea por coeficiente. | *pendiente* |
| RN-42 | El interés de mora solo se calcula si la copropiedad lo tiene activado; apagado, no se genera ninguno. | *pendiente* |
| RN-43 | La tasa la aprueba la copropiedad —su reglamento o un acta de asamblea— y el sistema exige registrar cuál. La ley solo pone el techo: una tasa por encima del tope legal se rechaza. **(? — tope por confirmar)** | *pendiente* |
| RN-44 | El interés se liquida sobre lo vencido y genera una cuota de tipo `interes`, que entra en la cartera como cualquier otra. | *pendiente* |
| RN-45 | **Todo cobro que no sea la cuota ordinaria debe apuntar a qué lo autoriza**: el reglamento o un acta de asamblea. Aplica a extraordinarias, multas, intereses y cobros adicionales. | *pendiente* |

## 3 bis. El principio del respaldo

Tres requisitos distintos —la tasa de interés, las multas y las cuotas extraordinarias—
llegaron a la misma forma, así que conviene nombrarla una vez:

> **Ningún cobro que no sea la cuota ordinaria puede existir sin apuntar a qué lo autoriza:
> el reglamento de la copropiedad o un acta de asamblea.**

En el modelo eso son siempre los mismos tres campos: `origen`, `actaId` y `referencia`. Los
llevan `TasaInteres` y `ConceptoSancion`, y **deberían llevarlos también las cuotas
extraordinarias** — hoy `Cuota` no los tiene, y una extraordinaria sin acta que la respalde es
tan impugnable como una multa inventada. Es RN-45 y está pendiente.

La consecuencia práctica: cuando un copropietario pregunte «¿por qué me cobran esto?», el
sistema siempre puede responder con un acta o un artículo, en vez de con un número suelto.

## 4. Convenciones de datos

- **Fechas:** siempre ISO 8601 (`AAAA-MM-DD` o completa). Nunca formatos locales en el dato.
- **Dinero:** enteros en pesos, sin decimales. El formato se aplica solo al mostrar.
- **Identificadores:** cadenas legibles con prefijo (`uni-`, `cuo-`, `res-`, `pqr-`).
- **Nunca borrar:** los registros se anulan o cierran, no se eliminan (trazabilidad, O3).
