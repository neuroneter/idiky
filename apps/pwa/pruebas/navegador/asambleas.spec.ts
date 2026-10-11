/**
 * Votaciones: por coeficiente o una unidad, un voto (RN-211; Ley 675 de 2001,
 * art. 37; Corte Constitucional, C-522 de 2002).
 *
 * En un conjunto de vivienda, las decisiones económicas se cuentan por
 * coeficiente y las demás, un voto por unidad. En el comercial, todo por
 * coeficiente; en el mixto, lo escoge la administración.
 */
import { entrarComo, expect, test } from './base'

const ASAMBLEA = 'asa-extra-cubierta'

test('la base del voto depende de la decisión y del tipo de edificio (RN-211)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const { baseDeVoto } = await import('/src/dominio/reglas.ts')
    const economica = { contenidoEconomico: true }
    const noEconomica = { contenidoEconomico: false }
    return {
      economicaResidencial: baseDeVoto({ tipo: 'residencial' }, economica),
      noEconomicaResidencial: baseDeVoto({ tipo: 'residencial' }, noEconomica),
      noEconomicaComercial: baseDeVoto({ tipo: 'comercial' }, noEconomica),
      noEconomicaMixtoSinEscoger: baseDeVoto({ tipo: 'mixto' }, noEconomica),
      noEconomicaMixtoCoeficiente: baseDeVoto({ tipo: 'mixto', votoNoEconomicoMixto: 'coeficiente' }, noEconomica),
      economicaMixto: baseDeVoto({ tipo: 'mixto', votoNoEconomicoMixto: 'unidad' }, economica),
    }
  })
  expect(r).toEqual({
    economicaResidencial: 'coeficiente',
    noEconomicaResidencial: 'unidad',
    noEconomicaComercial: 'coeficiente',
    noEconomicaMixtoSinEscoger: 'unidad',
    noEconomicaMixtoCoeficiente: 'coeficiente',
    economicaMixto: 'coeficiente',
  })
})

test('la misma votación se aprueba o no según se cuente por coeficiente o por unidad (RN-74, RN-211)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const { resultadoVotacion, unidadesNecesarias } = await import('/src/dominio/reglas.ts')
    // Dos unidades grandes a favor, tres pequeñas en contra.
    const conteo = {
      porOpcion: [
        { opcionId: 'si', texto: 'A favor', coeficiente: 30, unidades: 2 },
        { opcionId: 'no', texto: 'En contra', coeficiente: 20, unidades: 3 },
      ],
      coeficienteVotante: 50,
      unidadesVotantes: 5,
    }
    const comun = { conteo, mayoria: 'simple' as const, coeficienteRepresentado: 50, coeficienteEdificio: 100, unidadesRepresentadas: 5, unidadesEdificio: 12 }
    const porCoeficiente = resultadoVotacion({ ...comun, baseDeVoto: 'coeficiente' })
    const porUnidad = resultadoVotacion({ ...comun, baseDeVoto: 'unidad' })
    const calificada = resultadoVotacion({ ...comun, mayoria: 'calificada', baseDeVoto: 'unidad' })
    return {
      ganaPorCoeficiente: porCoeficiente.aprobada?.opcionId,
      ganaPorUnidad: porUnidad.aprobada?.opcionId,
      textoPorUnidad: porUnidad.baseTexto,
      necesariasSimple: unidadesNecesarias(porUnidad.umbral, 'simple'),
      necesariasCalificada: unidadesNecesarias(calificada.umbral, 'calificada'),
      calificadaAprobada: !!calificada.aprobada,
    }
  })
  expect(r).toEqual({
    ganaPorCoeficiente: 'si',
    ganaPorUnidad: 'no',
    textoPorUnidad: 'de las unidades representadas en la sesión',
    necesariasSimple: 3,
    necesariasCalificada: 9,
    calificadaAprobada: false,
  })
})

test('solo el edificio mixto escoge cómo se votan las no económicas (RN-211)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const { baseDeVoto } = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const out: Record<string, unknown> = {}
    try { await repo.configurarVotoNoEconomico(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', base: 'coeficiente' }); out.residencial = 'permitido' } catch { out.residencial = 'bloqueado' }
    bd = { ...bd, copropiedades: bd.copropiedades.map((c) => ({ ...c, tipo: 'mixto' as const })) }
    try { await repo.configurarVotoNoEconomico(bd, { copropiedadId: 'cop-1', personaId: 'per-1', base: 'coeficiente' }); out.propietaria = 'permitido' } catch { out.propietaria = 'bloqueado' }
    const res = await repo.configurarVotoNoEconomico(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', base: 'coeficiente' })
    out.mixto = baseDeVoto(res.datos, { contenidoEconomico: false })
    return out
  })
  expect(r).toEqual({ residencial: 'bloqueado', propietaria: 'bloqueado', mixto: 'coeficiente' })
})

