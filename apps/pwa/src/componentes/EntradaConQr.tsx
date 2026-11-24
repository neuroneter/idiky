/**
 * PN-25 — Entrada con QR a la asamblea presencial (CU-A-17, CU-R-21; Mary, 2026-11-23).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-17 · docs/casos-de-uso/residente.md#cu-r-21
 *
 * En la entrada del salón ya no se busca a nadie en una lista de papel: el
 * propietario —o su apoderado— muestra su código, la administración lo lee y
 * la asistencia queda registrada con el coeficiente de la unidad. El quórum se
 * ve subir en el momento.
 */

import { useState } from 'react'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { registrarLlegadaConCodigo } from '../datos/repositorio'
import { admiteAsistencia, codigoAsistencia, formasDeAsistir, poderVigente } from '../dominio/reglas'
import type { Asamblea } from '../dominio/tipos'
import { CodigoVisual } from './CodigoVisual'
import { EscanearQr } from '../features/porteria/EscanearQr'

/** El código del propietario, y el de cada unidad que representa con poder. */
export function MiCodigoDeEntrada({ asamblea, esPropietario }: { asamblea: Asamblea; esPropietario: boolean }) {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  if (!formasDeAsistir(asamblea.modalidad).includes('presencial')) return null
  if (asamblea.estado !== 'convocada' && asamblea.estado !== 'instalada') return null

  const codigos: Array<{ unidadId: string; texto: string }> = []
  if (esPropietario && sesion.unidadActivaId) codigos.push({ unidadId: sesion.unidadActivaId, texto: 'Tu unidad' })
  for (const poder of bd.poderes.filter((p) => p.asambleaId === asamblea.id && p.apoderadoId === sesion.personaId && poderVigente(p))) {
    const u = sel.unidad(bd, poder.unidadId)
    codigos.push({ unidadId: poder.unidadId, texto: u ? `Con poder de ${u.torre}, ${u.tipo} ${u.numero}` : 'Con poder' })
  }
  if (codigos.length === 0) return null

  return (
    <div className="tarjeta">
      <span className="titulo-seccion">Tu código para entrar</span>
      <p className="subtitulo">Muéstralo en la entrada del salón: tu llegada queda registrada al instante.</p>
      <div className="fila" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 'var(--e4)' }}>
        {codigos.map((c) => (
          <div key={c.unidadId} className="columna" style={{ alignItems: 'center', gap: 'var(--e1)' }}>
            <CodigoVisual codigo={codigoAsistencia({ asambleaId: asamblea.id, unidadId: c.unidadId, personaId: sesion.personaId })} tamano={180} />
            <span className="subtitulo">{c.texto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** La administración, en la entrada: lee el código con la cámara o lo escribe. */
export function RegistrarLlegadaQr({ asamblea }: { asamblea: Asamblea }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [codigo, setCodigo] = useState('')
  const [ultima, setUltima] = useState<string | null>(null)
  if (!sesion) return null
  if (!formasDeAsistir(asamblea.modalidad).includes('presencial') || !admiteAsistencia(asamblea)) return null

  const registrar = async (texto: string) => {
    const hecho = await ejecutar(
      (base) => registrarLlegadaConCodigo(base, { asambleaId: asamblea.id, codigo: texto, personaId: sesion.personaId }),
      'Llegada registrada.',
    )
    if (hecho) {
      const u = sel.unidad(bd, hecho.unidadId)
      const p = sel.persona(bd, hecho.personaId)
      setUltima(`${u ? `${u.torre}, ${u.tipo} ${u.numero}` : ''} · ${p ? `${p.nombres} ${p.apellidos}` : ''}${hecho.poderId ? ' (con poder)' : ''}`)
      setCodigo('')
    }
  }

  return (
    <div className="tarjeta tarjeta--plana">
      <strong>Registrar la llegada con QR</strong>
      <p className="subtitulo">Lee el código que trae el propietario o su apoderado en la app.</p>
      <div className="fila" style={{ gap: 'var(--e2)', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
        <EscanearQr alLeer={(texto) => void registrar(texto)} />
        <input
          aria-label="Código de entrada"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="O escribe el código"
          style={{ flex: 1, minWidth: 180 }}
        />
        <button className="boton boton--pequeno boton--primario" disabled={cargando || !codigo.trim()} onClick={() => void registrar(codigo)}>
          Registrar
        </button>
      </div>
      {ultima && <p className="acceso__nota" style={{ marginTop: 'var(--e2)' }}>Llegó: {ultima}</p>}
    </div>
  )
}
