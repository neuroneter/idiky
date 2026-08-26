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

## 4. Convenciones de datos

- **Fechas:** siempre ISO 8601 (`AAAA-MM-DD` o completa). Nunca formatos locales en el dato.
- **Dinero:** enteros en pesos, sin decimales. El formato se aplica solo al mostrar.
- **Identificadores:** cadenas legibles con prefijo (`uni-`, `cuo-`, `res-`, `pqr-`).
- **Nunca borrar:** los registros se anulan o cierran, no se eliminan (trazabilidad, O3).
