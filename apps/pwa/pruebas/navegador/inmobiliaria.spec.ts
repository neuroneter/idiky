/**
 * RN-228, RN-229, CU-R-33 — El propietario marca si su apartamento lo maneja
 * una inmobiliaria, si ella asiste a las asambleas y si paga la administración,
 * con soporte que revisa la administración (Mary, 2026-11-10).
 */

import { entrarComo, expect, test } from './base'

// Una imagen PNG de 1×1: el soporte de prueba.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

test('sin soporte no se registra; recibida, asiste a las asambleas y le llegan los mensajes de pago (RN-228)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async (PNG) => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const datos = {
      unidadId: 'uni-torre2-901', personaId: 'per-2', nombre: 'Inmobiliaria Los Andes', nit: '900123456',
      telefono: '+57 601 555 1234', email: 'contacto@losandes.co', asisteAsambleas: true, pagaAdministracion: true,
    }
    const sinSoporte = await intento(() => repo.registrarInmobiliaria(bd, { ...datos, imagen: '' }))
    const res = (await intento(() => repo.registrarInmobiliaria(bd, { ...datos, imagen: `data:image/png;base64,${PNG}` }))) as { id: string }
    const poderesInm = () => bd.poderes.filter((p) => p.porInmobiliaria && p.unidadId === 'uni-torre2-901' && !p.revocadoEn).map((p) => p.asambleaId).sort()
    const antesDeRecibir = poderesInm()
    const laPropietaria = await intento(() => repo.revisarInmobiliaria(bd, { residenciaId: res.id, personaId: 'per-1', recibe: true }))
    await intento(() => repo.revisarInmobiliaria(bd, { residenciaId: res.id, personaId: 'per-admin', recibe: true }))
    const recibida = poderesInm()

    // Los recordatorios de pago van a la inmobiliaria, no al propietario.
    await intento(() => repo.configurarRecordatorioPago(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', activo: true, diasAntes: 2 }))
    const telInm = '+57 601 555 1234'
    const telAndres = bd.personas.find((p) => p.id === 'per-2')!.telefono
    const recordatorios = bd.mensajes.filter((m) => m.motivo === 'recordatorio_pago')
    const aInmobiliaria = recordatorios.some((m) => m.destino === telInm)
    const aAndres = recordatorios.some((m) => m.destino === telAndres)

    // Con la inmobiliaria asistiendo, no se puede dejar otro apoderado permanente.
    const otroApoderado = await intento(() => repo.registrarApoderadoPermanente(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', nombresApoderado: 'Pedro', apellidosApoderado: 'Externo', documentoApoderado: '88112233' }))
    await intento(() => repo.retirarInmobiliaria(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2' }))
    return { sinSoporte, antesDeRecibir, laPropietaria, recibida, aInmobiliaria, aAndres, otroApoderado, alRetirar: poderesInm() }
  }, PNG)
  expect(r.sinSoporte).toMatch(/Falta el soporte/)
  expect(r.antesDeRecibir).toEqual([])
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.recibida).toEqual(['asa-extra-cubierta', 'asa-ordinaria-anual'])
  expect(r.aInmobiliaria).toBe(true)
  expect(r.aAndres).toBe(false)
  expect(r.otroApoderado).toMatch(/inmobiliaria es la que asiste/)
  expect(r.alRetirar).toEqual([])
})

test('para el tope, las unidades de un mismo propietario cuentan como una (RN-229)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const p = (unidadId: string, otorgadoPor: string) => ({ id: unidadId, asambleaId: 'a', unidadId, otorgadoPor, apoderadoId: 'inm', origen: 'app', registradoPor: otorgadoPor, registradoEn: '' })
    const dosUnidadesDelMismo = [p('u1', 'dueno-1'), p('u2', 'dueno-1')] as never[]
    return {
      mismoDueno: reglas.motivoTopePoderes(dosUnidadesDelMismo, 'a', 'inm', 1, 'dueno-1'),
      otroDueno: reglas.motivoTopePoderes(dosUnidadesDelMismo, 'a', 'inm', 1, 'dueno-2'),
    }
  })
  expect(r.mismoDueno).toBeUndefined()
  expect(r.otroDueno).toMatch(/representa a 1 propietario/)
})

test('el propietario registra su inmobiliaria con soporte y la administración la recibe (CU-R-33)', async ({ page }) => {
  await entrarComo(page, /Andres Felipe Gomez/)
  await page.goto('/#/app/unidad')
  await page.getByRole('button', { name: 'Mi apartamento lo maneja una inmobiliaria' }).click()
  await page.getByLabel('Nombre de la inmobiliaria').fill('Inmobiliaria Los Andes')
  await page.getByLabel('NIT').fill('900123456')
  await page.getByLabel('Celular de la inmobiliaria').fill('+57 601 555 1234')
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'contrato.png', mimeType: 'image/png', buffer: Buffer.from(PNG, 'base64') })
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('La revisa la administración')).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/unidades')
  const tarjeta = page.locator('.tarjeta', { has: page.getByText('Inmobiliarias', { exact: true }) })
  await tarjeta.getByRole('button', { name: 'Recibir', exact: true }).click()
  await expect(tarjeta.getByText('Recibida', { exact: true })).toBeVisible()
})
