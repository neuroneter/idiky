/**
 * Las reglas de BOB, en el servidor (docs/13-bob-copropiedades-y-contratos.md · T-37).
 *
 * Viven en un middleware del Document Service y no en los formularios: se cumplen igual si el
 * registro llega desde el panel, desde la API o desde otro codigo. Una regla que solo esconde un
 * campo se salta el dia que alguien no pasa por esa pantalla.
 */
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import {
  DURACION_CONTRATO_MESES,
  digitoVerificacionNit,
  fechaFinContrato,
  normalizarCelular,
  prorrateoPrimerMes,
  valorMensualTotal,
  type Modalidad,
} from './reglas';
import { relacionFinal } from './relaciones';

export const UID = {
  tipoDeBien: 'api::tipo-de-bien.tipo-de-bien',
  plan: 'api::plan.plan',
  servicioAdicional: 'api::servicio-adicional.servicio-adicional',
  copropiedad: 'api::copropiedad.copropiedad',
  persona: 'api::persona.persona',
  asignacion: 'api::asignacion.asignacion',
  contratacion: 'api::contratacion.contratacion',
  solicitud: 'api::solicitud.solicitud',
} as const;

const UIDS_DE_BOB: readonly string[] = Object.values(UID);

type Datos = Record<string, any>;
type Contexto = { strapi: Core.Strapi; data: Datos; actual: Datos | null; accion: 'create' | 'update' };
type Regla = { populate?: unknown; aplicar: (c: Contexto) => Promise<void> };

function fallar(mensaje: string): never {
  throw new errors.ValidationError(mensaje);
}

// Los tipos de Strapi solo conocen los UID que genera `strapi ts:generate-types`; BOB no los genera.
export const docs = (strapi: Core.Strapi, uid: string): any => strapi.documents(uid as any);

const vacio = (v: unknown) => v === undefined || v === null || v === '';
/** El valor con el que queda el registro: lo que llega, o lo que ya estaba. */
const valor = (c: Contexto, campo: string) => (campo in c.data ? c.data[campo] : c.actual?.[campo]);

const ETIQUETA_ROL = { administrador: 'Administrador', delegado: 'Delegado' } as const;
const ETIQUETA_SOLICITUD: Record<string, string> = {
  cambio_delegado: 'Cambio de Delegado',
  cambio_administrador: 'Cambio de Administrador',
  bloqueo_administrador: 'Bloqueo del Administrador',
};

// ---------------------------------------------------------------- Planes y servicios

const duracionFija: Regla = {
  async aplicar(c) {
    c.data.duracionMeses = DURACION_CONTRATO_MESES;
  },
};

// ---------------------------------------------------------------- Copropiedad

async function contarFacturables(c: Contexto): Promise<number> {
  const filas: Datos[] = c.data.resumenDeBienes ?? [];
  const anteriores: Datos[] = c.actual?.resumenDeBienes ?? [];
  const vistos = new Set<string>();
  let total = 0;
  for (const fila of filas) {
    const anterior = anteriores.find((a) => a.id !== undefined && a.id === fila.id);
    const tipoId = await relacionFinal(c.strapi, UID.tipoDeBien, fila.tipoDeBien, anterior?.tipoDeBien);
    if (!tipoId) fallar('Cada fila del resumen de bienes necesita su tipo de bien.');
    if (vistos.has(tipoId)) {
      fallar('Un tipo de bien va una sola vez en el resumen de bienes: suma las cantidades en una fila.');
    }
    vistos.add(tipoId);
    const cantidad = Number(fila.cantidad ?? 0);
    if (!Number.isInteger(cantidad) || cantidad < 0) {
      fallar('La cantidad del resumen de bienes es un número entero, cero o más.');
    }
    const tipo = await docs(c.strapi, UID.tipoDeBien).findOne({ documentId: tipoId });
    if (tipo?.facturable) total += cantidad;
  }
  return total;
}

