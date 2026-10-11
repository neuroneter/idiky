# ADR-0023 — BLOKY nativo para agentes: el agente propone, el dominio decide

- **Estado:** Aceptada (2026-10-11), con la evidencia del experimento del §5.
- **Fecha:** 2026-10-11
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** [ADR-0008](./0008-backend-de-bloky.md), [ADR-0015](./0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md),
  [ADR-0021](./0021-flujos-de-uso-como-datos.md), [ADR-0022](./0022-directorio-de-acceso-impersonacion-y-consumo.md),
  CU-B-03, CU-B-04, CU-B-06

## Contexto

El terreno de «Arma tu copropiedad» (CU-B-03) funciona, pero es un editor: el administrador arma
todo a mano. Daniel (2026-10-11): *se siente dinámico, pero de hace 5 o 7 años*. Hoy la
expectativa se invirtió: **el sistema arma y la persona corrige**. Y la tendencia de los agentes
y la automatización va a dejar de ser opcional para los administradores.

Lo que hace posible el cambio en propiedad horizontal: toda copropiedad en Colombia tiene un
**reglamento de propiedad horizontal** (Ley 675 de 2001) protocolizado en escritura, que ya lista
cada unidad privada con su área y su coeficiente. Todo administrador tiene además planos y un Excel
de unidades o de cartera. Esa información existe; lo que cuesta es pasarla al sistema.

Objetivo de negocio: que BLOKY **no se pueda comparar** con el software de propiedad horizontal
existente. Si dejar lista una copropiedad toma minutos y no días, la comparación se acaba en la
primera demostración.

## Decisión

**1. Una sola vía de alta: la propuesta.** Armar a mano, mixto o asistido por IA no son tres
sistemas: todo nace como **propuesta** (borrador) que el administrador revisa y confirma en el
terreno. Cambia solo de dónde sale la propuesta: vacía (a mano), del Excel (mixto) o del
reglamento, los planos y el Excel leídos por un agente (asistido). El terreno pasa a ser la
superficie de revisión y corrección, no solo de dibujo.

**2. El agente propone, el dominio decide.** Nada de lo que produzca un modelo se escribe directo:
- La respuesta del modelo llega en un **formato fijo** (salida estructurada) y **cada dato trae su
  fuente** (página del reglamento, fila del Excel).
- Se valida **sin IA**, con las reglas puras de `apps/bloky-api/src/dominio/reglas.ts`
  (coeficientes que suman 100 %, unidades sin repetir, áreas que cuadran).
- Se guarda como **borrador**, marcado «propuesto por IA» en el terreno. Al aceptarlo pasa por el
  guardado con control de versión de siempre, y queda quién lo confirmó.
- Plata, multas y votos los decide siempre el código determinista (reglas e intérprete de
  ADR-0021), nunca el modelo.

**3. Las herramientas de BLOKY, una sola capa con dos puertas.** Las acciones de BLOKY se definen
una vez como herramientas con nombre y esquema fijo (`ver_estructura`, `proponer_estructura`,
`validar_coeficientes`, `listar_unidades`, `consultar_mora`, …), y cada una comprueba el rol en
cada llamada, igual que la API (ADR-0022). Se exponen por dos puertas:
- **Al agente propio de BLOKY** («Arma con IA»), desde `bloky-api`.
- **Como servidor MCP** (Model Context Protocol), para que el asistente que use cada
  administrador (Claude, ChatGPT, Copilot…) opere BLOKY con los mismos permisos que tiene en la
  consola. **Primero solo lectura**; las escrituras, después y con confirmación.

**4. Modelo y proveedor.** Claude (Anthropic), con el SDK oficial `@anthropic-ai/sdk` en
`bloky-api`; modelo por defecto `claude-opus-5-5`. Lee PDF completos, incluidos los escaneados y
sus tablas. Orden de magnitud estimado (por confirmar en el §5): leer un reglamento de 100 a 200
páginas cuesta **2 a 4 dólares por copropiedad**, una sola vez al darla de alta.

**5. Antes de aceptar, un experimento.** Con el reglamento real de una copropiedad, fuera del
código de BLOKY: pedir la estructura con el formato del §2 y compararla con la realidad. Si
acierta en más del 90 % de las unidades y coeficientes, se acepta este ADR y se construye.

