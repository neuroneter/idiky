# 09 — Estado del proyecto (bitácora)

**Este es el documento que hay que leer primero al retomar el trabajo**, sea una persona
nueva o una sesión de IA distinta.

---

## Estado actual

| | |
|---|---|
| **Versión** | v0.1 — demo PWA navegable |
| **Fase** | 1 de 5 ([roadmap](./07-roadmap.md)) |
| **Backend** | No existe. Datos simulados en el navegador. |
| **Autenticación** | Simulada (selección de perfil, [ADR-0004](./adr/0004-autenticacion-demo.md)) |
| **Casos de uso implementados** | 21 de **45** documentados (12 de residente, 9 de administrador) |
| **Compila** | Sí — `cd apps/pwa && npm run build` |

### Lo que funciona hoy

**App del residente:** ingreso y unidad activa · inicio con resumen · estado de cuenta ·
pago simulado con comprobante · reserva y cancelación de zonas comunes con validación de
reglas · radicar y seguir PQRS · cartelera de comunicados · autorización de visitantes con
código · consulta de correspondencia · consulta del coeficiente de copropiedad.

**Consola del administrador:** tablero de indicadores · unidades y residentes con búsqueda,
ficha y vinculación · cartera con morosidad · registro de pagos manuales · generación de
cuotas con previsualización · aprobación y rechazo de reservas · bandeja de PQRS con SLA ·
publicación de comunicados · registro y entrega de correspondencia.

### Lo que NO existe

Backend, autenticación real, pagos reales, notificaciones push, apps nativas, portería,
presupuesto, informes exportables, modo oscuro.

Y —**esto es lo importante desde el 2026-08-26**— no existe nada del núcleo que el equipo
declaró como alcance: **asambleas** (citación, transmisión, votación, poderes, acta) ni
**documentos descargables** (paz y salvo, estado de cuenta, comprobante). Los **coeficientes
visibles al copropietario** sí — se implementaron el 2026-08-26 (CU-R-24).

### ⚠️ El demo v0.1 no es el producto

El demo se construyó sobre **supuestos de un conjunto residencial típico**, antes de tener
el levantamiento de requisitos. El 2026-08-26 el equipo declaró el alcance real
([`12-levantamiento-pendiente.md` §0](./12-levantamiento-pendiente.md)) y quedó claro que
**el demo cubre la mitad fácil del producto y no cubre el núcleo**:

| | |
|---|---|
| **Lo que el demo ya resuelve** | Cuota del mes, solicitudes al administrador (PQRS), zonas comunes |
| **Lo que el demo no resuelve y es el corazón del producto** | Asambleas completas (citación, transmisión, votación, poderes, acta) y documentos descargables |

Lo que hace difícil el producto no es la cartera: es que **una asamblea produzca decisiones
jurídicamente válidas**. Eso exige quórum verificable, poderes con tope legal, votación
ponderada por coeficiente y un acta que resista revisión. Nada de eso está construido y
buena parte **ni siquiera está definida** (ver §3 bis del levantamiento).

---

## Bitácora

> Formato: fecha · quién · qué se hizo · qué sigue. **Las entradas nuevas van arriba.**

### 2026-08-27 · Mary + IA (Claude) · El círculo «MR» dejó de cerrar la sesión

**El hallazgo**

Mary, recorriendo el demo, preguntó qué era el círculo «MR» de la barra: **creyó que era el
botón de volver**. En realidad son sus iniciales y **cerraba la sesión de un toque, sin
preguntar**. Si la persona que construye el producto lo leyó mal, cualquier residente lo hará.

Tres defectos en un solo control:

| | |
|---|---|
| Parecía identidad, hacía una acción | Un avatar invita a «ver quién soy», no a salir |
| Sin etiqueta visible | Solo tenía `title`, que en un teléfono no se muestra nunca |
| Destructivo e inmediato | Un toque accidental terminaba la sesión, sin confirmar |

Y medía 38 px, cuando el mínimo recomendado para el dedo son 44.

**Qué se hizo**

Se evaluaron tres salidas —abrir el perfil, un botón «Salir» explícito, o mover el perfil a
los accesos del inicio— y Mary eligió la primera: **el círculo abre una hoja de perfil** con
el nombre completo, el rol, la unidad y el correo, y dentro está «Cerrar sesión».

