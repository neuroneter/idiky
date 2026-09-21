/**
 * CU-B-01 — Ingresar a BLOKY. La orquestacion del caso de uso, sin HTTP: las rutas solo
 * traducen. Doc: docs/casos-de-uso/bloky.md#cu-b-01
 *
 * Precondicion (docs/13 §3): la copropiedad existe en BOB y la persona tiene ahi una
 * asignacion vigente como Administrador o Delegado. BLOKY no crea a nadie.
 */
import { randomBytes } from 'node:crypto'
import type { ClienteBob } from '../bob/cliente.js'
import type { Repositorio } from '../datos/repositorio.js'
import type { AccesoCopropiedad, Canal, PersonaBob, TipoDocumento } from '../dominio/tipos.js'
import {
  MINUTOS_VENTANA_INTENTOS, canalesDisponibles, celularParaCodigo, copropiedadesAccesibles,
  correoCoincide, documentoBloqueado, hoyISO, pistaCelular,
} from '../dominio/reglas.js'
import type { ClienteOidc, Proveedor } from './oidc.js'
import type { crearSesiones } from './sesion.js'
import type { EnviadorCodigos } from './twilio.js'

export class ErrorAcceso extends Error {
  constructor(public codigo: 'no_registrado' | 'sin_acceso' | 'sin_celular' | 'bloqueado' | 'codigo_incorrecto'
    | 'canal_no_disponible' | 'estado_invalido' | 'correo_no_coincide' | 'proveedor_fallo', mensaje: string) {
    super(mensaje)
  }
}

export interface Identificacion { tipoDocumento: TipoDocumento; numeroDocumento: string }