test('la propietaria ve cómo se cuenta cada punto y los votos por unidad (RN-211)', async ({ page }) => {
  await page.goto('/')
  // Votan cuatro unidades presentes el punto de mascotas (no económico).
  await page.evaluate(async (asambleaId) => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    for (const [unidadId, personaId, opcionId] of [
      ['uni-torre1-201', 'per-3', 'op-si'],
      ['uni-torre1-202', 'per-4', 'op-si'],
      ['uni-torre2-501', 'per-8', 'op-no'],
      ['uni-torre2-602', 'per-11', 'op-si'],
    ]) {
      const res = await repo.emitirVoto(bd, { votacionId: 'vta-ex-4', unidadId, personaId, opcionId })
      bd = res.bd
    }
    void asambleaId
  }, ASAMBLEA)
  // La app guarda los datos en memoria al abrir: se recarga para que lea los votos.
  await page.reload()
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto(`/#/app/asambleas/${ASAMBLEA}`)
  await expect(page.getByText(/Decisión no económica: cada unidad vale un voto/)).toBeVisible()
  await expect(page.getByText(/Decisión económica: el voto de cada unidad pesa su coeficiente/).first()).toBeVisible()
  await expect(page.getByText('3 votos', { exact: true })).toBeVisible()
  await expect(page.getByText('1 voto', { exact: true })).toBeVisible()
})

test('la administradora ve que en vivienda no se puede cambiar (RN-211)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  const tarjeta = page.locator('.tarjeta', { hasText: 'Cómo se cuentan los votos' })
  await expect(tarjeta).toContainText('un voto por unidad')
  await expect(tarjeta).toContainText('C-522 de 2002')
  await expect(tarjeta).toContainText('no se puede cambiar')
  await expect(tarjeta.getByRole('button')).toHaveCount(0)
})

// ---------------------------------------------------------------------------
// CU-A-18 — La administración prepara, abre, cierra y anula las votaciones.
// RN-215 — La asistencia del día da el quórum, y se verifica al instalar.
// ---------------------------------------------------------------------------

test('preparar, abrir, cerrar y anular una votación (CU-A-18, RN-212, RN-213, RN-34)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const sel = await import('/src/datos/selectores.ts')
    let bd = await repo.cargar()
    const out: Record<string, unknown> = {}
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    // El punto 1 de la extraordinaria en curso todavía no tiene votación: se le marca que se vota.
    bd = { ...bd, asambleas: bd.asambleas.map((a) => a.id === 'asa-extra-cubierta' ? { ...a, ordenDelDia: a.ordenDelDia.map((p) => p.id === 'pun-ex-1' ? { ...p, seVota: true } : p) } : a) }
    const base = { asambleaId: 'asa-extra-cubierta', puntoId: 'pun-ex-1', personaId: 'per-admin', pregunta: '¿Aprueba el informe de la obra?', opciones: ['A favor', 'En contra'] }
    out.sinEscogerEconomica = await intento(() => repo.prepararVotacion(bd, { ...base, contenidoEconomico: undefined }))
    out.unaSolaOpcion = await intento(() => repo.prepararVotacion(bd, { ...base, opciones: ['Sí'], contenidoEconomico: false }))
    out.laPropietaria = await intento(() => repo.prepararVotacion(bd, { ...base, personaId: 'per-1', contenidoEconomico: false }))
    const v = (await intento(() => repo.prepararVotacion(bd, { ...base, contenidoEconomico: false }))) as { id: string; estado: string }
    out.preparada = v.estado
    out.otraEnElMismoPunto = await intento(() => repo.prepararVotacion(bd, { ...base, contenidoEconomico: true }))
    out.abierta = ((await intento(() => repo.abrirVotacion(bd, { votacionId: v.id, personaId: 'per-admin' }))) as { estado: string }).estado
    out.cerrarAsambleaConAbierta = await intento(() => repo.cambiarEstadoAsamblea(bd, { asambleaId: 'asa-extra-cubierta', estado: 'cerrada' }))
    out.cerrada = ((await intento(() => repo.cerrarVotacion(bd, { votacionId: v.id, personaId: 'per-admin' }))) as { estado: string }).estado
    out.anularSinMotivo = await intento(() => repo.anularVotacion(bd, { votacionId: v.id, personaId: 'per-admin', motivo: 'no' }))
    out.anulada = ((await intento(() => repo.anularVotacion(bd, { votacionId: v.id, personaId: 'per-admin', motivo: 'Se votó sin leer el informe completo' }))) as { estado: string }).estado
    out.vigenteTrasAnular = sel.votacionDePunto(bd, 'pun-ex-1')?.id ?? null
    out.anuladasDelPunto = sel.votacionesAnuladasDePunto(bd, 'pun-ex-1').length
    out.nuevaTrasAnular = ((await intento(() => repo.prepararVotacion(bd, { ...base, contenidoEconomico: false }))) as { estado: string }).estado
    // En una asamblea convocada (todavía no instalada) no se abre.
    const conv = (await intento(() => repo.prepararVotacion(bd, { asambleaId: 'asa-ordinaria-anual', puntoId: 'pun-or-4', personaId: 'per-admin', pregunta: '¿Quiénes integran el consejo?', opciones: ['Plancha 1', 'Plancha 2'], contenidoEconomico: false }))) as { id: string }
    out.abrirSinInstalar = await intento(() => repo.abrirVotacion(bd, { votacionId: conv.id, personaId: 'per-admin' }))
    return out
  })
  expect(r.sinEscogerEconomica).toMatch(/contenido económico/)
  expect(r.unaSolaOpcion).toMatch(/dos opciones/)
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.preparada).toBe('preparada')
  expect(r.otraEnElMismoPunto).toMatch(/ya tiene una votación/)
  expect(r.abierta).toBe('abierta')
  expect(r.cerrarAsambleaConAbierta).toMatch(/votaciones abiertas/)
  expect(r.cerrada).toBe('cerrada')
  expect(r.anularSinMotivo).toMatch(/motivo/)
  expect(r.anulada).toBe('anulada')
  expect(r.vigenteTrasAnular).toBeNull()
  expect(r.anuladasDelPunto).toBe(1)
  expect(r.nuevaTrasAnular).toBe('preparada')
  expect(r.abrirSinInstalar).toMatch(/instala la asamblea/)
})

