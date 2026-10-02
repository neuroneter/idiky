// @ts-nocheck — traídas de los scripts de cada sesión (T-42); se escriben en JS suelto.
/**
 * Usuarios: crear, cambiar e inhabilitar (CU-R-27, CU-A-26, CU-A-02, RN-57 a RN-68).
 *
 * Pruebas de Mary, traídas al repositorio el 2026-10-02 (T-42, ADR-0020). Corren
 * con el reloj fijo de `./base` (viernes 2026-10-09, 10:00, Bogotá).
 */
import { AHORA_PRUEBAS, expect, test } from './base'

test("quién registra a quién y quién ve los soportes (RN-60, RN-63, RN-67)", async ({ page }) => {
  test.setTimeout(180_000)
  const p = page
  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  await p.goto('/'); await p.evaluate(() => localStorage.clear()); await p.goto('/'); await p.waitForTimeout(500)
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts')
    const base = { copropiedadId: 'cop-1', nombres: 'Ana', apellidos: 'Prueba', documento: '99887766', email: 'a@b.co', telefono: '3001234567' }
    const intento = async (bd, extra) => { try { const x = await repo.crearRegistroPersona(bd, { ...base, ...extra }); return { ok: true, id: x.datos.id, bd: x.bd } } catch (e) { return { ok: false, msg: e.message } } }
    const bd = await repo.cargar()
    const out = {}
    out.arrendatarioResidente = await intento(bd, { unidadId: 'uni-torre1-301', creadoPor: 'per-5', categoria: 'arrendatario', condicion: 'residente' })
    out.arrendatarioVisitante = await intento(bd, { unidadId: 'uni-torre1-301', creadoPor: 'per-5', categoria: 'visitante', condicion: 'no_residente', vigenciaDesde: '2026-12-01', vigenciaHasta: '2026-12-01', documento: '11223344' })
    out.propietarioResidente = await intento(bd, { unidadId: 'uni-torre1-402', creadoPor: 'per-1', categoria: 'arrendatario', condicion: 'residente', documento: '55667788' })
    out.ajenoResidente = await intento(bd, { unidadId: 'uni-torre1-402', creadoPor: 'per-5', categoria: 'arrendatario', condicion: 'residente', documento: '44332211' })
    out.admin = await intento(bd, { unidadId: 'uni-torre1-402', creadoPor: 'per-admin', categoria: 'propietario', condicion: 'residente', documento: '12121212' })
    // RN-67
    const reg = out.propietarioResidente
    const ver = async (bd2, personaId) => { try { await repo.registrarAccesoSoportes(bd2, { registroId: reg.id, personaId }); return 'ok' } catch (e) { return e.message } }
    out.verCreador = await ver(reg.bd, 'per-1'); out.verAdmin = await ver(reg.bd, 'per-admin'); out.verOtro = await ver(reg.bd, 'per-5')
    for (const k of Object.keys(out)) if (out[k] && out[k].bd) delete out[k].bd
    return out
  })
  check(!r.arrendatarioResidente.ok && /RN-60/.test(r.arrendatarioResidente.msg), 'RN-60: el arrendatario no registra un residente')
  check(r.arrendatarioVisitante.ok, 'RN-60: el arrendatario sí registra un visitante')
  check(r.propietarioResidente.ok, 'RN-60: el propietario registra un residente')
  check(!r.ajenoResidente.ok, 'RN-60: nadie registra en una unidad que no es suya')
  check(!r.admin.ok, 'RN-63: la administración no registra un segundo propietario')
  check(r.verCreador === 'ok' && r.verAdmin === 'ok' && r.verOtro !== 'ok', 'RN-67: ven los soportes quien creó y la administración; otro no')
})

