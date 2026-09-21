/**
 * Como se ve BOB en el panel, y los catalogos con los que arranca (T-37).
 *
 * Las etiquetas, ayudas y columnas se definen aqui, en codigo: cada arranque las vuelve a poner.
 * Strapi las guarda en la configuracion del Content Manager, que conserva lo guardado al
 * sincronizar, asi que no se pierden. Si se cambian desde el panel, el siguiente arranque las
 * devuelve a lo que dice este archivo.
 */
import type { Core } from '@strapi/strapi';

import { UID, docs } from './middlewares';

type Campo = {
  etiqueta: string;
  ayuda?: string;
  ejemplo?: string;
  soloLectura?: boolean;
  /** En una relacion: que campo del destino se muestra. */
  muestra?: string;
};
type Vista = { principal?: string; columnas?: string[]; campos: Record<string, Campo> };

const SE_CALCULA = 'Se calcula al guardar.';

const TIPOS: Record<string, Vista> = {
  [UID.tipoDeBien]: {
    principal: 'nombre',
    columnas: ['nombre', 'uso', 'facturable', 'activo'],
    campos: {
      nombre: { etiqueta: 'Nombre' },
      uso: { etiqueta: 'Uso', ayuda: 'Residencial, comercial u otro (bodegas, depósitos, parqueaderos).' },
      facturable: { etiqueta: 'Se cobra', ayuda: 'Si cuenta para el cobro por unidad. Solo residenciales, comerciales, oficinas y consultorios (docs/13 §2).' },
      descripcion: { etiqueta: 'Descripción' },
      activo: { etiqueta: 'Activo', ayuda: 'Los tipos no se borran: se desactivan.' },
    },
  },
  [UID.plan]: {
    principal: 'nombre',
    columnas: ['nombre', 'modalidad', 'valorMensual', 'restringeUnidades', 'activo'],
    campos: {
      nombre: { etiqueta: 'Nombre' },
      condiciones: { etiqueta: 'Condiciones' },
      modalidad: { etiqueta: 'Modalidad de cobro', ayuda: 'por_unidad: el valor se multiplica por las unidades del contrato. valor_fijo: un valor para toda la copropiedad.' },
      valorMensual: { etiqueta: 'Valor mensual (COP)', ayuda: 'Por unidad o total, según la modalidad.' },
      duracionMeses: { etiqueta: 'Duración (meses)', ayuda: 'Todos los planes duran 12 meses.', soloLectura: true },
      restringeUnidades: { etiqueta: 'Restringe unidades', ayuda: 'Si el contrato fija un rango, BLOKY no deja cargar unidades que se cobran por encima del máximo.' },
      activo: { etiqueta: 'Activo', ayuda: 'Un plan no se borra: se desactiva. Los contratos firmados conservan lo que firmaron.' },
      contrataciones: { etiqueta: 'Contrataciones', muestra: 'titulo' },
    },
  },
  [UID.servicioAdicional]: {
    principal: 'nombre',
    columnas: ['nombre', 'valorMensual', 'activo'],
    campos: {
      nombre: { etiqueta: 'Nombre' },
      descripcion: { etiqueta: 'Descripción' },
      valorMensual: { etiqueta: 'Valor mensual (COP)' },
      duracionMeses: { etiqueta: 'Duración (meses)', ayuda: 'Todos los servicios duran 12 meses.', soloLectura: true },
      activo: { etiqueta: 'Activo', ayuda: 'Un servicio no se borra: se desactiva.' },
      contrataciones: { etiqueta: 'Contrataciones', muestra: 'titulo' },
    },
  },
  [UID.copropiedad]: {
    principal: 'nombre',
    columnas: ['nombre', 'nit', 'uso', 'estado', 'unidadesFacturables'],
    campos: {
      nombre: { etiqueta: 'Nombre' },
      nit: { etiqueta: 'NIT', ayuda: 'Solo números, sin puntos ni dígito de verificación.', ejemplo: '900123456' },
      digitoVerificacion: { etiqueta: 'Dígito de verificación', ayuda: 'Se comprueba con el algoritmo de la DIAN.' },
      tipo: { etiqueta: 'Tipo', ayuda: 'edificio: una construcción con varias unidades. conjunto: varios edificios o casas que comparten zonas (Ley 675, art. 3).' },
      uso: { etiqueta: 'Uso' },
      tieneConsejoAdministracion: { etiqueta: 'Tiene consejo de administración', ayuda: 'Con consejo, el Delegado es su presidente. Sin consejo, al Delegado lo nombra la asamblea.' },
      estado: { etiqueta: 'Estado' },
      estrato: { etiqueta: 'Estrato', ayuda: 'De 1 a 6. Solo en uso residencial o mixto.' },
      ubicacion: { etiqueta: 'Ubicación' },
      resumenDeBienes: { etiqueta: 'Resumen de bienes', ayuda: 'Cuántos bienes hay de cada tipo. El árbol completo hasta la unidad vive en BLOKY.' },
      unidadesFacturables: { etiqueta: 'Unidades que se cobran', ayuda: `${SE_CALCULA} Suma los tipos de bien que se cobran.`, soloLectura: true },
      fotoPrincipal: { etiqueta: 'Foto principal' },
      fotos: { etiqueta: 'Más fotos' },
      certificadoExistencia: { etiqueta: 'Certificado de existencia y representación legal', ayuda: 'Lo expide la alcaldía (Ley 675, art. 8).' },
      escrituraReglamento: { etiqueta: 'Escritura del reglamento' },
      notas: { etiqueta: 'Notas' },
      asignaciones: { etiqueta: 'Perfiles raíz', muestra: 'titulo' },
      contrataciones: { etiqueta: 'Contrataciones', muestra: 'titulo' },
      solicitudes: { etiqueta: 'Solicitudes', muestra: 'titulo' },
    },
  },
  [UID.persona]: {
    principal: 'nombre',
    columnas: ['nombre', 'tipoDocumento', 'numeroDocumento', 'celular', 'correo'],
    campos: {
      nombre: { etiqueta: 'Nombres y apellidos' },
      tipoDocumento: { etiqueta: 'Tipo de documento' },
      numeroDocumento: { etiqueta: 'Número de documento' },
      celular: { etiqueta: 'Celular', ayuda: 'Para el código de ingreso a BLOKY. Un celular colombiano de 10 dígitos recibe el +57.', ejemplo: '3001234567' },
      correo: { etiqueta: 'Correo', ayuda: 'Para el código por correo y el ingreso con Google o Microsoft.' },
      notas: { etiqueta: 'Notas' },
      asignaciones: { etiqueta: 'Asignaciones', muestra: 'titulo' },
    },
  },
  [UID.asignacion]: {
    principal: 'titulo',
    columnas: ['titulo', 'rol', 'estado', 'desde', 'hasta'],
    campos: {
      titulo: { etiqueta: 'Asignación', ayuda: `${SE_CALCULA} Rol · persona · copropiedad.`, soloLectura: true },
      copropiedad: { etiqueta: 'Copropiedad', muestra: 'nombre' },
      persona: { etiqueta: 'Persona', muestra: 'nombre' },
      rol: { etiqueta: 'Rol', ayuda: 'BOB solo crea al Administrador y al Delegado. Los demás perfiles se crean en BLOKY.' },
      estado: { etiqueta: 'Estado', ayuda: 'Una sola asignación vigente por rol en cada copropiedad. No se borran: se finalizan o se bloquean.' },
      desde: { etiqueta: 'Desde' },
      hasta: { etiqueta: 'Hasta' },
      esEmpresaAdministradora: { etiqueta: 'Es una empresa administradora', ayuda: 'Solo el Administrador (Ley 675, art. 50). La persona es quien ingresa en nombre de la empresa.' },
      empresaRazonSocial: { etiqueta: 'Razón social de la empresa' },
      empresaNit: { etiqueta: 'NIT de la empresa' },
      tipoSoporte: { etiqueta: 'Tipo de soporte', ayuda: 'Delegado: acta del consejo si la copropiedad lo tiene; si no, acta de la asamblea.' },
      soporte: { etiqueta: 'Soporte' },
      notas: { etiqueta: 'Notas' },
    },
  },
  [UID.contratacion]: {
    principal: 'titulo',
    columnas: ['titulo', 'estado', 'fechaInicio', 'fechaFin', 'valorMensualTotal'],
    campos: {
      titulo: { etiqueta: 'Contratación', ayuda: SE_CALCULA, soloLectura: true },
      copropiedad: { etiqueta: 'Copropiedad', muestra: 'nombre' },
      tipo: { etiqueta: 'Qué se contrata' },
      plan: { etiqueta: 'Plan', muestra: 'nombre' },
      servicioAdicional: { etiqueta: 'Servicio adicional', muestra: 'nombre' },
      estado: { etiqueta: 'Estado', ayuda: 'Lo único que se edita después de contratar, junto con las notas y el contrato firmado.' },
      fechaInicio: { etiqueta: 'Fecha de inicio' },
      fechaFin: { etiqueta: 'Fecha de fin', ayuda: `${SE_CALCULA} 12 meses.`, soloLectura: true },
      unidadesContratadas: { etiqueta: 'Unidades contratadas', ayuda: 'Las que se cobran en un plan por unidad.' },
      unidadesMinimo: { etiqueta: 'Mínimo de unidades' },
      unidadesMaximo: { etiqueta: 'Máximo de unidades', ayuda: 'Si el plan restringe unidades, BLOKY no deja pasar de aquí.' },
      nombreContratado: { etiqueta: 'Nombre contratado', ayuda: 'Copiado al contratar: si el plan cambia después, esta contratación conserva lo firmado.', soloLectura: true },
      condicionesContratadas: { etiqueta: 'Condiciones contratadas', soloLectura: true },
      modalidadContratada: { etiqueta: 'Modalidad contratada', soloLectura: true },
      valorMensualContratado: { etiqueta: 'Valor mensual contratado', soloLectura: true },
      restringeUnidadesContratado: { etiqueta: 'Restringe unidades (contratado)', soloLectura: true },
      valorMensualTotal: { etiqueta: 'Valor mensual total', ayuda: SE_CALCULA, soloLectura: true },
      diasPrimerMes: { etiqueta: 'Días del primer mes', ayuda: `${SE_CALCULA} Prorrateo con meses de 30 días.`, soloLectura: true },
      valorPrimerMes: { etiqueta: 'Valor del primer mes', ayuda: SE_CALCULA, soloLectura: true },
      contratoFirmado: { etiqueta: 'Contrato firmado' },
      notas: { etiqueta: 'Notas' },
    },
  },
  [UID.solicitud]: {
    principal: 'titulo',
    columnas: ['titulo', 'tipo', 'canal', 'estado', 'fechaRecepcion'],
    campos: {
      titulo: { etiqueta: 'Solicitud', ayuda: SE_CALCULA, soloLectura: true },
      copropiedad: { etiqueta: 'Copropiedad', muestra: 'nombre' },
      tipo: { etiqueta: 'Tipo', ayuda: 'El cambio del Delegado solo se recibe por operaciones@idiky.com.' },
      canal: { etiqueta: 'Canal' },
      solicitante: { etiqueta: 'Quién la pide' },
      correoSolicitante: { etiqueta: 'Correo de quien la pide' },
      fechaRecepcion: { etiqueta: 'Recibida', ayuda: 'Si se deja vacía, se toma el momento de guardar.' },
      motivo: { etiqueta: 'Motivo' },
      tipoSoporte: { etiqueta: 'Tipo de soporte' },
      soporte: { etiqueta: 'Soporte', ayuda: 'Para retirar o bloquear al Administrador: el acta de la asamblea, o del consejo si existe (Ley 675, art. 50).' },
      estado: { etiqueta: 'Estado' },
      resolucion: { etiqueta: 'Resolución' },
      fechaResolucion: { etiqueta: 'Resuelta', ayuda: SE_CALCULA, soloLectura: true },
    },
  },
};

