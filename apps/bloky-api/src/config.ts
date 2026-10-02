/**
 * Configuracion de la API de BLOKY (ADR-0008). Todo viene del entorno; nada se escribe aqui.
 *
 * En desarrollo (BLOKY_ENTORNO=desarrollo) casi todo es opcional y se simula lo que falte:
 * sin base de datos se usa memoria, sin Twilio el codigo se devuelve en la respuesta, sin
 * Google/Microsoft esos canales no se ofrecen. En produccion nada se simula: si falta algo,
 * el servicio no arranca.
 */
export interface Config {
  entorno: 'desarrollo' | 'produccion'
  host: string
  puerto: number
  /** URL con la que la persona llega a BLOKY (para OAuth y la cookie). */
  urlPublica: string
  jwtSecreto: string
  /** Horas que dura una sesion (RN-165). */
  horasSesion: number
  db: { url?: string }
  bob: { url: string; token: string }
  twilio?: { cuentaSid: string; usuario: string; clave: string; verifySid: string }
  google?: { clientId: string; clientSecret: string }
  yahoo?: { clientId: string; clientSecret: string }
  microsoft?: { clientId: string; clientSecret: string; tenant: string }
}

export function cargarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const leer = (nombre: string, porDefecto?: string): string | undefined => {
    const valor = env[nombre]?.trim()
    return valor ? valor : porDefecto
  }
  const entorno = env.BLOKY_ENTORNO === 'produccion' ? 'produccion' : 'desarrollo'
  const exigir = (nombre: string): string => {
    const valor = leer(nombre)
    if (!valor && entorno === 'produccion') throw new Error(`Falta la variable ${nombre}`)
    return valor ?? ''
  }

  const cuentaSid = leer('TWILIO_ACCOUNT_SID')
  const verifySid = leer('TWILIO_VERIFY_SERVICE_SID')
  const apiKeySid = leer('TWILIO_API_KEY_SID')
  const apiKeySecret = leer('TWILIO_API_KEY_SECRET')
  const authToken = leer('TWILIO_AUTH_TOKEN')
  let twilio: Config['twilio']
  if (cuentaSid && verifySid && (authToken || (apiKeySid && apiKeySecret))) {
    twilio = apiKeySid && apiKeySecret
      ? { cuentaSid, usuario: apiKeySid, clave: apiKeySecret, verifySid }
      : { cuentaSid, usuario: cuentaSid, clave: authToken!, verifySid }
  }

  const googleId = leer('GOOGLE_CLIENT_ID')
  const googleSecret = leer('GOOGLE_CLIENT_SECRET')
  const msId = leer('MICROSOFT_CLIENT_ID')
  const msSecret = leer('MICROSOFT_CLIENT_SECRET')
  const yahooId = leer('YAHOO_CLIENT_ID')
  const yahooSecret = leer('YAHOO_CLIENT_SECRET')

  return {
    entorno,
    host: leer('HOST', '127.0.0.1')!,
    puerto: Number(leer('PORT', '3000')),
    urlPublica: (leer('BLOKY_URL_PUBLICA', 'http://localhost:5173') ?? '').replace(/\/$/, ''),
    jwtSecreto: exigir('BLOKY_JWT_SECRET') || 'secreto-de-desarrollo-no-usar-en-produccion',
    horasSesion: Number(leer('BLOKY_HORAS_SESION', '12')),
    db: { url: leer('BLOKY_DB_URL') },
    bob: { url: (exigir('BOB_URL') || 'http://127.0.0.1:1337').replace(/\/$/, ''), token: exigir('BOB_API_TOKEN') },
    twilio,
    google: googleId && googleSecret ? { clientId: googleId, clientSecret: googleSecret } : undefined,
    microsoft: msId && msSecret
      ? { clientId: msId, clientSecret: msSecret, tenant: leer('MICROSOFT_TENANT_ID', 'common')! }
      : undefined,
    yahoo: yahooId && yahooSecret ? { clientId: yahooId, clientSecret: yahooSecret } : undefined,
  }
}
