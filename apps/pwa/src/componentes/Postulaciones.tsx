/**
 * PN-23 — Las postulaciones de un punto que es una elección (CU-A-12, CU-R-21).
 * Doc: docs/casos-de-uso/residente.md#cu-r-21 · docs/casos-de-uso/administrador.md#cu-a-12
 *
 * El propietario ve quién se postula y por qué, y se postula desde la app
 * (Mary, 2026-11-23: competir en las asambleas ordinarias). La administración
 * registra al revisor fiscal, que es de afuera, y a quien se postule en la sala.
 * Lo que no aplica al perfil **no se muestra** (Mary, 2026-11-20).
 */

import { useState } from 'react'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import { postularACargo, retirarPostulacion } from '../datos/repositorio'
import { CARGOS_ELECCION, motivoPostulacionInvalida, postulacionesVigentes, votacionVigente } from '../dominio/reglas'
import type { Asamblea, PuntoOrdenDelDia, RolResidencia } from '../dominio/tipos'

export function Postulaciones({
  asamblea,
  punto,
  modo,
  rol,
}: {
  asamblea: Asamblea
  punto: PuntoOrdenDelDia
  modo: 'residente' | 'admin'
  rol?: RolResidencia
}) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [presentacion, setPresentacion] = useState('')
  const [integrantes, setIntegrantes] = useState('')
  const [matricula, setMatricula] = useState('')
  if (!sesion || !punto.eleccion) return null

  const cargo = CARGOS_ELECCION[punto.eleccion]
  const vigentes = postulacionesVigentes(bd.postulaciones, punto.id)
  const hayVotacion = !!votacionVigente(bd.votaciones, punto.id)
  const admin = modo === 'admin'
  const mia = vigentes.find((p) => p.postuladaPor === sesion.personaId && p.personaId)
  // Si el perfil no puede postularse a este cargo, el botón no aparece.
  const puedePostular = !motivoPostulacionInvalida({
    asamblea,
    punto,
    hayVotacion,
    esAdministracion: admin,
    rol,
    yaPostulado: !!mia,
    nombre: 'x',
    presentacion: 'xxxxxxxxxx',
    matricula: 'x',
  })

  const cerrar = () => {
    setAbierto(false)
    setNombre('')
    setPresentacion('')
    setIntegrantes('')
    setMatricula('')
  }

  return (
    <div className="columna" style={{ gap: 'var(--e2)', marginTop: 'var(--e2)' }}>
      <span className="subtitulo">
        Elección: <strong>{cargo.nombre}</strong>. {cargo.quienes} ({cargo.fuente})
      </span>
      {vigentes.length === 0 ? (
        <span className="tenue">Todavía no hay postulaciones.</span>
      ) : (
        <div className="lista lista--compacta">
          {vigentes.map((p) => (
            <div key={p.id} className="tarjeta tarjeta--plana">
              <strong>{p.nombre}</strong>
              {p.integrantes && <span className="subtitulo">Integrantes: {p.integrantes.join(', ')}</span>}
              {p.matricula && <span className="subtitulo">Matrícula profesional {p.matricula}</span>}
              <span>{p.presentacion}</span>
              {!hayVotacion && (admin || p.id === mia?.id) && (
                <div>
                  <button
                    className="boton boton--pequeno"
                    disabled={cargando}
                    onClick={() =>
                      void ejecutar(
                        (base) => retirarPostulacion(base, { postulacionId: p.id, personaId: sesion.personaId }),
                        'Postulación retirada.',
                      )
                    }
                  >
                    {admin ? 'Retirar postulación' : 'Retirar mi postulación'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {hayVotacion && <span className="tenue">Las postulaciones se cerraron: la votación ya está preparada.</span>}

      {puedePostular && !abierto && (
        <div>
          <button className="boton boton--pequeno boton--primario" onClick={() => setAbierto(true)}>
            {admin ? 'Registrar candidato' : 'Postularme'}
          </button>
        </div>
      )}
      {puedePostular && abierto && (
        <div className="tarjeta tarjeta--plana">
          {admin && (
            <div className="campo">
              <label htmlFor={`cand-${punto.id}`}>Nombre del candidato</label>
              <input id={`cand-${punto.id}`} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
          )}
          {punto.eleccion === 'revisor_fiscal' && (
            <div className="campo">
              <label htmlFor={`mat-${punto.id}`}>Matrícula profesional</label>
              <input id={`mat-${punto.id}`} value={matricula} onChange={(e) => setMatricula(e.target.value)} />
            </div>
          )}
          <div className="campo">
            <label htmlFor={`pres-${punto.id}`}>Por qué votar por esta postulación</label>
            <textarea
              id={`pres-${punto.id}`}
              rows={3}
              value={presentacion}
              onChange={(e) => setPresentacion(e.target.value)}
              placeholder="Una o dos frases: lo leen los propietarios antes de la asamblea."
            />
          </div>
          {punto.eleccion === 'consejo' && (
            <div className="campo">
              <label htmlFor={`int-${punto.id}`}>Si va en plancha: los demás integrantes (uno por línea)</label>
              <textarea id={`int-${punto.id}`} rows={2} value={integrantes} onChange={(e) => setIntegrantes(e.target.value)} />
              <span className="ayuda-campo">Déjalo vacío si te postulas solo.</span>
            </div>
          )}
          <div className="grupo-botones">
            <button
              className="boton boton--primario"
              disabled={cargando}
              onClick={() =>
                void ejecutar(
                  (base) =>
                    postularACargo(base, {
                      asambleaId: asamblea.id,
                      puntoId: punto.id,
                      personaId: sesion.personaId,
                      unidadId: admin ? undefined : sesion.unidadActivaId,
                      nombre: admin ? nombre : undefined,
                      presentacion,
                      integrantes: integrantes.split('\n'),
                      matricula,
                    }),
                  admin ? 'Candidato registrado.' : 'Listo: ya estás postulado. Los propietarios verán tu presentación.',
                ).then((hecha) => hecha && cerrar())
              }
            >
              {admin ? 'Registrar' : 'Postularme'}
            </button>
            <button className="boton" onClick={cerrar}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
