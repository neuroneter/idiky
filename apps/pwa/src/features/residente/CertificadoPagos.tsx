/**
 * CU-R-46 — Descargar el certificado de pagos del año (PN-14).
 * Doc: docs/casos-de-uso/residente.md#cu-r-46
 *
 * Vive en «Mis comprobantes de pago»: es donde la persona busca sus pagos.
 * Elige el año, lo genera y lo descarga en PDF. Los ya emitidos quedan ahí.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { emitirCertificadoPagos } from '../../datos/repositorio'
import { aniosConPagos, decideEnLaUnidad } from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { HojaCertificadoPagos } from '../../componentes/HojaCertificadoPagos'
import { Icono } from '../../componentes/Icono'

/** `viendo` lo controla la página: solo puede haber una hoja montada a la vez (si no, salen dos al descargar). */
export function CertificadoPagos({ viendo, alVer }: { viendo: string | null; alVer: (documentoId: string | null) => void }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const unidadId = sesion?.unidadActivaId ?? ''
  const anios = aniosConPagos(bd.pagos, unidadId)
  const [anio, setAnio] = useState<number | null>(anios[0] ?? null)
  // PN-20 — El certificado lo pide el propietario o el arrendatario.
  if (!sesion || anios.length === 0 || !decideEnLaUnidad(sel.rolEnUnidad(bd, sesion.personaId, unidadId))) return null

  const emitidos = sel.documentosDeUnidad(bd, unidadId).filter((d) => d.tipo === 'certificado_pagos')
  const documento = emitidos.find((d) => d.id === viendo)

  return (
    <div className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
      <strong>Certificado de pagos del año</strong>
      <p className="subtitulo">Lo que pagaste en el año, recibo por recibo. Sirve para la declaración de renta.</p>
      <div className="fila" style={{ justifyContent: 'flex-start' }}>
        <label htmlFor="anio-certificado" className="subtitulo">
          Año
        </label>
        <select id="anio-certificado" value={anio ?? ''} onChange={(e) => setAnio(Number(e.target.value))}>
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          className="boton boton--primario"
          disabled={cargando || !anio}
          onClick={async () => {
            const emitido = await ejecutar(
              (base) => emitirCertificadoPagos(base, { copropiedadId: sesion.copropiedadId, unidadId, anio: anio!, personaId: sesion.personaId }),
              'Certificado listo.',
            )
            if (emitido) alVer(emitido.id)
          }}
        >
          Generar el certificado
        </button>
      </div>

      {emitidos.length > 0 && (
        <div className="lista lista--compacta">
          {emitidos.map((d) => (
            <button key={d.id} className="tarjeta tarjeta--plana tarjeta--accion" aria-pressed={d.id === viendo} onClick={() => alVer(d.id === viendo ? null : d.id)}>
              <div className="fila">
                <span>
                  {d.numero} · año {d.certificadoPagos?.anio}
                </span>
                <span className="subtitulo numerico">{formatearDinero(d.certificadoPagos?.total ?? 0)}</span>
              </div>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                Expedido el {formatearFecha(d.emitidoEn)}
              </span>
            </button>
          ))}
        </div>
      )}

      {documento && (
        <>
          <button className="boton boton--primario boton--bloque" onClick={() => window.print()}>
            <Icono nombre="certificado" tamano={18} />
            Descargar PDF
          </button>
          <div className="previsualizacion-hoja">
            <HojaCertificadoPagos
              documento={documento}
              copropiedad={sel.copropiedad(bd, sesion.copropiedadId)}
              unidad={sel.unidad(bd, unidadId)}
              propietarios={sel.propietariosDeUnidad(bd, unidadId)}
              administrador={sel.administradorDe(bd)}
            />
          </div>
        </>
      )}
    </div>
  )
}
