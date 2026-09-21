/**
 * El interior de BLOKY, por ahora vacio a proposito: solo confirma quien entro, a que
 * copropiedad y con que rol (CU-B-01, resultado esperado). Los modulos llegan uno a uno.
 */
import { Logotipo } from '../../componentes/Logotipo'
import { useSesion } from '../../estado/SesionContext'

const ROL = { administrador: 'Administrador', delegado: 'Delegado' }

export function InicioPage() {
  const { sesion, salir } = useSesion()
  if (!sesion) return null
  return (
    <div className="consola">
      <header className="consola__barra">
        <Logotipo inverso tamano="var(--texto-xl)" />
        <span className="consola__producto">BLOKY</span>
        <span className="consola__persona">{sesion.nombre}</span>
        <button type="button" className="boton boton--salida boton--pequeno" onClick={() => void salir()}>Cerrar sesión</button>
      </header>
      <main className="consola__contenido pila">
        <h1>Estás dentro de BLOKY</h1>
        <p className="subtitulo">
          Entraste con {sesion.canal === 'sms' ? 'un código por SMS' : sesion.canal === 'google' ? 'Google' : 'Microsoft'} como documento {sesion.documento}.
          La sesión vence a las {new Date(sesion.venceEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <h2>Tus copropiedades</h2>
        <div className="pila">
          {sesion.copropiedades.map((c) => (
            <div key={c.copropiedadId} className="tarjeta tarjeta--plana fila">
              <strong>{c.nombre}</strong>
              <span className={`chip ${c.rol === 'delegado' ? 'chip--acento' : 'chip--marca'}`}>{ROL[c.rol]}</span>
            </div>
          ))}
        </div>
        <p className="subtitulo">Los módulos de la copropiedad se van a ir abriendo aquí, uno por uno.</p>
      </main>
    </div>
  )
}
