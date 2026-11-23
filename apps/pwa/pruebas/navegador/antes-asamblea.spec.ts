/**
 * PN-24 — Antes de la asamblea: documentos para leer y preguntas de los
 * propietarios (CU-A-12, CU-R-20; Mary, 2026-11-23).
 */

import { entrarComo, expect, test } from './base'

test('las preguntas se reciben mientras la asamblea está convocada y solo del propietario (PN-24)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const t = '¿Cuánto sube la cuota el próximo año?'
    return {
      ok: reglas.motivoPreguntaAsambleaInvalida({ estado: 'convocada' }, 'propietario', t),
      instalada: reglas.motivoPreguntaAsambleaInvalida({ estado: 'instalada' } as never, 'propietario', t),
      arrendatario: reglas.motivoPreguntaAsambleaInvalida({ estado: 'convocada' }, 'arrendatario', t),
      corta: reglas.motivoPreguntaAsambleaInvalida({ estado: 'convocada' }, 'propietario', '¿?'),
    }
  })
  expect(r.ok).toBeNull()
  expect(r.instalada).toMatch(/en la reunión/)
  expect(r.arrendatario).toMatch(/propietarios/)
  expect(r.corta).not.toBeNull()
})

test('la propietaria pregunta, la administradora publica un documento y responde (PN-24)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/asambleas/asa-ordinaria-anual')
  const antes = page.locator('.tarjeta', { has: page.locator('.titulo-seccion', { hasText: 'Antes de la asamblea' }) })
  // La respondida de otro propietario se ve, sin su nombre.
  await expect(antes).toContainText('bombas del agua')
  await expect(antes).not.toContainText('Gustavo')
  await antes.getByLabel('Tu pregunta').fill('¿Se va a cambiar la empresa de vigilancia este año?')
  await antes.getByRole('button', { name: 'Enviar pregunta' }).click()
  await expect(antes).toContainText('Esperando respuesta de la administración')

  await entrarComo(page, /Olga Lucia Henao/)
  // Entrar reinicia los datos del demo: la pregunta se repite como la administradora la recibiría.
  await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const bd = await repo.cargar()
    await repo.preguntarAntesDeAsamblea(bd, { asambleaId: 'asa-ordinaria-anual', personaId: 'per-1', unidadId: 'uni-torre1-402', texto: '¿Se va a cambiar la empresa de vigilancia este año?' })
  })
  await page.reload()
  await page.goto('/#/admin')
  await expect(page.getByText(/preguntas? para la asamblea sin responder/)).toBeVisible()
  await page.goto('/#/admin/asambleas')
  await page.locator('tr', { hasText: 'Asamblea ordinaria anual' }).getByRole('button', { name: 'Abrir' }).click()
  const admin = page.locator('.tarjeta', { has: page.locator('.titulo-seccion', { hasText: 'Antes de la asamblea' }) })
  await admin.getByLabel('Título del documento').fill('Presupuesto 2027')
  await admin.getByRole('button', { name: 'Publicar para la asamblea' }).click()
  await expect(admin).toContainText('Presupuesto 2027')
  await admin.getByLabel('Respuesta').first().fill('No: el contrato sigue hasta junio y se revisa en el consejo.')
  await admin.getByRole('button', { name: 'Responder' }).first().click()
  await expect(admin).toContainText('el contrato sigue hasta junio')
})
