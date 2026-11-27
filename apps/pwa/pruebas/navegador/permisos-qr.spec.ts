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
    const base = { unidadId: 'uni-torre1-402', personaId: 'per-1', sentido: 'llegada' as const, ascensorId: 'asc-t1' }
    const manana = await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-10', horaInicio: '09:00', horaFin: '11:00' }))
    const domingo = await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-18', horaInicio: '09:00', horaFin: '11:00' }))
    const festivo = await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-12', horaInicio: '09:00', horaFin: '11:00' }))
    const tarde = await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-14', horaInicio: '16:00', horaFin: '19:00' }))
    const bien = (await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-14', horaInicio: '09:00', horaFin: '11:00', placa: 'trk 123' }))) as { id: string; placa: string }
    const cruce = await intento(() => repo.solicitarTrasteo(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', sentido: 'salida', fecha: '2026-10-14', horaInicio: '10:00', horaFin: '12:00', ascensorId: 'asc-t1' }))
    const otroAscensor = (await intento(() => repo.solicitarTrasteo(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', sentido: 'salida', fecha: '2026-10-14', horaInicio: '10:00', horaFin: '12:00', ascensorId: 'asc-t2' }))) as { estado: string }
    const sinAscensor = await intento(() => repo.solicitarTrasteo(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', sentido: 'salida', fecha: '2026-10-15', horaInicio: '10:00', horaFin: '12:00' }))
    const sinMotivo = await intento(() => repo.decidirPermiso(bd, { tipo: 'trasteo', id: bien.id, personaId: 'per-admin', aprobar: false }))
    const propietariaAprueba = await intento(() => repo.decidirPermiso(bd, { tipo: 'trasteo', id: bien.id, personaId: 'per-1', aprobar: true }))
    await intento(() => repo.decidirPermiso(bd, { tipo: 'trasteo', id: bien.id, personaId: 'per-admin', aprobar: true }))
    const mensaje = bd.mensajes.find((m) => m.motivo === 'permiso_decidido')?.texto
    return { manana, domingo, festivo, tarde, placa: bien.placa, cruce, otroAscensor: otroAscensor.estado, sinAscensor, sinMotivo, propietariaAprueba, mensaje }
  })
  expect(r.manana).toMatch(/anticipación/)
  expect(r.domingo).toMatch(/domingos y festivos/)
  expect(r.festivo).toMatch(/domingos y festivos/)
  expect(r.tarde).toMatch(/horario de trasteos/)
  expect(r.placa).toBe('TRK123')
  expect(r.cruce).toMatch(/ya hay un trasteo por ese ascensor/)
  expect(r.otroAscensor).toBe('solicitado')
  expect(r.sinAscensor).toMatch(/cuál ascensor/)
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
  // RN-367, RN-371 — El visitante entra con su ALICE: ahí ve su pase, que cambia cada dos minutos.
  await entrarComo(page, /Juan Sebastian Restrepo/)
  await expect(page.getByText('Tu pase para entrar')).toBeVisible()
  await expect(page.locator('svg[data-qr]')).toBeVisible()
  // Quien lo invitó ya no comparte un código: le llega la invitación al celular.
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/visitantes')
  await expect(page.getByRole('button', { name: 'Compartir el código' })).toHaveCount(0)
})

test('el pase vence a los dos minutos y la portería respeta la franja de horas (RN-371, RN-392)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const ahora = Date.now()
    const pase = reglas.codigoPase('vis-1', ahora)
    return {
      vale: reglas.leerPase(pase, ahora + 60_000),
      vencido: reglas.leerPase(pase, ahora + 3 * 60_000),
      alterado: reglas.leerPase(pase.replace('vis-1', 'vis-2'), ahora),
      otroTexto: reglas.leerPase('1023456789', ahora),
      franjaAlReves: reglas.motivoFranjaInvalida('18:00', '08:00'),
      soloDesde: reglas.motivoFranjaInvalida('08:00', undefined),
      sinFranja: reglas.motivoFranjaInvalida(undefined, undefined),
      fuera: reglas.fueraDeFranja({ horaDesde: '08:00', horaHasta: '12:00' }, '13:30'),
      dentro: reglas.fueraDeFranja({ horaDesde: '08:00', horaHasta: '12:00' }, '09:15'),
    }
  })
  expect(r.vale).toEqual({ visitanteId: 'vis-1' })
  expect(r.vencido).toEqual({ motivo: expect.any(String) })
  expect(r.alterado).toEqual({ motivo: expect.any(String) })
  expect(r.otroTexto).toBeNull()
  expect(r.franjaAlReves).toEqual(expect.any(String))
  expect(r.soloDesde).toEqual(expect.any(String))
  expect(r.sinFranja).toBeNull()
  expect(r.fuera).toBe(true)
  expect(r.dentro).toBe(false)
})

test('la administración parametriza horario, anticipación y ascensores de trasteo (PN-10)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const reglas = { horaDesde: '09:00', horaHasta: '15:00', diasAnticipacion: 5, sabados: false, ascensores: [{ id: 'asc-t1', nombre: 'Ascensor de servicio Torre 1', habilitado: true }, { id: 'asc-t2', nombre: 'Ascensor de servicio Torre 2', habilitado: false }] }
    const propietaria = await intento(() => repo.configurarReglasTrasteo(bd, { copropiedadId: 'cop-1', personaId: 'per-1', reglas }))
    const alReves = await intento(() => repo.configurarReglasTrasteo(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', reglas: { ...reglas, horaHasta: '08:00' } }))
    await intento(() => repo.configurarReglasTrasteo(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', reglas }))
    const base = { unidadId: 'uni-torre1-402', personaId: 'per-1', sentido: 'llegada' as const, horaInicio: '09:00', horaFin: '11:00' }
    return {
      propietaria,
      alReves,
      anticipacion: await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-13', ascensorId: 'asc-t1' })),
      sabado: await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-17', ascensorId: 'asc-t1' })),
      deshabilitado: await intento(() => repo.solicitarTrasteo(bd, { ...base, fecha: '2026-10-15', ascensorId: 'asc-t2' })),
    }
  })
  expect(r.propietaria).toMatch(/administración/)
  expect(r.alReves).toMatch(/después de la de inicio/)
  expect(r.anticipacion).toMatch(/5 días de anticipación/)
  expect(r.sabado).toMatch(/no se trastea los sábados/)
  expect(r.deshabilitado).toMatch(/cuál ascensor/)
})

test('depósito del trasteo: se recibe, se devuelve o se retiene con motivo (PN-13)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const nuevo = (await intento(() => repo.solicitarTrasteo(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', sentido: 'llegada', fecha: '2026-10-14', horaInicio: '09:00', horaFin: '11:00', ascensorId: 'asc-t1' }))) as { deposito?: { valor: number } }
    const antesDeHacerse = await intento(() => repo.cerrarDepositoTrasteo(bd, { trasteoId: 'tra-1', personaId: 'per-admin', resultado: 'devuelto' }))
    await intento(() => repo.marcarTrasteoRealizado(bd, { trasteoId: 'tra-1', personaId: 'per-admin' }))
    const porteriaRetiene = await intento(() => repo.cerrarDepositoTrasteo(bd, { trasteoId: 'tra-1', personaId: 'per-porteria', resultado: 'retenido', valorRetenido: 50000, motivo: 'Rayón en la puerta del ascensor' }))
    const demasiado = await intento(() => repo.cerrarDepositoTrasteo(bd, { trasteoId: 'tra-1', personaId: 'per-admin', resultado: 'retenido', valorRetenido: 300000, motivo: 'Rayón en la puerta del ascensor' }))
    const sinMotivo = await intento(() => repo.cerrarDepositoTrasteo(bd, { trasteoId: 'tra-1', personaId: 'per-admin', resultado: 'retenido', valorRetenido: 50000 }))
    await intento(() => repo.cerrarDepositoTrasteo(bd, { trasteoId: 'tra-1', personaId: 'per-admin', resultado: 'retenido', valorRetenido: 50000, motivo: 'Rayón en la puerta del ascensor' }))
    const mensaje = bd.mensajes.find((m) => m.texto.includes('se retuvieron'))?.texto
    const otraVez = await intento(() => repo.cerrarDepositoTrasteo(bd, { trasteoId: 'tra-1', personaId: 'per-admin', resultado: 'devuelto' }))
    return { valorNuevo: nuevo.deposito?.valor, antesDeHacerse, porteriaRetiene, demasiado, sinMotivo, mensaje, otraVez }
  })
  expect(r.valorNuevo).toBe(200000)
  expect(r.antesDeHacerse).toMatch(/Primero se marca el trasteo/)
  expect(r.porteriaRetiene).toMatch(/administración/)
  expect(r.demasiado).toMatch(/depósito completo/)
  expect(r.sinMotivo).toMatch(/qué daño/)
  expect(r.mensaje).toMatch(/Te devolvemos \$\s?150\.000/)
  expect(r.otraVez).toMatch(/ya se cerró/)
})

