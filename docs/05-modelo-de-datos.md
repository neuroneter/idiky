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
| `valor` | number | Lo facturado. **Pesos enteros, sin decimales.** No cambia nunca |
| `saldo` | number | Lo que falta por pagar. Nace igual a `valor` y baja con cada abono (RN-26) |
| `fechaVencimiento` | fecha ISO | RN-23 |
| `estado` | `'pendiente' \| 'abonada' \| 'pagada' \| 'vencida'` | RN-04, RN-26 |

> `vencida` no se guarda: se deriva de la fecha con `estadoRealCuota()`. Y **una cuota
> vencida con abonos se sigue reportando vencida** — RN-04 manda sobre RN-26, porque para
> la mora lo que cuenta es que todavía debe.

### Pago (recibo de caja)
Un pago **es** el recibo de caja: la constancia de que el dinero entró. Por eso no se
borra, se anula (RN-29).

| Campo | Tipo | Notas |
|---|---|---|
| `unidadId` | string | La deuda es de la unidad, no de la persona |
| `valor` | number | Lo efectivamente recibido |
| `medio` | `'pse' \| 'tarjeta' \| 'transferencia' \| 'efectivo' \| 'otro'` | |
| `referencia` | string | Consignación, comprobante del banco |
| `estado` | `'reportado' \| 'aplicado' \| 'anulado'` | RN-29, RN-30 |
| `origen` | `'residente' \| 'administracion'` | Quién lo originó |
| `conceptoInformado` | string? | **Lo que el propietario dice que está pagando** (CU-R-18) |
| `cuotasInformadas` | string[]? | Cuotas que el propietario señala |
| `recibo` | string? | `RC-<NNNNN>`; se asigna al aplicar (RN-28) |
| `imputaciones` | `{cuotaId, valor}[]` | Cómo se repartió entre cuotas (RN-27) |
| `saldoAFavor` | number | Lo que no se imputó a ninguna cuota |
| `motivoAnulacion` | string? | Obligatorio al anular (RN-29) |

> `conceptoInformado` es el campo que sostiene todo el módulo: es la diferencia entre
> aplicar el abono donde el sistema supone y aplicarlo donde el propietario quiso.

### Gasto — solo en `apps/contable/`

La PWA no tiene gastos: es el lado que solo existe en la aplicación contable, y sin él no
hay estado de resultados.

| Campo | Tipo | Notas |
|---|---|---|
| `fecha` | fecha ISO | **Fecha de causación**, no de pago (RN-32) |
| `concepto` | string | Texto visible |
| `categoria` | `'Vigilancia' \| 'Aseo' \| 'Servicios publicos' \| 'Mantenimiento' \| 'Administracion' \| 'Seguros' \| 'Reparaciones' \| 'Otros'` | Agrupa el estado de resultados |
| `valor` | number | Pesos enteros |
| `proveedor` | string | A quién se le paga |
| `estado` | `'por_pagar' \| 'pagado' \| 'anulado'` | RN-32 |
| `fechaPago` | fecha ISO? | Presente cuando `estado = 'pagado'` |
| `motivoAnulacion` | string? | Obligatorio al anular; el registro no se borra |

### Comprobante de ajuste — solo en `apps/contable/`

Un movimiento contable que **no es un pago ni un recaudo**: causar intereses de mora,
provisionar cartera, reclasificar una cuenta, trasladar excedentes al fondo de imprevistos.

| Campo | Tipo | Notas |
|---|---|---|
| `numero` | string | `CA-<NNNNN>`, consecutivo, sin reúso |
| `fecha` | fecha ISO | Fecha del asiento |
| `concepto` | string | Título visible |
| `detalle` | string | **Por qué** se hace el ajuste; es lo que lee quien audite |
| `estado` | `'registrado' \| 'anulado'` | RN-35 |
| `lineas` | `{cuenta, unidadId?, debe, haber, descripcion}[]` | El asiento. Debe cuadrar (RN-34) |

`unidadId` solo tiene sentido en la cuenta de cartera: es lo que hace que el ajuste aparezca
en el extracto de ese propietario y en su saldo.

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

## 3. Reglas de negocio

Referenciadas desde los casos de uso. **Si cambias una regla, actualiza este listado.**

