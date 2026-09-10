/**
 * Capacidades del dispositivo, detras de una interfaz propia (ADR-0002).
 *
 * El ADR-0002 lo dejo escrito antes de que hiciera falta: «las capacidades del
 * dispositivo (camara, push, biometria, compartir) se consumiran a traves de una
 * interfaz propia `servicios/plataforma.ts` con dos implementaciones (web y
 * nativa). Hoy no existe porque ninguna funcionalidad la necesita todavia».
 *
 * El ingreso con huella (Mary, 2026-08-28) es la primera que la necesita, asi que
 * el archivo nace aqui con una sola capacidad. Las pantallas llaman a `biometria`
 * y no saben —ni tienen que saber— si por debajo responde el navegador o el
 * telefono.
 *
 * ## Que es real y que no
 *
 * En la web se usa **WebAuthn**, que es el estandar del navegador para la huella
 * y el rostro: **el lector es de verdad y el dedo tambien**. Lo que no es real,
 * mientras no exista backend, es la **comprobacion**: una credencial WebAuthn se
 * verifica en un servidor con la llave publica que se guardo al registrarla, y
 * aqui no hay servidor. El demo se queda con que el dispositivo confirmo la
 * identidad de su dueno, que es justo lo que se quiere mostrar.
 *
 * Donde no hay WebAuthn —un navegador viejo, o dentro del marco de una pagina
 * incrustada, donde el permiso viene bloqueado— la capacidad se declara **no
 * disponible** y la app no ofrece la opcion. No se simula un lector de huella:
 * fingir que se leyo un dedo es la clase de mentira que despues nadie descubre.
 */

const CLAVE_CREDENCIALES = 'idiky.demo.huellas'

interface Huellas {
  /** personaId -> id de la credencial, en base64url. */
  [personaId: string]: string
}

function leer(): Huellas {
  try {
    const bruto = window.localStorage.getItem(CLAVE_CREDENCIALES)
    return bruto ? (JSON.parse(bruto) as Huellas) : {}
  } catch {
    return {}
  }
}

function guardar(huellas: Huellas): void {
  try {
    window.localStorage.setItem(CLAVE_CREDENCIALES, JSON.stringify(huellas))
  } catch {
    // Modo privado: la huella vale mientras la pestana este abierta.
  }
}

function aBase64url(datos: ArrayBuffer): string {
  const bytes = new Uint8Array(datos)
  let binario = ''
  bytes.forEach((byte) => {
    binario += String.fromCharCode(byte)
  })
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64url(texto: string): ArrayBuffer {
  const relleno = texto.replace(/-/g, '+').replace(/_/g, '/')
  const binario = atob(relleno + '='.repeat((4 - (relleno.length % 4)) % 4))
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
  return bytes.buffer
}

function aleatorio(bytes: number): ArrayBuffer {
  const datos = new Uint8Array(bytes)
  crypto.getRandomValues(datos)
  return datos.buffer
}

/** El `user.id` de WebAuthn es binario; el id de la persona es texto. */
function comoBytes(texto: string): ArrayBuffer {
  const bytes = new Uint8Array(texto.length)
  for (let i = 0; i < texto.length; i += 1) bytes[i] = texto.charCodeAt(i)
  return bytes.buffer
}

export const biometria = {
  /**
   * Si este dispositivo puede leer una huella o un rostro.
   *
   * `isUserVerifyingPlatformAuthenticatorAvailable` pregunta exactamente eso: no
   * si el navegador conoce WebAuthn, sino si **este aparato** tiene lector.
   */
  async disponible(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) return false
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  },

  /** Si esta persona ya dejo su huella registrada en este dispositivo. */
  registrada(personaId: string): boolean {
    return !!leer()[personaId]
  },

  /**
   * Registra la huella de una persona en este dispositivo.
   *
   * Se llama **despues** de que la persona ya probo quien es con su contrasena
   * (CU-R-01) o con el codigo (CU-R-25): la huella no crea la cuenta ni
   * reemplaza la identidad, reemplaza el trabajo de escribir la contrasena en un
   * telefono que ya es suyo.
   */
  async registrar(personaId: string, nombre: string): Promise<boolean> {
    try {
      const credencial = (await navigator.credentials.create({
        publicKey: {
          challenge: aleatorio(32),
          rp: { name: 'Idiky' },
          user: {
            id: comoBytes(personaId),
            name: nombre,
            displayName: nombre,
          },
          // -7 es ECDSA con P-256 y -257 es RSA: entre las dos cubren
          // practicamente cualquier telefono.
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            // `platform`: el lector del propio telefono, no una llave USB.
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null
      if (!credencial) return false
      guardar({ ...leer(), [personaId]: aBase64url(credencial.rawId) })
      return true
    } catch {
      // Cancelo, se acabo el tiempo o el navegador no lo permite aqui.
      return false
    }
  },

  /** Pide la huella para entrar. Devuelve si el dispositivo confirmo. */
  async verificar(personaId: string): Promise<boolean> {
    const guardada = leer()[personaId]
    if (!guardada) return false
    try {
      const credencial = await navigator.credentials.get({
        publicKey: {
          challenge: aleatorio(32),
          allowCredentials: [{ type: 'public-key', id: deBase64url(guardada) }],
          userVerification: 'required',
          timeout: 60_000,
        },
      })
      return !!credencial
    } catch {
      return false
    }
  },

  /** Quita la huella de este dispositivo. */
  olvidar(personaId: string): void {
    const huellas = leer()
    delete huellas[personaId]
    guardar(huellas)
  },

  /** Personas con huella registrada en este dispositivo. */
  registradas(): string[] {
    return Object.keys(leer())
  },
}
