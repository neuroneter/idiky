/**
 * Configuración de la asamblea en el edificio: tope de poderes por persona
 * (RN-220) y voto de las unidades en mora (RN-221).
 */

import { entrarComo, expect, test } from './base'

test('el tope de poderes por persona lo fija el edificio (RN-220)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const aLuisa = (unidadId: string, otorgadoPor: string) => repo.otorgarPoder(bd, { asambleaId: 'asa-ordinaria-anual', unidadId, otorgadoPor, nombresApoderado: 'Luisa', apellidosApoderado: 'Marin', documentoApoderado: '1010008274' })
    const laPropietaria = await intento(() => repo.configurarTopePoderes(bd, { copropiedadId: 'cop-1', personaId: 'per-1', tope: 1 }))
    const cero = await intento(() => repo.configurarTopePoderes(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', tope: 0 }))
    await intento(() => repo.configurarTopePoderes(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', tope: 1 }))
    const primero = await intento(() => aLuisa('uni-torre1-402', 'per-1'))
    const segundo = await intento(() => aLuisa('uni-torre1-202', 'per-4'))
    await intento(() => repo.configurarTopePoderes(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', tope: null }))
    const sinTope = await intento(() => aLuisa('uni-torre1-202', 'per-4'))
    return {
      laPropietaria, cero, primero: typeof primero === 'object', segundo,
      sinTope: typeof sinTope === 'object', tope: bd.copropiedades.find((c) => c.id === 'cop-1')!.topePoderes,
    }
  })
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.cero).toMatch(/entre 1 y 50/)
  expect(r.primero).toBe(true)
  expect(r.segundo).toMatch(/permite 1 por persona/)
  expect(r.sinTope).toBe(true)
  expect(r.tope).toBeUndefined()
})

test('la unidad en mora vota, salvo que el reglamento diga otra cosa (RN-221)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const votar = (unidadId: string, personaId: string) => repo.emitirVoto(bd, { votacionId: 'vta-ex-3', unidadId, personaId, opcionId: 'op-a' })
    const porDefecto = !bd.copropiedades.find((c) => c.id === 'cop-1')!.morososNoVotan
    await intento(() => repo.configurarVotoMorosos(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', morososNoVotan: true }))
    const enMora = await intento(() => votar('uni-torre2-901', 'per-2'))
    const alDia = await intento(() => votar('uni-torre1-202', 'per-4'))
    await intento(() => repo.configurarVotoMorosos(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', morososNoVotan: false }))
    const enMoraSinRestriccion = await intento(() => votar('uni-torre2-901', 'per-2'))
    return { porDefecto, enMora, alDia: typeof alDia === 'object', enMoraSinRestriccion: typeof enMoraSinRestriccion === 'object' }
  })
  expect(r.porDefecto).toBe(true)
  expect(r.enMora).toMatch(/está en mora/)
  expect(r.alDia).toBe(true)
  expect(r.enMoraSinRestriccion).toBe(true)
})

test('la administradora configura el tope y el voto en mora desde la consola (RN-220, RN-221)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await expect(page.getByText(/Sin tope: la Ley 675 no fija ninguno/)).toBeVisible()
  await page.getByLabel('Poderes por persona').fill('3')
  await page.getByRole('button', { name: 'Guardar el tope' }).click()
  await expect(page.getByText(/hasta 3 unidades por poder/)).toBeVisible()
  await page.getByRole('button', { name: 'No votan: lo dice el reglamento' }).click()
  await expect(page.getByRole('button', { name: 'No votan: lo dice el reglamento' })).toHaveAttribute('aria-current', 'page')
})
