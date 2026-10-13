/**
 * RN-223 — Festivos de Colombia (Ley 51 de 1983) en los días hábiles de la
 * Ley 675: segunda convocatoria (art. 41) y plazo del acta (art. 47).
 */

import { expect, test } from './base'

test('los festivos de Colombia salen de la ley y se saltan al contar días hábiles (RN-223)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    return {
      f2026: [...reglas.festivosDeColombia(2026)].sort(),
      f2025: [...reglas.festivosDeColombia(2025)].sort(),
      lunesFestivo: reglas.esFestivo('2026-10-12'),
      martes: reglas.esFestivo('2026-10-13'),
      // Viernes 9 de octubre de 2026: el lunes 12 es festivo.
      segunda: reglas.fechaSegundaConvocatoria('2026-10-09T18:00:00'),
      // Miércoles santo 2026-04-01: jueves y viernes santos no cuentan.
      semanaSanta: reglas.sumarDiasHabiles('2026-04-01', 1),
    }
  })
  // Calendario oficial 2026 (18 festivos).
  expect(r.f2026).toEqual([
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
    '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
    '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
  ])
  // 2025: San Pedro y Sagrado Corazón cayeron el mismo lunes 30 de junio.
  expect(r.f2025).toContain('2025-06-30')
  expect(r.f2025).toContain('2025-04-18')
  expect(r.f2025.length).toBe(17)
  expect(r.lunesFestivo).toBe(true)
  expect(r.martes).toBe(false)
  expect(r.segunda).toBe('2026-10-15')
  expect(r.semanaSanta).toBe('2026-04-06')
})
