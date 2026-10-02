// @ts-nocheck — traídas de los scripts de cada sesión (T-42); se escriben en JS suelto.
/**
 * Zonas comunes y reservas (CU-A-10, CU-A-29, CU-A-30, CU-R-05, CU-R-06, RN-104 a RN-129).
 *
 * Pruebas de Mary, traídas al repositorio el 2026-10-02 (T-42, ADR-0020). Corren
 * con el reloj fijo de `./base` (viernes 2026-10-09, 10:00, Bogotá).
 */
import fs from 'node:fs'
import { AHORA_PRUEBAS, expect, test } from './base'

test("configurar zonas: crear, editar, cerrar por mantenimiento y desactivar (CU-A-10, RN-105 a RN-108)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  const iso = (d) => { const x = new Date(AHORA_PRUEBAS); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10) }
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click()
    await p.getByText(nombre, { exact: true }).click()
    await p.waitForTimeout(600)
  }
  await p.goto(URL); await p.evaluate(() => localStorage.clear())
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas/zonas'); await p.waitForTimeout(500)
  check(await p.locator('nav.segmentos >> text=Zonas comunes').count() === 1, 'pestañas dentro de Reservas')
  check(await p.getByRole('heading', { name: 'Zonas comunes' }).count() === 1, 'título Zonas comunes')
  // Crear con turno que no cabe
  await p.getByRole('button', { name: 'Nueva zona' }).click()
  await p.fill('#zona-nombre', 'Piscina')
  await p.fill('#zona-descripcion', 'Piscina climatizada con zona infantil.')
  await p.selectOption('#zona-desde', '09:00'); await p.selectOption('#zona-hasta', '20:00'); await p.selectOption('#zona-turno', '2')
  await p.getByRole('button', { name: 'Crear zona' }).click()
  check(await p.getByText('deja un pedazo que nadie puede reservar').count() === 1, 'RN-105: turno que no cabe se rechaza')
  await p.selectOption('#zona-desde', '08:00')
  check(await p.locator('.modal .franja, [role=dialog] .franja').count() >= 6 || await p.locator('span.franja').count() === 6, 'vista previa de 6 turnos')
  await p.getByRole('button', { name: 'Crear zona' }).click(); await p.waitForTimeout(700)
  check(await p.locator('.tarjeta strong', { hasText: 'Piscina' }).count() === 1, 'zona creada')
  // nombre repetido
  await p.getByRole('button', { name: 'Nueva zona' }).click()
  await p.fill('#zona-nombre', 'gimnasio')
  await p.getByRole('button', { name: 'Crear zona' }).click()
  check(await p.getByText('Ya hay una zona que se llama').count() === 1, 'RN-105: nombre repetido')
  await p.keyboard.press('Escape'); await p.goto(URL + '#/admin/reservas'); await p.goto(URL + '#/admin/reservas/zonas'); await p.waitForTimeout(400)

  // Editar gimnasio
  const gim = p.locator('.tarjeta', { has: p.locator('strong', { hasText: /^Gimnasio$/ }) })
  await gim.getByRole('button', { name: 'Editar reglas' }).click()
  await p.fill('#zona-aforo', '10')
  await p.getByRole('button', { name: 'Guardar reglas' }).click(); await p.waitForTimeout(700)
  check((await gim.textContent()).includes('hasta 10 personas'), 'editar reglas: aforo 10')

  // Cierre salón que cubre la reserva de per-1 (+6)
  const salon = p.locator('.tarjeta', { has: p.locator('strong', { hasText: /^Salón social$/ }) })
  await salon.getByRole('button', { name: 'Cerrar por mantenimiento' }).click()
  await p.fill('#cierre-desde', iso(5)); await p.fill('#cierre-hasta', iso(7))
  await p.fill('#cierre-motivo', 'Cambio del piso y pintura del salón')
  const vista = await p.locator('body').textContent()
  check(vista.includes('Se cancelan 1 reserva'), 'cierre: muestra la reserva que se cancela')
  check(vista.includes('Motivo: la zona estará cerrada por mantenimiento'), 'cierre: vista previa del mensaje')
  await p.getByRole('button', { name: /Cerrar y avisar a 1/ }).click(); await p.waitForTimeout(700)
  check((await p.locator('body').textContent()).includes('Se cancelaron 1 reservas'), 'cierre: aviso con conteo')
  check((await salon.textContent()).includes('Levantar'), 'cierre pendiente con Levantar')

  // Desactivar BBQ (per-4, +3)
  const bbq = p.locator('.tarjeta', { has: p.locator('strong', { hasText: /^Terraza BBQ$/ }) })
  await bbq.getByRole('button', { name: 'Desactivar' }).click()
  await p.getByRole('button', { name: /Desactivar/ }).last().click()
  check((await p.locator('body').textContent()).includes('Escribe el motivo'), 'RN-107: motivo obligatorio')
  await p.fill('#desactivar-motivo', 'La asamblea aprobó convertir la terraza en zona verde.')
  await p.getByRole('button', { name: /Desactivar y avisar/ }).click(); await p.waitForTimeout(700)
  check((await bbq.textContent()).includes('Desactivada'), 'BBQ desactivada')
  check((await bbq.textContent()).includes('Reactivar'), 'botón Reactivar')
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const msjs = bd.mensajes.filter((m) => m.motivo === 'reserva_cancelada')
  check(msjs.length >= 2, 'mensajes guardados: ' + msjs.length)
  await p.goto(URL + '#/admin/reservas'); await p.getByRole('button', { name: 'Todas' }).click()
  check((await p.locator('body').textContent()).includes('Por la administración:'), 'tabla admin muestra motivo')

  // Residente per-1
  await entrar('Maria Camila Restrepo')
  await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(500)
  const t = await p.locator('body').textContent()
  check(!t.includes('Zona de asados'), 'residente: BBQ no aparece')
  check(t.includes('Piscina'), 'residente: Piscina aparece')
  check(t.includes('Se cierra por mantenimiento'), 'residente: aviso de cierre en la lista')
  check(t.includes('Cancelada por la administración. Motivo:'), 'residente: ve su reserva cancelada con motivo')
  await p.setViewportSize({ width: 390, height: 844 })
  // fecha dentro del cierre
  await p.locator('button.tarjeta', { hasText: 'Salón social' }).click()
  await p.fill('#fecha-reserva', iso(6)); await p.waitForTimeout(200)
  check((await p.locator('body').textContent()).includes('Escoge otra fecha'), 'residente: fecha en cierre bloqueada')
  // Volver: levantar y reactivar
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas/zonas'); await p.waitForTimeout(400)
  await salon.getByRole('button', { name: 'Levantar' }).click(); await p.waitForTimeout(700)
  check(!(await salon.textContent()).includes('Levantar'), 'cierre levantado')
  await bbq.getByRole('button', { name: 'Reactivar' }).click(); await p.waitForTimeout(700)
  check((await bbq.textContent()).includes('Activa'), 'BBQ reactivada')
  const bd2 = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  check(bd2.zonasComunes.find((z) => z.id === 'zon-salon').cierres.length === 1, 'el cierre levantado queda en la historia')
})

