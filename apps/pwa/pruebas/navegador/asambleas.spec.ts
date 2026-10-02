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
