/**
 * PN-31 — Dar poder con un toque, desde el inicio (CU-R-23; Mary, 2026-11-27).
 */

import { entrarComo, expect, test } from './base'

test('a quién se le ofrece el poder y cuánto viene asegurado (PN-31)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const residencias = [
      { personaId: 'yo', unidadId: 'u1', rol: 'propietario' },
      { personaId: 'hijo', unidadId: 'u1', rol: 'familiar' },
      { personaId: 'otro', unidadId: 'u2', rol: 'familiar' },
    ]
    const poderes = [{ id: 'p', asambleaId: 'vieja', unidadId: 'u1', otorgadoPor: 'yo', apoderadoId: 'vecina', registradoEn: '2026-03-01T10:00:00Z' }]
    const candidatos = reglas.candidatosApoderado({ poderes: poderes as never, residencias: residencias as never, unidadId: 'u1', otorgadoPor: 'yo' })
    const asegurado = reglas.coeficienteConPoder(
      [{ asambleaId: 'a', unidadId: 'u1', apoderadoId: 'x', otorgadoPor: 'yo' }] as never,
      'a',
      [{ id: 'u1', coeficiente: 2.5 }, { id: 'u2', coeficiente: 3 }],
    )
    return { candidatos, asegurado }
  })
  expect(r.candidatos).toEqual([
    { personaId: 'vecina', motivo: 'la_vez_pasada' },
    { personaId: 'hijo', motivo: 'vive_aqui' },
  ])
  expect(r.asegurado).toEqual({ unidades: 1, coeficiente: 2.5 })
})

test('la propietaria da su poder desde el inicio con un toque y la administración lo ve (PN-31)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  const tarjeta = page.locator('.tarjeta', { has: page.getByText(/¿No puedes ir a la asamblea ordinaria anual\?/) })
  await expect(tarjeta).toBeVisible()
  await tarjeta.getByRole('button', { name: /Dárselo a Tomas Restrepo Ossa/ }).click()
  await expect(page.getByText(/Listo: le diste tu poder a Tomas/)).toBeVisible()
  await expect(page.getByText(/¿No puedes ir a la asamblea ordinaria anual\?/)).toHaveCount(0)

  await page.goto('/#/app/asambleas/asa-ordinaria-anual?dar-poder=1')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await entrarComo(page, /Gustavo Adolfo Mejia/)
  // A Gustavo (dueño de la 301) le ofrece a Sandra, la arrendataria que vive ahí, o a otra persona.
  await expect(page.getByRole('button', { name: /Dárselo a Sandra Milena Ortiz/ })).toBeVisible()
  await page.getByRole('link', { name: 'A otra persona' }).click()
  await expect(page.getByRole('dialog', { name: 'Dar poder' })).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  // El poder que María Camila le dio a Tomás sigue en los datos del demo.
  await page.goto('/#/admin/asambleas')
  await page.locator('tr', { hasText: 'Asamblea ordinaria anual' }).getByRole('button', { name: 'Abrir' }).click()
  await expect(page.getByText(/Con los poderes que han llegado: 1 unidad/)).toBeVisible()
})
