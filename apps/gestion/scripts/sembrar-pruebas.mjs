// Siembra de datos de PRUEBA en BOB (T-75): tres copropiedades con sus perfiles raiz, para
// probar el ingreso a BLOKY (CU-B-01) y tener algo que mirar en el panel.
//
// Es IDEMPOTENTE: busca cada registro por su clave (NIT, documento, nombre) y solo crea lo que
// falta. Se puede correr las veces que haga falta. No borra nada (CLAUDE.md §6).
//
// Corre con el Strapi de verdad y SU base de datos: dentro del contenedor del servidor
// (PostgreSQL) o en tu maquina con `npm run develop` ya configurado (SQLite):
//
//   # en el servidor, como idiky:
//   podman cp apps/gestion/scripts/sembrar-pruebas.mjs idiky-gestion-strapi:/opt/app/scripts/
//   podman exec -e PRUEBA_NOMBRE='Daniel ...' -e PRUEBA_DOCUMENTO=CC:12345678 \
//     -e PRUEBA_CELULAR=3001234567 -e PRUEBA_CORREO=daniel@ejemplo.com \
//     idiky-gestion-strapi node scripts/sembrar-pruebas.mjs
//
//   # en tu maquina:
//   cd apps/gestion && node scripts/sembrar-pruebas.mjs
//
// Las variables PRUEBA_* son opcionales: si vienen, el Administrador de la primera copropiedad
// es esa persona real (para que el codigo por SMS llegue a un telefono de verdad). Si no, se
// usan personas ficticias con celulares que no existen.
//
// Lo que siembra (docs/13 §1-§3):
//   1. Conjunto Residencial Altos del Bosque — ACTIVA, residencial, Bogota, sin consejo.
//      Administrador (persona real si PRUEBA_*) y Delegado. Plan «Basico por unidad» contratado.
//   2. Edificio Torres del Parque — EN IMPLEMENTACION, mixto, Medellin, con consejo.
//      Administrador (empresa administradora) y Delegado (presidente del consejo).
//   3. Conjunto Mirador de la Sabana — SUSPENDIDA, residencial, Chia. Solo Administrador.
//      Sirve para comprobar que BLOKY NO deja entrar (RN-162).
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(APP);
process.env.STRAPI_TELEMETRY_DISABLED = 'true';

const require = createRequire(`${APP}/package.json`);
const { createStrapi, compileStrapi } = require('@strapi/strapi');
// En el contenedor ya esta compilado (dist/); en local se compila.
const strapi = await createStrapi(existsSync(`${APP}/dist`) ? { distDir: `${APP}/dist` } : await compileStrapi()).load();
strapi.log.level = 'error';

const d = (uid) => strapi.documents(uid);
const U = {
  tipo: 'api::tipo-de-bien.tipo-de-bien',
  plan: 'api::plan.plan',
  coprop: 'api::copropiedad.copropiedad',
  persona: 'api::persona.persona',
  asig: 'api::asignacion.asignacion',
  contrato: 'api::contratacion.contratacion',
};
const hoy = new Date().toISOString().slice(0, 10);
const resumen = [];
const anotar = (que, como) => { resumen.push([que, como]); console.log(`  ${como.padEnd(9)} ${que}`); };

/** Digito de verificacion del NIT (modulo 11 de la DIAN), igual que src/bob/reglas.ts. */
function dv(nit) {
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const suma = [...nit].reverse().reduce((a, x, i) => a + Number(x) * pesos[i], 0);
  const r = suma % 11;
  return String(r > 1 ? 11 - r : r);
}

async function unoOCrear(uid, filtro, data, etiqueta) {
  const [existente] = await d(uid).findMany({ filters: filtro, limit: 1 });
  if (existente) { anotar(etiqueta, 'ya estaba'); return existente; }
  const creado = await d(uid).create({ data });
  anotar(etiqueta, 'creado');
  return creado;
}

// Catalogo de tipos de bien (lo siembra BOB al arrancar).
const tipos = await d(U.tipo).findMany({ limit: 50 });
const tipo = (nombre) => {
  const t = tipos.find((x) => x.nombre === nombre);
  if (!t) throw new Error(`No existe el tipo de bien «${nombre}»: ¿arranco BOB al menos una vez?`);
  return t.documentId;
};