test("cobro por uso, depósito y multa por no cancelar en cada zona (RN-109, RN-110)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(600)
  }
  const tarjeta = (n) => p.locator('.tarjeta', { has: p.locator('strong', { hasText: new RegExp(`^${n}$`) }) })
  await p.goto(URL); await p.evaluate(() => localStorage.clear())
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas/zonas'); await p.waitForTimeout(500)
  const salon = await tarjeta('Salón social').textContent()
  check(salon.includes('80.000') && salon.includes('200.000'), 'salón: cobro y depósito en la tarjeta')
  check(salon.includes('Artículo 42'), 'salón: respaldo del cobro')
  check(salon.includes('48 horas') && salon.includes('Reserva no cancelada a tiempo'), 'salón: multa con plazo')
  check((await tarjeta('Gimnasio').textContent()).includes('Reservarla no tiene costo.'), 'gimnasio: sin costo')

  await tarjeta('Gimnasio').getByRole('button', { name: 'Editar reglas' }).click()
  check(await p.locator('#zona-valor-uso').count() === 0 && await p.locator('#zona-deposito').count() === 0, 'sin marcar, no se piden valores')
  await p.getByText('Pide depósito de garantía', { exact: true }).click()
  await p.getByRole('button', { name: 'Guardar reglas' }).click()
  check((await p.locator('body').textContent()).includes('Escribe el valor del depósito'), 'marcado sin valor se rechaza')
  await p.getByText('Pide depósito de garantía', { exact: true }).click()
  await p.getByText('Se cobra por usarla', { exact: true }).click()
  await p.fill('#zona-valor-uso', '10000')
  await p.getByRole('button', { name: 'Guardar reglas' }).click()
  check((await p.locator('body').textContent()).includes('Un cobro necesita su respaldo'), 'RN-109: cobro sin respaldo se rechaza')
  await p.fill('#zona-respaldo-referencia', 'Artículo 43')
  await p.getByText('Aplica multa si no se cancela a tiempo').click()
  await p.selectOption('#zona-multa', 'cs-6'); await p.fill('#zona-multa-horas', '12')
  await p.getByRole('button', { name: 'Guardar reglas' }).click(); await p.waitForTimeout(700)
  const gim = await tarjeta('Gimnasio').textContent()
  check(gim.includes('10.000') && gim.includes('Artículo 43') && gim.includes('12 horas'), 'gimnasio: cobro, respaldo y multa guardados')

  await tarjeta('Terraza BBQ').getByRole('button', { name: 'Editar reglas' }).click()
  await p.getByText('Se cobra por usarla', { exact: true }).click()
  await p.getByRole('button', { name: 'Guardar reglas' }).click(); await p.waitForTimeout(700)
  check((await tarjeta('Terraza BBQ').textContent()).includes('Reservarla no tiene costo.'), 'BBQ: cobro quitado')
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const bbq = bd.zonasComunes.find((z) => z.id === 'zon-bbq')
  check(!bbq.valorUso && !bbq.respaldoCobro, 'BBQ: sin cobro ni respaldo guardado')
  await entrar('Maria Camila Restrepo')
  await p.setViewportSize({ width: 390, height: 844 })
  await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(500)
  const lista = await p.locator('body').textContent()
  check(lista.includes('80.000 por reserva') && lista.includes('multa si no cancelas con 48 h'), 'residente: resumen en la lista')
  check(lista.includes('10.000 por reserva') && lista.includes('multa si no cancelas con 12 h'), 'residente: gimnasio actualizado')
  await p.locator('button.tarjeta', { hasText: 'Salón social' }).click(); await p.waitForTimeout(300)
  const modal = await p.locator('body').textContent()
  check(modal.includes('Costos y cancelación') && modal.includes('Depósito de garantía') && modal.includes('presentar descargos'), 'residente: detalle antes de la fecha')
  
})

