# 02 — Glosario del dominio

Vocabulario común para código, documentación e interfaz. **Los nombres de las entidades en
el código usan estos términos en español** (ver [convenciones](./08-convenciones.md)).

## Las aplicaciones de IDIKY

Nombradas el 2026-09-10 para no confundir sistemas que se parecen. **La página web pública es
IDIKY**, y todo se presenta como aplicaciones de IDIKY.

| Nombre | Qué es | Quién entra | Cómo entra | Dónde está |
|---|---|---|---|---|
| **BOB** | El *back office* de la empresa IDIKY: clientes, planes, servicios adicionales, contratos, y el alta del Administrador y el Delegado de cada copropiedad | El equipo de IDIKY (el *operador*) | El login de Strapi. **No usa Twilio** | `apps/gestion/` (ADR-0012) |
| **BLOKY** | El sistema de las copropiedades: estructura y unidades, propietarios, cartera, asambleas. Su nombre sale de «bloque» y de la terminación de IDIKY | El Administrador, el Delegado y los perfiles que ellos creen | Un código por SMS o por correo (Twilio Verify), o Google o Microsoft con el correo registrado | Por construir (backend: ADR-0008). Su precursor es la consola del administrador del demo, en `apps/pwa/` |
| **ALICE** | La app del propietario y residente | Propietarios y residentes | La que defina el equipo; hoy, el demo con documento y clave | Hoy, el demo de `apps/pwa/` |

La aplicación contable de Jeimy (`apps/contable/`) conserva su nombre.

## Términos

