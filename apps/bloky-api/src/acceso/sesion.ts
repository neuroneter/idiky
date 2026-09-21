/**
 * La sesion de BLOKY: un registro en el repositorio (para poder revocarla, RN-165) y una
 * cookie httpOnly con un JWT que solo lleva el id. La cookie no es legible por la app: el
 * navegador la manda solo y el servidor la comprueba.
 */
import { randomUUID } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import type { Repositorio } from '../datos/repositorio.js'
import type { AccesoCopropiedad, Canal, Sesion, TipoDocumento } from '../dominio/tipos.js'
import { vencimientoSesion } from '../dominio/reglas.js'

export const NOMBRE_COOKIE = 'bloky_sesion'

export function crearSesiones(repo: Repositorio, secreto: string, horas: number) {
  const llave = new TextEncoder().encode(secreto)
  return {
    async abrir(datos: {
      personaId: string; nombre: string; tipoDocumento: TipoDocumento; numeroDocumento: string
      canal: Canal; copropiedades: AccesoCopropiedad[]
    }): Promise<{ sesion: Sesion; token: string }> {
      const ahora = new Date()
      const sesion: Sesion = {
        id: randomUUID(), ...datos,
        creadaEn: ahora.toISOString(), venceEn: vencimientoSesion(ahora, horas).toISOString(), revocadaEn: null,
      }
      await repo.guardarSesion(sesion)
      const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(sesion.id)
        .setIssuedAt().setExpirationTime(`${horas}h`).sign(llave)
      return { sesion, token }
    },
    /** La sesion viva detras de un token, o undefined si no hay, vencio o se revoco. */
    async leer(token: string | undefined): Promise<Sesion | undefined> {
      if (!token) return undefined
      let id: string | undefined
      try { id = (await jwtVerify(token, llave)).payload.sub } catch { return undefined }
      if (!id) return undefined
      const sesion = await repo.sesion(id)
      if (!sesion || sesion.revocadaEn || sesion.venceEn < new Date().toISOString()) return undefined
      return sesion
    },
    async cerrar(token: string | undefined): Promise<void> {
      const sesion = await this.leer(token)
      if (sesion) await repo.revocarSesion(sesion.id, new Date().toISOString())
    },
    segundosCookie: horas * 3600,
  }
}