test("temporal entra a la app, sin doble vínculo, la administración solo registra al primer propietario (RN-61, RN-63, RN-65)", async ({ page }) => {
  test.setTimeout(180_000)
  const p = page
  await p.goto('/'); await p.evaluate(() => localStorage.clear()); await p.goto('/'); await p.waitForTimeout(400)
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); const { perfilDe } = await import('/src/features/auth/perfil.ts')
    const { residenciaVigente } = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar()
    const maria = bd.perfilesDemo.find(x => x.rol==="residente")
    const out = { maria: maria.personaId }
    const hoy = new Date().toISOString().slice(0,10); const fin = new Date(Date.now()+20*864e5).toISOString().slice(0,10)
    let res = await repo.crearRegistroPersona(bd, { copropiedadId: maria.copropiedadId, unidadId: maria.unidadId, creadoPor: maria.personaId, categoria:'visitante', condicion:'temporal', nombres:'Ana', apellidos:'Prueba', documento:'99887766', email:'', telefono:'3001112233', vigenciaDesde: hoy, vigenciaHasta: fin })
    bd = res.bd; const reg = res.datos
    res = await repo.adjuntarSoportes(bd, { registroId: reg.id, fotoDocumento:'data:x', fotoPersona:'data:x', consentimiento:'v1' }); bd = res.bd
    res = await repo.autorizarRegistro(bd, { registroId: reg.id, personaId: maria.personaId }); bd = res.bd
    const ana = bd.personas.find(x => x.documento==='99887766')
    out.temporalPuedeEntrar = !!perfilDe(bd, ana.id)
    // mismo documento otra vez como residente en la misma unidad
    try { res = await repo.crearRegistroPersona(bd, { copropiedadId: maria.copropiedadId, unidadId: maria.unidadId, creadoPor: maria.personaId, categoria:'arrendatario', condicion:'residente', nombres:'Ana', apellidos:'Prueba', documento:'99887766', email:'', telefono:'3001112233' }); bd=res.bd
      res = await repo.marcarSoportesNoObligatorios(bd,{registroId:res.datos.id, marcadoPor:'x', marcar:true}); bd=res.bd
      res = await repo.autorizarRegistro(bd, { registroId: res.datos.id, personaId: maria.personaId }); bd=res.bd
      out.dobleVinculo = bd.residencias.filter(x=>x.personaId===ana.id && residenciaVigente(x)).length
    } catch(e) { out.dobleVinculo = 'bloqueado: '+e.message }
    // inhabilitar hoy: sigue vigente?
    const v = bd.residencias.find(x=>x.personaId===ana.id)
    res = await repo.desvincularResidente(bd, { residenciaId: v.id, personaId: maria.personaId }); bd = res.bd
    out.inhabilitadaSigueVigenteHoy = residenciaVigente(bd.residencias.find(x=>x.id===v.id))
    // teléfono repetido
    out.mismoCelular = bd.personas.filter(x=>x.telefono && bd.personas.some(y=>y!==x && y.telefono===x.telefono)).map(x=>x.nombres)
    // admin registra un segundo propietario en una unidad que ya tiene dueño
    const admin = bd.perfilesDemo.find(x=>x.rol==='admin')
    try { res = await repo.crearRegistroPersona(bd, { copropiedadId: admin.copropiedadId, unidadId: maria.unidadId, creadoPor: admin.personaId, categoria:'propietario', condicion:'residente', nombres:'Otro', apellidos:'Dueno', documento:'55443322', email:'', telefono:'3001234567' }); out.adminSegundoPropietario = 'permitido' } catch(e) { out.adminSegundoPropietario = 'bloqueado' }
    // admin registra un arrendatario directamente
    try { res = await repo.crearRegistroPersona(bd, { copropiedadId: admin.copropiedadId, unidadId: maria.unidadId, creadoPor: admin.personaId, categoria:'arrendatario', condicion:'residente', nombres:'Arr', apellidos:'Directo', documento:'11223344', email:'', telefono:'3001234567' }); out.adminArrendatarioRegistro = 'permitido' } catch(e) { out.adminArrendatarioRegistro = 'bloqueado' }
    // admin registra el primer propietario de una unidad sin dueño (tras inhabilitar al de la 402)
    const dueno = bd.residencias.find(x=>x.unidadId===maria.unidadId && x.rol==='propietario' && residenciaVigente(x))
    try { await repo.desvincularResidente(bd, { residenciaId: dueno.id, personaId: maria.personaId }); out.seInhabilitaASiMisma='permitido' } catch(e) { out.seInhabilitaASiMisma='bloqueado' }
    const otroVinculo = bd.residencias.find(x=>x.personaId!==maria.personaId && !x.registroId && residenciaVigente(x) && x.unidadId!==maria.unidadId)
    try { await repo.desvincularResidente(bd, { residenciaId: otroVinculo.id, personaId: maria.personaId }); out.propietarioInhabilitaAjeno='permitido' } catch(e) { out.propietarioInhabilitaAjeno='bloqueado' }
    res = await repo.desvincularResidente(bd, { residenciaId: dueno.id, personaId: admin.personaId }); bd = res.bd; out.adminInhabilitaPropietario='permitido'
    try { res = await repo.crearRegistroPersona(bd, { copropiedadId: admin.copropiedadId, unidadId: maria.unidadId, creadoPor: admin.personaId, categoria:'propietario', condicion:'residente', nombres:'Nuevo', apellidos:'Dueno', documento:'55443322', email:'', telefono:'3001234567' }); out.adminPrimerPropietarioTrasVenta = 'permitido'; bd=res.bd
      try { await repo.crearRegistroPersona(bd, { copropiedadId: admin.copropiedadId, unidadId: maria.unidadId, creadoPor: admin.personaId, categoria:'propietario', condicion:'residente', nombres:'Otro', apellidos:'Mas', documento:'12121212', email:'', telefono:'3001234567' }); out.adminOtroMientrasEnCurso='permitido' } catch(e) { out.adminOtroMientrasEnCurso='bloqueado' }
    } catch(e) { out.adminPrimerPropietarioTrasVenta = 'bloqueado: '+e.message }
    out.vincularResidenteExiste = typeof repo.vincularResidente
    return out
  })
  expect(r).toMatchObject({
    temporalPuedeEntrar: true,
    inhabilitadaSigueVigenteHoy: false,
    mismoCelular: [],
    adminSegundoPropietario: 'bloqueado',
    adminArrendatarioRegistro: 'bloqueado',
    seInhabilitaASiMisma: 'bloqueado',
    propietarioInhabilitaAjeno: 'bloqueado',
    adminInhabilitaPropietario: 'permitido',
    adminPrimerPropietarioTrasVenta: 'permitido',
    adminOtroMientrasEnCurso: 'bloqueado',
    vincularResidenteExiste: 'undefined',
  })
  expect(r.dobleVinculo).toMatch(/^bloqueado/)
})

test("cambio de propietario: el arrendatario sigue y lo hereda el nuevo dueño (RN-65)", async ({ page }) => {
  test.setTimeout(180_000)
  const p = page
  await p.goto('/'); await p.evaluate(() => localStorage.clear()); await p.goto('/'); await p.waitForTimeout(400)
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); const { residenciaVigente } = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar(); const out = {}
    const maria = bd.perfilesDemo.find(x => x.rol==='residente'); const admin = bd.perfilesDemo.find(x=>x.rol==='admin')
    const base = { copropiedadId: maria.copropiedadId, unidadId: maria.unidadId, email:'', telefono:'3001234567' }
    let res = await repo.crearRegistroPersona(bd, { ...base, creadoPor: maria.personaId, categoria:'arrendatario', condicion:'residente', nombres:'Arre', apellidos:'Sigue', documento:'40404040' }); bd=res.bd
    res = await repo.adjuntarSoportes(bd, { registroId: res.datos.id, fotoDocumento:'x', fotoPersona:'x', consentimiento:'v1' }); bd=res.bd
    res = await repo.autorizarRegistro(bd, { registroId: res.datos.id, personaId: maria.personaId }); bd=res.bd
    const arre = bd.residencias.find(x=>x.id===res.datos.residenciaId)
    res = await repo.crearRegistroPersona(bd, { ...base, creadoPor: maria.personaId, categoria:'visitante', condicion:'temporal', nombres:'A', apellidos:'Medias', documento:'50505050', vigenciaDesde: new Date().toISOString().slice(0,10), vigenciaHasta: new Date(Date.now()+5*864e5).toISOString().slice(0,10) }); bd=res.bd
    const pendiente = res.datos.id
    const duenos = bd.residencias.filter(x=>x.unidadId===maria.unidadId && x.rol==='propietario' && residenciaVigente(x))
    for (const d of duenos) { res = await repo.desvincularResidente(bd, { residenciaId: d.id, personaId: admin.personaId, motivo:'cambio_propietario' }); bd=res.bd }
    out.arrendatarioSigue = residenciaVigente(bd.residencias.find(x=>x.id===arre.id))
    out.pendienteAnulado = bd.registros.find(x=>x.id===pendiente).estado
    res = await repo.crearRegistroPersona(bd, { ...base, creadoPor: admin.personaId, categoria:'propietario', condicion:'residente', nombres:'Nuevo', apellidos:'Dueno', documento:'60606060', soportesNoObligatorios:true }); bd=res.bd
    res = await repo.autorizarRegistro(bd, { registroId: res.datos.id, personaId: admin.personaId }); bd=res.bd
    const nuevo = bd.personas.find(x=>x.documento==='60606060')
    // el nuevo registra otro propietario
    try { res = await repo.crearRegistroPersona(bd, { ...base, creadoPor: nuevo.id, categoria:'propietario', condicion:'residente', nombres:'Co', apellidos:'Dueno', documento:'70707070' }); bd=res.bd; out.nuevoRegistraCopropietario='permitido' } catch(e) { out.nuevoRegistraCopropietario='bloqueado: '+e.message }
    try { res = await repo.desvincularResidente(bd, { residenciaId: arre.id, personaId: nuevo.id }); bd=res.bd; out.nuevoInhabilitaArrendatario='permitido' } catch(e) { out.nuevoInhabilitaArrendatario='bloqueado: '+e.message }
    return out
  })
  expect(r).toEqual({
    arrendatarioSigue: true,
    pendienteAnulado: 'anulado',
    nuevoRegistraCopropietario: 'permitido',
    nuevoInhabilitaArrendatario: 'permitido',
  })
})

