/**
 * CU-A-26 — Registrar propietarios y ver los registros de la copropiedad.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-26
 *
 * **El segundo eslabón de RN-63.** El operador de Idiky crea al administrador,
 * el administrador crea al propietario, y el propietario crea a los demás de su
 * unidad. Nadie se salta un eslabón: que el administrador pudiera crear
 * arrendatarios directamente parece un atajo cómodo y es lo que rompe la
 * trazabilidad — el propietario dejaría de saber quién vive en su unidad.
 *
 * Por eso aquí la única categoría es **residente**, y en la práctica
 * propietario: es lo que le toca a este eslabón. Los arrendatarios, los
 * temporales y los visitantes los registra el propietario desde su app.
 *
 * El trámite es el mismo de la app del residente y sale del mismo componente
 * (`componentes/Registro.tsx`): dos formularios distintos para lo mismo acaban
 * pidiendo cosas distintas.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  autorizarRegistro,
  cerrarRegistro,
  crearRegistroPersona,
  registrarAccesoSoportes,
} from '../../datos/repositorio'
import {
  etiquetaUnidad,
  puedeAutorizar,
  registroEnCurso,
  verSoportesDejaConstancia,
} from '../../dominio/reglas'
import { formatearFechaHora } from '../../utilidades/formato'
import {
  CATEGORIAS,
  DetalleRegistro,
  ESTADOS,
  FormularioRegistro,
} from '../../componentes/Registro'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function RegistrosPage() {
  const { bd, ejecutar, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [registrando, setRegistrando] = useState(false)
  const [viendo, setViendo] = useState<string | null>(null)
  /** Registros cuyos soportes se abrieron en esta visita a la pantalla. */
  const [abiertos, setAbiertos] = useState<string[]>([])

  if (!sesion) return null

  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)
  const deLaCopropiedad = new Set(unidades.map((unidad) => unidad.id))
  const registros = bd.registros.filter((registro) => deLaCopropiedad.has(registro.unidadId))
  const enCurso = registros.filter(registroEnCurso)
  const enDetalle = registros.find((registro) => registro.id === viendo)

  return (
    <div className="pila">
      <div className="fila">
        <div className="columna">
          <span className="subtitulo">
            El administrador registra propietarios. Los demás los registra el propietario desde su
            unidad (RN-63).
          </span>
        </div>
        <button className="boton boton--primario" onClick={() => setRegistrando(true)}>
          <Icono nombre="mas" tamano={16} />
          Registrar propietario
        </button>
      </div>

      <div className="rejilla-indicadores">
        <div className="tarjeta indicador">
          <span className="indicador__valor numerico">
            {registros.filter((r) => r.estado === 'esperando_soportes').length}
          </span>
          <span className="indicador__etiqueta">Esperando soportes</span>
        </div>
        <div className="tarjeta indicador">
          <span className="indicador__valor numerico">
            {registros.filter((r) => r.estado === 'esperando_autorizacion').length}
          </span>
          <span className="indicador__etiqueta">Por autorizar</span>
        </div>
        <div className="tarjeta indicador">
          <span className="indicador__valor numerico">
            {registros.filter((r) => r.estado === 'autorizado').length}
          </span>
          <span className="indicador__etiqueta">Autorizados</span>
        </div>
      </div>

      {registros.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay registros"
          detalle="Registra un propietario, o espera a que los propietarios registren a su gente."
        />
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <div className="contenedor-tabla">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Unidad</th>
                  <th>Categoría</th>
                  <th>Quién lo registró</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => {
                  const unidad = sel.unidad(bd, registro.unidadId)
                  const quien = sel.persona(bd, registro.creadoPor)
                  return (
                    <tr key={registro.id}>
                      <td>
                        <strong>
                          {registro.nombres} {registro.apellidos}
                        </strong>
                        <div className="subtitulo numerico">{registro.documento}</div>
                      </td>
                      <td className="suave">{unidad ? etiquetaUnidad(unidad) : '—'}</td>
                      <td className="suave">{CATEGORIAS[registro.categoria].texto}</td>
                      {/* Quién registró a quién es el dato que hace útil esta
                          tabla: es la cadena de RN-63 hecha visible. */}
                      <td className="suave">
                        {quien ? `${quien.nombres} ${quien.apellidos}` : 'La administración'}
                        <div className="subtitulo">{formatearFechaHora(registro.creadoEn)}</div>
                      </td>
                      <td>
                        <span className={ESTADOS[registro.estado].chip}>
                          {ESTADOS[registro.estado].texto}
                        </span>
                      </td>
                      <td>
                        <button
                          className="boton boton--pequeno"
                          onClick={() => setViendo(registro.id)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {enCurso.length > 0 && (
        <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
          La administración ve todos los registros de la copropiedad, pero solo autoriza los que
          creó: los de una unidad los autoriza su propietario (RN-59).
        </p>
      )}

      {registrando && (
        <FormularioRegistro
          categorias={['residente']}
          unidades={unidades}
          alCerrar={() => setRegistrando(false)}
          alCrear={async (datos) => {
            const creado = await ejecutar(
              (base) =>
                crearRegistroPersona(base, {
                  copropiedadId: sesion.copropiedadId,
                  unidadId: datos.unidadId!,
                  creadoPor: sesion.personaId,
                  categoria: datos.categoria,
                  rol: datos.rol,
                  nombres: datos.nombres,
                  apellidos: datos.apellidos,
                  documento: datos.documento,
                  email: datos.email,
                  telefono: datos.telefono,
                  vigenciaDesde: datos.vigenciaDesde,
                  vigenciaHasta: datos.vigenciaHasta,
                }),
              'Registro creado. Ahora la persona adjunta sus fotos.',
            )
            if (creado) {
              setRegistrando(false)
              setViendo(creado.id)
            }
          }}
        />
      )}

      {enDetalle && (
        <DetalleRegistro
          registro={enDetalle}
          mensaje={bd.mensajes.find((m) => m.registroId === enDetalle.id)}
          // Ya decidido, las fotos se abren a propósito y queda constancia (RN-67).
          mostrarSoportes={!verSoportesDejaConstancia(enDetalle) || abiertos.includes(enDetalle.id)}
          accesos={bd.accesosSoportes
            .filter((acceso) => acceso.registroId === enDetalle.id)
            .map((acceso) => ({
              id: acceso.id,
              quien: nombreCompleto(sel.persona(bd, acceso.personaId)),
              vistoEn: acceso.vistoEn,
            }))}
          alAbrirSoportes={async () => {
            setAbiertos((antes) => [...antes, enDetalle.id])
            await ejecutar((base) =>
              registrarAccesoSoportes(base, {
                registroId: enDetalle.id,
                personaId: sesion.personaId,
              }),
            )
          }}
          puedoAutorizar={puedeAutorizar(enDetalle, sesion.personaId)}
          esMio={enDetalle.creadoPor === sesion.personaId}
          alCerrar={() => setViendo(null)}
          alAutorizar={async () => {
            const hecho = await ejecutar(
              (base) =>
                autorizarRegistro(base, {
                  registroId: enDetalle.id,
                  personaId: sesion.personaId,
                }),
              'Autorizado. La persona quedó vinculada a la unidad.',
            )
            if (hecho) setViendo(null)
          }}
          alRechazar={async (motivo, anular) => {
            if (motivo.trim().length < 5) {
              mostrarAviso(
                'Escribe por qué: sin motivo, el rechazo no le dice nada a nadie.',
                'error',
              )
              return
            }
            const hecho = await ejecutar(
              (base) =>
                cerrarRegistro(base, {
                  registroId: enDetalle.id,
                  personaId: sesion.personaId,
                  motivo: motivo.trim(),
                  anular,
                }),
              anular ? 'Registro retirado.' : 'Registro rechazado.',
            )
            if (hecho) setViendo(null)
          }}
        />
      )}
    </div>
  )
}
