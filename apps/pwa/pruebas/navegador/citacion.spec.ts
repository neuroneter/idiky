/**
 * CU-A-12 — La citación: antelación (RN-33) y envío a cada propietario con
 * constancia (RN-219). Ley 675 de 2001, arts. 39 y 41.
 */

import { entrarComo, expect, test } from './base'

test('la ordinaria exige 15 días; la citación va a cada propietario con constancia (RN-33, RN-219)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const en = (dias: number) => reglas.sumarDias(new Date().toISOString().slice(0, 10), dias)
    const base = {
      copropiedadId: 'cop-1', modalidad: 'presencial' as const, lugar: 'Salón social', citacion: 'Acta del consejo 12',
      ordenDelDia: [{ titulo: 'Presupuesto', descripcion: 'Del año', seVota: true }], convocadaPor: 'per-admin',
    }
    const ordinariaPronto = await intento(() => repo.convocarAsamblea(bd, { ...base, tipo: 'ordinaria', titulo: 'Ordinaria apurada', fechaHora: `${en(10)}T18:00:00` }))
    const extraordinariaPronto = (await intento(() => repo.convocarAsamblea(bd, { ...base, tipo: 'extraordinaria', titulo: 'Extraordinaria urgente', fechaHora: `${en(10)}T18:00:00` }))) as { id: string }
    const avisoExtra = reglas.antelacionConvocatoria({ tipo: 'extraordinaria', fechaHora: `${en(10)}T18:00:00` })
    const segundaNoSeMide = reglas.antelacionConvocatoria({ tipo: 'ordinaria', fechaHora: `${en(3)}T20:00:00`, numeroConvocatoria: 2 })

    // Un propietario sin correo: su citación va impresa.
    bd.personas.find((p) => p.id === 'per-2')!.email = ''
    const ordinaria = (await intento(() => repo.convocarAsamblea(bd, { ...base, tipo: 'ordinaria', titulo: 'Ordinaria a tiempo', fechaHora: `${en(20)}T18:00:00` }))) as { id: string; citacionDocumentoId?: string; envioCitacion?: Array<{ unidadId: string; personaId: string; canales: string[] }> }
    const documento = bd.documentos.find((d) => d.id === ordinaria.citacionDocumentoId)
    const envios = ordinaria.envioCitacion ?? []
    const propietarios = bd.residencias.filter((x) => x.rol === 'propietario' && !x.hasta).length
    const deAndres = envios.find((e) => e.personaId === 'per-2')
    const deArrendataria = envios.find((e) => e.personaId === 'per-5')
    const comunicado = bd.comunicados.find((c) => c.titulo === 'Convocatoria: Ordinaria a tiempo')
    const porEntregarAntes = reglas.citacionesPorEntregar(bd.asambleas.find((a) => a.id === ordinaria.id)!.envioCitacion).length
    await intento(() => repo.marcarCitacionEntregada(bd, { asambleaId: ordinaria.id, personaId: 'per-admin', unidadId: deAndres!.unidadId, destinatarioId: 'per-2' }))
    const porEntregarDespues = reglas.citacionesPorEntregar(bd.asambleas.find((a) => a.id === ordinaria.id)!.envioCitacion).length
    const otraVez = await intento(() => repo.marcarCitacionEntregada(bd, { asambleaId: ordinaria.id, personaId: 'per-admin', unidadId: deAndres!.unidadId, destinatarioId: 'per-2' }))
    const laPropietaria = await intento(() => repo.emitirCitacion(bd, { asambleaId: 'asa-ordinaria-anual', personaId: 'per-1' }))
    const semilla = (await intento(() => repo.emitirCitacion(bd, { asambleaId: 'asa-ordinaria-anual', personaId: 'per-admin' }))) as { numero: string }
    const dosVeces = await intento(() => repo.emitirCitacion(bd, { asambleaId: 'asa-ordinaria-anual', personaId: 'per-admin' }))
    return {
      ordinariaPronto, extraordinaria: typeof extraordinariaPronto === 'object', avisoExtra: !!avisoExtra.aviso && !avisoExtra.bloquea,
      segundaNoSeMide: !segundaNoSeMide.bloquea && !segundaNoSeMide.aviso,
      numero: documento?.numero, tipo: documento?.tipo, envios: envios.length, propietarios,
      canalesAndres: deAndres?.canales, canalesOtro: envios.find((e) => e.personaId === 'per-1')?.canales,
      arrendataria: !!deArrendataria, comunicado: !!comunicado?.fijado,
      porEntregarAntes, porEntregarDespues, otraVez, laPropietaria, semilla: semilla.numero, dosVeces,
    }
  })
  expect(r.ordinariaPronto).toMatch(/al menos 15 días calendario/)
  expect(r.extraordinaria).toBe(true)
  expect(r.avisoExtra).toBe(true)
  expect(r.segundaNoSeMide).toBe(true)
  expect(r.tipo).toBe('citacion')
  expect(r.numero).toMatch(/^CIT-\d{4}-\d{4}$/)
  expect(r.envios).toBe(r.propietarios)
  expect(r.canalesAndres).toEqual(['app', 'impresa'])
  expect(r.canalesOtro).toEqual(['app', 'correo'])
  expect(r.arrendataria).toBe(false)
  expect(r.comunicado).toBe(true)
  expect(r.porEntregarAntes).toBe(1)
  expect(r.porEntregarDespues).toBe(0)
  expect(r.otraVez).toMatch(/ya se entregó/)
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.semilla).toMatch(/^CIT-/)
  expect(r.dosVeces).toMatch(/ya tiene su citación/)
})

