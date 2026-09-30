/**
 * CU-A-30 — Ver y descargar el informe de uso de las zonas comunes.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-30
 *
 * «Me gusta la idea del informe del uso de las zonas comunes» (Mary,
 * 2026-10-01). Para el consejo y la asamblea: cuánto se usa cada zona, quién
 * no llegó, cuánto se cobró y cuánto se recaudó, en un periodo. Se descarga
 * para Excel. Cuenta lo que ya está registrado (`informeDeUsoDeZonas`).
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import {
  etiquetaUnidad,
  fechaCorta,
  hoyISO,
  informeDeUsoDeZonas,
  sumarDias,
  unidadesQueMasReservan,
  type FilaInformeZona,
} from '../../dominio/reglas'
import { formatearDinero } from '../../utilidades/formato'
import { descargarCsv } from '../../utilidades/descarga'
import { EstadoVacio } from '../../componentes/EstadoVacio'

type Periodo = 'este_mes' | 'mes_anterior' | 'otro'

function rangoDe(periodo: Periodo, hoy: string): { desde: string; hasta: string } {
  const primeroDeEsteMes = `${hoy.slice(0, 7)}-01`
  if (periodo === 'mes_anterior') {
    const ultimoDelAnterior = sumarDias(primeroDeEsteMes, -1)
    return { desde: `${ultimoDelAnterior.slice(0, 7)}-01`, hasta: ultimoDelAnterior }
  }
  // Este mes, completo: incluye las reservas que ya están tomadas para los próximos días.
  const primeroDelSiguiente = `${sumarDias(primeroDeEsteMes, 32).slice(0, 7)}-01`
  return { desde: primeroDeEsteMes, hasta: sumarDias(primeroDelSiguiente, -1) }
}

function porcentaje(parte: number, total: number): string {
  return total > 0 ? `${Math.round((parte / total) * 100)} %` : '—'
}

function sumar(filas: FilaInformeZona[], campo: keyof Omit<FilaInformeZona, 'zona'>): number {
  return filas.reduce((t, f) => t + f[campo], 0)
}

export function InformeZonasPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const hoy = hoyISO()
  const [periodo, setPeriodo] = useState<Periodo>('este_mes')
  const [otro, setOtro] = useState(() => rangoDe('este_mes', hoy))

  if (!sesion) return null

  const { desde, hasta } = periodo === 'otro' ? otro : rangoDe(periodo, hoy)
  const rangoValido = desde && hasta && desde <= hasta
  const zonas = sel.zonasDe(bd, sesion.copropiedadId)
  const filas = rangoValido ? informeDeUsoDeZonas(zonas, bd.reservas, bd.cuotas, desde, hasta) : []
  // Una zona desactivada solo sale si tuvo movimiento en el periodo.
  const visibles = filas.filter((f) => f.zona.activa !== false || f.solicitudes > 0)
  const ranking = rangoValido ? unidadesQueMasReservan(bd.reservas, zonas, desde, hasta) : []

  const total = {
    tomadas: sumar(visibles, 'tomadas'),
    turnos: sumar(visibles, 'turnos'),
    turnosOcupados: sumar(visibles, 'turnosOcupados'),
    personas: sumar(visibles, 'personas'),
    cobrado: sumar(visibles, 'cobrado'),
    recaudado: sumar(visibles, 'recaudado'),
    noSePresento: sumar(visibles, 'noSePresento'),
    usadas: sumar(visibles, 'usadas'),
    depositoRetenido: sumar(visibles, 'depositoRetenido'),
  }

  function descargar() {
    const copropiedad = sel.copropiedad(bd, sesion!.copropiedadId)?.nombre ?? 'Copropiedad'
    descargarCsv(`uso-zonas-comunes-${desde}-a-${hasta}.csv`, [
      [`Informe de uso de las zonas comunes · ${copropiedad}`],
      [`Del ${fechaCorta(desde)} al ${fechaCorta(hasta)} · generado el ${fechaCorta(hoy)}`],
      [],
      [
        'Zona', 'Solicitudes', 'Tomadas', 'Usadas', 'No se presentó', 'Canceladas por el residente',
        'Canceladas fuera de plazo', 'Canceladas por la administración', 'Rechazadas', 'Vencidas sin respuesta',
        'Personas', 'Turnos abiertos', 'Turnos con reserva', 'Ocupación', 'Cobrado por uso', 'Recaudado',
        'Depósito retenido', 'Procesos por multa',
      ],
      ...visibles.map((f) => [
        f.zona.nombre, f.solicitudes, f.tomadas, f.usadas, f.noSePresento, f.canceladasPorResidente,
        f.canceladasFueraDePlazo, f.canceladasPorAdministracion, f.rechazadas, f.vencidas, f.personas,
        f.turnos, f.turnosOcupados, porcentaje(f.turnosOcupados, f.turnos), f.cobrado, f.recaudado,
        f.depositoRetenido, f.procesos,
      ]),
      [],
      ['Unidades que más reservan', 'Reservas tomadas', 'No se presentó'],
      ...ranking.map((u) => {
        const unidad = sel.unidad(bd, u.unidadId)
        return [unidad ? etiquetaUnidad(unidad) : u.unidadId, u.reservas, u.noSePresento]
      }),
    ])
  }

  return (
    <>
      <div className="fila" style={{ flexWrap: 'wrap', gap: 'var(--e3)', marginBottom: 'var(--e3)', alignItems: 'flex-end' }}>
        <div className="fila" style={{ flexWrap: 'wrap', gap: 'var(--e3)', justifyContent: 'flex-start', alignItems: 'flex-end' }}>
          <div className="campo" style={{ marginBottom: 0, minWidth: 180 }}>
            <label htmlFor="informe-periodo">Periodo</label>
            <select id="informe-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
              <option value="este_mes">Este mes</option>
              <option value="mes_anterior">Mes anterior</option>
              <option value="otro">Otras fechas</option>
            </select>
          </div>
          {periodo === 'otro' && (
            <>
              <div className="campo" style={{ marginBottom: 0 }}>
                <label htmlFor="informe-desde">Desde</label>
                <input id="informe-desde" type="date" value={otro.desde} onChange={(e) => setOtro({ ...otro, desde: e.target.value })} />
              </div>
              <div className="campo" style={{ marginBottom: 0 }}>
                <label htmlFor="informe-hasta">Hasta</label>
                <input id="informe-hasta" type="date" value={otro.hasta} onChange={(e) => setOtro({ ...otro, hasta: e.target.value })} />
              </div>
            </>
          )}
        </div>
        <button className="boton boton--primario" disabled={!rangoValido || visibles.length === 0} onClick={descargar}>
          Descargar para Excel
        </button>
      </div>

      {!rangoValido ? (
        <EstadoVacio titulo="Revisa las fechas" detalle="La fecha final va después de la inicial." />
      ) : visibles.length === 0 ? (
        <EstadoVacio titulo="No hay zonas comunes" detalle="Crea una en la pestaña Zonas comunes." />
      ) : (
        <>
          <p className="subtitulo" style={{ marginBottom: 'var(--e3)' }}>
            Del {fechaCorta(desde)} al {fechaCorta(hasta)}.
          </p>

          {/* Las cifras que se preguntan primero en el consejo. */}
          <div className="rejilla-indicadores" style={{ marginBottom: 'var(--e4)' }}>
            <Cifra etiqueta="Reservas tomadas" valor={String(total.tomadas)} detalle={`${total.personas} personas`} />
            <Cifra
              etiqueta="Ocupación"
              valor={porcentaje(total.turnosOcupados, total.turnos)}
              detalle={`${total.turnosOcupados} de ${total.turnos} turnos`}
            />
            <Cifra
              etiqueta="Cobrado por uso"
              valor={formatearDinero(total.cobrado)}
              detalle={`Recaudado ${formatearDinero(total.recaudado)}`}
            />
            <Cifra
              etiqueta="No se presentó"
              valor={String(total.noSePresento)}
              detalle={`de ${total.usadas + total.noSePresento} cerradas · retenido ${formatearDinero(total.depositoRetenido)}`}
            />
          </div>

          <div className="tarjeta" style={{ padding: 0, marginBottom: 'var(--e4)' }}>
            <div className="contenedor-tabla">
              <table className="tabla" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th className="numerico">Tomadas</th>
                    <th className="numerico">Usadas</th>
                    <th className="numerico">No se presentó</th>
                    <th className="numerico">Canceladas</th>
                    <th className="numerico">Rechazadas / vencidas</th>
                    <th className="numerico">Personas</th>
                    <th className="numerico">Ocupación</th>
                    <th className="numerico">Cobrado</th>
                    <th className="numerico">Recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((f) => {
                    const canceladas = f.canceladasPorResidente + f.canceladasFueraDePlazo + f.canceladasPorAdministracion
                    return (
                      <tr key={f.zona.id}>
                        <td>
                          <strong>{f.zona.nombre}</strong>
                          {f.zona.activa === false && <span className="tenue"> · desactivada</span>}
                        </td>
                        <td className="numerico">{f.tomadas}</td>
                        <td className="numerico">{f.usadas}</td>
                        <td className="numerico">{f.noSePresento}</td>
                        <td className="numerico" title={`Residente a tiempo ${f.canceladasPorResidente} · fuera de plazo ${f.canceladasFueraDePlazo} · administración ${f.canceladasPorAdministracion}`}>
                          {canceladas}
                          {f.canceladasFueraDePlazo ? <span className="tenue"> ({f.canceladasFueraDePlazo} tarde)</span> : null}
                        </td>
                        <td className="numerico">
                          {f.rechazadas} / {f.vencidas}
                        </td>
                        <td className="numerico">{f.personas}</td>
                        <td className="numerico">{porcentaje(f.turnosOcupados, f.turnos)}</td>
                        <td className="numerico">{formatearDinero(f.cobrado)}</td>
                        <td className="numerico">{formatearDinero(f.recaudado)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tarjeta">
            <span className="titulo-seccion">Unidades que más reservan</span>
            {ranking.length === 0 ? (
              <p className="subtitulo" style={{ marginTop: 'var(--e2)' }}>Nadie tomó turnos en este periodo.</p>
            ) : (
              <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
                {ranking.map((u) => {
                  const unidad = sel.unidad(bd, u.unidadId)
                  return (
                    <div key={u.unidadId} className="fila">
                      <strong>{unidad ? etiquetaUnidad(unidad) : u.unidadId}</strong>
                      <span className="subtitulo">
                        {u.reservas} {u.reservas === 1 ? 'reserva' : 'reservas'}
                        {u.noSePresento ? ` · ${u.noSePresento} sin presentarse` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

function Cifra({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle: string }) {
  return (
    <div className="tarjeta indicador">
      <span className="indicador__etiqueta">{etiqueta}</span>
      <span className="indicador__valor">{valor}</span>
      <span className="subtitulo">{detalle}</span>
    </div>
  )
}