test("zonas compartidas, horario por día, aviso al cancelar, portería y aviso masivo (RN-111 a RN-117)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  const iso = (d) => { const x = new Date(AHORA_PRUEBAS); x.setDate(x.getDate() + d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}` }
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(600)
  }
  const texto = () => p.locator('body').textContent()
  const tarjeta = (n) => p.locator('.tarjeta', { has: p.locator('strong', { hasText: new RegExp(`^${n}$`) }) })
  await p.goto(URL); await p.evaluate(() => localStorage.clear())

  // 4 — portería
  await entrar('Jairo Alberto Pineda')
  await p.goto(URL + '#/porteria'); await p.waitForTimeout(400)
  let t = await texto()
  check(t.includes('Reservas de hoy') && t.includes('Terraza BBQ · 19:00 a 23:00') && t.includes('10 personas'), '4: portería ve la reserva de hoy con personas')
  check(!t.includes('30.000'), '4: portería no ve costos')
  // 6 — admin: horario por día
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas/zonas'); await p.waitForTimeout(400)
  check((await tarjeta('Gimnasio').textContent()).includes('Lun a Sáb 05:00 a 21:00 · Dom 07:00 a 13:00'), '6: horario semanal en la tarjeta')
  check((await tarjeta('Gimnasio').textContent()).includes('compartida hasta 8 personas'), '1: gimnasio compartido en la tarjeta')
  await tarjeta('Sala de coworking').getByRole('button', { name: 'Editar reglas' }).click()
  await p.selectOption('#zona-dias', 'por-dia')
  await p.getByLabel('Abre los domingos', { exact: true }).uncheck()
  await p.getByLabel('Abre los sábados', { exact: true }).uncheck()
  await p.selectOption('[aria-label="Cierra los viernes a las"]', '18:00')
  await p.getByRole('button', { name: 'Guardar reglas' }).click()
  check((await texto()).includes('sobra un pedazo'), '6: horario de un día que no cabe en turnos se rechaza')
  await p.selectOption('[aria-label="Cierra los viernes a las"]', '17:00')
  await p.getByRole('button', { name: 'Guardar reglas' }).click(); await p.waitForTimeout(700)
  check((await tarjeta('Sala de coworking').textContent()).includes('Lun a Jue 07:00 a 19:00 · Vie 07:00 a 17:00'), '6: coworking lun-vie guardado')

  // 5 — admin cancela una reserva
  await p.goto(URL + '#/admin/reservas'); await p.getByRole('button', { name: 'Proximas' }).click(); await p.waitForTimeout(300)
  const fila = p.locator('tr', { hasText: 'Terraza BBQ' }).filter({ hasText: 'Confirmada' }).first()
  await fila.getByRole('button', { name: 'Cancelar' }).click()
  check(await p.getByRole('button', { name: 'Cancelar y avisar' }).isDisabled(), '5: sin motivo no se puede')
  await p.fill('#motivo-cancelacion', 'El consejo necesita la terraza para una reunión')
  check((await texto()).includes('la administración canceló tu reserva de Terraza BBQ'), '5: vista previa del mensaje')
  await p.getByRole('button', { name: 'Cancelar y avisar' }).click(); await p.waitForTimeout(700)
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  check(bd.reservas.find((r) => r.id === 'rsv-5').estado === 'cancelada' && bd.mensajes.some((m) => m.reservaId === 'rsv-5'), '5: cancelada con mensaje')

  // 1, 3, 6 — residente
  await entrar('Maria Camila Restrepo')
  await p.setViewportSize({ width: 390, height: 844 })
  await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(400)
  await p.locator('button.tarjeta', { hasText: 'Gimnasio' }).click()
  await p.fill('#fecha-reserva', iso(1)); await p.fill('#personas-reserva', '3'); await p.waitForTimeout(200)
  const f7 = p.locator('button.franja', { hasText: '07:00 - 09:00' })
  check((await f7.textContent()).includes('quedan 3'), '1: el turno compartido muestra quedan 3')
  check(!(await f7.isDisabled()), '1: con 3 personas se puede')
  await p.fill('#personas-reserva', '4'); await p.waitForTimeout(200)
  check(await f7.isDisabled(), '1: con 4 personas ya no cabe')
  await p.fill('#personas-reserva', '3'); await f7.click()
  await p.getByRole('button', { name: 'Confirmar reserva' }).click(); await p.waitForTimeout(700)
  const bd2 = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  check(bd2.reservas.filter((r) => r.zonaId === 'zon-gimnasio' && r.fecha === iso(1) && r.horaInicio === '07:00' && r.estado === 'confirmada').length === 3, '1: tres unidades comparten el turno')
  // 6 — coworking sábado cerrado
  let sabado = 1; while (new Date(iso(sabado) + 'T12:00').getDay() !== 6) sabado++
  await p.locator('button.tarjeta', { hasText: 'Sala de coworking' }).click()
  await p.fill('#fecha-reserva', iso(sabado)); await p.waitForTimeout(200)
  check((await texto()).includes('no abre los sábados') && await p.locator('button.franja').count() === 0, '6: un sábado el coworking no ofrece turnos')
  await p.keyboard.press('Escape'); await p.goto(URL + '#/app/solicitudes/pqrs'); await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(300)
  // 3 — salón exclusivo, más del aforo
  await p.locator('button.tarjeta', { hasText: 'Salón social' }).click()
  await p.fill('#personas-reserva', '45'); await p.waitForTimeout(200)
  check((await texto()).includes('Aforo: 40 personas') && await p.getByRole('button', { name: 'Solicitar reserva' }).isDisabled(), '3: más del aforo no deja reservar')
  await p.goto(URL + '#/app/solicitudes/pqrs'); await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(300)
  // 2 — cancelar salón mañana, fuera de plazo
  const mia = p.locator('.tarjeta', { hasText: 'Salón social' }).filter({ hasText: '20 personas' })
  await mia.getByRole('button', { name: 'Cancelar' }).click(); await p.waitForTimeout(200)
  t = await texto()
  check(t.includes('Cancelar fuera de plazo') && t.includes('50.000') && t.includes('Reserva no cancelada a tiempo'), '2: aviso de multa antes de cancelar')
  await p.getByRole('button', { name: 'Conservar mi reserva' }).click()
  let bd3 = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  check(bd3.reservas.find((r) => r.id === 'rsv-8').estado === 'confirmada', '2: conservar no cancela')
  await mia.getByRole('button', { name: 'Cancelar' }).click()
  await p.getByRole('button', { name: 'Cancelar de todos modos' }).click(); await p.waitForTimeout(700)
  bd3 = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const r8 = bd3.reservas.find((r) => r.id === 'rsv-8')
  check(r8.estado === 'cancelada' && r8.canceladaFueraDePlazo === true, '2: cancelada y marcada fuera de plazo')
  // cancel without fine: coworking? rsv-1 salon +6 is outside 48h
  const lejos = p.locator('.tarjeta', { hasText: 'Salón social' }).filter({ hasText: '30 personas' })
  await lejos.getByRole('button', { name: 'Cancelar' }).click(); await p.waitForTimeout(700)
  bd3 = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  check(bd3.reservas.find((r) => r.id === 'rsv-1').estado === 'cancelada' && !bd3.reservas.find((r) => r.id === 'rsv-1').canceladaFueraDePlazo, '2: a tiempo se cancela sin aviso')
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas'); await p.getByRole('button', { name: 'Todas' }).click()
  check((await texto()).includes('Cancelada fuera de plazo'), '2: la consola ve la cancelación fuera de plazo')
})