Arregla los tres defectos de una vez: el círculo significa lo que la gente espera, la app gana
el único sitio donde el residente ve quién es para el sistema, y la salida queda detrás de un
paso deliberado, que es lo que corresponde a algo irreversible.

**El botón de la hoja salió del rojo**

La primera versión pintaba «Cerrar sesión» con el rojo de error, y Mary notó que los colores
de la hoja no eran los de la app. Tenía razón, y el fallo era contra **nuestra propia regla**:
el rojo está reservado para la plata —mora, cuota vencida, cartera vencida—
([`08-convenciones.md`](./08-convenciones.md)). Cerrar sesión no es un error ni pierde nada, y
pintarlo de rojo le quitaba fuerza a la señal que sí tiene que alarmar. Ahora es un botón
neutro.

Vale como recordatorio: la regla estaba escrita y aun así se rompió al primer intento. Si
aparece un color fuera de los tokens de la superficie donde está, es un error, no una
variación.

**La barra, alineada**

La unidad y el avatar estaban centrados contra las dos líneas de la izquierda, así que
flotaban entre el logotipo y el título sin pertenecer a ninguno. Ahora la fila se alinea
abajo: quedan a la altura del título de la pantalla, que es la línea que la persona lee.

**Pendiente de decidir por el equipo**

La hoja muestra el rol tal como está en el modelo: «Propietario». Es el término legal, pero se
muestra igual para todas las personas. Si el equipo quiere una forma neutra, hay que cambiar
el vocabulario del dominio, no solo esta pantalla.

---

### 2026-08-27 · Mary + IA (Claude) · La marca en las vistas interiores y el botón de volver

**Qué se hizo**

*La marca en la barra.* El logotipo solo aparecía en el inicio. Se evaluaron dos ubicaciones
para llevarlo al resto de la app del residente y **Mary eligió la segunda**:

| Opción | Dónde va | Veredicto |
|---|---|---|
| 1 | Arriba a la derecha, sobre «Torre 1 · 402» | Descartada: el logotipo cambiaba de lado según la pantalla —izquierda en el inicio, derecha en las demás— y una marca que se mueve no se memoriza. Además la esquina derecha es la zona de controles (unidad y avatar), y una marca no es un control |
| **2 — aplicada** | Arriba a la izquierda, encabezando la barra, con el contexto debajo | La marca queda **en el mismo sitio en todas las pantallas**, inicio incluido. El saludo no se perdió: en el inicio pasa a la línea de abajo |

Cayeron dos reglas de CSS que quedaron sin uso: `.barra-superior__saludo` y
`.barra-superior__marca-unidad`.

*El botón de volver.* Tenía `padding: 0` y medía **unos 21 px de alto**, cuando el mínimo
recomendado para tocar con el dedo son **44 px**. Ahora es un botón de verdad, con borde,
fondo y foco visible, en `componentes/BotonVolver.tsx`.

Y estrenó tres pantallas que no tenían ninguna: **mi unidad, visitantes y correspondencia**
se abren desde los accesos directos del inicio y **no tienen pestaña en la barra inferior**,
así que la única salida era acertarle a la pestaña de inicio. El botón nombra su destino
(«Inicio», «Mi cuenta») en vez de decir solo «Volver», que obliga a recordar de dónde vienes.

---

### 2026-08-27 · Mary + IA (Claude) · Logotipo y tipografía — T-09 cerrada

**Qué se hizo**

Se cerró la identidad visual con el encuadre que dio Mary: **el público va de los 18 a los 60
años**. Eso convirtió la tipografía en un problema de legibilidad medible y no de gusto.

**Logotipo.** La casa de la marca seguida del nombre, en un componente
(`componentes/Logotipo.tsx`) que ahora usan las tres pantallas donde aparecía la palabra
escrita a mano: acceso, pantalla de carga y lateral de la consola. Va limpio sobre la
superficie, sin bloque de color detrás.

Se probaron y descartaron dos alternativas, las dos con la prueba delante:

| Descartada | Por qué |
|---|---|
| La casa dentro de una de las íes (`id⌂ky`) | Al tamaño de la barra lateral la casita se vuelve una mancha, y obliga a descifrar qué letra es. Caro para un nombre que hay que leer y decir en voz alta |
| La i en fucsia | **Desaparece** contra el extremo fucsia del degradado de marca |

