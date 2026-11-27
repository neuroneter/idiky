/**
 * PN-32 — Aseo, Mantenimiento y el Piscinero registran sus novedades en la minuta del edificio,
 * también desde el celular (Mary, 2026-11-27).
 */

import { entrarComo, expect, test } from './base'

test('quién registra novedades y qué pide (PN-32)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const base = { texto: 'Se lavó el lobby de la Torre 1.', lugar: 'Lobby Torre 1', conPqrs: false, pqrs: null }
    return {
      aseo: reglas.motivoNovedadInvalida({ ...base, area: 'aseo' }),
      sinArea: reglas.motivoNovedadInvalida({ ...base, area: undefined }),
      sinLugar: reglas.motivoNovedadInvalida({ ...base, area: 'aseo', lugar: '' }),
      aseoConPqrs: reglas.motivoNovedadInvalida({ ...base, area: 'aseo', conPqrs: true, pqrs: { estado: 'abierta' } }),
      mantCerrada: reglas.motivoNovedadInvalida({ ...base, area: 'mantenimiento', conPqrs: true, pqrs: { estado: 'cerrada' } }),
      mantAbierta: reglas.motivoNovedadInvalida({ ...base, area: 'mantenimiento', conPqrs: true, pqrs: { estado: 'abierta' } }),
    }
  })
  expect(r.aseo).toBeNull()
  expect(r.sinArea).toMatch(/Aseo, Mantenimiento/)
  expect(r.sinLugar).toMatch(/dónde/)
  expect(r.aseoConPqrs).toMatch(/Mantenimiento/)
  expect(r.mantCerrada).toMatch(/resuelta o cerrada/)
  expect(r.mantAbierta).toBeNull()
})

test('desde el celular, Mantenimiento registra lo que hizo y atiende la PQRS de daño (PN-32)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await entrarComo(page, /Jhon Fredy Arango/)
  await expect(page.getByText('Registrar una novedad · Mantenimiento')).toBeVisible()
  await page.getByLabel('Dónde').fill('Torre 2, piso 5')
  await page.getByLabel('Qué pasó o qué hiciste').fill('Se cambió la lámpara del pasillo que estaba fundida.')
  const pqrs = page.getByLabel('¿Atendiste una PQRS de daño?')
  await pqrs.selectOption({ index: 1 })
  const radicado = (await pqrs.locator('option').nth(1).textContent())!.split(' · ')[0]
  await page.getByRole('button', { name: 'Registrar novedad' }).click()
  await expect(page.getByText('Novedad registrada en la minuta.')).toBeVisible()
  await expect(page.getByText(/Tus novedades/)).toBeVisible()
  await expect(page.getByText(new RegExp(`atendió la ${radicado}`))).toBeVisible()
  // Mantenimiento ve toda la bandeja de PQRS, como en BLOKY (RN-380; Mary, 2026-11-27).
  await page.goto('/#/admin/pqrs')
  await expect(page.locator('.consola__contenido')).toContainText('Convivencia')

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/porteria')
  await expect(page.getByText('Novedades del personal')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Registrar novedad' })).toHaveCount(0)
})

test('Aseo registra su novedad y queda en la minuta del edificio (PN-32)', async ({ page }) => {
  await entrarComo(page, /Luz Dary Mosquera/)
  await page.getByLabel('Dónde').fill('Lobby Torre 1')
  await page.getByLabel('Qué pasó o qué hiciste').fill('Se lavó el piso del lobby y se dejó el aviso de piso mojado.')
  await page.getByRole('button', { name: 'Registrar novedad' }).click()
  await expect(page.getByText('Novedad registrada en la minuta.')).toBeVisible()
  await expect(page.getByText(/^Aseo$/).first()).toBeVisible()
  await expect(page.getByLabel('¿Atendiste una PQRS de daño?')).toHaveCount(0)
})
