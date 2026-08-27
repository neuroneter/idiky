/**
 * CU-A-02 — Administrar unidades y residentes.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-02
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { desvincularResidente, vincularResidente } from '../../datos/repositorio'
import {
  calcularSaldo,
  diasDeMora,
  estaEnMora,
  etiquetaUnidad,
  sumaCoeficientes,
} from '../../dominio/reglas'
import { capitalizar, formatearDinero } from '../../utilidades/formato'
import type { RolResidencia } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function UnidadesPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [busqueda, setBusqueda] = useState('')
  const [detalle, setDetalle] = useState<string | null>(null)
  const [vinculando, setVinculando] = useState(false)
  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    documento: '',
    email: '',
    telefono: '',
    rol: 'arrendatario' as RolResidencia,
  })

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
  const coeficienteTotal = sumaCoeficientes(unidades)

  async function guardarVinculo() {
    if (!unidadDetalle) return
    if (formulario.nombres.trim().length < 2 || formulario.documento.trim().length < 4) {
      mostrarAviso('Nombre y documento son obligatorios.', 'error')
      return
    }
    const creado = await ejecutar(
      (base) => vincularResidente(base, { unidadId: unidadDetalle.id, ...formulario }),
      'Residente vinculado a la unidad.',
    )
    if (creado) {
      setVinculando(false)
      setFormulario({
        nombres: '',
        apellidos: '',
        documento: '',
        email: '',
        telefono: '',
        rol: 'arrendatario',
      })
    }
  }

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
            setVinculando(false)
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
                <button className="boton boton--pequeno" onClick={() => setVinculando(true)}>
                  <Icono nombre="mas" tamano={13} />
                  Vincular
                </button>
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
                      <button
                        className="boton boton--pequeno"
                        disabled={cargando}
                        onClick={() =>
                          ejecutar(
                            (base) => desvincularResidente(base, residencia.id),
                            'Vinculo cerrado. Queda en el historico.',
                          )
                        }
                      >
                        Desvincular
                      </button>
                    </div>
                  )
                })}
                {sel.residenciasDeUnidad(bd, unidadDetalle.id).length === 0 && (
                  <EstadoVacio titulo="Sin residentes vinculados" />
                )}
              </div>
            </div>

            {vinculando && (
              <div className="tarjeta tarjeta--plana">
                <span className="titulo-seccion">Nuevo residente</span>
                <div className="fila-campos" style={{ marginTop: 'var(--e3)' }}>
                  <div className="campo">
                    <label htmlFor="nombres">Nombres</label>
                    <input
                      id="nombres"
                      value={formulario.nombres}
                      onChange={(evento) =>
                        setFormulario({ ...formulario, nombres: evento.target.value })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="apellidos">Apellidos</label>
                    <input
                      id="apellidos"
                      value={formulario.apellidos}
                      onChange={(evento) =>
                        setFormulario({ ...formulario, apellidos: evento.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="fila-campos">
                  <div className="campo">
                    <label htmlFor="documento">Documento</label>
                    <input
                      id="documento"
                      value={formulario.documento}
                      onChange={(evento) =>
                        setFormulario({ ...formulario, documento: evento.target.value })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="rol">Rol</label>
                    <select
                      id="rol"
                      value={formulario.rol}
                      onChange={(evento) =>
                        setFormulario({ ...formulario, rol: evento.target.value as RolResidencia })
                      }
                    >
                      <option value="propietario">Propietario</option>
                      <option value="arrendatario">Arrendatario</option>
                      <option value="autorizado">Autorizado</option>
                    </select>
                  </div>
                </div>
                <div className="fila-campos">
                  <div className="campo">
                    <label htmlFor="email">Correo</label>
                    <input
                      id="email"
                      type="email"
                      value={formulario.email}
                      onChange={(evento) =>
                        setFormulario({ ...formulario, email: evento.target.value })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      id="telefono"
                      value={formulario.telefono}
                      onChange={(evento) =>
                        setFormulario({ ...formulario, telefono: evento.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grupo-botones">
                  <button
                    className="boton boton--primario"
                    disabled={cargando}
                    onClick={guardarVinculo}
                  >
                    Guardar
                  </button>
                  <button className="boton" onClick={() => setVinculando(false)}>
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
