/**
 * CU-R-17 — El directorio de teléfonos útiles (RN-232). A los proveedores solo
 * los ven la administración y el consejo (RN-233).
 */

import { entrarComo, expect, test } from './base'

test('los proveedores solo los ven la administración y el consejo; se desactiva, no se borra (RN-232, RN-233)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const sel = await import('/src/datos/selectores.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const grupos = (personaId: string, admin = false) => [...new Set(sel.contactosVisibles(bd, 'cop-1', personaId, admin).map((c) => c.grupo))].sort()
    const maria = grupos('per-1')
    const andresConsejo = grupos('per-2')
    const admin = grupos('per-admin', true)
    const laPropietaria = await intento(() => repo.guardarContacto(bd, { copropiedadId: 'cop-1', personaId: 'per-1', grupo: 'edificio', nombre: 'X', telefono: '123' }))
    const nuevo = (await intento(() => repo.guardarContacto(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', grupo: 'servicios', nombre: 'Internet', telefono: '+57 300 555 0000' }))) as { id: string }
    await intento(() => repo.cambiarActivoContacto(bd, { contactoId: nuevo.id, personaId: 'per-admin', activo: false }))
    const lovenTrasDesactivar = sel.contactosVisibles(bd, 'cop-1', 'per-1', false).some((c) => c.id === nuevo.id)
    const sigueGuardado = !!bd.contactos.find((c) => c.id === nuevo.id)
    await intento(() => repo.configurarConsejo(bd, { copropiedadId: 'cop-1', personaId: 'per-admin', miembros: ['per-1'] }))
    return { maria, andresConsejo, admin, laPropietaria, lovenTrasDesactivar, sigueGuardado, mariaEnConsejo: grupos('per-1'), andresFuera: grupos('per-2') }
  })
  expect(r.maria).toEqual(['edificio', 'emergencias', 'servicios'])
  expect(r.andresConsejo).toEqual(['edificio', 'emergencias', 'proveedores', 'servicios'])
  expect(r.admin).toEqual(['edificio', 'emergencias', 'proveedores', 'servicios'])
  expect(r.laPropietaria).toMatch(/administración/)
  expect(r.lovenTrasDesactivar).toBe(false)
  expect(r.sigueGuardado).toBe(true)
  expect(r.mariaEnConsejo).toContain('proveedores')
  expect(r.andresFuera).not.toContain('proveedores')
})

test('la propietaria ve los teléfonos con «Llamar» y sin proveedores; la administración agrega uno (CU-R-17)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.getByRole('link', { name: /Teléfonos útiles y emergencias/ }).click()
  await expect(page.getByText('Línea de emergencias')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Llamar' }).first()).toHaveAttribute('href', 'tel:123')
  await expect(page.getByText('Ascensores Andinos')).toHaveCount(0)

  await entrarComo(page, /Olga Lucia Henao/)
  await page.goto('/#/admin/directorio')
  await expect(page.getByText('Ascensores Andinos')).toBeVisible()
  await page.getByRole('button', { name: 'Agregar contacto' }).click()
  await page.getByRole('button', { name: 'Servicios públicos' }).click()
  await page.getByLabel('Nombre').fill('Internet del edificio')
  await page.getByLabel('Teléfono').fill('+57 300 555 0000')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Internet del edificio')).toBeVisible()
})
