/**
 * CU-R-18 — Informar un abono ya consignado.
 * Doc: docs/casos-de-uso/residente.md#cu-r-18
 *
 * El propietario consigno por fuera de la app (banco, efectivo en porteria) y
 * necesita decirle a la administracion que ese dinero es suyo y a que lo quiere
 * aplicar. El abono queda `reportado`: no toca la cartera hasta que la
 * administracion lo concilie (RN-30).
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { reportarAbono } from '../../datos/repositorio'
import { cuotasPorAntiguedad } from '../../dominio/reglas'
import type { MedioPago } from '../../dominio/tipos'
import { formatearDinero, formatearPeriodo } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'

const MEDIOS: Array<{ id: MedioPago; texto: string }> = [
  { id: 'transferencia', texto: 'Transferencia o consignacion' },
  { id: 'efectivo', texto: 'Efectivo en porteria' },
  { id: 'pse', texto: 'PSE' },
  { id: 'otro', texto: 'Otro medio' },
]

export function InformarAbonoPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const navegar = useNavigate()

  const [valor, setValor] = useState(0)
  const [medio, setMedio] = useState<MedioPago>('transferencia')
  const [referencia, setReferencia] = useState('')
  const [concepto, setConcepto] = useState('')
  const [cuotasSenaladas, setCuotasSenaladas] = useState<string[]>([])
  const [enviado, setEnviado] = useState(false)

  if (!sesion) return null

  const persona = sel.persona(bd, sesion.personaId)
  const pendientes = cuotasPorAntiguedad(sel.cuotasDeUnidad(bd, sesion.unidadActivaId))

  async function enviar() {
    const abono = await ejecutar(
      (base) =>
        reportarAbono(base, {
          unidadId: sesion!.unidadActivaId!,
          personaId: sesion!.personaId,
          valor,
          medio,
          referencia,
          conceptoInformado: concepto,
          cuotasInformadas: cuotasSenaladas,
          reportadoPor: nombreCompleto(persona),
        }),
      'Abono informado a la administracion.',
    )
    if (abono) setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="pila">
        <div className="tarjeta" style={{ textAlign: 'center' }}>
          <div className="circulo-exito">
            <Icono nombre="check" tamano={28} />
          </div>
          <h2 className="titulo">Abono informado</h2>
          <p className="subtitulo">
            La administracion lo va a revisar y te va a emitir el recibo de caja. Mientras tanto lo
            veras en tu cuenta como <strong>por conciliar</strong>.
          </p>
        </div>
        <button className="boton boton--primario boton--bloque" onClick={() => navegar('/app/cuenta')}>
          Volver a mi cuenta
        </button>
      </div>
    )
  }

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <Link to="/app/cuenta" className="boton-volver">
          <Icono nombre="volver" tamano={16} />
          Mi cuenta
        </Link>
      </div>

      <div className="tarjeta">
        <span className="titulo-seccion">Ya pagaste por fuera de la app</span>
        <p className="subtitulo">
          Cuentanos cuanto consignaste y a que corresponde, para que la administracion lo aplique
          donde tu quieres y no donde el sistema suponga.
        </p>
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="valor-abono">Cuanto abonaste</label>
          <input
            id="valor-abono"
            type="number"
            min={0}
            value={valor}
            onChange={(evento) => setValor(Number(evento.target.value))}
          />
        </div>
        <div className="campo">
          <label htmlFor="medio-abono">Como pagaste</label>
          <select
            id="medio-abono"
            value={medio}
            onChange={(evento) => setMedio(evento.target.value as MedioPago)}
          >
            {MEDIOS.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="campo">
        <label htmlFor="referencia-abono">Numero de consignacion o referencia</label>
        <input
          id="referencia-abono"
          value={referencia}
          onChange={(evento) => setReferencia(evento.target.value)}
          placeholder="Aparece en el comprobante del banco"
        />
      </div>

      <div className="campo">
        <label htmlFor="concepto-abono">A que corresponde tu abono</label>
        <textarea
          id="concepto-abono"
          rows={3}
          value={concepto}
          onChange={(evento) => setConcepto(evento.target.value)}
          placeholder="Ej: es el segundo contado de la cuota extraordinaria, no la administracion del mes."
        />
        <span className="ayuda-campo">
          Esto es lo que lee la administracion antes de aplicar el pago.
        </span>
      </div>

      <div className="pila">
        <span className="titulo-seccion">Senala las cuotas (opcional)</span>
        {pendientes.length === 0 ? (
          <EstadoVacio titulo="No tienes cuotas pendientes" detalle="Tu abono quedara a favor." />
        ) : (
          <div className="lista lista--compacta">
            {pendientes.map((cuota) => {
              const marcada = cuotasSenaladas.includes(cuota.id)
              return (
                <label
                  key={cuota.id}
                  className="tarjeta tarjeta--plana"
                  style={{ cursor: 'pointer', borderColor: marcada ? 'var(--color-marca)' : undefined }}
                >
                  <div className="fila">
                    <div className="fila" style={{ gap: 'var(--e3)' }}>
                      <input
                        type="checkbox"
                        checked={marcada}
                        style={{ width: 'auto' }}
                        onChange={() =>
                          setCuotasSenaladas((actual) =>
                            marcada ? actual.filter((id) => id !== cuota.id) : [...actual, cuota.id],
                          )
                        }
                      />
                      <div className="columna">
                        <strong style={{ fontSize: 'var(--texto-sm)' }}>{cuota.concepto}</strong>
                        <span className="subtitulo">{formatearPeriodo(cuota.periodo)}</span>
                      </div>
                    </div>
                    <strong className="numerico">{formatearDinero(cuota.saldo)}</strong>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <button
        className="boton boton--primario boton--bloque"
        disabled={cargando || valor <= 0 || !referencia.trim() || !concepto.trim()}
        onClick={enviar}
      >
        {cargando ? 'Enviando…' : 'Informar abono'}
      </button>
    </div>
  )
}