// ---------------------------------------------------------------- Personas
const [tipoDoc, numDoc] = (process.env.PRUEBA_DOCUMENTO ?? 'CC:1000000001').split(':');
const personas = {
  adminReal: {
    nombre: process.env.PRUEBA_NOMBRE ?? 'Olga Lucía Henao', tipoDocumento: tipoDoc, numeroDocumento: numDoc,
    celular: process.env.PRUEBA_CELULAR ?? '3000000001', correo: process.env.PRUEBA_CORREO ?? 'olga.henao@ejemplo.com',
    notas: 'Persona de prueba (sembrar-pruebas.mjs). Administradora de Altos del Bosque.',
  },
  delegada1: { nombre: 'María Camila Restrepo', tipoDocumento: 'CC', numeroDocumento: '1000000002', celular: '3000000002', correo: 'maria.restrepo@ejemplo.com', notas: 'Persona de prueba. Delegada de Altos del Bosque.' },
  admin2: { nombre: 'Jorge Enrique Valencia', tipoDocumento: 'CC', numeroDocumento: '1000000003', celular: '3000000003', correo: 'jorge.valencia@ejemplo.com', notas: 'Persona de prueba. Representante de Administra Bien SAS, administradora de Torres del Parque.' },
  delegado2: { nombre: 'Sandra Milena Ortiz', tipoDocumento: 'CE', numeroDocumento: '1000000004', celular: '3000000004', correo: 'sandra.ortiz@ejemplo.com', notas: 'Persona de prueba. Presidenta del consejo de Torres del Parque.' },
  admin3: { nombre: 'Andrés Felipe Gómez', tipoDocumento: 'CC', numeroDocumento: '1000000005', celular: '3000000005', correo: 'andres.gomez@ejemplo.com', notas: 'Persona de prueba. Administrador de una copropiedad suspendida: BLOKY no debe dejarlo entrar.' },
};
console.log('Personas');
const P = {};
for (const [clave, p] of Object.entries(personas)) {
  P[clave] = await unoOCrear(U.persona, { tipoDocumento: p.tipoDocumento, numeroDocumento: p.numeroDocumento }, p, `${p.nombre} (${p.tipoDocumento} ${p.numeroDocumento})`);
}

// ---------------------------------------------------------------- Copropiedades
const copropiedades = [
  {
    nombre: 'Conjunto Residencial Altos del Bosque', nit: '900123456', tipo: 'conjunto', uso: 'residencial',
    tieneConsejoAdministracion: false, estado: 'activa', estrato: 4,
    ubicacion: { pais: 'CO', divipola: '11001000', departamento: 'Bogotá D.C.', municipio: 'Bogotá', barrio: 'Cedritos', direccion: 'Calle 147 # 7-45' },
    resumenDeBienes: [
      { tipoDeBien: tipo('Apartamento'), cantidad: 120 },
      { tipoDeBien: tipo('Parqueadero'), cantidad: 96 },
      { tipoDeBien: tipo('Local'), cantidad: 2 },
    ],
    notas: 'Copropiedad de PRUEBA (sembrar-pruebas.mjs). Activa: sus perfiles raíz pueden entrar a BLOKY.',
  },
  {
    nombre: 'Edificio Torres del Parque', nit: '800234567', tipo: 'edificio', uso: 'mixto',
    tieneConsejoAdministracion: true, estado: 'en_implementacion',
    ubicacion: { pais: 'CO', divipola: '05001000', departamento: 'Antioquia', municipio: 'Medellín', barrio: 'El Poblado', direccion: 'Carrera 43A # 5-15' },
    resumenDeBienes: [
      { tipoDeBien: tipo('Apartamento'), cantidad: 48 },
      { tipoDeBien: tipo('Oficina'), cantidad: 12 },
      { tipoDeBien: tipo('Local'), cantidad: 6 },
      { tipoDeBien: tipo('Parqueadero'), cantidad: 70 },
    ],
    notas: 'Copropiedad de PRUEBA. En implementación: sus perfiles raíz ya pueden entrar a BLOKY. Tiene consejo.',
  },
  {
    nombre: 'Conjunto Mirador de la Sabana', nit: '901345678', tipo: 'conjunto', uso: 'residencial',
    tieneConsejoAdministracion: false, estado: 'suspendida', estrato: 3,
    ubicacion: { pais: 'CO', divipola: '25175000', departamento: 'Cundinamarca', municipio: 'Chía', direccion: 'Km 2 vía Chía - Cajicá' },
    resumenDeBienes: [
      { tipoDeBien: tipo('Casa'), cantidad: 36 },
      { tipoDeBien: tipo('Parqueadero'), cantidad: 36 },
    ],
    notas: 'Copropiedad de PRUEBA. Suspendida: BLOKY no debe dejar entrar a su administrador (RN-162).',
  },
];
console.log('Copropiedades');
const C = [];
for (const c of copropiedades) {
  C.push(await unoOCrear(U.coprop, { nit: c.nit }, { ...c, digitoVerificacion: dv(c.nit) }, `${c.nombre} (NIT ${c.nit}-${dv(c.nit)}, ${c.estado})`));
}

