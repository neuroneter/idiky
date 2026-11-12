/**
 * CU-P-01, CU-P-02 — El turno de portería y su minuta (RN-234 a RN-237).
 * Doc: docs/casos-de-uso/porteria.md#cu-p-02
 *
 * Abrir el turno, ver quién está adentro y marcar su salida, escribir
 * novedades, reconocer una placa y cerrar el turno dejando la entrega. Sin
 * turno abierto, se ve lo que dejó el anterior.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { abrirTurno, cerrarTurno, registrarNovedad, registrarSalida } from '../../datos/repositorio'
import { etiquetaUnidad } from '../../dominio/reglas'
import { formatearFechaHora } from '../../utilidades/formato'
import { MinutaTurno } from '../../componentes/MinutaTurno'

/** `arriba`: abrir el turno o quién está adentro. `abajo`: placa, novedades, minuta y cierre. */
export function GestionTurno({ parte }: { parte: 'arriba' | 'abajo' }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [novedad, setNovedad] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const [entrega, setEntrega] = useState('')
  const [placa, setPlaca] = useState('')
  if (!sesion) return null

  const turno = sel.turnoAbierto(bd, sesion.copropiedadId)
  const anterior = sel.turnosDe(bd, sesion.copropiedadId).find((t) => t.cerradoEn)
  const adentro = sel.visitantesAdentro(bd, sesion.copropiedadId)
  const placaEncontrada = placa ? sel.quienEsLaPlaca(bd, sesion.copropiedadId, placa) : undefined
  const base = { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId }

  if (!turno) {
    if (parte === 'abajo') return null
    return (
      <div className="pila">
        <div className="tarjeta">
          <strong>No hay un turno abierto</strong>
          <p className="subtitulo">
            Abre tu turno para registrar entradas, salidas y novedades. Todo queda en la minuta, a tu nombre.
          </p>
          <button
            className="boton boton--primario boton--bloque"
            disabled={cargando}
            onClick={() => void ejecutar((b) => abrirTurno(b, base), 'Turno abierto.')}
          >
            Abrir mi turno
          </button>
        </div>
        {anterior && (
          <div className="tarjeta tarjeta--plana">
            <strong>Lo que dejó el turno anterior</strong>
            <div style={{ marginTop: 'var(--e2)' }}>
              <MinutaTurno turno={anterior} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (parte === 'arriba') {
    return (
      <div className="pila">
        {/* RN-235 — Quién está adentro: lo que el turno tiene que poder cerrar. */}
      <div className="pila">
        <span className="titulo-seccion">Adentro ahora</span>
        {adentro.length === 0 ? (
          <p className="subtitulo">No hay visitantes adentro.</p>
        ) : (
          adentro.map((i) => {
            const unidad = sel.unidad(bd, i.unidadId)
            return (
              <div key={i.id} className="tarjeta tarjeta--plana">
                <div className="fila">
                  <div className="columna">
                    <strong>{i.nombre}</strong>
                    <span className="subtitulo">
                      {unidad ? etiquetaUnidad(unidad) : '—'} · {i.forma === 'vehicular' ? `en vehículo ${i.placa}` : 'a pie'} · entró{' '}
                      {formatearFechaHora(i.entradaEn)}
                    </span>
                  </div>
                  <button
                    className="boton boton--pequeno"
                    disabled={cargando}
                    onClick={() => void ejecutar((b) => registrarSalida(b, { ...base, ingresoId: i.id }), `Salida de ${i.nombre} registrada.`)}
                  >
                    Salió
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
      </div>
    )
  }

  return (
    <div className="pila">
      {/* RN-237 — ¿De quién es esta placa? */}
      <div className="tarjeta tarjeta--plana">
        <div className="campo" style={{ marginBottom: 0 }}>
          <label htmlFor="buscar-placa">¿De quién es esta placa?</label>
          <input
            id="buscar-placa"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            placeholder="ABC123"
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        {placaEncontrada && (
          <p className="subtitulo" role="status" style={{ marginTop: 'var(--e2)' }}>
            {placaEncontrada.tipo === 'residente'
              ? `Es de un residente: ${etiquetaUnidad(sel.unidad(bd, placaEncontrada.unidadId)!)}${placaEncontrada.vehiculo.parqueadero ? `, parqueadero ${placaEncontrada.vehiculo.parqueadero}` : ''}.`
              : placaEncontrada.tipo === 'visitante'
                ? `Es de un visitante autorizado hoy: ${placaEncontrada.visitante.nombre}, para ${etiquetaUnidad(sel.unidad(bd, placaEncontrada.unidadId)!)}.`
                : `La placa ${placaEncontrada.placa} no está registrada. Llama a la unidad antes de dejarla entrar.`}
          </p>
        )}
      </div>

      {/* RN-236 — Las novedades del turno. */}
      <div className="tarjeta tarjeta--plana">
        <div className="campo">
          <label htmlFor="novedad">Escribir una novedad</label>
          <textarea
            id="novedad"
            value={novedad}
            onChange={(e) => setNovedad(e.target.value)}
            placeholder="Por ejemplo: se dañó la puerta del parqueadero"
          />
        </div>
        <button
          className="boton"
          disabled={cargando || novedad.trim().length < 5}
          onClick={async () => {
            const hecho = await ejecutar((b) => registrarNovedad(b, { ...base, texto: novedad }), 'Novedad anotada en la minuta.')
            if (hecho) setNovedad('')
          }}
        >
          Anotar en la minuta
        </button>
      </div>

      <div className="tarjeta tarjeta--plana">
        <strong>Minuta de este turno</strong>
        <div style={{ marginTop: 'var(--e2)' }}>
          <MinutaTurno turno={turno} />
        </div>
      </div>

      {/* RN-234 — Cerrar el turno, dejando escrito lo que sigue. */}
      {cerrando ? (
        <div className="tarjeta">
          <div className="campo">
            <label htmlFor="entrega">¿Qué le dejas al siguiente turno? (opcional)</label>
            <textarea id="entrega" value={entrega} onChange={(e) => setEntrega(e.target.value)} />
          </div>
          <div className="grupo-botones">
            <button
              className="boton boton--primario"
              disabled={cargando}
              onClick={async () => {
                const hecho = await ejecutar((b) => cerrarTurno(b, { ...base, entrega }), 'Turno cerrado. La minuta queda guardada.')
                if (hecho) {
                  setCerrando(false)
                  setEntrega('')
                }
              }}
            >
              Cerrar mi turno
            </button>
            <button className="boton" onClick={() => setCerrando(false)}>
              Volver
            </button>
          </div>
        </div>
      ) : (
        <button className="boton boton--bloque" onClick={() => setCerrando(true)}>
          Cerrar turno
        </button>
      )}
    </div>
  )
}
