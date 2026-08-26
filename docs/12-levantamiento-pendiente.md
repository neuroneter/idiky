# 12 — Levantamiento pendiente (preguntas abiertas)

El demo v0.1 se construyó sobre **supuestos de un conjunto residencial típico**, no sobre el
alcance definitivo del producto. Este documento existe para capturar lo que todavía no se ha
definido.

> **Cómo usarlo:** respondan directamente debajo de cada pregunta, en este archivo, y súbanlo.
> Cada respuesta se convierte después en un caso de uso, una regla de negocio o un ADR.
> Lo que quede sin responder sigue siendo un supuesto, y los supuestos se marcan como tales.

---

## 0. Alcance declarado por el equipo — 2026-08-26

Mary describió el producto que se quiere construir. **Esta es la primera definición de
alcance que viene del equipo y no de un supuesto**, así que manda sobre el demo v0.1.

> «Una aplicación fácil de acceder para propietarios de una propiedad horizontal donde
> puedan consultar la cuota de pago del mes, un informe del estado de cuenta, descargar
> certificados de paz y salvo, tener su comprobante de pago, crear solicitudes hacia el
> administrador, la gestión de zonas comunes, citaciones de asambleas, transmisión en vivo
> de asambleas, habilitación de votaciones, la posibilidad de recibir poder de otro
> copropietario para las votaciones, generar el acta, tener los coeficientes.»

### Qué significa esto frente a lo que ya existe

| # | Lo pedido | Estado en el demo v0.1 | Caso de uso |
|---|---|---|---|
| 1 | Consultar la cuota del mes | ✅ Ya existe | CU-R-03 |
| 2 | Informe del estado de cuenta | 🟡 Se ve en pantalla, **no se descarga** | CU-R-18 *(nuevo)* |
| 3 | Descargar certificado de paz y salvo | ⬜ No existe | CU-R-12 · CU-A-13 |
| 4 | Comprobante de pago | 🟡 Se ve al pagar, **no se descarga ni se consulta después** | CU-R-19 *(nuevo)* |
| 5 | Crear solicitudes hacia el administrador | ✅ Ya existe (PQRS) | CU-R-07 · CU-R-08 |
| 6 | Gestión de zonas comunes | ✅ Ya existe | CU-R-05 · CU-R-06 · CU-A-06 |
| 7 | Citaciones de asamblea | ⬜ No existe | CU-R-20 *(nuevo)* · CU-A-12 |
| 8 | Transmisión en vivo de la asamblea | ⬜ No existe | CU-R-21 · CU-A-17 *(nuevos)* |
| 9 | Habilitación de votaciones | ⬜ No existe | CU-R-13 · CU-A-18 *(nuevo)* |
| 10 | Recibir poder de otro copropietario | ⬜ No existe | CU-R-22 · CU-R-23 · CU-A-19 *(nuevos)* |
| 11 | Generar el acta | ⬜ No existe | CU-A-20 *(nuevo)* |
| 12 | Tener los coeficientes | 🟡 El dato existe, **el copropietario no lo ve** | CU-R-24 · CU-A-21 *(nuevos)* |

### Las tres conclusiones que cambian el plan

1. **La asamblea es el núcleo del producto, no un módulo de fase 4.** Seis de los doce
   puntos (7 a 12) son asamblea. El roadmap la tenía en la penúltima fase; se movió.
   Ver [`07-roadmap.md`](./07-roadmap.md).

2. **Hay que generar documentos descargables (PDF) y el demo no genera ninguno.** Paz y
   salvo, informe de estado de cuenta, comprobante de pago y acta son cuatro documentos
   formales. Es una capacidad transversal nueva que **exige un ADR** (hoy no hay ninguna
   dependencia que lo haga). → ADR-0006, pendiente.

3. **La transmisión en vivo no se construye, se integra.** Video en vivo tiene costo por
   minuto y complejidad propia; la decisión (proveedor externo embebido vs. desarrollo
   propio) **exige un ADR**. → ADR-0007, pendiente.

### Lo que quedó sin mencionar — pendiente de confirmar

El demo tiene tres módulos funcionando que **no aparecen en la descripción del alcance**:
**visitantes con código**, **correspondencia** y **cartelera de comunicados**. No se
borraron, pero tampoco se pueden dar por vigentes.

> ❓ **Pregunta abierta:** ¿esos tres módulos entran en la primera versión, quedan para
> después, o salen del producto? Mientras no se responda, se mantienen como están y no se
> invierte más trabajo en ellos.

---

## 1. Producto y negocio

- ¿A quién le vendemos: **al administrador**, a la **copropiedad**, o a una **empresa
  administradora** con varios conjuntos? → *(respuesta)*
- ¿Un administrador manejará **una** copropiedad o **varias** desde la misma cuenta?
  (Hoy está previsto como fase 3, CU-A-15.) → *(respuesta)*
