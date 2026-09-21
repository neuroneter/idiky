/** Adaptador en memoria: desarrollo local y pruebas. Se pierde al apagar, a proposito. */
import type { EstadoOauth, IntentoIngreso, Sesion, TipoDocumento } from '../dominio/tipos.js'
import type { Repositorio } from './repositorio.js'

export function crearRepositorioMemoria(): Repositorio {
  const sesiones = new Map<string, Sesion>()
  const intentos: IntentoIngreso[] = []
  const estados = new Map<string, EstadoOauth>()
  return {
    async guardarSesion(s) { sesiones.set(s.id, { ...s }) },
    async sesion(id) { const s = sesiones.get(id); return s ? { ...s } : undefined },
    async revocarSesion(id, cuando) { const s = sesiones.get(id); if (s) s.revocadaEn = cuando },
    async registrarIntento(i) { intentos.push({ ...i }) },
    async intentosFallidosDesde(tipoDocumento: TipoDocumento, numeroDocumento, desde) {
      return intentos.filter((i) =>
        i.tipoDocumento === tipoDocumento && i.numeroDocumento === numeroDocumento
        && i.resultado === 'codigo_incorrecto' && i.fecha >= desde).length
    },
    async guardarEstadoOauth(e) { estados.set(e.estado, { ...e }) },
    async consumirEstadoOauth(estado) { const e = estados.get(estado); estados.delete(estado); return e },
    async cerrar() {},
  }
}
