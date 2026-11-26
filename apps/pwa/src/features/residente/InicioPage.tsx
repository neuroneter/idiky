/**
 * CU-R-02 — Ver resumen de mi copropiedad (inicio).
 * Doc: docs/casos-de-uso/residente.md#cu-r-02
 */

import { PedirAyuda } from './PedirAyuda'
import { encuestaAbierta, respuestaDeUnidad } from '../../dominio/reglas'
import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import {
  calcularSaldo,
  calcularSaldoVencido,
  pendienteDesde,
  estadoRealVisitante,
  etiquetaUnidad,
  hoyISO,
  puedeImpugnar,
  puedePresentarDescargos,
  solicitudesEsperandoRespuesta,
  estadoProyecto,
  ultimoAvance,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha, formatearFechaCorta } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { ChipComunicado, ChipReserva } from '../../componentes/Etiquetas'
import { BarraAvance, ChipProyecto } from '../../componentes/TableroProyecto'
import { PermanentesPorAceptar, PoderesPorAceptar } from './PoderesPorAceptar'
import { MisCargosPorAceptar } from '../../componentes/CargosDelEdificio'
import { veModulo, type ModuloIdiky } from '../../dominio/permisos'

export function InicioPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const unidadId = sesion.unidadActivaId
  const unidad = sel.unidad(bd, unidadId)
  // PN-29 — Cada perfil ve solo lo que le toca (tabla de Mary, 2026-11-26).
  const usuario = sel.usuarioDeSesion(bd, sesion)
  const ve = (modulo: ModuloIdiky) => veModulo(usuario, modulo)
  const cuotas = sel.cuotasDeUnidad(bd, unidadId)
  const saldo = calcularSaldo(cuotas)
  const vencido = calcularSaldoVencido(cuotas)
  const desde = pendienteDesde(cuotas)
  const proximaCuota = cuotas
    .filter((cuota) => cuota.estado !== 'pagada')
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))[0]

  const comunicados = sel.comunicadosVigentes(bd, sesion.copropiedadId)
  const destacado = comunicados[0]
  const proyectoEnMarcha = sel
    .proyectosDe(bd, sesion.copropiedadId)
    .find((p) => estadoProyecto(p) !== 'terminado')
  const reserva = sel.proximaReserva(bd, unidadId)
  const zonaReserva = reserva ? sel.zona(bd, reserva.zonaId) : undefined
  const correspondenciaPendiente = sel
    .correspondenciaDeUnidad(bd, unidadId)
    .filter((registro) => registro.estado === 'en_porteria')
  // Cuenta la PQRS sin cerrar y la reserva sin aprobar: quien las hizo las vive
  // igual, «pedi algo y no me han contestado».
  const pendientes = solicitudesEsperandoRespuesta(
    sel.pqrsDeUnidad(bd, unidadId),
    sel.reservasDeUnidad(bd, unidadId),
  )
  // Un proceso sancionatorio con el plazo corriendo entra al inicio (CU-R-29):
  // es lo unico de la app que se pierde solo si no se mira a tiempo.
  const procesosPorResponder = sel
    .sancionesDeUnidad(bd, unidadId)
    .filter((sancion) => puedePresentarDescargos(sancion) || puedeImpugnar(sancion))
  const visitantesVigentes = sel
    .visitantesDeUnidad(bd, unidadId)
    .filter((visitante) => estadoRealVisitante(visitante, hoyISO()) === 'activo')

  const propiedades = sel.propiedadesDePersona(bd, sesion.personaId)
  const encuestasPorResponder = sel
    .encuestasDe(bd, sesion.copropiedadId)
    .filter((e) => encuestaAbierta(e, hoyISO()) && !respuestaDeUnidad(e, unidadId ?? '')).length

  return (
    <>
      {/* Cartera — CU-R-03. Va sobre la zona de marca, sin tarjeta: el monto es
          lo primero que la persona busca y no necesita una caja que lo encierre. */}
      {ve('cartera') && (
      <Link to="/app/cuenta" className="cartera-inicio">
        <span className="cartera-inicio__etiqueta">
          {saldo === 0 ? 'Tu unidad está al día' : 'Valor adeudado'}
        </span>
        <div className="cartera-inicio__monto">{formatearDinero(saldo)}</div>
        {vencido > 0 ? (
          /* Blanco sobre el degradado: el rojo no se lee sobre fucsia. */
          <span className="cartera-inicio__alerta">
            {formatearDinero(vencido)} pendiente{desde ? ` desde el ${formatearFechaCorta(desde)}` : ''}
          </span>
        ) : proximaCuota ? (
          <span className="cartera-inicio__etiqueta">
            Proximo vencimiento: {formatearFecha(proximaCuota.fechaVencimiento)}
          </span>
        ) : (
          <span className="cartera-inicio__etiqueta">No tienes cuotas pendientes</span>
        )}
      </Link>
      )}

      {/* T-46 — Un poder que me dieron y espera mi respuesta (RN-217). */}
      <PoderesPorAceptar />
      {/* PN-28 — Si la asamblea lo eligió, que acepte el cargo. */}
      <MisCargosPorAceptar />
      <PermanentesPorAceptar />

      {/* Accesos directos. Solicitudes se queda aqui (Mary, 2026-08-27): lo que
          habia que unificar no era el sitio, era la identidad. Antes este acceso
          llevaba el icono de PQRS y aterrizaba en el segmento de PQRS, mientras la
          pestana llevaba otro icono y aterrizaba en la vista: se veian como dos
          destinos distintos. Ahora es **el mismo icono, el mismo nombre y el mismo
          destino** que la pestana. */}
      <div className="accesos">
        {ve('cartera') && (
        <Link to="/app/cuenta/pagar" className="acceso-directo">
          <span className="acceso-directo__icono">
            <Icono nombre="cuenta" />
          </span>
          Pagar
        </Link>
        )}
        {ve('visitantes') && (
        <Link to="/app/visitantes" className="acceso-directo">
          <span className="acceso-directo__icono">
            <Icono nombre="visitantes" />
          </span>
          Visitantes
          {visitantesVigentes.length > 0 && (
            <span className="acceso-directo__contador">{visitantesVigentes.length}</span>
          )}
        </Link>
        )}
        {ve('correspondencia') && (
        <Link to="/app/correspondencia" className="acceso-directo">
          <span className="acceso-directo__icono">
            <Icono nombre="correspondencia" />
          </span>
          Paquetes
          {ve('correspondencia') && correspondenciaPendiente.length > 0 && (
            <span className="acceso-directo__contador">{correspondenciaPendiente.length}</span>
          )}
        </Link>
        )}
        {(ve('reservas') || ve('pqrs') || ve('paz_y_salvo')) && (
        <Link to="/app/solicitudes" className="acceso-directo">
          <span className="acceso-directo__icono">
            <Icono nombre="solicitudes" />
          </span>
          Solicitudes
          {pendientes > 0 && <span className="acceso-directo__contador">{pendientes}</span>}
        </Link>
        )}
      </div>

      {/* CU-R-43 — Pedir ayuda a portería, a la vista: en una emergencia nadie busca. */}
      {ve('pedir_ayuda') && <PedirAyuda />}

      {/* CU-R-17 — Los teléfonos útiles, a un toque: en una emergencia nadie busca. */}
      <Link to="/app/directorio" className="tarjeta tarjeta--accion tarjeta--plana">
        <div className="fila">
          <div className="columna">
            <strong>Teléfonos útiles y emergencias</strong>
            <span className="subtitulo">Administración, portería, emergencias y servicios</span>
          </div>
          <Icono nombre="chevron" tamano={16} className="tenue" />
        </div>
      </Link>

      {/* PN-18 — Con varias propiedades, todas a un toque. */}
      {propiedades.length > 1 && (
        <Link to="/app/propiedades" className="tarjeta tarjeta--accion tarjeta--plana">
          <div className="fila">
            <div className="columna">
              <strong>Tus {propiedades.length} propiedades</strong>
              <span className="subtitulo">
                Valor adeudado en todas: {formatearDinero(propiedades.reduce((s, p) => s + (p.saldo ?? 0), 0))}
              </span>
            </div>
            <Icono nombre="chevron" tamano={16} className="tenue" />
          </div>
        </Link>
      )}

      {/* Tu edificio: cuentas claras, calendario, encuestas, documentos y clasificados. */}
      <Link to="/app/edificio" className="tarjeta tarjeta--accion tarjeta--plana">
        <div className="fila">
          <div className="columna">
            <strong>Tu edificio</strong>
            <span className="subtitulo">Cuentas claras, calendario, encuestas, documentos y clasificados</span>
          </div>
          {encuestasPorResponder > 0 && (
            <span className="chip chip--marca">
              {encuestasPorResponder === 1 ? '1 encuesta' : `${encuestasPorResponder} encuestas`}
            </span>
          )}
          <Icono nombre="chevron" tamano={16} className="tenue" />
        </div>
      </Link>

      {/* Comunicado destacado — CU-R-09, RN-15 */}
      {destacado && (
        <div className="pila">
          <div className="encabezado-seccion">
            <h2>De la administración</h2>
            <Link to="/app/comunicados">Ver cartelera</Link>
          </div>
          <Link to="/app/comunicados" className="tarjeta tarjeta--accion tarjeta--comunicado">
            <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
              <ChipComunicado categoria={destacado.categoria} />
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {formatearFechaCorta(destacado.fechaPublicacion)}
              </span>
            </div>
            <strong>{destacado.titulo}</strong>
            <p className="subtitulo" style={{ marginTop: 'var(--e1)' }}>
              {destacado.cuerpo.slice(0, 120)}
              {destacado.cuerpo.length > 120 ? '…' : ''}
            </p>
          </Link>
        </div>
      )}

      {/* Proyectos en marcha — CU-R-32. Va después del comunicado y antes de
          la unidad: es la obra que se está pagando con la cuota de arriba. */}
      {ve('documentos') && proyectoEnMarcha && (
        <div className="pila">
          <div className="encabezado-seccion">
            <h2>Obras en marcha</h2>
            <Link to="/app/proyectos">Ver el tablero</Link>
          </div>
          <Link to="/app/proyectos" className="tarjeta tarjeta--accion columna" style={{ gap: 'var(--e2)' }}>
            <div className="fila fila-inicio">
              <strong>{proyectoEnMarcha.nombre}</strong>
              <ChipProyecto proyecto={proyectoEnMarcha} />
            </div>
            <BarraAvance proyecto={proyectoEnMarcha} />
            {ultimoAvance(proyectoEnMarcha) && (
              <span className="subtitulo">
                <strong>Último avance:</strong> {ultimoAvance(proyectoEnMarcha)!.titulo} ·{' '}
                {formatearFechaCorta(ultimoAvance(proyectoEnMarcha)!.fecha)}
              </span>
            )}
            <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
              {proyectoEnMarcha.avances.length}{' '}
              {proyectoEnMarcha.avances.length === 1 ? 'avance registrado' : 'avances registrados'} · toca para ver la historia
            </span>
          </Link>
        </div>
      )}

      {/* Mi unidad y su coeficiente — CU-R-24 */}
      {unidad && (
        <div className="pila">
          <div className="encabezado-seccion">
            <h2>Tu unidad</h2>
          </div>
          <Link to="/app/unidad" className="tarjeta tarjeta--accion">
            <div className="fila">
              <div className="tarjeta__cuerpo">
                <span className="marca-tarjeta">
                  <Icono nombre="unidades" tamano={20} />
                </span>
                <div className="columna">
                  <strong>{etiquetaUnidad(unidad)}</strong>
                  <span className="subtitulo">
                    Coeficiente {unidad.coeficiente} % · {unidad.area} m²
                  </span>
                </div>
              </div>
              <Icono nombre="chevron" tamano={16} className="tenue" />
            </div>
          </Link>
        </div>
      )}

      {/* Proxima reserva — CU-R-05 */}
      {ve('reservas') && (
      <div className="pila">
        <div className="encabezado-seccion">
          <h2>Tu próxima reserva</h2>
          <Link to="/app/solicitudes/reservas">Ver reservas</Link>
        </div>
        {reserva && zonaReserva ? (
          <Link to="/app/solicitudes/reservas" className="tarjeta tarjeta--accion">
            <div className="fila">
              <div className="tarjeta__cuerpo">
                {/* Bloque de calendario: una reserva es una fecha, y asi se
                    reconoce sin leer. */}
                <span className="bloque-fecha">
                  <span className="bloque-fecha__dia">{Number(reserva.fecha.slice(8, 10))}</span>
                  <span className="bloque-fecha__mes">
                    {formatearFechaCorta(reserva.fecha).split(' ')[1]}
                  </span>
                </span>
                <div className="columna">
                  <strong>{zonaReserva.nombre}</strong>
                  <span className="subtitulo">
                    {reserva.horaInicio} a {reserva.horaFin}
                  </span>
                </div>
              </div>
              <ChipReserva estado={reserva.estado} />
            </div>
          </Link>
        ) : (
          <Link to="/app/solicitudes/reservas" className="tarjeta tarjeta--accion">
            <div className="fila">
              <span className="subtitulo">No tienes reservas proximas.</span>
              <span className="chip chip--marca">Reservar</span>
            </div>
          </Link>
        )}
      </div>
      )}

      {/* Proceso sancionatorio — CU-R-29. Va antes que la correspondencia
          porque el paquete espera y el plazo no. */}
      {ve('cartera') && procesosPorResponder.length > 0 && (
        <div className="pila">
          <div className="encabezado-seccion">
            <h2>Te toca responder</h2>
          </div>
          <Link to="/app/procesos" className="tarjeta tarjeta--accion tarjeta--pendiente">
            <div className="fila">
              <div className="tarjeta__cuerpo">
                <span className="marca-tarjeta marca-tarjeta--acento">
                  <Icono nombre="certificado" tamano={20} />
                </span>
                <div className="columna">
                  <strong>
                    {procesosPorResponder.length === 1
                      ? 'Hay un proceso abierto contra tu unidad'
                      : `Hay ${procesosPorResponder.length} procesos abiertos contra tu unidad`}
                  </strong>
                  <span className="subtitulo">
                    {procesosPorResponder[0].concepto} · tienes plazo para responder
                  </span>
                </div>
              </div>
              <Icono nombre="chevron" tamano={16} className="tenue" />
            </div>
          </Link>
        </div>
      )}

      {/* Correspondencia — CU-R-11 */}
      {correspondenciaPendiente.length > 0 && (
        <div className="pila">
          <div className="encabezado-seccion">
            <h2>Te espera en portería</h2>
          </div>
          <Link to="/app/correspondencia" className="tarjeta tarjeta--accion tarjeta--pendiente">
            <div className="fila">
              <div className="tarjeta__cuerpo">
                <span className="marca-tarjeta marca-tarjeta--acento">
                  <Icono nombre="correspondencia" tamano={20} />
                </span>
                <div className="columna">
                  <strong>
                    {correspondenciaPendiente.length}{' '}
                    {correspondenciaPendiente.length === 1 ? 'envio' : 'envios'} sin recoger
                  </strong>
                  <span className="subtitulo">
                    El mas reciente: {correspondenciaPendiente[0].remitente}
                  </span>
                </div>
              </div>
              <Icono nombre="chevron" tamano={16} className="tenue" />
            </div>
          </Link>
        </div>
      )}
    </>
  )
}
