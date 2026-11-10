/**
 * RN-226, CU-S-06 — Un solo recordatorio amable un par de días antes de vencer,
 * sin mensaje de cuota vencida, y las gracias al pagar (Mary, 2026-11-10).
 * Reloj fijo: viernes 9 de octubre de 2026; las cuotas vencen el 10.
 */

import { entrarComo, expect, test } from './base'

test('el recordatorio toca solo un par de días antes de vencer, una vez (RN-226)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const cfg = { activo: true, diasAntes: reglas.DIAS_RECORDATORIO_PAGO }
    const c = (fechaVencimiento: string, saldo = 100, recordatorios?: { antes?: string }) => ({ saldo, fechaVencimiento, recordatorios })
    return {
      porDefecto: reglas.DIAS_RECORDATORIO_PAGO,
      apagado: reglas.recordatorioQueToca(c('2026-10-10'), { ...cfg, activo: false }, '2026-10-09'),
      antes: reglas.recordatorioQueToca(c('2026-10-10'), cfg, '2026-10-09'),
      muyPronto: reglas.recordatorioQueToca(c('2026-10-20'), cfg, '2026-10-09'),
      yaAvisada: reglas.recordatorioQueToca(c('2026-10-10', 100, { antes: 'x' }), cfg, '2026-10-09'),
      vencida: reglas.recordatorioQueToca(c('2026-10-08'), cfg, '2026-10-09'),
      pagada: reglas.recordatorioQueToca(c('2026-10-10', 0), cfg, '2026-10-09'),
    }
  })
  expect(r.porDefecto).toBe(2)
  expect(r.apagado).toBeUndefined()
  expect(r.antes).toBe('antes')
  expect(r.muyPronto).toBeUndefined()
  expect(r.yaAvisada).toBeUndefined()
  expect(r.vencida).toBeUndefined()
  expect(r.pagada).toBeUndefined()
})

test('llega a los propietarios con tono amable, no se repite, y al pagar llegan las gracias (RN-226)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const de = (motivo: string) => bd.mensajes.filter((m) => m.motivo === motivo)
    const graciasAntes = de('agradecimiento_pago').length
    const laPropietaria = await intento(() => repo.configurarRecordatorioPago(bd, { copropiedadId: 'cop-1', personaId: 'per-1', activo: true, diasAntes: 2 }))
    const dias10 = await intento(() => repo.configurarRecordatorioPago(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', activo: true, diasAntes: 10 }))
    await intento(() => repo.configurarRecordatorioPago(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', activo: true, diasAntes: 2 }))
    const enviados = de('recordatorio_pago').length
    await intento(() => repo.configurarRecordatorioPago(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', activo: true, diasAntes: 2 }))
    const otraVez = de('recordatorio_pago').length
    const telArrendataria = bd.personas.find((p) => p.id === 'per-5')!.telefono
    const aArrendataria = de('recordatorio_pago').some((m) => m.destino === telArrendataria)
    const texto = de('recordatorio_pago')[0]?.texto

    // Paga la cuota de octubre de una unidad que la debe: llegan las gracias.
    const cuota = bd.cuotas.find((c) => c.periodo === '2026-10' && c.saldo > 0)!
    const pago = (await intento(() => repo.registrarPago(bd, {
      unidadId: cuota.unidadId, valor: cuota.saldo, medio: 'pse', origen: 'residente',
      imputaciones: [{ cuotaId: cuota.id, valor: cuota.saldo }], registradoPor: 'Propietario',
    }))) as { id: string; recibo: string }
    const gracias = de('agradecimiento_pago').filter((m) => m.pagoId === pago.id)
    return { graciasAntes, laPropietaria, dias10, enviados, otraVez, aArrendataria, texto, gracias: gracias.length, textoGracias: gracias[0]?.texto, recibo: pago.recibo, vencida: de('cuota_vencida').length }
  })
  expect(r.graciasAntes).toBe(0)
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.dias10).toMatch(/entre 1 y 5/)
  expect(r.enviados).toBeGreaterThan(0)
  expect(r.otraVez).toBe(r.enviados)
  expect(r.aArrendataria).toBe(false)
  expect(r.texto).toMatch(/^Idiky: hola, \w+\. Te recordamos que .* vence el .*¡Gracias!$/)
  expect(r.gracias).toBeGreaterThan(0)
  expect(r.textoGracias).toContain('¡gracias')
  expect(r.textoGracias).toContain(r.recibo)
  expect(r.vencida).toBe(0)
})

test('la administradora los activa y el propietario ve el mensaje en Mi cuenta (CU-S-06)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/cartera')
  const tarjeta = page.locator('.tarjeta', { has: page.getByText('Recordatorios de pago', { exact: true }) })
  await tarjeta.getByRole('button', { name: 'Activar' }).click()
  await expect(tarjeta.getByText('Activos', { exact: true })).toBeVisible()
  await expect(tarjeta.getByText(/Enviados: \d+ recordatorios/)).toBeVisible()

  await entrarComo(page, /Andres Felipe Gomez/)
  await page.goto('/#/app/cuenta')
  await expect(page.getByText('Mensajes que te enviamos')).toBeVisible()
})
