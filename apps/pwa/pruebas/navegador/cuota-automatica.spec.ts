/**
 * RN-225, CU-S-01 — La cuota ordinaria se genera sola cada mes, una sola vez
 * por periodo (RN-22). Reloj fijo: viernes 9 de octubre de 2026.
 */

import { entrarComo, expect, test } from './base'

test('la cuota automática genera el mes una sola vez, desde el día configurado (RN-225)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const hoy = new Date().toISOString().slice(0, 10)
    const periodo = hoy.slice(0, 7)
    // Sin las ordinarias de este mes, para ver al proceso generarlas.
    bd.cuotas = bd.cuotas.filter((c) => !(c.periodo === periodo && c.tipo === 'ordinaria'))
    const unidades = bd.unidades.filter((u) => u.copropiedadId === 'cop-1').length
    const delMes = () => bd.cuotas.filter((c) => c.periodo === periodo && c.tipo === 'ordinaria').length
    const base = { copropiedadId: 'cop-1', concepto: 'Cuota de administración', valorPorPunto: 45000 }

    const laPropietaria = await intento(() => repo.configurarCuotaAutomatica(bd, { ...base, personaId: 'per-1', activa: true, dia: 1 }))
    const dia31 = await intento(() => repo.configurarCuotaAutomatica(bd, { ...base, personaId: 'per-admin', activa: true, dia: 31 }))
    // El día 20 todavía no llega (hoy es 9): no genera.
    await intento(() => repo.configurarCuotaAutomatica(bd, { ...base, personaId: 'per-admin', activa: true, dia: 20 }))
    const antesDelDia = delMes()
    // El día 5 ya pasó: genera al guardar.
    await intento(() => repo.configurarCuotaAutomatica(bd, { ...base, personaId: 'per-admin', activa: true, dia: 5 }))
    const generadas = delMes()
    // Otra vez no: RN-22.
    await intento(() => repo.configurarCuotaAutomatica(bd, { ...base, personaId: 'per-admin', activa: true, dia: 5 }))
    const config = bd.copropiedades.find((c) => c.id === 'cop-1')!.cuotaAutomatica!
    const unaUnidad = bd.unidades.find((u) => u.id === 'uni-torre1-402')!
    const suCuota = bd.cuotas.find((c) => c.periodo === periodo && c.tipo === 'ordinaria' && c.unidadId === unaUnidad.id)!
    return {
      laPropietaria, dia31, antesDelDia, generadas, unidades, otraVez: delMes(),
      historial: config.generadas?.map((g) => [g.periodo, g.cuotas]),
      valor: suCuota.valor, esperado: Math.round(unaUnidad.coeficiente * 45000),
      proxima: reglas.proximaGeneracion(config, () => true, hoy),
    }
  })
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.dia31).toMatch(/de 1 a 28/)
  expect(r.antesDelDia).toBe(0)
  expect(r.generadas).toBe(r.unidades)
  expect(r.otraVez).toBe(r.unidades)
  expect(r.historial).toEqual([['2026-10', r.unidades]])
  expect(r.valor).toBe(r.esperado)
  expect(r.proxima).toBe('2026-11-05')
})

test('la administradora activa la cuota automática desde Cartera (CU-S-01)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/cartera')
  await expect(page.getByText('Cuota mensual automática')).toBeVisible()
  await page.getByRole('button', { name: 'Configurar' }).click()
  await page.getByLabel('Día del mes en que se genera (1 a 28)').fill('3')
  await page.getByRole('button', { name: 'Activar' }).click()
  await expect(page.getByText('Activa', { exact: true })).toBeVisible()
  // Octubre ya tiene sus ordinarias en el demo: la próxima es noviembre.
  await expect(page.getByText(/Próxima: 3 de noviembre de 2026/)).toBeVisible()
})
