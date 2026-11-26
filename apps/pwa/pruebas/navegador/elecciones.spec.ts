/**
 * PN-23 — Elecciones en la asamblea: postulaciones al consejo, al comité de
 * convivencia y a revisor fiscal (CU-A-12, CU-R-21; Mary, 2026-11-23).
 */

import { entrarComo, expect, test } from './base'

test('quién puede postularse a cada cargo (PN-23)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const base = {
      asamblea: { estado: 'convocada' as const },
      hayVotacion: false,
      esAdministracion: false,
      yaPostulado: false,
      nombre: 'Ana',
      presentacion: 'Quiero ayudar al edificio.',
    }
    const m = (extra: object) => reglas.motivoPostulacionInvalida({ ...base, ...extra } as never)
    return {
      propietarioConsejo: m({ punto: { eleccion: 'consejo' }, rol: 'propietario' }),
      arrendatarioConsejo: m({ punto: { eleccion: 'consejo' }, rol: 'arrendatario' }),
      arrendatarioComite: m({ punto: { eleccion: 'comite_convivencia' }, rol: 'arrendatario' }),
      familiarComite: m({ punto: { eleccion: 'comite_convivencia' }, rol: 'familiar' }),
      propietarioRevisor: m({ punto: { eleccion: 'revisor_fiscal' }, rol: 'propietario' }),
      adminRevisorSinMatricula: m({ punto: { eleccion: 'revisor_fiscal' }, esAdministracion: true }),
      adminRevisor: m({ punto: { eleccion: 'revisor_fiscal' }, esAdministracion: true, matricula: '123456-T' }),
      conVotacion: m({ punto: { eleccion: 'consejo' }, rol: 'propietario', hayVotacion: true }),
      repetida: m({ punto: { eleccion: 'consejo' }, rol: 'propietario', yaPostulado: true }),
      noEsEleccion: m({ punto: {}, rol: 'propietario' }),
    }
  })
  expect(r.propietarioConsejo).toBeNull()
  expect(r.arrendatarioConsejo).toMatch(/propietarios/)
  expect(r.arrendatarioComite).toBeNull()
  expect(r.familiarComite).toMatch(/arrendatarios/)
  expect(r.propietarioRevisor).toMatch(/administración/)
  expect(r.adminRevisorSinMatricula).toMatch(/matrícula/)
  expect(r.adminRevisor).toBeNull()
  expect(r.conVotacion).toMatch(/cerraron/)
  expect(r.repetida).toMatch(/Ya tienes/)
  expect(r.noEsEleccion).toMatch(/no es una elección/)
})

test('la propietaria se postula al consejo desde la app y el familiar no ve el botón (PN-23)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/asambleas/asa-ordinaria-anual')
  const punto = page.locator('.tarjeta', { has: page.locator('strong', { hasText: /^Elección del consejo de administración$/ }) })
  await expect(punto).toContainText('Gustavo Adolfo Mejia Toro')
  await punto.getByRole('button', { name: 'Postularme' }).click()
  await punto.getByLabel('Por qué votar por esta postulación').fill('Vivo aquí hace diez años y conozco las obras pendientes.')
  await punto.getByRole('button', { name: 'Postularme' }).click()
  await expect(punto).toContainText('Maria Camila')
  await expect(punto.getByRole('button', { name: 'Retirar mi postulación' })).toBeVisible()
  await expect(punto.getByRole('button', { name: 'Postularme' })).toHaveCount(0)

  await entrarComo(page, /Tomas Restrepo Ossa/)
  await page.goto('/#/app/asambleas/asa-ordinaria-anual')
  // PN-29 — El familiar o acompañante no ve las asambleas (tabla de Mary, 2026-11-26).
  await expect(page.getByText('Esto no es para tu perfil')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Postularme' })).toHaveCount(0)
})

test('la votación de la elección trae a los candidatos y el voto en blanco (PN-23)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.locator('tr', { hasText: 'Asamblea ordinaria anual' }).getByRole('button', { name: 'Abrir' }).click()
  const punto = page.locator('li', { has: page.locator('strong', { hasText: /^Elección del consejo de administración$/ }) })
  await punto.getByRole('button', { name: 'Registrar candidato' }).click()
  await punto.getByLabel('Nombre del candidato').fill('Luz Marina Ortiz')
  await punto.getByLabel('Por qué votar por esta postulación').fill('Se postuló en la sala, de viva voz.')
  await punto.getByRole('button', { name: 'Registrar', exact: true }).click()
  await expect(punto).toContainText('Luz Marina Ortiz')
  await punto.getByRole('button', { name: 'Preparar la votación' }).click()
  await expect(punto.getByLabel('Opción 1')).toHaveValue('Gustavo Adolfo Mejia Toro')
  await expect(punto.getByLabel('Opción 2')).toHaveValue('Luz Marina Ortiz')
  await expect(punto.getByLabel('Opción 3')).toHaveValue('Voto en blanco')
  // Viene marcada como no económica desde la citación.
  await expect(punto.getByRole('button', { name: 'No es económica' })).toHaveAttribute('aria-current', 'page')
})

test('al citar, un punto se marca como elección y deja de preguntar si es económico (PN-23)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.getByRole('button', { name: /Convocar/ }).first().click()
  await page.getByText('Este punto se somete a votación').click()
  await expect(page.getByLabel('Tipo de decisión del punto 1')).toBeVisible()
  await page.getByLabel('Elección del punto 1').selectOption('revisor_fiscal')
  await expect(page.getByLabel('Tipo de decisión del punto 1')).toHaveCount(0)
})
