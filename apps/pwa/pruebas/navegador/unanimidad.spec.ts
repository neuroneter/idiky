/**
 * RN-224 — Unanimidad, cuando la exige el reglamento: todo el edificio a favor,
 * por coeficiente o por unidad (RN-211).
 */

import { entrarComo, expect, test } from './base'

test('la unanimidad exige todo el edificio a favor (RN-224)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const conteo = (si: number, unidadesSi: number, no = 0, unidadesNo = 0) => ({
      porOpcion: [
        { opcionId: 'si', texto: 'A favor', coeficiente: si, unidades: unidadesSi },
        { opcionId: 'no', texto: 'En contra', coeficiente: no, unidades: unidadesNo },
      ],
      coeficienteVotante: si + no,
      unidadesVotantes: unidadesSi + unidadesNo,
    })
    const base = { mayoria: 'unanimidad' as const, coeficienteRepresentado: 100, coeficienteEdificio: 100 }
    const todos = reglas.resultadoVotacion({ ...base, conteo: conteo(100, 12) as never })
    const casi = reglas.resultadoVotacion({ ...base, conteo: conteo(95.5, 11, 4.5, 1) as never })
    const porUnidad = reglas.resultadoVotacion({ ...base, conteo: conteo(90, 12) as never, baseDeVoto: 'unidad', unidadesRepresentadas: 12, unidadesEdificio: 12 })
    const faltaUna = reglas.resultadoVotacion({ ...base, conteo: conteo(95, 11) as never, baseDeVoto: 'unidad', unidadesRepresentadas: 11, unidadesEdificio: 12 })
    return {
      todos: !!todos.aprobada, casi: !!casi.aprobada, porUnidad: !!porUnidad.aprobada, faltaUna: !!faltaUna.aprobada,
      necesarias: reglas.unidadesNecesarias(faltaUna.umbral, 'unanimidad'), baseTexto: todos.baseTexto,
    }
  })
  expect(r.todos).toBe(true)
  expect(r.casi).toBe(false)
  expect(r.porUnidad).toBe(true)
  expect(r.faltaUna).toBe(false)
  expect(r.necesarias).toBe(12)
  expect(r.baseTexto).toBe('del coeficiente del edificio')
})

test('al convocar, cada punto que se vota escoge su mayoría (RN-74, RN-224)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.getByRole('button', { name: /Convocar/ }).first().click()
  await expect(page.getByLabel('Mayoría del punto 1')).toHaveCount(0)
  await page.getByText('Este punto se somete a votación').click()
  const mayoria = page.getByLabel('Mayoría del punto 1')
  await expect(mayoria).toHaveValue('simple')
  await mayoria.selectOption('unanimidad')
  await expect(mayoria).toHaveValue('unanimidad')
})