| ID | Regla | Dónde se implementa (demo) |
|---|---|---|
| RN-01 | Todo dato pertenece a una copropiedad; nunca se mezclan copropiedades. | `datos/repositorio.ts` |
| RN-02 | El rol efectivo del usuario se resuelve por la unidad activa. | `estado/SesionContext.tsx` |
| RN-03 | El saldo de una unidad = suma del `saldo` de todas sus cuotas. | `dominio/reglas.ts` |
| RN-04 | Una cuota es `vencida` si su vencimiento es anterior a hoy y aún tiene saldo. | `dominio/reglas.ts` |
| RN-05 | Las cuotas extraordinarias se prorratean por coeficiente. | `dominio/reglas.ts` |
| RN-06 | Un pago se imputa primero a la deuda más antigua. | `dominio/reglas.ts` |
| RN-07 | Todo pago aplicado genera un recibo de caja con consecutivo único. | `datos/repositorio.ts` |
| RN-08 | Una unidad en mora no puede reservar zonas comunes. | `dominio/reglas.ts` |
| RN-09 | No puede haber dos reservas activas de la misma zona en la misma franja. | `dominio/reglas.ts` |
| RN-10 | La reserva exige la anticipación mínima de la zona. | `dominio/reglas.ts` |
| RN-11 | Cancelar con < 24 h puede acarrear sanción. | *pendiente* |
| RN-12 | Radicado PQRS: `PQRS-<AAAA>-<NNNN>`, consecutivo por copropiedad. | `datos/repositorio.ts` |
| RN-13 | SLA de PQRS: 15 días calendario. | `dominio/reglas.ts` |
| RN-14 | Una PQRS resuelta se cierra sola a los 5 días. | *pendiente* |
| RN-15 | Los comunicados `urgente` se destacan y no se ocultan. | `features/residente/InicioPage.tsx` |
| RN-16 | El código de visitante expira al terminar su vigencia. | `dominio/reglas.ts` |
| RN-17 | El código es de un solo uso salvo que sea recurrente. | *parcial* |
| RN-18 | El % de recaudo se calcula sobre las cuotas del periodo actual. | `dominio/reglas.ts` |
| RN-19 | La suma de coeficientes de una copropiedad es 100 %. | validado en la semilla |
| RN-20 | Toda unidad tiene al menos un propietario. | *pendiente* |
| RN-21 | Los días de mora se cuentan desde la cuota vencida más antigua. | `dominio/reglas.ts` |
| RN-22 | No se generan dos veces las cuotas ordinarias del mismo periodo. | `datos/repositorio.ts` |
| RN-23 | Vencimiento por defecto: día 10 del periodo. | `datos/repositorio.ts` |
| RN-24 | La primera respuesta de la administración pasa la PQRS a `en_gestion`. | `datos/repositorio.ts` |
| RN-25 | La correspondencia entregada no se edita. | `features/admin/CorrespondenciaAdminPage.tsx` |
| RN-26 | Un abono parcial baja el `saldo` de la cuota sin marcarla pagada: queda `abonada`. | `dominio/reglas.ts` |
| RN-27 | Todo pago aplicado se reparte entre cuotas; lo que sobra queda como saldo a favor. | `dominio/reglas.ts` |
| RN-28 | Recibo de caja: `RC-<NNNNN>`, consecutivo, asignado al aplicar y sin reúso. | `dominio/reglas.ts` |
| RN-29 | Un recibo no se borra: se anula con motivo y el saldo vuelve a las cuotas. | `datos/repositorio.ts` |
| RN-30 | Un abono informado por el propietario no afecta la cartera hasta que se aplica. | `datos/repositorio.ts` |
| RN-31 | Los estados financieros se preparan **por causación, no por caja**: una cuota es ingreso en su mes aunque se pague después. | `contable/js/contabilidad.js` |
| RN-32 | Un gasto se causa en su fecha y se paga después; entre los dos momentos es cuenta por pagar. | `contable/js/contabilidad.js` |
| RN-33 | Activo = Pasivo + Patrimonio. Si no cuadra, **se muestra el descuadre**, no se oculta. | `contable/js/contabilidad.js` |
| RN-34 | Un comprobante de ajuste solo se registra si **el debe es igual al haber**. | `contable/js/contabilidad.js` |
| RN-35 | Un comprobante no se borra: se anula, deja de contar en los estados y su número queda quemado. | `contable/js/repositorio.js` |

### El motor contable: todo es un asiento

`apps/contable/` lleva **partida doble** sobre un plan de cuentas corto
(`js/plan-de-cuentas.js`). Hay dos fuentes de asientos y se suman en el mismo sitio:

**Automáticos** — se derivan de los documentos, nadie los escribe:

| Hecho | Débito | Crédito |
|---|---|---|
| Se causa una cuota | Cartera `1305` | Ingreso `41xx` según el tipo |
| Se aplica un pago | Caja `1105` | Cartera `1305` + el excedente a Anticipos `2805` |
| Se anula un recibo | lo contrario, con la fecha de la anulación | |
| Se causa un gasto | Gasto `51xx` según la categoría | Cuentas por pagar `2335` |
| Se paga un gasto | Cuentas por pagar `2335` | Caja `1105` |

**Manuales** — los comprobantes de ajuste, que el administrador escribe cuando hay que mover
la contabilidad sin que entre ni salga plata.

Como **todo asiento tiene debe = haber**, el estado de situación financiera cuadra por
construcción, vengan los asientos de donde vengan (RN-33). Convención de signo: el saldo de
una cuenta es siempre `debe − haber`; activo y gasto quedan positivos, pasivo, patrimonio e
ingreso negativos y se muestran cambiados de signo. Una cuenta correctora como la provisión
de cartera `1399` cae sola en negativo dentro del activo, sin necesitar un caso especial.

## 4. Convenciones de datos

- **Fechas:** siempre ISO 8601 (`AAAA-MM-DD` o completa). Nunca formatos locales en el dato.
- **Dinero:** enteros en pesos, sin decimales. El formato se aplica solo al mostrar.
- **Identificadores:** cadenas legibles con prefijo (`uni-`, `cuo-`, `res-`, `pqr-`, `pag-`).
- **Nunca borrar:** los registros se anulan o cierran, no se eliminan (trazabilidad, O3).
