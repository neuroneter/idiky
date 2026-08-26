# ADR-0003 — Capa de datos con adaptadores intercambiables

- **Estado:** Aceptada
- **Fecha:** 2026-08-26

## Contexto

El demo no tiene backend, pero **tendrá uno**. Si las pantallas leen y escriben datos
simulados directamente, migrar al backend significaría reescribir toda la interfaz.

## Decisión

Toda lectura y escritura pasa por **`datos/repositorio.ts`**, que expone operaciones del
dominio (`obtenerCuotasDeUnidad`, `crearReserva`, `responderPqrs`…). El repositorio delega en
un **adaptador**:

- `adaptadorLocal` (hoy): semilla de datos + persistencia en `localStorage`.
- `adaptadorApi` (fase 2): las mismas operaciones contra la API real.

Las operaciones del repositorio son **asíncronas desde el primer día**, aunque el adaptador
local responda de inmediato. Así el cambio a red no altera ninguna pantalla.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| Repositorio con adaptadores | Migración sin tocar la interfaz | Un poco más de código inicial | **Elegida** |
| Datos simulados dentro de cada pantalla | Rapidísimo de escribir | Reescritura total en la fase 2 | Descartada |
| Servidor simulado (MSW) | Realista | Añade dependencia y no persiste entre sesiones | Descartada para el demo |

## Consecuencias

- Fácil: enchufar el backend real cambiando un solo archivo.
- Fácil: reiniciar el demo a su estado inicial (botón "reiniciar datos demo").
- Obligación: **ninguna pantalla puede importar `semilla.ts` ni `almacen.ts`.** Si lo hace,
  es un error de arquitectura.
