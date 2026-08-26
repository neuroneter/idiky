/**
 * Chips de estado. Centralizan el color y el texto visible de cada estado del
 * dominio para que se vean igual en la app del residente y en la consola.
 */

import type {
  CategoriaComunicado,
  EstadoCorrespondencia,
  EstadoCuota,
  EstadoPago,
  EstadoPqrs,
  EstadoReserva,
  EstadoVisitante,
  TipoPqrs,
} from '../dominio/tipos'

type Variante = '' | 'exito' | 'alerta' | 'error' | 'info' | 'marca'

function Chip({ texto, variante }: { texto: string; variante: Variante }) {
  return <span className={`chip${variante ? ` chip--${variante}` : ''}`}>{texto}</span>
}

const CUOTA: Record<EstadoCuota, [string, Variante]> = {
  pendiente: ['Pendiente', 'alerta'],
  abonada: ['Abonada', 'info'],
  pagada: ['Pagada', 'exito'],
  vencida: ['Vencida', 'error'],
}

export function ChipCuota({ estado }: { estado: EstadoCuota }) {
  const [texto, variante] = CUOTA[estado]
  return <Chip texto={texto} variante={variante} />
}

const PAGO: Record<EstadoPago, [string, Variante]> = {
  reportado: ['Por conciliar', 'alerta'],
  aplicado: ['Aplicado', 'exito'],
  anulado: ['Anulado', 'error'],
}

export function ChipPago({ estado }: { estado: EstadoPago }) {
  const [texto, variante] = PAGO[estado]
  return <Chip texto={texto} variante={variante} />
}

const RESERVA: Record<EstadoReserva, [string, Variante]> = {
  solicitada: ['Por aprobar', 'alerta'],
  confirmada: ['Confirmada', 'exito'],
  rechazada: ['Rechazada', 'error'],
  cancelada: ['Cancelada', ''],
}

export function ChipReserva({ estado }: { estado: EstadoReserva }) {
  const [texto, variante] = RESERVA[estado]
  return <Chip texto={texto} variante={variante} />
}

const PQRS: Record<EstadoPqrs, [string, Variante]> = {
  abierta: ['Abierta', 'info'],
  en_gestion: ['En gestion', 'alerta'],
  resuelta: ['Resuelta', 'exito'],
  cerrada: ['Cerrada', ''],
}

export function ChipPqrs({ estado }: { estado: EstadoPqrs }) {
  const [texto, variante] = PQRS[estado]
  return <Chip texto={texto} variante={variante} />
}

const TIPO_PQRS: Record<TipoPqrs, string> = {
  peticion: 'Peticion',
  queja: 'Queja',
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
}

export function ChipTipoPqrs({ tipo }: { tipo: TipoPqrs }) {
  return <Chip texto={TIPO_PQRS[tipo]} variante="" />
}

const COMUNICADO: Record<CategoriaComunicado, [string, Variante]> = {
  general: ['General', ''],
  urgente: ['Urgente', 'error'],
  mantenimiento: ['Mantenimiento', 'alerta'],
  asamblea: ['Asamblea', 'marca'],
}

export function ChipComunicado({ categoria }: { categoria: CategoriaComunicado }) {
  const [texto, variante] = COMUNICADO[categoria]
  return <Chip texto={texto} variante={variante} />
}

const CORRESPONDENCIA: Record<EstadoCorrespondencia, [string, Variante]> = {
  en_porteria: ['En porteria', 'alerta'],
  entregada: ['Entregada', 'exito'],
}

export function ChipCorrespondencia({ estado }: { estado: EstadoCorrespondencia }) {
  const [texto, variante] = CORRESPONDENCIA[estado]
  return <Chip texto={texto} variante={variante} />
}

const VISITANTE: Record<EstadoVisitante, [string, Variante]> = {
  activo: ['Vigente', 'exito'],
  vencido: ['Vencido', ''],
  revocado: ['Revocado', 'error'],
}

export function ChipVisitante({ estado }: { estado: EstadoVisitante }) {
  const [texto, variante] = VISITANTE[estado]
  return <Chip texto={texto} variante={variante} />
}
