# ADR-0020 — Las pruebas de navegador de la PWA viven en `apps/pwa/pruebas/navegador/`, con Playwright Test y el reloj fijo

- **Estado:** Aceptada
- **Fecha:** 2026-10-02
- **Decide:** Responsable de integración (Daniel), a pedido de Mary
- **Tarea:** T-42
- **Relacionados:** [ADR-0001](./0001-stack-tecnologico.md) (el demo es ligero: nada de dependencias sin ADR)

## Contexto

Mary tiene **unas 25 pruebas de navegador** escritas con Playwright: reservas, cartera, usuarios y
una de humo que recorre 36 pantallas. **Están fuera del repositorio**, en el directorio de cada
sesión de IA, y se pierden cuando la sesión se cierra. Antes ya se había anotado lo mismo con
once suites de asambleas (T-42).

Dos de ellas («autocierre» y «seis», de reservas) **fallan o pasan según la hora del día**: el
demo decide con la hora real el autocierre, la anticipación mínima y el «hoy» de la portería.

## Decisión

1. **Dónde:** `apps/pwa/pruebas/navegador/`, un archivo `*.spec.ts` por tema. Las pruebas son de
   la maqueta de Mary y viajan con ella.
2. **Runner:** **Playwright Test** (`@playwright/test`), como dependencia **de desarrollo** de
   `apps/pwa`. Solo Chromium. Levanta el demo solo (`vite`, puerto 5174) con `webServer`.
3. **Comandos:** `npm run probar:navegador` (todas) y `npm run probar:navegador:instalar` (una vez
   por computador, baja Chromium). **No entran en `npm run build`**, que sigue siendo lo que debe
   pasar antes de integrar.
4. **La hora es fija.** Toda prueba importa `test` de `pruebas/navegador/base.ts`, que fija el
   reloj del navegador en `AHORA_PRUEBAS` (viernes 2026-10-09, 10:00, Bogotá) con
   `page.clock.setFixedTime`, y la zona horaria en `America/Bogota`. Una prueba que necesite otra
   hora la pide con `test.use({ ahora })`; si necesita que pase el tiempo, `page.clock.fastForward`.
5. **Informes y resultados** (`pruebas/informe/`, `pruebas/resultados/`) no van a git.

Se probó el 2026-10-02 con una prueba de humo de cuatro casos (`humo.spec.ts`): el reloj es el
fijado, una prueba puede pedir las 23:00 y la app las ve, y la propietaria y la administradora
entran por los perfiles del demo. Pasan en 6 s.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| Dejar las pruebas fuera del repositorio | Nada que decidir | Se pierden en cada sesión; ya pasó dos veces | Descartada |
| Scripts sueltos con la librería `playwright` (sin runner) | Es como están escritas hoy | Cada script reinventa arranque, aserciones, informe y paralelismo; sin un lugar para fijar la hora | Descartada |
| **Playwright Test en `apps/pwa`** | Runner, informe con traza, paralelo, `webServer` y reloj controlable (`page.clock`) en un solo paquete; el mismo motor de las pruebas de Mary | Una dependencia de desarrollo (~120 paquetes) y Chromium (~95 MB) por computador | **Elegida** |
| Una carpeta `pruebas/` en la raíz de `idiky` | Separa pruebas de código | Las pruebas son de la PWA: otra raíz con su `package.json` es más que mantener | Descartada |
| Vitest + Testing Library (sin navegador) | Más rápido | No recorre la app como la usa una persona, que es lo que hacen las pruebas de Mary | Para las reglas puras, más adelante; no reemplaza esto |

## Consecuencias

- **El demo sigue sin dependencias de ejecución nuevas**: `@playwright/test` es de desarrollo, no
  entra al build ni a `dist/idiky-demo.html`.
- **Traer las suites de Mary** es trabajo pendiente (T-42): copiarlas a esta carpeta, importar de
  `./base` y, en «autocierre» y «seis», ponerles su hora con `test.use({ ahora })`.
- **La contable no cambia**: sigue sin npm ni compilación (ADR-0010).
