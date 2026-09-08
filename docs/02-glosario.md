# 02 — Glosario del dominio

Vocabulario común para código, documentación e interfaz. **Los nombres de las entidades en
el código usan estos términos en español** (ver [convenciones](./08-convenciones.md)).

| Término | Definición | Nombre en código |
|---|---|---|
| **Propiedad Horizontal (PH)** | Régimen jurídico donde coexisten bienes privados y bienes comunes bajo un reglamento. | — |
| **Reglamento de propiedad horizontal** | El documento **constitutivo** de la copropiedad: se eleva a escritura pública y se registra. Define coeficientes, bienes comunes y órganos. | — |
| **Manual de convivencia** | Documento **distinto del reglamento**, adoptado por la asamblea, que regula el día a día: horarios, mascotas, ruido, uso de zonas comunes. **En la práctica el catálogo de sanciones suele vivir aquí** (Mary, 2026-09-08), así que es un respaldo válido para una multa por derecho propio (RN-38). | `ConceptoSancion.origen = 'manual'` |
| **Parametrizar** | Trasladar al sistema **lo que el reglamento, el manual o la asamblea ya decidieron**: qué cuotas, multas e intereses existen y cuánto valen. Es facultad exclusiva del administrador (RN-49), y **no es lo mismo que decidir**: el administrador no define las multas. | — |
| **Copropiedad** | El conjunto residencial/edificio administrado. Es el tenant del sistema. | `Copropiedad` |
| **Unidad privada** | Apartamento, casa o local de propiedad individual. | `Unidad` |
| **Torre / Bloque / Etapa** | Agrupación física de unidades dentro de la copropiedad. | `Unidad.torre` |
| **Coeficiente de copropiedad** | Porcentaje de participación de una unidad sobre el total. Define cuánto paga y cuánto pesa su voto. | `Unidad.coeficiente` |
| **Propietario** | Titular del derecho de dominio sobre la unidad. | `Persona` + `Residencia.rol = 'propietario'` |
| **Arrendatario / Tenedor** | Quien habita la unidad sin ser su dueño. | `Persona` + `Residencia.rol = 'arrendatario'` |
| **Residente** | **Una marca, no un título** (Mary, 2026-09-07): dice que esta persona **vive aquí**. La llevan el arrendatario y el residente temporal por defecto; **al propietario se le pregunta**, porque puede tener la unidad arrendada o vacía; el visitante nace sin ella (RN-68). **No es un usuario distinto de propietario o arrendatario.** El título —quién es dueño y quién arrienda— está en `Residencia.rol` y es el que decide qué puede hacer (RN-02, RN-60). Confundirlos lleva a errores concretos: creer que «residente» es lo contrario de «propietario» y escribir un permiso al revés. | `RolUsuario = 'residente'` (marca) ≠ `Residencia.rol` (título) |
| **Cuota de administración** | Aporte periódico (normalmente mensual) para gastos comunes. | `Cuota.tipo = 'ordinaria'` |
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
| **Consejo de administración** | Órgano elegido que supervisa al administrador. | rol `consejo` |
| **Revisor fiscal** | Órgano de control contable de la copropiedad. | rol `revisor` (fase 2) |
| **Administrador** | Representante legal que ejecuta la operación de la copropiedad. | rol `admin` |
