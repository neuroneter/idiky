/**
 * CU-R-01 (A6) — Todas mis propiedades en una sola vista (PN-18).
 */

import { entrarComo, expect, test } from './base'

test('suma lo adeudado de cada propiedad y el familiar no ve la plata (PN-18)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const sel = await import('/src/datos/selectores.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    const bd = await repo.cargar()
    const gustavo = sel.propiedadesDePersona(bd, 'per-13')
    const esperado301 = reglas.calcularSaldo(sel.cuotasDeUnidad(bd, 'uni-torre1-301'))
    return {
      unidades: gustavo.map((p) => p.unidad.id).sort(),
      saldo301: gustavo.find((p) => p.unidad.id === 'uni-torre1-301')?.saldo,
      esperado301,
      maria: sel.propiedadesDePersona(bd, 'per-1').length,
      familiar: reglas.veLaCuentaDe('familiar'),
      arrendatario: reglas.veLaCuentaDe('arrendatario'),
    }
  })
  expect(r.unidades).toEqual(['uni-torre1-301', 'uni-torre2-502'])
  expect(r.saldo301).toBe(r.esperado301)
  expect(r.maria).toBe(1)
  expect(r.familiar).toBe(false)
  expect(r.arrendatario).toBe(true)
})

test('Gustavo ve sus dos propiedades y entra a la otra (CU-R-01 A6)', async ({ page }) => {
  await entrarComo(page, /Gustavo Adolfo Mejia/)
  await page.getByRole('link', { name: /Tus 2 propiedades/ }).click()
  await expect(page.getByRole('heading', { name: 'Mis propiedades' })).toBeVisible()
  await expect(page.getByText('Valor adeudado en todas')).toBeVisible()
  await expect(page.getByText(/Torre 2 · 502/)).toBeVisible()
  await page.getByRole('button', { name: 'Entrar a esta unidad' }).nth(1).click()
  await expect(page.getByRole('button', { name: /Torre 2 · 502/ })).toBeVisible()
})
