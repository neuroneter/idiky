/**
 * CU-A-02 — Administrar unidades y residentes.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-02
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { desvincularResidente } from '../../datos/repositorio'
import {
  calcularSaldo,
  diasDeMora,
  estaEnMora,
  etiquetaUnidad,
  sumaCoeficientes,
} from '../../dominio/reglas'
import { capitalizar, formatearDinero } from '../../utilidades/formato'
import type { MotivoCierreVinculo, Residencia } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function UnidadesPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [busqueda, setBusqueda] = useState('')
  const [detalle, setDetalle] = useState<string | null>(null)
  /** El vínculo que se está inhabilitando, con su motivo (RN-65). */
  const [cerrando, setCerrando] = useState<Residencia | null>(null)
  const [motivo, setMotivo] = useState<MotivoCierreVinculo>('otro')
  const [explicacion, setExplicacion] = useState('')
  const navegar = useNavigate()
  if (!sesion) return null

  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)
  const termino = busqueda.trim().toLowerCase()

  const visibles = unidades.filter((unidad) => {
    if (!termino) return true
    const residentes = sel
      .residenciasDeUnidad(bd, unidad.id)
      .map((residencia) => nombreCompleto(sel.persona(bd, residencia.personaId)).toLowerCase())
      .join(' ')
    return (
      `${unidad.torre} ${unidad.numero}`.toLowerCase().includes(termino) ||
      residentes.includes(termino)
    )
  })

  const unidadDetalle = unidades.find((unidad) => unidad.id === detalle)

  async function inhabilitar() {
    if (!cerrando) return
    const unidadId = cerrando.unidadId
    const quedaOtroPropietario = sel
      .residenciasDeUnidad(bd, unidadId)
      .some((r) => r.id !== cerrando.id && r.rol === 'propietario')
    const hecho = await ejecutar(
      (base) =>
        desvincularResidente(base, {
          residenciaId: cerrando.id,
          personaId: sesion!.personaId,
          motivo,
          detalle: explicacion,
        }),
      motivo === 'cambio_propietario' ? 'Propietario anterior inhabilitado.' : 'Vínculo cerrado. Queda en el histórico.',
    )
    if (!hecho) return
    setCerrando(null)
    // Cambio de propietario: si la unidad quedó sin dueño, se registra el nuevo
    // de una vez (RN-63). Si queda otro copropietario, el nuevo lo registra él.
    if (motivo === 'cambio_propietario' && !quedaOtroPropietario) {
      navegar(`/admin/registros?unidad=${unidadId}`)
    } else if (motivo === 'cambio_propietario') {
      mostrarAviso('La unidad todavía tiene otro propietario. Si también vendió, inhabilítalo con el mismo motivo y registrarás al nuevo.', 'info')
    }
  }
  const coeficienteTotal = sumaCoeficientes(unidades)


  return (
    <>
      <div className="fila">
        <div className="campo" style={{ flex: 1, marginBottom: 0, maxWidth: 380 }}>
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por torre, número o residente…"
            aria-label="Buscar unidad"
          />
        </div>
        <span className="subtitulo">
          {unidades.length} unidades · coeficiente total {coeficienteTotal}%
        </span>
      </div>

      <div className="tarjeta" style={{ padding: 0 }}>
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Tipo</th>
                <th className="numerico">Area</th>
                <th className="numerico">Coef.</th>
                <th>Residentes</th>
                <th className="numerico">Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((unidad) => {
                const cuotas = sel.cuotasDeUnidad(bd, unidad.id)
                const saldo = calcularSaldo(cuotas)
                const mora = estaEnMora(cuotas)
                const residentes = sel.residenciasDeUnidad(bd, unidad.id)
                return (
                  <tr
                    key={unidad.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setDetalle(unidad.id)}
                  >
                    <td>
                      <strong>{etiquetaUnidad(unidad)}</strong>
                    </td>
                    <td className="suave">{capitalizar(unidad.tipo)}</td>
                    <td className="numerico suave">{unidad.area} m²</td>
                    <td className="numerico suave">{unidad.coeficiente}%</td>
                    <td className="suave">
                      {residentes.length === 0
                        ? 'Sin registrar'
                        : nombreCompleto(sel.persona(bd, residentes[0].personaId)) +
                          (residentes.length > 1 ? ` +${residentes.length - 1}` : '')}
                    </td>
                    <td className="numerico">{formatearDinero(saldo)}</td>
                    <td>
                      {mora ? (
                        <span className="chip chip--error">
                          {diasDeMora(cuotas)} dias de mora
                        </span>
                      ) : (
                        <span className="chip chip--exito">Al dia</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {visibles.length === 0 && (
          <EstadoVacio titulo="Sin resultados" detalle="Ajusta la busqueda." />
        )}
      </div>

      {unidadDetalle && (
        <Modal
          titulo={etiquetaUnidad(unidadDetalle)}
          descripcion={`${capitalizar(unidadDetalle.tipo)} de ${unidadDetalle.area} m² · coeficiente ${unidadDetalle.coeficiente}%`}
          onCerrar={() => {
            setDetalle(null)
            setCerrando(null)
          }}
        >
          <div className="pila">
            <div>
              <span className="titulo-seccion">Cartera</span>
              <div className="fila" style={{ marginTop: 'var(--e2)' }}>
                <span className="subtitulo">Saldo pendiente</span>
                <strong className="numerico">
                  {formatearDinero(calcularSaldo(sel.cuotasDeUnidad(bd, unidadDetalle.id)))}
                </strong>
              </div>
              <div className="fila">
                <span className="subtitulo">Parqueaderos</span>
                <span>{unidadDetalle.parqueaderos.join(', ') || 'Ninguno'}</span>
              </div>
            </div>

            <div>
              <div className="fila">
                <span className="titulo-seccion">Residentes</span>
                {/* RN-63 — Aquí no se crea a nadie: el propietario se registra en
                    Registros, con sus soportes, y él registra a los demás. */}
                {!sel.unidadTienePropietario(bd, unidadDetalle.id) && (
                <Link to={`/admin/registros?unidad=${unidadDetalle.id}`} className="boton boton--pequeno">
                  <Icono nombre="mas" tamano={13} />
                  Registrar propietario
                </Link>
                )}
              </div>
              <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
                {sel.residenciasDeUnidad(bd, unidadDetalle.id).map((residencia) => {
                  const persona = sel.persona(bd, residencia.personaId)
                  return (
                    <div key={residencia.id} className="fila">
                      <div className="columna">
                        <strong style={{ fontSize: 'var(--texto-sm)' }}>
                          {nombreCompleto(persona)}
                        </strong>
                        <span className="subtitulo">
                          {capitalizar(residencia.rol)} · {persona?.telefono}
                        </span>
                      </div>
                      {/* La administracion puede inhabilitar cualquier vinculo de
                          la copropiedad, incluido el que registro un propietario:
                          esta por encima suyo en la cadena (RN-65). */}
                      <button
                        className="boton boton--pequeno"
                        disabled={cargando}
                        onClick={() => {
                          setCerrando(residencia)
                          setMotivo(residencia.rol === 'propietario' ? 'cambio_propietario' : 'otro')
                          setExplicacion('')
                        }}
                      >
                        Inhabilitar
                      </button>
                    </div>
                  )
                })}
                {sel.residenciasDeUnidad(bd, unidadDetalle.id).length === 0 && (
                  <EstadoVacio titulo="Sin residentes vinculados" />
                )}
              </div>
            </div>

            {cerrando && (
              <div className="tarjeta tarjeta--plana">
                <span className="titulo-seccion">
                  Inhabilitar a {nombreCompleto(sel.persona(bd, cerrando.personaId))}
                </span>
                {cerrando.rol === 'propietario' && (
                  <div className="campo" style={{ marginTop: 'var(--e3)' }}>
                    <label htmlFor="motivo-cierre">Motivo</label>
                    <select
                      id="motivo-cierre"
                      value={motivo}
                      onChange={(evento) => setMotivo(evento.target.value as MotivoCierreVinculo)}
                    >
                      <option value="cambio_propietario">Cambio de propietario (se vendió la unidad)</option>
                      <option value="otro">Otro motivo</option>
                    </select>
                  </div>
                )}
                {motivo === 'cambio_propietario' && (
                  <p className="subtitulo">
                    Después de inhabilitarlo vas a registrar al nuevo propietario de esta unidad.
                  </p>
                )}
                <div className="campo">
                  <label htmlFor="detalle-cierre">Explicación (opcional)</label>
                  <textarea
                    id="detalle-cierre"
                    value={explicacion}
                    onChange={(evento) => setExplicacion(evento.target.value)}
                    placeholder={motivo === 'cambio_propietario' ? 'Ej: escritura 1234 de la Notaría 5' : 'Ej: se mudó'}
                  />
                </div>
                <div className="grupo-botones">
                  <button className="boton boton--peligro" disabled={cargando} onClick={() => void inhabilitar()}>
                    {motivo === 'cambio_propietario' ? 'Inhabilitar y registrar al nuevo' : 'Inhabilitar'}
                  </button>
                  <button className="boton" onClick={() => setCerrando(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