test("cambio de propietario desde Unidades lleva a registrar al nuevo (CU-A-02, RN-63)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  const p = page
  const URL='/'
  const errores=[]; p.on('pageerror', e=>errores.push(e.message))
  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(400)
  await p.getByText('¿Estás viendo el demo?').click(); await p.getByText('Olga Lucia Henao', { exact: true }).click(); await p.waitForTimeout(500)
  await p.goto(URL+'#/admin/unidades'); await p.waitForTimeout(500)
  await p.getByText('402').first().click(); await p.waitForTimeout(400)
  check(await p.getByRole('link', { name: 'Registrar propietario' }).count() === 0, 'con dueño no se ofrece registrar propietario')
  const fila = p.locator('.modal .fila').filter({ hasText: 'Propietario' }).first()
  await fila.getByRole('button', { name: 'Inhabilitar' }).click(); await p.waitForTimeout(200)
  check(await p.locator('#motivo-cierre').inputValue() === 'cambio_propietario', 'al propietario se le propone cambio de propietario')
  await p.locator('#detalle-cierre').fill('Escritura 1234 Notaría 5')
  await p.getByRole('button', { name: 'Inhabilitar y registrar al nuevo' }).click(); await p.waitForTimeout(900)
  check(p.url().includes('#/admin/registros?unidad='), 'lleva a Registros con la unidad: ' + p.url())
  const sel = p.locator('select').first()
  const texto = await sel.locator('option:checked').textContent().catch(()=>'')
  check(/402/.test(texto ?? ''), 'el formulario abre con la 402 escogida: ' + texto)
  check(await p.locator('#rol').count() === 0, 'no se escoge título: es propietario')
  const cierre = await p.evaluate(() => { const bd = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('bd')||k.includes('datos')))); return bd.residencias.find(r=>r.cierre)?.cierre })
  check(cierre?.motivo === 'cambio_propietario' && /1234/.test(cierre?.detalle), 'queda el motivo y la explicación: ' + JSON.stringify(cierre))
  check(errores.length===0, 'sin errores de página ' + errores.join(';'))
  
})

test("quién es y cómo se queda: combinaciones, aprobación del propietario y fotos opcionales (RN-57, RN-60, RN-62, RN-68)", async ({ page }) => {
  test.setTimeout(180_000)
  const p = page
  await p.goto('/'); await p.evaluate(() => localStorage.clear()); await p.goto('/'); await p.waitForTimeout(400)
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); const { residenciaVigente } = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar(); const out = {}
    const hoy = new Date().toISOString().slice(0,10); const en = (d) => new Date(Date.now()+d*864e5).toISOString().slice(0,10)
    const arr = bd.residencias.find(x=>x.rol==='arrendatario' && residenciaVigente(x) && bd.residencias.some(y=>y.unidadId===x.unidadId && y.rol==='propietario' && residenciaVigente(y)))
    const unidad = arr.unidadId
    const dueno = bd.residencias.find(x=>x.unidadId===unidad && x.rol==='propietario' && residenciaVigente(x))
    const base = { copropiedadId: 'cop-1', unidadId: unidad, email:'', telefono:'3005550000', nombres:'N', apellidos:'P' }
    const intento = async (f) => { try { const res = await f(); bd = res.bd; return res.datos } catch(e) { return 'ERR: '+e.message } }
    const autorizarConFotos = async (reg, quien) => { let res = await repo.adjuntarSoportes(bd, { registroId: reg.id, fotoDocumento:'x', fotoPersona:'x', consentimiento:'v1' }); bd=res.bd; return intento(()=>repo.autorizarRegistro(bd, { registroId: reg.id, personaId: quien })) }
    out.arrendatarioNoResidente = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: dueno.personaId, categoria:'arrendatario', condicion:'no_residente', documento:'1001' }))
    out.visitanteResidente = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: dueno.personaId, categoria:'visitante', condicion:'residente', documento:'1002' }))
    let reg = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: dueno.personaId, categoria:'propietario', condicion:'no_residente', documento:'1003' }))
    out.propNoResEstado = reg.estado; reg = await autorizarConFotos(reg, dueno.personaId)
    let res1 = bd.residencias.find(x=>x.id===reg.residenciaId); out.propNoRes = { rol: res1.rol, reside: res1.reside, hasta: res1.hasta ?? null }
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: dueno.personaId, categoria:'arrendatario', condicion:'temporal', documento:'1004', vigenciaDesde: hoy, vigenciaHasta: en(60) }))
    reg = await autorizarConFotos(reg, dueno.personaId); res1 = bd.residencias.find(x=>x.id===reg.residenciaId); out.arrTemporal = { rol: res1.rol, reside: res1.reside, hasta: !!res1.hasta }
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: arr.personaId, categoria:'visitante', condicion:'temporal', documento:'1005', vigenciaDesde: hoy, vigenciaHasta: en(3) }))
    out.cortaSinAprobacion = !reg.aprobacionPropietario; reg = await autorizarConFotos(reg, arr.personaId); res1 = bd.residencias.find(x=>x.id===reg.residenciaId); out.visTemporal = { rol: res1?.rol, hasta: !!res1?.hasta }
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: arr.personaId, categoria:'visitante', condicion:'temporal', documento:'1006', vigenciaDesde: hoy, vigenciaHasta: en(10) }))
    out.largaPideAprobacion = !!reg.aprobacionPropietario
    out.avisoAlDueno = bd.mensajes.some(m=>m.motivo==='estadia_por_aprobar' && m.registroId===reg.id)
    let res = await repo.adjuntarSoportes(bd, { registroId: reg.id, fotoDocumento:'x', fotoPersona:'x', consentimiento:'v1' }); bd=res.bd
    out.autorizarSinAprobar = await intento(()=>repo.autorizarRegistro(bd, { registroId: reg.id, personaId: arr.personaId }))
    out.arrendatarioSeAprueba = await intento(()=>repo.decidirEstadiaComoPropietario(bd, { registroId: reg.id, personaId: arr.personaId, aprobar:true }))
    await intento(()=>repo.decidirEstadiaComoPropietario(bd, { registroId: reg.id, personaId: dueno.personaId, aprobar:true }))
    const aut = await intento(()=>repo.autorizarRegistro(bd, { registroId: reg.id, personaId: arr.personaId })); out.autorizadaTrasAprobar = aut.estado
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: arr.personaId, categoria:'visitante', condicion:'temporal', documento:'1007', vigenciaDesde: hoy, vigenciaHasta: en(14) }))
    const rech = await intento(()=>repo.decidirEstadiaComoPropietario(bd, { registroId: reg.id, personaId: dueno.personaId, aprobar:false, motivo:'Es demasiado tiempo' })); out.rechazada = rech.estado
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: arr.personaId, categoria:'visitante', condicion:'no_residente', documento:'1008', vigenciaDesde: hoy, vigenciaHasta: hoy }))
    out.visitaSinFotos = reg.estado + (reg.visitanteId ? '+codigo' : '')
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...base, creadoPor: arr.personaId, categoria:'visitante', condicion:'no_residente', pedirFotos:true, documento:'1009', vigenciaDesde: hoy, vigenciaHasta: hoy }))
    out.visitaConFotosEstado = reg.estado; reg = await autorizarConFotos(reg, arr.personaId); out.visitaConFotosFinal = reg.estado + (reg.visitanteId ? '+codigo' : '')
    return out
  })
  const esperado = { arrendatarioNoResidente: /^ERR/, visitanteResidente: /^ERR/, propNoResEstado: 'esperando_soportes', cortaSinAprobacion: true, largaPideAprobacion: true, avisoAlDueno: true, autorizarSinAprobar: /^ERR/, arrendatarioSeAprueba: /^ERR/, autorizadaTrasAprobar: 'autorizado', rechazada: 'rechazado', visitaSinFotos: 'autorizado+codigo', visitaConFotosEstado: 'esperando_soportes', visitaConFotosFinal: 'autorizado+codigo' }
  for (const [k,v] of Object.entries(esperado)) { const ok = v instanceof RegExp ? v.test(String(r[k])) : r[k]===v; expect.soft(ok, k).toBeTruthy() }
  const ok2 = r.propNoRes.rol==='propietario' && r.propNoRes.reside===false && r.propNoRes.hasta===null && r.arrTemporal.rol==='arrendatario' && r.arrTemporal.hasta && r.visTemporal.rol==='autorizado' && r.visTemporal.hasta
  expect.soft(ok2, 'residencias').toBeTruthy()
})

