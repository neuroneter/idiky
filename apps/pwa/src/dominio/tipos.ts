/**
 * Modelo de datos del dominio de copropiedad horizontal.
 * Documentacion: docs/05-modelo-de-datos.md
 *
 * Estos tipos son el contrato entre la interfaz y los datos. Cuando exista el
 * backend (fase 2) deben coincidir con el esquema de la API.
 */

// ---------------------------------------------------------------------------
// Convenciones
// ---------------------------------------------------------------------------
/** Fecha ISO `AAAA-MM-DD`. */
export type FechaISO = string
/** Fecha y hora ISO completa. */
export type FechaHoraISO = string
/** Periodo contable `AAAA-MM`. */
export type Periodo = string
/** Hora `HH:mm`. */
export type Hora = string
/** Valor en pesos enteros, sin decimales. */
export type Dinero = number

// ---------------------------------------------------------------------------
// Copropiedad y unidades
// ---------------------------------------------------------------------------
export interface Copropiedad {
  id: string
  nombre: string
  nit: string
  direccion: string
  ciudad: string
  tipo: 'residencial' | 'comercial' | 'mixto'
  /**
   * Dias que tiene el copropietario para presentar descargos, y dias para
   * impugnar la decision (Ley 675 de 2001, debido proceso).
   *
   * **Son parametros, no constantes**: el termino lo fija el reglamento de cada
   * copropiedad, no la app. La administracion los traslada, igual que traslada
   * el catalogo de multas (RN-49).
   */
  diasDescargos: number
  diasImpugnacion: number
  /**
   * Meses que un antecedente en firme sigue agravando la multa (RN-72).
   *
   * Parametro por la misma razon que los plazos del debido proceso: **la
   * caducidad de la reincidencia la fija el reglamento de cada copropiedad**, no
   * la app. Doce en esta (Mary, 2026-09-09: «la reincidencia caduca al ano»).
   */
  mesesReincidencia: number
}

export type TipoUnidad = 'apartamento' | 'casa' | 'local'

export interface Unidad {
  id: string
  copropiedadId: string
  torre: string
  numero: string
  tipo: TipoUnidad
  /** Area privada en metros cuadrados. */
  area: number
  /** Porcentaje de participacion. La suma de la copropiedad es 100 (RN-19). */
  coeficiente: number
  parqueaderos: string[]
}

export interface Persona {
  id: string
  nombres: string
  apellidos: string
  documento: string
  email: string
  telefono: string
}

/**
 * El **titulo** con el que una persona esta vinculada a una unidad.
 *
 * Esto si es un rol, y es lo que decide que puede hacer: el propietario registra
 * a los demas (RN-60), el propietario vota (RN-51). «Residente» no aparece aqui
 * porque no es un titulo: es la marca de sesion que llevan el propietario y el
 * arrendatario por igual (ver `RolUsuario`).
 */
export type RolResidencia = 'propietario' | 'arrendatario' | 'autorizado'

/** Vinculo entre una persona y una unidad. Define el rol efectivo (RN-02). */
export interface Residencia {
  id: string
  personaId: string
  unidadId: string
  rol: RolResidencia
  desde: FechaISO
  hasta?: FechaISO
  /** Contacto principal de la unidad. */
  principal: boolean
  /**
   * La **marca de residente** (Mary, 2026-09-07): si esta persona vive aqui.
   *
   * Es lo que distingue al propietario que habita su apartamento del que lo
   * tiene arrendado o vacio. Los dos son propietarios —votan, reciben la cuota,
   * registran gente— pero **solo uno vive aqui**, y eso cambia cosas concretas:
   * la porteria tiene que reconocer al que entra a diario, no al que viene dos
   * veces al ano.
   *
   * El arrendatario siempre la lleva: arrienda para vivir ahi.
   */
  reside: boolean
  /** Registro que la origino, si nacio por CU-R-27. Las de la semilla no tienen. */
  registroId?: string
}

// ---------------------------------------------------------------------------
// Cartera
// ---------------------------------------------------------------------------
export type TipoCuota = 'ordinaria' | 'extraordinaria' | 'interes' | 'sancion'
export type EstadoCuota = 'pendiente' | 'pagada' | 'vencida'

