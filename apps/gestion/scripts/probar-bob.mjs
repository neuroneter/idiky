// Prueba de las reglas de BOB contra Strapi real, con una base SQLite desechable (T-37).
//
// No toca PostgreSQL ni el servidor: levanta Strapi en tu maquina sobre .tmp/prueba-bob.db,
// crea copropiedades, personas, asignaciones y contrataciones, comprueba que cada regla acepte
// lo valido y rechace lo invalido, y borra la base al terminar.
//
//   cd apps/gestion
//   npm i --no-save better-sqlite3     # una vez; no cambia package.json ni el lockfile
//   node scripts/probar-bob.mjs
//
// Sale con 0 si todo pasa y con 1 si algo falla.
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = `${APP}/.tmp/prueba-bob.db`;
process.chdir(APP);
Object.assign(process.env, {
  DATABASE_CLIENT: 'sqlite',
  DATABASE_FILENAME: '.tmp/prueba-bob.db',
  STRAPI_TELEMETRY_DISABLED: 'true',
});
rmSync(BASE, { force: true });

const require = createRequire(`${APP}/package.json`);
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const strapi = await createStrapi(await compileStrapi()).load();
strapi.log.level = 'error';

const resultados = [];
async function paso(nombre, fn, errorEsperado) {
  try {
    const valor = await fn();
    if (errorEsperado) resultados.push(['FALLA', nombre, 'debía rechazarse y se aceptó']);
    else resultados.push(['ok', nombre]);
    return valor;
  } catch (e) {
    if (errorEsperado && String(e.message).includes(errorEsperado)) resultados.push(['ok', nombre, `rechazado: ${e.message}`]);
    else resultados.push(['FALLA', nombre, e.message]);
  }
}
function igual(nombre, obtenido, esperado) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  resultados.push([ok ? 'ok' : 'FALLA', nombre, `${JSON.stringify(obtenido)}${ok ? '' : ` (esperado ${JSON.stringify(esperado)})`}`]);
}

const d = (uid) => strapi.documents(uid);
const U = {
  tipo: 'api::tipo-de-bien.tipo-de-bien',
  plan: 'api::plan.plan',
  servicio: 'api::servicio-adicional.servicio-adicional',
  coprop: 'api::copropiedad.copropiedad',
  persona: 'api::persona.persona',
  asig: 'api::asignacion.asignacion',
  contrato: 'api::contratacion.contratacion',
  solicitud: 'api::solicitud.solicitud',
};
const contentTypes = strapi.plugin('content-manager').service('content-types');

// 1. Catalogo sembrado y panel configurado
const tipos = await d(U.tipo).findMany({ limit: 50 });
igual('tipos de bien sembrados', tipos.length, 9);
igual('tipos que se cobran', tipos.filter((t) => t.facturable).map((t) => t.nombre).sort(), ['Apartamento', 'Casa', 'Consultorio', 'Local', 'Oficina']);
const tipo = (nombre) => tipos.find((t) => t.nombre === nombre).documentId;
const confPlan = await contentTypes.findConfiguration({ uid: U.plan });
igual('etiqueta en el panel: valorMensual', confPlan.metadatas.valorMensual.edit.label, 'Valor mensual (COP)');
igual('columnas de planes', confPlan.layouts.list, ['nombre', 'modalidad', 'valorMensual', 'restringeUnidades', 'activo']);
const confCoprop = await contentTypes.findConfiguration({ uid: U.coprop });
igual('unidades que se cobran: solo lectura', confCoprop.metadatas.unidadesFacturables.edit.editable, false);
const confUbicacion = await strapi.plugin('content-manager').service('components').findConfiguration(strapi.components['bob.ubicacion']);
igual('etiqueta del componente: divipola', confUbicacion.metadatas.divipola.edit.label, 'Código DIVIPOLA');

// 2. Copropiedad
const ficha = {
  nombre: 'Conjunto Prueba', nit: '800197268', digitoVerificacion: '4', tipo: 'conjunto', uso: 'residencial',
  ubicacion: { pais: 'CO', divipola: '11001000', direccion: 'Calle 1 # 2-3' },
};
await paso('NIT con dígito equivocado', () => d(U.coprop).create({ data: { ...ficha, digitoVerificacion: '5' } }), 'es 4');
await paso('comercial con estrato', () => d(U.coprop).create({ data: { ...ficha, uso: 'comercial', estrato: 3 } }), 'estrato');
await paso('Colombia sin DIVIPOLA', () => d(U.coprop).create({ data: { ...ficha, ubicacion: { pais: 'CO', direccion: 'x' } } }), 'DIVIPOLA');
await paso('tipo de bien repetido en el resumen', () =>
  d(U.coprop).create({ data: { ...ficha, resumenDeBienes: [{ tipoDeBien: tipo('Casa'), cantidad: 1 }, { tipoDeBien: tipo('Casa'), cantidad: 2 }] } }), 'una sola vez');
