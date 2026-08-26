# ADR-0004 — Sin autenticación real en el demo

- **Estado:** Aceptada
- **Fecha:** 2026-08-26

## Contexto

El objetivo del demo es validar flujos, no seguridad. Implementar autenticación real
requiere backend, lo que contradice el alcance de la fase 1.

## Decisión

La pantalla de acceso muestra una **lista de perfiles demo** (residente al día, residente en
mora, administrador). Elegir uno crea la sesión. No hay contraseñas ni tokens.

## Consecuencias

- El demo **no debe exponerse públicamente con datos reales de una copropiedad.** Los datos
  de la semilla son ficticios.
- La sesión se guarda en `localStorage` solo para no repetir la selección al recargar.
- En la fase 2, `estado/SesionContext.tsx` es el único punto a modificar: la forma de la
  sesión (`persona`, `rol`, `copropiedadId`, `unidadActivaId`) se mantiene igual.
- Los permisos de la matriz del documento 03 hoy se aplican solo en la interfaz. **En la
  fase 2 deben aplicarse en el servidor**, porque la interfaz nunca es una frontera de
  seguridad.