export interface Cuota {
  id: string
  unidadId: string
  periodo: Periodo
  tipo: TipoCuota
  concepto: string
  valor: Dinero
  fechaVencimiento: FechaISO
  estado: EstadoCuota
  pagoId?: string
}

/**
 * `bre_b` es Bre-B, el sistema de pagos inmediatos interoperable del Banco de la
 * Republica: se paga desde el banco propio con una **llave** (celular, correo,
 * documento) y el dinero llega al instante, cualquier dia y a cualquier hora.
 *
 * Sin tilde ni guion en el valor, como el resto del dominio: el guion de la marca
 * vive en el texto que se muestra, no en el dato (docs/08-convenciones.md).
 */
export type MedioPago = 'pse' | 'tarjeta' | 'bre_b' | 'transferencia' | 'efectivo' | 'otro'

export interface Pago {
  id: string
  unidadId: string
  cuotaIds: string[]
  valor: Dinero
  medio: MedioPago
  referencia: string
  fecha: FechaHoraISO
  /** Consecutivo del comprobante (RN-07). */
  comprobante: string
  registradoPor: string
}

// ---------------------------------------------------------------------------
// Catalogo de multas — CU-A-22 · RN-38, RN-40
// ---------------------------------------------------------------------------

/**
 * De donde sale la autoridad para cobrar algo que no es la cuota ordinaria.
 *
 * Los cuatro son rastreables y **se citan distinto**: el reglamento y el manual
 * por articulo, el acta por fecha, y `otro` obligando a decir cual es el
 * documento (RN-38).
 *
 * `manual` cuenta aparte de `reglamento` porque son documentos distintos: el
 * reglamento de propiedad horizontal es el constitutivo —escritura publica,
 * registrado— y el manual de convivencia lo adopta la asamblea para el dia a
 * dia. **En la practica el catalogo de sanciones suele vivir en el manual**, y
 * obligar a citar «reglamento» donde la conducta esta en el manual haria que la
 * referencia no se pudiera comprobar (Mary, 2026-09-08).
 */
export type OrigenRespaldo = 'reglamento' | 'manual' | 'asamblea' | 'otro'

/**
 * Un concepto del catalogo de multas.
 *
 * **El administrador no lo inventa, lo traslada** (Mary, 2026-09-08): las multas
 * las define la asamblea o ya estan en el reglamento o el manual de convivencia.
 * Por eso `origen` y `referencia` no son opcionales, y por eso el concepto se
 * desactiva pero no se borra (RN-40): las multas impuestas lo referencian.
 */
/**
 * Lo que el documento dice que pasa **cuando la conducta se repite** (RN-72).
 *
 * Es opcional a proposito, y esa es la regla entera: **si nadie lo parametrizo,
 * la multa no sube**. La app no agrava por su cuenta ni «porque es obvio» —
 * agravar es sancionar mas duro, y eso lo tiene que haber decidido antes la
 * asamblea, el reglamento o el manual (Mary, 2026-09-09).
 *
 * Lleva **su propio respaldo** y no hereda el de la multa base: es normal que el
 * reglamento fije la multa y una asamblea posterior agrave la reincidencia, y si
 * heredara la cita el expediente diria que el aumento sale de un articulo que no
 * lo menciona.
 */
export interface Reincidencia {
  /** Valor a partir de la segunda vez, tal como lo fija el documento. */
  valor: Dinero
  origen: OrigenRespaldo
  referencia: string
  /** Solo con `origen: 'otro'`: cual es el documento. */
  documento?: string
}

