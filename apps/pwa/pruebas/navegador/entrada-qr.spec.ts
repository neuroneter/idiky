/**
 * PN-25 — Entrada con QR a la asamblea presencial (CU-A-17, CU-R-21; Mary, 2026-11-23).
 */

import { entrarComo, expect, test } from './base'

test('el código de entrada se lee de vuelta y rechaza lo que no es suyo (PN-25)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const codigo = reglas.codigoAsistencia({ asambleaId: 'asa-1', unidadId: 'uni-1', personaId: 'per-1' })
    return {
      codigo,
      leido: reglas.leerCodigoAsistencia(codigo),
      otro: reglas.leerCodigoAsistencia('VIS-123456'),
    }
  })
  expect(r.leido).toEqual({ asambleaId: 'asa-1', unidadId: 'uni-1', personaId: 'per-1' })
  expect(r.otro).toBeNull()
  // Cabe en el QR del demo (hasta 84 caracteres, versión 5).
  expect(r.codigo.length).toBeLessThan(84)
})

test('la propietaria ve su código y la administradora registra la llegada con él (PN-25)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/asambleas/asa-ordinaria-anual')
  await expect(page.getByText('Tu código para entrar')).toBeVisible()
  await expect(page.getByRole('img').first()).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.locator('tr', { hasText: 'obras de la cubierta' }).getByRole('button', { name: 'Abrir' }).click()
  const codigo = page.getByLabel('Código de entrada')
  // Un familiar no es propietario ni apoderado: no entra a contar.
  await codigo.fill('IDIKY|ASIS|asa-extra-cubierta|uni-torre1-402|per-15')
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await expect(page.getByText(/no es propietario de la unidad/).first()).toBeVisible()
  await codigo.fill('IDIKY|ASIS|asa-extra-cubierta|uni-torre1-301|per-13')
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await expect(page.getByText(/Llegó: .*301.*Gustavo/)).toBeVisible()
})