**Tipografía.** Se mantiene la fuente del sistema, como decisión y no por omisión: es la que
cada persona ya lee en su teléfono, y respeta el tamaño de letra que tenga configurado en
Ajustes — que para alguien de 60 no es un detalle. Una tipografía propia exige ADR (peso,
funcionamiento sin conexión, ADR-0002).

Lo que sí cambió son dos cosas medibles:

| | Antes | Ahora |
|---|---|---|
| Tamaño base | 15 px | **16 px** |
| Texto más pequeño | 11,5 px | **12,8 px** |
| `--color-texto-tenue` sobre el fondo | **2,92:1 — no cumplía AA** | **4,70:1** |
| `--color-texto-suave` | 5,68:1 | 7,00:1 |

El gris tenue era el problema serio: se usa en las fechas de la cartelera y en las notas al
pie, o sea justo en texto chico, y no alcanzaba el mínimo de contraste.

**Una trampa de CSS que apareció al hacerlo**

`.lateral__marca span` estilaba cualquier `span` dentro de la marca de la consola. Al meter el
componente —que renderiza spans por dentro— el nombre del logotipo heredaba el estilo del
subtítulo. Se cambió por la clase `.lateral__marca-sub`. Vale la regla general: **no estilar
por etiqueta dentro de un contenedor que va a recibir componentes.**

**El logotipo entra a la app del residente**

Al revisar el resultado apareció un hueco: el logotipo solo se veía en el acceso, en el
destello de carga y en la lateral de la consola. **Dentro de la app del residente no había
marca en ninguna pantalla** — justo la cara que más se usa.

Se resolvió en la barra superior del inicio: donde decía «Inicio» ahora va el logotipo. Decir
«Inicio» cuando ya estás en el inicio no informa nada, así que el sitio estaba libre. En las
demás pantallas el título se queda, porque ahí sí dice dónde estás.

**Qué sigue**

T-09 queda cerrada. Subir la base de 15 a 16 px movió todas las pantallas; se revisaron
acceso, inicio del residente, estado de cuenta y consola sin desbordes, pero conviene que el
equipo recorra el resto del demo.

---

### 2026-08-26 · Mary + IA (Claude) · Identidad visual: azul y fucsia

**Qué se hizo**

Mary pidió una paleta con fucsia y azul, **combinados**, no uno subordinado al otro. Se
propusieron dos direcciones (azul de marca con fucsia de acento, y la inversa) y se eligió
combinarlas repartiendo el trabajo entre las dos:

- **Azul tinta `#1d2e7a` = estructura.** Dónde estás: barra superior, lateral del admin,
  botón primario, pestaña activa, foco, enlaces.
- **Fucsia `#c41e8c` = acción y atención.** Qué puedes hacer: contadores, botón de acento.
- **Las dos juntas** en una sola superficie por pantalla: la tarjeta de saldo del residente y
  la barra lateral de la consola, con un degradado de azul a fucsia. Es la firma de la marca.

Los neutros dejaron de ser grises verdosos y ahora tiran a azul (`#f5f5fb`, texto `#171935`):
un gris neutro al lado de un color saturado se ve sin decidir.

**Una decisión que conviene no deshacer sin pensarlo**

En este producto **el rojo significa plata** — mora, cuota vencida, cartera vencida. En la
primera propuesta con fucsia dominante ese rojo perdía fuerza, porque el fucsia le quedaba
cerca en tono y competía justo con la señal que más tiene que alarmar. Por eso el fucsia
quedó como acento y no como color de marca, y el rojo mandó solo. Está anotado en el
encabezado de `tokens.css` y en [`08-convenciones.md`](./08-convenciones.md).

**Sobre el degradado**

Se probó una versión con más peso del azul (el azul puro pasada la mitad del recorrido) y se
descartó: Mary prefirió el reparto original, donde la tarjeta de saldo recorre el degradado
completo de azul a fucsia. La lateral de la consola sí mantiene el azul más tiempo, porque es
una barra alta que el administrador tiene delante todo el día.

De ese intento sí quedó algo: los dos degradados salieron del CSS de los componentes y pasaron
a `tokens.css` como `--degradado-marca` y `--degradado-marca-vertical`. Estaban repartidos
entre `base.css` y `layout.css`, así que reequilibrar la marca obligaba a editar dos archivos
y acordarse de los dos. Ahora es cambiar unos números en el archivo donde vive la identidad,
que es lo que dicen las convenciones.

