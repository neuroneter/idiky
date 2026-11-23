# 22 — Entrega de Mary: lo construido en noviembre y qué falta para salir

**Corte:** 2026-11-20, actualizado el 2026-11-23 (decisiones de negocio y mapa para el desarrollador). **Para:** Daniel (BLOKY, integración), Jeimy
(contable) y Justo (ALICE).

> **Qué es este documento.** El **corte transversal** de lo que Mary definió y dejó en la maqueta
> (`apps/pwa`) entre el 2026-11-10 y el 2026-11-20, **qué le toca a cada uno** y la **lista de lo
> que falta para que la app salga a un edificio real**. Reemplaza como corte al
> [`15`](./15-resumen-de-la-rama-de-mary.md) (septiembre).
>
> Es un snapshot fechado: no se mantiene. El orden día a día está en la
> [bitácora](./09-estado-del-proyecto.md); las tareas, en el [tablero](./11-tablero-de-trabajo.md).

---

## 1. En una frase

La maqueta ya tiene **lo que traen las apps de propiedad horizontal del mercado** y algunas
cosas que no traen —asambleas fieles a la Ley 675, trato amable con el propietario, transparencia de
las obras—, y **cada perfil ve solo lo suyo**. **No está lista para un edificio real**: es una
maqueta, sin servidor (ver §5).

## 2. Lo construido (en la maqueta `apps/pwa`)

| Área | Qué hay | Casos de uso · reglas |
|---|---|---|
| **Pagos** | Descuento por **pronto pago** (Sí/No en la parametrización, % y día límite; el recibo lo muestra aparte). **Pago programado** de la cuota mensual (simulado). **Acuerdos de pago** (Sí/No y máximo de cuotas en la parametrización; el propietario propone, la administración aprueba; se mide contra el calendario). **Certificado de pagos del año** (numerado y verificable; también lo genera la administración). | CU-R-35, CU-R-36, CU-R-46, CU-A-31, CU-A-39 · PN-01, PN-02, PN-14, PN-19 |
| **Transparencia** | **Cuentas claras** del mes. **Obras:** lo pagado frente al presupuesto, con qué se paga y preguntas de los propietarios (respondidas sin el nombre de quien preguntó). **Calificación de la atención** de las PQRS, con el resumen para el consejo. | CU-R-32, CU-R-37, CU-R-47, CU-A-28, CU-A-32, CU-A-38 · RN-238, RN-239, PN-03, PN-15 |
| **Tu edificio** | **Documentos** (reglamento, manual, actas, pólizas). **Encuestas** rápidas (una respuesta por unidad). **Calendario** del edificio. **Clasificados** entre vecinos. **Objetos perdidos**. | CU-R-38 … CU-R-42, CU-R-49, CU-A-33 … CU-A-36 · PN-04, PN-05, PN-07, PN-08, PN-17 |
| **Trámites** | **Trasteos** (horario, anticipación, depósito y ascensores los parametriza el administrador; sin ascensores no se preguntan). **Obras en el apartamento** con los trabajadores autorizados. **Depósito** recibido, devuelto o retenido con motivo. **Reportar un daño con foto**. | CU-R-40, CU-R-44, CU-R-45, CU-A-37 · PN-06, PN-10, PN-11, PN-13 |
| **Seguridad y portería** | **Pedir ayuda a portería** desde el inicio. **QR real y escaneable** para visitantes, sin librerías (ADR-0005 actualizado), compartible por WhatsApp; portería lo escanea con la cámara. **Hoy en el edificio** (trasteos, obras, calendario). **Minuta** completa del turno. | CU-R-10, CU-R-43, CU-P-02 · PN-09, PN-12 |
| **La persona** | **Mis avisos:** por dónde (WhatsApp, SMS, correo o solo la app) y de qué temas. **Mis propiedades:** todas las unidades con lo que se debe en cada una. | CU-R-48, CU-R-01 (A6) · PN-16, PN-18 |
| **Entre perfiles** | **«Te esperan»** en el tablero de la administración. Al **familiar y al autorizado no se les muestra** lo que decide el propietario o el arrendatario. | PN-20 |

Para probarlo: el demo trae a **María Camila** (propietaria al día), **Andrés** (con cuotas
vencidas: acuerdos), **Gustavo** (dos propiedades), **Tomás** (familiar), **Jairo** (portería) y
**Olga** (administración).

