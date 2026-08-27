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

## 5. Ortografía

**El texto visible lleva sus tildes.** Los identificadores no: nombres de variables, valores
del dominio (`'peticion'`, `'administracion'`), clases de CSS y rutas van sin tilde. La regla
que los separa en la práctica: **una etiqueta visible nunca es una sola palabra en
minúscula.**

**La pregunta se abre y se cierra.** `¿Aprueba el presupuesto?`, nunca `Aprueba el
presupuesto?`. Es la falta que más se cuela porque se copia del inglés sin darse cuenta.

No se revisa a ojo. `herramientas/revisar-ortografia.py` recorre el texto visible y falla si
encuentra algo; está en la definición de "terminado". Revisa las pantallas (`src/**/*.tsx`)
**y los datos de ejemplo** (`src/datos/semilla.ts`): la semilla es lo que se lee en la
demostración, así que sus tildes valen igual.

**Lo que la herramienta no puede decidir, lo decide quien escribe.** `esta`/`está`,
`mas`/`más`, `cual`/`cuál` son palabras válidas de las dos formas: ahí no hay diccionario que
valga, hay que leer la frase.

### Segmentos dentro de una pestaña

Cuando una pestaña de la barra inferior agrupa varias vistas —Solicitudes: reservas, PQRS y
paz y salvo—, se navega con **segmentos** (`.segmento`), no con filtros:

- Cada segmento tiene **su propia ruta**. Así el botón «atrás» del teléfono funciona y se
  puede enlazar directo a uno desde el inicio.
- El activo se marca con `aria-current`, que `NavLink` ya pone. Los filtros, que cambian el
  subconjunto de una misma vista, usan `aria-pressed`. No es lo mismo y no se pintan igual.
- Miden **44 px de alto**: son navegación, y navegar con el pulgar en un control de 28 px
  falla a los 60 años.

## 6. Identidad visual

**Nombre del producto.** Se escribe **Idiky** en texto corriente (títulos, documentación,
manifest). El **logotipo** va en minúscula: `idiky`. No mezclar las dos formas en el mismo
contexto.

**Logotipo.** La casa de la marca seguida del nombre, en
`apps/pwa/src/componentes/Logotipo.tsx`. Es la **única definición**: ninguna pantalla vuelve a
escribir «idiky» a mano ni redibuja la casa. Dos reglas:

- **Va limpio sobre la superficie**, sin bloque de color detrás. Si la superficie ya es
  oscura —la lateral de la consola, la barra superior del residente—, se usa la prop
  `inverso`.
- **En la app del residente encabeza la barra superior**, en todas las pantallas y en el
  mismo sitio, con el contexto debajo: en el inicio el saludo, en las demás el título de la
  pantalla. Una marca que cambia de lado según la vista no se memoriza, y la esquina derecha
  es la zona de controles —unidad y avatar—, que no es donde va un logotipo.
- **El nombre se lee entero.** Se probó esconder la casa dentro de una de las íes y se
  descartó con la prueba delante: al tamaño de la barra lateral la casita se vuelve una
  mancha, y obliga a descifrar qué letra es. Para un nombre que la gente tiene que leer y
  decir en voz alta, eso se paga caro.

**Colores.** Todos viven en `apps/pwa/src/estilos/tokens.css`. **Ninguna pantalla escribe un
color literal.** La identidad combina dos colores y cada uno tiene un trabajo — no son
intercambiables:

| Token | Color | Para qué |
|---|---|---|
| `--color-marca` | Azul tinta `#1d2e7a` | **Estructura: dónde estás.** Barra superior, lateral del admin, pestaña activa, foco de campos, enlaces |
| `--color-acento` | Violeta `#812485` | **Acción y atención: qué puedes hacer.** El **botón primario**, el **filtro elegido**, los contadores, los chips de acento. `--color-acento-fuerte` es el mismo, presionado |

