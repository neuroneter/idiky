# 02 — Glosario del dominio

Vocabulario común para código, documentación e interfaz. **Los nombres de las entidades en
el código usan estos términos en español** (ver [convenciones](./08-convenciones.md)).

| Término | Definición | Nombre en código |
|---|---|---|
| **Propiedad Horizontal (PH)** | Régimen jurídico donde coexisten bienes privados y bienes comunes bajo un reglamento. | — |
| **Copropiedad** | El conjunto residencial/edificio administrado. Es el tenant del sistema. | `Copropiedad` |
| **Unidad privada** | Apartamento, casa o local de propiedad individual. | `Unidad` |
| **Torre / Bloque / Etapa** | Agrupación física de unidades dentro de la copropiedad. | `Unidad.torre` |
| **Coeficiente de copropiedad** | Porcentaje de participación de una unidad sobre el total. Define cuánto paga y cuánto pesa su voto. | `Unidad.coeficiente` |
| **Propietario** | Titular del derecho de dominio sobre la unidad. | `Persona` + `Residencia.rol = 'propietario'` |
| **Residente / Tenedor** | Quien habita la unidad; puede ser el propietario o un arrendatario. | `Residencia.rol = 'arrendatario'` |
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
| **Poder** | Delegación del voto de un copropietario en otra persona. | `Poder` (fase 2) |
| **Consejo de administración** | Órgano elegido que supervisa al administrador. | rol `consejo` |
| **Revisor fiscal** | Órgano de control contable de la copropiedad. | rol `revisor` (fase 2) |
| **Administrador** | Representante legal que ejecuta la operación de la copropiedad. | rol `admin` |
