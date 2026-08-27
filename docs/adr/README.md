# Registro de decisiones de arquitectura (ADR)

Un ADR documenta **una decisión técnica relevante y por qué se tomó**, para que nadie —
persona o IA — tenga que reconstruir el razonamiento más adelante.

| # | Decisión | Estado |
|---|---|---|
| [0001](./0001-stack-tecnologico.md) | Stack del demo: React + TypeScript + Vite, sin librería de UI | Aceptada |
| [0002](./0002-estrategia-multiplataforma.md) | Una sola base web envuelta con Capacitor para Android e iOS | Aceptada |
| [0003](./0003-capa-de-datos.md) | Capa de datos con adaptadores intercambiables | Aceptada |
| [0004](./0004-autenticacion-demo.md) | Sin autenticación real en el demo: selección de perfil | Aceptada |
| [0005](./0005-codigo-qr-sin-dependencias.md) | Generación del QR de visitantes sin dependencias externas | Aceptada |
| 0006 | **Documentos: cómo se generan** (paz y salvo, estado de cuenta, comprobante, acta) **y cómo se almacenan los que suben los usuarios** (actas de respaldo, RN-47) | ⬜ Pendiente de escribir |
| 0007 | **Proveedor de transmisión en vivo** para las asambleas | ⬜ Pendiente de escribir |
| 0008 | **Stack de backend** | ⬜ Pendiente de escribir |

Los tres pendientes salen del alcance declarado el 2026-08-26
([`../12-levantamiento-pendiente.md` §0](../12-levantamiento-pendiente.md)). **ADR-0006 y
ADR-0007 bloquean trabajo**: sin ellos no se puede empezar ni el paz y salvo ni la
transmisión. Recuerden la regla del [`CLAUDE.md`](../../CLAUDE.md): no se agregan
dependencias sin ADR, y los tres implican dependencias nuevas.

**Plantilla:**

```markdown
# ADR-NNNN — Título

- **Estado:** Propuesta | Aceptada | Reemplazada por ADR-XXXX
- **Fecha:** AAAA-MM-DD

## Contexto
Qué problema o restricción obliga a decidir.

## Decisión
Qué se decidió, en una frase.

## Alternativas consideradas
| Opción | A favor | En contra | Veredicto |

## Consecuencias
Qué se vuelve fácil y qué se vuelve difícil a partir de ahora.
```
