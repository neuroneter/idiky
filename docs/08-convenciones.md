# 08 — Convenciones

## 1. Idioma

- **Documentación, interfaz y nombres del dominio: español.** `Unidad`, `Cuota`, `Reserva`.
- **Palabras clave técnicas: como las define la herramienta.** `useState`, `props`, `build`.
- Sin tildes ni `ñ` en nombres de archivos y de variables (`comunicados`, no `comunicaciónes`).

## 2. Git

**Ramas**

```
claude/<tema>-<id>     Trabajo de agentes de IA (rama asignada por sesión)
feat/CU-R-05-reservas  Funcionalidad ligada a un caso de uso
fix/<descripcion>      Corrección
docs/<tema>            Solo documentación
```

**Commits** — formato `<tipo>(<ámbito>): <descripción en imperativo>`

```
feat(residente): implementar reserva de zonas comunes (CU-R-05)
fix(cartera): corregir cálculo de días de mora (RN-21)
docs(casos-de-uso): documentar el flujo de asambleas
chore(pwa): configurar service worker
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`.
**Si el commit implementa un caso de uso, su identificador va entre paréntesis al final.**

## 3. Código

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | `PascalCase`, un componente por archivo | `CuentaPage.tsx` |
| Pantallas (rutas) | Sufijo `Page` | `ReservasPage.tsx` |
| Hooks | Prefijo `use` | `useDatos` |
| Funciones y variables | `camelCase` | `calcularSaldoUnidad` |
| Tipos e interfaces | `PascalCase` | `Cuota`, `EstadoReserva` |
| Constantes de módulo | `MAYUSCULA_CON_GUIONES` | `SLA_DIAS` |
| Archivos de utilidades | `camelCase.ts` | `formato.ts` |

**Encabezado obligatorio en cada pantalla:**

```tsx
/**
 * CU-R-05 — Reservar una zona común
 * CU-R-06 — Cancelar una reserva
 * Doc: docs/casos-de-uso/residente.md#cu-r-05
 */
```

## 4. Documentación

- Un caso de uso nuevo **siempre** entra primero al catálogo (`04-casos-de-uso.md`) y luego
  al archivo de detalle.
- Una decisión técnica relevante (stack, librería grande, patrón estructural) se registra
  como **ADR** en `docs/adr/NNNN-titulo.md`.
- Al terminar una sesión de trabajo se añade una entrada en
  [`09-estado-del-proyecto.md`](./09-estado-del-proyecto.md). **Esto no es opcional:** es lo
  que permite cambiar de persona o de IA sin perder contexto.

## 5. Definición de "terminado"

Una funcionalidad está terminada cuando:

1. El caso de uso está documentado y su estado actualizado en el catálogo.
2. El código compila (`npm run build`) y la pantalla es navegable.
3. Las reglas de negocio involucradas están en `dominio/reglas.ts`, no dispersas.
4. La bitácora en `09-estado-del-proyecto.md` refleja el cambio.