const coprop = await paso('copropiedad válida con resumen', () =>
  d(U.coprop).create({
    data: {
      ...ficha,
      resumenDeBienes: [
        { tipoDeBien: tipo('Apartamento'), cantidad: 120 },
        { tipoDeBien: { connect: [{ documentId: tipo('Parqueadero') }] }, cantidad: 80 },
        { tipoDeBien: tipo('Local'), cantidad: 2 },
      ],
    },
  }));
igual('unidades que se cobran (120 aptos + 2 locales, sin 80 parqueaderos)', coprop?.unidadesFacturables, 122);
const conResumen = await d(U.coprop).findOne({ documentId: coprop.documentId, populate: { resumenDeBienes: { populate: ['tipoDeBien'] } } });
const editada = await paso('editar el resumen como lo hace el panel', () =>
  d(U.coprop).update({
    documentId: coprop.documentId,
    data: {
      resumenDeBienes: conResumen.resumenDeBienes.map((f) => ({
        id: f.id,
        cantidad: f.tipoDeBien.nombre === 'Apartamento' ? 150 : f.cantidad,
        tipoDeBien: { connect: [], disconnect: [] },
      })),
    },
  }));
igual('unidades que se cobran tras editar', editada?.unidadesFacturables, 152);
await paso('borrar una copropiedad', () => d(U.coprop).delete({ documentId: coprop.documentId }), 'no se borran');

// 3. Personas
const ana = await paso('persona con celular de 10 dígitos', () =>
  d(U.persona).create({ data: { nombre: 'Ana Prueba', tipoDocumento: 'CC', numeroDocumento: '1001', celular: '300 000 0001', correo: 'ANA@Prueba.com ' } }));
igual('celular normalizado', ana?.celular, '+573000000001');
igual('correo normalizado', ana?.correo, 'ana@prueba.com');
await paso('persona duplicada', () =>
  d(U.persona).create({ data: { nombre: 'Otra', tipoDocumento: 'CC', numeroDocumento: '1001', celular: '3001112233', correo: 'o@p.co' } }), 'Ya existe');
await paso('celular inválido', () =>
  d(U.persona).create({ data: { nombre: 'Mal', tipoDocumento: 'CC', numeroDocumento: '1002', celular: '12345', correo: 'm@p.co' } }), 'celular no es válido');
const beto = await d(U.persona).create({ data: { nombre: 'Beto Prueba', tipoDocumento: 'CC', numeroDocumento: '1003', celular: '3002223344', correo: 'b@p.co' } });
const caro = await d(U.persona).create({ data: { nombre: 'Caro Prueba', tipoDocumento: 'CE', numeroDocumento: '1004', celular: '+573003334455', correo: 'c@p.co' } });

// 4. Asignaciones (perfiles raiz)
const rolEn = (persona, rol, extra = {}) => ({ copropiedad: coprop.documentId, persona: persona.documentId, rol, desde: '2026-09-10', ...extra });
const admin = await paso('Administrador vigente', () =>
  d(U.asig).create({ data: { ...rolEn(ana, 'administrador'), persona: { connect: [{ documentId: ana.documentId }] } } }));
igual('título de la asignación', admin?.titulo, 'Administrador · Ana Prueba · Conjunto Prueba');
await paso('segundo Administrador vigente', () => d(U.asig).create({ data: rolEn(beto, 'administrador') }), 'ya tiene un Administrador');
await paso('el Administrador también como Delegado', () => d(U.asig).create({ data: rolEn(ana, 'delegado') }), 'no son la misma persona');
await paso('Delegado con acta del consejo, sin consejo', () => d(U.asig).create({ data: rolEn(beto, 'delegado', { tipoSoporte: 'acta_consejo' }) }), 'no tiene consejo');
await paso('Delegado como empresa', () => d(U.asig).create({ data: rolEn(beto, 'delegado', { esEmpresaAdministradora: true }) }), 'Solo el Administrador');
await paso('Delegado con acta de asamblea', () => d(U.asig).create({ data: rolEn(beto, 'delegado', { tipoSoporte: 'acta_asamblea' }) }));
await paso('finalizar sin fecha «Hasta»', () => d(U.asig).update({ documentId: admin.documentId, data: { estado: 'finalizada' } }), 'necesita la fecha');
await paso('finalizar con fecha «Hasta»', () => d(U.asig).update({ documentId: admin.documentId, data: { estado: 'finalizada', hasta: '2026-12-31' } }));
await paso('nuevo Administrador (empresa) tras finalizar', () =>
  d(U.asig).create({ data: rolEn(caro, 'administrador', { desde: '2027-01-01', esEmpresaAdministradora: true, empresaRazonSocial: 'Administra SAS', empresaNit: '900123456' }) }));

// 5. Planes, servicios y contrataciones
const plan = await paso('plan por unidad que restringe', () =>
  d(U.plan).create({ data: { nombre: 'Plan Prueba', modalidad: 'por_unidad', valorMensual: 3000, restringeUnidades: true, duracionMeses: 99 } }));
