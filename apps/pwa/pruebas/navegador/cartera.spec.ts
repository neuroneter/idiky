// @ts-nocheck — traídas de los scripts de cada sesión (T-42); se escriben en JS suelto.
/**
 * Cartera: estado de cuenta y paz y salvo (CU-R-18, CU-A-13, RN-127).
 *
 * Pruebas de Mary, traídas al repositorio el 2026-10-02 (T-42, ADR-0020). Corren
 * con el reloj fijo de `./base` (viernes 2026-10-09, 10:00, Bogotá).
 */
import { AHORA_PRUEBAS, expect, test } from './base'

test("estado de cuenta descargable con consecutivo y código (CU-R-18, RN-127)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 390, height: 844 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  const texto = () => p.locator('body').textContent()
  const num = (s) => Number(s.replace(/[^\d-]/g, ''))
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(600)
  }
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(500)
  await entrar('Andres Felipe Gomez')
  await p.goto(URL + '#/app/cuenta'); await p.waitForTimeout(400)
  const adeudado = num(await p.locator('.dato-grande').first().textContent())
  await p.getByRole('link', { name: 'Descargar estado de cuenta' }).click(); await p.waitForTimeout(400)
  check(p.url().includes('/app/cuenta/estado'), 'el botón lleva a la pantalla nueva')
  // rango amplio para cubrir todo
  await p.fill('#estado-desde', '2024-01'); await p.waitForTimeout(200)
  let t = await texto()
  const linea = await p.locator('ul.especificaciones strong').first().textContent()
  check(num(linea) === adeudado, `el saldo final cuadra con el valor adeudado (${adeudado})`)
  await p.getByRole('button', { name: 'Emitir estado de cuenta' }).click(); await p.waitForTimeout(700)
  t = await texto()
  check(/EC-\d{4}-0001/.test(t), 'documento con consecutivo EC-…-0001')
  check(t.includes('ESTADO DE CUENTA') && t.includes('Saldo anterior') && t.includes('Totales del periodo'), 'la hoja muestra la tabla')
  check(t.includes('código de verificación'), 'pie con código de verificación')
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const doc = bd.documentos.find((d) => d.tipo === 'estado_cuenta')
  check(doc && doc.estadoCuenta.movimientos.length > 0 && doc.estadoCuenta.saldoFinal === adeudado, 'el documento guarda lo que afirmó')
  // rango vacío (futuro)
  await p.fill('#estado-desde', '2020-01'); await p.fill('#estado-hasta', '2020-02'); await p.waitForTimeout(200)
  check(t !== (await texto()) && (await texto()).includes('no hay nada que certificar') && await p.getByRole('button', { name: 'Emitir estado de cuenta' }).isDisabled(), 'A1: sin movimientos se avisa y no se emite')
  // el paz y salvo no lista estados de cuenta
  await p.goto(URL + '#/app/solicitudes/paz-y-salvo'); await p.waitForTimeout(300)
  check(!(await texto()).includes('EC-'), 'el paz y salvo no mezcla estados de cuenta')
  // reimprimir
  await p.goto(URL + '#/app/cuenta/estado'); await p.waitForTimeout(300)
  await p.getByRole('button', { name: 'Ver' }).first().click(); await p.waitForTimeout(200)
  check((await texto()).includes('Imprimir o guardar en PDF'), 'un emitido antes se vuelve a ver e imprimir')
})

test("paz y salvo desde la consola, con anulación con motivo (CU-A-13)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  const texto = () => p.locator('body').textContent()
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(600)
  }
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(500)
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/cartera'); await p.waitForTimeout(300)
  check((await p.locator('nav.segmentos a').count()) === 2, 'Cartera tiene dos pestañas')
  check((await p.locator('.lateral__enlace.activo', { hasText: 'Cartera' }).count()) === 1, 'el menú marca Cartera')
  await p.goto(URL + '#/admin/cartera/paz-y-salvo'); await p.waitForTimeout(300)
  check((await p.locator('.lateral__enlace.activo', { hasText: 'Cartera' }).count()) === 1, 'el menú sigue marcando Cartera en la pestaña')
  // buscar 202 (Jorge, sin deuda)
  await p.fill('#pys-buscar', '202'); await p.waitForTimeout(200)
  const fila = p.locator('tr', { hasText: '202' }).first()
  check((await fila.textContent()).includes('Al día'), 'muestra el saldo antes de emitir: al día')
  await fila.getByRole('button', { name: 'Emitir paz y salvo' }).click(); await p.waitForTimeout(700)
  let t = await texto()
  check(/PS-\d{4}-0001/.test(t) && t.includes('PAZ Y SALVO') && t.includes('Imprimir o guardar en PDF'), 'emite con consecutivo y muestra la hoja para imprimir')
  // unidad con saldo
  await p.fill('#pys-buscar', '901'); await p.waitForTimeout(200)
  const deuda = p.locator('tr', { hasText: '901' }).first()
  check((await deuda.getByRole('button', { name: 'Emitir paz y salvo' }).count()) === 0 && (await deuda.getByRole('link', { name: 'Ver la deuda' }).count()) === 1, 'A1: con saldo no deja emitir y muestra la deuda')
  // anular
  await p.fill('#pys-buscar', '')
  await p.getByRole('button', { name: 'Anular' }).first().click()
  check(await p.getByRole('button', { name: 'Anular paz y salvo' }).isDisabled(), 'anular sin motivo no se puede')
  await p.fill('#pys-motivo', 'Se aplicó un pago que el banco rechazó')
  await p.getByRole('button', { name: 'Anular paz y salvo' }).click(); await p.waitForTimeout(700)
  t = await texto()
  check(t.includes('Anulado') && t.includes('el banco rechazó'), 'A2: queda anulado con su motivo')
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const doc = bd.documentos.find((d) => d.tipo === 'paz_y_salvo')
  check(doc && doc.estado === 'anulado' && doc.emitidoPor.includes('administración') && bd.documentos.length >= 1, 'no se borra: sigue en la base, anulado')
  // propietario
  await entrar('Jorge Enrique Valencia')
  await p.goto(URL + '#/app/solicitudes/paz-y-salvo'); await p.waitForTimeout(400)
  t = await texto()
  check(t.includes('Anulado por la administración') && t.includes('el banco rechazó'), 'el propietario ve el anulado con su motivo')
})