export interface ConceptoSancion {
  id: string
  copropiedadId: string
  /** «Ruido fuera de horario», «Mascota sin correa». */
  nombre: string
  /** Que conducta se sanciona. Lo lee quien recibe la multa. */
  descripcion: string
  /** Valor que fija el documento. Se copia al imponer la multa (RN-37). */
  valor: Dinero
  origen: OrigenRespaldo
  /** El articulo, la fecha del acta, o donde lo diga el otro documento. */
  referencia: string
  /** Solo con `origen: 'otro'`: cual es el documento. Sin esto no se crea (RN-38). */
  documento?: string
  /** El acta, cuando el origen es una asamblea del sistema. */
  actaId?: string
  /** Lo que pasa si la conducta se repite. Sin esto, no pasa nada (RN-72). */
  reincidencia?: Reincidencia
  activo: boolean
  creadoEn: FechaHoraISO
  /** Cuando se dio de baja. El concepto queda, deja de ofrecerse (RN-40). */
  inactivoDesde?: FechaISO
}

// ---------------------------------------------------------------------------
// Sanciones — CU-A-23, CU-R-29 · RN-39, RN-69
//
// **Una multa no es un cobro cualquiera.** La Ley 675 de 2001 exige debido
// proceso antes de sancionar: el copropietario tiene que ser oido, poder
// defenderse y poder impugnar. Por eso la sancion es una maquina de estados con
// su expediente, y **la cuota nace solo cuando queda firme** (RN-39).
// ---------------------------------------------------------------------------

/**
 * Las etapas del debido proceso.
 *
 *   notificada  -> se le comunicaron los hechos; corre el plazo de descargos
 *   en_estudio  -> presento descargos; la administracion los estudia
 *   resuelta    -> hay decision de sancionar; corre el plazo de impugnacion
 *   impugnada   -> el copropietario impugno; falta resolver el recurso
 *   firme       -> ya no admite recurso. **Aqui, y solo aqui, nace la cuota**
 *   archivada   -> se le dio la razon, o la administracion desistio. No cobra
 */
export type EstadoSancion =
  | 'notificada'
  | 'en_estudio'
  | 'resuelta'
  | 'impugnada'
  | 'firme'
  | 'archivada'

/** Quien actua en el expediente. */
export type AutorActuacion = 'administracion' | 'copropietario'

/**
 * Cada paso del expediente, con fecha y autor.
 *
 * **Es la prueba del debido proceso**, no un historial decorativo: si alguien
 * discute la multa, lo que se revisa es si se le notifico, si tuvo plazo, si lo
 * oyeron y si pudo impugnar. Un expediente sin actuaciones es una multa que no
 * se puede defender.
 */
export interface ActuacionSancion {
  id: string
  fecha: FechaHoraISO
  autor: AutorActuacion
  /** Quien la hizo, cuando se sabe. */
  personaId?: string
  /** Que paso, en una linea. */
  titulo: string
  /** Lo que se escribio: los hechos, los descargos, la motivacion. */
  texto?: string
}

export interface Sancion {
  id: string
  copropiedadId: string
  unidadId: string
  /** Del catalogo (RN-38). Se guarda tambien lo copiado, por si se inhabilita. */
  conceptoId: string
  /** Copiados al imponerla, como el coeficiente (RN-37). */
  concepto: string
  valor: Dinero
  /**
   * La norma que sanciona la conducta, tal como se citaba al imponerla
   * («Manual de convivencia · Articulo 14, numeral 3»).
   *
   * Se copia y no se deriva del catalogo en cada lectura, por lo mismo que el
   * valor: el expediente tiene que seguir diciendo **con que norma** se sanciono
   * aunque manana el concepto se inhabilite o le cambien la cita. Es la mitad
   * comprobable de la multa — la otra son los hechos (RN-38, RN-49).
   */
  respaldo: string
  /**
   * Si esta multa se impuso **como reincidencia** (RN-72).
   *
   * Se guarda y no se recalcula: manana la unidad puede tener mas sanciones
   * firmes, y el expediente tiene que seguir diciendo que era la segunda vez
   * cuando se impuso — no la quinta.
   */
  reincidencia?: boolean
  /** Que paso, cuando y donde. Es lo que se le notifica. */
  hechos: string
  estado: EstadoSancion
  /** Consecutivo del expediente: se cita en la notificacion y en la cuota. */
  radicado: string
  impuestaPor: string
  fechaImposicion: FechaHoraISO
  /** Hasta cuando puede presentar descargos (se copia del parametro). */
  limiteDescargos: FechaISO
  /** Hasta cuando puede impugnar. Solo existe una vez resuelta. */
  limiteImpugnacion?: FechaISO
  /** Por que se archivo, o por que se sanciono pese a los descargos. */
  motivo?: string
  /** La cuota que genera. **Solo cuando queda firme** (RN-39). */
  cuotaId?: string
  actuaciones: ActuacionSancion[]
}