**Calidad:** compila, ortografía sin hallazgos, **111 pruebas de navegador pasan**. Ninguna
dependencia nueva.

## 3. Lo que le toca a cada uno

### Daniel (BLOKY e integración)
| Tarea | Qué |
|---|---|
| **T-55** | **Primero:** asignarle a Mary rangos nuevos de **RN, CU-R y CU-A**. Se agotaron y hay **20 reglas con número provisional** (PN-01 … PN-20, en [`05`](./05-modelo-de-datos.md)). Con el rango, se renumeran de una vez. |
| **T-54** | Llevar a BLOKY y a ALICE (con Justo) todo lo de §2. En la **parametrización del edificio**: pronto pago Sí/No, acuerdos de pago Sí/No, trasteos (horario, anticipación, depósito, ascensores) y «¿tiene ascensores?» al crear el edificio. |
| T-48 · T-49 | Interés de mora Sí/No y cuota ordinaria automática. |
| T-53 | Pago programado real (pasarela de pagos, fase 4). |
| T-18 · T-109 | Envío real de mensajes (WhatsApp, SMS, correo), respetando las preferencias de cada persona (PN-16). |

### Jeimy (contable)
| Tarea | Qué |
|---|---|
| **T-51** | El **descuento por pronto pago** viene en cada recibo: registrarlo como descuento, no como ingreso. |
| **T-52** | Que las **cuentas claras** del mes salgan de la contable (hoy se escriben a mano). |
| **T-50** | Lo **pagado de cada obra**, desde los comprobantes de egreso. |
| **T-56** | El **depósito de trasteo** es plata del residente: llevarlo aparte; solo lo retenido por daños es ingreso. |
| **T-57** | **Acuerdos de pago:** con el edificio y el abogado, si se suspenden los intereses de mora mientras se cumplen. |

### Justo (ALICE)
Lo de §2 del lado del propietario, junto con Daniel (T-54). El **QR** se genera en la app con el
equivalente nativo; el contrato de la API del middleware está en [`20`](./20-alta-e-ingreso-desde-alice.md).

### El abogado (lo pide Daniel)
1. Cómo vota un edificio **mixto**.
2. Si la **tasa de mora puede ser cero** y si eso necesita acta.
3. Si un **poder general** es válido.
4. Qué **soporte** vale para registrar una **inmobiliaria**.
5. Si se **suspenden los intereses** durante un acuerdo de pago.
6. La parte legal de §5: datos personales, contrato y términos de uso.

## 3 bis. Decisiones de negocio (**Mary, 2026-11-23**)

- **Se le vende a la copropiedad**; los administradores son usuarios (ADR-0031).
- **Un administrador maneja varios edificios** desde la misma cuenta: CU-A-15 entra en la primera versión.
- **El vencimiento de la cuota lo fija cada edificio** (el 10, el 15…): T-59.
- **Entran también en la primera versión:** reserva de **parqueaderos de visitantes**, **chat entre
  residentes** (espera rango de casos de uso, T-55) y **facturación electrónica** (T-58).

## 4. Lo que es solo de la maqueta (y lo dice)

Datos en el navegador · el código de ingreso se ve en pantalla · los mensajes se escriben pero no
se envían · los pagos son simulados · el PDF sale con «Guardar como PDF» del teléfono · las fotos
y los documentos se guardan reducidos en el navegador.

## 5. ¿Qué falta para sacar la app hoy a un edificio real?

**Hoy no se puede**: lo construido es la maqueta. El producto real es **BLOKY + ALICE + el
middleware**, en construcción en sus repositorios.