const copropiedad: Regla = {
  populate: { resumenDeBienes: { populate: ['tipoDeBien'] }, ubicacion: true },
  async aplicar(c) {
    const nit = valor(c, 'nit');
    if (!vacio(nit)) {
      const soloDigitos = String(nit).replace(/\D/g, '');
      if (soloDigitos !== String(nit)) {
        fallar('El NIT va solo con números, sin puntos, guiones ni dígito de verificación.');
      }
      const dv = digitoVerificacionNit(soloDigitos);
      const escrito = valor(c, 'digitoVerificacion');
      if (String(escrito ?? '') !== String(dv)) {
        fallar(`El dígito de verificación del NIT ${soloDigitos} es ${dv}, no ${vacio(escrito) ? '(vacío)' : escrito}.`);
      }
    }

    if (valor(c, 'uso') === 'comercial' && !vacio(valor(c, 'estrato'))) {
      fallar('El estrato solo aplica en uso residencial o mixto: una copropiedad comercial no lleva estrato.');
    }

    const ubicacion = valor(c, 'ubicacion');
    if (ubicacion) {
      const pais = vacio(ubicacion.pais) ? 'CO' : ubicacion.pais;
      if (pais === 'CO' && !/^\d{8}$/.test(String(ubicacion.divipola ?? ''))) {
        fallar('En Colombia la ubicación necesita el código DIVIPOLA de 8 dígitos (departamento, municipio y centro poblado).');
      }
      if (vacio(ubicacion.latitud) !== vacio(ubicacion.longitud)) {
        fallar('La geolocalización va completa: latitud y longitud, o ninguna de las dos.');
      }
    }

    if (c.accion === 'create' || 'resumenDeBienes' in c.data) {
      c.data.unidadesFacturables = await contarFacturables(c);
    }
  },
};

// ---------------------------------------------------------------- Persona

const persona: Regla = {
  async aplicar(c) {
    if (!vacio(c.data.celular)) {
      const normalizado = normalizarCelular(String(c.data.celular));
      if (!normalizado) {
        fallar('El celular no es válido: un celular colombiano va con sus 10 dígitos (3001234567) o en formato internacional (+573001234567).');
      }
      c.data.celular = normalizado;
    }
    if (typeof c.data.correo === 'string') {
      c.data.correo = c.data.correo.trim().toLowerCase();
    }

    const tipoDocumento = valor(c, 'tipoDocumento');
    const numeroDocumento = valor(c, 'numeroDocumento');
    if (!vacio(tipoDocumento) && !vacio(numeroDocumento)) {
      const filtros: Datos = { tipoDocumento, numeroDocumento: String(numeroDocumento).trim() };
      if (c.actual?.documentId) filtros.documentId = { $ne: c.actual.documentId };
      const otra = await docs(c.strapi, UID.persona).findFirst({ filters: filtros });
      if (otra) {
        fallar(`Ya existe una persona con ${tipoDocumento} ${numeroDocumento}: ${otra.nombre}. Una persona existe una sola vez; lo que se agrega son asignaciones.`);
      }
    }
  },
};

// ---------------------------------------------------------------- Asignacion (perfiles raiz)