// ---------------------------------------------------------------------------
// Zonas comunes y reservas
// ---------------------------------------------------------------------------
export interface ZonaComun {
  id: string
  copropiedadId: string
  nombre: string
  descripcion: string
  icono: string
  aforo: number
  requiereAprobacion: boolean
  horaInicio: Hora
  horaFin: Hora
  duracionBloqueHoras: number
  anticipacionMinimaHoras: number
  cupoMensualPorUnidad: number
}

export type EstadoReserva = 'solicitada' | 'confirmada' | 'rechazada' | 'cancelada'

export interface Reserva {
  id: string
  zonaId: string
  unidadId: string
  personaId: string
  fecha: FechaISO
  horaInicio: Hora
  horaFin: Hora
  estado: EstadoReserva
  motivoRechazo?: string
  creadaEn: FechaHoraISO
}

// ---------------------------------------------------------------------------
// PQRS
// ---------------------------------------------------------------------------
export type TipoPqrs = 'peticion' | 'queja' | 'reclamo' | 'sugerencia'
export type CategoriaPqrs =
  | 'convivencia'
  | 'mantenimiento'
  | 'seguridad'
  | 'administracion'
  | 'otro'
export type EstadoPqrs = 'abierta' | 'en_gestion' | 'resuelta' | 'cerrada'

export interface MensajePqrs {
  id: string
  autor: 'residente' | 'administracion'
  autorNombre: string
  texto: string
  fecha: FechaHoraISO
}

export interface Pqrs {
  id: string
  /** Consecutivo `PQRS-AAAA-NNNN` (RN-12). */
  radicado: string
  copropiedadId: string
  unidadId: string
  personaId: string
  tipo: TipoPqrs
  categoria: CategoriaPqrs
  asunto: string
  descripcion: string
  estado: EstadoPqrs
  fechaRadicacion: FechaHoraISO
  /** Vencimiento del SLA (RN-13). */
  fechaLimite: FechaISO
  mensajes: MensajePqrs[]
}

// ---------------------------------------------------------------------------
// Comunicados
// ---------------------------------------------------------------------------
export type CategoriaComunicado = 'general' | 'urgente' | 'mantenimiento' | 'asamblea'

export interface Comunicado {
  id: string
  copropiedadId: string
  titulo: string
  cuerpo: string
  categoria: CategoriaComunicado
  fijado: boolean
  fechaPublicacion: FechaHoraISO
  vigenteHasta?: FechaISO
  autor: string
  /** Ids de persona que ya lo abrieron. */
  leidoPor: string[]
}

// ---------------------------------------------------------------------------
// Correspondencia
// ---------------------------------------------------------------------------
export type TipoCorrespondencia = 'paquete' | 'carta' | 'domicilio'
export type EstadoCorrespondencia = 'en_porteria' | 'entregada'

export interface Correspondencia {
  id: string
  unidadId: string
  tipo: TipoCorrespondencia
  remitente: string
  observaciones: string
  fechaRecepcion: FechaHoraISO
  /**
   * Quien la recibio del mensajero y respondio por ella hasta entregarla.
   * No confundir con `recibidoPor`, que es el residente que se la lleva: sin
   * este campo la cadena de custodia empieza en el aire (RN-52).
   */
  registradoPor: string
  estado: EstadoCorrespondencia
  /** El residente que la recogio. */
  recibidoPor?: string
  fechaEntrega?: FechaHoraISO
}

// ---------------------------------------------------------------------------
// Visitantes
// ---------------------------------------------------------------------------
export type EstadoVisitante = 'programado' | 'activo' | 'vencido' | 'revocado'