igual('duración forzada a 12', plan?.duracionMeses, 12);
const servicio = await d(U.servicio).create({ data: { nombre: 'Asesoría legal', valorMensual: 450000 } });
const contratoDePlan = (extra) => ({ copropiedad: coprop.documentId, tipo: 'plan', plan: plan.documentId, fechaInicio: '2026-09-21', ...extra });
await paso('contratación sin máximo con plan que restringe', () => d(U.contrato).create({ data: contratoDePlan({ unidadesContratadas: 100 }) }), 'necesita el máximo');
await paso('unidades fuera del rango', () => d(U.contrato).create({ data: contratoDePlan({ unidadesContratadas: 200, unidadesMaximo: 150 }) }), 'fuera del rango');
await paso('plan con servicio a la vez', () => d(U.contrato).create({ data: contratoDePlan({ servicioAdicional: servicio.documentId }) }), 'no un servicio');
const contrato = await paso('contratación del plan', () => d(U.contrato).create({ data: contratoDePlan({ unidadesContratadas: 100, unidadesMaximo: 150 }) }));
igual('copiado y calculado', contrato && [contrato.nombreContratado, Number(contrato.valorMensualContratado), Number(contrato.valorMensualTotal), contrato.diasPrimerMes, Number(contrato.valorPrimerMes), contrato.fechaFin],
  ['Plan Prueba', 3000, 300000, 10, 100000, '2027-09-20']);
await d(U.plan).update({ documentId: plan.documentId, data: { valorMensual: 5000 } });
const tras = await d(U.contrato).findOne({ documentId: contrato.documentId });
igual('subir la tarifa del plan no cambia lo firmado', Number(tras.valorMensualContratado), 3000);
await paso('editar el total firmado', () => d(U.contrato).update({ documentId: contrato.documentId, data: { valorMensualTotal: 1 } }), 'no se edita');
await paso('cambiar el plan de una contratación', () =>
  d(U.contrato).update({ documentId: contrato.documentId, data: { plan: { connect: [{ documentId: servicio.documentId }] } } }), 'no se edita');
await paso('terminar la contratación', () =>
  d(U.contrato).update({ documentId: contrato.documentId, data: { estado: 'terminada', valorMensualTotal: 300000, fechaFin: '2027-09-20' } }));
const extra = await paso('contratación de servicio adicional desde el 1', () =>
  d(U.contrato).create({ data: { copropiedad: coprop.documentId, tipo: 'servicio_adicional', servicioAdicional: servicio.documentId, fechaInicio: '2026-10-01' } }));
igual('servicio: mes completo, sin prorrateo', extra && [extra.modalidadContratada, extra.diasPrimerMes, Number(extra.valorPrimerMes), extra.fechaFin], ['valor_fijo', 30, 450000, '2027-09-30']);
await paso('desactivar un plan', () => d(U.plan).update({ documentId: plan.documentId, data: { activo: false } }));
await paso('contratar un plan inactivo', () =>
  d(U.contrato).create({ data: contratoDePlan({ fechaInicio: '2026-11-01', unidadesContratadas: 10, unidadesMaximo: 20 }) }), 'inactivo');
await paso('borrar un plan', () => d(U.plan).delete({ documentId: plan.documentId }), 'no se borran');

// 6. Solicitudes
const solicitudDe = (extra) => ({ copropiedad: coprop.documentId, tipo: 'cambio_delegado', canal: 'correo_operaciones', solicitante: 'Consejo', motivo: 'Nuevo presidente', ...extra });
await paso('cambio de Delegado pedido desde BLOKY', () => d(U.solicitud).create({ data: solicitudDe({ canal: 'bloky' }) }), 'operaciones@idiky.com');
const solicitud = await paso('cambio de Delegado por correo', () => d(U.solicitud).create({ data: solicitudDe() }));
igual('fecha de recepción puesta sola', Boolean(solicitud?.fechaRecepcion), true);
await paso('aprobar sin resolución', () => d(U.solicitud).update({ documentId: solicitud.documentId, data: { estado: 'aprobada' } }), 'se escribe la resolución');
const aprobada = await paso('aprobar con resolución', () =>
  d(U.solicitud).update({ documentId: solicitud.documentId, data: { estado: 'aprobada', resolucion: 'Acta verificada' } }));
igual('fecha de resolución puesta sola', Boolean(aprobada?.fechaResolucion), true);

// Resultado
let fallas = 0;
for (const [estado, nombre, detalle] of resultados) {
  if (estado !== 'ok') fallas++;
  console.log(`${estado === 'ok' ? 'ok   ' : 'FALLA'} ${nombre}${detalle ? ` · ${detalle}` : ''}`);
}
console.log(`\n${resultados.length - fallas} de ${resultados.length} comprobaciones pasan${fallas ? ` · ${fallas} FALLAS` : ''}`);
await strapi.destroy();
rmSync(BASE, { force: true });
process.exit(fallas ? 1 : 0);
