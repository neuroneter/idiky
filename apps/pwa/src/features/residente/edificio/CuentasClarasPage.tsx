/**
 * CU-R-37 — Ver las cuentas claras del edificio (PN-03).
 * Doc: docs/casos-de-uso/residente.md#cu-r-37
 *
 * En lenguaje de propietario: cuánto entró, en qué se gastó y cuánto hay en el
 * fondo. Es lo que más confianza da en una copropiedad.
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import { informesVigentes, totalGastos } from '../../../dominio/reglas'
import { formatearDinero, formatearPeriodo } from '../../../utilidades/formato'
import { BotonVolver } from '../../../componentes/BotonVolver'
import { EstadoVacio } from '../../../componentes/EstadoVacio'

export function CuentasClarasPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const informes = sesion ? informesVigentes(bd.informesMensuales ?? [], sesion.copropiedadId) : []
  const [periodo, setPeriodo] = useState<string | null>(null)
  if (!sesion) return null
  const informe = informes.find((i) => i.periodo === periodo) ?? informes[0]

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver a="/app/edificio" texto="Tu edificio" />
        <h1 className="titulo">Cuentas claras</h1>
      </div>
      {!informe ? (
        <EstadoVacio titulo="Todavía no hay cuentas publicadas" detalle="Cuando la administración publique el mes, lo verás aquí." />
      ) : (
        <>
          {informes.length > 1 && (
            <div className="filtros">
              {informes.map((i) => (
                <button key={i.id} className="filtro" aria-pressed={i.id === informe.id} onClick={() => setPeriodo(i.periodo)}>
                  {formatearPeriodo(i.periodo)}
                </button>
              ))}
            </div>
          )}
          <div className="tarjeta columna" style={{ gap: 'var(--e3)' }}>
            <span className="titulo-seccion">{formatearPeriodo(informe.periodo)}</span>
            <div className="fila">
              <span className="subtitulo">Entró</span>
              <strong className="numerico">{formatearDinero(informe.ingresos)}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Se gastó</span>
              <strong className="numerico">{formatearDinero(totalGastos(informe))}</strong>
            </div>
            <div className="separador" />
            <span className="titulo-seccion">En qué se gastó</span>
            {informe.gastos.map((g) => {
              const parte = totalGastos(informe) > 0 ? Math.round((g.valor / totalGastos(informe)) * 100) : 0
              return (
                <div key={g.rubro} className="columna" style={{ gap: 'var(--e1)' }}>
                  <div className="fila">
                    <span>{g.rubro}</span>
                    <span className="numerico">{formatearDinero(g.valor)}</span>
                  </div>
                  <div className="medidor" aria-label={`${g.rubro}: ${parte} %`}>
                    <div className="medidor__relleno" style={{ width: `${parte}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="separador" />
            <div className="fila">
              <span className="subtitulo">Fondo de imprevistos</span>
              <strong className="numerico">{formatearDinero(informe.saldoFondo)}</strong>
            </div>
            {informe.nota && <p className="subtitulo">{informe.nota}</p>}
          </div>
          <p className="subtitulo">
            Es un resumen. El detalle está en los estados financieros que se presentan en la asamblea.
          </p>
        </>
      )}
    </div>
  )
}
