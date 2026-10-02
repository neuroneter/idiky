# Pruebas de navegador del demo

Recorren el demo en un navegador de verdad (Chromium) con **Playwright Test**: entran con un
perfil, hacen clic y miran la pantalla. Decidido en T-42, [ADR-0020](../../../../docs/adr/0020-pruebas-de-navegador-de-la-pwa.md).

## Correrlas

```bash
cd apps/pwa
npm install                          # una vez (trae Playwright)
npm run probar:navegador:instalar    # una vez por computador: descarga Chromium (~95 MB)
npm run probar:navegador             # todas
npx playwright test reservas         # solo los archivos que contienen «reservas»
npx playwright test --ui             # con ventana, para ver qué pasa paso a paso
```

Playwright levanta el demo solo (`vite` en el puerto 5174). Si una prueba falla, el informe
queda en `pruebas/informe/` (`npx playwright show-report pruebas/informe`), con la traza de la
prueba fallida. Ni el informe ni los resultados van a git.

**No son parte de `npm run build`.** El build sigue siendo lo que debe pasar antes de integrar;
estas se corren antes de integrar cuando el cambio toca un flujo que tienen cubierto.

## Cómo se escribe una

```ts
import { entrarComo, expect, test } from './base'

test('la propietaria reserva el salón social (CU-R-05)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  // ...
})
```

- **Un archivo por tema**, terminado en `.spec.ts`: `reservas.spec.ts`, `cartera.spec.ts`,
  `usuarios.spec.ts`, `humo.spec.ts`.
- **Importa `test` y `expect` de `./base`, nunca de `@playwright/test`.** `base.ts` fija el reloj.
- **Cada prueba nombra el caso de uso o la regla** que comprueba, en el título.
- **Cada prueba arranca de la semilla**: el navegador es nuevo y el `localStorage`, vacío. No
  dependas de lo que dejó otra prueba.

## La hora: ninguna prueba depende de la hora real

El demo decide muchas cosas con la hora (el autocierre de reservas, la anticipación, la mora,
el «hoy» de la portería). Por eso **el navegador de las pruebas vive siempre en la misma hora**:
`AHORA_PRUEBAS` (viernes 2026-10-09, 10:00, hora de Bogotá). Una prueba que necesite otra la
pide:

```ts
test.describe('reservas después del cierre', () => {
  test.use({ ahora: '2026-10-09T23:30:00-05:00' })
  test('el autocierre cierra las reservas sin pagar (RN-xx)', async ({ page }) => { /* ... */ })
})
```

Y si necesita que **pase** el tiempo dentro de la prueba: `await page.clock.fastForward('02:00:00')`.

**Las suites «autocierre» y «seis» de reservas** dependían de la hora del día. Al traerlas aquí
se les pone su hora con `test.use({ ahora })` y dejan de depender de cuándo se corran.

## Lo que falta

Traer las ~25 suites de Mary (reservas, cartera, usuarios y la de humo de 36 pantallas), que
hoy están fuera del repositorio, y adaptarlas a esta base (T-42).