Los dos juntos aparecen en **una sola superficie por pantalla**: `.tarjeta--marca` (el saldo
del residente) y la barra lateral de la consola. Es la firma de la marca; si aparece en más
sitios deja de serlo.

**Los dos degradados están en `tokens.css`**, como `--degradado-marca` (la tarjeta de saldo) y
`--degradado-marca-vertical` (la lateral). **Los componentes solo consumen el token**, no
escriben el degradado: reequilibrar la marca se hace en un archivo, no en tres.

No están calibrados igual, y es a propósito:

| Superficie | Recorrido | Por qué |
|---|---|---|
| Tarjeta de saldo | Azul a fucsia completo | Es pequeña y sale una vez por pantalla: ahí el fucsia tiene que leerse |
| Lateral de la consola | Azul hasta el 48 %, fucsia cortado al 130 % | Es una barra alta que el administrador tiene delante todo el día |

Para dar **más azul** a cualquiera de los dos: subir la parada intermedia de `--color-marca`,
o subir la de `--color-marca-claro` por encima de 100 % — el degradado se corta antes y el
borde visible no llega a fucsia pleno.

**Dónde va la línea entre los dos.** Lo que la persona **navega** es azul: la pestaña activa
de la barra inferior, la barra superior, el lateral de la consola. Lo que la persona
**acciona** es fucsia: el botón primario y el filtro que eligió. Un filtro no es un sitio
donde estás, es un control que tocaste.

**El color de acción sale del propio degradado**, al 60 % del recorrido entre el azul y el
fucsia. Eso tiene una consecuencia que hay que respetar: en algún punto del scroll **ese
violeta coincide con el fondo**, así que todo control apoyado directamente sobre el degradado
—sin tarjeta debajo— necesita un **filo claro** que lo despegue. Sobre tarjeta blanca no hace
falta.

**El logotipo no sigue al color de acción.** La puerta de la casa usa `--color-marca-claro`,
el fucsia del extremo del degradado, porque tiene que brillar contra el azul y no debe cambiar
si mañana cambia el color de los botones. Un logotipo no es un control.

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

**Tipografía.** El público va de los **18 a los 60 años**, así que la legibilidad manda sobre
el estilo. Tres decisiones, todas en `tokens.css`:

- **La fuente es la del sistema a propósito, no por omisión.** Cada persona ve la letra que su
  teléfono ya usa en todo lo demás —San Francisco en iPhone, Roboto en Android— que es la que
  su ojo tiene más entrenada. Y respeta el tamaño de letra que tenga configurado en Ajustes:
  alguien de 60 que agrandó la letra de su teléfono espera que Idiky la agrande también. Una
  tipografía propia sumaría peso, dejaría de funcionar sin conexión —choca con
  [ADR-0002](./adr/0002-estrategia-multiplataforma.md), la app va a un WebView de Capacitor—
  y sería una dependencia nueva: **exige ADR**.
- **La base es de 16 px**, no de 15. Y el texto más pequeño, de 12,8 px.
- **Los tres grises pasan contraste AA** sobre `--color-fondo`. `--color-texto-tenue` estaba
  en 2,92:1 y se usa en fechas y notas al pie, o sea en texto chico. Si se retocan estos
  valores hay que **volver a medirlos**, no ajustarlos a ojo.

## 7. Definición de "terminado"

Una funcionalidad está terminada cuando:

1. El caso de uso está documentado y su estado actualizado en el catálogo.
2. El código compila (`npm run build`) y la pantalla es navegable.
3. **La ortografía del texto visible está revisada**: `python3 herramientas/revisar-ortografia.py`
   sin hallazgos. La ortografía dice mucho de la calidad de una aplicación, y revisarla a ojo
   no funciona — en la primera pasada a mano se escaparon frases que estaban solas en su línea.
4. Las reglas de negocio involucradas están en `dominio/reglas.ts`, no dispersas.
5. La bitácora en `09-estado-del-proyecto.md` refleja el cambio.