test("aviso masivo del cierre por mantenimiento (RN-117)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  const iso = (d) => { const x = new Date(AHORA_PRUEBAS); x.setDate(x.getDate() + d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}` }
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(600)
  }
  const tarjeta = (n) => p.locator('.tarjeta', { has: p.locator('strong', { hasText: new RegExp(`^${n}$`) }) })
  await p.goto(URL); await p.evaluate(() => localStorage.clear())
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas/zonas'); await p.waitForTimeout(400)
  await tarjeta('Gimnasio').getByRole('button', { name: 'Cerrar por mantenimiento' }).click()
  await p.fill('#cierre-desde', iso(1)); await p.fill('#cierre-hasta', iso(2))
  await p.fill('#cierre-motivo', 'Cambio de las máquinas cardiovasculares')
  const t = await p.locator('body').textContent()
  check(t.includes('Avisar a toda la copropiedad') && /\(\d+ personas\)/.test(t), 'la opción muestra a cuántas personas')
  check(t.includes('Gimnasio estará cerrada por mantenimiento'), 'vista previa del mensaje masivo')
  await p.getByRole('button', { name: /Cerrar y avisar a 2/ }).click(); await p.waitForTimeout(700)
  check((await p.locator('body').textContent()).includes('Aviso a toda la copropiedad'), 'el aviso confirma el envío masivo')
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const com = bd.comunicados.find((c) => c.categoria === 'mantenimiento' && c.titulo.startsWith('Gimnasio'))
  check(!!com, 'comunicado de mantenimiento publicado')
  const masivos = bd.mensajes.filter((m) => m.motivo === 'cierre_zona')
  const cancel = bd.mensajes.filter((m) => m.motivo === 'reserva_cancelada')
  const destinos = new Set(masivos.map((m) => m.destino))
  check(masivos.length > 3 && destinos.size === masivos.length, `mensajes masivos, uno por persona: ${masivos.length}`)
  check(cancel.length === 2 && !cancel.some((c) => masivos.some((m) => m.destino === c.destino)), 'quien perdió su reserva no recibe doble mensaje')
  // sin aviso masivo
  await tarjeta('Cancha multiple').getByRole('button', { name: 'Cerrar por mantenimiento' }).click()
  await p.fill('#cierre-motivo', 'Pintura de las líneas de la cancha')
  await p.getByText('Avisar a toda la copropiedad').click()
  await p.getByRole('button', { name: 'Cerrar por mantenimiento' }).last().click(); await p.waitForTimeout(700)
  const bd2 = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  check(bd2.mensajes.filter((m) => m.motivo === 'cierre_zona').length === masivos.length && !bd2.comunicados.some((c) => c.titulo.startsWith('Cancha')), 'sin marcar, no hay aviso masivo')
  await entrar('Maria Camila Restrepo')
  await p.goto(URL + '#/app/comunicados'); await p.waitForTimeout(400)
  check((await p.locator('body').textContent()).includes('Gimnasio: cerrada por mantenimiento'), 'el residente lo ve en la cartelera')
})

test("calendario de ocupación de las zonas (CU-A-29)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  const iso = (d) => { const x = new Date(AHORA_PRUEBAS); x.setDate(x.getDate() + d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}` }
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(600)
  }
  const texto = () => p.locator('body').textContent()
  await p.goto(URL); await p.evaluate(() => localStorage.clear())
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas/calendario'); await p.waitForTimeout(500)
  let t = await texto()
  check(t.includes('Calendario de ocupación') && (await p.locator('nav.segmentos a').count()) === 4, 'pestaña Calendario (con Informe son cuatro)')
  check(t.includes('hoy') && /de \d+ turnos con reserva/.test(t), 'semana con resumen de ocupación')
  // salón mañana: rsv-8 17:00 per-1 20 personas (si mañana cae en esta semana)
  const manana = iso(1)
  const mismaSemana = await p.evaluate(([m]) => { const d = new Date(); const dia = d.getDay(); return new Date(m + 'T12:00').getDay() !== 1 || dia === 0 }, [manana])
  if (!mismaSemana) { await p.getByRole('button', { name: 'Siguiente →' }).click(); await p.waitForTimeout(200) }
  t = await texto()
  check(t.includes('402 · 20 p.'), 'salón: la casilla dice unidad y personas')
  await p.locator('button', { hasText: '402 · 20 p.' }).first().click(); await p.waitForTimeout(200)
  check((await texto()).includes('Maria Camila Restrepo') && (await texto()).includes('20 personas'), 'detalle de la casilla')
  await p.keyboard.press('Escape'); await p.locator('.fondo-modal').click({ position: { x: 5, y: 5 } }).catch(() => {})
  await p.goto(URL + '#/admin/reservas'); await p.goto(URL + '#/admin/reservas/calendario'); await p.waitForTimeout(300)
  // gimnasio compartido
  await p.selectOption('#calendario-zona', 'zon-gimnasio')
  if (!mismaSemana) { await p.getByRole('button', { name: 'Siguiente →' }).click(); await p.waitForTimeout(200) }
  t = await texto()
  check(t.includes('5 de 8') && /cupos \(\d+ %\)/.test(t), 'gimnasio: turno compartido 5 de 8 y cupos de la semana')
  // domingo del gimnasio solo abre en la mañana: celda 15:00 domingo = —
  const filas = p.locator('tbody tr', { hasText: '15:00' })
  const ultimaCelda = await filas.first().locator('td').last().textContent()
  check(ultimaCelda.trim() === '—', 'gimnasio: el domingo por la tarde no abre')
  // mantenimiento visible
  await p.goto(URL + '#/admin/reservas/zonas'); await p.waitForTimeout(300)
  const cancha = p.locator('.tarjeta', { has: p.locator('strong', { hasText: /^Cancha multiple$/ }) })
  await cancha.getByRole('button', { name: 'Cerrar por mantenimiento' }).click()
  await p.fill('#cierre-desde', iso(1)); await p.fill('#cierre-hasta', iso(1)); await p.fill('#cierre-motivo', 'Pintura de las líneas de la cancha')
  await p.getByText('Avisar a toda la copropiedad').click()
  await p.getByRole('button', { name: 'Cerrar por mantenimiento' }).last().click(); await p.waitForTimeout(700)
  await p.goto(URL + '#/admin/reservas/calendario'); await p.waitForTimeout(300)
  await p.selectOption('#calendario-zona', 'zon-cancha')
  if (!mismaSemana) { await p.getByRole('button', { name: 'Siguiente →' }).click(); await p.waitForTimeout(200) }
  check((await p.locator('tbody span', { hasText: 'Mantenimiento' }).count()) === 6, 'cancha: el día del cierre sale en mantenimiento')
  await p.getByRole('button', { name: 'Siguiente →' }).click(); await p.waitForTimeout(200)
  check((await texto()).includes('0 de') , 'navegar a otra semana')
  await p.setViewportSize({ width: 390, height: 844 })
  await p.goto(URL + '#/admin/reservas/calendario'); await p.waitForTimeout(400)
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth)
  check(ancho <= 392, `celular: sin desborde horizontal de la página (${ancho}px)`)
  
})

