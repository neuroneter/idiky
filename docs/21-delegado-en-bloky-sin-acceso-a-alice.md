# 21 — El Delegado entra a BLOKY y ALICE lo trataba como externo

> **Quién lo abre:** Justo (2026-11-15), al probar el login de ALICE por celular + WhatsApp (T-132).
> **Para:** Daniel (enterado; Justo aplicó la opción B el mismo día).
> **Estado:** **cerrado en código** (RN-327 ampliada). Queda por definir qué pantallas ve quien entra solo por administración.

## Qué pasó

Justo Soto (CC `80821419`, celular `3053996759`):

| En | Resultado (antes) |
|---|---|
| **BLOKY** (`bloky-dev.idiky.com`) | Entra a **Pruebas IDIKY** como **Delegado**. |
| **ALICE** (Flutter) | `POST /api/app/acceso/enviar-codigo` → **`403 sin_acceso`**. |

Asignación: **`delegado` vigente**, sin residencia ni colaborador. No era dato malo: RN-327 no contaba Administrador/Delegado.

## Decisión aplicada (opción B)

**Ampliar RN-327:** Administrador y Delegado vigentes también entran a ALICE. En `lugares`, la copropiedad trae
`administracion: { rol: "administrador" | "delegado" }` aunque no haya unidades ni cargo de colaborador.

Código: `Bloky-Idiky` rama `feature/T-132-alice-admin-delegado` → `develop` → BLOKY Dev.
Contrato: [docs/20](./20-alta-e-ingreso-desde-alice.md) §4 · RN-327 en [docs/05](./05-modelo-de-datos.md).

## Pendiente para Daniel

Qué ve en ALICE quien entra **solo** por `administracion` (sin unidad): ¿reuniones sí, votación de unidad no?
Mientras tanto el ingreso ya no bloquea con `403`.

## Referencias

- ADR-0032 §6 · RN-327 · [docs/20](./20-alta-e-ingreso-desde-alice.md)
- Middleware: `Bloky-Idiky/apps/bloky-api/src/alice/rutas.ts` (`lugaresDe`, `ROLES_DE_ALICE`, `administracion`)
- Caso real Dev: 2026-11-15, Pruebas IDIKY, Justo Soto