| # | Qué falta | Quién | Bloquea |
|---|---|---|---|
| 1 | **Los datos en el servidor** (middleware): hoy cada teléfono tiene su copia | Daniel | 🔴 Sí |
| 2 | **Ingreso real** con código por SMS o correo en ALICE (BLOKY ya lo probó en Dev) | Daniel · Justo | 🔴 Sí |
| 3 | **Envío real de los mensajes** | Daniel (T-18, T-109) | 🔴 Sí |
| 4 | **Entorno de producción:** dominio, HTTPS, copias de seguridad y monitoreo | Daniel (T-35) | 🔴 Sí |
| 5 | **Fotos y documentos** a un almacenamiento real | Daniel (ADR-0019) | 🔴 Sí |
| 6 | **Datos personales (Ley 1581 de 2012):** política de tratamiento, autorización y aviso de privacidad; los siete puntos de [`12`](./12-levantamiento-pendiente.md) | Abogado · Daniel | 🔴 Sí |
| 7 | **Contrato con el edificio y términos de uso** ([ADR-0031](./adr/0031-un-contrato-por-copropiedad.md)) | Abogado · Daniel | 🔴 Sí |
| 8 | **Pagos reales** (pasarela y conciliación) | Daniel (fase 4) | 🟡 No, si se arranca con pagos **informados** |
| 9 | **Cargar el edificio:** unidades y coeficientes (100 %), propietarios con celular y correo, saldos iniciales y la parametrización | La administración, con el equipo | 🔴 Sí |
| 10 | **Capacitar** a la administración y a portería; **quién da soporte** | Mary · Daniel | 🟡 Antes de salir |
| 11 | **La contabilidad real** (T-50 … T-57) | Jeimy | 🟡 No para el primer lanzamiento |
| 12 | **Numerar las reglas** (T-55) | Daniel | ⚪ Interno |

### La propuesta de Mary para no esperar a tenerlo todo
1. **Hoy:** un **piloto de demostración** con un administrador real, recorriendo la maqueta con
   datos inventados, para validar el producto antes de construirlo de verdad.
2. **Primer lanzamiento pequeño**, cuando estén los puntos 1 a 7 y 9:
   - ingreso real y datos en el servidor;
   - estado de cuenta, con pagos **informados** por el propietario y registrados por la
     administración (sin pasarela);
   - cartelera, PQRS, visitantes con QR, reservas y correspondencia.
3. **Después, por etapas:** lo demás de §2, la pasarela de pagos y la contable.

Las fechas las ponen Daniel y Justo según su avance.

## 6. Mapa para el desarrollador: caso de uso → pantalla de la maqueta → prueba

> Cada caso de uso tiene **una pantalla que lo muestra** (el ejemplo) y **una prueba que lo
> comprueba** (el criterio de terminado). Las pruebas están en `apps/pwa/pruebas/navegador/` y se
> corren con `npm run probar:navegador`. La maqueta se abre con `npm run dev`.

