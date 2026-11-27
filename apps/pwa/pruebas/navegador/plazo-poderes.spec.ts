/**
 * RN-309 — El plazo para dar y revocar poderes (Daniel, 2026-11-03; confirmada por Mary, 2026-11-27).
 * El reloj del demo está en el 2026-10-09.
 */

import { entrarComo, expect, test } from './base'

test('el poder se da y se revoca dentro del plazo del edificio, nunca en la reunión (RN-309)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const a = (fecha: string, estado = 'convocada') => ({ estado, fechaHora: `${fecha}T19:00:00-05:00` }) as never
    const hoy = '2026-10-09'
    const m = (asamblea: never, plazo?: never) => reglas.motivoFueraDePlazoPoder(asamblea, plazo, hoy)
    return {
      quorumHoy: m(a('2026-10-09')),
      quorumInstalada: m(a('2026-10-09', 'instalada')),
      anteriorManana: m(a('2026-10-10'), { tipo: 'dia_anterior' } as never),
      anteriorHoy: m(a('2026-10-09'), { tipo: 'dia_anterior' } as never),
      dosDiasEnTres: m(a('2026-10-12'), { tipo: 'dias_antes', dias: 2 } as never),
      dosDiasEnUno: m(a('2026-10-10'), { tipo: 'dias_antes', dias: 2 } as never),
      invalido: reglas.motivoPlazoPoderesInvalido({ tipo: 'dias_antes', dias: 30 }),
    }
  })
  expect(r.quorumHoy).toBeNull()
  expect(r.quorumInstalada).toMatch(/ya se cerró/)
  expect(r.anteriorManana).toBeNull()
  expect(r.anteriorHoy).toMatch(/día anterior/)
  expect(r.dosDiasEnTres).toBeNull()
  expect(r.dosDiasEnUno).toMatch(/2 días antes/)
  expect(r.invalido).not.toBeNull()
})

test('fuera de plazo no se da ni se revoca el poder; la administradora escoge el plazo (RN-309)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const bd = await repo.cargar()
    // La asamblea en curso ya está instalada: el plazo se cerró.
    return repo
      .otorgarPoder(bd, { asambleaId: 'asa-extra-cubierta', unidadId: 'uni-torre1-402', otorgadoPor: 'per-1', nombresApoderado: 'Ana', apellidosApoderado: 'Ruiz', documentoApoderado: '123456' })
      .then(() => 'ok', (e) => e.message)
  })
  expect(r).toMatch(/plazo de los poderes/)

  await page.goto('/#/admin/asambleas')
  const tarjeta = page.locator('.tarjeta', { has: page.locator('strong', { hasText: 'Plazo de los poderes' }) })
  await expect(tarjeta).toContainText('hasta que se verifica el quórum')
  await tarjeta.getByRole('button', { name: 'Hasta el día anterior' }).click()
  await tarjeta.getByRole('button', { name: 'Guardar el plazo' }).click()
  await expect(page.getByText(/Guardado: los poderes se reciben hasta el día anterior/)).toBeVisible()
  await expect(tarjeta).toContainText('Hoy se dan y se revocan hasta el día anterior a la asamblea')
})

test('la propietaria ve hasta cuándo puede dar el poder (RN-309)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/asambleas/asa-ordinaria-anual')
  await expect(page.getByText(/Se recibe hasta que se verifica el quórum/)).toBeVisible()
  await page.goto('/#/app/asambleas/asa-extra-cubierta')
  await expect(page.getByText(/El plazo de los poderes para esta asamblea ya se cerró/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Dar poder' })).toHaveCount(0)
})
