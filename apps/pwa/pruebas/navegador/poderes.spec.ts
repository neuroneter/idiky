/**
 * T-46 — El poder dado desde la app: lo acepta el apoderado si tiene la app
 * (RN-217) y lo recibe la administración (RN-218). Mientras falte un paso,
 * vota el propietario.
 */

import { entrarComo, expect, test } from './base'

const ASAMBLEA = 'asa-ordinaria-anual'
// Luisa Fernanda Marin (per-3) vive en el conjunto: tiene la app.
const DOC_LUISA = '1010008274'
// Jorge Enrique Valencia (per-4) está en los perfiles del demo: para la prueba de pantalla.
const DOC_JORGE = '1010012411'

test('con la app, el apoderado acepta y la administración recibe; sin la app, basta recibir (RN-217, RN-218)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async ({ ASAMBLEA, DOC_LUISA }) => {
    const repo = await import('/src/datos/repositorio.ts')
    const reglas = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const vigente = (id: string) => reglas.poderVigente(bd.poderes.find((p) => p.id === id)!)
    // Con la app: María Camila (per-1, 402) le da poder a Luisa (per-3).
    const conApp = (await intento(() => repo.otorgarPoder(bd, { asambleaId: ASAMBLEA, unidadId: 'uni-torre1-402', otorgadoPor: 'per-1', nombresApoderado: 'Luisa', apellidosApoderado: 'Marin', documentoApoderado: DOC_LUISA }))) as { id: string; aceptacion?: { estado: string }; recepcion?: { estado: string } }
    const alNacer = { aceptacion: conApp.aceptacion?.estado, recepcion: conApp.recepcion?.estado, vigente: vigente(conApp.id) }
    const otroAcepta = await intento(() => repo.aceptarPoder(bd, { poderId: conApp.id, personaId: 'per-2' }))
    await intento(() => repo.recibirPoder(bd, { poderId: conApp.id, recibidoPor: 'per-admin' }))
    const soloRecibido = vigente(conApp.id)
    await intento(() => repo.aceptarPoder(bd, { poderId: conApp.id, personaId: 'per-3' }))
    const completo = vigente(conApp.id)

    // Sin la app: Andrés (per-2, 901) a un externo.
    const sinApp = (await intento(() => repo.otorgarPoder(bd, { asambleaId: ASAMBLEA, unidadId: 'uni-torre2-901', otorgadoPor: 'per-2', nombresApoderado: 'Pedro', apellidosApoderado: 'Externo', documentoApoderado: '88112233' }))) as { id: string; aceptacion?: unknown }
    const sinAceptacion = sinApp.aceptacion === undefined
    const antesDeRecibir = vigente(sinApp.id)
    await intento(() => repo.recibirPoder(bd, { poderId: sinApp.id, recibidoPor: 'per-admin' }))
    const recibido = vigente(sinApp.id)

    // No aceptar: Jorge (per-4, 202) a Luisa, que dice que no; queda libre para otro.
    const rechazado = (await intento(() => repo.otorgarPoder(bd, { asambleaId: ASAMBLEA, unidadId: 'uni-torre1-202', otorgadoPor: 'per-4', nombresApoderado: 'Luisa', apellidosApoderado: 'Marin', documentoApoderado: DOC_LUISA }))) as { id: string }
    await intento(() => repo.noAceptarPoder(bd, { poderId: rechazado.id, personaId: 'per-3', motivo: 'Ese día viajo' }))
    const tras = bd.poderes.find((p) => p.id === rechazado.id)!
    const otro = await intento(() => repo.otorgarPoder(bd, { asambleaId: ASAMBLEA, unidadId: 'uni-torre1-202', otorgadoPor: 'per-4', nombresApoderado: 'Pedro', apellidosApoderado: 'Externo', documentoApoderado: '88112233' }))
    return {
      alNacer, otroAcepta, soloRecibido, completo, sinAceptacion, antesDeRecibir, recibido,
      noAceptado: tras.aceptacion?.estado, motivo: tras.aceptacion?.motivo,
      documentoAnulado: bd.documentos.find((d) => d.id === tras.documentoId)?.estado,
      puedeDarOtro: typeof otro === 'object',
    }
  }, { ASAMBLEA, DOC_LUISA })
  expect(r.alNacer).toEqual({ aceptacion: 'esperando', recepcion: 'esperando', vigente: false })
  expect(r.otroAcepta).toMatch(/^ERR: Solo la persona/)
  expect(r.soloRecibido).toBe(false)
  expect(r.completo).toBe(true)
  expect(r.sinAceptacion).toBe(true)
  expect(r.antesDeRecibir).toBe(false)
  expect(r.recibido).toBe(true)
  expect(r.noAceptado).toBe('no_aceptado')
  expect(r.motivo).toBe('Ese día viajo')
  expect(r.documentoAnulado).toBe('anulado')
  expect(r.puedeDarOtro).toBe(true)
})

test('el apoderado acepta en su app y la administración lo da por recibido en la consola (T-46)', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async ({ ASAMBLEA, DOC_JORGE }) => {
    const repo = await import('/src/datos/repositorio.ts')
    const bd = await repo.cargar()
    await repo.otorgarPoder(bd, { asambleaId: ASAMBLEA, unidadId: 'uni-torre1-402', otorgadoPor: 'per-1', nombresApoderado: 'Jorge', apellidosApoderado: 'Valencia', documentoApoderado: DOC_JORGE })
  }, { ASAMBLEA, DOC_JORGE })
  await page.reload()

  // El apoderado lo ve en su inicio y lo acepta.
  await entrarComo(page, /Jorge Enrique/)
  await expect(page.getByText('Te dieron un poder')).toBeVisible()
  await page.getByRole('button', { name: 'Aceptar el poder' }).click()
  await expect(page.getByText('Te dieron un poder')).toHaveCount(0)

  // La administración lo da por recibido.
  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/asambleas')
  await page.locator('tr', { hasText: 'Asamblea ordinaria anual' }).getByRole('button', { name: 'Abrir' }).click()
  await expect(page.getByText('Hay un poder por recibir')).toBeVisible()
  await page.getByRole('button', { name: 'Ver', exact: true }).first().click()
  await page.getByRole('button', { name: 'Dar por recibido' }).click()
  await expect(page.getByText(/Recibido por la administración/)).toBeVisible()
})
