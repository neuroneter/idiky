/**
 * CU-A-09 — Registrar correspondencia recibida.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-09
 *
 * RN-25: un registro entregado ya no se edita.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { entregarCorrespondencia, registrarCorrespondencia } from '../../datos/repositorio'
import { etiquetaUnidad } from '../../dominio/reglas'
import { capitalizar, formatearFechaHora } from '../../utilidades/formato'
import type { TipoCorrespondencia } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipCorrespondencia } from '../../componentes/Etiquetas'

export function CorrespondenciaAdminPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [creando, setCreando] = useState(false)
  const [entregando, setEntregando] = useState<string | null>(null)
  const [recibidoPor, setRecibidoPor] = useState('')
  const [formulario, setFormulario] = useState({
    unidadId: '',
    tipo: 'paquete' as TipoCorrespondencia,
    remitente: '',
    observaciones: '',
  })

  if (!sesion) return null

  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)
  const registros = sel.correspondenciaDeCopropiedad(bd, sesion.copropiedadId)
  const pendientes = registros.filter((registro) => registro.estado === 'en_porteria')

  async function registrar() {
    const unidadId = formulario.unidadId || unidades[0]?.id
    if (!unidadId || formulario.remitente.trim().length < 2) {
      mostrarAviso('Selecciona la unidad e indica el remitente.', 'error')
      return
    }
    const creado = await ejecutar(
      (base) => registrarCorrespondencia(base, { ...formulario, unidadId }),
      'Correspondencia registrada. El residente ya la ve en su app.',
    )
    if (creado) {
      setCreando(false)
      setFormulario({ unidadId: '', tipo: 'paquete', remitente: '', observaciones: '' })
    }
  }

  async function entregar() {
    if (!entregando || recibidoPor.trim().length < 3) {
      mostrarAviso('Indica quien recibio el envio.', 'error')
      return
    }
    const entregado = await ejecutar(
      (base) => entregarCorrespondencia(base, entregando, recibidoPor.trim()),
      'Entrega registrada.',
    )
    if (entregado) {
      setEntregando(null)
      setRecibidoPor('')
    }
  }

  return (
    <>
      <div className="fila">
        <span className="subtitulo">
          {pendientes.length} envios sin entregar de {registros.length} registrados.
        </span>
        <button className="boton boton--primario" onClick={() => setCreando(true)}>
          <Icono nombre="mas" tamano={15} />
          Registrar envio
        </button>
      </div>

      {registros.length === 0 ? (
        <EstadoVacio titulo="Sin registros" detalle="Registra la correspondencia que llega a porteria." />
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <div className="contenedor-tabla">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Tipo</th>
                  <th>Remitente</th>
                  <th>Recibido</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => {
                  const unidad = sel.unidad(bd, registro.unidadId)
                  const residencia = sel.residenciasDeUnidad(bd, registro.unidadId)[0]
                  return (
                    <tr key={registro.id}>
                      <td>
                        <strong>{unidad && etiquetaUnidad(unidad)}</strong>
                        <div className="subtitulo">
                          {residencia
                            ? nombreCompleto(sel.persona(bd, residencia.personaId))
                            : 'Sin residente'}
                        </div>
                      </td>
                      <td className="suave">{capitalizar(registro.tipo)}</td>
                      <td className="suave">{registro.remitente}</td>
                      <td className="suave">{formatearFechaHora(registro.fechaRecepcion)}</td>
                      <td>
                        <ChipCorrespondencia estado={registro.estado} />
                        {registro.estado === 'entregada' && registro.fechaEntrega && (
                          <div className="subtitulo">
                            a {registro.recibidoPor}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {registro.estado === 'en_porteria' && (
                          <button
                            className="boton boton--pequeno"
                            onClick={() => setEntregando(registro.id)}
                          >
                            Marcar entregado
                          </button>
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

      {creando && (
        <Modal
          titulo="Registrar correspondencia"
          descripcion="El residente vera el aviso en su aplicacion."
          onCerrar={() => setCreando(false)}
        >
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="unidad-correspondencia">Unidad destino</label>
              <select
                id="unidad-correspondencia"
                value={formulario.unidadId || unidades[0]?.id}
                onChange={(evento) =>
                  setFormulario({ ...formulario, unidadId: evento.target.value })
                }
              >
                {unidades.map((unidad) => (
                  <option key={unidad.id} value={unidad.id}>
                    {etiquetaUnidad(unidad)}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="tipo-correspondencia">Tipo</label>
              <select
                id="tipo-correspondencia"
                value={formulario.tipo}
                onChange={(evento) =>
                  setFormulario({
                    ...formulario,
                    tipo: evento.target.value as TipoCorrespondencia,
                  })
                }
              >
                <option value="paquete">Paquete</option>
                <option value="carta">Carta</option>
                <option value="domicilio">Domicilio</option>
              </select>
            </div>
          </div>
          <div className="campo">
            <label htmlFor="remitente">Remitente</label>
            <input
              id="remitente"
              value={formulario.remitente}
              onChange={(evento) =>
                setFormulario({ ...formulario, remitente: evento.target.value })
              }
              placeholder="Ej: tienda en linea"
            />
          </div>
          <div className="campo">
            <label htmlFor="observaciones">Observaciones</label>
            <input
              id="observaciones"
              value={formulario.observaciones}
              onChange={(evento) =>
                setFormulario({ ...formulario, observaciones: evento.target.value })
              }
              placeholder="Ej: caja grande, requiere refrigeracion…"
            />
          </div>
          <button className="boton boton--primario boton--bloque" disabled={cargando} onClick={registrar}>
            Registrar
          </button>
        </Modal>
      )}

      {entregando && (
        <Modal
          titulo="Registrar entrega"
          descripcion="Queda constancia de quien recibio y cuando."
          onCerrar={() => setEntregando(null)}
        >
          <div className="campo">
            <label htmlFor="recibido-por">Recibido por</label>
            <input
              id="recibido-por"
              value={recibidoPor}
              onChange={(evento) => setRecibidoPor(evento.target.value)}
              placeholder="Nombre de quien recoge"
            />
          </div>
          <button className="boton boton--primario boton--bloque" disabled={cargando} onClick={entregar}>
            Confirmar entrega
          </button>
        </Modal>
      )}
    </>
  )
}
