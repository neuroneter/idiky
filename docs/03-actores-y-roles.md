# 03 — Actores y roles

## 1. Actores

| Actor | Interfaz principal | Descripción |
|---|---|---|
| **Residente** | App móvil (PWA/Android/iOS) | Propietario o arrendatario que habita una unidad. Consulta su cuenta, reserva, radica PQRS, autoriza visitas. |
| **Propietario no residente** | App móvil | Dueño que arrienda su unidad. Ve cartera y asambleas, no gestiona visitas del día a día. |
| **Administrador** | Consola web | Opera la copropiedad: cartera, reservas, PQRS, comunicados, asambleas. |
| **Portería / Vigilancia** | Consola web (vista reducida) o tablet | Registra correspondencia, valida visitantes, deja minuta. *(Fase 2)* |
| **Consejo de administración** | Consola web (solo lectura + aprobaciones) | Supervisa indicadores y aprueba ciertos actos. *(Fase 2)* |
| **Sistema** | — | Actor no humano: genera cuotas mensuales, calcula mora, vence reservas, envía recordatorios. |

## 2. Matriz de permisos (v0.1 + objetivo)

Leyenda: `L` leer · `E` escribir · `A` aprobar · `—` sin acceso

| Recurso | Residente | Propietario no res. | Admin | Portería | Consejo |
|---|---|---|---|---|---|
| Su estado de cuenta | L | L | L E | — | — |
| Cartera de toda la copropiedad | — | — | L E | — | L |
| Unidades y residentes | L (la suya) | L (la suya) | L E | L | L |
| Reservas propias | L E | — | L E A | L | — |
| Reservas de terceros | — | — | L E A | L | L |
| PQRS propias | L E | L E | L E A | — | L |
| PQRS de la copropiedad | — | — | L E | — | L |
| Comunicados | L | L | L E | L | L |
| Correspondencia de su unidad | L | — | L E | L E | — |
| Visitantes de su unidad | L E | — | L | L | — |
| Asambleas y votación | L + voto | L + voto | L E | — | L |
| Configuración de la copropiedad | — | — | L E | — | L |

## 3. Reglas de identidad

1. Una **persona** puede tener varias **residencias** (p. ej. dueño del 402 y arrendatario del 901).
2. Una **residencia** vincula `Persona ↔ Unidad` con un `rol` (`propietario` | `arrendatario` | `autorizado`).
3. El **rol efectivo** en la app se resuelve por la unidad activa que el usuario tenga seleccionada.
4. Un **administrador** puede estar vinculado a varias copropiedades; siempre opera sobre
   una copropiedad activa.

> En el demo v0.1 la identidad se simula: se elige un perfil de una lista, sin contraseña.
> Ver [ADR-0004](./adr/0004-autenticacion-demo.md).