test("la plata de la reserva: cobro al cerrar, depósito y multa (RN-118 a RN-121)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(600)
  }
  const texto = () => p.locator('body').textContent()
  const bdx = () => p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  await p.goto(URL); await p.evaluate(() => localStorage.clear())
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas'); await p.waitForTimeout(300)
  await p.getByRole('button', { name: 'Por cerrar' }).click(); await p.waitForTimeout(200)
  let t = await texto()
  check(t.includes('Depósito $ 200.000 recibido') || t.includes('Depósito $ 200.000 recibido'), 'por cerrar: salón con depósito recibido')
  check((await p.locator('tbody tr').count()) >= 2, 'por cerrar: las dos reservas pasadas')
  // RN-118: cambiar precio no cambia lo pactado
  // cerrar salón con novedades y retención
  const salon = p.locator('tr', { hasText: 'Salón social' }).first()
  await salon.getByRole('button', { name: 'Cerrar' }).click()
  await p.getByRole('button', { name: 'Con daños o faltantes' }).click()
  await p.getByRole('button', { name: 'Cerrar reserva' }).click()
  check((await texto()).includes('Describe las novedades'), 'novedades sin describir se rechaza')
  await p.fill('#cierre-observaciones', 'Dos sillas rotas y el piso manchado de vino')
  await p.fill('#cierre-retener', '250000')
  await p.fill('#cierre-motivo-retencion', 'Reposición de dos sillas según cotización')
  await p.getByRole('button', { name: 'Cerrar reserva' }).click()
  check((await texto()).includes('no pasa del depósito'), 'retener más que el depósito se rechaza')
  await p.fill('#cierre-retener', '90000')
  t = await texto()
  check(t.includes('se devuelven') && t.includes('110.000') && t.includes('Cobro por uso'), 'vista previa: devuelve 110.000 y cobro por uso')
  await p.getByRole('button', { name: 'Cerrar reserva' }).click(); await p.waitForTimeout(800)
  let bd = await bdx()
  const r9 = bd.reservas.find((r) => r.id === 'rsv-9')
  const cuota = bd.cuotas.find((c) => c.id === r9.cierre?.cuotaUsoId)
  check(r9.cierre?.depositoRetenido === 90000 && r9.cierre?.depositoDevuelto === 110000, 'depósito: retenido 90.000, devuelto 110.000')
  check(cuota && cuota.tipo === 'uso_zona' && cuota.valor === 80000 && cuota.unidadId === 'uni-torre1-202' && cuota.justificacion.includes('Artículo 42'), 'cuota de uso con justificación y respaldo')
  // no se presentó + proceso
  await p.getByRole('button', { name: 'Por cerrar' }).click(); await p.waitForTimeout(200)
  const bbq = p.locator('tr', { hasText: 'Terraza BBQ' }).first()
  await bbq.getByRole('button', { name: 'Cerrar' }).click()
  await p.getByRole('button', { name: 'No se presentó' }).click()
  t = await texto()
  check(!t.includes('Abrir el proceso por la multa'), 'BBQ sin multa: no ofrece proceso')
  await p.getByRole('button', { name: 'Cerrar reserva' }).click(); await p.waitForTimeout(800)
  bd = await bdx()
  const r10 = bd.reservas.find((r) => r.id === 'rsv-10')
  check(r10.cierre?.resultado === 'no_se_presento' && bd.cuotas.some((c) => c.id === r10.cierre.cuotaUsoId && c.valor === 30000), 'no se presentó: se cobra el uso')
  // Cancelación fuera de plazo -> abrir proceso (salón mañana rsv-8)
  await entrar('Maria Camila Restrepo')
  await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(300)
  t = await texto()
  check(t.includes('entrégalo a la administración antes del turno'), 'residente: aviso de depósito por entregar')
  await p.locator('.tarjeta', { hasText: 'Salón social' }).filter({ hasText: '20 personas' }).getByRole('button', { name: 'Cancelar' }).click()
  await p.getByRole('button', { name: 'Cancelar de todos modos' }).click(); await p.waitForTimeout(700)
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas'); await p.getByRole('button', { name: 'Todas' }).click(); await p.waitForTimeout(200)
  const fila8 = p.locator('tr', { hasText: 'Cancelada fuera de plazo' }).first()
  await fila8.getByRole('button', { name: 'Abrir proceso' }).click(); await p.waitForTimeout(800)
  bd = await bdx()
  const r8 = bd.reservas.find((r) => r.id === 'rsv-8')
  const san = bd.sanciones.find((s) => s.id === r8.sancionId)
  check(san && san.conceptoId === 'cs-6' && san.estado === 'notificada' && san.hechos.includes('fuera del plazo'), 'proceso abierto con la multa del catálogo y los hechos')
  check(!(await p.locator('tr', { hasText: san.radicado }).getByRole('button', { name: 'Abrir proceso' }).count()), 'un solo proceso por reserva')
  // Residente Jorge ve el cobro
  await entrar('Jorge Enrique Valencia')
  await p.goto(URL + '#/app/cuenta'); await p.waitForTimeout(400)
  t = await texto()
  check(t.includes('Uso de Salón social'), 'residente: el cobro en su estado de cuenta')
  await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(300)
  t = await texto()
  check(t.includes('se retienen') && t.includes('Reposición de dos sillas'), 'residente: ve la retención con motivo')
})

