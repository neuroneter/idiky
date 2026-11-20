/**
 * CU-R-46 — Certificado de pagos del año (PN-14).
 * CU-R-47, CU-A-38 — Calificar la atención de una PQRS (PN-15).
 */

import { entrarComo, expect, test } from './base'

test('el certificado de pagos suma los aplicados del año, sin anulados, y queda congelado (PN-14)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const unidadId = 'uni-torre1-402'
    const esperado = reglas.pagosDelAnio(bd.pagos, unidadId, 2026).reduce((s, p) => s + p.valor, 0)
    const futuro = await intento(() => repo.emitirCertificadoPagos(bd, { copropiedadId: 'cop-1', unidadId, anio: 2027, personaId: 'per-1' }))
    const vacio = await intento(() => repo.emitirCertificadoPagos(bd, { copropiedadId: 'cop-1', unidadId, anio: 2019, personaId: 'per-1' }))
    const ajeno = await intento(() => repo.emitirCertificadoPagos(bd, { copropiedadId: 'cop-1', unidadId, anio: 2026, personaId: 'per-2' }))
    const doc = (await intento(() => repo.emitirCertificadoPagos(bd, { copropiedadId: 'cop-1', unidadId, anio: 2026, personaId: 'per-1' }))) as { id: string; numero: string; certificadoPagos: { total: number } }
    const pagoId = reglas.pagosDelAnio(bd.pagos, unidadId, 2026)[0].id
    await intento(() => repo.anularPago(bd, { pagoId, motivo: 'Prueba de congelado' }))
    const congelado = bd.documentos.find((d) => d.id === doc.id)!.certificadoPagos!.total
    return { esperado, total: doc.certificadoPagos.total, numero: doc.numero, futuro, vacio, ajeno, congelado }
  })
  expect(r.esperado).toBeGreaterThan(0)
  expect(r.total).toBe(r.esperado)
  expect(r.numero).toMatch(/^CP-2026-\d{4}$/)
  expect(r.futuro).toMatch(/ya haya empezado/)
  expect(r.vacio).toMatch(/no hay pagos/)
  expect(r.ajeno).toMatch(/propietario, el arrendatario o la administración/)
  expect(r.congelado).toBe(r.total)
})

test('la propietaria genera su certificado de pagos desde sus comprobantes (CU-R-46)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/cuenta/pagos')
  await page.getByRole('button', { name: 'Generar el certificado' }).click()
  await expect(page.getByRole('heading', { name: /CERTIFICADO DE PAGOS 2026/ })).toBeVisible()
  await expect(page.getByText(/Total pagado en 2026/)).toBeVisible()
  await expect(page.locator('.hoja-documento')).toHaveCount(1)
})

test('calificar la atención: solo resuelta, de 1 a 5, una vez; la administración ve el resumen (PN-15)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const nueva = (await intento(() => repo.crearPqrs(bd, { copropiedadId: 'cop-1', unidadId: 'uni-torre1-402', personaId: 'per-1', tipo: 'peticion', categoria: 'mantenimiento', asunto: 'Bombillo fundido', descripcion: 'El bombillo del piso 4 no prende.' }))) as { id: string }
    const abierta = await intento(() => repo.calificarAtencion(bd, { pqrsId: nueva.id, personaId: 'per-1', puntaje: 5 }))
    await intento(() => repo.cambiarEstadoPqrs(bd, nueva.id, 'resuelta'))
    const ajeno = await intento(() => repo.calificarAtencion(bd, { pqrsId: nueva.id, personaId: 'per-2', puntaje: 1 }))
    const seis = await intento(() => repo.calificarAtencion(bd, { pqrsId: nueva.id, personaId: 'per-1', puntaje: 6 }))
    await intento(() => repo.calificarAtencion(bd, { pqrsId: nueva.id, personaId: 'per-1', puntaje: 3 }))
    const otraVez = await intento(() => repo.calificarAtencion(bd, { pqrsId: nueva.id, personaId: 'per-1', puntaje: 5 }))
    const resumen = reglas.resumenCalificaciones(bd.pqrs)
    return { abierta, ajeno, seis, otraVez, resumen }
  })
  expect(r.abierta).toMatch(/cuando la administración la resuelve/)
  expect(r.ajeno).toMatch(/quien la radicó/)
  expect(r.seis).toMatch(/de 1 a 5/)
  expect(r.otraVez).toMatch(/Ya calificaste/)
  expect(r.resumen).toMatchObject({ calificadas: 2, promedio: 4, satisfechos: 50 })
})

test('la propietaria califica con estrellas y la administración ve la calificación (CU-R-47, CU-A-38)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const res = await repo.crearPqrs(bd, { copropiedadId: 'cop-1', unidadId: 'uni-torre1-402', personaId: 'per-1', tipo: 'peticion', categoria: 'mantenimiento', asunto: 'Bombillo fundido', descripcion: 'El bombillo del piso 4 no prende.' })
    bd = res.bd
    await repo.cambiarEstadoPqrs(bd, res.datos.id, 'resuelta')
  })
  await page.reload()
  await page.goto('/#/app/solicitudes/pqrs')
  await page.getByText('Bombillo fundido').click()
  await page.getByRole('radio', { name: '4: Buena' }).click()
  await page.getByRole('button', { name: 'Enviar mi calificación' }).click()
  await expect(page.getByText(/Tu calificación/)).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/pqrs')
  await expect(page.getByText('Calificación de la atención')).toBeVisible()
  await expect(page.getByText('4,5 / 5')).toBeVisible()
})
