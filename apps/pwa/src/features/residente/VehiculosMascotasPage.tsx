/**
 * CU-R-15 — Registrar mis vehículos y mascotas (RN-230, RN-231).
 * Doc: docs/casos-de-uso/residente.md#cu-r-15
 *
 * Los registra quien maneja la unidad: el propietario o el arrendatario. La
 * mascota tiene perfil y no usuario, como en BLOKY (RN-321). Nada se borra: se
 * da de baja (RN-61).
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { darDeBajaVehiculoOMascota, registrarMascota, registrarVehiculo } from '../../datos/repositorio'
import type { EspecieMascota, TipoVehiculo } from '../../dominio/tipos'
import { CapturaFoto } from '../../componentes/CapturaFoto'
import { BotonVolver } from '../../componentes/BotonVolver'
import { EstadoVacio } from '../../componentes/EstadoVacio'

const TIPOS: Array<[TipoVehiculo, string]> = [
  ['carro', 'Carro'],
  ['moto', 'Moto'],
  ['bicicleta', 'Bicicleta'],
]
const ESPECIES: Array<[EspecieMascota, string]> = [
  ['perro', 'Perro'],
  ['gato', 'Gato'],
  ['otro', 'Otra'],
]

export function VehiculosMascotasPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [agregando, setAgregando] = useState<'vehiculo' | 'mascota' | null>(null)
  const [tipo, setTipo] = useState<TipoVehiculo>('carro')
  const [placa, setPlaca] = useState('')
  const [marca, setMarca] = useState('')
  const [color, setColor] = useState('')
  const [parqueadero, setParqueadero] = useState('')
  const [nombre, setNombre] = useState('')
  const [especie, setEspecie] = useState<EspecieMascota>('perro')
  const [raza, setRaza] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  if (!sesion?.unidadActivaId) return null

  const unidad = sel.unidad(bd, sesion.unidadActivaId)
  const vehiculos = sel.vehiculosDeUnidad(bd, sesion.unidadActivaId)
  const mascotas = sel.mascotasDeUnidad(bd, sesion.unidadActivaId)
  const miRol = sel.residenciasDeUnidad(bd, sesion.unidadActivaId).find((r) => r.personaId === sesion.personaId)?.rol
  const puede = miRol === 'propietario' || miRol === 'arrendatario'

  function limpiar() {
    setAgregando(null)
    setPlaca('')
    setMarca('')
    setColor('')
    setParqueadero('')
    setNombre('')
    setRaza('')
    setFoto(null)
  }

  function darDeBaja(tipoRegistro: 'vehiculo' | 'mascota', id: string) {
    void ejecutar(
      (base) => darDeBajaVehiculoOMascota(base, { tipo: tipoRegistro, id, personaId: sesion!.personaId }),
      'Dado de baja. Queda en el historial.',
    )
  }

  return (
    <>
      <div className="encabezado-pagina">
        <BotonVolver />
      </div>

      <div className="pila">
        <span className="titulo-seccion">Vehículos</span>
        {vehiculos.length === 0 ? (
          <EstadoVacio titulo="Sin vehículos" detalle="Registra el carro, la moto o la bicicleta de tu unidad." />
        ) : (
          vehiculos.map((v) => (
            <div key={v.id} className="tarjeta tarjeta--plana">
              <div className="fila">
                <div className="columna">
                  <strong>{v.placa ?? 'Bicicleta'}</strong>
                  <span className="subtitulo">
                    {TIPOS.find(([t]) => t === v.tipo)?.[1]}
                    {v.marca ? ` · ${v.marca}` : ''}
                    {v.color ? ` · ${v.color}` : ''}
                    {v.parqueadero ? ` · parqueadero ${v.parqueadero}` : ''}
                  </span>
                </div>
                {puede && (
                  <button className="boton boton--pequeno" disabled={cargando} onClick={() => darDeBaja('vehiculo', v.id)}>
                    Dar de baja
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pila">
        <span className="titulo-seccion">Mascotas</span>
        {mascotas.length === 0 ? (
          <EstadoVacio titulo="Sin mascotas" detalle="Registra a las mascotas que viven en tu unidad." />
        ) : (
          mascotas.map((m) => (
            <div key={m.id} className="tarjeta tarjeta--plana">
              <div className="fila">
                <div className="fila" style={{ gap: 'var(--e2)', justifyContent: 'flex-start' }}>
                  {m.foto && (
                    <img src={m.foto} alt={m.nombre} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <div className="columna">
                    <strong>{m.nombre}</strong>
                    <span className="subtitulo">
                      {ESPECIES.find(([e]) => e === m.especie)?.[1]}
                      {m.raza ? ` · ${m.raza}` : ''}
                    </span>
                  </div>
                </div>
                {puede && (
                  <button className="boton boton--pequeno" disabled={cargando} onClick={() => darDeBaja('mascota', m.id)}>
                    Dar de baja
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {puede && !agregando && (
        <div className="grupo-botones">
          <button className="boton boton--primario" onClick={() => setAgregando('vehiculo')}>
            Registrar un vehículo
          </button>
          <button className="boton" onClick={() => setAgregando('mascota')}>
            Registrar una mascota
          </button>
        </div>
      )}

      {agregando === 'vehiculo' && (
        <div className="tarjeta">
          <strong>Nuevo vehículo</strong>
          <span className="segmentos" style={{ display: 'inline-flex', margin: 'var(--e2) 0' }}>
            {TIPOS.map(([t, texto]) => (
              <button key={t} type="button" className="segmento" aria-current={tipo === t ? 'page' : undefined} onClick={() => setTipo(t)}>
                {texto}
              </button>
            ))}
          </span>
          {tipo !== 'bicicleta' && (
            <div className="campo">
              <label htmlFor="veh-placa">Placa</label>
              <input id="veh-placa" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder={tipo === 'carro' ? 'ABC123' : 'ABC12D'} />
            </div>
          )}
          <div className="campo">
            <label htmlFor="veh-marca">Marca (opcional)</label>
            <input id="veh-marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="veh-color">Color (opcional)</label>
            <input id="veh-color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          {unidad && unidad.parqueaderos.length > 0 && (
            <div className="campo">
              <label htmlFor="veh-parqueadero">Parqueadero (opcional)</label>
              <select id="veh-parqueadero" value={parqueadero} onChange={(e) => setParqueadero(e.target.value)}>
                <option value="">Sin parqueadero</option>
                {unidad.parqueaderos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grupo-botones">
            <button
              className="boton boton--primario"
              disabled={cargando}
              onClick={async () => {
                const hecho = await ejecutar(
                  (base) =>
                    registrarVehiculo(base, {
                      unidadId: sesion.unidadActivaId!,
                      personaId: sesion.personaId,
                      tipo,
                      placa,
                      marca,
                      color,
                      parqueadero: parqueadero || undefined,
                    }),
                  'Vehículo registrado.',
                )
                if (hecho) limpiar()
              }}
            >
              Guardar
            </button>
            <button className="boton" onClick={limpiar}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {agregando === 'mascota' && (
        <div className="tarjeta">
          <strong>Nueva mascota</strong>
          <div className="campo" style={{ marginTop: 'var(--e2)' }}>
            <label htmlFor="mas-nombre">Nombre</label>
            <input id="mas-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <span className="segmentos" style={{ display: 'inline-flex', margin: 'var(--e2) 0' }}>
            {ESPECIES.map(([e, texto]) => (
              <button key={e} type="button" className="segmento" aria-current={especie === e ? 'page' : undefined} onClick={() => setEspecie(e)}>
                {texto}
              </button>
            ))}
          </span>
          <div className="campo">
            <label htmlFor="mas-raza">Raza (opcional)</label>
            <input id="mas-raza" value={raza} onChange={(e) => setRaza(e.target.value)} />
          </div>
          <CapturaFoto etiqueta="Foto (opcional)" ayuda="Ayuda a reconocerla si se pierde." valor={foto} alCambiar={setFoto} />
          <div className="grupo-botones">
            <button
              className="boton boton--primario"
              disabled={cargando}
              onClick={async () => {
                const hecho = await ejecutar(
                  (base) =>
                    registrarMascota(base, {
                      unidadId: sesion.unidadActivaId!,
                      personaId: sesion.personaId,
                      nombre,
                      especie,
                      raza,
                      foto: foto ?? undefined,
                    }),
                  'Mascota registrada.',
                )
                if (hecho) limpiar()
              }}
            >
              Guardar
            </button>
            <button className="boton" onClick={limpiar}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
