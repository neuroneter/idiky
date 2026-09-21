/**
 * Cliente de lectura de BOB (el back office en Strapi, ADR-0012) para BLOKY.
 *
 * RN-160 — La identidad viene de BOB: la persona, su celular y su correo, y sus asignaciones
 * por copropiedad. BLOKY los lee por la API REST de Strapi con un token de solo lectura, y
 * **nunca escribe en BOB**. Si manana BOB cambia de motor, cambia solo este archivo.
 */
import type { PersonaBob, TipoDocumento } from '../dominio/tipos.js'

export interface ClienteBob {
  buscarPersona(tipoDocumento: TipoDocumento, numeroDocumento: string): Promise<PersonaBob | undefined>
}

/** Lo que devuelve Strapi 5 para /api/personas con las asignaciones y su copropiedad. */
interface RespuestaStrapi {
  data: Array<{
    documentId: string
    nombre: string
    tipoDocumento: TipoDocumento
    numeroDocumento: string
    celular: string
    correo: string
    asignaciones?: Array<{
      rol: PersonaBob['asignaciones'][number]['rol']
      estado: PersonaBob['asignaciones'][number]['estado']
      desde: string
      hasta?: string | null
      copropiedad?: { documentId: string; nombre: string; estado: PersonaBob['asignaciones'][number]['copropiedad']['estado'] } | null
    }>
  }>
}

export function crearClienteBob(url: string, token: string, fetchFn: typeof fetch = fetch): ClienteBob {
  return {
    async buscarPersona(tipoDocumento, numeroDocumento) {
      const consulta = new URLSearchParams({
        'filters[tipoDocumento][$eq]': tipoDocumento,
        'filters[numeroDocumento][$eq]': numeroDocumento,
        'populate[asignaciones][populate][copropiedad][fields][0]': 'nombre',
        'populate[asignaciones][populate][copropiedad][fields][1]': 'estado',
        'pagination[limit]': '1',
      })
      const respuesta = await fetchFn(`${url}/api/personas?${consulta}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (!respuesta.ok) throw new Error(`BOB respondio ${respuesta.status} al buscar la persona`)
      const cuerpo = (await respuesta.json()) as RespuestaStrapi
      const p = cuerpo.data[0]
      if (!p) return undefined
      return {
        id: p.documentId,
        nombre: p.nombre,
        tipoDocumento: p.tipoDocumento,
        numeroDocumento: p.numeroDocumento,
        celular: p.celular ?? '',
        correo: p.correo ?? '',
        asignaciones: (p.asignaciones ?? [])
          .filter((a) => a.copropiedad)
          .map((a) => ({
            rol: a.rol,
            estado: a.estado,
            desde: a.desde,
            hasta: a.hasta ?? null,
            copropiedad: { id: a.copropiedad!.documentId, nombre: a.copropiedad!.nombre, estado: a.copropiedad!.estado },
          })),
      }
    },
  }
}
