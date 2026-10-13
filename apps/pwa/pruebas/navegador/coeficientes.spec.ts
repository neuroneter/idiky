/**
 * CU-A-21 — Corregir coeficientes mal cargados (RN-222, RN-19): con motivo,
 * sumando 100 %, sin asamblea instalada, y sin tocar lo ya votado (RN-37).
 */

import { entrarComo, expect, test } from './base'

test('la corrección exige motivo, suma 100 % y ninguna asamblea instalada (RN-222)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const coef = (id: string) => bd.unidades.find((u) => u.id === id)!.coeficiente
    const a = 'uni-torre1-402', b = 'uni-torre1-202'
    const ca = coef(a), cb = coef(b)
    const motivo = 'Se digitaron cruzados al cargar el reglamento'
    const cambios = [{ unidadId: a, coeficiente: Number((ca + 0.5).toFixed(4)) }, { unidadId: b, coeficiente: Number((cb - 0.5).toFixed(4)) }]
    const votoAntes = bd.votos.find((v) => v.unidadId === a)?.coeficiente

    const conAsambleaViva = await intento(() => repo.corregirCoeficientes(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', cambios, motivo }))
    // Se da por cerrada la asamblea en curso de la semilla (cerrarla exige cerrar sus votaciones).
    bd.asambleas.find((x) => x.id === 'asa-extra-cubierta')!.estado = 'cerrada'
    const laPropietaria = await intento(() => repo.corregirCoeficientes(bd, { copropiedadId: 'cop-1', personaId: 'per-1', cambios, motivo }))
    const sinMotivo = await intento(() => repo.corregirCoeficientes(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', cambios, motivo: 'error' }))
    const noSuma = await intento(() => repo.corregirCoeficientes(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', cambios: [cambios[0]], motivo }))
    const bien = await intento(() => repo.corregirCoeficientes(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', cambios, motivo }))
    const unidad = bd.unidades.find((u) => u.id === a)!
    return {
      conAsambleaViva, laPropietaria, sinMotivo, noSuma, bien: Array.isArray(bien),
      nuevoA: coef(a), esperadoA: cambios[0].coeficiente,
      historial: unidad.correccionesCoeficiente?.map((c) => [c.antes, c.despues, c.motivo]),
      ca, votoAntes, votoDespues: bd.votos.find((v) => v.unidadId === a)?.coeficiente,
    }
  })
  expect(r.conAsambleaViva).toMatch(/asamblea instalada/)
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.sinMotivo).toMatch(/Explica el error/)
  expect(r.noSuma).toMatch(/sumar 100 %/)
  expect(r.bien).toBe(true)
  expect(r.nuevoA).toBe(r.esperadoA)
  expect(r.historial).toEqual([[r.ca, r.esperadoA, 'Se digitaron cruzados al cargar el reglamento']])
  expect(r.votoDespues).toBe(r.votoAntes)
})

test('la administradora corrige coeficientes desde Unidades (CU-A-21)', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const bd = await repo.cargar()
    // Se da por cerrada la asamblea en curso y se guarda con una operación inocua.
    bd.asambleas.find((x) => x.id === 'asa-extra-cubierta')!.estado = 'cerrada'
    await repo.configurarTopePoderes(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', tope: null })
  })
  await page.reload()
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/unidades')
  await page.getByRole('button', { name: 'Corregir coeficientes' }).click()
  const a = page.getByLabel('Coeficiente de Torre 1 · 402')
  const b = page.getByLabel('Coeficiente de Torre 1 · 202')
  const va = Number(await a.inputValue())
  const vb = Number(await b.inputValue())
  await a.fill(String(Number((va + 0.5).toFixed(4))))
  await expect(page.getByText(/sobra 0.5 %/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar la corrección' })).toBeDisabled()
  await b.fill(String(Number((vb - 0.5).toFixed(4))))
  await expect(page.getByText(/Suman 100 %\. Cambias 2/)).toBeVisible()
  await page.getByLabel('¿Qué error se corrige?').fill('Se digitaron cruzados al cargar el reglamento')
  await page.getByRole('button', { name: 'Guardar la corrección' }).click()
  await expect(page.getByText('Coeficientes corregidos. Queda el historial en cada unidad.')).toBeVisible()
})