test('la asistencia del día da el quórum, y sin quórum no se instala (RN-215)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const { admiteAsistencia } = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const out: Record<string, unknown> = {}
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const hoy = new Date().toISOString().slice(0, 10)
    const asamblea = (await intento(() => repo.convocarAsamblea(bd, {
      copropiedadId: 'cop-1', tipo: 'extraordinaria', titulo: 'Prueba de quórum', fechaHora: `${hoy}T18:00:00`,
      modalidad: 'presencial', lugar: 'Salón social', citacion: 'Citación de prueba',
      ordenDelDia: [{ titulo: 'Un punto', descripcion: 'Para votar', seVota: true }],
    }))) as { id: string; estado: string }
    out.convocadaHoyAdmiteAsistencia = admiteAsistencia(bd.asambleas.find((a) => a.id === asamblea.id)!)
    out.anualEnVeintiDiasAdmite = admiteAsistencia(bd.asambleas.find((a) => a.id === 'asa-ordinaria-anual')!)
    const marcar = (unidadId: string, personaId: string) => intento(() => repo.marcarAsistencia(bd, { asambleaId: asamblea.id, unidadId, personaId, forma: 'presencial' }))
    await marcar('uni-torre1-201', 'per-3')
    out.instalarConUna = await intento(() => repo.cambiarEstadoAsamblea(bd, { asambleaId: asamblea.id, estado: 'instalada' }))
    for (const [u, p] of [['uni-torre1-202', 'per-4'], ['uni-torre1-302', 'per-6'], ['uni-torre1-401', 'per-7'], ['uni-torre2-501', 'per-8'], ['uni-torre2-601', 'per-10']]) await marcar(u, p)
    const instalada = (await intento(() => repo.cambiarEstadoAsamblea(bd, { asambleaId: asamblea.id, estado: 'instalada' }))) as { estado: string; quorumAlInstalar?: { unidades: number; coeficiente: number } }
    out.instalada = instalada.estado
    out.quorumGuardado = instalada.quorumAlInstalar
    return out
  })
  expect(r.convocadaHoyAdmiteAsistencia).toBe(true)
  expect(r.anualEnVeintiDiasAdmite).toBe(false)
  expect(r.instalarConUna).toMatch(/No hay quórum/)
  expect(r.instalada).toBe('instalada')
  expect(r.quorumGuardado).toEqual({ unidades: 6, coeficiente: 51.4, en: expect.any(String) })
})

test('la administradora anula y vuelve a preparar la votación desde la consola (CU-A-18)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.locator('tr', { hasText: 'obras de la cubierta' }).getByRole('button', { name: 'Abrir' }).click()
  const punto = page.locator('li', { has: page.locator('strong', { hasText: /^Mascotas en las zonas comunes$/ }) })
  await expect(punto).toContainText('Abierta')
  await expect(punto).toContainText('Han votado')
  await punto.getByRole('button', { name: 'Anular' }).click()
  await punto.locator('textarea').fill('La propuesta cambió durante la discusión')
  await punto.getByRole('button', { name: 'Anular la votación' }).click()
  await expect(punto).toContainText('Votación anulada')
  await punto.getByRole('button', { name: 'Preparar la votación' }).click()
  const guardar = punto.getByRole('button', { name: 'Guardar la votación' })
  await expect(guardar).toBeDisabled()
  await punto.getByRole('button', { name: 'No es económica' }).click()
  await expect(punto).toContainText('una unidad, un voto')
  await guardar.click()
  await expect(punto).toContainText('Preparada')
  await punto.getByRole('button', { name: 'Abrir la votación' }).click()
  await expect(punto).toContainText('Abierta')
  await punto.getByRole('button', { name: 'Cerrar la votación' }).click()
  await expect(punto).toContainText('Cerrada')
  await expect(punto).toContainText('No alcanzó la mayoría exigida')
})
