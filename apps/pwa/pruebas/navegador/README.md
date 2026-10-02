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

## Qué hay

| Archivo | Qué cubre |
|---|---|
| `humo.spec.ts` | El reloj fijo y la entrada por los perfiles del demo |
| `pantallas.spec.ts` | Las 36 pantallas de la propietaria, la administradora y el portero abren con contenido y sin errores |
| `reservas.spec.ts` | Zonas comunes y reservas: configuración, cobros, depósito y multa, zonas compartidas, calendario, informe, vencimientos, avisos, límite para cancelar y autocierre (CU-A-10, CU-A-29, CU-A-30, RN-104 a RN-129) |
| `cartera.spec.ts` | Estado de cuenta y paz y salvo (CU-R-18, CU-A-13, RN-127) |
| `usuarios.spec.ts` | Crear, cambiar e inhabilitar personas: quién es y cómo se queda, la cadena de registro, el cambio de propietario, la familia, los menores, el visitante frecuente y la aprobación del propietario (CU-R-27, CU-A-26, CU-A-02, RN-57 a RN-68) |

Las de reservas, cartera, usuarios y pantallas se escribieron como scripts sueltos en las sesiones
de Mary y se trajeron aquí el 2026-10-02 (T-42): por eso llevan `// @ts-nocheck` y una
función `check(condición, mensaje)` que es un `expect.soft`. **Las pruebas nuevas se escriben
con `expect` directamente**, como `humo.spec.ts`.

**Falta:** las de asambleas (las once suites de sesiones anteriores ya no existen); se escriben
cuando se toque asambleas (CU-A-18, T-46).
