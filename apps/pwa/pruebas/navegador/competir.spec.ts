/**
 * Para competir — Mary, 2026-11-20. CU-R-35 … CU-R-43, CU-A-31 … CU-A-36,
 * reglas PN-01 … PN-09 (pendientes de número RN).
 */

import { entrarComo, expect, test } from './base'

test('pronto pago: descuenta a tiempo, el recibo lo dice y anular lo devuelve (PN-01)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const invalida = await intento(() => repo.configurarProntoPago(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', activo: true, porcentaje: 5, diaLimite: 31 }))
    const deLaPropietaria = await intento(() => repo.configurarProntoPago(bd, { copropiedadId: 'cop-1', personaId: 'per-1', activo: true, porcentaje: 5, diaLimite: 15 }))
    await intento(() => repo.configurarProntoPago(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', activo: true, porcentaje: 5, diaLimite: 15 }))
    const cuota = bd.cuotas.find((c) => c.tipo === 'ordinaria' && c.periodo === '2026-10' && c.saldo === c.valor && c.saldo > 0)!
    const descuento = reglas.descuentoProntoPago(cuota, bd.copropiedades[0].prontoPago, '2026-10-09')
    const tarde = reglas.descuentoProntoPago(cuota, bd.copropiedades[0].prontoPago, '2026-10-16')
    const pago = (await intento(() => repo.registrarPago(bd, { unidadId: cuota.unidadId, valor: cuota.valor - descuento, medio: 'pse', origen: 'residente', imputaciones: [{ cuotaId: cuota.id, valor: cuota.valor - descuento }], registradoPor: 'X' }))) as { id: string; imputaciones: { descuento?: number }[] }
    const saldoDespues = bd.cuotas.find((c) => c.id === cuota.id)!.saldo
    await intento(() => repo.anularPago(bd, { pagoId: pago.id, motivo: 'Prueba de anulación' }))
    const saldoAnulado = bd.cuotas.find((c) => c.id === cuota.id)!.saldo
    return { invalida, deLaPropietaria, descuento, esperado: Math.round(cuota.valor * 0.05), tarde, marcado: pago.imputaciones[0].descuento, saldoDespues, saldoAnulado, valor: cuota.valor }
  })
  expect(r.invalida).toMatch(/del 1 al 28/)
  expect(r.deLaPropietaria).toMatch(/administración/)
  expect(r.descuento).toBe(r.esperado)
  expect(r.tarde).toBe(0)
  expect(r.marcado).toBe(r.esperado)
  expect(r.saldoDespues).toBe(0)
  expect(r.saldoAnulado).toBe(r.valor)
})

test('el pago programado paga la ordinaria del mes el día elegido, una sola vez (PN-02)', async ({ page }) => {
  await page.goto('/')
  const preparado = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const cuota = bd.cuotas.find((c) => c.tipo === 'ordinaria' && c.periodo === '2026-10' && c.saldo > 0 && c.unidadId === 'uni-torre1-402')
      ?? bd.cuotas.find((c) => c.tipo === 'ordinaria' && c.periodo === '2026-10' && c.saldo > 0)!
    const persona = bd.residencias.find((x) => x.unidadId === cuota.unidadId && x.rol === 'propietario')!.personaId
    const diaMalo = await repo.programarPago(bd, { unidadId: cuota.unidadId, personaId: persona, medio: 'pse', dia: 30 }).catch((e: Error) => 'ERR: ' + e.message)
    const res = await repo.programarPago(bd, { unidadId: cuota.unidadId, personaId: persona, medio: 'pse', dia: 10 })
    bd = res.bd
    return { cuotaId: cuota.id, diaMalo, pagosAntes: bd.pagos.length }
  })
  expect(preparado.diaMalo).toMatch(/del 1 al 28/)
  await page.clock.setFixedTime(new Date('2026-10-10T09:00:00-05:00'))
  await page.reload()
  const r = await page.evaluate(async (cuotaId) => {
    const repo = await import('/src/datos/repositorio.ts')
    const bd = await repo.cargar()
    const bd2 = await repo.cargar()
    return {
      saldo: bd.cuotas.find((c) => c.id === cuotaId)!.saldo,
      programados: bd2.pagos.filter((p) => p.registradoPor === 'Pago programado').length,
      mensaje: bd2.mensajes.find((m) => m.motivo === 'pago_programado')?.texto,
    }
  }, preparado.cuotaId)
  expect(r.saldo).toBe(0)
  expect(r.programados).toBe(1)
  expect(r.mensaje).toMatch(/Pagamos la cuota/)
})