const asignacion: Regla = {
  populate: ['copropiedad', 'persona'],
  async aplicar(c) {
    const copropiedadId = await relacionFinal(c.strapi, UID.copropiedad, c.data.copropiedad, c.actual?.copropiedad);
    const personaId = await relacionFinal(c.strapi, UID.persona, c.data.persona, c.actual?.persona);
    if (!copropiedadId || !personaId) fallar('La asignación necesita la copropiedad y la persona.');

    const rol = valor(c, 'rol') as keyof typeof ETIQUETA_ROL;
    const estado = valor(c, 'estado') ?? 'vigente';
    const desde = valor(c, 'desde');
    const hasta = valor(c, 'hasta');
    if (!vacio(desde) && !vacio(hasta) && String(hasta).slice(0, 10) < String(desde).slice(0, 10)) {
      fallar('«Hasta» no puede ser antes de «Desde».');
    }
    if (estado === 'finalizada' && vacio(hasta)) fallar('Una asignación finalizada necesita la fecha «Hasta».');

    const [coprop, pers] = await Promise.all([
      docs(c.strapi, UID.copropiedad).findOne({ documentId: copropiedadId }),
      docs(c.strapi, UID.persona).findOne({ documentId: personaId }),
    ]);

    if (estado === 'vigente') {
      const base: Datos = { copropiedad: { documentId: copropiedadId }, estado: 'vigente' };
      if (c.actual?.documentId) base.documentId = { $ne: c.actual.documentId };

      const mismoRol = await docs(c.strapi, UID.asignacion).findFirst({ filters: { ...base, rol } });
      if (mismoRol) {
        fallar(`${coprop.nombre} ya tiene ${rol === 'administrador' ? 'un Administrador' : 'un Delegado'} vigente (${mismoRol.titulo}). Primero se finaliza o se bloquea esa asignación.`);
      }
      const otroRol = rol === 'administrador' ? 'delegado' : 'administrador';
      const cruzada = await docs(c.strapi, UID.asignacion).findFirst({
        filters: { ...base, rol: otroRol, persona: { documentId: personaId } },
      });
      if (cruzada) {
        fallar(`${pers.nombre} ya es ${ETIQUETA_ROL[otroRol]} vigente de ${coprop.nombre}. En una misma copropiedad, el Administrador y el Delegado no son la misma persona.`);
      }
    }

    const esEmpresa = Boolean(valor(c, 'esEmpresaAdministradora'));
    if (rol === 'delegado' && esEmpresa) {
      fallar('Solo el Administrador puede ser una empresa (Ley 675, art. 50). El Delegado es una persona.');
    }
    if (rol === 'administrador' && esEmpresa && (vacio(valor(c, 'empresaRazonSocial')) || vacio(valor(c, 'empresaNit')))) {
      fallar('Si el Administrador es una empresa, van su razón social y su NIT.');
    }

    const tipoSoporte = valor(c, 'tipoSoporte');
    if (rol === 'delegado' && (tipoSoporte === 'acta_consejo' || tipoSoporte === 'acta_asamblea')) {
      const esperado = coprop.tieneConsejoAdministracion ? 'acta_consejo' : 'acta_asamblea';
      if (tipoSoporte !== esperado) {
        fallar(
          coprop.tieneConsejoAdministracion
            ? `${coprop.nombre} tiene consejo de administración: el Delegado es su presidente, y el soporte es el acta del consejo.`
            : `${coprop.nombre} no tiene consejo de administración: al Delegado lo nombra la asamblea, y el soporte es el acta de la asamblea.`
        );
      }
    }

    c.data.titulo = `${ETIQUETA_ROL[rol]} · ${pers.nombre} · ${coprop.nombre}`;
  },
};

// ---------------------------------------------------------------- Contratacion

/** Lo firmado: se copia al contratar y no se edita (como RN-37 y RN-85). */
const CAMPOS_FIRMADOS = [
  'tipo',
  'fechaInicio',
  'fechaFin',
  'unidadesContratadas',
  'unidadesMinimo',
  'unidadesMaximo',
  'nombreContratado',
  'condicionesContratadas',
  'modalidadContratada',
  'valorMensualContratado',
  'restringeUnidadesContratado',
  'valorMensualTotal',
  'diasPrimerMes',
  'valorPrimerMes',
  'titulo',
];

function normalizarParaComparar(v: unknown): unknown {
  if (v === undefined || v === '') return null;
  if (typeof v === 'string') {
    const texto = v.trim();
    if (/^-?\d+(\.\d+)?$/.test(texto)) return Number(texto);
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
    return texto;
  }
  return v;
}

