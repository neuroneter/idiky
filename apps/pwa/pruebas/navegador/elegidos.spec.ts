/**
 * PN-28 — Los elegidos de una elección, su aceptación, los cargos del edificio
 * y el acta (CU-A-18, CU-A-20; Mary, 2026-11-26).
 */

import { entrarComo, expect, test } from './base'

test('quiénes quedan elegidos: los más votados, la plancha y el empate (PN-28)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const conteo = (pares: Array<[string, number]>) => ({
      porOpcion: pares.map(([texto, coeficiente], i) => ({ opcionId: `op-${i}`, texto, coeficiente, unidades: Math.round(coeficiente / 10) })),
      coeficienteVotante: pares.reduce((s, [, c]) => s + c, 0),
      unidadesVotantes: 0,
    })
    const nombres = (x: { elegidos: Array<{ nombre: string }> }) => x.elegidos.map((e) => e.nombre)
    const normal = reglas.elegidosDeEleccion({
      conteo: conteo([['A', 40], ['B', 30], ['C', 20], ['D', 10], ['Voto en blanco', 50]]),
      base: 'coeficiente',
      puestos: 3,
      postulaciones: [],
    })
    const empate = reglas.elegidosDeEleccion({ conteo: conteo([['A', 40], ['B', 30], ['C', 20], ['D', 20]]), base: 'coeficiente', puestos: 3, postulaciones: [] })
    const plancha = reglas.elegidosDeEleccion({
      conteo: conteo([['Plancha de Ana', 60], ['Q', 40]]),
      base: 'coeficiente',
      puestos: 3,
      postulaciones: [{ nombre: 'Plancha de Ana', integrantes: ['Ana', 'Beto', 'Carla'], personaId: 'per-1', unidadId: 'u' } as never],
    })
    const pocos = reglas.elegidosDeEleccion({ conteo: conteo([['A', 40], ['Voto en blanco', 60]]), base: 'coeficiente', puestos: 3, postulaciones: [] })
    return {
      normal: nombres(normal),
      empate: { nombres: nombres(empate), empate: empate.empate, vacantes: empate.vacantes },
      plancha: { nombres: nombres(plancha), persona: plancha.elegidos[0].personaId, segundo: plancha.elegidos[1].personaId ?? null },
      pocos: { nombres: nombres(pocos), vacantes: pocos.vacantes },
      cuatro: reglas.motivoPuestosInvalidos('consejo', 4),
      tres: reglas.motivoPuestosInvalidos('consejo', 3),
      revisor: reglas.motivoPuestosInvalidos('revisor_fiscal', 1),
    }
  })
  expect(r.normal).toEqual(['A', 'B', 'C'])
  expect(r.empate).toEqual({ nombres: ['A', 'B'], empate: true, vacantes: 1 })
  expect(r.plancha).toEqual({ nombres: ['Ana', 'Beto', 'Carla'], persona: 'per-1', segundo: null })
  expect(r.pocos).toEqual({ nombres: ['A'], vacantes: 2 })
  expect(r.cuatro).toMatch(/impar/)
  expect(r.tres).toBeNull()
  expect(r.revisor).toBeNull()
})

