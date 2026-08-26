# ADR-0005 — Generación del código QR sin dependencias externas

- **Estado:** Aceptada
- **Fecha:** 2026-08-26

## Contexto

CU-R-10 necesita mostrarle al residente un código visual que portería pueda validar. Un
generador de QR completo (con corrección de errores Reed-Solomon) es una dependencia
considerable para un demo cuyo lector todavía no existe.

## Decisión

En el demo, el código de visitante se muestra como:

1. El **código alfanumérico** legible (lo que portería realmente verificaría hoy), y
2. un **patrón visual determinista** generado a partir del código, con la apariencia de un
   QR, dibujado en SVG sin librerías.

## Consecuencias

- El patrón **no es un QR válido escaneable.** Está marcado como tal en el código y en la
  interfaz para no generar expectativas falsas en las demostraciones.
- En la fase 3, cuando exista el lector de portería, se reemplaza por una librería de QR
  real (o el equivalente nativo de Capacitor) sin cambiar el flujo del caso de uso.
- El archivo a reemplazar es `componentes/CodigoVisual.tsx`.