test('la segunda convocatoria lleva su propia citación (RN-216, RN-219)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const hoy = new Date().toISOString().slice(0, 10)
    let res = await repo.convocarAsamblea(bd, {
      copropiedadId: 'cop-1', tipo: 'extraordinaria', titulo: 'Extraordinaria de hoy', fechaHora: `${hoy}T18:00:00`,
      modalidad: 'presencial', lugar: 'Salón social', citacion: 'Acta 13',
      ordenDelDia: [{ titulo: 'Fachada', descripcion: 'Pintura', seVota: true }],
    })
    bd = res.bd
    const primera = res.datos
    const segunda = (await repo.citarSegundaConvocatoria(bd, { asambleaId: primera.id, personaId: 'per-admin' }))
    bd = segunda.bd
    const docSegunda = bd.documentos.find((d) => d.id === segunda.datos.citacionDocumentoId)
    return {
      distinta: !!docSegunda && docSegunda.id !== primera.citacionDocumentoId,
      apuntaALaSegunda: docSegunda?.asambleaId === segunda.datos.id,
      envios: segunda.datos.envioCitacion?.length ?? 0,
    }
  })
  expect(r.distinta).toBe(true)
  expect(r.apuntaALaSegunda).toBe(true)
  expect(r.envios).toBeGreaterThan(0)
})

test('la administradora emite la citación y la propietaria la ve en su app (CU-A-12, CU-R-20)', async ({ page }) => {
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')

  // RN-33 — Una ordinaria a cinco días no se deja convocar.
  await page.getByRole('button', { name: /Convocar/ }).first().click()
  await page.getByLabel('Fecha y hora').fill('2026-10-14T18:00')
  await expect(page.getByText(/al menos 15 días calendario/)).toBeVisible()
  await page.getByRole('dialog', { name: 'Convocar una asamblea' }).getByRole('button', { name: 'Cerrar' }).click()

  await page.locator('tr', { hasText: 'Asamblea ordinaria anual' }).getByRole('button', { name: 'Abrir' }).click()
  await page.getByRole('button', { name: 'Emitir la citación' }).click()
  await expect(page.getByText(/Citación CIT-/)).toBeVisible()
  await page.getByRole('button', { name: 'Ver la citación' }).click()
  await expect(page.getByText(/CONVOCATORIA A ASAMBLEA GENERAL ORDINARIA/)).toBeVisible()
  await expect(page.getByText(/8:00 p\. m\./)).toBeVisible()

  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/asambleas/asa-ordinaria-anual')
  await page.getByRole('button', { name: 'Ver la citación' }).click()
  await expect(page.getByText(/CONVOCATORIA A ASAMBLEA GENERAL ORDINARIA/)).toBeVisible()
})
