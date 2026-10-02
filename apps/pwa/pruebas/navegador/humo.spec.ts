/**
 * Prueba de humo: el demo abre, se entra con un perfil y el reloj es el de las
 * pruebas (T-42, ADR-0020). Es el modelo para las suites de Mary; la de las 36
 * pantallas la reemplaza cuando se traiga al repositorio.
 */
import { AHORA_PRUEBAS, entrarComo, expect, test } from './base'

test('el reloj del navegador es el de las pruebas, no el de la maquina', async ({ page }) => {
  await page.goto('/#/acceso')
  const ahora = await page.evaluate(() => Date.now())
  expect(ahora).toBe(new Date(AHORA_PRUEBAS).getTime())
})

test.describe('a las 11 de la noche', () => {
  test.use({ ahora: '2026-10-09T23:00:00-05:00' })

  test('la hora que ve la app es la pedida, en hora de Bogota', async ({ page }) => {
    await page.goto('/#/acceso')
    const hora = await page.evaluate(() => new Date().getHours())
    expect(hora).toBe(23)
  })
})

test('el propietario entra a su inicio (CU-R-01, CU-R-02)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await expect(page).toHaveURL(/#\/app/)
})

test('la administradora entra a la consola (CU-R-01)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await expect(page).toHaveURL(/#\/admin/)
})
