/**
 * CU-P-03 — Reconocer a quien vive aquí.
 * Doc: docs/casos-de-uso/porteria.md#cu-p-03
 *
 * *«La portería debe poder ver la foto porque, ¿cómo reconoce al que ingresa?»*
 * (Mary, 2026-09-07). Es su trabajo: un portero que nunca vio la cara de quien
 * vive ahí no puede distinguirlo de un desconocido — y menos de noche, o en un
 * turno nuevo, o en una torre de doce apartamentos donde entra gente todo el día.
 *
 * **Ve el rostro, nunca el documento** (RN-67). Es la diferencia entre
 * *reconocerte* y *tener tu identidad*: para lo primero basta una cara; lo
 * segundo es un dato que la portería no necesita, y que además suele quedar en
 * manos de personal de una empresa externa que rota.
 *
 * Por eso esta pantalla no tiene números de cédula, ni teléfonos, ni saldos.
 * Tiene caras, nombres y unidades: lo que hace falta para abrir o no abrir la
 * puerta.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { etiquetaUnidad, residenciaVigente } from '../../dominio/reglas'
import { iniciales } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function ResidentesPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const [busqueda, setBusqueda] = useState('')

  if (!sesion) return null

  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)
  const porUnidad = new Map(unidades.map((unidad) => [unidad.id, unidad]))

  const gente = bd.residencias
    .filter((residencia) => porUnidad.has(residencia.unidadId) && residenciaVigente(residencia))
    .map((residencia) => {
      const persona = sel.persona(bd, residencia.personaId)
      const registro = sel.registro(bd, residencia.registroId)
      return {
        id: residencia.id,
        nombre: nombreCompleto(persona),
        nombres: persona?.nombres ?? '',
        apellidos: persona?.apellidos ?? '',
        unidad: porUnidad.get(residencia.unidadId),
        rol: residencia.rol,
        // Solo el rostro. La foto del documento no se pasa a esta pantalla ni
        // por descuido: lo que no llega aquí no se puede mostrar aquí.
        rostro: registro?.fotoPersona?.imagen,
      }
    })
    .sort((a, b) => (a.unidad && b.unidad ? etiquetaUnidad(a.unidad).localeCompare(etiquetaUnidad(b.unidad)) : 0))

  const texto = busqueda.trim().toLowerCase()
  const visibles = texto
    ? gente.filter(
        (fila) =>
          fila.nombre.toLowerCase().includes(texto) ||
          (fila.unidad && etiquetaUnidad(fila.unidad).toLowerCase().includes(texto)),
      )
    : gente

  const conFoto = gente.filter((fila) => fila.rostro).length

  return (
    <div className="pila">
      <div className="campo">
        <label htmlFor="buscar">Busca por nombre o por unidad</label>
        <input
          id="buscar"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Torre 1, 402, María…"
          autoComplete="off"
        />
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio titulo="Nadie con ese nombre" detalle="Prueba con la torre o el número." />
      ) : (
        <div className="rejilla-rostros">
          {visibles.map((fila) => (
            <div key={fila.id} className="tarjeta rostro">
              {fila.rostro ? (
                <img src={fila.rostro} alt={fila.nombre} className="rostro__foto" />
              ) : (
                /* Sin foto no se inventa nada: se muestran las iniciales y se
                   nota a simple vista que de esta persona no hay cara. */
                <span className="rostro__sin-foto">
                  {iniciales(fila.nombres, fila.apellidos)}
                </span>
              )}
              <div className="columna" style={{ gap: 2 }}>
                <strong>{fila.nombre}</strong>
                <span className="subtitulo">
                  {fila.unidad ? etiquetaUnidad(fila.unidad) : 'Sin unidad'}
                </span>
                <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                  {fila.rol === 'propietario'
                    ? 'Propietario'
                    : fila.rol === 'arrendatario'
                      ? 'Arrendatario'
                      : 'Residente temporal'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Se dice de dónde salen las fotos y por qué faltan las demás, en vez de
          dejar que el portero crea que la app está incompleta. */}
      <div className="tarjeta tarjeta--plana">
        <div className="tarjeta__cuerpo" style={{ alignItems: 'flex-start' }}>
          <Icono nombre="alerta" tamano={18} className="tenue" />
          <div className="columna">
            <span className="subtitulo">
              Hay foto de {conFoto} de {gente.length} residentes. La foto aparece cuando la
              persona la adjunta al registrarse; quienes ya vivían aquí antes no tienen.
            </span>
            <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
              Aquí solo se ve la cara. La foto del documento de identidad no es de la portería
              (RN-67).
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
