/**
 * Rutas HTTP del ingreso (CU-B-01). Solo traducen: validan la entrada, llaman al servicio y
 * ponen o quitan la cookie de sesion.
 */
import type { FastifyInstance, FastifyReply } from 'fastify'
import type { TipoDocumento } from '../dominio/tipos.js'
import { ErrorAcceso, type Identificacion, type crearServicioAcceso } from './servicio.js'
import type { Proveedor } from './oidc.js'
import { NOMBRE_COOKIE, type crearSesiones } from './sesion.js'

const TIPOS: TipoDocumento[] = ['CC', 'CE', 'PA', 'PPT', 'TI']
const PROVEEDORES: Proveedor[] = ['google', 'microsoft', 'yahoo']

function identificacionDe(cuerpo: unknown): Identificacion {
  const c = (cuerpo ?? {}) as Record<string, unknown>
  const tipo = String(c.tipoDocumento ?? 'CC').toUpperCase() as TipoDocumento
  const numero = String(c.numeroDocumento ?? '').replace(/[\s.]/g, '')
  if (!TIPOS.includes(tipo) || !/^[A-Za-z0-9]{3,20}$/.test(numero)) {
    throw new ErrorAcceso('no_registrado', 'Escribe tu documento sin puntos ni espacios.')
  }
  return { tipoDocumento: tipo, numeroDocumento: numero }
}

const ESTADO_HTTP: Record<ErrorAcceso['codigo'], number> = {
  no_registrado: 404, sin_acceso: 403, sin_celular: 409, bloqueado: 429, codigo_incorrecto: 401,
  canal_no_disponible: 409, estado_invalido: 400, correo_no_coincide: 403, proveedor_fallo: 502,
}

export function registrarRutasAcceso(app: FastifyInstance, deps: {
  servicio: ReturnType<typeof crearServicioAcceso>
  sesiones: ReturnType<typeof crearSesiones>
  urlPublica: string
  entorno: 'desarrollo' | 'produccion'
}) {
  const cookieSegura = deps.urlPublica.startsWith('https://')
  const ponerCookie = (reply: FastifyReply, token: string) =>
    reply.setCookie(NOMBRE_COOKIE, token, {
      path: '/', httpOnly: true, sameSite: 'lax', secure: cookieSegura, maxAge: deps.sesiones.segundosCookie,
    })

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ErrorAcceso) {
      return reply.status(ESTADO_HTTP[error.codigo]).send({ error: error.codigo, mensaje: error.message })
    }
    app.log.error(error)
    return reply.status(500).send({ error: 'interno', mensaje: 'Algo falló de nuestro lado. Intenta de nuevo en un momento.' })
  })

  app.post('/api/acceso/identificar', async (req) => deps.servicio.identificar(identificacionDe(req.body)))

  app.post('/api/acceso/enviar-codigo', async (req) => {
    const r = await deps.servicio.enviarCodigo(identificacionDe(req.body), req.ip)
    // El codigo simulado solo sale en desarrollo; en produccion el enviador real nunca lo devuelve.
    return deps.entorno === 'desarrollo' ? r : { pista: r.pista }
  })

  app.post('/api/acceso/verificar-codigo', async (req, reply) => {
    const c = (req.body ?? {}) as Record<string, unknown>
    const { sesion, token } = await deps.servicio.verificarCodigo(identificacionDe(req.body), String(c.codigo ?? '').trim(), req.ip)
    ponerCookie(reply, token)
    return { sesion: publica(sesion) }
  })

  for (const proveedor of PROVEEDORES) {
    app.get(`/api/acceso/${proveedor}`, async (req, reply) => {
      const q = req.query as Record<string, string>
      const url = await deps.servicio.iniciarProveedor(proveedor, identificacionDe({ tipoDocumento: q.tipo, numeroDocumento: q.documento }))
      return reply.redirect(url)
    })
    app.get(`/api/acceso/${proveedor}/retorno`, async (req, reply) => {
      const q = req.query as Record<string, string>
      try {
        const { token } = await deps.servicio.completarProveedor(proveedor, q.state ?? '', q.code ?? '', req.ip)
        ponerCookie(reply, token)
        return reply.redirect(`${deps.urlPublica}/`)
      } catch (error) {
        const codigo = error instanceof ErrorAcceso ? error.codigo : 'proveedor_fallo'
        return reply.redirect(`${deps.urlPublica}/ingreso?error=${codigo}`)
      }
    })
  }

  app.get('/api/sesion', async (req, reply) => {
    const sesion = await deps.sesiones.leer(req.cookies[NOMBRE_COOKIE])
    if (!sesion) return reply.status(401).send({ error: 'sin_sesion' })
    return { sesion: publica(sesion) }
  })

  app.post('/api/salir', async (req, reply) => {
    await deps.sesiones.cerrar(req.cookies[NOMBRE_COOKIE])
    reply.clearCookie(NOMBRE_COOKIE, { path: '/' })
    return { ok: true }
  })
}

/** Lo que la app puede saber de la sesion: nunca el id ni el documento completo. */
function publica(s: { nombre: string; canal: string; copropiedades: unknown; venceEn: string; numeroDocumento: string }) {
  return { nombre: s.nombre, canal: s.canal, copropiedades: s.copropiedades, venceEn: s.venceEn, documento: `••• ${s.numeroDocumento.slice(-3)}` }
}