export interface Visitante {
  id: string
  unidadId: string
  personaId: string
  nombre: string
  documento: string
  placa?: string
  vigenciaDesde: FechaISO
  vigenciaHasta: FechaISO
  /** Codigo que presenta el visitante en porteria (RN-16, RN-17). */
  codigo: string
  recurrente: boolean
  estado: EstadoVisitante
  creadoEn: FechaHoraISO
  /** Registro que lo origino (CU-R-27). Los de la semilla no tienen. */
  registroId?: string
}

// ---------------------------------------------------------------------------
// Registro de personas — CU-R-27, CU-R-28 · docs/05-modelo-de-datos.md
//
// Quien vive o entra a una unidad no aparece de la nada: alguien lo registra,
// **la propia persona adjunta sus soportes** y el responsable de la unidad
// autoriza. Las tres cosas son pasos distintos, con actores distintos, y por eso
// el registro es una entidad y no un formulario (RN-57 a RN-62).
// ---------------------------------------------------------------------------

/**
 * Que es la persona que se registra.
 *
 * La categoria no es una etiqueta: **decide la vigencia y lo que se crea al
 * autorizar**. Un residente queda vinculado a la unidad sin fecha de fin; un
 * residente temporal, con ella; un visitante no se vincula, obtiene un codigo.
 */
export type CategoriaRegistro = 'residente' | 'residente_temporal' | 'visitante'

/**
 * Los cinco estados por los que pasa un registro.
 *
 * `esperando_soportes` y `esperando_autorizacion` son dos esperas distintas y no
 * se pueden juntar en un «pendiente»: en la primera la pelota la tiene la
 * persona registrada, en la segunda quien la registro. Mostrar «pendiente» a los
 * dos es la forma segura de que ninguno haga nada.
 */
export type EstadoRegistro =
  | 'esperando_soportes'
  | 'esperando_autorizacion'
  | 'autorizado'
  | 'rechazado'
  | 'anulado'

/**
 * Una foto adjuntada como soporte.
 *
 * `imagen` es un data URI reducido; en la fase 2 sera la URL de un archivo en el
 * servidor y este tipo no cambia de forma (ADR-0009).
 */
export interface Soporte {
  imagen: string
  adjuntadoEn: FechaHoraISO
}

/**
 * El registro de una persona en una unidad, con su rastro completo.
 *
 * No se borra nunca: se anula, se rechaza o se autoriza, y en los tres casos
 * queda. Es lo unico que despues permite responder «¿quien autorizo a esta
 * persona a entrar aqui, y con que soportes?».
 */
export interface RegistroPersona {
  id: string
  copropiedadId: string
  unidadId: string
  /** Quien lo creo. Propietario para residentes; cualquier residente para visitantes. */
  creadoPor: string
  categoria: CategoriaRegistro
  /** Solo para las categorias de residente: con que rol queda vinculado. */
  rol?: RolResidencia
  /**
   * Si va a vivir en la unidad. Se pregunta **solo cuando el titulo es
   * propietario**: el arrendatario arrienda para vivir ahi, y al temporal se le
   * llama temporal justamente porque vive ahi un tiempo.
   */
  reside?: boolean
  nombres: string
  apellidos: string
  documento: string
  email: string
  telefono: string
  /** Obligatoria salvo para el residente sin fecha de fin (RN-62). */
  vigenciaDesde?: FechaISO
  vigenciaHasta?: FechaISO
  placa?: string
  /** Foto del documento de identidad (RN-57). */
  fotoDocumento?: Soporte
  /** Foto de la persona (RN-57). */
  fotoPersona?: Soporte
  /**
   * La autorizacion de tratamiento de datos que dio la persona al adjuntar
   * (RN-66). Va aqui y no en una tabla aparte porque el registro no se borra
   * nunca: es donde la constancia sobrevive a las fotos, que si tienen plazo.
   */
  consentimiento?: { version: string; aceptadoEn: FechaHoraISO }
  /** Lo que la persona escribe para abrir su registro y adjuntar (RN-58). */
  codigo: string
  estado: EstadoRegistro
  creadoEn: FechaHoraISO
  soportesEn?: FechaHoraISO
  decididoEn?: FechaHoraISO
  decididoPor?: string
  /** Por que se rechazo. Sin esto, el rechazo no le dice nada a nadie. */
  motivo?: string
  /** Lo que produjo al autorizarse. Uno de los dos, segun la categoria. */
  residenciaId?: string
  visitanteId?: string
}

