/**
 * CU-P-01, CU-P-02 — Portería: turno, entrada y salida de visitantes, novedades,
 * placa y la minuta del turno (RN-234 a RN-237).
 */

import { entrarComo, expect, test } from './base'

test('turno, entrada y salida, novedad y minuta (RN-234, RN-235, RN-236)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const sel = await import('/src/datos/selectores.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const base = { copropiedadId: 'cop-1', personaId: 'per-porteria' }
    const juan = bd.visitantes.find((v) => v.codigo === 'IDK-4F7Q2')!
    const sinTurno = await intento(() => repo.registrarEntrada(bd, { ...base, visitanteId: juan.id, forma: 'peatonal' }))
    const laPropietaria = await intento(() => repo.abrirTurno(bd, { copropiedadId: 'cop-1', personaId: 'per-1' }))
    const turno = (await intento(() => repo.abrirTurno(bd, base))) as { id: string }
    const otroTurno = await intento(() => repo.abrirTurno(bd, base))
    const sinPlaca = await intento(() => repo.registrarEntrada(bd, { ...base, visitanteId: juan.id, forma: 'vehicular', placa: '' }))
    const entrada = (await intento(() => repo.registrarEntrada(bd, { ...base, visitanteId: juan.id, forma: 'vehicular', placa: 'hkl 45d' }))) as { id: string; placa: string }
    const otraVez = await intento(() => repo.registrarEntrada(bd, { ...base, visitanteId: juan.id, forma: 'peatonal' }))
    const adentro = sel.visitantesAdentro(bd, 'cop-1').length
    await intento(() => repo.registrarNovedad(bd, { ...base, texto: 'Se dañó la puerta del parqueadero' }))
    await intento(() => repo.registrarSalida(bd, { ...base, ingresoId: entrada.id }))
    const despues = sel.visitantesAdentro(bd, 'cop-1').length
    await intento(() => repo.cerrarTurno(bd, { ...base, entrega: 'Revisar la puerta del parqueadero' }))
    const cerrado = bd.turnos.find((t) => t.id === turno.id)!
    const minuta = sel.minutaDeTurno(bd, cerrado).map((l) => l.tipo)
    const trasCerrar = await intento(() => repo.registrarNovedad(bd, { ...base, texto: 'Otra cosa que pasó' }))
    return { sinTurno, laPropietaria, otroTurno, sinPlaca, placa: entrada.placa, otraVez, adentro, despues, minuta, entrega: cerrado.entrega, trasCerrar }
  })
  expect(r.sinTurno).toMatch(/Primero abre tu turno/)
  expect(r.laPropietaria).toMatch(/portería/)
  expect(r.otroTurno).toMatch(/Ya hay un turno abierto/)
  expect(r.sinPlaca).toMatch(/escribe la placa/)
  expect(r.placa).toBe('HKL45D')
  expect(r.otraVez).toMatch(/ya está adentro/)
  expect(r.adentro).toBe(1)
  expect(r.despues).toBe(0)
  // El reloj de las pruebas está fijo: todo pasa a la misma hora, así que no se compara el orden.
  expect([...r.minuta].sort()).toEqual(['entrada', 'novedad', 'salida'])
  expect(r.entrega).toBe('Revisar la puerta del parqueadero')
  expect(r.trasCerrar).toMatch(/Primero abre tu turno/)
})

test('la placa dice si es de un residente, de un visitante de hoy o desconocida (RN-237)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const sel = await import('/src/datos/selectores.ts')
    const bd = await repo.cargar()
    const t = (p: string) => sel.quienEsLaPlaca(bd, 'cop-1', p)?.tipo
    return { residente: t('kht 482'), visitante: t('HKL45D'), desconocida: t('ZZZ999') }
  })
  expect(r).toEqual({ residente: 'residente', visitante: 'visitante', desconocida: 'desconocida' })
})

test('el portero abre el turno, registra la entrada y la administración lee la minuta (CU-P-01, CU-P-02)', async ({ page }) => {
  await entrarComo(page, /Jairo Alberto Pineda/)
  await page.goto('/#/porteria')
  await expect(page.getByText('Lo que dejó el turno anterior')).toBeVisible()
  await page.getByRole('button', { name: 'Abrir mi turno' }).click()
  await expect(page.getByText('No hay visitantes adentro.')).toBeVisible()

  await page.goto('/#/porteria/visitantes')
  await page.getByLabel('Código del visitante').fill('IDK-4F7Q2')
  await page.getByRole('button', { name: 'Validar' }).click()
  await page.getByRole('button', { name: 'Entró' }).click()
  await expect(page.getByText(/Ya está adentro/)).toBeVisible()

  await page.goto('/#/porteria')
  await expect(page.getByText('Juan Sebastian Restrepo').first()).toBeVisible()
  await page.getByLabel('¿De quién es esta placa?').fill('KHT482')
  await expect(page.getByText(/Es de un residente: Torre 1 · 402/)).toBeVisible()
  await page.getByLabel('Escribir una novedad').fill('Se dañó la puerta del parqueadero')
  await page.getByRole('button', { name: 'Anotar en la minuta' }).click()
  await page.getByRole('button', { name: 'Salió' }).click()
  await page.getByRole('button', { name: 'Cerrar turno', exact: true }).click()
  await page.getByRole('button', { name: 'Cerrar mi turno' }).click()
  await expect(page.getByRole('button', { name: 'Abrir mi turno' })).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/porteria')
  await expect(page.getByText(/Entró Juan Sebastian Restrepo/)).toBeVisible()
  await expect(page.getByText(/Se dañó la puerta del parqueadero/)).toBeVisible()
})
