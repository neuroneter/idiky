/**
 * PN-29 — Qué ve y qué hace cada usuario (tabla de Mary, 2026-11-26;
 * docs/recursos/roles-de-alice.md §4 bis).
 */

import { entrarComo, expect, test } from './base'

test('la tabla de permisos tiene a los 18 usuarios en los 20 módulos (PN-29)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const p = await import('/src/dominio/permisos.ts')
    const usuarios = Object.keys(p.NOMBRE_USUARIO) as Array<keyof typeof p.NOMBRE_USUARIO>
    const validos = ['G', 'V', 'S', 's', '-', 'Sop', 'Prep', 'Ley', 'Pod', 'Mod', 'Atn', 'Par']
    const completos = usuarios.every((u) => p.MODULOS.every((m) => validos.includes(p.nivelEn(u, m))))
    return {
      usuarios: usuarios.length,
      modulos: p.MODULOS.length,
      completos,
      familiarReserva: p.veModulo('familiar', 'reservas'),
      familiarPqrs: p.veModulo('familiar', 'pqrs'),
      revisorPqrs: p.veModulo('revisor_fiscal', 'pqrs'),
      auxiliarCartera: p.nivelEn('auxiliar_administrativo', 'cartera'),
      auxiliarPaz: p.nivelEn('auxiliar_administrativo', 'paz_y_salvo'),
      idikyCartera: p.nivelEn('administrador_idiky', 'cartera'),
      inmobiliariaCuentas: p.nivelEn('inmobiliaria', 'cuentas_claras'),
      operadorCartera: p.veModulo('operador', 'cartera'),
      piscineroReservasCambia: p.cambiaEnModulo('piscinero', 'reservas'),
      piscineroMinutaCambia: p.cambiaEnModulo('piscinero', 'minuta'),
    }
  })
  expect(r.usuarios).toBe(18)
  expect(r.modulos).toBe(20)
  expect(r.completos).toBe(true)
  expect(r.familiarReserva).toBe(false)
  expect(r.familiarPqrs).toBe(false)
  expect(r.revisorPqrs).toBe(false)
  expect(r.auxiliarCartera).toBe('V')
  expect(r.auxiliarPaz).toBe('Prep')
  expect(r.idikyCartera).toBe('Sop')
  expect(r.inmobiliariaCuentas).toBe('s')
  expect(r.operadorCartera).toBe(false)
  expect(r.piscineroReservasCambia).toBe(false)
  expect(r.piscineroMinutaCambia).toBe(true)
})

test('en la consola cada cargo ve solo lo suyo (PN-29)', async ({ page }) => {
  await entrarComo(page, /Luz Dary Mosquera/)
  const menu = page.locator('.lateral__nav')
  await expect(page.getByText('Entraste como Aseo')).toBeVisible()
  await expect(menu).toContainText('Reservas')
  await expect(menu).toContainText('Portería')
  await expect(menu).not.toContainText('Cartera')
  await expect(menu).not.toContainText('PQRS')
  await page.goto('/#/admin/pqrs')
  await expect(page.getByText('Esta sección no es para tu perfil')).toBeVisible()

  await entrarComo(page, /Claudia Patricia Mora/)
  await expect(page.locator('.lateral__nav')).not.toContainText('PQRS')
  await page.goto('/#/admin/cartera')
  await expect(page.getByText(/puedes ver, no cambiar/)).toBeVisible()
  await expect(page.locator('.lateral__pie')).toContainText('Revisor Fiscal')
})

test('el auxiliar prepara el paz y salvo y el administrador lo aprueba (PN-29)', async ({ page }) => {
  await entrarComo(page, /Natalia Cifuentes/)
  await page.goto('/#/admin/cartera/paz-y-salvo')
  const fila = page.locator('tr', { hasText: '202' })
  await fila.getByRole('button', { name: 'Preparar paz y salvo' }).click()
  await expect(page.getByText('Por aprobar').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aprobar' })).toHaveCount(0)

  await entrarComo(page, /Olga Lucia Henao/)
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const bd = await repo.cargar()
    const preparado = await repo.emitirPazYSalvo(bd, { copropiedadId: 'cop-1', unidadId: 'uni-torre1-202', preparadoPor: 'per-auxiliar' })
    const porElAuxiliar = await repo.aprobarDocumento(preparado.bd, { documentoId: preparado.datos.id, personaId: 'per-auxiliar' }).then(() => 'ok', (e) => e.message)
    return { numero: preparado.datos.numero, estado: preparado.datos.estado, porElAuxiliar }
  })
  expect(r).toEqual({ numero: 'Por aprobar', estado: 'por_aprobar', porElAuxiliar: expect.stringMatching(/administrador/) })
  await page.reload()
  await page.goto('/#/admin')
  await expect(page.getByText(/paz y salvos? por aprobar/)).toBeVisible()
  await page.goto('/#/admin/cartera/paz-y-salvo')
  await page.getByRole('button', { name: 'Aprobar' }).first().click()
  await expect(page.getByText('Paz y salvo aprobado. El propietario ya lo ve en su app.')).toBeVisible()
  await expect(page.getByText(/PS-\d{4}-\d{4} · Torre 1/).first()).toBeVisible()
})

test('la inmobiliaria y el operador solo ven lo de sus unidades (PN-29)', async ({ page }) => {
  await entrarComo(page, /Inmobiliaria Habitar/)
  const nav = page.locator('.nav-inferior')
  await expect(nav).toContainText('Cuenta')
  await expect(nav).toContainText('Solicitudes')
  await page.locator('.selector-unidad').click()
  await expect(page.getByRole('dialog')).toContainText('301')
  await expect(page.getByRole('dialog')).toContainText('502')

  await entrarComo(page, /Estadías Medellín/)
  await expect(page.locator('.nav-inferior')).not.toContainText('Cuenta')
  await expect(page.locator('.cartera-inicio')).toHaveCount(0)
  await page.goto('/#/app/solicitudes/reservas')
  const segmentos = page.getByRole('navigation', { name: 'Tipo de solicitud' })
  await expect(segmentos).toContainText('Reservas')
  await expect(segmentos).toContainText('PQRS')
  await expect(segmentos).not.toContainText('Paz y salvo')
})