test('encuestas, cuentas claras, documentos, eventos, avisos y ayuda: reglas (PN-03 … PN-09)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    // PN-05
    const opcionesRepetidas = await intento(() => repo.crearEncuesta(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', pregunta: '¿Color de la fachada?', opciones: ['Gris', 'gris'], cierraEl: '2026-10-20' }))
    await intento(() => repo.responderEncuesta(bd, { encuestaId: 'enc-1', unidadId: 'uni-torre1-402', personaId: 'per-1', opcionId: 'op-1' }))
    const otraVez = await intento(() => repo.responderEncuesta(bd, { encuestaId: 'enc-1', unidadId: 'uni-torre1-402', personaId: 'per-1', opcionId: 'op-2' }))
    const resultados = reglas.resultadosEncuesta(bd.encuestas.find((e) => e.id === 'enc-1')!).map((x) => x.votos)
    // PN-03
    const periodo = bd.informesMensuales[0].periodo
    await intento(() => repo.publicarInformeMensual(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', periodo, ingresos: 100, gastos: [{ rubro: 'Aseo', valor: 50 }], saldoFondo: 10 }))
    const informes = bd.informesMensuales.length
    const vigentes = reglas.informesVigentes(bd.informesMensuales, 'cop-1').length
    // PN-04
    await intento(() => repo.retirarDocumentoEdificio(bd, { documentoId: 'ded-3', personaId: 'per-admin', motivo: 'Llegó la póliza nueva' }))
    const docSigue = !!bd.documentosEdificio.find((d) => d.id === 'ded-3')
    // PN-07
    const eventoPasado = await intento(() => repo.programarEventoEdificio(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', titulo: 'Fumigación', tipo: 'fumigacion', fecha: '2026-01-01' }))
    // PN-08
    const regaloConPrecio = await intento(() => repo.publicarAviso(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', tipo: 'regalo', titulo: 'Sofá', descripcion: 'Sofá de tres puestos', precio: 1000, mostrarCelular: false }))
    const ajeno = await intento(() => repo.cerrarAviso(bd, { avisoId: 'avi-1', personaId: 'per-1', motivo: 'resuelto' }))
    // PN-09
    await intento(() => repo.pedirAyuda(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', tipo: 'salud' }))
    const dosVeces = await intento(() => repo.pedirAyuda(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', tipo: 'salud' }))
    const vecinoAtiende = await intento(() => repo.atenderAyuda(bd, { alertaId: bd.alertasAyuda[0].id, personaId: 'per-2', paso: 'vista' }))
    return { opcionesRepetidas, otraVez, resultados, informes, vigentes, docSigue, eventoPasado, regaloConPrecio, ajeno, dosVeces, vecinoAtiende }
  })
  expect(r.opcionesRepetidas).toMatch(/repetidas/)
  expect(r.otraVez).toMatch(/ya respondió/)
  expect(r.resultados).toEqual([1, 1, 2])
  expect(r.informes).toBe(2)
  expect(r.vigentes).toBe(1)
  expect(r.docSigue).toBe(true)
  expect(r.eventoPasado).toMatch(/hoy o después/)
  expect(r.regaloConPrecio).toMatch(/no lleva precio/)
  expect(r.ajeno).toMatch(/Solo quien publicó/)
  expect(r.dosVeces).toMatch(/ya tiene tu pedido/)
  expect(r.vecinoAtiende).toMatch(/portería o la administración/)
})

test('la propietaria usa «Tu edificio»: cuentas, encuesta, aviso y descuento (CU-R-35, 37, 39, 42)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.getByRole('link', { name: /Tu edificio/ }).click()
  await page.getByRole('link', { name: /Cuentas claras/ }).click()
  await expect(page.getByText('Vigilancia y portería')).toBeVisible()
  await expect(page.getByText('Fondo de imprevistos')).toBeVisible()

  await page.goto('/#/app/edificio/encuestas')
  await page.getByLabel('Todo el día').check()
  await page.getByRole('button', { name: 'Enviar mi respuesta' }).click()
  await expect(page.getByText('Tu unidad ya respondió')).toBeVisible()

  await page.goto('/#/app/edificio/clasificados')
  await expect(page.getByText('Bicicleta de niño, rin 16')).toBeVisible()
  await page.getByRole('button', { name: 'Publicar un aviso' }).click()
  await page.locator('.modal').getByRole('button', { name: 'Regalo', exact: true }).click()
  await page.getByLabel('Título').fill('Coche de bebé')
  await page.getByLabel('Descripción').fill('Lo regalo, está en buen estado.')
  await page.locator('.modal').getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect(page.getByText('Coche de bebé')).toBeVisible()

  await page.goto('/#/app/edificio/calendario')
  await expect(page.getByText('Fumigación de zonas comunes y sótanos')).toBeVisible()

  await page.goto('/#/app/cuenta')
  await expect(page.getByText(/Descuento por pronto pago: 5 %/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Programar el pago' })).toBeVisible()
})

test('pide ayuda, portería va en camino y la atiende (CU-R-43)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.getByRole('button', { name: 'Pedir ayuda a portería' }).click()
  await page.getByRole('button', { name: 'Una emergencia de salud' }).click()
  await page.getByRole('button', { name: 'Enviar a portería' }).click()
  await expect(page.getByText('Tu pedido de ayuda llegó a portería')).toBeVisible()

  await entrarComo(page, /Jairo Alberto Pineda/)
  await expect(page.getByText(/Piden ayuda: Torre 1/)).toBeVisible()
  await page.getByRole('button', { name: 'Voy en camino' }).click()
  await expect(page.getByText('En camino', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Atendida' }).click()
  await expect(page.getByText(/Piden ayuda/)).toHaveCount(0)
})

test('reportar un daño con foto crea la PQRS de mantenimiento (CU-R-40)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/solicitudes/pqrs')
  await page.getByRole('button', { name: 'Reportar un daño con foto' }).click()
  await page.getByLabel('¿Dónde está?').fill('Torre 1, piso 4')
  await page.getByLabel('¿Qué pasa?').fill('Se fundió el bombillo del pasillo.')
  await page.getByRole('button', { name: 'Enviar el reporte' }).click()
  await expect(page.getByText('Daño en Torre 1, piso 4')).toBeVisible()
  await expect(page.getByText('Dónde:')).toBeVisible()
})

test('la administración publica una encuesta y un evento (CU-A-34, CU-A-35)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/edificio')
  await page.getByRole('tab', { name: 'Encuestas' }).click()
  await page.getByLabel('Pregunta').fill('¿Qué color prefieres para la fachada?')
  await page.getByLabel('Opción 1').fill('Gris')
  await page.getByLabel('Opción 2').fill('Blanco')
  await page.getByRole('button', { name: 'Publicar la encuesta' }).click()
  await expect(page.getByText('¿Qué color prefieres para la fachada?').last()).toBeVisible()
  await page.getByRole('tab', { name: 'Calendario' }).click()
  await page.getByLabel('Qué va a pasar').fill('Lavado de tanques')
  await page.getByRole('button', { name: 'Agregar al calendario' }).click()
  await expect(page.getByText(/Lavado de tanques/)).toBeVisible()
})
