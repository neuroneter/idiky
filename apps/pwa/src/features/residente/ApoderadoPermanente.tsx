/**
 * CU-R-23 (RN-227) — El apoderado permanente del propietario.
 * Doc: docs/casos-de-uso/residente.md#cu-r-23
 *
 * Mary, 2026-11-10: *«si hay un propietario el cual tiene apoderado, debe
 * quedar parametrizado en su perfil para evitar cada asamblea solicitar el
 * poder»*. Se deja una vez; lo acepta el apoderado si tiene la app y lo recibe
 * la administración, una vez. Desde ahí, cada asamblea le crea su poder sola.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { registrarApoderadoPermanente, retirarApoderadoPermanente } from '../../datos/repositorio'
import { apoderadoPermanenteVigente, faltaAlApoderadoPermanente } from '../../dominio/reglas'

export function ApoderadoPermanente() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefono, setTelefono] = useState('')
  if (!sesion?.unidadActivaId) return null

  const residencia = bd.residencias.find(
    (r) => r.unidadId === sesion.unidadActivaId && r.personaId === sesion.personaId && r.rol === 'propietario' && !r.cierre,
  )
  // Solo el propietario: el voto es suyo (RN-51).
  if (!residencia) return null
  const permanente = residencia.apoderadoPermanente && !residencia.apoderadoPermanente.retiradoEn ? residencia.apoderadoPermanente : undefined
  const apoderado = permanente ? sel.persona(bd, permanente.apoderadoId) : undefined
  const falta = permanente ? faltaAlApoderadoPermanente(permanente) : undefined
  const noAcepto = permanente?.aceptacion?.estado === 'no_aceptado'

  return (
    <div className="pila">
      <span className="titulo-seccion">Apoderado permanente</span>
      <div className="tarjeta tarjeta--plana">
        {permanente ? (
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            <div className="fila">
              <strong>{sel.nombreCompleto(apoderado)}</strong>
              <span className={apoderadoPermanenteVigente(permanente) ? 'chip chip--exito' : 'chip chip--info'}>
                {noAcepto ? 'No aceptó' : falta === 'aceptacion' ? 'Falta que lo acepte' : falta === 'recepcion' ? 'Falta la administración' : 'Vigente'}
              </span>
            </div>
            <span className="subtitulo">
              {noAcepto
                ? 'No aceptó ser tu apoderado permanente. Puedes retirarlo y dejar a otra persona.'
                : falta
                  ? `${falta === 'aceptacion' ? 'Tiene que aceptarlo en su app, y la administración recibirlo.' : 'La administración tiene que recibirlo.'} Es una sola vez.`
                  : 'Te representa en cada asamblea: su poder se crea solo. Si un día prefieres ir tú, lo quitas en esa asamblea.'}
            </span>
            <button
              className="boton"
              disabled={cargando}
              onClick={() =>
                void ejecutar(
                  (base) => retirarApoderadoPermanente(base, { unidadId: residencia.unidadId, personaId: sesion.personaId }),
                  'Apoderado permanente retirado. Vuelves a votar tú.',
                )
              }
            >
              Retirar apoderado permanente
            </button>
          </div>
        ) : abierto ? (
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            <div className="campo">
              <label htmlFor="ap-nombres">Nombres</label>
              <input id="ap-nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="ap-apellidos">Apellidos</label>
              <input id="ap-apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="ap-documento">Documento</label>
              <input id="ap-documento" inputMode="numeric" value={documento} onChange={(e) => setDocumento(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="ap-telefono">Celular (para avisarle)</label>
              <input id="ap-telefono" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="grupo-botones">
              <button
                className="boton boton--primario"
                disabled={cargando}
                onClick={async () => {
                  const hecho = await ejecutar(
                    (base) =>
                      registrarApoderadoPermanente(base, {
                        unidadId: residencia.unidadId,
                        personaId: sesion.personaId,
                        nombresApoderado: nombres,
                        apellidosApoderado: apellidos,
                        documentoApoderado: documento,
                        telefonoApoderado: telefono,
                      }),
                    'Apoderado permanente registrado.',
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
            <span className="subtitulo">
              Si siempre te representa la misma persona en las asambleas, déjala aquí una vez y no
              tendrás que dar el poder cada vez.
            </span>
            <button className="boton" onClick={() => setAbierto(true)}>
              Dejar un apoderado permanente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