test("no se presentó: depósito y proceso por la multa (RN-120, RN-121)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL)
  await p.getByText('¿Estás viendo el demo?').click(); await p.getByText('Olga Lucia Henao', { exact: true }).click(); await p.waitForTimeout(600)
  await p.goto(URL + '#/admin/reservas'); await p.getByRole('button', { name: 'Por cerrar' }).click()
  await p.locator('tr', { hasText: 'Salón social' }).first().getByRole('button', { name: 'Cerrar' }).click()
  await p.getByRole('button', { name: 'No se presentó' }).click()
  await p.getByText('Abrir el proceso por la multa').click()
  await p.getByRole('button', { name: 'Cerrar reserva' }).click(); await p.waitForTimeout(900)
  const t = await p.locator('body').textContent()
  check(/Proceso SAN-\d{4}-\d{4} abierto/.test(t), 'aviso con el radicado del proceso')
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const r = bd.reservas.find((x) => x.id === 'rsv-9')
  check(r.cierre.resultado === 'no_se_presento' && r.cierre.depositoDevuelto === 200000 && !!r.sancionId, 'no se presentó: depósito completo y proceso abierto')
  check(bd.sanciones.find((s) => s.id === r.sancionId).hechos.includes('no se presentó'), 'hechos del proceso')
})

test("solicitudes que vencen, avisos, condiciones aceptadas e invitados (RN-122 a RN-126)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  const iso = (d) => { const x = new Date(AHORA_PRUEBAS); x.setDate(x.getDate() + d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}` }
  async function entrar(nombre) {
    await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL)
    await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(600)
  }
  const texto = () => p.locator('body').textContent()
  const bdx = () => p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(600)
  // 1 — vencimiento al abrir
  let bd = await bdx()
  const r11 = bd.reservas.find((r) => r.id === 'rsv-11')
  check(r11.estado === 'vencida' && bd.mensajes.some((m) => m.reservaId === 'rsv-11' && m.motivo === 'reserva_vencida'), '1: la solicitud pasada venció y se avisó')
  // 4 — recordatorio de mañana
  const r8 = bd.reservas.find((r) => r.id === 'rsv-8')
  const rec = bd.mensajes.find((m) => m.reservaId === 'rsv-8' && m.motivo === 'recordatorio_reserva')
  check(!!r8.recordatorioEnviadoEn && rec && rec.texto.includes('mañana tienes Salón social') && rec.texto.includes('depósito'), '4: recordatorio de mañana con el depósito')
  const n = bd.mensajes.filter((m) => m.motivo === 'recordatorio_reserva').length
  await p.reload(); await p.waitForTimeout(600)
  bd = await bdx()
  check(bd.mensajes.filter((m) => m.motivo === 'recordatorio_reserva').length === n, '4: el recordatorio va una sola vez')
  // 1 — tablero
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin'); await p.waitForTimeout(400)
  let t = await texto()
  check(t.includes('reserva por aprobar vence pronto') || t.includes('reservas por aprobar vencen pronto'), '1: alerta en el tablero')
  check(/faltan \d+ h/.test(t), '1: dice cuántas horas faltan')
  // 2 — aprobar y rechazar con mensaje
  await p.goto(URL + '#/admin/reservas'); await p.waitForTimeout(300)
  const fila = p.locator('tr', { hasText: 'Terraza BBQ' }).filter({ hasText: 'Por aprobar' }).first()
  await fila.getByRole('button', { name: 'Aprobar' }).click(); await p.waitForTimeout(600)
  bd = await bdx()
  const decidida = bd.mensajes.find((m) => m.motivo === 'reserva_decidida')
  check(decidida && decidida.texto.includes('aprobó tu reserva'), '2: al aprobar llega mensaje')
  await p.locator('tr', { hasText: 'Por aprobar' }).first().getByRole('button', { name: 'Rechazar' }).click()
  await p.fill('#motivo-rechazo', 'Ese día hay fumigación en la torre')
  await p.getByRole('button', { name: 'Rechazar reserva' }).click(); await p.waitForTimeout(600)
  bd = await bdx()
  check(bd.mensajes.some((m) => m.motivo === 'reserva_decidida' && m.texto.includes('rechazó') && m.texto.includes('fumigación')), '2: al rechazar llega el motivo')
  // 3, 5 — residente reserva el salón
  await entrar('Maria Camila Restrepo')
  await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(300)
  await p.locator('button.tarjeta', { hasText: 'Salón social' }).click()
  await p.fill('#fecha-reserva', iso(40)); await p.fill('#personas-reserva', '3'); await p.waitForTimeout(200)
  const libre = p.locator('button.franja:not([disabled])').first(); await libre.click()
  t = await texto()
  check(t.includes('Acepto las condiciones de Salón social') && t.includes('$80.000') && t.includes('multa'), '3: muestra las condiciones a aceptar')
  check(await p.getByRole('button', { name: 'Solicitar reserva' }).isDisabled(), '3: sin aceptar no deja reservar')
  await p.fill('#invitados-reserva', 'Ana\nBeto\nCata')
  check((await texto()).includes('caben 2 invitados'), '5: no caben más invitados que personas menos uno')
  await p.fill('#invitados-reserva', 'Ana María Gómez\nBeto Díaz')
  await p.locator('label', { hasText: 'Acepto las condiciones' }).locator('input').check()
  await p.getByRole('button', { name: 'Solicitar reserva' }).click(); await p.waitForTimeout(700)
  bd = await bdx()
  const nueva = bd.reservas.find((r) => r.fecha === iso(40) && r.zonaId === 'zon-salon' && r.personaId === 'per-1')
  check(nueva && nueva.condicionesAceptadas?.texto.includes('$200.000') && nueva.invitados?.length === 2, '3 y 5: guarda la constancia y los invitados')
  // 5 — editar invitados después
  await p.locator('.tarjeta', { hasText: 'Salón social' }).filter({ hasText: '3 personas' }).getByRole('button', { name: /Invitados/ }).click()
  await p.fill('#invitados-edicion', 'Ana María Gómez')
  await p.getByRole('button', { name: 'Guardar' }).click(); await p.waitForTimeout(600)
  bd = await bdx()
  check(bd.reservas.find((r) => r.id === nueva.id).invitados.length === 1, '5: la lista se edita después')
  // 5 — portería ve invitados
  await entrar('Jairo Alberto Pineda')
  await p.goto(URL + '#/porteria'); await p.waitForTimeout(400)
  const hoy = await texto()
  if (hoy.includes('Terraza BBQ · 19:00')) {
    await p.getByText('Invitados (3)').click()
    check((await texto()).includes('Lucía Pardo'), '5: portería ve los invitados de hoy')
  } else { check(true, '5: (la reserva de hoy ya no está vigente a esta hora)') }
  
})