async function protegerLoFirmado(c: Contexto) {
  for (const campo of CAMPOS_FIRMADOS) {
    if (!(campo in c.data)) continue;
    const nuevo = normalizarParaComparar(c.data[campo]);
    const guardado = normalizarParaComparar(c.actual?.[campo]);
    if (JSON.stringify(nuevo) !== JSON.stringify(guardado)) {
      fallar(`«${campo}» no se edita en una contratación: lo firmado se conserva. Para cambiarlo se crea una contratación nueva.`);
    }
  }
  const relaciones: [string, string][] = [
    ['copropiedad', UID.copropiedad],
    ['plan', UID.plan],
    ['servicioAdicional', UID.servicioAdicional],
  ];
  for (const [campo, uid] of relaciones) {
    if (!(campo in c.data)) continue;
    const final = await relacionFinal(c.strapi, uid, c.data[campo], c.actual?.[campo]);
    if (final !== (c.actual?.[campo]?.documentId ?? null)) {
      fallar(`«${campo}» no se edita en una contratación: lo firmado se conserva. Para cambiarlo se crea una contratación nueva.`);
    }
  }
}

const contratacion: Regla = {
  populate: ['copropiedad', 'plan', 'servicioAdicional'],
  async aplicar(c) {
    if (c.accion === 'update') return protegerLoFirmado(c);

    const copropiedadId = await relacionFinal(c.strapi, UID.copropiedad, c.data.copropiedad, null);
    const planId = await relacionFinal(c.strapi, UID.plan, c.data.plan, null);
    const servicioId = await relacionFinal(c.strapi, UID.servicioAdicional, c.data.servicioAdicional, null);
    if (!copropiedadId) fallar('La contratación necesita la copropiedad.');

    const tipo = c.data.tipo ?? 'plan';
    if (tipo === 'plan' && (!planId || servicioId)) {
      fallar('Una contratación de plan lleva el plan, y no un servicio adicional.');
    }
    if (tipo === 'servicio_adicional' && (!servicioId || planId)) {
      fallar('Una contratación de servicio adicional lleva el servicio, y no un plan.');
    }
    const origen =
      tipo === 'plan'
        ? await docs(c.strapi, UID.plan).findOne({ documentId: planId })
        : await docs(c.strapi, UID.servicioAdicional).findOne({ documentId: servicioId });
    if (!origen) fallar('El plan o servicio de la contratación no existe.');
    if (origen.activo === false) fallar(`«${origen.nombre}» está inactivo: no se puede contratar.`);

    const fechaInicio = c.data.fechaInicio;
    if (vacio(fechaInicio)) fallar('La contratación necesita la fecha de inicio.');

    const modalidad: Modalidad = tipo === 'plan' ? origen.modalidad : 'valor_fijo';
    const valorMensual = Number(origen.valorMensual);
    const restringe = tipo === 'plan' ? Boolean(origen.restringeUnidades) : false;
    const numero = (v: unknown) => (vacio(v) ? null : Number(v));
    const unidades = numero(c.data.unidadesContratadas);
    const minimo = numero(c.data.unidadesMinimo);
    const maximo = numero(c.data.unidadesMaximo);

    if (modalidad === 'por_unidad' && !(unidades && unidades > 0)) {
      fallar(`«${origen.nombre}» se cobra por unidad: la contratación lleva las unidades contratadas.`);
    }
    if (restringe && maximo === null) {
      fallar(`«${origen.nombre}» restringe unidades: la contratación necesita el máximo, que es el tope que BLOKY no deja pasar.`);
    }
    if (minimo !== null && maximo !== null && minimo > maximo) {
      fallar('El mínimo de unidades no puede ser mayor que el máximo.');
    }
    if (unidades !== null && ((minimo !== null && unidades < minimo) || (maximo !== null && unidades > maximo))) {
      fallar('Las unidades contratadas quedan fuera del rango del contrato.');
    }

    const coprop = await docs(c.strapi, UID.copropiedad).findOne({ documentId: copropiedadId });
    const total = valorMensualTotal(modalidad, valorMensual, unidades);
    const primerMes = prorrateoPrimerMes(String(fechaInicio), total);
    Object.assign(c.data, {
      tipo,
      nombreContratado: origen.nombre,
      condicionesContratadas: tipo === 'plan' ? origen.condiciones : origen.descripcion,
      modalidadContratada: modalidad,
      valorMensualContratado: valorMensual,
      restringeUnidadesContratado: restringe,
      valorMensualTotal: total,
      diasPrimerMes: primerMes.dias,
      valorPrimerMes: primerMes.valor,
      fechaFin: fechaFinContrato(String(fechaInicio)),
      titulo: `${origen.nombre} · ${coprop?.nombre ?? ''} · desde ${String(fechaInicio).slice(0, 10)}`,
    });
  },
};

