/**
 * CU-R-48 — Elegir por dónde y de qué me avisan (PN-16).
 */

import { entrarComo, expect, test } from './base'

test('el canal elegido se respeta, con respaldo si falta el dato, y lo apagado no se manda (PN-16)', async ({ page }) => {
  await page.goto('/')
  const r = await page.evaluate(async () => {
    const reglas = await import('/src/dominio/reglas.ts')
    const repo = await import('/src/datos/repositorio.ts')
    let bd = await repo.cargar()
    const intento = async (f: () => Promise<{ bd: typeof bd; datos: unknown }>) => {
      try { const res = await f(); bd = res.bd; return res.datos } catch (e) { return 'ERR: ' + (e as Error).message }
    }
    const p = { email: 'a@b.co', telefono: '3001234567' }
    const canal = {
      porDefecto: reglas.canalDelAviso(p),
      correo: reglas.canalDelAviso({ ...p, preferenciasAvisos: { canal: 'correo', temas: {} } }),
      correoSinCorreo: reglas.canalDelAviso({ email: '', telefono: '3001234567', preferenciasAvisos: { canal: 'correo', temas: {} } }),
      whatsappSinCelular: reglas.canalDelAviso({ email: 'a@b.co', telefono: '', preferenciasAvisos: { canal: 'whatsapp', temas: {} } }),
      nada: reglas.canalDelAviso({ email: '', telefono: '' }),
      app: reglas.canalDelAviso({ ...p, preferenciasAvisos: { canal: 'app', temas: {} } }),
    }
    const pagosApagado = reglas.quiereElAviso({ canal: 'sms', temas: { pagos: false } }, 'recordatorio_pago')
    const obligatorio = reglas.quiereElAviso({ canal: 'sms', temas: { pagos: false, obras: false, reservas: false } }, 'permiso_decidido')
    // La propietaria apaga las obras y elige correo: el avance de obra no le llega; la respuesta a su trasteo sí, por correo.
    await intento(() => repo.configurarAvisos(bd, { personaId: 'per-1', canal: 'correo', temas: { obras: false } }))
    await intento(() => repo.registrarAvanceProyecto(bd, { proyectoId: 'pro-cubierta', porcentaje: 45, titulo: 'Torre 2', detalle: '', registradoPor: 'per-admin' }))
    const avancesAMaria = bd.mensajes.filter((m) => m.personaId === 'per-1' && m.motivo === 'avance_proyecto').length
    const avancesAOtros = bd.mensajes.filter((m) => m.personaId === 'per-2' && m.motivo === 'avance_proyecto').length
    const t = (await intento(() => repo.solicitarTrasteo(bd, { unidadId: 'uni-torre1-402', personaId: 'per-1', sentido: 'llegada', fecha: '2026-10-14', horaInicio: '09:00', horaFin: '11:00', ascensorId: 'asc-t1' }))) as { id: string }
    await intento(() => repo.decidirPermiso(bd, { tipo: 'trasteo', id: t.id, personaId: 'per-admin', aprobar: true }))
    const respuesta = bd.mensajes.find((m) => m.personaId === 'per-1' && m.motivo === 'permiso_decidido')
    return { canal, pagosApagado, obligatorio, avancesAMaria, avancesAOtros, respuestaCanal: respuesta?.canal, respuestaDestino: respuesta?.destino }
  })
  expect(r.canal.porDefecto).toEqual({ canal: 'whatsapp', destino: '3001234567' })
  expect(r.canal.correo).toEqual({ canal: 'correo', destino: 'a@b.co' })
  expect(r.canal.correoSinCorreo?.canal).toBe('whatsapp')
  expect(r.canal.whatsappSinCelular?.canal).toBe('correo')
  expect(r.canal.nada).toBeNull()
  expect(r.canal.app?.canal).toBe('app')
  expect(r.pagosApagado).toBe(false)
  expect(r.obligatorio).toBe(true)
  expect(r.avancesAMaria).toBe(0)
  expect(r.avancesAOtros).toBe(1)
  expect(r.respuestaCanal).toBe('correo')
  expect(r.respuestaDestino).toContain('@')
})

test('la propietaria elige sus avisos desde su perfil (CU-R-48)', async ({ page }) => {
  await entrarComo(page, /Maria Camila Restrepo/)
  await page.getByRole('button', { name: 'Tu perfil' }).click()
  await page.getByRole('button', { name: /Mis avisos/ }).click()
  await expect(page.getByRole('heading', { name: 'Mis avisos' })).toBeVisible()
  await page.getByRole('radio', { name: /Solo en la app/ }).click()
  await page.getByLabel(/Obras del edificio/).uncheck()
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Así te avisaremos')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('radio', { name: /Solo en la app/ })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByLabel(/Obras del edificio/)).not.toBeChecked()
})