**Resultado (2026-10-11).** Documento: el capítulo VII («De los coeficientes de copropiedad») del
reglamento del Conjunto Residencial Oasis Apartamentos (Barranquilla), publicado por el conjunto:
13 páginas de escritura notarial **escaneada** (sellos, QR, marca de agua, anotaciones a mano), sin
texto seleccionable y sin nombres de propietarios. Un programa con el SDK, el formato del §2 y la
validación sin IA dio:

| Qué | Resultado |
|---|---|
| Unidades | 320 (5 torres × 8 pisos × 8), con torre, piso, área, coeficiente y página |
| Suma de áreas | 20.187,79 m², **igual** al total declarado |
| Suma de coeficientes | 100,0049 % (redondeo de la propia tabla) |
| Repetidas · incoherentes área↔coeficiente | 0 · 0 |
| Filas dudosas | 1 (Apto 0534, tapada en el escaneo): reconstruida por el patrón y marcada para revisión |
| Tiempo · costo | 171 s · 0,60 US$ (21.704 tokens de entrada, 25.436 de salida, `claude-opus-5-5`) |

Ocho filas cotejadas a mano contra el escaneo coinciden. Además el modelo dedujo sin instrucción la
numeración consecutiva entre torres, las dos etapas, el tamaño distinto de la Torre 5 y que la
tabla no trae parqueaderos ni depósitos. **Acierto: 100 %.** Alcance: una tabla de un reglamento;
faltan bienes comunes, parqueaderos, depósitos y usos mixtos.

**6. El proveedor de modelo: una sola pieza, el modelo se elige por tarea.** Todo uso de IA en
BLOKY pasa por una pieza de `bloky-api` (como el repositorio de ADR-0003 para los datos) que recibe
la tarea —«lee este reglamento con este formato»— y decide a qué modelo mandarla. Así:
- se mide el costo **por tarea y por copropiedad** desde el primer día;
- cada tarea usa **el modelo más económico que pase la validación sin IA del §2**: Claude Opus
  para lo difícil, Claude Haiku (unas 40 veces más barato) o un modelo de otro proveedor para lo
  sencillo, o un **modelo abierto en un servidor propio** cuando el volumen lo justifique (un
  servidor con GPU cuesta de 400 a 1.500 US$ al mes se use o no; leer reglamentos, que ocurre una
  vez por copropiedad, sale mucho más barato por API);
- si la validación falla, la tarea **sube** a un modelo mejor; el resto de BLOKY no se entera.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| Seguir solo con el editor manual | Ya está hecho; sin costo por uso | Es lo que hace la competencia; alta lenta | ❌ Se queda como una de las tres fuentes de la propuesta |
| Importar solo desde Excel con plantilla | Determinista, sin proveedor externo | Exige que el administrador llene la plantilla; el reglamento queda fuera | ❌ Se queda como fuente «mixta» |
| Que el modelo escriba directo en la base | Más rápido de construir | Sin trazabilidad; un error del modelo cambia coeficientes y con ellos cuotas y votos | ❌ |
| **Propuesta con fuente, validada por reglas puras y confirmada en el terreno** | Rápido para el administrador, trazable, defendible ante un reclamo | Costo por uso; datos a un proveedor externo | ✅ |
| Solo agente propio, sin MCP | Menos superficie | BLOKY queda como aplicación cerrada frente al resto de agentes | ❌ MCP, primero solo lectura |

## Consecuencias

- **Dependencias nuevas** en `bloky-api`: `@anthropic-ai/sdk` y, para MCP,
  `@modelcontextprotocol/sdk`. Se instalan cuando este ADR se acepte.
- **Datos personales (Ley 1581 de 2012):** algunas escrituras traen nombres de propietarios. Enviar
  documentos a un proveedor externo debe quedar autorizado en el contrato con la copropiedad, y la
  clave del proveedor vive en los secretos del servidor (`~/.config/idiky/secretos/`), nunca en git.
- **El modelo de datos gana el estado «propuesta»** (borrador con fuente por dato) en el esquema de
  cada copropiedad (ADR-0015). Se define en `docs/05-modelo-de-datos.md` antes de programarlo.
- **CU-B-03 se amplía** con «Arma con IA» (o se abre un CU nuevo del rango CU-B), y **CU-B-04**
  podrá armar el flujo de uso a partir de una frase con el mismo patrón: el modelo propone los
  bloques y el intérprete de ADR-0021 los ejecuta.
- **El MCP abre BLOKY a cualquier agente**: cada herramienta nueva debe nacer con su comprobación
  de rol y su registro de auditoría, porque ya no solo la llama la consola.
- **Costo por uso** que hay que medir por copropiedad, igual que el consumo de ADR-0022.