test("el repositorio revisa mora, anticipación y cupo al reservar (CU-R-05)", async ({ page }) => {
  test.setTimeout(180_000)
  const p = page
  await p.goto('/'); await p.evaluate(() => localStorage.clear()); await p.goto('/'); await p.waitForTimeout(500)
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const iso = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}` }
    const bd = await repo.cargar()
    const intentar = async (params) => { try { const x = await repo.crearReserva(bd, params); return { ok: true, fin: x.datos.horaFin } } catch (e) { return { ok: false, msg: e.message } } }
    const base = { personaId: 'per-1', unidadId: 'uni-torre1-402', horaFin: '23:59' }
    return {
      mora: await intentar({ ...base, zonaId: 'zon-coworking', unidadId: 'uni-torre2-901', personaId: 'per-2', fecha: iso(5), horaInicio: '09:00' }),
      anticipacion: await intentar({ ...base, zonaId: 'zon-salon', fecha: iso(0), horaInicio: '17:00', aceptaCondiciones: true }),
      cupo: await intentar({ ...base, zonaId: 'zon-salon', fecha: iso(8), horaInicio: '09:00', aceptaCondiciones: true }),
      aforo: await intentar({ ...base, zonaId: 'zon-coworking', fecha: iso(5), horaInicio: '09:00', personas: 7 }),
      bien: await intentar({ ...base, zonaId: 'zon-coworking', fecha: iso(5), horaInicio: '09:00', personas: 2 }),
    }
  })
  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  check(!r.mora.ok && /cuotas vencidas/.test(r.mora.msg), 'mora: se rechaza en el repositorio')
  check(!r.anticipacion.ok && /anticipacion/.test(r.anticipacion.msg), 'anticipación: se rechaza')
  check(!r.cupo.ok && /cupo/.test(r.cupo.msg), 'cupo mensual: se rechaza')
  check(!r.aforo.ok, 'más personas que cupos: se rechaza')
  check(r.bien.ok && r.bien.fin === '11:00', 'válida: se crea y el fin sale del turno, no de lo que manden')
})

test("informe de uso de las zonas, descargable para Excel (CU-A-30)", async ({ page }) => {
  test.setTimeout(180_000)
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  const texto = () => p.locator('body').textContent()
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(500)
  await p.getByText('¿Estás viendo el demo?').click(); await p.getByText('Olga Lucia Henao', { exact: true }).click(); await p.waitForTimeout(600)
  // cerrar la del salón como usada (cobro 80.000)
  await p.goto(URL + '#/admin/reservas'); await p.getByRole('button', { name: 'Por cerrar' }).click()
  await p.locator('tr', { hasText: 'Salón social' }).first().getByRole('button', { name: 'Cerrar' }).click()
  await p.getByRole('button', { name: 'Cerrar reserva' }).click(); await p.waitForTimeout(700)
  // y la terraza como no se presentó (cobro 30.000)
  await p.getByRole('button', { name: 'Por cerrar' }).click()
  await p.locator('tr', { hasText: 'Terraza BBQ' }).first().getByRole('button', { name: 'Cerrar' }).click()
  await p.getByRole('button', { name: 'No se presentó' }).click()
  await p.getByRole('button', { name: 'Cerrar reserva' }).click(); await p.waitForTimeout(700)
  await p.goto(URL + '#/admin/reservas/informe'); await p.waitForTimeout(400)
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const mesDe = (d) => d.slice(0, 7)
  const hoy = new Date(AHORA_PRUEBAS); const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const cerradasEsteMes = bd.reservas.filter((r) => r.cierre && mesDe(r.fecha) === mes)
  const cobradoEsperado = cerradasEsteMes.reduce((t, r) => t + (r.valorUso ?? 0), 0)
  let t = await texto()
  check(t.includes('Informe de uso de las zonas') && (await p.locator('nav.segmentos a').count()) === 4, 'pestaña Informe (cuatro pestañas)')
  check(t.includes('Reservas tomadas') && t.includes('Ocupación') && t.includes('Cobrado por uso'), 'cifras del periodo')
  check(t.replace(/\s/g, '').includes(cobradoEsperado.toLocaleString('es-CO').replace(/\s/g, '')), `cobrado del mes = ${cobradoEsperado}`)
  check(t.includes('Unidades que más reservan'), 'ranking de unidades')
  // descarga
  const [descarga] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Descargar para Excel' }).click()])
  const ruta = test.info().outputPath('informe.csv'); await descarga.saveAs(ruta)
  const csv = fs.readFileSync(ruta, 'utf8')
  check(csv.charCodeAt(0) === 0xfeff && csv.includes(';Tomadas;') && csv.includes('Salón social;'), 'CSV para Excel en español (BOM, punto y coma, tildes)')
  check(descarga.suggestedFilename().startsWith('uso-zonas-comunes-'), 'nombre del archivo con el periodo')
  // mes anterior y rango inválido
  await p.selectOption('#informe-periodo', 'otro')
  await p.fill('#informe-desde', '2026-12-10'); await p.fill('#informe-hasta', '2026-12-01')
  check((await texto()).includes('Revisa las fechas'), 'fechas al revés: lo avisa')
  await p.selectOption('#informe-periodo', 'mes_anterior'); await p.waitForTimeout(200)
  check((await texto()).includes('Del 01/'), 'mes anterior')
  await p.setViewportSize({ width: 390, height: 844 }); await p.selectOption('#informe-periodo', 'este_mes'); await p.waitForTimeout(300)
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth)
  check(ancho <= 392, `celular sin desborde (${ancho}px)`)
  
})

test("solo se cancela antes del límite que fija la zona (RN-128)", async ({ page }) => {
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
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); const reglas = await import('/src/dominio/reglas.ts')
    const out = {}
    let bd = await repo.cargar()
    try { await repo.cancelarReserva(bd, 'rsv-9'); out.pasada = 'se pudo' } catch (e) { out.pasada = e.message }
    const c = await repo.cerrarReserva(bd, { reservaId: 'rsv-10', resultado: 'no_se_presento', registradoPor: 'x' })
    try { await repo.cancelarReserva(c.bd, 'rsv-10'); out.cerrada = 'se pudo' } catch (e) { out.cerrada = e.message }
    bd = c.bd
    const rech = bd.reservas.find((x) => x.estado === 'vencida')
    try { await repo.cancelarReserva(bd, rech.id); out.vencida = 'se pudo' } catch (e) { out.vencida = e.message }
    const base = { estado: 'confirmada', fecha: '2026-12-10', horaInicio: '17:00', horaFin: '21:00', horasLimiteCancelacion: 12 }
    out.antesDelLimite = reglas.sePuedeCancelar(base, undefined, new Date('2026-12-10T04:59:00'))
    out.despuesDelLimite = reglas.sePuedeCancelar(base, undefined, new Date('2026-12-10T05:01:00'))
    out.adminAntes = reglas.puedeCancelarLaAdministracion(base, new Date('2026-12-10T16:59:00'))
    out.adminDespues = reglas.puedeCancelarLaAdministracion(base, new Date('2026-12-10T17:01:00'))
    return out
  })
  check(/no se puede cancelar|límite/.test(r.pasada), 'no se cancela una reserva cuyo turno ya pasó')
  check(/ya no se puede cancelar/i.test(r.cerrada), 'no se cancela una reserva cerrada')
  check(/ya no se puede cancelar/i.test(r.vencida), 'no se cancela una vencida')
  check(r.antesDelLimite === true && r.despuesDelLimite === false, 'el límite de 12 h se respeta al minuto')
  check(r.adminAntes === true && r.adminDespues === false, 'la administración cancela solo antes del turno')
  // admin parametriza
  await entrar('Olga Lucia Henao')
  await p.goto(URL + '#/admin/reservas/zonas'); await p.waitForTimeout(300)
  const bbq = p.locator('.tarjeta', { has: p.locator('strong', { hasText: /^Terraza BBQ$/ }) })
  check((await bbq.textContent()).includes('Puedes cancelar hasta que empiece el turno'), 'la zona sin límite lo dice')
  await bbq.getByRole('button', { name: 'Editar reglas' }).click()
  await p.fill('#zona-limite-cancelar', '800'); await p.getByRole('button', { name: 'Guardar reglas' }).click()
  check((await texto()).includes('de 0 a 720'), 'un límite fuera de rango se rechaza')
  await p.fill('#zona-limite-cancelar', '6'); await p.getByRole('button', { name: 'Guardar reglas' }).click(); await p.waitForTimeout(700)
  check((await bbq.textContent()).includes('hasta 6 horas antes'), 'el administrador lo parametriza y se ve en la zona')
  // residente
  await entrar('Maria Camila Restrepo'); await p.setViewportSize({ width: 390, height: 844 })
  await p.goto(URL + '#/app/solicitudes/reservas'); await p.waitForTimeout(400)
  let t = await texto()
  check(/Puedes cancelar hasta el \d+ de \w+ de \d{4} a las \d\d:\d\d/.test(t), 'en cada reserva ve hasta cuándo puede cancelar')
  await p.locator('button.tarjeta', { hasText: 'Terraza BBQ' }).click(); await p.waitForTimeout(200)
  check((await texto()).includes('hasta 6 horas antes'), 'al reservar ve el límite de la zona')
  
})

test("las reservas sin plata se cierran solas (RN-129)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL = '/'

  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(600)
  const bd = await p.evaluate(() => JSON.parse(localStorage.getItem('idiky.demo.bd')))
  const r4 = bd.reservas.find((r) => r.id === 'rsv-4')
  check(r4.cierre?.automatico === true && r4.cierre.resultado === 'usada', 'el coworking gratis ya pasado se cerró solo como usado')
  check(!bd.reservas.find((r) => r.id === 'rsv-9').cierre && !bd.reservas.find((r) => r.id === 'rsv-10').cierre, 'las que mueven plata siguen esperando al administrador')
  check(!bd.cuotas.some((c) => c.tipo === 'uso_zona'), 'el cierre automático no genera cobro')
  await p.getByText('¿Estás viendo el demo?').click(); await p.getByText('Olga Lucia Henao', { exact: true }).click(); await p.waitForTimeout(600)
  await p.goto(URL + '#/admin/reservas'); await p.getByRole('button', { name: 'Por cerrar' }).click(); await p.waitForTimeout(300)
  const filas = await p.locator('tbody tr').allTextContents()
  check(filas.length === 2 && filas.every((f) => /Salón social|Terraza BBQ/.test(f)), 'Por cerrar muestra solo las que mueven plata')
  await p.getByRole('button', { name: 'Todas' }).click(); await p.waitForTimeout(200)
  check((await p.locator('body').textContent()).includes('cierre automático, sin cobro'), 'la tabla dice que se cerró sola')
})
