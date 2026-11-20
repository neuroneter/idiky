# ADR-0005 — Generación del código QR sin dependencias externas

- **Estado:** Aceptada · **actualizada el 2026-11-20** (ver al final)
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

## Actualización — 2026-11-20

Mary pidió el QR de visitantes (*«1, 2 y 3 por favor»*). Se mantiene la decisión de fondo —**sin
dependencias**— y se cambia la consecuencia: el patrón ilustrativo se reemplaza por un **QR real y
escaneable**, generado en `apps/pwa/src/utilidades/qr.ts` (ISO/IEC 18004: modo byte, nivel M,
versiones 1 a 5, Reed-Solomon, ocho máscaras con penalización). `componentes/CodigoVisual.tsx`
lo dibuja en SVG. Se comprobó con un lector estándar (zxing-cpp) sobre textos de 1 a 80
caracteres y sobre una captura de la pantalla del demo.

El lector de portería usa el `BarcodeDetector` del propio navegador (Chrome y Android), también
sin librerías; donde no existe, se escribe el código como antes. No se agregó ninguna dependencia,
así que no hace falta un ADR nuevo. En la app nativa (ALICE, Flutter) se usará el equivalente
de la plataforma.