**Qué se tocó**

`tokens.css` (paleta, reparto y degradados), `base.css` y `layout.css` (pasan a consumir el
token), los dos SVG del logo, los PNG del manifest, el `theme-color` y el `background_color`. El empaquetador
del demo ahora **lee `--color-marca` de los tokens**, para que el `theme-color` no se
desactualice en el próximo cambio de identidad.

Verificado en Chromium a 390×844 y 1280×800, sin errores de consola.

**Qué sigue**

T-09 sigue en curso: faltan el **logotipo definitivo** y la **tipografía** (hoy usa la fuente
del sistema). Los colores ya están.

---

### 2026-08-26 · Mary + IA (Claude) · Revisión del repositorio y alcance declarado

**Qué se hizo**

*Revisión del código existente.* Se verificó que el demo compila (`npm run build` pasa) y
que las reglas del [`CLAUDE.md`](../CLAUDE.md) se están cumpliendo: ninguna pantalla importa
`semilla.ts` ni `almacen.ts`, y las 16 pantallas declaran su caso de uso. Se encontraron
**cuatro bugs y tres deudas de arquitectura** (T-15 del tablero):

| Hallazgo | Dónde | Estado |
|---|---|---|
| **Fechas y horas en UTC**: `formatearFechaHora()` cortaba la cadena sin convertir. Un pago a las 8:30 p.m. del 26 se mostraba como «27 ago, 01:30» | `utilidades/formato.ts` | ✅ Corregido |
| **La PWA no tenía íconos instalables**: `index.html` apuntaba a un PNG inexistente y el manifest solo declaraba SVG | `public/`, `manifest.webmanifest` | ✅ Corregido |
| **Visitante autorizado a futuro aparecía activo hoy**: no se validaba `vigenciaDesde` | `dominio/reglas.ts` | ✅ Corregido (nuevo estado `programado`) |
| **Doble toque perdía escrituras**: `ejecutar()` clonaba la `bd` del closure | `estado/DatosContext.tsx` | ✅ Corregido (referencia + candado) |
| *Deuda:* las reglas se validan **solo en la UI** — `crearReserva()` no llama a `validarReserva()`. Al pasar a backend, la validación queda del lado equivocado | `datos/repositorio.ts:205` | ⬜ Abierta |
| *Deuda:* `imputarPago()` (RN-06) es código muerto; `PagoPage` reimplementa la imputación | `dominio/reglas.ts:113` | ⬜ Abierta |
| *Deuda:* RN-22 no filtra por copropiedad, viola RN-01 | `datos/repositorio.ts:175` | ⬜ Abierta |

No hay pruebas, ni linter, ni CI.

*Alcance declarado.* Mary describió el producto que se quiere construir: cuota del mes,
informe de estado de cuenta, paz y salvo descargable, comprobante de pago, solicitudes al
administrador, zonas comunes, citaciones de asamblea, transmisión en vivo, votaciones,
poderes entre copropietarios, acta y coeficientes.

**Decisiones que esto obligó**

1. **La asamblea pasa a ser el núcleo del producto.** Seis de los doce puntos pedidos son
   asamblea. Estaba en la fase 4 del roadmap; **se movió a la fase 2**.
2. **Se agregaron 12 casos de uso** al catálogo (CU-R-18…24, CU-A-17…21) y 3 de sistema
   (CU-S-07…09). El catálogo pasó de 33 a 45 casos de uso.
3. **Se agregaron 12 reglas de negocio** (RN-26 a RN-37) para poderes, quórum, votación,
   acta y documentos. Todas marcadas *pendiente*: ninguna está implementada.
4. **Se modeló el módulo de asambleas y documentos** en `05-modelo-de-datos.md`: Asamblea,
   PuntoOrdenDelDia, Asistencia, Poder, Votacion, Voto, ResultadoVotacion, Acta y Documento.
5. **Dos ADR quedan bloqueando trabajo**: ADR-0006 (generación de PDF) y ADR-0007
   (transmisión en vivo). Sin ellos no se puede empezar ni el paz y salvo ni la asamblea
   transmitida.

**Lo que se construyó**