- ¿El producto es para un solo país o desde el inicio debe soportar varios? Esto afecta
  moneda, formato de fechas, impuestos y normativa. → *(respuesta)*
- ¿Hay un producto competidor de referencia con el que nos vamos a comparar? → *(respuesta)*

## 2. Alcance funcional

Para cada módulo: **¿entra en la primera versión real, en una posterior, o no va?**

Estados: `✅ v1` entra en la primera versión · `⬜ Después` · `❌ No va` · `❓ Sin confirmar`

Actualizada con el alcance de la §0. Lo marcado `❓` **no fue mencionado** por el equipo:
hay que responderlo explícitamente, no asumirlo.

| Módulo | ¿Entra? | Notas |
|---|---|---|
| Cartera y cuotas de administración | ✅ v1 | Consultar la cuota del mes es el punto de entrada |
| **Documentos descargables (PDF)** | ✅ v1 | Paz y salvo, estado de cuenta, comprobante, acta. **Nuevo — requiere ADR-0006** |
| **Asambleas: citación, transmisión, votación, poderes, acta** | ✅ v1 | **Es el núcleo del producto**, no un extra |
| **Coeficientes visibles al copropietario** | ✅ v1 | Además de dato interno, es el peso del voto |
| Paz y salvo | ✅ v1 | Debe poder **descargarse**, no solo consultarse |
| Reservas de zonas comunes | ✅ v1 | Ya funciona en el demo |
| PQRS | ✅ v1 | «Crear solicitudes hacia el administrador» |
| Pagos en línea (pasarela) | ❓ Sin confirmar | Se pidió el **comprobante**; no se dijo si el pago se hace dentro de la app |
| Comunicados / cartelera | ❓ Sin confirmar | No mencionado. Hoy implementado |
| Correspondencia | ❓ Sin confirmar | No mencionado. Hoy implementado |
| Visitantes con código | ❓ Sin confirmar | No mencionado. Hoy implementado |
| Portería: minuta y validación de ingreso | ❓ Sin confirmar | No mencionado |
| Presupuesto y contabilidad | ❓ Sin confirmar | No mencionado |
| Proveedores y mantenimientos | ❓ Sin confirmar | No mencionado |
| Encuestas a residentes | ❓ Sin confirmar | No mencionado. Se solapa con «votaciones» |
| Chat entre residentes | ❓ Sin confirmar | No mencionado |
| Reserva de parqueaderos de visitantes | ❓ Sin confirmar | No mencionado |
| Control de mascotas | ❓ Sin confirmar | No mencionado |
| Multas y sanciones por convivencia | ❓ Sin confirmar | No mencionado |
| Facturación electrónica | ❓ Sin confirmar | No mencionado |

## 3. Funcionamiento de la copropiedad real

- ¿Las cuotas se facturan **por anticipado o vencidas**? ¿Qué día vencen?
  *(Supuesto actual: vencen el día 10 del periodo — RN-23.)* → *(respuesta)*
- ¿Cómo se calcula el **interés de mora**? ¿Tasa, base de cálculo, tope legal?
  *(Hoy no se calcula; está pendiente en CU-S-02.)* → *(respuesta)*
- ¿Qué pasa con una unidad en mora: pierde voto, pierde reservas, ambas?
  *(Supuesto actual: pierde reservas — RN-08.)* → *(respuesta)*
- ¿El valor de la cuota se define **por coeficiente**, por tipo de unidad, por área, o es
  fijo? *(Supuesto actual: por coeficiente — RN-05.)* → *(respuesta)*
- ¿Cuál es el **plazo real de respuesta** a una PQRS? *(Supuesto actual: 15 días — RN-13.)*
  → *(respuesta)*
- ¿Las reservas de zonas comunes tienen **depósito o cobro**? ¿Sanción por no cancelar?
  → *(respuesta)*

## 3 bis. Asambleas — preguntas que bloquean el diseño

Este módulo es el núcleo del producto (§0) y es el que tiene **consecuencias legales**.
Ninguna de estas preguntas se puede resolver con un supuesto razonable: hay que leer el
reglamento de la copropiedad y la Ley 675 de 2001.

- **Peso del voto:** ¿cada unidad vale un voto, o el voto se pondera por coeficiente?
  *(Supuesto actual: ponderado por coeficiente — RN-27.)* → *(respuesta)*
- **Quórum:** ¿qué porcentaje de coeficientes se necesita para instalar la asamblea? ¿Hay
  segunda convocatoria con quórum menor? → *(respuesta)*
- **Mayorías:** ¿qué decisiones exigen mayoría simple, cuáles calificada (70 %), cuáles
  unanimidad? El reglamento manda sobre esto. → *(respuesta)*
- **Poderes — el tope:** ¿cuántos poderes puede acumular un apoderado, y hasta qué
  porcentaje de coeficientes puede representar? La Ley 675 fija un límite; **hay que
  confirmar el artículo y la cifra exacta antes de implementar RN-30**. → *(respuesta)*