const COMPONENTES: Record<string, Vista> = {
  'bob.ubicacion': {
    campos: {
      pais: { etiqueta: 'País', ayuda: 'Código ISO de dos letras: CO para Colombia.' },
      divipola: { etiqueta: 'Código DIVIPOLA', ayuda: '8 dígitos del DANE: departamento (2) + municipio (3) + centro poblado (3). Obligatorio en Colombia.', ejemplo: '11001000' },
      departamento: { etiqueta: 'Departamento' },
      municipio: { etiqueta: 'Municipio' },
      centroPoblado: { etiqueta: 'Centro poblado' },
      barrio: { etiqueta: 'Barrio, localidad o comuna' },
      direccion: { etiqueta: 'Dirección' },
      latitud: { etiqueta: 'Latitud' },
      longitud: { etiqueta: 'Longitud' },
    },
  },
  'bob.bien-por-tipo': {
    campos: {
      tipoDeBien: { etiqueta: 'Tipo de bien', muestra: 'nombre' },
      cantidad: { etiqueta: 'Cantidad' },
    },
  },
};

function aplicarVista(configuracion: any, vista: Vista) {
  for (const [nombre, campo] of Object.entries(vista.campos)) {
    const meta = configuracion.metadatas?.[nombre];
    if (!meta) continue;
    meta.edit = { ...meta.edit, label: campo.etiqueta };
    meta.list = { ...meta.list, label: campo.etiqueta };
    if (campo.ayuda) meta.edit.description = campo.ayuda;
    if (campo.ejemplo) meta.edit.placeholder = campo.ejemplo;
    if (campo.soloLectura) meta.edit.editable = false;
    if (campo.muestra) meta.edit.mainField = campo.muestra;
  }
  if (vista.principal) configuracion.settings = { ...configuracion.settings, mainField: vista.principal };
  if (vista.columnas) configuracion.layouts = { ...configuracion.layouts, list: vista.columnas };
}