// ---------------------------------------------------------------- Asignaciones (perfiles raiz)
async function asignar(coprop, persona, rol, extra = {}) {
  const existentes = await d(U.asig).findMany({
    filters: { rol, estado: 'vigente', copropiedad: { documentId: coprop.documentId }, persona: { documentId: persona.documentId } },
    limit: 1,
  });
  const etiqueta = `${rol} de ${coprop.nombre}: ${persona.nombre}`;
  if (existentes[0]) { anotar(etiqueta, 'ya estaba'); return existentes[0]; }
  const creado = await d(U.asig).create({
    data: { copropiedad: coprop.documentId, persona: persona.documentId, rol, estado: 'vigente', desde: hoy, esEmpresaAdministradora: false, ...extra },
  });
  anotar(etiqueta, 'creado');
  return creado;
}
console.log('Perfiles raíz');
await asignar(C[0], P.adminReal, 'administrador', { tipoSoporte: 'acta_asamblea', notas: 'Nombrada por la asamblea. Prueba.' });
await asignar(C[0], P.delegada1, 'delegado', { tipoSoporte: 'acta_asamblea', notas: 'Sin consejo: la nombra la asamblea. Prueba.' });
await asignar(C[1], P.admin2, 'administrador', { esEmpresaAdministradora: true, empresaRazonSocial: 'Administra Bien SAS', empresaNit: '901987654', tipoSoporte: 'acta_consejo', notas: 'Empresa administradora. Prueba.' });
await asignar(C[1], P.delegado2, 'delegado', { tipoSoporte: 'acta_consejo', notas: 'Presidenta del consejo. Prueba.' });
await asignar(C[2], P.admin3, 'administrador', { tipoSoporte: 'acta_asamblea', notas: 'Prueba: copropiedad suspendida.' });

// ---------------------------------------------------------------- Plan y contratacion (opcional)
console.log('Plan y contratación');
try {
  const plan = await unoOCrear(U.plan, { nombre: 'Básico por unidad' }, {
    nombre: 'Básico por unidad', modalidad: 'por_unidad', valorMensual: 3500, duracionMeses: 12, restringeUnidades: true, activo: true,
    condiciones: 'Plan de prueba: cartera, comunicados, reservas y asambleas. Se cobra por unidad facturable del contrato.',
  }, 'Plan «Básico por unidad»');
  const [contrato] = await d(U.contrato).findMany({ filters: { copropiedad: { documentId: C[0].documentId }, tipo: 'plan', estado: 'vigente' }, limit: 1 });
  if (contrato) anotar('Contratación de Altos del Bosque', 'ya estaba');
  else {
    await d(U.contrato).create({ data: { copropiedad: C[0].documentId, tipo: 'plan', plan: plan.documentId, estado: 'vigente', fechaInicio: hoy, unidadesContratadas: 122, unidadesMinimo: 100, unidadesMaximo: 130, notas: 'Contrato de prueba.' } });
    anotar('Contratación de Altos del Bosque', 'creado');
  }
} catch (error) {
  anotar(`Plan/contratación: ${error.message}`, 'omitido');
}

console.log('\nListo. Para probar el ingreso a BLOKY:');
console.log(`  - ${P.adminReal.nombre}: ${P.adminReal.tipoDocumento} ${P.adminReal.numeroDocumento} → Administrador de Altos del Bosque (activa): DEBE entrar.`);
console.log(`  - ${P.delegado2.nombre}: ${P.delegado2.tipoDocumento} ${P.delegado2.numeroDocumento} → Delegada de Torres del Parque (en implementación): DEBE entrar.`);
console.log(`  - ${P.admin3.nombre}: ${P.admin3.tipoDocumento} ${P.admin3.numeroDocumento} → Administrador de una suspendida: NO debe entrar.`);
await strapi.destroy();
process.exit(resumen.some(([, c]) => c === 'omitido') ? 0 : 0);
