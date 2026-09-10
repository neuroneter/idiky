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
| [0006](./0006-documentos-formales.md) | **Documentos formales:** se generan en el servidor, con HTML y CSS; se guardan con su huella y se verifican sin la app | Aceptada |
| [0007](./0007-transmision-en-vivo.md) | **La transmisión la pone un tercero, no Idiky**: se enlaza la reunión que la copropiedad ya hace por Zoom o Meet. Lo insustituible es la asistencia ponderada, no el video | Aceptada |
| 0008 | **Stack de backend** | ⬜ Pendiente de escribir |
| [0009](./0009-soportes-fotograficos.md) | **Soportes fotográficos** del registro de personas: se capturan con HTML de siempre, se reducen y se guardan en el navegador. Lo difícil no es la foto, es el dato | Aceptada |

Queda **uno** pendiente, ADR-0008 (backend), del alcance declarado el 2026-08-26
([`../12-levantamiento-pendiente.md` §0](../12-levantamiento-pendiente.md)). Recuerden la regla
del [`CLAUDE.md`](../../CLAUDE.md): no se agregan dependencias sin ADR.

Vale la pena notar que **ADR-0007 terminó decidiendo que no hace falta ninguna dependencia**:
enlazar una reunión de Zoom o Meet es un enlace, no un SDK. La decisión que parecía la más cara
resultó la más barata.

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