/**
 * Constancia de que alguien miro un soporte (RN-67).
 *
 * Una foto de cedula archivada que cualquiera puede abrir sin dejar rastro es
 * una foto de cedula sin dueno. **No se trata de desconfiar de la
 * administracion**: se trata de que el dia que un titular pregunte «¿quien vio mi
 * documento?», la respuesta exista.
 */
export interface AccesoSoporte {
  id: string
  registroId: string
  /** Quien lo miro. */
  personaId: string
  vistoEn: FechaHoraISO
}

// ---------------------------------------------------------------------------
// Mensajes salientes — RN-64
//
// Lo que la copropiedad le manda a una persona por fuera de la app: hoy solo el
// aviso de que su registro quedo autorizado, manana el codigo de un solo uso y
// los comunicados urgentes.
//
// **Se guardan aunque el demo no los envie.** Un mensaje que se manda y no queda
// escrito es un mensaje que despues nadie puede probar que se mando, y «yo nunca
// recibi nada» es la discusion mas comun de una copropiedad.
// ---------------------------------------------------------------------------

export type MotivoMensaje = 'registro_autorizado' | 'registro_rechazado'

export interface Mensaje {
  id: string
  copropiedadId: string
  /** El celular al que se manda, tal como lo escribio quien registro. */
  destino: string
  texto: string
  motivo: MotivoMensaje
  /** El registro que lo origino, para poder volver de uno al otro. */
  registroId?: string
  enviadoEn: FechaHoraISO
}

// ---------------------------------------------------------------------------
// Asambleas — CU-R-13, CU-R-20 · docs/05-modelo-de-datos.md
//
// Es un subconjunto deliberado del modelo documentado: estan las entidades que
// necesita el copropietario para enterarse de la asamblea y votar sus puntos.
// **Faltan a proposito** `Asistencia`, `Poder` y el quorum: dependen de reglas
// que el equipo todavia no ha confirmado (RN-28, RN-30, T-10 y T-11), y
// escribirlas de memoria seria inventar la ley.
// ---------------------------------------------------------------------------
export type TipoAsamblea = 'ordinaria' | 'extraordinaria'

export type EstadoAsamblea = 'convocada' | 'instalada' | 'cerrada' | 'cancelada'

export type ModalidadAsamblea = 'presencial' | 'virtual' | 'mixta'

export interface PuntoOrdenDelDia {
  id: string
  orden: number
  titulo: string
  descripcion: string
  /** Los puntos informativos no se votan (un informe de gestion, por ejemplo). */
  seVota: boolean
}

export interface Asamblea {
  id: string
  copropiedadId: string
  tipo: TipoAsamblea
  titulo: string
  fechaHora: FechaHoraISO
  modalidad: ModalidadAsamblea
  lugar?: string
  enlaceTransmision?: string
  ordenDelDia: PuntoOrdenDelDia[]
  estado: EstadoAsamblea
  /** Lo que convoca: numero y fecha del acta o de la citacion. */
  citacion: string
}

export type EstadoVotacion = 'preparada' | 'abierta' | 'cerrada' | 'anulada'

export interface OpcionVotacion {
  id: string
  texto: string
}

export interface Votacion {
  id: string
  asambleaId: string
  puntoId: string
  pregunta: string
  opciones: OpcionVotacion[]
  estado: EstadoVotacion
  abiertaEn?: FechaHoraISO
  cerradaEn?: FechaHoraISO
}

export interface Voto {
  id: string
  votacionId: string
  unidadId: string
  opcionId: string
  /** Quien lo emitio; con poderes (CU-R-23) puede no ser el propietario. */
  emitidoPor: string
  /** Copiado al votar: si el coeficiente cambia, la votacion cerrada no (RN-37). */
  coeficiente: number
  fecha: FechaHoraISO
}

