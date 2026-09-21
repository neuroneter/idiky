/**
 * Codigos de un solo uso por SMS con Twilio Verify (docs/13 §4, .env.integraciones.example).
 * Se habla con la API REST directamente: no hace falta el SDK para dos peticiones.
 *
 * Sin credenciales, y solo en desarrollo, el envio se simula: el codigo se genera aqui y se
 * devuelve para que quien prueba lo vea. En produccion no existe el modo simulado.
 */
export interface EnviadorCodigos {
  enviar(celularE164: string): Promise<{ codigoSimulado?: string }>
  verificar(celularE164: string, codigo: string): Promise<boolean>
}

export function crearTwilioVerify(
  cfg: { usuario: string; clave: string; verifySid: string },
  fetchFn: typeof fetch = fetch,
): EnviadorCodigos {
  const base = `https://verify.twilio.com/v2/Services/${cfg.verifySid}`
  const cabeceras = {
    Authorization: `Basic ${Buffer.from(`${cfg.usuario}:${cfg.clave}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  return {
    async enviar(celular) {
      const r = await fetchFn(`${base}/Verifications`, {
        method: 'POST', headers: cabeceras,
        body: new URLSearchParams({ To: celular, Channel: 'sms' }),
      })
      if (!r.ok) throw new Error(`Twilio Verify respondio ${r.status} al enviar el codigo`)
      return {}
    },
    async verificar(celular, codigo) {
      const r = await fetchFn(`${base}/VerificationCheck`, {
        method: 'POST', headers: cabeceras,
        body: new URLSearchParams({ To: celular, Code: codigo }),
      })
      // 404: la verificacion ya no existe (vencio o ya se uso). Cuenta como incorrecto.
      if (r.status === 404) return false
      if (!r.ok) throw new Error(`Twilio Verify respondio ${r.status} al comprobar el codigo`)
      const cuerpo = (await r.json()) as { status?: string }
      return cuerpo.status === 'approved'
    },
  }
}

/** Solo desarrollo: un codigo de seis digitos por celular, valido diez minutos. */
export function crearEnviadorSimulado(registro: (mensaje: string) => void = console.log): EnviadorCodigos {
  const codigos = new Map<string, { codigo: string; vence: number }>()
  return {
    async enviar(celular) {
      const codigo = String(Math.floor(100000 + Math.random() * 900000))
      codigos.set(celular, { codigo, vence: Date.now() + 10 * 60_000 })
      registro(`[simulado] codigo ${codigo} para ${celular}`)
      return { codigoSimulado: codigo }
    },
    async verificar(celular, codigo) {
      const guardado = codigos.get(celular)
      if (!guardado || guardado.vence < Date.now()) return false
      if (guardado.codigo !== codigo) return false
      codigos.delete(celular)
      return true
    },
  }
}