test("el formulario ofrece solo lo que aplica y el propietario aprueba la estadía larga (RN-60, RN-68)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 420, height: 900 })
  const p = page
  const URL='/'
  const errores=[]; p.on('pageerror', e=>errores.push(e.message))
  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  async function entrar(nombre) { await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL); await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(500) }
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(400)
  await entrar('Maria Camila Restrepo')
  await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.waitForTimeout(300)
  const segs = async () => (await p.locator('.segmento').allTextContents()).map(t=>t.trim())
  check(JSON.stringify(await segs())===JSON.stringify(['Residente','No residente']), 'propietario: residente o no residente ' + await segs())
  await p.locator('.opcion-categoria', { has: p.locator('strong', { hasText: /^Arrendatario$/ }) }).click(); await p.waitForTimeout(100)
  check(JSON.stringify(await segs())===JSON.stringify(['Residente','Residente temporal']), 'arrendatario: sin «no residente» ' + await segs())
  await p.locator('.opcion-categoria', { has: p.locator('strong', { hasText: /^Visitante$/ }) }).click(); await p.waitForTimeout(100)
  check(JSON.stringify(await segs())===JSON.stringify(['De un día','Frecuente','Residente temporal']), 'visitante: de un día, frecuente o temporal ' + await segs())
  check(await p.getByText('Pedirle las fotos').count()===1, 'la visita de un día ofrece pedir fotos')
  // Sandra, arrendataria: visitante temporal de 10 días
  await entrar('Sandra Milena Ortiz')
  await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.waitForTimeout(300)
  await p.locator('.opcion-categoria', { has: p.locator('strong', { hasText: /^Visitante$/ }) }).click(); await p.waitForTimeout(100)
  await p.locator('.segmento', { hasText: 'Residente temporal' }).click()
  const fin = new Date(new Date(AHORA_PRUEBAS).getTime()+10*864e5).toISOString().slice(0,10)
  const fechas = p.locator('input[type="date"]'); await fechas.nth(1).fill(fin); await p.waitForTimeout(100)
  check(await p.getByText('el propietario tiene que aprobar').count()===1, 'aviso de aprobación del propietario')
  await p.locator('#nombres').fill('Tia'); await p.locator('#apellidos').fill('Larga Estadia'); await p.locator('#documento').fill('77889900')
  await p.getByRole('button', { name: 'Crear el registro' }).click(); await p.waitForTimeout(700)
  check(await p.getByText('Espera al propietario').count()>=1, 'el detalle dice que espera al propietario')
  check(await p.getByRole('button', { name: 'Autorizar el registro' }).count()===0, 'Sandra no puede autorizar todavía')
  // Gustavo (dueño no residente de la 301) entra con su documento
  await entrar('Gustavo Adolfo Mejia')
  check(await p.getByText('Torre 1 · 301').count()>0, 'Gustavo entra desde la lista de perfiles')
  await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(600)
  await p.getByText('Tia Larga Estadia').first().click(); await p.waitForTimeout(300)
  check(await p.getByRole('button', { name: 'Aprobar la estadía' }).count()===1, 'el dueño ve «Aprobar la estadía»')
  await p.getByRole('button', { name: 'Aprobar la estadía' }).click(); await p.waitForTimeout(700)
  check(await p.getByText('Aprobada por el propietario').count()>=1, 'queda aprobada')
  check(errores.length===0, 'sin errores de página ' + errores.join(';'))
  
})

