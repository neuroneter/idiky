/**
 * CU-R-17 — Directorio de contactos útiles y emergencias (RN-232, RN-233).
 * Doc: docs/casos-de-uso/residente.md#cu-r-17
 *
 * Las emergencias van primero. Los proveedores solo los ven la administración
 * y el consejo (Mary, 2026-11-12).
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { ListaDirectorio } from '../../componentes/ListaDirectorio'
import { BotonVolver } from '../../componentes/BotonVolver'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function DirectorioPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const contactos = sel.contactosVisibles(bd, sesion.copropiedadId, sesion.personaId, false)
  return (
    <>
      <div className="encabezado-pagina">
        <BotonVolver />
      </div>
      {contactos.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay teléfonos" detalle="La administración los está cargando." />
      ) : (
        <ListaDirectorio contactos={contactos} />
      )}
    </>
  )
}
