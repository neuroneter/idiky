/**
 * Lo que espera a la administración, en el tablero (Mary, 2026-11-20: «revisar
 * si falta algo en la app entre perfiles»). Cada cosa que un residente o
 * portería deja esperando una respuesta aparece aquí, con su botón para ir.
 * Si no hay nada, no se muestra.
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import { alertasPendientes, objetoPendiente, pqrsPorVencer, preguntasAsambleaSinResponder, preguntasPorResponder } from '../../dominio/reglas'

export function TeEsperan() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const c = sesion.copropiedadId
  const delEdificio = <T extends { copropiedadId: string }>(lista: T[] | undefined) => (lista ?? []).filter((x) => x.copropiedadId === c)

  const filas: Array<{ cuantos: number; uno: string; varios: string; a: string; urgente?: boolean }> = [
    { cuantos: alertasPendientes(bd.alertasAyuda ?? [], c).length, uno: 'pedido de ayuda sin atender', varios: 'pedidos de ayuda sin atender', a: '/admin/edificio', urgente: true },
    // PN-22 — Las PQRS que vencen en pocos días: se responden antes del plazo.
    { cuantos: delEdificio(bd.pqrs).filter((p) => pqrsPorVencer(p)).length, uno: 'PQRS vence en 3 días o menos', varios: 'PQRS vencen en 3 días o menos', a: '/admin/pqrs', urgente: true },
    // PN-29 — Lo que preparó el auxiliar espera la aprobación del administrador.
    { cuantos: delEdificio(bd.documentos).filter((d) => d.estado === 'por_aprobar').length, uno: 'paz y salvo por aprobar', varios: 'paz y salvos por aprobar', a: '/admin/cartera/paz-y-salvo' },
    { cuantos: delEdificio(bd.acuerdosPago).filter((a) => a.estado === 'propuesto').length, uno: 'acuerdo de pago por aprobar', varios: 'acuerdos de pago por aprobar', a: '/admin/cartera' },
    { cuantos: delEdificio(bd.trasteos).filter((t) => t.estado === 'solicitado').length, uno: 'trasteo por aprobar', varios: 'trasteos por aprobar', a: '/admin/edificio' },
    { cuantos: delEdificio(bd.permisosObra).filter((o) => o.estado === 'solicitado').length, uno: 'obra en apartamento por aprobar', varios: 'obras en apartamentos por aprobar', a: '/admin/edificio' },
    { cuantos: delEdificio(bd.proyectos).reduce((s, p) => s + preguntasPorResponder(p).length, 0), uno: 'pregunta sobre las obras sin responder', varios: 'preguntas sobre las obras sin responder', a: '/admin/proyectos' },
    // PN-24 — Lo que preguntan antes de la asamblea se responde antes de la reunión.
    { cuantos: delEdificio(bd.asambleas).reduce((s, a) => s + preguntasAsambleaSinResponder(a).length, 0), uno: 'pregunta para la asamblea sin responder', varios: 'preguntas para la asamblea sin responder', a: '/admin/asambleas' },
    { cuantos: delEdificio(bd.objetosEncontrados).filter((o) => objetoPendiente(o) && o.reclamos.length > 0).length, uno: 'objeto perdido que alguien reclamó', varios: 'objetos perdidos que alguien reclamó', a: '/admin/edificio' },
    { cuantos: delEdificio(bd.trasteos).filter((t) => t.deposito?.recibido && !t.deposito.cierre && t.realizado).length, uno: 'depósito de trasteo por devolver', varios: 'depósitos de trasteo por devolver', a: '/admin/edificio' },
  ].filter((f) => f.cuantos > 0)

  if (filas.length === 0) return null

  return (
    <div className="tarjeta tarjeta--alerta">
      <span className="titulo-seccion">Te esperan</span>
      <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
        {filas.map((f) => (
          <div key={f.uno} className="fila">
            <span>
              <strong className="numerico">{f.cuantos}</strong> {f.cuantos === 1 ? f.uno : f.varios}
            </span>
            <Link to={f.a} className={`boton boton--pequeno${f.urgente ? ' boton--primario' : ''}`}>
              Ver
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
