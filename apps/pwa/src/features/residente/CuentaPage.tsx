/**
 * CU-R-03 — Consultar estado de cuenta. Desde aqui se descarga (CU-R-18).
 * Doc: docs/casos-de-uso/residente.md#cu-r-03
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import {
  abonadoDeCuota,
  calcularSaldo,
  calcularSaldoVencido,
  cuotaPendiente,
  pendienteDesde,
  estadoRealCuota,
  sancionEnCurso,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha, formatearPeriodo } from '../../utilidades/formato'
import { ChipCuota, ChipPago } from '../../componentes/Etiquetas'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'

type Filtro = 'todas' | 'pendientes' | 'pagadas'

const FILTROS: Array<{ id: Filtro; texto: string }> = [
  { id: 'todas', texto: 'Todas' },
  { id: 'pendientes', texto: 'Por pagar' },
  { id: 'pagadas', texto: 'Pagadas' },
]

export function CuentaPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  if (!sesion) return null

  const cuotas = sel.cuotasDeUnidad(bd, sesion.unidadActivaId)
  const saldo = calcularSaldo(cuotas)
  const vencido = calcularSaldoVencido(cuotas)
  const desde = pendienteDesde(cuotas)
  // Los procesos abiertos NO suman al valor adeudado: una multa se convierte en
  // cuota solo al quedar en firme (RN-39). Se enlazan desde aqui —que es donde
  // la persona viene a ver que debe— justamente para dejar claro que todavia no
  // debe eso (CU-R-29).
  const procesosAbiertos = sel.sancionesDeUnidad(bd, sesion.unidadActivaId).filter(sancionEnCurso)

  const porConciliar = sel
    .pagosDeUnidad(bd, sesion.unidadActivaId)
    .filter((pago) => pago.estado === 'reportado')

  // RN-226 — Los recordatorios de pago que le llegaron, los más recientes primero.
  const misCuotas = new Set(cuotas.map((c) => c.id))
  const misPagos = new Set(sel.pagosDeUnidad(bd, sesion.unidadActivaId).map((p) => p.id))
  const recordatorios = bd.mensajes
    .filter((m) => (m.cuotaId && misCuotas.has(m.cuotaId)) || (m.pagoId && misPagos.has(m.pagoId)))
    .slice(0, 3)

  const visibles = cuotas.filter((cuota) => {
    if (filtro === 'pendientes') return cuotaPendiente(cuota)
    if (filtro === 'pagadas') return !cuotaPendiente(cuota)
    return true
  })

  return (
    <>
      <div className="tarjeta">
        {/* El mismo nombre que en el inicio. "Saldo" es lenguaje contable y se
            queda en la consola, donde quien lee es el administrador. */}
        <span className="indicador__etiqueta">Valor adeudado</span>
        <div className="dato-grande" style={{ margin: 'var(--e1) 0' }}>
          {formatearDinero(saldo)}
        </div>
        {/* Sin «días de mora» ni rojo: se dice qué hay pendiente y desde cuándo
            (docs/08-convenciones.md §6 bis). */}
        {vencido > 0 ? (
          <p className="subtitulo">
            De ese total, <strong>{formatearDinero(vencido)}</strong> está pendiente
            {desde ? ` desde el ${formatearFecha(desde)}` : ''}. Puedes ponerte al día cuando quieras.
          </p>
        ) : (
          <p className="subtitulo">No tienes cuotas pendientes de meses anteriores. ¡Gracias por estar al día!</p>
        )}
        {saldo > 0 && (
          <Link
            to="/app/cuenta/pagar"
            className="boton boton--primario boton--bloque"
            style={{ marginTop: 'var(--e3)' }}
          >
            Pagar
          </Link>
        )}
        <Link
          to="/app/cuenta/informar"
          className="boton boton--bloque"
          style={{ marginTop: 'var(--e2)' }}
        >
          <Icono nombre="cuenta" tamano={16} />
          Ya pague por fuera: informar abono
        </Link>
        {/* CU-R-18 — El soporte para un trámite: se emite y se guarda en PDF. */}
        <Link to="/app/cuenta/estado" className="boton boton--bloque" style={{ marginTop: 'var(--e2)' }}>
          <Icono nombre="certificado" tamano={16} />
          Descargar estado de cuenta
        </Link>
        {/* CU-R-19 — Los recibos de caja de todos los pagos, para descargarlos cuando haga falta. */}
        <Link to="/app/cuenta/pagos" className="boton boton--bloque" style={{ marginTop: 'var(--e2)' }}>
          <Icono nombre="pagos" tamano={16} />
          Mis comprobantes de pago
        </Link>
      </div>

      {procesosAbiertos.length > 0 && (
        <Link to="/app/procesos" className="tarjeta tarjeta--accion tarjeta--plana">
          <div className="fila">
            <div className="tarjeta__cuerpo">
              <span className="marca-tarjeta marca-tarjeta--acento">
                <Icono nombre="certificado" tamano={20} />
              </span>
              <div className="columna">
                <strong>
                  {procesosAbiertos.length === 1
                    ? '1 proceso sancionatorio abierto'
                    : `${procesosAbiertos.length} procesos sancionatorios abiertos`}
                </strong>
                <span className="subtitulo">
                  Todavía no se cobra nada: solo se carga aquí si queda en firme.
                </span>
              </div>
            </div>
            <Icono nombre="chevron" tamano={16} className="tenue" />
          </div>
        </Link>
      )}

      {recordatorios.length > 0 && (
        <div className="tarjeta">
          <span className="titulo-seccion">Mensajes que te enviamos</span>
          <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
            {recordatorios.map((m) => (
              <p key={m.id} className="subtitulo">
                {formatearFecha(m.enviadoEn.slice(0, 10))}: {m.texto.replace(/^Idiky: /, '')}
              </p>
            ))}
          </div>
        </div>
      )}

      {porConciliar.length > 0 && (
        <div className="tarjeta">
          <span className="titulo-seccion">Abonos que informaste</span>
          <p className="subtitulo">
            La administración todavía no los aplica, por eso no bajan tu saldo.
          </p>
          <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
            {porConciliar.map((pago) => (
              <div key={pago.id} className="tarjeta tarjeta--plana">
                <div className="fila fila-inicio">
                  <div className="columna" style={{ flex: 1 }}>
                    <strong className="numerico">{formatearDinero(pago.valor)}</strong>
                    <span className="subtitulo">{pago.conceptoInformado}</span>
                  </div>
                  <ChipPago estado={pago.estado} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filtros">
        {FILTROS.map((opcion) => (
          <button
            key={opcion.id}
            className="filtro"
            aria-pressed={filtro === opcion.id}
            onClick={() => setFiltro(opcion.id)}
          >
            {opcion.texto}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio
          titulo="No hay movimientos"
          detalle="Cuando la administración genere cuotas aparecerán aquí."
        />
      ) : (
        <div className="lista lista--compacta">
          {visibles.map((cuota) => {
            const estado = estadoRealCuota(cuota)
            const abonado = abonadoDeCuota(cuota)
            const recibos = sel.pagosDeCuota(bd, cuota.id)
            return (
              <div key={cuota.id} className="tarjeta tarjeta--plana">
                <div className="fila fila-inicio">
                  <div className="columna" style={{ flex: 1 }}>
                    <strong>{cuota.concepto}</strong>
                    <span className="subtitulo">
                      {formatearPeriodo(cuota.periodo)} · vence{' '}
                      {formatearFecha(cuota.fechaVencimiento)}
                    </span>
                    {recibos.length > 0 && (
                      <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                        Recibo{recibos.length > 1 ? 's' : ''}{' '}
                        {recibos.map((recibo) => recibo.recibo).join(' · ')}
                      </span>
                    )}
                    {abonado > 0 && cuota.saldo > 0 && (
                      <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                        Abonado {formatearDinero(abonado)} de {formatearDinero(cuota.valor)}
                      </span>
                    )}
                    {/* RN-47: el respaldo se lee **aquí**, en la línea del
                        cobro, no en un documento aparte. Es donde la persona
                        está cuando se pregunta «¿y esto qué es?». */}
                    {cuota.justificacion && (
                      <details className="respaldo-cuota">
                        <summary>¿Por qué se cobra?</summary>
                        <p className="subtitulo" style={{ marginTop: 'var(--e2)' }}>
                          {cuota.justificacion}
                        </p>
                        {cuota.referencia && (
                          <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                            Aprobada en {cuota.referencia}
                          </span>
                        )}
                      </details>
                    )}
                  </div>
                  <div className="columna" style={{ alignItems: 'flex-end' }}>
                    <strong className="numerico">
                      {formatearDinero(cuotaPendiente(cuota) ? cuota.saldo : cuota.valor)}
                    </strong>
                    <ChipCuota estado={estado} paraPropietario />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
