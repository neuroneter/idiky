/**
 * CU-A-06 — Aprobar o rechazar reservas.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-06
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { agregarFotoZona, decidirReserva, editarEspecificacionesZona, quitarFotoZona } from '../../datos/repositorio'
import { MAXIMO_ESPECIFICACIONES, MAXIMO_FOTOS_ZONA, puedeAgregarFotoZona, puntosDeEspecificaciones } from '../../dominio/reglas'
import { CapturaFoto } from '../../componentes/CapturaFoto'
import { FotosZona } from '../../componentes/FotosZona'
import { etiquetaUnidad, hoyISO } from '../../dominio/reglas'
import { formatearFecha } from '../../utilidades/formato'
import { Modal } from '../../componentes/Modal'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipReserva } from '../../componentes/Etiquetas'

type Filtro = 'pendientes' | 'proximas' | 'todas'

export function ReservasAdminPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  /** La zona a la que se le está agregando una foto (RN-104). */
  const [fotoPara, setFotoPara] = useState<string | null>(null)
  /** La zona cuyas especificaciones se están editando, y el texto en curso. */
  const [editando, setEditando] = useState<string | null>(null)
  const [texto, setTexto] = useState('')

  if (!sesion) return null

  const zonas = sel.zonasDe(bd, sesion.copropiedadId)

  const hoy = hoyISO()
  const reservas = sel.reservasDeCopropiedad(bd, sesion.copropiedadId).filter((reserva) => {
    if (filtro === 'pendientes') return reserva.estado === 'solicitada'
    if (filtro === 'proximas') return reserva.fecha >= hoy
    return true
  })

  async function rechazar() {
    if (!rechazando) return
    const decidida = await ejecutar(
      (base) => decidirReserva(base, rechazando, 'rechazada', motivo.trim()),
      'Reserva rechazada.',
    )
    if (decidida) {
      setRechazando(null)
      setMotivo('')
    }
  }

  return (
    <>
      <div className="filtros">
        {(
          [
            ['pendientes', 'Por aprobar'],
            ['proximas', 'Proximas'],
            ['todas', 'Todas'],
          ] as Array<[Filtro, string]>
        ).map(([id, texto]) => (
          <button
            key={id}
            className="filtro"
            aria-pressed={filtro === id}
            onClick={() => setFiltro(id)}
          >
            {texto}
          </button>
        ))}
      </div>

      {reservas.length === 0 ? (
        <EstadoVacio
          titulo="No hay reservas en este filtro"
          detalle="Las solicitudes de los residentes aparecerán aquí."
        />
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <div className="contenedor-tabla">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Zona</th>
                  <th>Unidad</th>
                  <th>Solicitante</th>
                  <th>Fecha</th>
                  <th>Franja</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => {
                  const zona = sel.zona(bd, reserva.zonaId)
                  const unidad = sel.unidad(bd, reserva.unidadId)
                  return (
                    <tr key={reserva.id}>
                      <td>
                        <strong>{zona?.nombre}</strong>
                      </td>
                      <td className="suave">{unidad && etiquetaUnidad(unidad)}</td>
                      <td className="suave">
                        {nombreCompleto(sel.persona(bd, reserva.personaId))}
                      </td>
                      <td className="suave">{formatearFecha(reserva.fecha)}</td>
                      <td className="suave">
                        {reserva.horaInicio} - {reserva.horaFin}
                      </td>
                      <td>
                        <ChipReserva estado={reserva.estado} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {reserva.estado === 'solicitada' && (
                          <div className="grupo-botones" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="boton boton--pequeno boton--primario"
                              disabled={cargando}
                              onClick={() =>
                                ejecutar(
                                  (base) => decidirReserva(base, reserva.id, 'confirmada'),
                                  'Reserva confirmada.',
                                )
                              }
                            >
                              Aprobar
                            </button>
                            <button
                              className="boton boton--pequeno boton--peligro"
                              onClick={() => setRechazando(reserva.id)}
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RN-104 — Las fotos de cada zona, que el residente ve antes de reservar.
          Viven aquí porque todavía no hay pantalla de zonas (CU-A-10, parcial). */}
      <div className="tarjeta">
        <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
          <span className="titulo-seccion">Fotos y especificaciones de las zonas comunes</span>
          <span className="subtitulo">Hasta {MAXIMO_FOTOS_ZONA} fotos por zona · el residente lo ve al reservar</span>
        </div>
        <div className="lista">
          {zonas.map((zona) => (
            <div key={zona.id} className="columna" style={{ gap: 'var(--e2)' }}>
              <div className="fila">
                <strong>{zona.nombre}</strong>
                <button
                  className="boton boton--pequeno"
                  disabled={cargando || !puedeAgregarFotoZona(zona)}
                  onClick={() => setFotoPara(fotoPara === zona.id ? null : zona.id)}
                >
                  {puedeAgregarFotoZona(zona) ? 'Agregar foto' : `Ya tiene ${MAXIMO_FOTOS_ZONA}`}
                </button>
              </div>
              <FotosZona
                fotos={zona.fotos}
                nombre={zona.nombre}
                vacio="Sin fotos todavía: el residente reserva a ciegas."
                alQuitar={(foto) =>
                  void ejecutar(
                    (base) => quitarFotoZona(base, { zonaId: zona.id, adjuntadoEn: foto.adjuntadoEn }),
                    'Foto quitada.',
                  )
                }
              />
              {/* RN-104 — Las especificaciones: qué incluye, qué no, cómo se usa.
                  Un renglón por punto; el residente las lee como lista. */}
              {editando === zona.id ? (
                <div className="campo">
                  <label htmlFor={`especificaciones-${zona.id}`}>Especificaciones generales</label>
                  <textarea
                    id={`especificaciones-${zona.id}`}
                    value={texto}
                    maxLength={MAXIMO_ESPECIFICACIONES}
                    onChange={(evento) => setTexto(evento.target.value)}
                    placeholder={'Un punto por renglón. Por ejemplo:\nIncluye 8 mesas y 40 sillas\nCocineta con nevera y microondas\nSe entrega limpio y se devuelve limpio'}
                    style={{ minHeight: 120 }}
                  />
                  <span className="ayuda-campo">
                    {texto.length} de {MAXIMO_ESPECIFICACIONES} caracteres. Lo que el residente alcanza a leer antes de reservar.
                  </span>
                  <div className="grupo-botones">
                    <button
                      className="boton boton--primario boton--pequeno"
                      disabled={cargando}
                      onClick={() =>
                        void ejecutar(
                          (base) => editarEspecificacionesZona(base, { zonaId: zona.id, especificaciones: texto }),
                          'Especificaciones guardadas. El residente ya las ve al reservar.',
                        ).then((hecho) => {
                          if (hecho) setEditando(null)
                        })
                      }
                    >
                      Guardar
                    </button>
                    <button className="boton boton--pequeno" disabled={cargando} onClick={() => setEditando(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="fila fila-inicio">
                  {puntosDeEspecificaciones(zona).length > 0 ? (
                    <ul className="especificaciones" style={{ flex: 1 }}>
                      {puntosDeEspecificaciones(zona).map((punto, i) => (
                        <li key={i}>{punto}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="subtitulo" style={{ flex: 1 }}>
                      Sin especificaciones: el residente no sabe qué incluye.
                    </span>
                  )}
                  <button
                    className="boton boton--pequeno"
                    disabled={cargando}
                    onClick={() => {
                      setEditando(zona.id)
                      setTexto(zona.especificaciones ?? '')
                    }}
                  >
                    {zona.especificaciones ? 'Editar' : 'Escribir'}
                  </button>
                </div>
              )}
              {fotoPara === zona.id && (
                <CapturaFoto
                  etiqueta={`Nueva foto de ${zona.nombre}`}
                  ayuda="Como la ve quien entra: el salón montado, la terraza de día. Se guarda reducida."
                  valor={null}
                  alCambiar={(imagen) => {
                    if (!imagen) return
                    void ejecutar(
                      (base) => agregarFotoZona(base, { zonaId: zona.id, imagen }),
                      'Foto agregada. El residente ya la ve al reservar.',
                    ).then((hecho) => {
                      if (hecho) setFotoPara(null)
                    })
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {rechazando && (
        <Modal
          titulo="Rechazar reserva"
          descripcion="El residente verá el motivo en su aplicación."
          onCerrar={() => setRechazando(null)}
        >
          <div className="campo">
            <label htmlFor="motivo-rechazo">Motivo</label>
            <textarea
              id="motivo-rechazo"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Ej: la zona está en mantenimiento ese día."
            />
          </div>
          <button className="boton boton--peligro boton--bloque" disabled={cargando} onClick={rechazar}>
            Rechazar reserva
          </button>
        </Modal>
      )}
    </>
  )
}
