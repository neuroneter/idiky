/**
 * CU-R-46 (por la administración) — El certificado de pagos del año para quien
 * lo pide en persona o no usa la app (PN-14). El mismo documento que genera el
 * propietario: numerado, con código y congelado al emitirlo.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { aprobarDocumento, emitirCertificadoPagos } from '../../datos/repositorio'
import { esAdministracionPlena, nivelEn } from '../../dominio/permisos'
import { aniosConPagos, etiquetaUnidad } from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { HojaCertificadoPagos } from '../../componentes/HojaCertificadoPagos'
import { Icono } from '../../componentes/Icono'

export function CertificadosAdminPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const unidades = sesion ? sel.unidadesDe(bd, sesion.copropiedadId) : []
  const [unidadId, setUnidadId] = useState(unidades[0]?.id ?? '')
  const anios = aniosConPagos(bd.pagos, unidadId)
  const [anio, setAnio] = useState<number | null>(null)
  const [viendo, setViendo] = useState<string | null>(null)
  if (!sesion) return null
  // PN-29 — El Auxiliar Administrativo prepara; el administrador o el delegado aprueba.
  const usuario = sel.usuarioDeSesion(bd, sesion)
  const prepara = nivelEn(usuario, 'paz_y_salvo') === 'Prep'
  const aprueba = esAdministracionPlena(usuario)
  const anioElegido = anio && anios.includes(anio) ? anio : anios[0]
  const emitidos = bd.documentos
    .filter((d) => d.tipo === 'certificado_pagos' && d.copropiedadId === sesion.copropiedadId)
    .sort((a, b) => b.numero.localeCompare(a.numero))
  const documento = emitidos.find((d) => d.id === viendo && d.estado !== 'por_aprobar')
  const porAprobar = emitidos.filter((d) => d.estado === 'por_aprobar')

  return (
    <div className="pila">
      <div className="tarjeta">
        <strong>Certificado de pagos del año</strong>
        <p className="subtitulo">Para el propietario que lo pide en persona o no usa la app. Es el mismo que él genera desde su app.</p>
        <div className="fila-campos" style={{ marginTop: 'var(--e3)' }}>
          <div className="campo">
            <label htmlFor="unidad-certificado">Unidad</label>
            <select id="unidad-certificado" value={unidadId} onChange={(e) => { setUnidadId(e.target.value); setAnio(null) }}>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {etiquetaUnidad(u)}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="anio-certificado-admin">Año</label>
            <select id="anio-certificado-admin" value={anioElegido ?? ''} onChange={(e) => setAnio(Number(e.target.value))} disabled={anios.length === 0}>
              {anios.length === 0 && <option value="">Sin pagos</option>}
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="boton boton--primario"
          disabled={cargando || !anioElegido}
          onClick={async () => {
            const emitido = await ejecutar(
              (base) => emitirCertificadoPagos(base, { copropiedadId: sesion.copropiedadId, unidadId, anio: anioElegido!, personaId: sesion.personaId, porAprobar: prepara }),
              prepara ? 'Certificado preparado. Sale cuando lo apruebe el administrador.' : 'Certificado listo.',
            )
            if (emitido && !prepara) setViendo(emitido.id)
          }}
        >
          {prepara ? 'Preparar el certificado' : 'Generar el certificado'}
        </button>
      </div>

      {/* PN-29 — Lo que preparó el auxiliar: lo aprueba el administrador o el delegado. */}
      {porAprobar.length > 0 && (
        <div className="tarjeta tarjeta--alerta">
          <strong>Por aprobar</strong>
          <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
            {porAprobar.map((d) => {
              const u = sel.unidad(bd, d.unidadId)
              return (
                <div key={d.id} className="fila">
                  <span>
                    {u ? etiquetaUnidad(u) : ''} · año {d.certificadoPagos?.anio} · {formatearDinero(d.certificadoPagos?.total ?? 0)}
                  </span>
                  {aprueba ? (
                    <button
                      className="boton boton--pequeno boton--primario"
                      disabled={cargando}
                      onClick={() =>
                        void ejecutar(
                          (base) => aprobarDocumento(base, { documentoId: d.id, personaId: sesion.personaId }),
                          'Certificado aprobado.',
                        )
                      }
                    >
                      Aprobar
                    </button>
                  ) : (
                    <span className="chip chip--alerta">Espera al administrador</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {emitidos.length > 0 && (
        <div className="tarjeta">
          <strong>Emitidos</strong>
          <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
            {emitidos.map((d) => {
              const u = sel.unidad(bd, d.unidadId)
              return (
                <button key={d.id} className="tarjeta tarjeta--plana tarjeta--accion" aria-pressed={d.id === viendo} onClick={() => setViendo(d.id === viendo ? null : d.id)}>
                  <div className="fila">
                    <span>
                      {d.numero} · {u ? etiquetaUnidad(u) : ''} · año {d.certificadoPagos?.anio}
                    </span>
                    <span className="subtitulo numerico">{formatearDinero(d.certificadoPagos?.total ?? 0)}</span>
                  </div>
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    {d.estado === 'por_aprobar' ? 'Por aprobar' : `Expedido el ${formatearFecha(d.emitidoEn)}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {documento && (
        <>
          <button className="boton boton--primario" onClick={() => window.print()}>
            <Icono nombre="certificado" tamano={18} />
            Descargar PDF
          </button>
          <div className="previsualizacion-hoja">
            <HojaCertificadoPagos
              documento={documento}
              copropiedad={sel.copropiedad(bd, sesion.copropiedadId)}
              unidad={sel.unidad(bd, documento.unidadId)}
              propietarios={sel.propietariosDeUnidad(bd, documento.unidadId)}
              administrador={sel.administradorDe(bd)}
            />
          </div>
        </>
      )}
    </div>
  )
}
