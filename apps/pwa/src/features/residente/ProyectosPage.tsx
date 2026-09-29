/**
 * CU-R-32 — Seguir el avance de los proyectos de la copropiedad.
 * Doc: docs/casos-de-uso/residente.md#cu-r-32
 *
 * El tablero del propietario: las obras, en qué van y qué pasó último. Es el
 * mismo tablero que ve la administración (`TableroProyecto`), porque un
 * propietario que pagó la extraordinaria tiene derecho a ver lo mismo que
 * quien la administra, no un resumen.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { ultimoAvance } from '../../dominio/reglas'
import { formatearFechaCorta } from '../../utilidades/formato'
import { BotonVolver } from '../../componentes/BotonVolver'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { Icono } from '../../componentes/Icono'
import { BarraAvance, ChipProyecto, FichaProyecto, HistoriaProyecto } from '../../componentes/TableroProyecto'

export function ProyectosPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const [abierto, setAbierto] = useState<string | null>(null)

  if (!sesion) return null

  const proyectos = sel.proyectosDe(bd, sesion.copropiedadId)

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver />
        <h1 className="titulo">Proyectos de la copropiedad</h1>
      </div>
      <p className="subtitulo">
        Las obras y en qué van. Cada avance te llega por mensaje y queda aquí, con su fecha y su
        foto si la hubo.
      </p>

      {proyectos.length === 0 ? (
        <EstadoVacio
          titulo="No hay proyectos en marcha"
          detalle="Cuando la administración registre una obra, la verás aquí con su avance."
        />
      ) : (
        <div className="lista">
          {proyectos.map((proyecto) => {
            const desplegado = abierto === proyecto.id
            const ultimo = ultimoAvance(proyecto)
            return (
              <div key={proyecto.id} className="tarjeta columna" style={{ gap: 'var(--e3)' }}>
                <div className="fila fila-inicio">
                  <strong>{proyecto.nombre}</strong>
                  <ChipProyecto proyecto={proyecto} />
                </div>
                <BarraAvance proyecto={proyecto} />
                {ultimo && !desplegado && (
                  <span className="subtitulo">
                    {ultimo.titulo} · {formatearFechaCorta(ultimo.fecha)}
                  </span>
                )}
                <button
                  className="boton"
                  onClick={() => setAbierto(desplegado ? null : proyecto.id)}
                >
                  <Icono nombre={desplegado ? 'cerrar' : 'buscar'} tamano={16} />
                  {desplegado ? 'Ocultar la historia' : 'Ver la historia de la obra'}
                </button>
                {desplegado && (
                  <>
                    <p className="subtitulo">{proyecto.descripcion}</p>
                    <FichaProyecto proyecto={proyecto} />
                    <div className="separador" />
                    <HistoriaProyecto proyecto={proyecto} personaDe={(id) => sel.persona(bd, id)} />
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
