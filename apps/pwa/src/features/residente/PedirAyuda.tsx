/**
 * CU-R-43 — Pedir ayuda a portería desde la app (PN-09).
 * Doc: docs/casos-de-uso/residente.md#cu-r-43
 *
 * Un aviso urgente que portería ve arriba de su pantalla. No reemplaza al 123:
 * se dice siempre. Mientras portería no lo atiende, el residente ve en qué va.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import { pedirAyuda } from '../../datos/repositorio'
import { TEXTO_TIPO_AYUDA } from '../../dominio/reglas'
import type { TipoAyuda } from '../../dominio/tipos'
import { formatearFechaHora } from '../../utilidades/formato'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'

export function PedirAyuda() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoAyuda>('salud')
  const [detalle, setDetalle] = useState('')
  if (!sesion?.unidadActivaId) return null
  const unidadId = sesion.unidadActivaId
  const enCurso = (bd.alertasAyuda ?? []).find((a) => a.unidadId === unidadId && !a.atendida)
  const ultimaAtendida = (bd.alertasAyuda ?? []).find((a) => a.unidadId === unidadId && a.atendida)

  if (enCurso) {
    return (
      <div className="tarjeta tarjeta--alerta columna" role="status" style={{ gap: 'var(--e1)' }}>
        <strong>{enCurso.vista ? 'Portería ya vio tu pedido y va en camino' : 'Tu pedido de ayuda llegó a portería'}</strong>
        <span className="subtitulo">
          {TEXTO_TIPO_AYUDA[enCurso.tipo]} · {formatearFechaHora(enCurso.creadaEn)}. Si es grave, llama también al{' '}
          <a href="tel:123">123</a>.
        </span>
      </div>
    )
  }

  return (
    <>
      <button className="boton boton--peligro boton--bloque" onClick={() => setAbierto(true)}>
        <Icono nombre="alerta" tamano={18} />
        Pedir ayuda a portería
      </button>
      {ultimaAtendida?.atendida?.nota && (
        <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
          Tu último pedido quedó atendido: {ultimaAtendida.atendida.nota}
        </span>
      )}
      {abierto && (
        <Modal titulo="Pedir ayuda a portería" descripcion="Portería lo ve de inmediato en su pantalla." onCerrar={() => setAbierto(false)}>
          <div className="lista lista--compacta">
            {(Object.keys(TEXTO_TIPO_AYUDA) as TipoAyuda[]).map((t) => (
              <button key={t} className="opcion-categoria" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
                <strong>{TEXTO_TIPO_AYUDA[t]}</strong>
              </button>
            ))}
          </div>
          <div className="campo" style={{ marginTop: 'var(--e3)' }}>
            <label htmlFor="detalle-ayuda">Algo más (opcional)</label>
            <input id="detalle-ayuda" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Mi papá se cayó en el baño" />
          </div>
          <p className="acceso__nota">Si es una emergencia grave, llama también al <a href="tel:123">123</a>.</p>
          <button
            className="boton boton--peligro boton--bloque"
            style={{ marginTop: 'var(--e3)' }}
            disabled={cargando}
            onClick={async () => {
              const hecho = await ejecutar(
                (base) => pedirAyuda(base, { unidadId, personaId: sesion.personaId, tipo, detalle }),
                'Portería ya recibió tu pedido de ayuda.',
              )
              if (hecho) {
                setAbierto(false)
                setDetalle('')
              }
            }}
          >
            Enviar a portería
          </button>
        </Modal>
      )}
    </>
  )
}