| Caso de uso | Ruta en la maqueta | Pantalla (`apps/pwa/src/`) | Prueba |
|---|---|---|---|
| CU-R-35, CU-A-31 Pronto pago | `/app/cuenta`, `/admin/cartera` | `componentes/AvisoProntoPago.tsx`, `features/admin/ProntoPagoTarjeta.tsx` | `competir.spec.ts` |
| CU-R-36 Pago programado | `/app/cuenta` | `features/residente/PagoProgramado.tsx`, `features/admin/PagosProgramadosAdmin.tsx` | `competir.spec.ts`, `entre-perfiles.spec.ts` |
| CU-R-37, CU-A-32 Cuentas claras | `/app/edificio/cuentas`, `/admin/edificio` | `features/residente/edificio/CuentasClarasPage.tsx`, `features/admin/edificio/CuentasClarasAdmin.tsx` | `competir.spec.ts` |
| CU-R-38, CU-A-33 Documentos | `/app/edificio/documentos`, `/admin/edificio` | `features/residente/edificio/DocumentosPage.tsx`, `features/admin/edificio/DocumentosAdmin.tsx` | `competir.spec.ts` |
| CU-R-39, CU-A-34 Encuestas | `/app/edificio/encuestas`, `/admin/edificio` | `features/residente/edificio/EncuestasPage.tsx`, `features/admin/edificio/EncuestasAdmin.tsx` | `competir.spec.ts` |
| CU-R-40 Daño con foto | `/app/solicitudes/pqrs` | `features/residente/ReportarDano.tsx` | `competir.spec.ts` |
| CU-R-41, CU-A-35 Calendario | `/app/edificio/calendario`, `/admin/edificio` | `features/residente/edificio/CalendarioPage.tsx`, `features/admin/edificio/CalendarioAdmin.tsx` | `competir.spec.ts` |
| CU-R-42, CU-A-36 Clasificados | `/app/edificio/clasificados`, `/admin/edificio` | `features/residente/edificio/ClasificadosPage.tsx`, `features/admin/edificio/ClasificadosAdmin.tsx` | `competir.spec.ts` |
| CU-R-43 Pedir ayuda | `/app`, `/porteria` | `features/residente/PedirAyuda.tsx`, `componentes/AlertasAyuda.tsx` | `competir.spec.ts` |
| CU-R-44, CU-R-45, CU-A-37 Trasteos, obras y depósito | `/app/unidad/permisos`, `/admin/edificio`, `/porteria` | `features/residente/PermisosPage.tsx`, `features/admin/edificio/{PermisosAdmin,ReglasTrasteoAdmin}.tsx`, `componentes/DepositoTrasteo.tsx`, `features/porteria/HoyEnElEdificio.tsx` | `permisos-qr.spec.ts` |
| CU-R-10, CU-P-02 QR de visitantes | `/app/visitantes`, `/porteria/visitantes` | `utilidades/qr.ts`, `componentes/CodigoVisual.tsx`, `features/porteria/EscanearQr.tsx` | `permisos-qr.spec.ts` |
| CU-R-46 Certificado de pagos | `/app/cuenta/pagos`, `/admin/cartera/certificados` | `features/residente/CertificadoPagos.tsx`, `features/admin/CertificadosAdminPage.tsx`, `componentes/HojaCertificadoPagos.tsx` | `certificado-calificacion.spec.ts` |
| CU-R-47, CU-A-38 Calificar la atención | `/app/solicitudes/pqrs`, `/admin/pqrs` | `features/residente/CalificarAtencion.tsx` | `certificado-calificacion.spec.ts` |
| CU-R-48 Mis avisos | `/app/avisos` | `features/residente/AvisosPage.tsx` | `avisos.spec.ts` |
| CU-R-49 Objetos perdidos | `/app/edificio/objetos`, `/porteria/objetos` | `features/residente/edificio/ObjetosPage.tsx`, `componentes/GestionObjetos.tsx` | `objetos.spec.ts` |
| CU-R-01 (A6) Mis propiedades | `/app/propiedades` | `features/residente/PropiedadesPage.tsx` | `propiedades.spec.ts` |
| CU-A-39 Acuerdos de pago | `/app/cuenta`, `/admin/cartera` | `features/residente/AcuerdoPago.tsx`, `features/admin/AcuerdosPagoAdmin.tsx` | `acuerdos.spec.ts` |
| CU-R-32, CU-A-28 Obras: pagado y preguntas | `/app/proyectos`, `/admin/proyectos` | `componentes/TableroProyecto.tsx`, `features/residente/PreguntasProyecto.tsx`, `features/admin/PreguntasPorResponder.tsx` | `proyectos.spec.ts` |
| CU-R-05 Parqueadero de visitantes | `/app/solicitudes/reservas` | `features/residente/ReservasPage.tsx` | `listo-desarrollo.spec.ts` |
| CU-A-15 Varios edificios | `/admin` (selector «Edificio») | `componentes/LayoutAdmin.tsx` | `listo-desarrollo.spec.ts` |
| CU-A-16 Exportar a Excel | `/admin/cartera`, `/admin/pqrs` | `features/admin/{CarteraPage,PqrsAdminPage}.tsx` | `listo-desarrollo.spec.ts` |
| CU-S-05 PQRS por vencer · «Te esperan» | `/admin`, `/admin/pqrs` | `features/admin/TeEsperan.tsx` | `entre-perfiles.spec.ts`, `listo-desarrollo.spec.ts` |
| RN-23 Día de vencimiento | `/admin/cartera` | `features/admin/DiaVencimientoTarjeta.tsx` | `listo-desarrollo.spec.ts` |
| PN-20 Lo que no aplica al perfil | entrar como **Tomás** | `dominio/reglas.ts` (`decideEnLaUnidad`) | `entre-perfiles.spec.ts` |

**Las reglas** (RN y PN) viven en `apps/pwa/src/dominio/reglas.ts` como funciones puras: son la
especificación ejecutable que hay que llevar al middleware. **Los datos** pasan siempre por
`apps/pwa/src/datos/repositorio.ts`: cada función exportada es, en la práctica, un servicio del
middleware por construir (quién puede, qué valida, qué guarda y a quién avisa).

**Lo que todavía no está en la maqueta y entra en la primera versión:** el **chat entre residentes**
(espera rango de casos de uso, T-55) y la **facturación electrónica** (T-58). Quedan en la
contable: el **cálculo del interés de mora** (CU-S-02, CU-A-25) y el **presupuesto** (CU-A-11).