- **CU-R-24 — Consultar mi coeficiente** (`MiUnidadPage.tsx`, ruta `/app/unidad`, con acceso
  desde el inicio). Muestra el coeficiente y, sobre todo, **qué determina**: la cuota del mes
  y el peso del voto en asamblea. El peso del voto sale de `pesoDelVoto()`, que es la única
  definición de RN-27 — cuando se construya la votación debe llamar ahí, no volver a leer
  `unidad.coeficiente`.
- **Los cuatro bugs corregidos** (tabla de arriba). Los íconos PNG de la PWA se generan con
  `apps/pwa/herramientas/generar-iconos.py`, un rasterizador de librería estándar: no había
  ImageMagick en el entorno y agregar una dependencia de imagen rompía la regla del
  `CLAUDE.md`. Si cambia el logo, hay que volver a correrlo.

Verificado en Chromium a 390×844 con zona horaria de Bogotá: el comprobante de un pago hecho
a las 18:35 ahora dice «26 ago, 18:35» y no la hora UTC. Sin errores de consola.

**Cómo mostrar el demo**

Se agregó `apps/pwa/herramientas/empaquetar-demo.py`, que empaqueta `dist/` en **un solo HTML
autocontenido**. Sirve para mostrarle el demo a alguien que no tiene el repositorio ni Node:
se abre con doble clic o se sube a cualquier hosting estático.

```bash
cd apps/pwa && npm run build && python3 herramientas/empaquetar-demo.py
```

Funciona porque el demo no tiene backend. **Cada persona que lo abra tiene su propia copia de
los datos en su navegador**: nadie ve lo que hace el otro. Para una demostración es una
ventaja; para trabajar sobre los mismos datos no sirve, y eso es justamente lo que resuelve
la fase 2a.

**Lo que quedó marcado como supuesto, no como decisión**

El quórum en coeficientes y el tope de poderes se escribieron como supuestos con **(?)**, no
como reglas cerradas. (El **voto ponderado por coeficiente** sí quedó confirmado por Mary ese
mismo día: RN-27 pasó de supuesto a regla implementada.) En particular, **el tope
legal de poderes de la Ley 675 de 2001 no se escribió con una cifra concreta porque no se
verificó el artículo** — implementar RN-30 con un número inventado sería un error con
consecuencias jurídicas. Es la tarea T-11.

**Qué sigue**

1. Responder §3 bis (asambleas) y §3 ter (documentos) del levantamiento — **bloquean el
   diseño del núcleo**.
2. Decidir si visitantes, correspondencia y cartelera siguen en el producto: están
   implementados pero nadie los mencionó (T-12).
3. Escribir ADR-0006 y ADR-0007 (T-13, T-14).
4. Confirmar la asignación de zonas: Mary indicó que trabajará en la app móvil, hoy
   asignada a Jeimy en `10-equipo-y-orquestacion.md` (T-03).

---

### 2026-08-26 · Sesión de IA (Claude) · Arranque del repositorio

**Qué se hizo**

- Estructura del repositorio: `docs/` (documentación) y `apps/pwa/` (demo).
- Documentación base: visión y alcance, glosario del dominio de propiedad horizontal,
  actores y matriz de permisos, catálogo de 33 casos de uso con su detalle, modelo de datos
  con 25 reglas de negocio numeradas, arquitectura, convenciones, roadmap de 5 fases.
- Cinco ADR: stack, estrategia multiplataforma, capa de datos con adaptadores,
  autenticación simulada, código visual de visitantes.
- Demo PWA funcional (React + TypeScript + Vite) con 20 casos de uso implementados,
  datos simulados persistentes e instalable como PWA.
- Documentación de trabajo en equipo para Jeimy, Mary y Daniel: zonas de propiedad de
  código, protocolo para archivos compartidos, flujo de git y tablero de tareas.
- Documento de levantamiento pendiente con las preguntas abiertas del producto.

**Decisiones tomadas** — ADR-0001 a ADR-0005 (ver [`adr/`](./adr/)).

**Qué sigue**

1. El equipo responde [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md).
2. Recorrer el demo y anotar observaciones aquí mismo.
3. Ajustar el catálogo de casos de uso al alcance real antes de construir más.

**Advertencia para quien retome:** no des el alcance del demo por definitivo. Léelo como
"esto es lo que se puede hacer con esta arquitectura", no como "esto es lo que el producto
va a ser".