test("cambiar condición y fecha, inhabilitar en cadena y contacto obligatorio (RN-60, RN-65, RN-68)", async ({ page }) => {
  test.setTimeout(180_000)
  const p = page
  await p.goto('/'); await p.evaluate(() => localStorage.clear()); await p.goto('/'); await p.waitForTimeout(400)
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); const { residenciaVigente } = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar(); const out = {}
    const hoy = new Date().toISOString().slice(0,10); const en = (d) => new Date(Date.now()+d*864e5).toISOString().slice(0,10)
    const intento = async (f) => { try { const res = await f(); bd = res.bd; return res.datos } catch(e) { return 'ERR: '+e.message } }
    const autorizar = async (reg, quien) => { let res = await repo.adjuntarSoportes(bd, { registroId: reg.id, fotoDocumento:'x', fotoPersona:'x', consentimiento:'v1' }); bd=res.bd; return intento(()=>repo.autorizarRegistro(bd, { registroId: reg.id, personaId: quien })) }
    const maria='per-1', sandra='per-5', gustavo='per-13', admin='per-admin', jorge='per-4'
    const b402 = { copropiedadId:'cop-1', unidadId:'uni-torre1-402', nombres:'N', apellidos:'P', email:'' }
    const b301 = { ...b402, unidadId:'uni-torre1-301' }
    out.propietarioTemporal = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3001', creadoPor: maria, categoria:'propietario', condicion:'temporal', documento:'2001', vigenciaDesde: hoy, vigenciaHasta: en(9) }))
    out.sinContacto = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: maria, categoria:'arrendatario', condicion:'residente', documento:'2002' }))
    out.visitaSinContacto = (await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: maria, categoria:'visitante', condicion:'no_residente', documento:'2003', vigenciaDesde: hoy, vigenciaHasta: hoy }))).estado
    const resMaria = bd.residencias.find(x=>x.personaId===maria && residenciaVigente(x))
    const c1 = await intento(()=>repo.cambiarEstadia(bd, { residenciaId: resMaria.id, personaId: maria, condicion:'no_residente' }))
    out.mariaNoResidente = c1.reside === false && c1.cambios?.length === 1
    out.mariaTemporal = await intento(()=>repo.cambiarEstadia(bd, { residenciaId: resMaria.id, personaId: maria, condicion:'temporal', hasta: en(5) }))
    let reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3002', creadoPor: maria, categoria:'arrendatario', condicion:'residente', documento:'2004' }))
    reg = await autorizar(reg, maria); const arr402 = bd.residencias.find(x=>x.id===reg.residenciaId)
    const c2 = await intento(()=>repo.cambiarEstadia(bd, { residenciaId: arr402.id, personaId: maria, condicion:'temporal', hasta: en(30) }))
    out.arrendatarioATemporal = !!c2.hasta && !c2.cambioPendiente
    out.arrendatarioNoResidente = await intento(()=>repo.cambiarEstadia(bd, { residenciaId: arr402.id, personaId: maria, condicion:'no_residente' }))
    out.ajenoCambia = await intento(()=>repo.cambiarEstadia(bd, { residenciaId: arr402.id, personaId: jorge, condicion:'residente' }))
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b301, telefono:'3003', creadoPor: sandra, categoria:'visitante', condicion:'temporal', documento:'2005', vigenciaDesde: hoy, vigenciaHasta: en(3) }))
    reg = await autorizar(reg, sandra); const vis = bd.residencias.find(x=>x.id===reg.residenciaId)
    const c3 = await intento(()=>repo.cambiarEstadia(bd, { residenciaId: vis.id, personaId: sandra, condicion:'temporal', hasta: en(10) }))
    out.alargarPide = !!c3.cambioPendiente && c3.hasta === en(3)
    out.avisoDueno = bd.mensajes.filter(m=>m.motivo==='estadia_por_aprobar').length >= 1
    const c4 = await intento(()=>repo.decidirCambioComoPropietario(bd, { residenciaId: vis.id, personaId: gustavo, aprobar:true }))
    out.aprobado = c4.hasta === en(10) && c4.cambios?.at(-1)?.aprobadoPor === gustavo
    out.avisoSandra = bd.mensajes.some(m=>m.motivo==='estadia_decidida')
    await intento(()=>repo.cambiarEstadia(bd, { residenciaId: vis.id, personaId: sandra, condicion:'temporal', hasta: en(20) }))
    const c5 = await intento(()=>repo.decidirCambioComoPropietario(bd, { residenciaId: vis.id, personaId: gustavo, aprobar:false, motivo:'Ya es mucho tiempo' }))
    out.noAprobado = c5.hasta === en(10) && !!c5.cambioNoAprobado && !c5.cambioPendiente
    out.visitanteDeUnDia = await intento(()=>repo.cambiarEstadia(bd, { residenciaId: vis.id, personaId: sandra, condicion:'no_residente' }))
    // 2: la cadena para la visita de un día y para el temporal
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b301, telefono:'', creadoPor: sandra, categoria:'visitante', condicion:'no_residente', documento:'2006', vigenciaDesde: en(1), vigenciaHasta: en(1) }))
    const visita = bd.visitantes.find(v=>v.id===reg.visitanteId)
    out.jorgeRevoca = await intento(()=>repo.revocarVisitante(bd, { visitanteId: visita.id, personaId: jorge }))
    out.gustavoRevoca = (await intento(()=>repo.revocarVisitante(bd, { visitanteId: visita.id, personaId: gustavo }))).estado
    // 1: sale Sandra y salen sus visitantes
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b301, telefono:'', creadoPor: sandra, categoria:'visitante', condicion:'no_residente', documento:'2007', vigenciaDesde: en(2), vigenciaHasta: en(2) }))
    const visita2 = reg.visitanteId
    const resSandra = bd.residencias.find(x=>x.personaId===sandra && residenciaVigente(x))
    await intento(()=>repo.desvincularResidente(bd, { residenciaId: resSandra.id, personaId: admin }))
    out.temporalSale = !residenciaVigente(bd.residencias.find(x=>x.id===vis.id))
    out.visitaRevocada = bd.visitantes.find(v=>v.id===visita2).estado
    return out
  })
  const esp = { propietarioTemporal:/^ERR/, sinContacto:/^ERR/, visitaSinContacto:'autorizado', mariaNoResidente:true, mariaTemporal:/^ERR/, arrendatarioATemporal:true, arrendatarioNoResidente:/^ERR/, ajenoCambia:/^ERR/, alargarPide:true, avisoDueno:true, aprobado:true, avisoSandra:true, noAprobado:true, visitanteDeUnDia:/^ERR/, jorgeRevoca:/^ERR/, gustavoRevoca:'revocado', temporalSale:true, visitaRevocada:'revocado' }
  for (const [k,v] of Object.entries(esp)) { const ok = v instanceof RegExp ? v.test(String(r[k])) : r[k]===v; expect.soft(ok, k).toBeTruthy() }
})

