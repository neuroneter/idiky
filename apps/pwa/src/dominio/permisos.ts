/**
 * PN-29 — Qué ve y qué hace cada usuario de IDIKY, por módulo (Mary, 2026-11-26).
 *
 * Es la tabla **obligatoria** de `docs/recursos/roles-de-alice.md` §4 bis, tal cual:
 * si cambia allá, cambia aquí el mismo día, y **un cambio se le pregunta a Mary**.
 * En el producto la aplican la matriz de BOB y el middleware en cada petición
 * (ADR-0034); en la maqueta, los menús y las pantallas la leen de aquí para mostrar
 * solo lo que le toca a cada uno (Mary, 2026-11-20: lo que no aplica no se muestra).
 *
 * Funciones puras: sin datos del demo, sin pantallas.
 */

export type UsuarioIdiky =
  | 'administrador_idiky'
  | 'administrador'
  | 'delegado'
  | 'presidente_consejo'
  | 'consejero'
  | 'porteria'
  | 'auxiliar_administrativo'
  | 'contador'
  | 'revisor_fiscal'
  | 'piscinero'
  | 'aseo'
  | 'mantenimiento'
  | 'propietario'
  | 'arrendatario'
  | 'inmobiliaria'
  | 'operador'
  | 'visitante'
  | 'familiar'

export type ModuloIdiky =
  | 'contrato'
  | 'estructura'
  | 'usuarios'
  | 'cartera'
  | 'paz_y_salvo'
  | 'contabilidad'
  | 'cuentas_claras'
  | 'asambleas'
  | 'votar'
  | 'reservas'
  | 'pqrs'
  | 'comunicados'
  | 'visitantes'
  | 'correspondencia'
  | 'minuta'
  | 'trasteos'
  | 'documentos'
  | 'pedir_ayuda'
  | 'clasificados'
  | 'vehiculos'

/**
 * Las letras de la tabla:
 * - `G` gestiona todo el edificio · `V` ve todo el edificio
 * - `S` lo de su unidad: lo ve y lo pide · `s` solo ve lo de su unidad
 * - `-` no lo ve: no se le muestra
 * - `Sop` solo como soporte, con pase y motivo (ADR-0034)
 * - `Prep` prepara y lo aprueba el administrador · `Ley` lo que dice la ley (vota el propietario)
 * - `Pod` solo con poder del propietario · `Mod` modera · `Atn` atiende
 * - `Par` solo una parte (el piscinero, la piscina; el visitante, si es residente temporal)
 */
export type Nivel = 'G' | 'V' | 'S' | 's' | '-' | 'Sop' | 'Prep' | 'Ley' | 'Pod' | 'Mod' | 'Atn' | 'Par'

export const MODULOS: ModuloIdiky[] = [
  'contrato', 'estructura', 'usuarios', 'cartera', 'paz_y_salvo', 'contabilidad', 'cuentas_claras',
  'asambleas', 'votar', 'reservas', 'pqrs', 'comunicados', 'visitantes', 'correspondencia', 'minuta',
  'trasteos', 'documentos', 'pedir_ayuda', 'clasificados', 'vehiculos',
]

