/**
 * API de BLOKY (ADR-0008). Arranque: configuracion, adaptadores segun el entorno y rutas.
 *
 *   npm run dev      desarrollo, con lo que falte simulado
 *   npm start        produccion (dist/), exige todas las variables
 */
import cookie from '@fastify/cookie'
import Fastify from 'fastify'
import { crearClienteBob } from './bob/cliente.js'
import { crearClienteOidc, type ClienteOidc, type Proveedor } from './acceso/oidc.js'
import { registrarRutasAcceso } from './acceso/rutas.js'
import { crearServicioAcceso } from './acceso/servicio.js'
import { crearSesiones } from './acceso/sesion.js'
import { crearEnviadorSimulado, crearTwilioVerify } from './acceso/twilio.js'
import { cargarConfig } from './config.js'
import { crearRepositorioMemoria } from './datos/memoria.js'
import { crearRepositorioPostgres } from './datos/postgres.js'

export async function construirApp(cfg = cargarConfig()) {
  const app = Fastify({ logger: cfg.entorno === 'produccion' ? { level: 'info' } : { level: 'warn' }, trustProxy: true })
  await app.register(cookie)

  const repo = cfg.db.url ? await crearRepositorioPostgres(cfg.db.url) : crearRepositorioMemoria()
  if (!cfg.db.url) {
    if (cfg.entorno === 'produccion') throw new Error('En produccion hace falta BLOKY_DB_URL')
    app.log.warn('Sin BLOKY_DB_URL: las sesiones viven en memoria')
  }
  const codigos = cfg.twilio
    ? crearTwilioVerify(cfg.twilio)
    : cfg.entorno === 'produccion'
      ? (() => { throw new Error('En produccion hacen falta las credenciales de Twilio Verify') })()
      : crearEnviadorSimulado((m) => app.log.warn(m))
  const oidc: Partial<Record<Proveedor, ClienteOidc>> = {}
  if (cfg.google) oidc.google = crearClienteOidc('google', cfg.google)
  if (cfg.microsoft) oidc.microsoft = crearClienteOidc('microsoft', cfg.microsoft)

  const sesiones = crearSesiones(repo, cfg.jwtSecreto, cfg.horasSesion)
  const servicio = crearServicioAcceso({ bob: crearClienteBob(cfg.bob.url, cfg.bob.token), repo, sesiones, codigos, oidc, urlPublica: cfg.urlPublica })

  app.get('/api/salud', async () => ({ ok: true, entorno: cfg.entorno, canales: ['sms', ...Object.keys(oidc)] }))
  registrarRutasAcceso(app, { servicio, sesiones, urlPublica: cfg.urlPublica, entorno: cfg.entorno })
  app.addHook('onClose', async () => repo.cerrar())
  return app
}

const esPrincipal = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ''))
if (esPrincipal) {
  const cfg = cargarConfig()
  const app = await construirApp(cfg)
  await app.listen({ host: cfg.host, port: cfg.puerto })
  console.log(`API de BLOKY (${cfg.entorno}) en http://${cfg.host}:${cfg.puerto}`)
}
