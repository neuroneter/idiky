/**
 * PN-30 — Votar en la asamblea: vota la unidad que está presente (la que quedó en la asistencia),
 * desde su celular o, si no tiene, con la administración en la sala (Mary, 2026-11-27).
 */

import { entrarComo, expect, test } from './base'

test('vota la unidad que llegó; quien no tiene celular vota en la sala (PN-30)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    // La 402 (María Camila) no ha llegado a la asamblea en curso.
    const sinLlegar = await intento(() => repo.emitirVoto(bd, { votacionId: 'vta-ex-3', unidadId: 'uni-torre1-402', personaId: 'per-1', opcionId: 'op-a' }))
    await intento(() => repo.marcarAsistencia(bd, { asambleaId: 'asa-extra-cubierta', unidadId: 'uni-torre1-402', personaId: 'per-1', forma: 'presencial' }))
    const yaLlego = await intento(() => repo.emitirVoto(bd, { votacionId: 'vta-ex-3', unidadId: 'uni-torre1-402', personaId: 'per-1', opcionId: 'op-a' }))
    // La 202 (Jorge) llegó y no tiene celular: la administración registra su voto.
    const enSala = (await intento(() => repo.registrarVotoEnSala(bd, { votacionId: 'vta-ex-3', unidadId: 'uni-torre1-202', opcionId: 'op-a', personaId: 'per-admin' }))) as { enSala?: unknown; emitidoPor?: string }
    const repetido = await intento(() => repo.registrarVotoEnSala(bd, { votacionId: 'vta-ex-3', unidadId: 'uni-torre1-202', opcionId: 'op-a', personaId: 'per-admin' }))
    const ausente = await intento(() => repo.registrarVotoEnSala(bd, { votacionId: 'vta-ex-3', unidadId: 'uni-torre2-902', opcionId: 'op-a', personaId: 'per-admin' }))
    const porLaPropietaria = await intento(() => repo.registrarVotoEnSala(bd, { votacionId: 'vta-ex-3', unidadId: 'uni-torre1-302', opcionId: 'op-a', personaId: 'per-1' }))
    return { sinLlegar, yaLlego: typeof yaLlego === 'object', enSala: enSala.enSala, emitidoPor: enSala.emitidoPor, repetido, ausente, porLaPropietaria }
  })
  expect(r.sinLlegar).toMatch(/registra tu llegada/)
  expect(r.yaLlego).toBe(true)
  expect(r.enSala).toEqual({ registradoPor: 'per-admin' })
  expect(r.emitidoPor).toBe('per-4')
  expect(r.repetido).toMatch(/ya voto/)
  expect(r.ausente).toMatch(/no registró su llegada/)
  expect(r.porLaPropietaria).toMatch(/administración/)
})

test('la propietaria que no ha llegado ve que primero registra su llegada (PN-30)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/asambleas/asa-extra-cubierta')
  await expect(page.getByText(/Para votar, primero registra tu llegada a la asamblea/).first()).toBeVisible()
})

test('la administradora registra en la sala el voto de quien no tiene celular (PN-30)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.locator('tr', { hasText: 'obras de la cubierta' }).getByRole('button', { name: 'Abrir' }).click()
  // El punto de mayoría calificada no se decide en esta sesión mixta (RN-94): ahí no hay votos en la sala.
  const punto = page.locator('li', { has: page.locator('strong', { hasText: /^Contratista de la obra$/ }) })
  const sala = punto.locator('.tarjeta', { has: page.locator('strong', { hasText: 'Votos en la sala' }) }).last()
  await expect(sala).toContainText(/Faltan \d+ unidades presentes por votar|Falta 1 unidad presente/)
  await expect(page.locator('li', { has: page.locator('strong', { hasText: /^Cuota extraordinaria/ }) }).getByText('Votos en la sala')).toHaveCount(0)
  await sala.getByLabel('Unidad que vota en la sala').selectOption({ index: 2 })
  await sala.getByLabel('Opción que vota en la sala').selectOption({ index: 1 })
  await sala.getByRole('button', { name: 'Registrar voto' }).click()
  await expect(page.getByText('Voto registrado en la sala.')).toBeVisible()
})