/** Una fila por usuario, en el orden de `MODULOS` (la §4 bis, columna por columna). */
const FILAS: Record<UsuarioIdiky, string> = {
  //                      con est usu car paz cnt cue asa vot res pqr com vis cor min tra doc ayu cla veh
  administrador_idiky:   'G   Sop G   Sop Sop -   -   Sop -   Sop Sop Sop Sop Sop Sop Sop Sop -   Sop Sop',
  administrador:         'V   G   G   G   G   V   G   G   -   G   G   G   V   G   V   G   G   V   Mod G',
  delegado:              'V   G   G   G   G   V   G   G   -   G   G   G   V   G   V   G   G   V   Mod G',
  presidente_consejo:    '-   V   -   V   V   V   V   V   Ley V   V   V   -   -   V   V   V   -   -   -',
  consejero:             '-   V   -   V   V   V   V   V   Ley V   V   V   -   -   V   V   V   -   -   -',
  porteria:              '-   -   -   -   -   -   -   -   -   V   -   V   G   G   G   V   -   Atn -   V',
  auxiliar_administrativo:'-  V   V   V   Prep -   V   V   -   G   G   G   V   G   V   G   G   V   -   G',
  contador:              '-   V   -   G   G   G   G   V   -   -   -   V   -   -   -   -   V   -   -   -',
  revisor_fiscal:        '-   V   -   V   V   V   V   V   -   -   -   V   -   -   V   -   V   -   -   -',
  piscinero:             '-   -   -   -   -   -   -   -   -   Par -   V   -   -   Par -   -   -   -   -',
  aseo:                  '-   -   -   -   -   -   -   -   -   V   -   V   -   -   S   -   -   -   -   -',
  mantenimiento:         '-   -   -   -   -   -   -   -   -   V   Atn V   -   -   S   V   V   -   -   -',
  propietario:           '-   -   S   S   S   -   V   S   Ley S   S   V   S   s   -   S   V   S   S   S',
  arrendatario:          '-   -   S   S   S   -   V   Pod Pod S   S   V   S   s   -   S   V   S   S   S',
  inmobiliaria:          '-   -   S   S   S   -   s   Pod Pod S   S   V   S   s   -   S   V   -   -   -',
  operador:              '-   -   S   -   -   -   -   -   -   S   S   V   S   s   -   -   V   S   -   s',
  visitante:             '-   -   -   -   -   -   -   -   -   -   -   Par s   -   -   -   -   Par -   -',
  familiar:              '-   -   -   -   -   -   V   -   -   -   -   V   s   s   -   -   V   S   S   s',
}

const MATRIZ: Record<UsuarioIdiky, Record<ModuloIdiky, Nivel>> = Object.fromEntries(
  Object.entries(FILAS).map(([usuario, fila]) => {
    const celdas = fila.trim().split(/\s+/)
    return [usuario, Object.fromEntries(MODULOS.map((m, i) => [m, celdas[i] as Nivel]))]
  }),
) as Record<UsuarioIdiky, Record<ModuloIdiky, Nivel>>

/** PN-29 — La letra de la tabla para un usuario y un módulo. */
export function nivelEn(usuario: UsuarioIdiky, modulo: ModuloIdiky): Nivel {
  return MATRIZ[usuario][modulo]
}

/** PN-29 — Si el módulo se le muestra. Lo que no le aplica, no se ve. */
export function veModulo(usuario: UsuarioIdiky, modulo: ModuloIdiky): boolean {
  return nivelEn(usuario, modulo) !== '-'
}

/**
 * PN-29 — Si puede hacer algo en el módulo (crear, pedir, cambiar, atender).
 * `V`, `s` y el soporte son de solo lectura: el soporte escribe solo con motivo (ADR-0034).
 */
export function cambiaEnModulo(usuario: UsuarioIdiky, modulo: ModuloIdiky): boolean {
  const nivel = nivelEn(usuario, modulo)
  // `Par` es una parte: el piscinero registra novedades de la piscina (minuta) pero solo ve sus
  // reservas; el visitante residente temporal pide ayuda pero solo lee la cartelera.
  if (nivel === 'Par') return modulo === 'minuta' || modulo === 'pedir_ayuda'
  return ['G', 'S', 'Prep', 'Mod', 'Atn', 'Ley', 'Pod'].includes(nivel)
}

/** PN-29 — Cada sección de la consola y el módulo de la tabla que la gobierna. */
const MODULO_DE_RUTA_CONSOLA: Array<[prefijo: string, modulo: ModuloIdiky]> = [
  ['/admin/cartera/paz-y-salvo', 'paz_y_salvo'],
  ['/admin/cartera/certificados', 'paz_y_salvo'],
  ['/admin/cartera', 'cartera'],
  ['/admin/pagos', 'cartera'],
  ['/admin/multas', 'cartera'],
  ['/admin/sanciones', 'cartera'],
  ['/admin/registros', 'usuarios'],
  ['/admin/unidades', 'estructura'],
  ['/admin/asambleas', 'asambleas'],
  ['/admin/reservas', 'reservas'],
  ['/admin/pqrs', 'pqrs'],
  ['/admin/comunicados', 'comunicados'],
  ['/admin/directorio', 'comunicados'],
  ['/admin/proyectos', 'documentos'],
  ['/admin/edificio', 'documentos'],
  ['/admin/correspondencia', 'correspondencia'],
  ['/admin/porteria', 'minuta'],
]

