/**
 * CU-R-09 — Leer comunicados de la cartelera.
 * Doc: docs/casos-de-uso/residente.md#cu-r-09
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { marcarComunicadoLeido } from '../../datos/repositorio'
import { formatearFecha } from '../../utilidades/formato'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipComunicado } from '../../componentes/Etiquetas'

export function ComunicadosPage() {
  const { bd, ejecutar } = useDatos()
  const { sesion } = useSesion()
  const [abierto, setAbierto] = useState<string | null>(null)

  if (!sesion) return null

  const comunicados = sel.comunicadosVigentes(bd, sesion.copropiedadId)

  function alternar(comunicadoId: string) {
    const desplegar = abierto !== comunicadoId
    setAbierto(desplegar ? comunicadoId : null)
    // Abrir un comunicado lo marca como leido para esta persona.
    if (desplegar) {
      void ejecutar((base) => marcarComunicadoLeido(base, comunicadoId, sesion!.personaId))
    }
  }

  if (comunicados.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay comunicados vigentes"
        detalle="Aquí aparecerán los avisos oficiales de la administración."
      />
    )
  }

  return (
    <div className="lista lista--compacta">
      {comunicados.map((comunicado) => {
        const desplegado = abierto === comunicado.id
        const leido = comunicado.leidoPor.includes(sesion.personaId)
        return (
          <button
            key={comunicado.id}
            className="tarjeta tarjeta--accion"
            style={{
              borderLeft: comunicado.categoria === 'urgente'
                ? '3px solid var(--color-error)'
                : undefined,
            }}
            onClick={() => alternar(comunicado.id)}
          >
            <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
              <div className="grupo-botones">
                <ChipComunicado categoria={comunicado.categoria} />
                {comunicado.fijado && <span className="chip">Fijado</span>}
              </div>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {formatearFecha(comunicado.fechaPublicacion)}
              </span>
            </div>

            <strong style={{ display: 'block' }}>{comunicado.titulo}</strong>

            <p
              className="subtitulo"
              style={{
                marginTop: 'var(--e2)',
                display: desplegado ? 'block' : '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {comunicado.cuerpo}
            </p>

            <div className="fila" style={{ marginTop: 'var(--e2)' }}>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {comunicado.autor}
                {comunicado.vigenteHasta && ` · vigente hasta ${formatearFecha(comunicado.vigenteHasta)}`}
              </span>
              {!leido && <span className="chip chip--info">Nuevo</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}
