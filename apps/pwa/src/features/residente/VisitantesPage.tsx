/**
 * CU-R-10 — Autorizar un visitante y generar su codigo.
 * Doc: docs/casos-de-uso/residente.md#cu-r-10
 *
 * El patron visual del codigo NO es un QR real (ADR-0005).
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { crearVisitante, revocarVisitante } from '../../datos/repositorio'
import { estadoRealVisitante, hoyISO, sumarDias } from '../../dominio/reglas'
import { formatearFecha } from '../../utilidades/formato'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { CodigoVisual } from '../../componentes/CodigoVisual'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipVisitante } from '../../componentes/Etiquetas'

export function VisitantesPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [creando, setCreando] = useState(false)
  const [verCodigo, setVerCodigo] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [documento, setDocumento] = useState('')
  const [placa, setPlaca] = useState('')
  const [desde, setDesde] = useState(hoyISO())
  const [hasta, setHasta] = useState(sumarDias(hoyISO(), 1))

  if (!sesion) return null

  const visitantes = sel.visitantesDeUnidad(bd, sesion.unidadActivaId)
  const visitanteEnDetalle = visitantes.find((visitante) => visitante.id === verCodigo)

  async function autorizar() {
    if (nombre.trim().length < 4) {
      mostrarAviso('Escribe el nombre completo del visitante.', 'error')
      return
    }
    if (hasta < desde) {
      mostrarAviso('La vigencia final no puede ser anterior a la inicial.', 'error')
      return
    }
    const creado = await ejecutar(
      (base) =>
        crearVisitante(base, {
          unidadId: sesion!.unidadActivaId!,
          personaId: sesion!.personaId,
          nombre: nombre.trim(),
          documento: documento.trim(),
          placa: placa.trim() || undefined,
          vigenciaDesde: desde,
          vigenciaHasta: hasta,
          recurrente: false,
        }),
      'Visitante autorizado.',
    )
    if (creado) {
      setCreando(false)
      setNombre('')
      setDocumento('')
      setPlaca('')
      setVerCodigo(creado.id)
    }
  }

  return (
    <>
      <button className="boton boton--primario boton--bloque" onClick={() => setCreando(true)}>
        <Icono nombre="mas" tamano={16} />
        Autorizar visitante
      </button>

      {visitantes.length === 0 ? (
        <EstadoVacio
          titulo="Sin visitantes autorizados"
          detalle="Autoriza a tus visitas para que porteria las deje entrar sin llamarte."
        />
      ) : (
        <div className="lista lista--compacta">
          {visitantes.map((visitante) => {
            const estado = estadoRealVisitante(visitante)
            return (
              <div key={visitante.id} className="tarjeta tarjeta--plana">
                <div className="fila fila-inicio">
                  <div className="columna" style={{ flex: 1 }}>
                    <strong>{visitante.nombre}</strong>
                    <span className="subtitulo">
                      Documento {visitante.documento || 'no registrado'}
                      {visitante.placa && ` · placa ${visitante.placa}`}
                    </span>
                    <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                      {visitante.vigenciaDesde === visitante.vigenciaHasta
                        ? formatearFecha(visitante.vigenciaDesde)
                        : `${formatearFecha(visitante.vigenciaDesde)} a ${formatearFecha(visitante.vigenciaHasta)}`}
                    </span>
                  </div>
                  <div className="columna" style={{ alignItems: 'flex-end', gap: 'var(--e2)' }}>
                    <ChipVisitante estado={estado} />
                    {estado === 'activo' && (
                      <button
                        className="boton boton--pequeno"
                        onClick={() => setVerCodigo(visitante.id)}
                      >
                        Ver codigo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {creando && (
        <Modal
          titulo="Autorizar visitante"
          descripcion="Porteria validara el codigo que generes."
          onCerrar={() => setCreando(false)}
        >
          <div className="campo">
            <label htmlFor="nombre-visitante">Nombre completo</label>
            <input
              id="nombre-visitante"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej: Juan Sebastian Restrepo"
            />
          </div>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="documento-visitante">Documento</label>
              <input
                id="documento-visitante"
                value={documento}
                onChange={(evento) => setDocumento(evento.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="campo">
              <label htmlFor="placa-visitante">Placa (opcional)</label>
              <input
                id="placa-visitante"
                value={placa}
                onChange={(evento) => setPlaca(evento.target.value.toUpperCase())}
                placeholder="ABC123"
              />
            </div>
          </div>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="desde-visitante">Vigente desde</label>
              <input
                id="desde-visitante"
                type="date"
                value={desde}
                min={hoyISO()}
                onChange={(evento) => setDesde(evento.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="hasta-visitante">Hasta</label>
              <input
                id="hasta-visitante"
                type="date"
                value={hasta}
                min={desde}
                onChange={(evento) => setHasta(evento.target.value)}
              />
            </div>
          </div>
          <button className="boton boton--primario boton--bloque" disabled={cargando} onClick={autorizar}>
            Generar codigo de acceso
          </button>
        </Modal>
      )}

      {visitanteEnDetalle && (
        <Modal
          titulo="Codigo de acceso"
          descripcion={`Comparte este codigo con ${visitanteEnDetalle.nombre}.`}
          onCerrar={() => setVerCodigo(null)}
        >
          <div style={{ textAlign: 'center' }}>
            <CodigoVisual codigo={visitanteEnDetalle.codigo} />
            <div className="dato-grande" style={{ marginTop: 'var(--e3)', letterSpacing: '0.06em' }}>
              {visitanteEnDetalle.codigo}
            </div>
            <p className="subtitulo" style={{ marginTop: 'var(--e2)' }}>
              Valido hasta el {formatearFecha(visitanteEnDetalle.vigenciaHasta)}
            </p>
            <p className="ayuda-campo" style={{ marginTop: 'var(--e3)' }}>
              Demo: el patron es ilustrativo, porteria valida el codigo alfanumerico.
            </p>
            {estadoRealVisitante(visitanteEnDetalle) === 'activo' && (
              <button
                className="boton boton--peligro boton--bloque"
                style={{ marginTop: 'var(--e4)' }}
                disabled={cargando}
                onClick={async () => {
                  await ejecutar(
                    (base) => revocarVisitante(base, visitanteEnDetalle.id),
                    'Autorizacion revocada.',
                  )
                  setVerCodigo(null)
                }}
              >
                Revocar autorizacion
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
