/**
 * RN-227 — El apoderado permanente: se deja una vez en el perfil, se acepta y
 * se recibe una vez, y cada asamblea crea su poder sola (Mary, 2026-11-10).
 */

import { entrarComo, expect, test } from './base'

// Jorge Enrique Valencia (per-4) tiene la app y está en los perfiles del demo.
const DOC_JORGE = '1010012411'

test('se acepta y se recibe una vez, y cada asamblea crea su poder sola (RN-227)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async (DOC_JORGE) => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const datos = { unidadId: 'uni-torre1-402', nombresApoderado: 'Jorge', apellidosApoderado: 'Valencia', documentoApoderado: DOC_JORGE }
    const autos = () => bd.poderes.filter((p) => p.permanente && p.unidadId === 'uni-torre1-402' && !p.revocadoEn).map((p) => p.asambleaId).sort()
    const laArrendataria = await intento(() => repo.registrarApoderadoPermanente(bd, { ...datos, unidadId: 'uni-torre1-301', personaId: 'per-5' }))
    const res = (await intento(() => repo.registrarApoderadoPermanente(bd, { ...datos, personaId: 'per-1' }))) as { id: string; apoderadoPermanente: { aceptacion?: { estado: string }; recepcion?: { estado: string } } }
    const alNacer = { aceptacion: res.apoderadoPermanente.aceptacion?.estado, recepcion: res.apoderadoPermanente.recepcion?.estado, autos: autos() }
    const dosVeces = await intento(() => repo.registrarApoderadoPermanente(bd, { ...datos, personaId: 'per-1' }))
    await intento(() => repo.aceptarApoderadoPermanente(bd, { residenciaId: res.id, personaId: 'per-4', acepta: true }))
    const soloAceptado = autos()
    await intento(() => repo.recibirApoderadoPermanente(bd, { residenciaId: res.id, recibidoPor: 'per-admin' }))
    const vigente = autos()

    // «Esta vez voy yo» en la ordinaria anual: esa no se vuelve a crear.
    const poderAnual = bd.poderes.find((p) => p.permanente && p.asambleaId === 'asa-ordinaria-anual' && !p.revocadoEn)!
    await intento(() => repo.noUsarApoderadoEnAsamblea(bd, { poderId: poderAnual.id, personaId: 'per-1' }))
    const hoy = new Date().toISOString().slice(0, 10)
    const nueva = (await intento(() => repo.convocarAsamblea(bd, {
      copropiedadId: 'cop-1', tipo: 'extraordinaria', titulo: 'Extraordinaria de prueba', fechaHora: `${hoy}T19:00:00`,
      modalidad: 'presencial', lugar: 'Salón social', citacion: 'Acta 20',
      ordenDelDia: [{ titulo: 'Ascensor', descripcion: 'Cambio', seVota: true }],
    }))) as { id: string }
    const conNueva = autos()

    await intento(() => repo.retirarApoderadoPermanente(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1' }))
    return { laArrendataria, alNacer, dosVeces, soloAceptado, vigente, conNueva, nueva: nueva.id, alRetirar: autos() }
  }, DOC_JORGE)
  expect(r.laArrendataria).toMatch(/Solo el propietario/)
  expect(r.alNacer).toEqual({ aceptacion: 'esperando', recepcion: 'esperando', autos: [] })
  expect(r.dosVeces).toMatch(/Ya tienes un apoderado permanente/)
  expect(r.soloAceptado).toEqual([])
  expect(r.vigente).toEqual(['asa-extra-cubierta', 'asa-ordinaria-anual'])
  expect(r.conNueva).toEqual(['asa-extra-cubierta', r.nueva].sort())
  expect(r.alRetirar).toEqual([])
})

test('la propietaria lo deja en Mi unidad, el apoderado lo acepta y la administración lo recibe (RN-227)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/unidad')
  await page.getByRole('button', { name: 'Dejar un apoderado permanente' }).click()
  await page.getByLabel('Nombres').fill('Jorge')
  await page.getByLabel('Apellidos').fill('Valencia')
  await page.getByLabel('Documento').fill(DOC_JORGE)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Falta que lo acepte')).toBeVisible()

  await entrarComo(page, /Jorge Enrique/)
  await expect(page.getByText('Te piden ser apoderado permanente')).toBeVisible()
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.locator('.tarjeta', { has: page.getByText('Apoderados permanentes', { exact: true }) }).getByRole('button', { name: 'Dar por recibido' }).click()
  await expect(page.getByText('Apoderado permanente recibido.')).toBeVisible()

  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/asambleas/asa-ordinaria-anual')
  await expect(page.getByText(/Es tu apoderado permanente/)).toBeVisible()
  await page.getByRole('button', { name: 'Esta vez voy yo' }).click()
  await expect(page.getByText(/en esta asamblea votas tú/)).toBeVisible()
})