// ---------------------------------------------------------------------------
// Documentos formales — CU-R-12
// ---------------------------------------------------------------------------
export type TipoDocumento = 'paz_y_salvo'

export interface Documento {
  id: string
  tipo: TipoDocumento
  /** Consecutivo por tipo (RN-36). */
  numero: string
  /**
   * Codigo aleatorio que va impreso junto al numero (ADR-0006).
   *
   * El numero es consecutivo y adivinable; el codigo no. Hacen falta los dos para
   * verificar un documento desde fuera de la app, que es lo que necesita una
   * notaria o un banco al que le presentan el papel.
   */
  codigoVerificacion: string
  copropiedadId: string
  unidadId: string
  emitidoEn: FechaISO
  /**
   * Hasta que dia certifica que la unidad esta al dia.
   *
   * Sale del modelo de paz y salvo que uso Mary (2026-08-28): el documento no
   * dice «vale 30 dias», dice «se encuentra a paz y salvo ... **hasta el dia 31
   * de agosto**». Es el fin del ultimo periodo cubierto, no una caducidad del
   * papel; si la copropiedad ademas quiere darle vigencia al documento, esa es
   * otra decision y sigue abierta (§3 ter del levantamiento).
   */
  cubiertoHasta: FechaISO
  estado: 'vigente' | 'anulado'
}

// ---------------------------------------------------------------------------
// Sesion y perfiles demo
// ---------------------------------------------------------------------------
/**
 * Con que cara de la aplicacion entra la persona. **No es su titulo.**
 *
 * `residente` **no es un usuario distinto de propietario o arrendatario**: es
 * una **marca** que se le pone a quien tiene uno de esos dos titulos (Mary,
 * 2026-09-07). Dice «esta persona vive aqui y usa la app del residente»; el
 * titulo —quien es dueno y quien arrienda— vive en `Residencia.rol`, y es el que
 * decide lo que puede hacer (RN-02, RN-60).
 *
 * Confundirlos lleva a errores concretos: creer que «residente» es lo contrario
 * de «propietario» y escribir un permiso al reves.
 *
 * `porteria` se agrego el 2026-08-28: quien recibe los paquetes y valida a los
 * visitantes esta en la entrada a cualquier hora, y suele ser empleado de una
 * empresa de vigilancia externa. Por eso tiene marca propia y no la cuenta del
 * administrador (RN-52).
 */
export type RolUsuario = 'residente' | 'admin' | 'porteria'

/** Perfil seleccionable en la pantalla de acceso del demo (ADR-0004). */
export interface PerfilDemo {
  id: string
  etiqueta: string
  descripcion: string
  rol: RolUsuario
  personaId: string
  copropiedadId: string
  /** Unidad preseleccionada; los admin no tienen. */
  unidadId?: string
}

export interface Sesion {
  perfilId: string
  personaId: string
  rol: RolUsuario
  copropiedadId: string
  unidadActivaId?: string
}

// ---------------------------------------------------------------------------
// Estado completo persistido del demo
// ---------------------------------------------------------------------------
export interface BaseDatos {
  /** Version del esquema; si cambia, la semilla se regenera. */
  version: number
  copropiedades: Copropiedad[]
  unidades: Unidad[]
  personas: Persona[]
  residencias: Residencia[]
  cuotas: Cuota[]
  pagos: Pago[]
  conceptosSancion: ConceptoSancion[]
  sanciones: Sancion[]
  zonasComunes: ZonaComun[]
  reservas: Reserva[]
  pqrs: Pqrs[]
  comunicados: Comunicado[]
  correspondencia: Correspondencia[]
  visitantes: Visitante[]
  registros: RegistroPersona[]
  mensajes: Mensaje[]
  accesosSoportes: AccesoSoporte[]
  asambleas: Asamblea[]
  votaciones: Votacion[]
  votos: Voto[]
  documentos: Documento[]
  perfilesDemo: PerfilDemo[]
  consecutivos: {
    pqrs: number
    sancion: number
    comprobante: number
    pazYSalvo: number
  }
}
