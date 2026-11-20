/**
 * CU-R-40 — Reportar un daño con foto.
 * Doc: docs/casos-de-uso/residente.md#cu-r-40
 *
 * El atajo de la PQRS para lo más común: «se fundió el bombillo del piso 4».
 * Una foto, dónde está y qué pasa. Entra como petición de mantenimiento, con
 * su radicado y su plazo (RN-12, RN-13), y se sigue como cualquier PQRS.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import { crearPqrs } from '../../datos/repositorio'
import { Modal } from '../../componentes/Modal'
import { CapturaFoto } from '../../componentes/CapturaFoto'

export function ReportarDano({ alCerrar, alCrear }: { alCerrar: () => void; alCrear: (id: string) => void }) {
  const { ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [foto, setFoto] = useState<string | null>(null)
  const [ubicacion, setUbicacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  if (!sesion?.unidadActivaId) return null
  const unidadId = sesion.unidadActivaId
  const listo = ubicacion.trim().length >= 3 && descripcion.trim().length >= 10

  return (
    <Modal titulo="Reportar un daño" descripcion="Una foto y dónde está. La administración lo recibe como petición de mantenimiento." onCerrar={alCerrar}>
      <CapturaFoto etiqueta="Foto del daño" ayuda="Ayuda a que lo arreglen más rápido." valor={foto} alCambiar={setFoto} />
      <div className="campo">
        <label htmlFor="ubicacion-dano">¿Dónde está?</label>
        <input id="ubicacion-dano" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Torre 1, piso 4, pasillo" />
      </div>
      <div className="campo">
        <label htmlFor="descripcion-dano">¿Qué pasa?</label>
        <textarea id="descripcion-dano" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Se fundió el bombillo y el pasillo queda oscuro." />
      </div>
      <button
        className="boton boton--primario boton--bloque"
        disabled={cargando || !listo}
        onClick={async () => {
          const creada = await ejecutar(
            (base) =>
              crearPqrs(base, {
                copropiedadId: sesion.copropiedadId,
                unidadId,
                personaId: sesion.personaId,
                tipo: 'peticion',
                categoria: 'mantenimiento',
                asunto: `Daño en ${ubicacion.trim()}`,
                descripcion: descripcion.trim(),
                ubicacion,
                foto: foto ?? undefined,
              }),
            'Gracias por avisar. Te contamos cuando quede arreglado.',
          )
          if (creada) alCrear(creada.id)
        }}
      >
        Enviar el reporte
      </button>
    </Modal>
  )
}
