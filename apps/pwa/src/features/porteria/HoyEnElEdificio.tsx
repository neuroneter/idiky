/**
 * CU-P-01 · PN-10, PN-11 — Lo que portería debe saber hoy: los trasteos
 * aprobados y las obras que trabajan, con los trabajadores autorizados.
 */

import { AccionesDeposito, TextoDeposito } from '../../componentes/DepositoTrasteo'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { marcarTrasteoRealizado } from '../../datos/repositorio'
import { etiquetaUnidad, hoyISO, obraTrabajaHoy } from '../../dominio/reglas'

export function HoyEnElEdificio() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const hoy = hoyISO()
  const trasteos = (bd.trasteos ?? []).filter((t) => t.copropiedadId === sesion.copropiedadId && t.fecha === hoy && t.estado === 'aprobado')
  const obras = (bd.permisosObra ?? []).filter((o) => o.copropiedadId === sesion.copropiedadId && obraTrabajaHoy(o, hoy))
  if (trasteos.length === 0 && obras.length === 0) return null
  const ascensor = (id?: string) =>
    sel.copropiedad(bd, sesion.copropiedadId)?.reglasTrasteo?.ascensores?.find((a) => a.id === id)?.nombre

  return (
    <div className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
      <strong>Hoy en el edificio</strong>
      {trasteos.map((t) => {
        const unidad = sel.unidad(bd, t.unidadId)
        return (
          <div key={t.id} className="columna" style={{ gap: 'var(--e1)' }}>
          <div className="fila">
            <span>
              <strong>Trasteo</strong> · {unidad ? etiquetaUnidad(unidad) : ''} {t.sentido === 'llegada' ? 'llega' : 'se va'} de {t.horaInicio} a {t.horaFin}
              {ascensor(t.ascensorId) ? ` · ${ascensor(t.ascensorId)}` : ''}
              {t.empresa ? ` · ${t.empresa}` : ''}
              {t.placa ? ` · ${t.placa}` : ''}
            </span>
            {t.realizado ? (
              <span className="chip chip--exito">Hecho</span>
            ) : (
              <button
                className="boton boton--pequeno"
                disabled={cargando}
                onClick={() => void ejecutar((base) => marcarTrasteoRealizado(base, { trasteoId: t.id, personaId: sesion.personaId }), 'Trasteo marcado como hecho.')}
              >
                Se hizo
              </button>
            )}
          </div>
          <TextoDeposito trasteo={t} />
          <AccionesDeposito trasteo={t} puedeRetener={false} />
          </div>
        )
      })}
      {obras.map((o) => {
        const unidad = sel.unidad(bd, o.unidadId)
        return (
          <div key={o.id} className="columna" style={{ gap: 'var(--e1)' }}>
            <span>
              <strong>Obra</strong> · {unidad ? etiquetaUnidad(unidad) : ''} · {o.descripcion}
            </span>
            <span className="subtitulo">
              Pueden entrar: {o.trabajadores.map((t) => `${t.nombre} (${t.documento})`).join(', ')}
            </span>
          </div>
        )
      })}
    </div>
  )
}
