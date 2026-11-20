/**
 * Revisión entre perfiles — Mary, 2026-11-20. Lo que espera a la administración,
 * lo que portería ve del día, la minuta completa, los trámites que la
 * administración hace por el propietario y lo que no le aplica al familiar (PN-20).
 */

import { entrarComo, expect, test } from './base'

test('el tablero de la administración dice qué la espera (Te esperan)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    bd = (await repo.pedirAyuda(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', tipo: 'salud' })).bd
    await repo.proponerAcuerdoPago(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', cuotas: 3, primera: '2026-10-15' })
  })
  await page.reload()
  await page.goto('/#/admin')
  await expect(page.getByText('Te esperan')).toBeVisible()
  await expect(page.getByText(/1 pedido de ayuda sin atender/)).toBeVisible()
  await expect(page.getByText(/1 acuerdo de pago por aprobar/)).toBeVisible()
  await expect(page.getByText(/1 trasteo por aprobar/)).toBeVisible()
  await expect(page.getByText(/1 obra en apartamento por aprobar/)).toBeVisible()
})

test('portería ve el calendario de hoy y la minuta registra ayuda, trasteo y objetos', async ({ page }) => {
  await entrarComo(page, /Jairo Alberto Pineda/)
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const sel = await import('/src/datos/selectores.ts')
    let bd = await repo.cargar()
    const paso = async (f: () => Promise<{ bd: typeof bd }>) => { bd = (await f()).bd }
    await paso(() => repo.programarEventoEdificio(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', titulo: 'Corte de agua por lavado de tanques', tipo: 'corte', fecha: '2026-10-09' }))
    const turno = (await repo.abrirTurno(bd, { copropiedadId: 'cop-1', personaId: 'per-porteria' }))
    bd = turno.bd
    const alerta = (await repo.pedirAyuda(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', tipo: 'salud' }))
    bd = alerta.bd
    await paso(() => repo.atenderAyuda(bd, { alertaId: alerta.datos.id, personaId: 'per-porteria', paso: 'atendida', nota: 'Se llamó a la ambulancia' }))
    await paso(() => repo.marcarTrasteoRealizado(bd, { trasteoId: 'tra-1', personaId: 'per-porteria' }))
    await paso(() => repo.registrarObjetoEncontrado(bd, { copropiedadId: 'cop-1', personaId: 'per-porteria', descripcion: 'Sombrilla negra', lugar: 'Lobby' }))
    const minuta = sel.minutaDeTurno(bd, turno.datos)
    return minuta.map((l) => `${l.tipo}: ${l.texto}`)
  })
  expect(r.some((l) => l.startsWith('ayuda: Se atendió') && l.includes('ambulancia'))).toBe(true)
  expect(r.some((l) => l.startsWith('trasteo: Se hizo el trasteo'))).toBe(true)
  expect(r.some((l) => l.startsWith('objeto: Se recibió: Sombrilla negra'))).toBe(true)
  await page.reload()
  await page.goto('/#/porteria')
  await expect(page.getByText('Corte de agua por lavado de tanques')).toBeVisible()
})

test('la administración genera el certificado de pagos por el propietario y ve los pagos programados', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/cartera/certificados')
  await page.getByLabel('Unidad').selectOption({ label: 'Torre 1 · 402' })
  await page.getByRole('button', { name: 'Generar el certificado' }).click()
  await expect(page.getByRole('heading', { name: /CERTIFICADO DE PAGOS/ })).toBeVisible()
  await expect(page.locator('.hoja-documento')).toHaveCount(1)
  await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const bd = await repo.cargar()
    await repo.programarPago(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', medio: 'pse', dia: 20 })
  })
  await page.reload()
  await page.goto('/#/admin/cartera')
  await expect(page.getByText('Pagos programados')).toBeVisible()
  await expect(page.getByText(/Día 20 · débito PSE/)).toBeVisible()
})

test('al familiar no se le muestra lo que decide el propietario o el arrendatario (PN-20)', async ({ page }) => {
  await entrarComo(page, /Tomas Restrepo Ossa/)
  await page.goto('/#/app/cuenta')
  await expect(page.getByText('Valor adeudado').first()).toBeVisible()
  await expect(page.getByText('Pago programado')).toHaveCount(0)
  await page.goto('/#/app/edificio/encuestas')
  await expect(page.getByRole('button', { name: 'Enviar mi respuesta' })).toHaveCount(0)
  await page.goto('/#/app/unidad/permisos')
  await expect(page.getByRole('button', { name: 'Pedir permiso de trasteo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pedir permiso de obra' })).toHaveCount(0)
  await page.goto('/#/app/proyectos')
  await expect(page.getByRole('button', { name: 'Hacer una pregunta' })).toHaveCount(0)
  await page.goto('/#/app/cuenta/pagos')
  await expect(page.getByRole('button', { name: 'Generar el certificado' })).toHaveCount(0)
})
