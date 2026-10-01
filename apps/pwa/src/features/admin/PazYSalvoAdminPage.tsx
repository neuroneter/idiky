/**
 * CU-A-13 — Emitir el paz y salvo desde la consola.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-13
 *
 * El residente ya lo emite desde su app (CU-R-12); esto es para cuando lo pide en
 * la oficina, para una venta, o cuando la administración lo expide de oficio. Se
 * busca la unidad, se ve el saldo antes de emitir y solo se emite en cero
 * (RN-26), con consecutivo y código (RN-36). Un certificado emitido no se borra:
 * se anula con motivo (ADR-0006 §5, O3).
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { anularDocumento, emitirPazYSalvo } from '../../datos/repositorio'
import { calcularSaldo, etiquetaUnidad } from '../../dominio/reglas'
import type { Documento } from '../../dominio/tipos'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { HojaPazYSalvo } from '../../componentes/HojaPazYSalvo'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'

type Filtro = 'todas' | 'al_dia' | 'con_saldo'

export function PazYSalvoAdminPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  /** El certificado que se está mirando para imprimir. */
  const [abierto, setAbierto] = useState<Documento | null>(null)
  const [anulando, setAnulando] = useState<Documento | null>(null)
  const [motivo, setMotivo] = useState('')
  if (!sesion) return null

  const quien = nombreCompleto(sel.persona(bd, sesion.personaId))
  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const administrador = sel.persona(bd, bd.perfilesDemo.find((p) => p.rol === 'admin')?.personaId)
  const propietariosDe = (unidadId: string) =>
    sel
      .residenciasDeUnidad(bd, unidadId)
      .filter((r) => r.rol === 'propietario')
      .map((r) => sel.persona(bd, r.personaId))
      .filter((p): p is NonNullable<typeof p> => !!p)

  const termino = busqueda.trim().toLowerCase()
  const unidades = sel
    .unidadesDe(bd, sesion.copropiedadId)
    .map((unidad) => ({
      unidad,
      saldo: calcularSaldo(sel.cuotasDeUnidad(bd, unidad.id)),
      propietarios: propietariosDe(unidad.id),
      vigente: sel.ultimoPazYSalvo(bd, unidad.id),
    }))
    .filter((u) => (filtro === 'al_dia' ? u.saldo === 0 : filtro === 'con_saldo' ? u.saldo > 0 : true))
    .filter(
      (u) =>
        !termino ||
        etiquetaUnidad(u.unidad).toLowerCase().includes(termino) ||
        u.propietarios.some((p) => nombreCompleto(p).toLowerCase().includes(termino)),
    )

  const ids = new Set(sel.unidadesDe(bd, sesion.copropiedadId).map((u) => u.id))
  const emitidos = bd.documentos
    .filter((d) => d.tipo === 'paz_y_salvo' && ids.has(d.unidadId))
    .sort((a, b) => b.numero.localeCompare(a.numero))

  async function emitir(unidadId: string) {
    const documento = await ejecutar(
      (base) => emitirPazYSalvo(base, { copropiedadId: sesion!.copropiedadId, unidadId, emitidoPor: `${quien} (administración)` }),
      'Paz y salvo emitido. El propietario también lo ve en su app.',
    )
    if (documento) setAbierto(documento)
  }

  const unidadAbierta = abierto ? sel.unidad(bd, abierto.unidadId) : undefined

  return (
    <>
      <div className="fila" style={{ flexWrap: 'wrap', gap: 'var(--e3)', marginBottom: 'var(--e3)', alignItems: 'flex-end' }}>
        <div className="campo" style={{ marginBottom: 0, flex: '1 1 240px' }}>
          <label htmlFor="pys-buscar">Buscar unidad o propietario</label>
          <input id="pys-buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej: 402, Torre 2, Restrepo" />
        </div>
        <div className="filtros">
          {(
            [
              ['todas', 'Todas'],
              ['al_dia', 'Al día'],
              ['con_saldo', 'Con saldo'],
            ] as Array<[Filtro, string]>
          ).map(([id, texto]) => (
            <button key={id} className="filtro" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
              {texto}
            </button>
          ))}
        </div>
      </div>

      <div className="tarjeta" style={{ padding: 0, marginBottom: 'var(--e4)' }}>
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Propietarios</th>
                <th className="numerico">Saldo</th>
                <th>Último paz y salvo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {unidades.map(({ unidad, saldo, propietarios, vigente }) => (
                <tr key={unidad.id}>
                  <td>
                    <strong>{etiquetaUnidad(unidad)}</strong>
                  </td>
                  <td className="suave">{propietarios.map((p) => nombreCompleto(p)).join(', ') || '—'}</td>
                  <td className="numerico">
                    {/* RN-26 — El saldo, antes de emitir. */}
                    {saldo === 0 ? <span className="chip chip--exito">Al día</span> : formatearDinero(saldo)}
                  </td>
                  <td className="suave">{vigente ? `${vigente.numero} · ${formatearFecha(vigente.emitidoEn)}` : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {saldo === 0 ? (
                      <button className="boton boton--pequeno boton--primario" disabled={cargando} onClick={() => void emitir(unidad.id)}>
                        Emitir paz y salvo
                      </button>
                    ) : (
                      // A1 — Con saldo no se emite: se muestra la deuda y se va a verla.
                      <Link to="/admin/cartera" className="boton boton--pequeno">
                        Ver la deuda
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tarjeta">
        <span className="titulo-seccion">Emitidos</span>
        {emitidos.length === 0 ? (
          <p className="subtitulo" style={{ marginTop: 'var(--e2)' }}>Todavía no se ha emitido ningún paz y salvo.</p>
        ) : (
          <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
            {emitidos.map((documento) => {
              const unidad = sel.unidad(bd, documento.unidadId)
              const anulado = documento.estado === 'anulado'
              return (
                <div key={documento.id} className="tarjeta tarjeta--plana">
                  <div className="fila fila-inicio" style={{ flexWrap: 'wrap' }}>
                    <div className="columna" style={{ flex: 1 }}>
                      <strong className="numerico">
                        {documento.numero} · {unidad ? etiquetaUnidad(unidad) : ''}
                      </strong>
                      <span className="subtitulo">
                        Expedido el {formatearFecha(documento.emitidoEn)} · al día hasta el{' '}
                        {formatearFecha(documento.cubiertoHasta ?? documento.emitidoEn)}
                        {documento.emitidoPor ? ` · ${documento.emitidoPor}` : ' · desde la app del propietario'}
                      </span>
                      {anulado && (
                        <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                          Anulado el {formatearFecha((documento.anuladoEn ?? '').slice(0, 10))} por {documento.anuladoPor}. Motivo:{' '}
                          {documento.motivoAnulacion}
                        </span>
                      )}
                    </div>
                    <div className="grupo-botones">
                      {anulado ? (
                        <span className="chip chip--error">Anulado</span>
                      ) : (
                        <>
                          <button className="boton boton--pequeno" onClick={() => setAbierto(abierto?.id === documento.id ? null : documento)}>
                            {abierto?.id === documento.id ? 'Ocultar' : 'Ver'}
                          </button>
                          <button
                            className="boton boton--pequeno boton--peligro"
                            onClick={() => {
                              setAnulando(documento)
                              setMotivo('')
                            }}
                          >
                            Anular
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {abierto && abierto.estado === 'vigente' && (
        <>
          <div className="tarjeta">
            <div className="fila">
              <div className="columna">
                <strong className="numerico">{abierto.numero}</strong>
                <span className="subtitulo">Código de verificación {abierto.codigoVerificacion}</span>
              </div>
              {/* Imprimir es como se obtiene el PDF (ADR-0006). */}
              <button className="boton boton--primario" onClick={() => window.print()}>
                <Icono nombre="certificado" tamano={18} />
                Imprimir o guardar en PDF
              </button>
            </div>
          </div>
          <div className="previsualizacion-hoja">
            <HojaPazYSalvo
              documento={abierto}
              copropiedad={copropiedad}
              unidad={unidadAbierta}
              propietarios={propietariosDe(abierto.unidadId)}
              administrador={administrador}
            />
          </div>
        </>
      )}

      {anulando && (
        <Modal
          titulo={`Anular ${anulando.numero}`}
          descripcion="No se borra: queda anulado con su motivo, y quien presente el papel sabrá que ya no vale."
          onCerrar={() => setAnulando(null)}
        >
          <div className="campo">
            <label htmlFor="pys-motivo">Motivo</label>
            <textarea
              id="pys-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: se aplicó un pago que luego fue rechazado por el banco."
            />
          </div>
          <button
            className="boton boton--peligro boton--bloque"
            disabled={cargando || motivo.trim().length < 10}
            onClick={() =>
              void ejecutar(
                (base) => anularDocumento(base, { documentoId: anulando.id, motivo, anuladoPor: quien }),
                'Paz y salvo anulado.',
              ).then((hecho) => {
                if (hecho) {
                  setAnulando(null)
                  if (abierto?.id === anulando.id) setAbierto(null)
                }
              })
            }
          >
            Anular paz y salvo
          </button>
        </Modal>
      )}
    </>
  )
}
