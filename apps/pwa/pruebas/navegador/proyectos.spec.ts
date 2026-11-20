/**
 * CU-R-32, CU-A-28 — El tablero de la obra: lo pagado frente al presupuesto
 * (RN-238), con qué se paga y las preguntas de los propietarios (RN-239).
 */

import { entrarComo, expect, test } from './base'

test('lo pagado es acumulado y las preguntas pendientes solo las ve quien preguntó (RN-238, RN-239)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const obra = () => bd.proyectos.find((p) => p.id === 'pro-cubierta')!
    const pagadoInicial = reglas.pagadoProyecto(obra())
    const porcentajeInicial = reglas.porcentajePagado(obra())
    const bajaSinExplicar = await intento(() => repo.registrarAvanceProyecto(bd, { proyectoId: 'pro-cubierta', porcentaje: 50, titulo: 'Torre 2', detalle: '', pagado: 10000000, registradoPor: 'per-admin' }))
    await intento(() => repo.registrarAvanceProyecto(bd, { proyectoId: 'pro-cubierta', porcentaje: 50, titulo: 'Torre 2 sin dato de pago', detalle: '', registradoPor: 'per-admin' }))
    const sigueIgual = reglas.pagadoProyecto(obra())
    const corta = await intento(() => repo.preguntarSobreProyecto(bd, { proyectoId: 'pro-cubierta', personaId: 'per-1', unidadId: 'uni-torre1-402', texto: 'hola' }))
    await intento(() => repo.preguntarSobreProyecto(bd, { proyectoId: 'pro-cubierta', personaId: 'per-1', unidadId: 'uni-torre1-402', texto: '¿Van a trabajar los sábados?' }))
    const laVeMaria = reglas.preguntasVisibles(obra(), 'per-1').length
    const laVeAndres = reglas.preguntasVisibles(obra(), 'per-2').length
    const pendiente = reglas.preguntasPorResponder(obra())[0]
    await intento(() => repo.responderPreguntaProyecto(bd, { proyectoId: 'pro-cubierta', preguntaId: pendiente.id, personaId: 'per-admin', texto: 'Sí, de 8 a 12 del día.' }))
    const otraVez = await intento(() => repo.responderPreguntaProyecto(bd, { proyectoId: 'pro-cubierta', preguntaId: pendiente.id, personaId: 'per-admin', texto: 'Otra respuesta distinta' }))
    const mensaje = bd.mensajes.find((m) => m.motivo === 'respuesta_proyecto')
    return {
      pagadoInicial, porcentajeInicial, bajaSinExplicar, sigueIgual, corta, laVeMaria, laVeAndres,
      laVeAndresDespues: reglas.preguntasVisibles(obra(), 'per-2').length, otraVez, mensaje: mensaje?.texto,
    }
  })
  expect(r.pagadoInicial).toBe(18000000)
  expect(r.porcentajeInicial).toBe(45)
  expect(r.bajaSinExplicar).toMatch(/explica por qué/)
  expect(r.sigueIgual).toBe(18000000)
  expect(r.corta).toMatch(/Cuéntanos/)
  expect(r.laVeMaria).toBe(2)
  expect(r.laVeAndres).toBe(1)
  expect(r.laVeAndresDespues).toBe(2)
  expect(r.otraVez).toMatch(/ya tiene respuesta/)
  expect(r.mensaje).toMatch(/Gracias por preguntar/)
})

test('la propietaria ve lo pagado y con qué se paga, y pregunta; la administración responde (CU-R-32, CU-A-28)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/proyectos')
  await expect(page.getByRole('heading', { name: 'Proyectos de la copropiedad' })).toHaveCSS('color', 'rgb(255, 255, 255)')
  await expect(page.getByText('Aprobada por la asamblea general')).toBeVisible()
  await expect(page.getByText(/45 % del presupuesto/)).toBeVisible()
  await expect(page.getByText('Pregunta de un propietario', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Hacer una pregunta' }).click()
  await page.getByLabel('Tu pregunta').fill('¿Se va a cortar el agua durante la obra?')
  await page.getByRole('button', { name: 'Enviar la pregunta' }).click()
  await expect(page.getByText('La administración te responde pronto')).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/proyectos')
  await expect(page.getByText('1 pregunta', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Ver los 2 avances/ }).first().click()
  await expect(page.getByText(/Maria Camila Restrepo Ossa · Torre 1/)).toBeVisible()
  await page.getByLabel('Respuesta').fill('No, el agua no se corta: la obra es solo en la cubierta.')
  await page.getByRole('button', { name: 'Responder' }).click()
  await expect(page.getByText('No hay preguntas por responder', { exact: false })).toBeVisible()
})