| Término | Definición | Nombre en código |
|---|---|---|
| **Propiedad Horizontal (PH)** | Régimen jurídico donde coexisten bienes privados y bienes comunes bajo un reglamento. | — |
| **Reglamento de propiedad horizontal** | El documento **constitutivo** de la copropiedad: se eleva a escritura pública y se registra. Define coeficientes, bienes comunes y órganos. | — |
| **Manual de convivencia** | Documento **distinto del reglamento**, adoptado por la asamblea, que regula el día a día: horarios, mascotas, ruido, uso de zonas comunes. **En la práctica el catálogo de sanciones suele vivir aquí** (Mary, 2026-09-08), así que es un respaldo válido para una multa por derecho propio (RN-38). | `ConceptoSancion.origen = 'manual'` |
| **Respaldo** | El documento que autoriza un cobro que no es la cuota ordinaria: reglamento, manual de convivencia, acta de asamblea u **otro documento nombrado**. Sin respaldo el cobro no se crea; y «otro» sin decir cuál **no es un respaldo** (RN-38). | `origen` + `referencia` |
| **Parametrizar** | Trasladar al sistema **lo que el reglamento, el manual o la asamblea ya decidieron**: qué cuotas, multas e intereses existen y cuánto valen. Es facultad exclusiva del administrador (RN-49), y **no es lo mismo que decidir**: el administrador no define las multas. | — |
| **Copropiedad** | El conjunto residencial/edificio administrado. Es el tenant del sistema. | `Copropiedad` |
| **Unidad privada** | Apartamento, casa o local de propiedad individual. | `Unidad` |
| **Torre / Bloque / Etapa** | Agrupación física de unidades dentro de la copropiedad. | `Unidad.torre` |
| **Coeficiente de copropiedad** | Porcentaje de participación de una unidad sobre el total. Define cuánto paga y cuánto pesa su voto. | `Unidad.coeficiente` |
| **Propietario** | Titular del derecho de dominio sobre la unidad. | `Persona` + `Residencia.rol = 'propietario'` |
| **Arrendatario / Tenedor** | Quien habita la unidad sin ser su dueño. | `Persona` + `Residencia.rol = 'arrendatario'` |
| **Residente** | **Una marca, no un título** (Mary, 2026-09-07): dice que esta persona **vive aquí**. La llevan el arrendatario y el residente temporal por defecto; **al propietario se le pregunta**, porque puede tener la unidad arrendada o vacía; el visitante nace sin ella (RN-68). **No es un usuario distinto de propietario o arrendatario.** El título —quién es dueño y quién arrienda— está en `Residencia.rol` y es el que decide qué puede hacer (RN-02, RN-60). Confundirlos lleva a errores concretos: creer que «residente» es lo contrario de «propietario» y escribir un permiso al revés. | `RolUsuario = 'residente'` (marca) ≠ `Residencia.rol` (título) |
| **Cuota de administración** | Aporte periódico (normalmente mensual) para gastos comunes. | `Cuota.tipo = 'ordinaria'` |
| **Poder** | Documento con el que un propietario autoriza a otra persona a representar su unidad en una asamblea. **Se otorga fuera de la app** —ante notario o de puño y letra— y el administrador lo registra con el papel adjunto. | `Poder` |
| **Apoderado** | Quien ejerce el poder. **No tiene que ser copropietario** (Mary, 2026-09-10): puede ser un externo. Representa el coeficiente de la unidad, no el suyo. | `Poder.apoderadoId` |
| **Usuario temporal de asamblea** | La cuenta que se le crea a un apoderado que no existía en Idiky. **«Temporal» no es un estado**: es que su única vinculación con la copropiedad es un poder, y el poder muere con la asamblea. No tiene unidad, no paga cuota, no sale en portería. | `Persona` sin `Residencia` |
| **Cuota extraordinaria** | Aporte aprobado en asamblea para un gasto puntual. | `Cuota.tipo = 'extraordinaria'` |
| **Cartera** | Conjunto de obligaciones pendientes de las unidades. | `Cartera` (vista) |
| **Estado de cuenta** | Detalle de cargos, pagos y saldo de una unidad. | `EstadoCuenta` |
| **Mora** | Retraso en el pago; genera intereses según reglamento. | `Cuota.estado = 'vencida'` |
| **Paz y salvo** | Certificado de que una unidad no tiene deudas. | `PazYSalvo` |
| **Zona común / Amenidad** | Espacio de uso compartido reservable (salón social, BBQ, gimnasio). | `ZonaComun` |
| **Reserva** | Solicitud de uso exclusivo de una zona común en una franja horaria. | `Reserva` |
| **PQRS** | Petición, Queja, Reclamo o Sugerencia radicada por un residente. | `Pqrs` |
| **Radicado** | Número consecutivo que identifica una PQRS o correspondencia. | `Pqrs.radicado` |
| **SLA** | Tiempo máximo comprometido de respuesta a una PQRS. | `Pqrs.fechaLimite` |
| **Comunicado** | Publicación oficial de la administración a la comunidad. | `Comunicado` |
| **Cartelera** | Listado de comunicados vigentes. | vista de `Comunicado[]` |
| **Correspondencia** | Paquete, carta o domicilio recibido en portería a nombre de una unidad. | `Correspondencia` |
| **Minuta de portería** | Bitácora de novedades del turno de vigilancia. | `Minuta` (fase 2) |
| **Visitante autorizado** | Persona a la que un residente permite el ingreso, con vigencia y código. | `Visitante` |
| **Asamblea** | Reunión de copropietarios donde se toman decisiones vinculantes. | `Asamblea` |
| **Quórum** | Porcentaje de coeficientes presentes o representados requerido para decidir. | `Asamblea.quorum` |
| **Poder** | Delegación del voto de un copropietario en otra persona, para **una** asamblea. | `Poder` |
| **Otorgante / Apoderado** | Quien delega su voto / quien lo recibe y lo ejerce. | `Poder.otorganteId` / `Poder.apoderadoId` |
| **Convocatoria / Citación** | Aviso formal de la asamblea con fecha, modalidad y orden del día. Debe emitirse con antelación mínima. | `Asamblea` · `Documento` tipo `convocatoria` |
| **Orden del día** | Lista de puntos a tratar. Solo se vota lo que está en él. | `PuntoOrdenDelDia` |
| **Votación** | Pregunta sometida a decisión durante la asamblea. | `Votacion` |
| **Mayoría simple / calificada / unanimidad** | Umbral de coeficientes que una decisión necesita. Lo fija el reglamento. | `Votacion.mayoriaExigida` |
| **Acta** | Documento que registra lo ocurrido y lo decidido en la asamblea. Aprobada, no se edita. | `Acta` |
| **Acta aclaratoria** | Acta nueva que corrige una anterior sin modificarla. | `Acta.actaAclaratoriaDe` |
| **Comisión verificadora** | Copropietarios elegidos en la asamblea para revisar y aprobar el acta. | *(pendiente de definir)* |
| **Consejo de administración** | Órgano elegido que supervisa al administrador. **Solo es obligatorio** en copropiedades comerciales o mixtas de más de 30 bienes privados, sin contar parqueaderos ni depósitos; en las residenciales es opcional (Ley 675, art. 53). Tiene 3 o más miembros, en número impar. **La ley no crea la figura de presidente**: la pone cada reglamento. | rol `consejo` |
| **Delegado** | Uno de los **dos perfiles que BOB crea** en cada copropiedad (el otro es el Administrador). Si la copropiedad **tiene consejo de administración**, el Delegado es su presidente; si no, lo nombra la asamblea. Tiene en BLOKY **lo mismo que el Administrador** (con un alcance aún por confirmar) y además puede pedir el retiro o bloqueo del Administrador, con el acta del órgano que lo decidió (Ley 675, art. 50); **el nuevo Administrador lo crea IDIKY en BOB**. Como es el superusuario de BLOKY, **su propio cambio solo se pide a `operaciones@idiky.com`** (2026-09-10, [docs/13](./13-bob-copropiedades-y-contratos.md)) | *(por definir en BOB y BLOKY)* |
| **Operador de IDIKY** | El equipo de IDIKY trabajando en BOB. Está por encima de cualquier copropiedad y crea sus dos perfiles raíz ([actores y roles](./03-actores-y-roles.md)) | — |
| **Revisor fiscal** | Órgano de control contable de la copropiedad. | rol `revisor` (fase 2) |
| **Administrador** | Representante legal que ejecuta la operación de la copropiedad. Lo elige y lo remueve la asamblea, o el consejo si existe, y **puede ser una empresa** (Ley 675, arts. 50-51). **Una misma persona o empresa puede administrar varias copropiedades**, y en pocos casos ser además propietaria o residente (2026-09-10). Lo crea IDIKY en BOB. | rol `admin` |
