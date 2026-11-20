/**
 * CU-A-39 — Acuerdos de pago (PN-19).
 */

import { entrarComo, expect, test } from './base'

test('solo si el edificio lo permite; calendario exacto; uno a la vez; se mide contra lo pagado (PN-19)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    const sel = await import('/src/datos/selectores.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const calendario = reglas.calendarioAcuerdo(1000, 3, '2026-10-31')
    await intento(() => repo.configurarAcuerdosPago(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', activo: false, cuotasMaximas: 6 }))
    const deshabilitado = await intento(() => repo.proponerAcuerdoPago(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', cuotas: 3, primera: '2026-10-15' }))
    const propietariaConfigura = await intento(() => repo.configurarAcuerdosPago(bd, { copropiedadId: 'cop-1', personaId: 'per-1', activo: true, cuotasMaximas: 6 }))
    await intento(() => repo.configurarAcuerdosPago(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', activo: true, cuotasMaximas: 6 }))
    const demasiadas = await intento(() => repo.proponerAcuerdoPago(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', cuotas: 12, primera: '2026-10-15' }))
    const lejos = await intento(() => repo.proponerAcuerdoPago(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', cuotas: 3, primera: '2026-12-20' }))
    const acuerdo = (await intento(() => repo.proponerAcuerdoPago(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', cuotas: 3, primera: '2026-10-15' }))) as { id: string; deudaAcordada: number; cuotas: { valor: number }[] }
    const vencido = reglas.calcularSaldoVencido(sel.cuotasDeUnidad(bd, 'uni-torre2-901'))
    const otro = await intento(() => repo.proponerAcuerdoPago(bd, { unidadId: 'uni-torre2-901', personaId: 'per-2', cuotas: 2, primera: '2026-10-15' }))
    const alDia = await intento(() => repo.proponerAcuerdoPago(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', cuotas: 2, primera: '2026-10-15' }))
    const sinMotivo = await intento(() => repo.decidirAcuerdoPago(bd, { acuerdoId: acuerdo.id, personaId: 'per-admin', aprobar: false }))
    await intento(() => repo.decidirAcuerdoPago(bd, { acuerdoId: acuerdo.id, personaId: 'per-admin', aprobar: true }))
    const mensaje = bd.mensajes.find((m) => m.motivo === 'acuerdo_pago')?.texto
    const aprobado = bd.acuerdosPago.find((a) => a.id === acuerdo.id)!
    const antes = reglas.avanceAcuerdo(aprobado, bd.pagos, '2026-10-16')
    const suma = acuerdo.cuotas.reduce((s, c) => s + c.valor, 0)
    return { calendario, deshabilitado, propietariaConfigura, demasiadas, lejos, deuda: acuerdo.deudaAcordada, vencido, suma, otro, alDia, sinMotivo, mensaje, antes }
  })
  expect(r.calendario.map((c) => c.valor)).toEqual([333, 333, 334])
  expect(r.calendario.map((c) => c.fecha)).toEqual(['2026-10-28', '2026-11-28', '2026-12-28'])
  expect(r.deshabilitado).toMatch(/no se hacen acuerdos/)
  expect(r.propietariaConfigura).toMatch(/administración/)
  expect(r.demasiadas).toMatch(/entre 2 y 6/)
  expect(r.lejos).toMatch(/30 días/)
  expect(r.deuda).toBe(r.vencido)
  expect(r.suma).toBe(r.deuda)
  expect(r.otro).toMatch(/Ya tienes un acuerdo/)
  expect(r.alDia).toMatch(/No tienes cuotas vencidas/)
  expect(r.sinMotivo).toMatch(/por qué no se aprueba/)
  expect(r.mensaje).toMatch(/aprobó tu acuerdo/)
  expect(r.antes.alDia).toBe(false)
})

test('Andrés propone el acuerdo y la administración lo aprueba (CU-A-39)', async ({ page }) => {
  await entrarComo(page, /Andres Felipe Gomez/)
  await page.goto('/#/app/cuenta')
  await expect(page.getByText('¿Te queda difícil pagar todo de una vez?')).toBeVisible()
  await page.getByRole('button', { name: 'Proponer un acuerdo' }).click()
  await page.getByRole('button', { name: 'Enviar la propuesta' }).click()
  await expect(page.getByText('Esperando aprobación')).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/cartera')
  await expect(page.getByText('Sí se permiten')).toBeVisible()
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar el acuerdo' })).toBeVisible()
})
