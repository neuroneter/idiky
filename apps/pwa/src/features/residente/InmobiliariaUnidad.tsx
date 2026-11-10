/**
 * CU-R-33 (RN-228) — El propietario marca si tiene el apartamento por
 * inmobiliaria, y si ella asiste a las asambleas y paga la administración.
 * Doc: docs/casos-de-uso/residente.md#cu-r-33
 *
 * Mary, 2026-11-10: *«en las opciones para el propietario, crear la opción para
 * elegir si tiene el apartamento por inmobiliaria y si esta es la que asiste a
 * asambleas y paga la administración»*, y *«debe existir algún soporte»*.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { registrarInmobiliaria, retirarInmobiliaria } from '../../datos/repositorio'
import { CapturaFoto } from '../../componentes/CapturaFoto'

export function InmobiliariaUnidad() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [nit, setNit] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [asiste, setAsiste] = useState(true)
  const [paga, setPaga] = useState(true)
  const [imagen, setImagen] = useState<string | null>(null)
  if (!sesion?.unidadActivaId) return null

  const residencia = bd.residencias.find(
    (r) => r.unidadId === sesion.unidadActivaId && r.personaId === sesion.personaId && r.rol === 'propietario' && !r.cierre,
  )
  if (!residencia) return null
  const registrada = residencia.inmobiliaria && !residencia.inmobiliaria.retiradaEn ? residencia.inmobiliaria : undefined
  const activa = registrada && registrada.revision.estado !== 'rechazada' ? registrada : undefined
  const rechazada = registrada?.revision.estado === 'rechazada' ? registrada : undefined

  return (
    <div className="pila">
      <span className="titulo-seccion">Inmobiliaria</span>
      <div className="tarjeta tarjeta--plana">
        {activa ? (
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            <div className="fila">
              <strong>{sel.nombreCompleto(sel.persona(bd, activa.personaId))}</strong>
              <span className={activa.revision.estado === 'recibida' ? 'chip chip--exito' : 'chip chip--info'}>
                {activa.revision.estado === 'recibida' ? 'Recibida' : 'La revisa la administración'}
              </span>
            </div>
            <span className="subtitulo">
              {activa.asisteAsambleas ? 'Asiste a las asambleas por ti' : 'Tú asistes a las asambleas'} ·{' '}
              {activa.pagaAdministracion ? 'paga la administración' : 'tú pagas la administración'}.
              {activa.revision.estado !== 'recibida' ? ' Cuando la administración revise el soporte, empieza a valer.' : ''}
            </span>
            <button
              className="boton"
              disabled={cargando}
              onClick={() =>
                void ejecutar(
                  (base) => retirarInmobiliaria(base, { unidadId: residencia.unidadId, personaId: sesion.personaId }),
                  'Inmobiliaria retirada. Vuelves a manejar tu unidad tú.',
                )
              }
            >
              Ya no la maneja una inmobiliaria
            </button>
          </div>
        ) : abierto ? (
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            <div className="campo">
              <label htmlFor="inm-nombre">Nombre de la inmobiliaria</label>
              <input id="inm-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="inm-nit">NIT</label>
              <input id="inm-nit" inputMode="numeric" value={nit} onChange={(e) => setNit(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="inm-telefono">Celular de la inmobiliaria</label>
              <input id="inm-telefono" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="inm-email">Correo (opcional)</label>
              <input id="inm-email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <label className="fila" style={{ gap: 'var(--e2)', justifyContent: 'flex-start' }}>
              <input type="checkbox" checked={asiste} onChange={(e) => setAsiste(e.target.checked)} />
              <span className="subtitulo">La inmobiliaria asiste a las asambleas por mí</span>
            </label>
            <label className="fila" style={{ gap: 'var(--e2)', justifyContent: 'flex-start' }}>
              <input type="checkbox" checked={paga} onChange={(e) => setPaga(e.target.checked)} />
              <span className="subtitulo">La inmobiliaria paga la administración</span>
            </label>
            <CapturaFoto
              etiqueta="Soporte"
              ayuda="Foto del contrato con la inmobiliaria o del poder. La administración lo revisa antes de recibirla."
              valor={imagen}
              alCambiar={setImagen}
            />
            <div className="grupo-botones">
              <button
                className="boton boton--primario"
                disabled={cargando || !imagen}
                onClick={async () => {
                  const hecho = await ejecutar(
                    (base) =>
                      registrarInmobiliaria(base, {
                        unidadId: residencia.unidadId,
                        personaId: sesion.personaId,
                        nombre,
                        nit,
                        telefono,
                        email,
                        asisteAsambleas: asiste,
                        pagaAdministracion: paga,
                        imagen: imagen ?? '',
                      }),
                    'Inmobiliaria registrada. La administración revisará el soporte.',
                  )
                  if (hecho) setAbierto(false)
                }}
              >
                Guardar
              </button>
              <button className="boton" onClick={() => setAbierto(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            {rechazada && (
              <p className="acceso__nota">
                La administración no recibió la inmobiliaria que registraste
                {rechazada.revision.motivo ? `: «${rechazada.revision.motivo}»` : ''}. Puedes registrarla de nuevo.
              </p>
            )}
            <span className="subtitulo">
              ¿Tu apartamento lo maneja una inmobiliaria? Regístrala y escoge si ella asiste a las
              asambleas y paga la administración.
            </span>
            <button className="boton" onClick={() => setAbierto(true)}>
              Mi apartamento lo maneja una inmobiliaria
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
