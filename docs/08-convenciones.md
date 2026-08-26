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

## 5. Identidad visual

**Nombre del producto.** Se escribe **Idiky** en texto corriente (títulos, documentación,
manifest). El **logotipo** va en minúscula: `idiky`. No mezclar las dos formas en el mismo
contexto.

**Colores.** Todos viven en `apps/pwa/src/estilos/tokens.css`. **Ninguna pantalla escribe un
color literal.** La identidad combina dos colores y cada uno tiene un trabajo — no son
intercambiables:

| Token | Color | Para qué |
|---|---|---|
| `--color-marca` | Azul tinta `#1d2e7a` | **Estructura: dónde estás.** Barra superior, lateral del admin, botón primario, pestaña activa, foco de campos, enlaces |
| `--color-acento` | Fucsia `#c41e8c` | **Acción y atención: qué puedes hacer.** Contadores, botón de acento, chips de acento |

Los dos juntos aparecen en **una sola superficie por pantalla**: `.tarjeta--marca` (el saldo
del residente) y la barra lateral de la consola. Es la firma de la marca; si aparece en más
sitios deja de serlo.

**El degradado manda el azul.** No es mitad y mitad: el azul se mantiene puro más de la mitad
del recorrido y el fucsia solo entra al final, sin llegar nunca a fucsia pleno. Los dos
degradados están en `tokens.css` como `--degradado-marca` (la tarjeta) y
`--degradado-marca-vertical` (la lateral, que aguanta más azul porque el administrador la
tiene delante todo el día). **Los componentes solo consumen el token**, no escriben el
degradado. Para reequilibrarlo se tocan dos números:

| Parada | Qué controla | Subirla = |
|---|---|---|
| El segundo `--color-marca` (52 % / 62 %) | Hasta dónde llega el azul puro | Más azul |
| El `--color-marca-claro` (145 % / 155 %) | Dónde llegaría el fucsia pleno; por encima de 100 % el degradado se corta antes | Más azul |

**El rojo está reservado para la plata** — mora, cuota vencida, cartera vencida. No usar
fucsia para alarmar: compiten en tono y se pierde la señal que más importa.

**Si cambian los colores de marca**, hay tres sitios que actualizar además de los tokens:

```bash
cd apps/pwa
# 1. Los SVG del logo: public/icono.svg y public/icono-maskable.svg
# 2. Los PNG del manifest (leen sus colores del propio script):
python3 herramientas/generar-iconos.py
# 3. El theme-color de index.html
```

El empaquetador del demo lee `--color-marca` de los tokens, así que ese no hay que tocarlo.

## 6. Definición de "terminado"

Una funcionalidad está terminada cuando:

1. El caso de uso está documentado y su estado actualizado en el catálogo.
2. El código compila (`npm run build`) y la pantalla es navegable.
3. Las reglas de negocio involucradas están en `dominio/reglas.ts`, no dispersas.
4. La bitácora en `09-estado-del-proyecto.md` refleja el cambio.