test('al cerrar la elección quedan los elegidos, el consejo anterior termina y la elegida acepta (PN-28)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    await repo.cargar()
    // La asamblea en curso del demo, con un punto de elección del consejo.
    const clave = 'idiky.demo.bd'
    const crudo = JSON.parse(localStorage.getItem(clave)!)
    const asamblea = crudo.asambleas.find((a: { id: string }) => a.id === 'asa-extra-cubierta')
    asamblea.ordenDelDia.push({ id: 'pun-ex-consejo', orden: 9, titulo: 'Elección del consejo', descripcion: '', seVota: true, contenidoEconomico: false, eleccion: 'consejo', puestos: 3 })
    localStorage.setItem(clave, JSON.stringify(crudo))
    let bd = await repo.cargar()
    const paso = async <T,>(f: () => Promise<{ bd: typeof bd; datos: T }>) => {
      const res = await f()
      bd = res.bd
      return res.datos
    }
    await paso(() => repo.postularACargo(bd, { asambleaId: 'asa-extra-cubierta', puntoId: 'pun-ex-consejo', personaId: 'per-1', unidadId: 'uni-torre1-402', presentacion: 'Quiero ayudar con las obras.' }))
    await paso(() => repo.postularACargo(bd, { asambleaId: 'asa-extra-cubierta', puntoId: 'pun-ex-consejo', personaId: 'per-admin', nombre: 'Luz Marina Ortiz', presentacion: 'Se postuló en la sala.' }))
    const votacion = await paso(() =>
      repo.prepararVotacion(bd, {
        asambleaId: 'asa-extra-cubierta',
        puntoId: 'pun-ex-consejo',
        personaId: 'per-admin',
        pregunta: '¿A quién elige?',
        opciones: ['Maria Camila Restrepo Ossa', 'Luz Marina Ortiz', 'Voto en blanco'],
        contenidoEconomico: false,
      }),
    )
    await paso(() => repo.abrirVotacion(bd, { votacionId: votacion.id, personaId: 'per-admin' }))
    const asistentes = bd.asistencias.filter((a) => a.asambleaId === 'asa-extra-cubierta')
    for (const [i, a] of asistentes.entries()) {
      await paso(() => repo.emitirVoto(bd, { votacionId: votacion.id, unidadId: a.unidadId, personaId: a.personaId, opcionId: i % 3 === 2 ? 'op-3' : i % 2 === 0 ? 'op-1' : 'op-2' }).catch(() => ({ bd, datos: null })) as never)
    }
    await paso(() => repo.cerrarVotacion(bd, { votacionId: votacion.id, personaId: 'per-admin' }))
    const nuevos = bd.cargosElegidos.filter((c) => c.votacionId === votacion.id)
    const anteriores = bd.cargosElegidos.filter((c) => c.id.startsWith('car-consejo-'))
    const avisos = bd.mensajes.filter((m) => m.motivo === 'eleccion_cargo').map((m) => m.personaId)
    const mio = nuevos.find((c) => c.personaId === 'per-1')!
    await paso(() => repo.responderCargo(bd, { cargoId: mio.id, personaId: 'per-1', acepta: true }))
    const ajeno = await repo.responderCargo(bd, { cargoId: nuevos.find((c) => !c.personaId)!.id, personaId: 'per-2', acepta: true }).then(() => 'ok', (e) => e.message)
    return {
      nombres: nuevos.map((c) => c.nombre).sort(),
      anterioresTerminaron: anteriores.every((c) => !!c.fin),
      avisos,
      aceptado: !!bd.cargosElegidos.find((c) => c.id === mio.id)!.aceptacion,
      ajeno,
    }
  })
  expect(r.nombres).toEqual(['Luz Marina Ortiz', 'Maria Camila Restrepo Ossa'])
  expect(r.anterioresTerminaron).toBe(true)
  expect(r.avisos).toEqual(['per-1'])
  expect(r.aceptado).toBe(true)
  expect(r.ajeno).toMatch(/persona elegida/)
})

test('el propietario ve quién está en los cargos y el elegido acepta desde el inicio (PN-28)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/edificio')
  const cargos = page.locator('.tarjeta', { has: page.locator('strong', { hasText: 'Quién está en los cargos del edificio' }) })
  await expect(cargos).toContainText('Jorge Enrique Valencia Ruiz')
  await expect(cargos).toContainText('Claudia Patricia Mora')

  await page.evaluate(async () => {
    const clave = 'idiky.demo.bd'
    const crudo = JSON.parse(localStorage.getItem(clave)!)
    crudo.cargosElegidos.push({
      id: 'car-prueba', copropiedadId: 'cop-1', cargo: 'comite_convivencia', nombre: 'Maria Camila Restrepo Ossa',
      personaId: 'per-1', unidadId: 'uni-torre1-402', asambleaId: 'asa-ordinaria-anterior', puntoId: 'p', votacionId: 'v', desde: '2026-10-01',
    })
    localStorage.setItem(clave, JSON.stringify(crudo))
  })
  await page.goto('/#/app')
  await page.reload()
  await expect(page.getByText('La asamblea te eligió para comité de convivencia')).toBeVisible()
  await page.getByRole('button', { name: 'Acepto el cargo' }).click()
  await expect(page.getByText('La asamblea te eligió para comité de convivencia')).toHaveCount(0)

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await expect(page.getByText('Quién está en los cargos del edificio')).toBeVisible()
  await expect(page.getByText('Claudia Patricia Mora')).toBeVisible()
})

test('al citar una elección del consejo se escogen los puestos (PN-28)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.getByRole('button', { name: /Convocar/ }).first().click()
  await page.getByText('Este punto se somete a votación').click()
  await page.getByLabel('Elección del punto 1').selectOption('consejo')
  const puestos = page.getByLabel('Puestos del punto 1')
  await expect(puestos).toHaveValue('3')
  await puestos.selectOption('5')
  await page.getByLabel('Elección del punto 1').selectOption('revisor_fiscal')
  await expect(page.getByLabel('Puestos del punto 1')).toHaveCount(0)
})
