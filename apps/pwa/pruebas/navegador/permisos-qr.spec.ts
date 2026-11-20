/**
 * CU-R-44, CU-R-45, CU-A-37 — Trasteos y obras en el apartamento (PN-10, PN-11).
 * CU-R-10, CU-P-01 — El código del visitante como QR real (PN-12).
 */

import { entrarComo, expect, test } from './base'

test('trasteo: anticipación, domingos, horario y un solo trasteo a la vez (PN-10)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const base = { unidadId: 'uni-torre1-402', personaId: 'per-1', sentido: 'llegada' as const }
    const manana = await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-10', horaInicio: '09:00', horaFin: '11:00' }))
    const domingo = await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-18', horaInicio: '09:00', horaFin: '11:00' }))
    const festivo = await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-12', horaInicio: '09:00', horaFin: '11:00' }))
    const tarde = await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-14', horaInicio: '16:00', horaFin: '19:00' }))
    const bien = (await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-14', horaInicio: '09:00', horaFin: '11:00', placa: 'trk 123' }))) as { id: string; placa: string }
    const cruce = await intento(() => repo.solicitarTrasteo(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', sentido: 'salida', fecha: '2026-10-14', horaInicio: '10:00', horaFin: '12:00' }))
    const sinMotivo = await intento(() => repo.decidirPermiso(bd, { tipo: 'trasteo', id: bien.id, personaId: 'per-admin', aprobar: false }))
    const propietariaAprueba = await intento(() => repo.decidirPermiso(bd, { tipo: 'trasteo', id: bien.id, personaId: 'per-1', aprobar: true }))
    await intento(() => repo.decidirPermiso(bd, { tipo: 'trasteo', id: bien.id, personaId: 'per-admin', aprobar: true }))
    const mensaje = bd.mensajes.find((m) => m.motivo === 'permiso_decidido')?.texto
    return { manana, domingo, festivo, tarde, placa: bien.placa, cruce, sinMotivo, propietariaAprueba, mensaje }
  })
  expect(r.manana).toMatch(/anticipación/)
  expect(r.domingo).toMatch(/domingos y festivos/)
  expect(r.festivo).toMatch(/domingos y festivos/)
  expect(r.tarde).toMatch(/horario de trasteos/)
  expect(r.placa).toBe('TRK123')
  expect(r.cruce).toMatch(/ya hay un trasteo/)
  expect(r.sinMotivo).toMatch(/por qué no se aprueba/)
  expect(r.propietariaAprueba).toMatch(/administración/)
  expect(r.mensaje).toMatch(/aprobó el trasteo/)
})

test('obra: desde mañana, máximo 90 días y trabajadores con documento (PN-11)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    const bd = await repo.cargar()
    const base = { unidadId: 'uni-torre1-402', personaId: 'per-1', descripcion: 'Cambio de pisos de la sala', contratista: '' }
    const t = [{ nombre: 'Pedro Pérez', documento: '80111222' }]
    const intento = (p: Parameters<typeof repo.solicitarPermisoObra>[1]) => repo.solicitarPermisoObra(bd, p).then(() => 'OK', (e: Error) => 'ERR: ' + e.message)
    return {
      hoy: await intento({ ...base, desde: '2026-10-09', hasta: '2026-10-12', trabajadores: t }),
      larga: await intento({ ...base, desde: '2026-10-10', hasta: '2027-03-01', trabajadores: t }),
      sinTrabajadores: await intento({ ...base, desde: '2026-10-10', hasta: '2026-10-12', trabajadores: [] }),
      repetido: await intento({ ...base, desde: '2026-10-10', hasta: '2026-10-12', trabajadores: [...t, { nombre: 'Otro Pérez', documento: '80.111.222' }] }),
      bien: await intento({ ...base, desde: '2026-10-10', hasta: '2026-10-12', trabajadores: t }),
      domingo: reglas.obraTrabajaHoy(bd.permisosObra[0], '2026-10-11'),
    }
  })
  expect(r.hoy).toMatch(/desde mañana/)
  expect(r.larga).toMatch(/90 días/)
  expect(r.sinTrabajadores).toMatch(/al menos un trabajador/)
  expect(r.repetido).toMatch(/repetido/)
  expect(r.bien).toBe('OK')
  expect(r.domingo).toBe(false)
})

test('la propietaria pide un trasteo, la administración lo aprueba y portería ve los de hoy (CU-R-44, CU-A-37)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/unidad')
  await page.getByRole('link', { name: /Trasteos y obras/ }).click()
  await page.getByRole('button', { name: 'Pedir permiso de trasteo' }).click()
  await page.getByLabel('Fecha').fill('2026-10-14')
  await page.getByRole('button', { name: 'Pedir el permiso' }).click()
  await expect(page.getByText('Por aprobar').first()).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/edificio')
  await page.getByRole('tab', { name: /Trasteos y obras/ }).click()
  await page.getByRole('button', { name: 'Aprobar' }).first().click()
  await expect(page.getByText('Aprobado').first()).toBeVisible()

  await entrarComo(page, /Jairo Alberto Pineda/)
  await expect(page.getByText('Hoy en el edificio')).toBeVisible()
  await expect(page.getByText(/Mudanzas El Roble/)).toBeVisible()
  await expect(page.getByText(/Wilson Andrés Cárdenas \(80123456\)/)).toBeVisible()
  await page.getByRole('button', { name: 'Se hizo' }).click()
  await expect(page.getByText('Hecho', { exact: true })).toBeVisible()
})

test('el código del visitante es un QR real con su patrón de posición (PN-12)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const { generarQr } = await import('/src/utilidades/qr.ts')
    const m = generarQr('IDK-ABCDE')
    const fila = (y: number) => m[y].slice(0, 7).map((b) => (b ? 1 : 0)).join('')
    return { tamano: m.length, finder: [fila(0), fila(2), fila(6)], largo: generarQr('x'.repeat(60)).length }
  })
  expect(r.tamano).toBe(21)
  expect(r.finder).toEqual(['1111111', '1011101', '1111111'])
  expect(r.largo).toBe(33)
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/visitantes')
  await page.locator('.tarjeta--accion, .tarjeta button').first().click().catch(() => {})
  await expect(page.locator('svg[data-qr]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Compartir el código' })).toBeVisible()
})
