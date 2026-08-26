# Documentación — Idiky

Esta carpeta es la **fuente de verdad** del proyecto. Todo cambio funcional debe reflejarse
aquí antes o junto con el código.

## Índice

| # | Documento | Para qué sirve | Cambia... |
|---|---|---|---|
| 01 | [Visión y alcance](./01-vision-y-alcance.md) | Problema, objetivos, alcance dentro/fuera | Rara vez |
| 02 | [Glosario](./02-glosario.md) | Vocabulario del dominio (PH, coeficiente, cuota…) | Cuando aparece un término nuevo |
| 03 | [Actores y roles](./03-actores-y-roles.md) | Quién usa el sistema y qué permisos tiene | Poco |
| 04 | [Catálogo de casos de uso](./04-casos-de-uso.md) | Índice maestro de CU con estado | En cada iteración |
| 04a | [CU — Residente](./casos-de-uso/residente.md) | Detalle de los CU de la app móvil | En cada iteración |
| 04b | [CU — Administrador](./casos-de-uso/administrador.md) | Detalle de los CU de la consola | En cada iteración |
| 05 | [Modelo de datos](./05-modelo-de-datos.md) | Entidades, relaciones y tipos | Al agregar entidades |
| 06 | [Arquitectura](./06-arquitectura.md) | Estructura del código y decisiones técnicas | Al cambiar estructura |
| 07 | [Roadmap](./07-roadmap.md) | Fases, entregables y criterios de salida | Al cerrar una fase |
| 08 | [Convenciones](./08-convenciones.md) | Git, código, nombres, documentación | Rara vez |
| 09 | [Estado del proyecto](./09-estado-del-proyecto.md) | **Bitácora viva: qué está hecho y qué sigue** | En cada sesión de trabajo |
| 10 | [Equipo y orquestación](./10-equipo-y-orquestacion.md) | **Cómo trabajamos Jeimy, Mary y Daniel en paralelo** | Al cambiar la forma de trabajo |
| 11 | [Tablero de trabajo](./11-tablero-de-trabajo.md) | Tareas en curso, quién las tiene y en qué estado | Todos los días |
| 12 | [Levantamiento pendiente](./12-levantamiento-pendiente.md) | **Preguntas abiertas del producto, por responder** | Hasta cerrarlo |
| — | [ADR](./adr/) | Decisiones de arquitectura con su justificación | Al tomar una decisión relevante |

> ⚠️ **Antes de construir funcionalidad nueva:** el demo v0.1 se hizo sobre supuestos, no
> sobre el alcance definitivo. Hay que cerrar primero
> [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md).

## Cómo usar esta documentación en una sesión nueva (humano o IA)

1. Lee [`09-estado-del-proyecto.md`](./09-estado-del-proyecto.md) → sabrás dónde quedó todo.
2. Lee el caso de uso que vas a implementar en [`04-casos-de-uso.md`](./04-casos-de-uso.md).
3. Lee [`06-arquitectura.md`](./06-arquitectura.md) → sabrás dónde poner el código.
4. Implementa.
5. **Actualiza** el estado del CU en el catálogo y añade una entrada a la bitácora en `09`.

> Regla de oro: si una decisión no está escrita, no existe. Si cambias el comportamiento
> del sistema y no actualizas el caso de uso, has creado deuda de contexto.
