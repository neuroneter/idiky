/**
 * CU-R-19 — Consultar y descargar mis comprobantes de pago (RN-77, RN-78).
 */

import { entrarComo, expect, test } from './base'

test('el propietario paga y su recibo queda en «Mis comprobantes de pago» (CU-R-19)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto('/#/app/cuenta')
  await page.getByRole('link', { name: 'Mis comprobantes de pago' }).click()
  const antes = await page.locator('button.tarjeta--accion').count()

  await page.goto('/#/app/cuenta/pagar')
  await page.getByRole('button', { name: /^Pagar/ }).last().click()
  await expect(page.getByText('Pago exitoso')).toBeVisible()
  await page.getByRole('button', { name: 'Descargar el comprobante' }).click()

  // El que se acaba de pagar llega abierto, con su hoja y su botón de descarga.
  await expect(page.getByText(/^RECIBO DE CAJA RC-/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Descargar PDF' })).toBeVisible()
  await expect(page.getByText('Pago hecho por el propietario desde la aplicación.')).toBeVisible()
  await expect(page.locator('button.tarjeta--accion')).toHaveCount(antes + 1)
})

test('un recibo anulado se sigue viendo, marcado como anulado (RN-78)', async ({ page }) => {
  await page.goto('/')
  const pagoId = await page.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const cuota = bd.cuotas.find((c) => c.unidadId === 'uni-torre1-402' && c.saldo > 0)!
    let res = await repo.registrarPago(bd, {
      unidadId: 'uni-torre1-402', valor: cuota.saldo, medio: 'efectivo', origen: 'administracion',
      imputaciones: [{ cuotaId: cuota.id, valor: cuota.saldo }], registradoPor: 'Olga Lucia Henao',
    })
    bd = res.bd
    res = await repo.anularPago(bd, { pagoId: res.datos.id, motivo: 'Se registró dos veces' })
    return res.datos.id
  })
  await page.reload()
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.goto(`/#/app/cuenta/pagos?pago=${pagoId}`)
  await expect(page.getByText(/ANULADO/)).toBeVisible()
  await expect(page.getByText(/Se registró dos veces/)).toBeVisible()
  await expect(page.getByText(/Pago registrado por la administración/)).toBeVisible()
})
