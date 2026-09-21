/**
 * Ingreso con Google o Microsoft (OpenID Connect, flujo de codigo de autorizacion).
 *
 * BLOKY no crea cuentas con esto: solo pide al proveedor que confirme **que correo** tiene la
 * persona, y lo compara con el registrado en BOB (RN-164). El id_token se verifica con las
 * llaves publicas del proveedor (jose), nunca se confia en el cuerpo sin firma.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose'

export type Proveedor = 'google' | 'microsoft'

interface ProveedorOidc {
  autorizacion: string
  token: string
  jwks: string
  /** Comprueba el emisor; Microsoft con tenant `common` lo trae por inquilino. */
  emisorValido(iss: string): boolean
  alcance: string
}

const GOOGLE: ProveedorOidc = {
  autorizacion: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  jwks: 'https://www.googleapis.com/oauth2/v3/certs',
  emisorValido: (iss) => iss === 'https://accounts.google.com' || iss === 'accounts.google.com',
  alcance: 'openid email profile',
}

function microsoft(tenant: string): ProveedorOidc {
  return {
    autorizacion: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    token: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    jwks: `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`,
    emisorValido: (iss) => /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]+\/v2\.0$/.test(iss),
    alcance: 'openid email profile',
  }
}

export interface ClienteOidc {
  urlDeAutorizacion(parametros: { estado: string; nonce: string; redireccion: string }): string
  /** Cambia el codigo por el id_token y devuelve el correo verificado, o undefined. */
  correoVerificado(parametros: { codigo: string; nonce: string; redireccion: string }): Promise<string | undefined>
}

export function crearClienteOidc(
  proveedor: Proveedor,
  cfg: { clientId: string; clientSecret: string; tenant?: string },
  fetchFn: typeof fetch = fetch,
): ClienteOidc {
  const p = proveedor === 'google' ? GOOGLE : microsoft(cfg.tenant ?? 'common')
  const llaves = createRemoteJWKSet(new URL(p.jwks))
  return {
    urlDeAutorizacion({ estado, nonce, redireccion }) {
      const q = new URLSearchParams({
        client_id: cfg.clientId, response_type: 'code', scope: p.alcance,
        redirect_uri: redireccion, state: estado, nonce, prompt: 'select_account',
      })
      return `${p.autorizacion}?${q}`
    },
    async correoVerificado({ codigo, nonce, redireccion }) {
      const r = await fetchFn(p.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', code: codigo, redirect_uri: redireccion,
          client_id: cfg.clientId, client_secret: cfg.clientSecret,
        }),
      })
      if (!r.ok) return undefined
      const cuerpo = (await r.json()) as { id_token?: string }
      if (!cuerpo.id_token) return undefined
      const { payload } = await jwtVerify(cuerpo.id_token, llaves, { audience: cfg.clientId })
      if (typeof payload.iss !== 'string' || !p.emisorValido(payload.iss)) return undefined
      if (payload.nonce !== nonce) return undefined
      const correo = (payload.email ?? payload.preferred_username) as string | undefined
      // Google marca si el correo esta verificado; Microsoft no trae la marca y el correo de la
      // cuenta ya lo verifico Microsoft al crearla.
      if (proveedor === 'google' && payload.email_verified !== true) return undefined
      return correo
    },
  }
}