/** PN-29 — El módulo de una ruta de la consola; el tablero no tiene (lo ven todos). */
export function moduloDeRutaConsola(ruta: string): ModuloIdiky | null {
  return MODULO_DE_RUTA_CONSOLA.find(([prefijo]) => ruta === prefijo || ruta.startsWith(`${prefijo}/`))?.[1] ?? null
}

/** PN-29 — El Administrador Copropiedad y el Delegado tienen todo; el tablero completo es de ellos. */
export function esAdministracionPlena(usuario: UsuarioIdiky): boolean {
  return usuario === 'administrador' || usuario === 'delegado'
}

/** PN-29 — Los nombres con que se muestran, los de la tabla de Mary. */
export const NOMBRE_USUARIO: Record<UsuarioIdiky, string> = {
  administrador_idiky: 'Administrador Idiky',
  administrador: 'Administrador Copropiedad',
  delegado: 'Delegado',
  presidente_consejo: 'Presidente del consejo',
  consejero: 'Consejero',
  porteria: 'Portería',
  auxiliar_administrativo: 'Auxiliar Administrativo',
  contador: 'Contador',
  revisor_fiscal: 'Revisor Fiscal',
  piscinero: 'Piscinero',
  aseo: 'Aseo',
  mantenimiento: 'Mantenimiento',
  propietario: 'Propietario',
  arrendatario: 'Arrendatario',
  inmobiliaria: 'Inmobiliaria',
  operador: 'Operador',
  visitante: 'Visitante',
  familiar: 'Familiar o acompañante',
}

/** PN-29 — Cada pantalla de ALICE y el módulo de la tabla que la gobierna. */
const MODULO_DE_RUTA_APP: Array<[prefijo: string, modulo: ModuloIdiky]> = [
  ['/app/cuenta', 'cartera'],
  ['/app/procesos', 'cartera'],
  ['/app/solicitudes/reservas', 'reservas'],
  ['/app/solicitudes/pqrs', 'pqrs'],
  ['/app/solicitudes/paz-y-salvo', 'paz_y_salvo'],
  ['/app/asambleas', 'asambleas'],
  ['/app/comunicados', 'comunicados'],
  ['/app/proyectos', 'documentos'],
  ['/app/visitantes', 'visitantes'],
  ['/app/correspondencia', 'correspondencia'],
  ['/app/unidad/personas', 'usuarios'],
  ['/app/unidad/vehiculos-mascotas', 'vehiculos'],
  ['/app/unidad/permisos', 'trasteos'],
  ['/app/edificio/cuentas', 'cuentas_claras'],
  ['/app/edificio/documentos', 'documentos'],
  ['/app/edificio/encuestas', 'comunicados'],
  ['/app/edificio/calendario', 'comunicados'],
  ['/app/edificio/clasificados', 'clasificados'],
  ['/app/edificio/objetos', 'correspondencia'],
]

/** PN-29 — El módulo de una pantalla de ALICE; el inicio, la unidad, el perfil y el directorio no tienen. */
export function moduloDeRutaApp(ruta: string): ModuloIdiky | null {
  return MODULO_DE_RUTA_APP.find(([prefijo]) => ruta === prefijo || ruta.startsWith(`${prefijo}/`))?.[1] ?? null
}

/** PN-29 — Si la pestaña «Solicitudes» de ALICE se muestra: si se ve alguna de sus tres partes. */
export function veSolicitudes(usuario: UsuarioIdiky): boolean {
  return veModulo(usuario, 'reservas') || veModulo(usuario, 'pqrs') || veModulo(usuario, 'paz_y_salvo')
}
