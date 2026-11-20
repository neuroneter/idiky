/**
 * CU-R-49 — Objetos perdidos (PN-17).
 */

import { entrarComo, expect, test } from './base'

test('se registra, se reclama con señas, se entrega; la baja solo pasado el plazo y sin reclamos (PN-17)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const vecino = await intento(() => repo.registrarObjetoEncontrado(bd, { copropiedadId: 'cop-1', personaId: 'per-1', descripcion: 'Gafas de sol', lugar: 'Piscina' }))
    const nuevo = (await intento(() => repo.registrarObjetoEncontrado(bd, { copropiedadId: 'cop-1', personaId: 'per-porteria', descripcion: 'Gafas de sol', lugar: 'Piscina' }))) as { id: string }
    const bajaTemprano = await intento(() => repo.darDeBajaObjeto(bd, { objetoId: nuevo.id, personaId: 'per-porteria', motivo: 'Donado' }))
    const sinSenas = await intento(() => repo.reclamarObjeto(bd, { objetoId: nuevo.id, personaId: 'per-1', unidadId: 'uni-torre1-402', senas: 'mías' }))
    await intento(() => repo.reclamarObjeto(bd, { objetoId: nuevo.id, personaId: 'per-1', unidadId: 'uni-torre1-402', senas: 'Son negras, con estuche café' }))
    const dosVeces = await intento(() => repo.reclamarObjeto(bd, { objetoId: nuevo.id, personaId: 'per-1', unidadId: 'uni-torre1-402', senas: 'Son negras, con estuche café' }))
    await intento(() => repo.entregarObjeto(bd, { objetoId: nuevo.id, personaId: 'per-porteria', entregadoA: 'per-1' }))
    const entregado = bd.objetosEncontrados.find((o) => o.id === nuevo.id)?.entrega?.personaId
    const viejoSinMotivo = await intento(() => repo.darDeBajaObjeto(bd, { objetoId: 'obj-2', personaId: 'per-porteria', motivo: '' }))
    await intento(() => repo.darDeBajaObjeto(bd, { objetoId: 'obj-2', personaId: 'per-porteria', motivo: 'Donado a la fundación del barrio' }))
    const baja = bd.objetosEncontrados.find((o) => o.id === 'obj-2')?.baja?.motivo
    return { vecino, bajaTemprano, sinSenas, dosVeces, entregado, viejoSinMotivo, baja, siguenGuardados: bd.objetosEncontrados.length }
  })
  expect(r.vecino).toMatch(/portería o la administración/)
  expect(r.bajaTemprano).toMatch(/Espera a su dueño hasta/)
  expect(r.sinSenas).toMatch(/seña/)
  expect(r.dosVeces).toMatch(/Ya dijiste/)
  expect(r.entregado).toBe('per-1')
  expect(r.viejoSinMotivo).toMatch(/Di qué se hizo/)
  expect(r.baja).toMatch(/Donado/)
  expect(r.siguenGuardados).toBe(3)
})

test('la propietaria dice «es mío» y portería se lo entrega (CU-R-49)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/edificio')
  await page.getByRole('link', { name: /Objetos perdidos/ }).click()
  await expect(page.getByText('Llaves con llavero de Totoro')).toBeVisible()
  await page.getByRole('button', { name: 'Es mío' }).first().click()
  await page.getByLabel('¿Cómo sabemos que es tuyo?').fill('Son tres llaves y una es de candado')
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText('Pasa por portería con tu documento')).toBeVisible()

  await entrarComo(page, /Jairo Alberto Pineda/)
  await page.goto('/#/porteria/objetos')
  await expect(page.getByText(/Son tres llaves y una es de candado/)).toBeVisible()
  await page.getByRole('button', { name: 'Entregar' }).click()
  await expect(page.getByText(/Entregado a Maria Camila/)).toBeVisible()
})
