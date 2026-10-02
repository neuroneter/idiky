/**
 * La base de todas las pruebas de navegador (T-42, ADR-0020).
 *
 * **El reloj del navegador es fijo.** Muchas reglas del demo dependen de la
 * hora: el autocierre de reservas, la anticipacion minima, el «hoy» de la
 * porteria, la mora. Una prueba que use la hora real pasa a las 9 de la manana
 * y falla a las 11 de la noche. Por eso cada prueba corre en `AHORA_PRUEBAS`,
 * salvo que pida otra hora con `test.use({ ahora: '...' })`.
 *
 * El reloj es fijo pero no esta congelado: los temporizadores de la app siguen
 * corriendo (setTimeout, setInterval). Si una prueba necesita que pase el
 * tiempo, usa `page.clock.fastForward('01:00:00')` o `page.clock.setFixedTime`.
 */
import { test as base, expect } from '@playwright/test'

/** Un viernes cualquiera a media manana, hora de Bogota. */
export const AHORA_PRUEBAS = '2026-10-09T10:00:00-05:00'

export const test = base.extend<{ ahora: string }>({
  ahora: [AHORA_PRUEBAS, { option: true }],
  page: async ({ page, ahora }, usar) => {
    await page.clock.setFixedTime(new Date(ahora))
    await usar(page)
  },
})

export { expect }

/** Entra al demo con uno de los perfiles de la pantalla de acceso (CU-R-01). */
export async function entrarComo(page: import('@playwright/test').Page, etiqueta: string | RegExp) {
  await page.goto('/#/acceso')
  await page.getByText('¿Estás viendo el demo?').click()
  await page.getByRole('button', { name: etiqueta }).first().click()
}
