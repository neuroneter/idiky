/**
 * CU-R-04 — Pagar una cuota.
 * Doc: docs/casos-de-uso/residente.md#cu-r-04
 *
 * El pago es SIMULADO: no hay pasarela. La integracion real es de la fase 4
 * (docs/07-roadmap.md) y solo debe cambiar el paso "procesar", no el flujo.
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { registrarPago } from '../../datos/repositorio'
import { cuotaPendiente, estadoRealCuota } from '../../dominio/reglas'
import { formatearDinero, formatearFecha, formatearFechaHora } from '../../utilidades/formato'
import type { MedioPago, Pago } from '../../dominio/tipos'
import { BotonVolver } from '../../componentes/BotonVolver'
import { Icono } from '../../componentes/Icono'
import { ChipCuota } from '../../componentes/Etiquetas'
import { EstadoVacio } from '../../componentes/EstadoVacio'

/**
 * `ayuda` no es decoracion: Bre-B es nuevo y mucha gente no sabe todavia que es
 * ni que necesita una llave. Un medio de pago que hay que adivinar no se usa.
 */
const MEDIOS: Array<{ id: MedioPago; texto: string; ayuda: string }> = [
  { id: 'pse', texto: 'PSE / débito a cuenta', ayuda: 'Te lleva al portal de tu banco' },
  {
    id: 'bre_b',
    texto: 'Bre-B',
    ayuda: 'Pago inmediato con tu llave, desde la app de tu banco',
  },
  { id: 'tarjeta', texto: 'Tarjeta de crédito', ayuda: 'Visa, Mastercard o American Express' },
]

export function PagoPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const navegar = useNavigate()
  const [medio, setMedio] = useState<MedioPago>('pse')
  const [hasta, setHasta] = useState<number | null>(null)
  const [comprobante, setComprobante] = useState<Pago | null>(null)

  if (!sesion) return null

  const persona = sel.persona(bd, sesion.personaId)

  /** Pendientes de la mas antigua a la mas reciente: el orden de imputacion (RN-06). */
  const pendientes = useMemo(
    () =>
      sel
        .cuotasDeUnidad(bd, sesion.unidadActivaId)
        .filter(cuotaPendiente)
        .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)),
    [bd, sesion.unidadActivaId],
  )

  // Por defecto se paga todo; al tocar una cuota se paga hasta ella (y las anteriores).
  const corte = hasta ?? pendientes.length - 1
  const seleccionadas = pendientes.slice(0, corte + 1)
  const total = seleccionadas.reduce((suma, cuota) => suma + cuota.valor, 0)

  async function pagar() {
    const pago = await ejecutar(
      (base) =>
        registrarPago(base, {
          unidadId: sesion!.unidadActivaId!,
          cuotaIds: seleccionadas.map((cuota) => cuota.id),
          medio,
          registradoPor: nombreCompleto(persona),
        }),
      'Pago registrado correctamente.',
    )
    if (pago) setComprobante(pago)
  }

  if (comprobante) {
    return (
      <div className="pila">
        <div className="tarjeta" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              margin: '0 auto var(--e3)',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--color-exito-suave)',
              color: 'var(--color-exito)',
            }}
          >
            <Icono nombre="check" tamano={28} />
          </div>
          <h2 className="titulo">Pago exitoso</h2>
          <p className="subtitulo">Guarda este comprobante para tus registros.</p>
          <div className="separador" />
          <div className="lista lista--compacta" style={{ textAlign: 'left' }}>
            <div className="fila">
              <span className="subtitulo">Comprobante</span>
              <strong>{comprobante.comprobante}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Valor</span>
              <strong className="numerico">{formatearDinero(comprobante.valor)}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Referencia</span>
              <span>{comprobante.referencia}</span>
            </div>
            <div className="fila">
              <span className="subtitulo">Fecha</span>
              <span>{formatearFechaHora(comprobante.fecha)}</span>
            </div>
            <div className="fila">
              <span className="subtitulo">Cuotas cubiertas</span>
              <span>{comprobante.cuotaIds.length}</span>
            </div>
          </div>
        </div>
        <button className="boton boton--primario boton--bloque" onClick={() => navegar('/app/cuenta')}>
          Volver a mi cuenta
        </button>
      </div>
    )
  }

  if (pendientes.length === 0) {
    return (
      <div className="pila">
        <EstadoVacio titulo="No tienes cuotas por pagar" detalle="Tu unidad está al día." />
        <Link to="/app/cuenta" className="boton boton--bloque">
          Volver
        </Link>
      </div>
    )
  }

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver a="/app/cuenta" texto="Mi cuenta" />
      </div>

      <div className="pila">
        <span className="titulo-seccion">Qué vas a pagar</span>
        <p className="subtitulo">
          Los pagos se aplican primero a la deuda más antigua. Toca una cuota para pagar hasta
          esa fecha.
        </p>
        <div className="lista lista--compacta">
          {pendientes.map((cuota, indice) => {
            const incluida = indice <= corte
            return (
              <button
                key={cuota.id}
                className="tarjeta tarjeta--plana tarjeta--accion"
                style={{ borderColor: incluida ? 'var(--color-marca)' : undefined }}
                onClick={() => setHasta(indice)}
              >
                <div className="fila fila-inicio">
                  <div className="columna" style={{ flex: 1 }}>
                    <strong>{cuota.concepto}</strong>
                    <span className="subtitulo">
                      Vence {formatearFecha(cuota.fechaVencimiento)}
                    </span>
                  </div>
                  <div className="columna" style={{ alignItems: 'flex-end' }}>
                    <strong className="numerico">{formatearDinero(cuota.valor)}</strong>
                    {incluida ? (
                      <span className="chip chip--marca">Incluida</span>
                    ) : (
                      <ChipCuota estado={estadoRealCuota(cuota)} />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pila">
        <span className="titulo-seccion">Medio de pago</span>
        <div className="lista lista--compacta">
          {MEDIOS.map((opcion) => (
            <button
              key={opcion.id}
              className="tarjeta tarjeta--plana tarjeta--accion"
              style={{ borderColor: medio === opcion.id ? 'var(--color-marca)' : undefined }}
              onClick={() => setMedio(opcion.id)}
            >
              <div className="fila">
                <div className="columna">
                  <span>{opcion.texto}</span>
                  <span className="subtitulo">{opcion.ayuda}</span>
                </div>
                {medio === opcion.id && <Icono nombre="check" tamano={16} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="tarjeta">
        <div className="fila">
          <span className="subtitulo">Total a pagar</span>
          <strong className="dato-grande numerico">{formatearDinero(total)}</strong>
        </div>
        <button
          className="boton boton--primario boton--bloque"
          style={{ marginTop: 'var(--e3)' }}
          disabled={cargando || seleccionadas.length === 0}
          onClick={pagar}
        >
          {cargando ? 'Procesando…' : `Pagar ${formatearDinero(total)}`}
        </button>
        <p className="ayuda-campo" style={{ marginTop: 'var(--e2)', textAlign: 'center' }}>
          Demo: no se realiza ningun cobro real.
        </p>
      </div>
    </div>
  )
}