export function crearServicioAcceso(deps: {
  bob: ClienteBob
  repo: Repositorio
  sesiones: ReturnType<typeof crearSesiones>
  codigos: EnviadorCodigos
  oidc: Partial<Record<Proveedor, ClienteOidc>>
  urlPublica: string
  ahora?: () => Date
}) {
  const ahora = deps.ahora ?? (() => new Date())

  /** Busca a la persona en BOB y comprueba que hoy pueda entrar a alguna copropiedad. */
  async function personaConAcceso(id: Identificacion): Promise<{ persona: PersonaBob; copropiedades: AccesoCopropiedad[] }> {
    const persona = await deps.bob.buscarPersona(id.tipoDocumento, id.numeroDocumento.trim())
    if (!persona) throw new ErrorAcceso('no_registrado', 'Ese documento no está registrado en IDIKY. Quien te registra es IDIKY, al crear tu copropiedad.')
    const copropiedades = copropiedadesAccesibles(persona, hoyISO(ahora()))
    if (copropiedades.length === 0) {
      await deps.repo.registrarIntento({ ...id, canal: 'sms', resultado: 'sin_acceso', fecha: ahora().toISOString() })
      throw new ErrorAcceso('sin_acceso', 'Tu registro existe, pero hoy no tienes una copropiedad activa a tu cargo. Escribe a operaciones@idiky.com.')
    }
    return { persona, copropiedades }
  }

  async function comprobarBloqueo(id: Identificacion): Promise<void> {
    const desde = new Date(ahora().getTime() - MINUTOS_VENTANA_INTENTOS * 60_000).toISOString()
    const fallidos = await deps.repo.intentosFallidosDesde(id.tipoDocumento, id.numeroDocumento, desde)
    if (documentoBloqueado(fallidos)) {
      throw new ErrorAcceso('bloqueado', `Demasiados intentos. Espera ${MINUTOS_VENTANA_INTENTOS} minutos y vuelve a intentarlo.`)
    }
  }

  return {
    /** Paso 1: quien es y por donde puede entrar. */
    async identificar(id: Identificacion) {
      const { persona, copropiedades } = await personaConAcceso(id)
      const canales = canalesDisponibles(persona, { google: !!deps.oidc.google, microsoft: !!deps.oidc.microsoft })
      if (canales.length === 0) throw new ErrorAcceso('canal_no_disponible', 'Tu registro no tiene celular ni correo utilizables. Escribe a operaciones@idiky.com.')
      return { nombre: persona.nombre, canales, copropiedades }
    },

    /** Paso 2a: el codigo va al celular de BOB (RN-163). */
    async enviarCodigo(id: Identificacion, ip?: string) {
      await comprobarBloqueo(id)
      const { persona } = await personaConAcceso(id)
      const celular = celularParaCodigo(persona.celular)
      if (!celular) throw new ErrorAcceso('sin_celular', 'El celular registrado no sirve para enviar el código. Escribe a operaciones@idiky.com.')
      const { codigoSimulado } = await deps.codigos.enviar(celular)
      await deps.repo.registrarIntento({ ...id, canal: 'sms', resultado: 'codigo_enviado', ip, fecha: ahora().toISOString() })
      return { pista: pistaCelular(persona.celular), codigoSimulado }
    },

    /** Paso 3a: el codigo prueba que ese celular esta en manos de la persona. */
    async verificarCodigo(id: Identificacion, codigo: string, ip?: string) {
      await comprobarBloqueo(id)
      const { persona, copropiedades } = await personaConAcceso(id)
      const celular = celularParaCodigo(persona.celular)
      const correcto = !!celular && /^\d{4,8}$/.test(codigo) && (await deps.codigos.verificar(celular, codigo))
      await deps.repo.registrarIntento({ ...id, canal: 'sms', resultado: correcto ? 'codigo_correcto' : 'codigo_incorrecto', ip, fecha: ahora().toISOString() })
      if (!correcto) throw new ErrorAcceso('codigo_incorrecto', 'El código no es correcto o ya venció.')
      return deps.sesiones.abrir({ personaId: persona.id, nombre: persona.nombre, ...id, canal: 'sms', copropiedades })
    },

    /** Paso 2b: a donde mandar a la persona para que Google o Microsoft confirmen su correo. */
    async iniciarProveedor(proveedor: Proveedor, id: Identificacion): Promise<string> {
      const cliente = deps.oidc[proveedor]
      if (!cliente) throw new ErrorAcceso('canal_no_disponible', 'Ese proveedor no está configurado en este entorno.')
      await personaConAcceso(id)
      const estado = randomBytes(24).toString('base64url')
      const nonce = randomBytes(24).toString('base64url')
      await deps.repo.guardarEstadoOauth({ estado, proveedor, ...id, nonce, creadoEn: ahora().toISOString() })
      return cliente.urlDeAutorizacion({ estado, nonce, redireccion: redireccion(proveedor) })
    },

    /** Paso 3b: el proveedor devolvio un codigo; se cambia por el correo y se compara con BOB (RN-164). */
    async completarProveedor(proveedor: Proveedor, estado: string, codigo: string, ip?: string) {
      const cliente = deps.oidc[proveedor]
      const guardado = await deps.repo.consumirEstadoOauth(estado)
      if (!cliente || !guardado || guardado.proveedor !== proveedor) throw new ErrorAcceso('estado_invalido', 'El ingreso caducó. Vuelve a empezar.')
      if (guardado.creadoEn < new Date(ahora().getTime() - 10 * 60_000).toISOString()) throw new ErrorAcceso('estado_invalido', 'El ingreso caducó. Vuelve a empezar.')
      const id: Identificacion = { tipoDocumento: guardado.tipoDocumento, numeroDocumento: guardado.numeroDocumento }
      const { persona, copropiedades } = await personaConAcceso(id)
      const correo = await cliente.correoVerificado({ codigo, nonce: guardado.nonce, redireccion: redireccion(proveedor) })
      if (correo === undefined) throw new ErrorAcceso('proveedor_fallo', 'No se pudo confirmar tu cuenta con el proveedor. Intenta de nuevo.')
      const coincide = correoCoincide(persona.correo, correo)
      await deps.repo.registrarIntento({ ...id, canal: proveedor, resultado: coincide ? 'proveedor_ok' : 'correo_no_coincide', ip, fecha: ahora().toISOString() })
      if (!coincide) throw new ErrorAcceso('correo_no_coincide', 'La cuenta con la que entraste no es el correo registrado en IDIKY.')
      return deps.sesiones.abrir({ personaId: persona.id, nombre: persona.nombre, ...id, canal: proveedor as Canal, copropiedades })
    },
  }

  function redireccion(proveedor: Proveedor): string {
    return `${deps.urlPublica}/api/acceso/${proveedor}/retorno`
  }
}