test('portería recibe y devuelve el depósito del trasteo de hoy (PN-13)', async ({ page }) => {
  await entrarComo(page, /Jairo Alberto Pineda/)
  await expect(page.getByText('Depósito recibido').first()).toBeVisible()
  await page.getByRole('button', { name: 'Se hizo' }).click()
  await page.getByRole('button', { name: 'Devolver el depósito' }).click()
  await expect(page.getByText('Depósito devuelto', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retener por daños' })).toHaveCount(0)
})

test('sin ascensores en el edificio, no se preguntan ni se eligen (PN-10)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    bd.copropiedades[0].tieneAscensores = false
    const reglas = bd.copropiedades[0].reglasTrasteo!
    bd = (await repo.configurarReglasTrasteo(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', reglas })).bd
    const guardados = bd.copropiedades[0].reglasTrasteo?.ascensores?.length
    const res = await repo.solicitarTrasteo(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', sentido: 'llegada', fecha: '2026-10-14', horaInicio: '09:00', horaFin: '11:00' })
    return { guardados, ascensor: res.datos.ascensorId ?? null }
  })
  expect(r.guardados).toBe(0)
  expect(r.ascensor).toBeNull()
  await page.reload()
  await page.goto('/#/admin/edificio')
  await page.getByRole('tab', { name: /Trasteos y obras/ }).click()
  await expect(page.getByText(/Este edificio no tiene ascensores/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Agregar ascensor' })).toHaveCount(0)
})