test("«Cambiar» en pantalla y aprobación del propietario (RN-60, RN-68)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 420, height: 900 })
  const p = page
  const URL='/'
  const errores=[]; p.on('pageerror', e=>errores.push(e.message))
  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  async function entrar(nombre) { await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL); await p.reload(); await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(500) }
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(400)
  await entrar('Maria Camila Restrepo')
  await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(400)
  const tarjeta = p.locator('.tarjeta', { hasText: 'Maria Camila Restrepo' }).first()
  await tarjeta.getByRole('button', { name: 'Cambiar' }).click(); await p.waitForTimeout(200)
  check(JSON.stringify((await p.locator('.modal .segmento, [role=dialog] .segmento').allTextContents()).map(t=>t.trim()))===JSON.stringify(['Residente','No residente']), 'propietario: residente o no residente (sin temporal)')
  await p.locator('.segmento', { hasText: 'No residente' }).click()
  await p.getByRole('button', { name: 'Guardar el cambio' }).click(); await p.waitForTimeout(600)
  check((await tarjeta.textContent()).includes('No residente'), 'Maria queda como no residente')
  // formulario: arrendatario sin celular ni correo
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.waitForTimeout(200)
  await p.locator('.opcion-categoria', { has: p.locator('strong', { hasText: /^Arrendatario$/ }) }).click()
  await p.locator('#nombres').fill('Sin'); await p.locator('#apellidos').fill('Contacto'); await p.locator('#documento').fill('99112233')
  await p.getByRole('button', { name: 'Crear el registro' }).click(); await p.waitForTimeout(300)
  check(await p.getByText('Escribe el celular o el correo').count()===1, 'exige celular o correo')
  // cambio pendiente para Gustavo, preparado por el repositorio
  await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); let bd = await repo.cargar()
    const hoy = new Date().toISOString().slice(0,10); const en = (d) => new Date(Date.now()+d*864e5).toISOString().slice(0,10)
    let res = await repo.crearRegistroPersona(bd, { copropiedadId:'cop-1', unidadId:'uni-torre1-301', nombres:'Primo', apellidos:'Visita', email:'', telefono:'3009', creadoPor:'per-5', categoria:'visitante', condicion:'temporal', documento:'5566', vigenciaDesde: hoy, vigenciaHasta: en(3) }); bd = res.bd
    res = await repo.adjuntarSoportes(bd, { registroId: res.datos.id, fotoDocumento:'x', fotoPersona:'x', consentimiento:'v1' }); bd = res.bd
    res = await repo.autorizarRegistro(bd, { registroId: res.datos.id, personaId:'per-5' }); bd = res.bd
    res = await repo.cambiarEstadia(bd, { residenciaId: res.datos.residenciaId, personaId:'per-5', condicion:'temporal', hasta: en(12) })
  })
  await entrar('Gustavo Adolfo Mejia')
  await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(500)
  check(await p.getByText('espera al propietario').count()===1, 'Gustavo ve el cambio pendiente')
  await p.locator('.tarjeta', { hasText: 'Primo Visita' }).getByRole('button', { name: 'Aprobar', exact: true }).click(); await p.waitForTimeout(600)
  check(await p.getByText('espera al propietario').count()===0, 'al aprobar, deja de estar pendiente')
  // admin: botón Cambiar en Unidades
  await entrar('Olga Lucia Henao')
  await p.goto(URL+'#/admin/unidades'); await p.waitForTimeout(400); await p.getByText('301').first().click(); await p.waitForTimeout(300)
  check(await p.getByRole('button', { name: 'Cambiar' }).count()>=2, 'la administración tiene «Cambiar» en Unidades')
  check(errores.length===0, 'sin errores de página ' + errores.join(';'))
  
})