// ---------------------------------------------------------------- Solicitud

const solicitud: Regla = {
  populate: ['copropiedad'],
  async aplicar(c) {
    const copropiedadId = await relacionFinal(c.strapi, UID.copropiedad, c.data.copropiedad, c.actual?.copropiedad);
    if (!copropiedadId) fallar('La solicitud necesita la copropiedad.');

    const tipo = valor(c, 'tipo');
    if (tipo === 'cambio_delegado' && valor(c, 'canal') !== 'correo_operaciones') {
      fallar('El cambio del Delegado solo se recibe por operaciones@idiky.com: el Delegado es el superusuario de BLOKY (docs/13 §3).');
    }

    const estado = valor(c, 'estado') ?? 'recibida';
    const resuelta = estado === 'aprobada' || estado === 'rechazada';
    if (resuelta && vacio(valor(c, 'resolucion'))) {
      fallar('Para aprobar o rechazar una solicitud se escribe la resolución.');
    }
    if (resuelta && vacio(valor(c, 'fechaResolucion'))) c.data.fechaResolucion = new Date().toISOString();
    if (c.accion === 'create' && vacio(c.data.fechaRecepcion)) c.data.fechaRecepcion = new Date().toISOString();

    const coprop = await docs(c.strapi, UID.copropiedad).findOne({ documentId: copropiedadId });
    const fecha = String(valor(c, 'fechaRecepcion') ?? '').slice(0, 10);
    c.data.titulo = `${ETIQUETA_SOLICITUD[tipo] ?? tipo} · ${coprop?.nombre ?? ''} · ${fecha}`;
  },
};

// ---------------------------------------------------------------- Registro

const REGLAS: Record<string, Regla> = {
  [UID.plan]: duracionFija,
  [UID.servicioAdicional]: duracionFija,
  [UID.copropiedad]: copropiedad,
  [UID.persona]: persona,
  [UID.asignacion]: asignacion,
  [UID.contratacion]: contratacion,
  [UID.solicitud]: solicitud,
};

export function registrarReglasDeBob(strapi: Core.Strapi) {
  strapi.documents.use(async (ctx: any, next: any) => {
    if (!UIDS_DE_BOB.includes(ctx.uid)) return next();

    // Como en todo el proyecto: los registros no se borran, se cierran o se anulan.
    if (ctx.action === 'delete') {
      fallar('En BOB no se borran registros: se desactivan, se finalizan o se cancelan.');
    }

    const regla = REGLAS[ctx.uid];
    if (!regla || (ctx.action !== 'create' && ctx.action !== 'update')) return next();

    const params = ctx.params as { data?: Datos; documentId?: string };
    const data: Datos = params.data ?? {};
    const actual =
      ctx.action === 'update' && params.documentId
        ? await docs(strapi, ctx.uid).findOne({ documentId: params.documentId, populate: regla.populate })
        : null;
    await regla.aplicar({ strapi, data, actual, accion: ctx.action });
    params.data = data;
    return next();
  });
}
