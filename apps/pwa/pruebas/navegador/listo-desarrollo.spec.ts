/**
 * Lista para desarrollo — Mary, 2026-11-23. Día de vencimiento por edificio
 * (RN-23, T-59), parqueaderos de visitantes, varios edificios (CU-A-15),
 * informes (CU-A-16) y PQRS por vencer (CU-S-05).
 */

import { entrarComo, expect, test } from './base'

test('el día de vencimiento lo fija el edificio y aplica a las cuotas nuevas (RN-23, T-59)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const malo = await intento(() => repo.configurarDiaVencimiento(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', dia: 31 }))
    const propietaria = await intento(() => repo.configurarDiaVencimiento(bd, { copropiedadId: 'cop-1', personaId: 'per-1', dia: 15 }))
    const antes = bd.cuotas.filter((c) => c.periodo === '2026-10').map((c) => c.fechaVencimiento.slice(8))
    await intento(() => repo.configurarDiaVencimiento(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', dia: 15 }))
    const nuevas = (await intento(() => repo.generarCuotas(bd, { copropiedadId: 'cop-1', periodo: '2027-01', tipo: 'ordinaria', concepto: 'Cuota de administración', valor: 45000, referencia: '', justificacion: '' }))) as Array<{ fechaVencimiento: string }>
    const despues = bd.cuotas.filter((c) => c.periodo === '2026-10').map((c) => c.fechaVencimiento.slice(8))
    return { malo, propietaria, nuevas: Array.isArray(nuevas) ? [...new Set(nuevas.map((c) => c.fechaVencimiento))] : nuevas, mismas: JSON.stringify(antes) === JSON.stringify(despues) }
  })
  expect(r.malo).toMatch(/del 1 al 28/)
  expect(r.propietaria).toMatch(/administración/)
  expect(r.nuevas).toEqual(['2027-01-15'])
  expect(r.mismas).toBe(true)
})

test('el parqueadero de visitantes pide la placa y portería la reconoce hoy (PN-21)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const sel = await import('/src/datos/selectores.ts')
    let bd = await repo.cargar()
    const base = { zonaId: 'zon-parq-visitantes', unidadId: 'uni-torre1-402', personaId: 'per-1', fecha: '2026-10-09', horaInicio: '13:00', horaFin: '16:00' }
    const sinPlaca = await repo.crearReserva(bd, base).then(() => 'OK', (e: Error) => 'ERR: ' + e.message)
    const mala = await repo.crearReserva(bd, { ...base, placaVisitante: '12' }).then(() => 'OK', (e: Error) => 'ERR: ' + e.message)
    const res = await repo.crearReserva(bd, { ...base, placaVisitante: 'jkl 345', visitanteEsperado: 'Mi tío Pedro' })
    bd = res.bd
    return { sinPlaca, mala, placa: res.datos.placaVisitante, estado: res.datos.estado, quien: sel.quienEsLaPlaca(bd, 'cop-1', 'JKL345')?.tipo }
  })
  expect(r.sinPlaca).toMatch(/placa del carro de tu visitante/)
  expect(r.mala).toMatch(/tres letras/)
  expect(r.placa).toBe('JKL345')
  expect(r.estado).toBe('confirmada')
  expect(r.quien).toBe('parqueadero')
  await entrarComo(page, /Jairo Alberto Pineda/)
  await page.reload()
  await page.goto('/#/porteria')
  await expect(page.getByText(/placa JKL345 para Torre 1 · 402/)).toBeVisible()
})

test('la administradora cambia de edificio sin salir y ve los datos de cada uno (CU-A-15)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/unidades')
  await expect(page.getByText('Torre 1 · 402').first()).toBeVisible()
  await page.getByLabel('Edificio').selectOption({ label: 'Edificio Mirador del Parque' })
  await expect(page.getByText('Mirador · 101').first()).toBeVisible()
  await expect(page.getByText('Torre 1 · 402')).toHaveCount(0)
  await page.getByLabel('Edificio').selectOption({ label: 'Conjunto Residencial Altos del Bosque' })
  await expect(page.getByText('Torre 1 · 402').first()).toBeVisible()
})

test('cartera y PQRS se descargan a Excel; las PQRS por vencer se avisan antes (CU-A-16, CU-S-05, PN-22)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const p = { estado: 'abierta', fechaLimite: '2026-10-11' } as never
    const lejos = { estado: 'abierta', fechaLimite: '2026-10-20' } as never
    const vencida = { estado: 'abierta', fechaLimite: '2026-10-01' } as never
    return [reglas.pqrsPorVencer(p, '2026-10-09'), reglas.pqrsPorVencer(lejos, '2026-10-09'), reglas.pqrsPorVencer(vencida, '2026-10-09')]
  })
  expect(r).toEqual([true, false, false])

  await page.goto('/#/admin/cartera')
  const [cartera] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar a Excel' }).click()])
  expect(cartera.suggestedFilename()).toMatch(/^cartera-.*\.csv$/)
  await page.goto('/#/admin/pqrs')
  await expect(page.getByRole('button', { name: 'Por vencer' })).toBeVisible()
  const [pqrs] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar a Excel' }).click()])
  expect(pqrs.suggestedFilename()).toMatch(/^pqrs-.*\.csv$/)
})
