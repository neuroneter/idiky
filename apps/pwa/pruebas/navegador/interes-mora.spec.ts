/**
 * RN-42, CU-A-25 — Cada edificio escoge si cobra interés de mora; la tasa la
 * fija la ley (art. 30). Por defecto se cobra.
 */

import { entrarComo, expect, test } from './base'

test('el edificio escoge si cobra interés de mora, y queda quién lo cambió (RN-42)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const cop = () => bd.copropiedades.find((c) => c.id === 'cop-1')!
    const porDefecto = reglas.cobraInteresMora(cop())
    const laPropietaria = await intento(() => repo.configurarInteresMora(bd, { copropiedadId: 'cop-1', personaId: 'per-1', cobra: false }))
    await intento(() => repo.configurarInteresMora(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', cobra: false }))
    return { porDefecto, laPropietaria, despues: reglas.cobraInteresMora(cop()), por: cop().cambioInteresMora?.por }
  })
  expect(r.porDefecto).toBe(true)
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.despues).toBe(false)
  expect(r.por).toBe('per-admin')
})

test('la administradora marca en Cartera que el edificio no cobra interés de mora (CU-A-25)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/cartera')
  await expect(page.getByRole('button', { name: 'Se cobra', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: 'No se cobra' }).click()
  await expect(page.getByRole('button', { name: 'No se cobra' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText(/Último cambio: Olga Lucia Henao/)).toBeVisible()
})
