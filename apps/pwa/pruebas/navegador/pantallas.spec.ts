// @ts-nocheck — traídas de los scripts de cada sesión (T-42); se escriben en JS suelto.
/**
 * Las 36 pantallas de los tres perfiles abren sin errores.
 *
 * Pruebas de Mary, traídas al repositorio el 2026-10-02 (T-42, ADR-0020). Corren
 * con el reloj fijo de `./base` (viernes 2026-10-09, 10:00, Bogotá).
 */
import { AHORA_PRUEBAS, expect, test } from './base'

test("cada pantalla de la propietaria, la administradora y el portero abre con contenido y sin errores", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL='/'
  const errores = []; p.on('pageerror', (e) => errores.push(e.message))

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  async function entrar(nombre) { await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL); await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(500) }
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(400)
  const rutas = { 'Olga Lucia Henao': ['#/admin','#/admin/registros','#/admin/unidades','#/admin/cartera','#/admin/cartera/paz-y-salvo','#/admin/multas','#/admin/sanciones','#/admin/asambleas','#/admin/pagos','#/admin/reservas','#/admin/reservas/calendario','#/admin/reservas/informe','#/admin/reservas/zonas','#/admin/pqrs','#/admin/comunicados','#/admin/proyectos','#/admin/correspondencia'],
   'Maria Camila Restrepo': ['#/app','#/app/cuenta','#/app/cuenta/estado','#/app/solicitudes/reservas','#/app/solicitudes/pqrs','#/app/solicitudes/paz-y-salvo','#/app/asambleas','#/app/comunicados','#/app/proyectos','#/app/visitantes','#/app/correspondencia','#/app/procesos','#/app/unidad','#/app/unidad/personas'],
   'Jairo Alberto Pineda': ['#/porteria','#/porteria/visitantes','#/porteria/residentes','#/porteria/correspondencia'] }
  for (const [quien, lista] of Object.entries(rutas)) {
    await entrar(quien)
    for (const r of lista) { await p.goto(URL + r); await p.waitForTimeout(250); const t = (await p.locator('body').textContent()).trim(); check(t.length > 150 && errores.length === 0, `${quien.split(' ')[0]} ${r}`) }
  }
  await entrar('Jairo Alberto Pineda'); await p.goto(URL + '#/porteria/residentes'); await p.waitForTimeout(300)
  check((await p.locator('body').textContent()).includes('Torre'), 'portería ve la lista de residentes (RN-67)')
  expect(errores, 'sin errores de página').toEqual([])
})
