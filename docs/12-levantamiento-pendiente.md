# 12 — Levantamiento pendiente (preguntas abiertas)

El demo v0.1 se construyó sobre **supuestos de un conjunto residencial típico**, no sobre el
alcance definitivo del producto. Este documento existe para capturar lo que todavía no se ha
definido.

> **Cómo usarlo:** respondan directamente debajo de cada pregunta, en este archivo, y súbanlo.
> Cada respuesta se convierte después en un caso de uso, una regla de negocio o un ADR.
> Lo que quede sin responder sigue siendo un supuesto, y los supuestos se marcan como tales.

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

| Módulo | ¿Entra? | Notas |
|---|---|---|
| Cartera y cuotas de administración | | |
| Pagos en línea (pasarela) | | |
| Reservas de zonas comunes | | |
| PQRS | | |
| Comunicados / cartelera | | |
| Correspondencia | | |
| Visitantes con código | | |
| Portería: minuta y validación de ingreso | | |
| Asambleas: convocatoria, quórum, votación | | |
| Paz y salvo | | |
| Presupuesto y contabilidad | | |
| Proveedores y mantenimientos | | |
| Encuestas a residentes | | |
| Chat entre residentes | | |
| Reserva de parqueaderos de visitantes | | |
| Control de mascotas | | |
| Multas y sanciones por convivencia | | |
| Facturación electrónica | | |
| *(otros que necesiten)* | | |

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