test("familiar, menores, visitante frecuente, fotos en cadena y aviso de fin de estadía (RN-60, RN-62, RN-67)", async ({ page }) => {
  test.setTimeout(180_000)
  const p = page
  await p.goto('/'); await p.evaluate(() => localStorage.clear()); await p.goto('/'); await p.waitForTimeout(400)
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); const { residenciaVigente, estadoRealVisitante, puedeRegistrar } = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar(); const out = {}
    const hoy = new Date().toISOString().slice(0,10); const en = (d) => new Date(Date.now()+d*864e5).toISOString().slice(0,10)
    const intento = async (f) => { try { const res = await f(); bd = res.bd; return res.datos } catch(e) { return 'ERR: '+e.message } }
    const autorizar = async (reg, quien) => { let res = await repo.adjuntarSoportes(bd, { registroId: reg.id, fotoDocumento:'x', fotoPersona:'x', consentimiento:'v1' }); bd=res.bd; return intento(()=>repo.autorizarRegistro(bd, { registroId: reg.id, personaId: quien })) }
    const maria='per-1', sandra='per-5', gustavo='per-13', admin='per-admin', jorge='per-4'
    const b402 = { copropiedadId:'cop-1', unidadId:'uni-torre1-402', nombres:'N', apellidos:'P', email:'' }
    const b301 = { ...b402, unidadId:'uni-torre1-301' }
    // 1
    let reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3001', creadoPor: maria, categoria:'familiar', condicion:'residente', documento:'3001' }))
    reg = await autorizar(reg, maria); const fam = bd.residencias.find(x=>x.id===reg.residenciaId)
    out.familiar = fam.rol + '/' + fam.reside
    out.familiarNoRegistra = puedeRegistrar('familiar', 'visitante', false, 'temporal')
    out.familiarNoResidente = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3002', creadoPor: maria, categoria:'familiar', condicion:'no_residente', documento:'3002' }))
    // 2
    out.adultoSinContacto = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: maria, categoria:'familiar', condicion:'residente', documento:'3003' }))
    out.menorSinContacto = (await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: maria, categoria:'familiar', condicion:'residente', menorDeEdad:true, tipoIdentificacion:'ti', documento:'3004' }))).estado
    out.tiAdulto = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3005', creadoPor: maria, categoria:'familiar', condicion:'residente', tipoIdentificacion:'rc', documento:'3005' }))
    out.propietarioMenor = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3006', creadoPor: maria, categoria:'propietario', condicion:'residente', menorDeEdad:true, documento:'3006' }))
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b301, telefono:'', creadoPor: sandra, categoria:'familiar', condicion:'residente', menorDeEdad:true, tipoIdentificacion:'rc', documento:'3007' }))
    reg = await autorizar(reg, sandra); const famSandra = bd.residencias.find(x=>x.id===reg.residenciaId)
    out.arrendatarioRegistraFamilia = famSandra?.rol
    // 3
    out.frecuenteSinDias = await intento(()=>repo.crearRegistroPersona(bd, { ...b301, telefono:'', creadoPor: sandra, categoria:'visitante', condicion:'frecuente', dias:[], documento:'3008', vigenciaDesde: hoy, vigenciaHasta: en(60) }))
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b301, telefono:'', creadoPor: sandra, categoria:'visitante', condicion:'frecuente', dias:[1,2,3,4,5], documento:'3009', vigenciaDesde: hoy, vigenciaHasta: en(60) }))
    out.frecuentePideFotos = reg.estado; const regFrec = reg
    reg = await autorizar(reg, sandra); const vf = bd.visitantes.find(v=>v.id===reg.visitanteId)
    out.frecuente = vf && vf.recurrente && JSON.stringify(vf.dias)
    const domingo = (()=>{ const d=new Date(); d.setDate(d.getDate()+((7-d.getDay())%7||7)); return d.toISOString().slice(0,10) })()
    const lunes = en(0) && (()=>{ const d=new Date(`${domingo}T12:00:00`); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10) })()
    out.domingo = estadoRealVisitante(vf, domingo); out.lunes = estadoRealVisitante(vf, lunes)
    // 4
    out.gustavoVeFotos = (await intento(()=>repo.registrarAccesoSoportes(bd, { registroId: regFrec.id, personaId: gustavo }))).registroId ? 'ok' : 'no'
    out.jorgeVeFotos = await intento(()=>repo.registrarAccesoSoportes(bd, { registroId: regFrec.id, personaId: jorge }))
    // 5
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3010', creadoPor: maria, categoria:'visitante', condicion:'temporal', documento:'3010', vigenciaDesde: hoy, vigenciaHasta: en(1) }))
    reg = await autorizar(reg, maria)
    bd = await repo.cargar()
    out.avisoFin = bd.mensajes.filter(m=>m.motivo==='fin_de_estadia').length
    bd = await repo.cargar()
    out.avisoFinNoRepite = bd.mensajes.filter(m=>m.motivo==='fin_de_estadia').length
    // sale Sandra: su familia y su frecuente
    const resSandra = bd.residencias.find(x=>x.personaId===sandra && residenciaVigente(x))
    await intento(()=>repo.desvincularResidente(bd, { residenciaId: resSandra.id, personaId: admin }))
    out.familiaSale = !residenciaVigente(bd.residencias.find(x=>x.id===famSandra.id))
    out.frecuenteSale = bd.visitantes.find(v=>v.id===vf.id).estado
    return out
  })
  const esp = { familiar:'familiar/true', familiarNoRegistra:false, familiarNoResidente:/^ERR/, adultoSinContacto:/^ERR/, menorSinContacto:'esperando_soportes', tiAdulto:/^ERR/, propietarioMenor:/^ERR/, arrendatarioRegistraFamilia:'familiar', frecuenteSinDias:/^ERR/, frecuentePideFotos:'esperando_soportes', frecuente:'[1,2,3,4,5]', domingo:'programado', lunes:'activo', gustavoVeFotos:'ok', jorgeVeFotos:/^ERR/, avisoFin:1, avisoFinNoRepite:1, familiaSale:true, frecuenteSale:'revocado' }
  for (const [k,v] of Object.entries(esp)) { const ok = v instanceof RegExp ? v.test(String(r[k])) : r[k]===v; expect.soft(ok, k).toBeTruthy() }
})

test("el formulario con familiar, menores y visitante frecuente (RN-60, RN-62)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 420, height: 900 })
  const p = page
  const URL='/'
  const errores=[]; p.on('pageerror', e=>errores.push(e.message))
  const check = (c, m) => expect.soft(c, m).toBeTruthy()
  async function entrar(nombre) { await p.goto(URL); await p.evaluate(() => localStorage.removeItem('idiky.demo.sesion')); await p.goto(URL); await p.reload(); await p.getByText('¿Estás viendo el demo?').click(); await p.getByText(nombre, { exact: true }).click(); await p.waitForTimeout(500) }
  const segs = async () => (await p.locator('.segmentos').first().locator('.segmento').allTextContents()).map(t=>t.trim()).join('|')
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(400)
  await entrar('Maria Camila Restrepo')
  await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.waitForTimeout(200)
  const opciones = (await p.locator('.opcion-categoria strong').allTextContents()).join('|')
  check(opciones==='Propietario|Arrendatario|Familiar o acompañante|Visitante', 'propietario ve cuatro tipos: '+opciones)
  check(await p.getByText('Es menor de edad').count()===0, 'al propietario no se le ofrece «menor de edad»')
  await p.locator('.opcion-categoria', { hasText: 'Familiar' }).click(); await p.waitForTimeout(100)
  check(await segs()==='Residente|Residente temporal', 'familiar: residente o temporal '+await segs())
  const tiposAntes = await p.locator('select[aria-label="Tipo de documento"] option').allTextContents()
  await p.getByText('Es menor de edad').click()
  const tiposDespues = await p.locator('select[aria-label="Tipo de documento"] option').allTextContents()
  check(!tiposAntes.includes('Tarjeta de identidad') && tiposDespues.includes('Tarjeta de identidad') && tiposDespues.includes('Registro civil'), 'menor: aparecen tarjeta de identidad y registro civil')
  await p.locator('select[aria-label="Tipo de documento"]').selectOption('ti')
  await p.locator('#nombres').fill('Sofia'); await p.locator('#apellidos').fill('Restrepo Hija'); await p.locator('#documento').fill('1122334455')
  await p.getByRole('button', { name: 'Crear el registro' }).click(); await p.waitForTimeout(700)
  check(await p.getByText('Familiar o acompañante · Residente').count()>=1, 'menor sin celular queda registrado')
  await p.goto(URL); await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(400)
  await p.keyboard.press('Escape').catch(()=>{})
  await p.goto(URL+'#/app/visitantes'); await p.waitForTimeout(300); await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.waitForTimeout(200)
  await p.locator('.opcion-categoria', { hasText: 'Visitante' }).click(); await p.waitForTimeout(100)
  check(await segs()==='De un día|Frecuente|Residente temporal', 'visitante: de un día, frecuente o temporal '+await segs())
  await p.locator('.segmento', { hasText: 'Frecuente' }).click(); await p.waitForTimeout(100)
  check(await p.getByText('¿Qué días viene?').count()===1, 'el frecuente escoge los días')
  await entrar('Sandra Milena Ortiz')
  await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.waitForTimeout(200)
  const opcS = (await p.locator('.opcion-categoria strong').allTextContents()).join('|')
  check(opcS==='Familiar o acompañante|Visitante', 'la arrendataria registra familia y visitas: '+opcS)
  check(errores.length===0, 'sin errores de página ' + errores.join(';'))
  
})

