# Casos de uso — Portería

Ámbito `CU-P`. La portería es el **tercer rol** de la plataforma, decidido el 2026-08-28: quien
recibe los paquetes y valida a los visitantes está en la entrada a cualquier hora, y no es el
administrador.

> **Construido el 2026-08-28**, después de aprobar la propuesta: el puesto tiene tres
> pantallas —el turno, validar visitantes y correspondencia— y su propio perfil en el demo.
> Lo que sigue pendiente es la **minuta**: registrar el ingreso, no solo validarlo.

**Por qué tiene rol propio y no la cuenta del administrador**

1. **Está cuando llega el paquete.** El domiciliario llega a las siete de la noche o un sábado;
   el administrador tiene horario de oficina. Un registro hecho al día siguiente, de oídas,
   pierde lo único que lo hace útil: la hora real.
2. **Registrar es asumir la custodia.** Quien recibe el paquete responde por él hasta
   entregarlo. Si lo registra otro, la cadena se rompe justo donde importa.
3. **Suele ser personal externo.** El portero trabaja para la empresa de vigilancia, no para la
   copropiedad. Con la cuenta del administrador vería la cartera de todos, y quién debe cuánto
   no es asunto de la portería (RN-52).

---

## CU-P-01 — Registrar y entregar correspondencia

- **Actor principal:** Portería (el administrador, de respaldo — CU-A-09)
- **Precondiciones:** Sesión de portería.
- **Disparador:** Llega un paquete, una carta o un domicilio.
- **Resultado esperado:** El residente sabe que tiene algo esperando, y queda constancia de
  quién lo recibió y quién lo retiró.

**Flujo principal**
1. Registra unidad destino, tipo, remitente y observaciones. El sistema guarda **quién lo
   recibió** (`registradoPor`) y la hora.
2. El registro queda `en_porteria` y el residente lo ve en su app (CU-R-11).
3. Al entregarlo, se registra quién lo retiró y la fecha → `entregada` (RN-25).

**Estado:** 🟡 — `src/features/porteria/CorrespondenciaPage.tsx`. Registra, entrega y guarda
quién recibió del mensajero (RN-52). El administrador entra a la misma pantalla desde su
consola, de respaldo (CU-A-09).

---

## CU-P-02 — Validar el código de un visitante

- **Actor principal:** Portería
- **Precondiciones:** El residente generó el código (CU-R-10).
- **Disparador:** El visitante llega a la entrada.
- **Resultado esperado:** La portería sabe si el código sirve **ahora**, y a qué unidad va.

**Flujo principal**
1. La portería lee el QR o teclea el código.
2. El sistema responde con el veredicto y los datos: visitante, documento, placa, unidad y
   quién lo autorizó (RN-16, RN-17).
3. Si es válido, autoriza el ingreso.

**Flujos alternativos**
- A1. Código vencido, aún no vigente o revocado → el sistema dice cuál de los tres es. No es lo
  mismo «todavía no» que «ya no».
- A2. El código no existe → se llama al residente. La app no conoce esa autorización.

**Estado:** 🟡 — `src/features/porteria/ValidarVisitantePage.tsx`. Da el veredicto y los datos
del visitante, y distingue las tres formas de no servir: todavía no, ya venció, o revocado.
**No registra el ingreso**: hora de entrada, salida y vehículo son la minuta, que sigue sin
definir. Con esto CU-R-10 deja de tener una mitad en el aire.

---

## Lo que falta decidir

- **La minuta del turno** (T-08): qué se anota, quién la lee, cuánto se conserva.
- **Registrar el ingreso**, no solo validarlo: hora de entrada y de salida, vehículo.
- **Los turnos**: si la sesión es de la persona o del puesto, y qué pasa al cambiar de turno
  con lo que quedó registrado.
- **Peatonal y vehicular**: ¿el mismo flujo?
