/**
 * Arma la sesion de una persona a partir de los datos de la copropiedad.
 *
 * La lista `perfilesDemo` solo tiene tres personas, pero en la semilla hay doce
 * residentes: con esto **cualquiera de ellos puede entrar con su documento**, que
 * es lo que hace creible la pantalla de acceso. Si la persona tiene perfil de
 * demostracion se usa ese (trae el rol y la unidad elegidos a proposito); si no,
 * se deduce de su residencia vigente.
 *
 * Devuelve `undefined` cuando la persona no esta vinculada a ninguna unidad: sin
 * unidad no hay nada que mostrarle, y eso es justo lo que dice RN-53.
 */

import type { BaseDatos, PerfilDemo } from '../../dominio/tipos'

export function perfilDe(bd: BaseDatos, personaId: string): PerfilDemo | undefined {
  const conocido = bd.perfilesDemo.find((perfil) => perfil.personaId === personaId)
  if (conocido) return conocido

  const persona = bd.personas.find((p) => p.id === personaId)
  if (!persona) return undefined

  const residencia = bd.residencias.find((r) => r.personaId === personaId && !r.hasta)
  if (!residencia) return undefined

  const unidad = bd.unidades.find((u) => u.id === residencia.unidadId)
  if (!unidad) return undefined

  return {
    id: `perfil-${personaId}`,
    etiqueta: `${persona.nombres} ${persona.apellidos}`,
    descripcion: `${residencia.rol} · ${unidad.torre} ${unidad.numero}`,
    rol: 'residente',
    personaId,
    copropiedadId: unidad.copropiedadId,
    unidadId: unidad.id,
  }
}