test("la familia sale con el propietario y el familiar adulto registra visitas (RN-60, RN-65)", async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 420, height: 900 })
  const p = page
  const URL='/'
  const errores=[]; p.on('pageerror', e=>errores.push(e.message))
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(400)
  const r = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); const { residenciaVigente } = await import('/src/dominio/reglas.ts')
    let bd = await repo.cargar(); const out = {}
    const hoy = new Date().toISOString().slice(0,10); const en = (d) => new Date(Date.now()+d*864e5).toISOString().slice(0,10)
    const intento = async (f) => { try { const res = await f(); bd = res.bd; return res.datos } catch(e) { return 'ERR: '+e.message } }
    const autorizar = async (reg, quien) => { let res = await repo.adjuntarSoportes(bd, { registroId: reg.id, fotoDocumento:'x', fotoPersona:'x', consentimiento:'v1' }); bd=res.bd; return intento(()=>repo.autorizarRegistro(bd, { registroId: reg.id, personaId: quien })) }
    const maria='per-1', admin='per-admin'
    const b402 = { copropiedadId:'cop-1', unidadId:'uni-torre1-402', nombres:'N', apellidos:'P', email:'' }
    let reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, nombres:'Hija', apellidos:'Mayor', telefono:'3101', creadoPor: maria, categoria:'familiar', condicion:'residente', documento:'4001' }))
    reg = await autorizar(reg, maria); const famAdulta = bd.residencias.find(x=>x.id===reg.residenciaId)
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: maria, categoria:'familiar', condicion:'residente', menorDeEdad:true, tipoIdentificacion:'ti', documento:'4002' }))
    reg = await autorizar(reg, maria); const famMenor = bd.residencias.find(x=>x.id===reg.residenciaId)
    // 4
    const v = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: famAdulta.personaId, categoria:'visitante', condicion:'no_residente', documento:'4003', vigenciaDesde: hoy, vigenciaHasta: hoy }))
    out.adultaRegistraVisita = v.estado
    out.adultaVisitaTemporal = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: famAdulta.personaId, categoria:'visitante', condicion:'temporal', documento:'4004', vigenciaDesde: hoy, vigenciaHasta: en(3) }))
    out.adultaFrecuente = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: famAdulta.personaId, categoria:'visitante', condicion:'frecuente', dias:[1], documento:'4005', vigenciaDesde: hoy, vigenciaHasta: en(30) }))
    out.adultaArrendatario = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3102', creadoPor: famAdulta.personaId, categoria:'arrendatario', condicion:'residente', documento:'4006' }))
    out.menorRegistra = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'', creadoPor: famMenor.personaId, categoria:'visitante', condicion:'no_residente', documento:'4007', vigenciaDesde: hoy, vigenciaHasta: hoy }))
    // 1
    reg = await intento(()=>repo.crearRegistroPersona(bd, { ...b402, telefono:'3103', creadoPor: maria, categoria:'arrendatario', condicion:'residente', documento:'4008' }))
    reg = await autorizar(reg, maria); const arr = bd.residencias.find(x=>x.id===reg.residenciaId)
    const resMaria = bd.residencias.find(x=>x.personaId===maria && residenciaVigente(x))
    await intento(()=>repo.desvincularResidente(bd, { residenciaId: resMaria.id, personaId: admin, motivo:'cambio_propietario' }))
    out.familiaSale = !residenciaVigente(bd.residencias.find(x=>x.id===famAdulta.id)) && !residenciaVigente(bd.residencias.find(x=>x.id===famMenor.id))
    out.arrendatarioSigue = residenciaVigente(bd.residencias.find(x=>x.id===arr.id))
    out.visitaDeLaHijaSigue = bd.visitantes.find(x=>x.id===v.visitanteId).estado
    return { out, famAdulta: famAdulta.personaId }
  })
  const esp = { adultaRegistraVisita:'autorizado', adultaVisitaTemporal:/^ERR/, adultaFrecuente:/^ERR/, adultaArrendatario:/^ERR/, menorRegistra:/^ERR/, familiaSale:true, arrendatarioSigue:true, visitaDeLaHijaSigue:'revocado' }
  for (const [k,v] of Object.entries(esp)) { const ok = v instanceof RegExp ? v.test(String(r.out[k])) : r.out[k]===v; expect.soft(ok, k).toBeTruthy() }
  // UI: la hija mayor entra y registra
  await p.goto(URL); await p.evaluate(async () => { localStorage.clear() }); await p.goto(URL); await p.waitForTimeout(400)
  const hija = await p.evaluate(async () => {
    const repo = await import('/src/datos/repositorio.ts'); let bd = await repo.cargar()
    let res = await repo.crearRegistroPersona(bd, { copropiedadId:'cop-1', unidadId:'uni-torre1-402', nombres:'Hija', apellidos:'Mayor', email:'', telefono:'3101', creadoPor:'per-1', categoria:'familiar', condicion:'residente', documento:'4001' }); bd = res.bd
    res = await repo.adjuntarSoportes(bd, { registroId: res.datos.id, fotoDocumento:'x', fotoPersona:'x', consentimiento:'v1' }); bd = res.bd
    res = await repo.autorizarRegistro(bd, { registroId: res.datos.id, personaId:'per-1' })
    return res.bd.residencias.find(x=>x.id===res.datos.residenciaId).personaId
  })
  await p.evaluate((id) => localStorage.setItem('idiky.demo.sesion', JSON.stringify({ perfilId:'perfil-'+id, personaId:id, rol:'residente', copropiedadId:'cop-1', unidadActivaId:'uni-torre1-402' })), hija)
  await p.goto(URL); await p.reload(); await p.goto(URL+'#/app/unidad/personas'); await p.waitForTimeout(600)
  const texto = await p.locator('body').textContent()
  expect.soft(texto.includes('Tú puedes registrar visitas de un día'), 'aviso para el familiar').toBeTruthy()
  await p.getByRole('button', { name: 'Registrar' }).first().click(); await p.waitForTimeout(200)
  const tipos = (await p.locator('.opcion-categoria strong').allTextContents()).join('|')
  const conds = (await p.locator('.segmentos').first().locator('.segmento').allTextContents()).map(t=>t.trim()).join('|')
  expect.soft(tipos==='Visitante' && conds==='De un día', 'la hija solo registra visitas de un día: ' + tipos + ' ' + conds).toBeTruthy()
  expect.soft(errores, 'sin errores de página').toEqual([])
})
