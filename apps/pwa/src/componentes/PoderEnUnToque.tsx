/**
 * PN-31 — Dar poder con un toque, desde el inicio (CU-R-23; Mary, 2026-11-27).
 * Doc: docs/casos-de-uso/residente.md#cu-r-23
 *
 * Con la asamblea convocada y el plazo abierto (RN-309), al propietario que todavía no ha dado poder
 * le sale la invitación: si no puede ir, que su unidad igual cuente. Le ofrece, con un toque, a quien
 * se lo dio la vez pasada o a quien vive con él; o escribir a otra persona. El tono es de invitación,
 * no de cobro (Mary: cuidar que el propietario no se sienta juzgado).
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { darPoderEnUnToque } from '../datos/repositorio'
import { asistenciaDeUnidad, candidatosApoderado, motivoFueraDePlazoPoder, poderEnCursoDeUnidad, puedeVotar } from '../dominio/reglas'
import { formatearFechaHora } from '../utilidades/formato'

export function PoderEnUnToque() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  if (!sesion?.unidadActivaId) return null
  const unidadId = sesion.unidadActivaId
  if (!puedeVotar(sel.rolEnUnidad(bd, sesion.personaId, unidadId))) return null
  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  // La próxima asamblea convocada en la que todavía se puede dar poder.
  const asamblea = sel
    .asambleasDe(bd, sesion.copropiedadId)
    .filter((a) => a.estado === 'convocada' && !motivoFueraDePlazoPoder(a, copropiedad?.plazoPoderes))
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))[0]
  if (!asamblea) return null
  if (poderEnCursoDeUnidad(bd.poderes, asamblea.id, unidadId)) return null
  if (asistenciaDeUnidad(bd.asistencias, asamblea.id, unidadId)) return null

  const candidatos = candidatosApoderado({ poderes: bd.poderes, residencias: bd.residencias, unidadId, otorgadoPor: sesion.personaId })

  return (
    <div className="tarjeta">
      <strong>¿No puedes ir a la {asamblea.titulo.toLowerCase()}?</strong>
      <p className="subtitulo">
        Es el {formatearFechaHora(asamblea.fechaHora)}. Da tu poder y tu unidad igual cuenta para el quórum y las decisiones.
      </p>
      <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
        {candidatos.map((c) => {
          const persona = sel.persona(bd, c.personaId)
          if (!persona) return null
          return (
            <button
              key={c.personaId}
              className="tarjeta tarjeta--plana tarjeta--accion"
              disabled={cargando}
              onClick={() =>
                void ejecutar(
                  (base) => darPoderEnUnToque(base, { asambleaId: asamblea.id, unidadId, otorgadoPor: sesion.personaId, apoderadoId: c.personaId }),
                  `Listo: le diste tu poder a ${persona.nombres.split(' ')[0]}. Lo ve en su app para aceptarlo.`,
                )
              }
            >
              <div className="fila">
                <span>
                  Dárselo a <strong>{persona.nombres} {persona.apellidos}</strong>
                </span>
                <span className="tenue">{c.motivo === 'la_vez_pasada' ? 'la vez pasada' : 'vive contigo'}</span>
              </div>
            </button>
          )
        })}
        <Link to={`/app/asambleas/${asamblea.id}?dar-poder=1`} className="boton boton--pequeno" style={{ alignSelf: 'flex-start' }}>
          {candidatos.length > 0 ? 'A otra persona' : 'Dar mi poder'}
        </Link>
      </div>
    </div>
  )
}