- **Poderes — la forma:** ¿basta con otorgarlo dentro de la app, o la ley exige documento
  escrito y firmado? Si exige firma, ¿sirve una firma electrónica? → *(respuesta)*
- **Poderes — a quién:** ¿se puede dar poder a cualquier copropietario, o hay
  inhabilidades (administrador, empleados, consejo)? → *(respuesta)*
- **Mora y voto:** ¿el copropietario en mora puede votar? ¿Puede recibir poderes?
  *(Hoy la mora solo bloquea reservas — RN-08.)* → *(respuesta)*
- **Asistencia:** ¿la asamblea es presencial, virtual o mixta? Si es mixta, ¿el quórum
  suma las dos? → *(respuesta)*
- **Transmisión:** ¿la transmisión debe quedar **grabada** como soporte del acta? Eso
  cambia el costo de almacenamiento y el proveedor. → *(respuesta)*
- **Acta:** ¿quién la firma y cómo? ¿Necesita aprobación de una comisión verificadora
  antes de publicarse? → *(respuesta)*
- **Acta:** ¿debe seguir un formato o plantilla específica de la copropiedad?
  → *(respuesta)*

## 3 ter. Documentos descargables

- **Paz y salvo:** ¿qué condición exacta debe cumplir una unidad para obtenerlo — saldo en
  cero, o saldo en cero más ninguna sanción pendiente? → *(respuesta)*
- ¿El paz y salvo tiene **vigencia** (p. ej. 30 días) y consecutivo? ¿Quién lo firma?
  → *(respuesta)*
- ¿El copropietario lo descarga solo, o el administrador debe autorizarlo primero?
  *(Cambia si es CU-R-12 automático o CU-A-13 manual.)* → *(respuesta)*
- ¿Los documentos deben poder **verificarse** después (código QR, número de verificación)?
  → *(respuesta)*
- ¿El comprobante de pago es un recibo de caja informal o debe ser un documento con
  requisitos fiscales? → *(respuesta)*

## 4. Usuarios y roles

- ¿Qué roles existen además de residente y administrador? (Portería, consejo, revisor fiscal,
  contador, personal de mantenimiento…) → *(respuesta)*
- ¿Quién crea las cuentas de los residentes: el administrador, o el residente se registra y el
  administrador aprueba? → *(respuesta)*
- ¿Cómo se identifica un residente al registrarse: correo, celular, número de documento?
  → *(respuesta)*
- ¿Un arrendatario ve la cartera de la unidad, o solo el propietario? → *(respuesta)*

## 5. Técnico

- ¿Hay alguna **restricción de tecnología** por parte de ustedes o de un cliente?
  → *(respuesta)*
- ¿Dónde se va a desplegar (nube propia, proveedor específico)? → *(respuesta)*
- ¿Se debe integrar con algún sistema existente: contable, de pagos, de control de acceso?
  → *(respuesta)*
- ¿Hay requisitos de **protección de datos personales** que debamos cumplir explícitamente?
  → *(respuesta)*
- ¿Las apps nativas son obligatorias, o una PWA instalable es suficiente para la primera
  versión? → *(respuesta)*

## 6. Diseño

- ¿Existe una **identidad visual** (logo, colores, tipografía) o la definimos nosotros?
  *(El demo usa una paleta provisional en `apps/pwa/src/estilos/tokens.css`.)* → *(respuesta)*
- ¿El nombre del producto es definitivo? → *(respuesta)*
- ¿Modo oscuro es requisito? *(Hoy la app solo tiene modo claro.)* → *(respuesta)*

## 7. Plazos

- ¿Hay una fecha objetivo para mostrar el demo a alguien? ¿A quién? → *(respuesta)*
- ¿Cuántas horas semanales le puede dedicar cada persona? → *(respuesta)*

---

## Supuestos vigentes mientras no haya respuesta

Todo lo construido hasta ahora asume lo siguiente. **Si algo aquí es falso, avísenlo: cambia
el modelo de datos y varios casos de uso.**

1. Una sola copropiedad por instalación (multi-copropiedad es fase 3).
2. Conjunto residencial de apartamentos; no hay locales comerciales ni oficinas.
3. Cuotas mensuales prorrateadas por coeficiente, vencimiento el día 10.
4. La mora bloquea reservas pero no se calculan intereses.
5. PQRS con plazo de 15 días calendario.
6. La app del residente y la consola del administrador comparten un solo código base.
7. El demo no tiene backend ni autenticación real.
8. El país es Colombia: moneda COP, PQRS, paz y salvo y Ley 675 de 2001 como marco legal.
   *(Se deduce del demo; nadie lo ha confirmado.)*
9. El voto en asamblea se pondera por coeficiente y el quórum se mide en coeficientes,
   no en número de unidades. **Supuesto — ver §3 bis.**
10. Los documentos formales (paz y salvo, acta, comprobante, estado de cuenta) se entregan
    en PDF descargable. **Supuesto — ver §3 ter y ADR-0006.**
