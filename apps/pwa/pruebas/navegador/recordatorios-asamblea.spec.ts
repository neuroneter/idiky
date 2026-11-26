/**
 * PN-27 — Recordatorios de la asamblea a los propietarios (CU-A-12, CU-R-20;
 * Mary, 2026-11-26). El reloj del demo está fijo en el 2026-10-09.
 */

import { entrarComo, expect, test } from './base'

test('qué recordatorio toca y cómo se dice (PN-27)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const config = { activo: true, dias: [8, 1, 0] }
    const a = (fecha: string, recordatorios: Array<{ dias: number; enviadoEn: string; personas: number }> = []) => ({
      estado: 'convocada' as const,
      fechaHora: `${fecha}T18:30:00-05:00`,
      recordatorios,
    })
    const texto = (dias: number, dioPoder: boolean, modalidad: 'presencial' | 'virtual') =>
      reglas.textoRecordatorioAsamblea({
        copropiedad: 'Conjunto Prueba',
        nombre: 'Ana',
        asamblea: { titulo: 'Asamblea ordinaria anual', fechaHora: '2026-10-17T18:30:00-05:00', modalidad, lugar: 'Salón social' },
        dias,
        dioPoder,
      })
    return {
      lejos: reglas.recordatorioAsambleaQueToca(a('2026-10-30'), config, '2026-10-09'),
      ocho: reglas.recordatorioAsambleaQueToca(a('2026-10-17'), config, '2026-10-09'),
      yaSalio: reglas.recordatorioAsambleaQueToca(a('2026-10-17', [{ dias: 8, enviadoEn: 'x', personas: 3 }]), config, '2026-10-10'),
      citadaTarde: reglas.recordatorioAsambleaQueToca(a('2026-10-10'), config, '2026-10-09'),
      apagado: reglas.recordatorioAsambleaQueToca(a('2026-10-17'), { activo: false, dias: [8] }, '2026-10-09'),
      sinPoder: texto(8, false, 'presencial'),
      manana: texto(1, true, 'presencial'),
      virtual: texto(0, false, 'virtual'),
      sinDias: reglas.motivoRecordatoriosAsambleaInvalidos(true, []),
    }
  })
  expect(r.lejos).toBeNull()
  expect(r.ocho).toEqual({ dias: 8, marcar: [8] })
  expect(r.yaSalio).toBeNull()
  // Citada a un día: sale uno solo, el de mañana, y el de 8 días se da por pasado.
  expect(r.citadaTarde).toEqual({ dias: 1, marcar: [1, 8] })
  expect(r.apagado).toBeNull()
  expect(r.sinPoder).toMatch(/es en 8 días/)
  expect(r.sinPoder).toMatch(/puedes dar tu poder desde la app/)
  expect(r.manana).toMatch(/es mañana/)
  expect(r.manana).toMatch(/tu código para entrar/)
  expect(r.manana).not.toMatch(/poder/)
  expect(r.virtual).toMatch(/es hoy/)
  expect(r.virtual).toMatch(/enlace/)
  expect(r.virtual).not.toMatch(/código para entrar/)
  expect(r.sinDias).not.toBeNull()
})

test('el sistema manda el recordatorio de los 8 días una sola vez, una por persona (PN-27)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    await repo.cargar()
    // La ordinaria del demo, movida a 8 días: así le toca el recordatorio hoy.
    const clave = 'idiky.demo.bd'
    const bd = JSON.parse(localStorage.getItem(clave)!)
    const asamblea = bd.asambleas.find((a: { id: string }) => a.id === 'asa-ordinaria-anual')
    asamblea.fechaHora = '2026-10-17T18:30:00-05:00'
    localStorage.setItem(clave, JSON.stringify(bd))
    const primera = await repo.cargar()
    const segunda = await repo.cargar()
    const deAsamblea = (b: typeof primera) => b.mensajes.filter((m) => m.motivo === 'recordatorio_asamblea')
    const mensajes = deAsamblea(segunda)
    return {
      enPrimera: deAsamblea(primera).length,
      enSegunda: mensajes.length,
      personas: new Set(mensajes.map((m) => m.personaId)).size,
      gustavo: mensajes.filter((m) => m.personaId === 'per-13').length,
      registrado: segunda.asambleas.find((a) => a.id === 'asa-ordinaria-anual')!.recordatorios,
    }
  })
  expect(r.enPrimera).toBeGreaterThan(0)
  expect(r.enSegunda).toBe(r.enPrimera)
  expect(r.personas).toBe(r.enPrimera)
  // Gustavo tiene dos unidades y recibe un solo mensaje.
  expect(r.gustavo).toBe(1)
  expect(r.registrado).toEqual([{ dias: 8, enviadoEn: expect.any(String), personas: r.enPrimera }])
})

test('la administradora parametriza y manda un recordatorio a mano; la propietaria lo puede apagar (PN-27)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await expect(page.getByText('Recordatorios de la asamblea')).toBeVisible()
  await page.getByLabel('3 días antes').check()
  await page.getByRole('button', { name: 'Guardar recordatorios' }).click()
  await expect(page.getByText('Recordatorios guardados.')).toBeVisible()

  await page.locator('tr', { hasText: 'Asamblea ordinaria anual' }).getByRole('button', { name: 'Abrir' }).click()
  const tarjeta = page.locator('.tarjeta', { has: page.locator('strong', { hasText: 'Recordatorios a los propietarios' }) })
  await expect(tarjeta).toContainText('Próximo: 8 días antes')
  await tarjeta.getByRole('button', { name: 'Enviar un recordatorio ahora' }).click()
  await expect(tarjeta).toContainText(/Enviado a mano: .*, a \d+ propietarios/)

  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/avisos')
  await expect(page.getByRole('main').getByText('Asambleas', { exact: true })).toBeVisible()
  await expect(page.getByText(/La citación te llega siempre/)).toBeVisible()
})