export async function configurarPanel(strapi: Core.Strapi) {
  try {
    const tipos = strapi.plugin('content-manager').service('content-types');
    for (const [uid, vista] of Object.entries(TIPOS)) {
      const { uid: _uid, ...configuracion } = await tipos.findConfiguration({ uid });
      aplicarVista(configuracion, vista);
      await tipos.updateConfiguration({ uid }, configuracion);
    }
    const componentes = strapi.plugin('content-manager').service('components');
    for (const [uid, vista] of Object.entries(COMPONENTES)) {
      const componente = strapi.components[uid as keyof typeof strapi.components];
      const { uid: _uid, category: _category, ...configuracion } = await componentes.findConfiguration(componente);
      aplicarVista(configuracion, vista);
      await componentes.updateConfiguration(componente, configuracion);
    }
  } catch (error) {
    // Sin etiquetas BOB funciona igual, con los nombres de los campos: no se detiene el arranque.
    strapi.log.warn(`BOB: no se pudieron poner las etiquetas del panel: ${(error as Error).message}`);
  }
}

/** Tipos de bien con los que arranca BOB (docs/13 §2). Solo se crean los que falten. */
const TIPOS_DE_BIEN: [string, 'residencial' | 'comercial' | 'otro', boolean, string?][] = [
  ['Apartamento', 'residencial', true],
  ['Casa', 'residencial', true],
  ['Local', 'comercial', true],
  ['Oficina', 'comercial', true],
  ['Consultorio', 'comercial', true],
  ['Bodega', 'otro', false],
  ['Depósito', 'otro', false],
  ['Parqueadero', 'otro', false],
  ['Lote', 'residencial', false, 'Por definir si se cobra (docs/13 §7).'],
];

export async function sembrarCatalogos(strapi: Core.Strapi) {
  try {
    const tipos = docs(strapi, UID.tipoDeBien);
    for (const [nombre, uso, facturable, descripcion] of TIPOS_DE_BIEN) {
      const existe = await tipos.findFirst({ filters: { nombre } });
      if (!existe) {
        await tipos.create({ data: { nombre, uso, facturable, descripcion: descripcion ?? null, activo: true } });
        strapi.log.info(`BOB: tipo de bien creado: ${nombre}.`);
      }
    }
  } catch (error) {
    strapi.log.warn(`BOB: no se pudieron sembrar los tipos de bien: ${(error as Error).message}`);
  }
}
