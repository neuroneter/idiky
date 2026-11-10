/**
 * CU-R-15 — Vehículos y mascotas de la unidad (RN-230, RN-231).
 */

import { entrarComo, expect, test } from './base'

test('la placa se valida y no se repite; la mascota no tiene usuario; nada se borra (RN-230, RN-231)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const base = { unidadId: 'uni-torre2-901', personaId: 'per-2' }
    const sinPlaca = await intento(() => repo.registrarVehiculo(bd, { ...base, tipo: 'carro' }))
    const malFormato = await intento(() => repo.registrarVehiculo(bd, { ...base, tipo: 'carro', placa: 'AB12' }))
    const repetida = await intento(() => repo.registrarVehiculo(bd, { ...base, tipo: 'carro', placa: 'kht-482' }))
    const carro = (await intento(() => repo.registrarVehiculo(bd, { ...base, tipo: 'carro', placa: 'gtx 915', marca: 'Renault' }))) as { id: string; placa: string }
    const moto = (await intento(() => repo.registrarVehiculo(bd, { ...base, tipo: 'moto', placa: 'abc12d' }))) as { placa: string }
    const bici = (await intento(() => repo.registrarVehiculo(bd, { ...base, tipo: 'bicicleta' }))) as { placa?: string }
    const parqueaderoAjeno = await intento(() => repo.registrarVehiculo(bd, { ...base, tipo: 'bicicleta', parqueadero: 'P-06' }))
    const elPortero = await intento(() => repo.registrarMascota(bd, { unidadId: 'uni-torre2-901', personaId: 'per-porteria', nombre: 'Toby', especie: 'perro' }))
    const mascota = (await intento(() => repo.registrarMascota(bd, { ...base, nombre: 'Toby', especie: 'perro', raza: 'Beagle' }))) as { id: string }
    const sinUsuario = !bd.personas.some((p) => p.nombres === 'Toby')
    await intento(() => repo.darDeBajaVehiculoOMascota(bd, { tipo: 'vehiculo', id: carro.id, personaId: 'per-2' }))
    const sigueGuardado = !!bd.vehiculos.find((v) => v.id === carro.id)?.bajaEn
    // Dado de baja, la placa se puede volver a registrar.
    const otraVez = await intento(() => repo.registrarVehiculo(bd, { ...base, tipo: 'carro', placa: 'GTX915' }))
    return { sinPlaca, malFormato, repetida, placa: carro.placa, moto: moto.placa, bici: bici.placa, parqueaderoAjeno, elPortero, mascota: typeof mascota === 'object', sinUsuario, sigueGuardado, otraVez: typeof otraVez === 'object' }
  })
  expect(r.sinPlaca).toMatch(/Falta la placa del carro/)
  expect(r.malFormato).toMatch(/tres letras y tres números/)
  expect(r.repetida).toMatch(/KHT482 ya está registrada en Torre 1 · 402/)
  expect(r.placa).toBe('GTX915')
  expect(r.moto).toBe('ABC12D')
  expect(r.bici).toBeUndefined()
  expect(r.parqueaderoAjeno).toMatch(/no es de esta unidad/)
  expect(r.elPortero).toMatch(/propietario o el arrendatario/)
  expect(r.mascota).toBe(true)
  expect(r.sinUsuario).toBe(true)
  expect(r.sigueGuardado).toBe(true)
  expect(r.otraVez).toBe(true)
})

test('la propietaria ve y registra vehículos y mascotas, y la administración los ve en la unidad (CU-R-15)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/unidad')
  await page.getByRole('link', { name: /Vehículos y mascotas/ }).click()
  await expect(page.getByText('KHT482')).toBeVisible()
  await expect(page.getByText('Lupe')).toBeVisible()
  await page.getByRole('button', { name: 'Registrar una mascota' }).click()
  await page.getByLabel('Nombre').fill('Misu')
  await page.getByRole('button', { name: 'Gato' }).click()
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Misu')).toBeVisible()

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/unidades')
  await page.locator('tr', { hasText: 'Torre 1 · 402' }).click()
  await expect(page.getByText('KHT482 · P-06')).toBeVisible()
  await expect(page.getByText('Misu')).toBeVisible()
})
