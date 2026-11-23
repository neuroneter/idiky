/**
 * PN-26 — Calendario legal de la asamblea ordinaria (CU-A-12; Mary, 2026-11-23).
 */

import { entrarComo, expect, test } from './base'

test('las fechas de la ley para la ordinaria que viene (PN-26)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const sinNada = reglas.calendarioOrdinaria({ hoy: '2026-10-09', asambleas: [], actas: [], documentosEdificio: [] })
    const tarde = reglas.calendarioOrdinaria({ hoy: '2027-03-20', asambleas: [], actas: [], documentosEdificio: [] })
    const convocada = reglas.calendarioOrdinaria({
      hoy: '2027-03-01',
      asambleas: [{ id: 'a', tipo: 'ordinaria', fechaHora: '2027-03-20T19:00:00-05:00', estado: 'convocada' }],
      actas: [],
      documentosEdificio: [{ asambleaId: 'a' }],
    })
    const mapa = (c: { pasos: Array<{ id: string; fecha: string; estado: string }> }) =>
      Object.fromEntries(c.pasos.map((p) => [p.id, `${p.fecha} ${p.estado}`]))
    return { anio: sinNada.anio, sinNada: mapa(sinNada), tarde: mapa(tarde), convocada: mapa(convocada) }
  })
  expect(r.anio).toBe(2027)
  expect(r.sinNada.citacion).toBe('2027-03-16 pendiente')
  expect(r.sinNada.reunion).toBe('2027-03-31 pendiente')
  // Primer día hábil de abril de 2027: el jueves 1 (la Semana Santa de 2027 es en marzo).
  expect(r.sinNada.derecho_propio).toBe('2027-04-01 informativo')
  expect(r.tarde.citacion).toBe('2027-03-16 vencido')
  expect(r.convocada.citacion).toBe('2027-03-16 hecho')
  expect(r.convocada.documentos).toBe('2027-03-16 hecho')
  expect(r.convocada.reunion).toBe('2027-03-20 pendiente')
  expect(r.convocada.impugnacion).toBe('2027-05-20 informativo')
})

test('la administradora ve el calendario en Asambleas (PN-26)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await expect(page.getByText('Calendario de la asamblea ordinaria 2027')).toBeVisible()
  await expect(page.getByText('Último día para citar')).toBeVisible()
})
