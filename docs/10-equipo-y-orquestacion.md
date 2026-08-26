# 10 — Equipo y orquestación del trabajo

Somos **tres personas trabajando en paralelo**: **Jeimy**, **Mary** y **Daniel**. Este
documento define cómo nos repartimos el trabajo sin pisarnos.

> ⚠️ **No es un solo producto.** Mary construye la **aplicación web/móvil** (la PWA de este
> repositorio). Jeimy construye la **aplicación contable, que es de escritorio** y es un
> programa aparte. Las dos van a **intercambiar información** en algún momento, pero no
> comparten pantallas ni código de interfaz. Lo que se comparte es el **dominio**: qué es una
> cuota, qué es un abono, cómo se numera un recibo de caja.

> Regla base: **el conflicto se evita por diseño, no por suerte.** Cada quien es dueño de
> unos archivos; los archivos compartidos tienen un protocolo especial.

---

## 1. Zonas de propiedad (ownership)

Cada módulo tiene **un responsable**. Puedes leer todo el repositorio, pero **solo modificas
tu zona** salvo acuerdo explícito.

| Zona | Archivos | Responsable |
|---|---|---|
| **A. App del residente** | `apps/pwa/src/features/residente/**` | Mary |
| **B. Consola de administración** | `apps/pwa/src/features/admin/**` | Mary |
| **C. Núcleo, datos y documentación** | `apps/pwa/src/{dominio,datos,estado}/**`, `docs/**` | Daniel |
| **D. Diseño y componentes** | `apps/pwa/src/{componentes,estilos}/**` | Rotativo (ver §3) |
| **E. Aplicación contable (escritorio)** | *por definir — ver §1.1* | Jeimy |

### 1.1 La aplicación contable todavía no tiene casa

La zona E está **sin ubicar a propósito**: antes de crear carpetas hay que decidir tres cosas.

1. **Con qué se construye.** Es una aplicación de escritorio, no una web. La restricción
   real es qué puede instalar y ejecutar Jeimy en su computador; eso manda sobre el gusto
   técnico. Cuando se decida, va en un ADR (`docs/adr/0006-...`).
2. **Dónde vive.** ¿En este repositorio, como `apps/contable/`, o en uno propio? Si comparte
   las reglas del dominio con la PWA, estar en el mismo repositorio lo hace más fácil.
3. **Qué información se comparte y en qué dirección.** Es la pregunta que decide la
   integración: qué le manda la PWA a la contable (recaudo, recibos de caja) y qué necesita
   la contable de vuelta.

> **Lo que ya está listo para compartirse:** las reglas de cartera y pagos —
> RN-03 a RN-07 y RN-26 a RN-30 en [`05-modelo-de-datos.md`](./05-modelo-de-datos.md) —
> están escritas como definiciones del dominio, no como código de pantalla. Sirven igual
> en la app de escritorio, sea cual sea el lenguaje: son el contrato entre las dos
> aplicaciones.

## 2. Archivos compartidos — alto riesgo de conflicto

Estos archivos los toca todo el mundo, así que tienen reglas propias:

| Archivo | Protocolo |
|---|---|
| `src/dominio/tipos.ts` | Solo se **agrega**, no se renombra ni se borra sin avisar. Un cambio aquí se anuncia antes de hacerlo. |
| `src/dominio/reglas.ts` | Cada regla es una función independiente → agrega la tuya al final de su sección. Nunca reescribas una regla ajena sin hablarlo. |
| `src/datos/repositorio.ts` | Agrega tu operación en la sección de tu caso de uso (están separadas por comentarios `CU-`). |
| `src/datos/selectores.ts` | Igual: agrega, no reorganices. |
| `src/estilos/tokens.css` | **Solo lo cambia quien tenga la zona D.** Nadie más toca los tokens. |
| `docs/09-estado-del-proyecto.md` | Cada quien **agrega su entrada al principio**; no edites las entradas de otros. |
| `docs/04-casos-de-uso.md` | Solo cambias la fila de **tu** caso de uso. |

**Si dos personas necesitan el mismo archivo el mismo día:** háblenlo antes de empezar y
decidan quién va primero. Es más barato esperar 20 minutos que resolver un conflicto.

## 3. Zona D (diseño) — cómo se maneja

Los componentes de `componentes/` y los estilos los usan las dos apps. Para evitar que dos
personas creen el mismo botón dos veces:

1. Si necesitas un componente nuevo y **es solo para tu pantalla**, créalo dentro de tu
   carpeta `features/…`.
2. Si crees que **se va a reutilizar**, avísalo antes de subirlo a `componentes/`.
3. Nadie modifica un componente compartido sin verificar quién más lo usa
   (`grep -r "NombreDelComponente" apps/pwa/src`).

## 4. Flujo de git

### Ramas

```
main                          Rama estable. Nadie escribe directo.
feat/CU-R-13-asambleas        Una rama por caso de uso.
fix/cartera-dias-mora         Una rama por corrección.
docs/modelo-asambleas         Una rama por cambio solo documental.
```

**Una rama = un caso de uso.** Si tu rama toca tres casos de uso, se va a volver imposible de
revisar y de integrar.

### Ciclo de trabajo

```
1. git checkout main && git pull origin main      ← SIEMPRE antes de empezar
2. git checkout -b feat/CU-A-12-asambleas
3. …trabajas, haces commits pequeños…
4. npm run build                                   ← debe pasar antes de subir
5. git push -u origin feat/CU-A-12-asambleas
6. Abres Pull Request → la revisa otra persona → se integra a main
```

### Reglas de integración

- **Actualiza tu rama con `main` a diario** (`git pull origin main` estando en tu rama). Una
  rama de una semana sin actualizar es un conflicto garantizado.
- **Commits pequeños y frecuentes.** Un commit por idea, no uno gigante al final del día.
- **Nunca reescribas la historia de una rama ajena** (nada de `--force` sobre ramas de otra
  persona).
- **El PR se revisa entre pares**: Jeimy revisa a Mary, Mary revisa a Daniel, Daniel revisa a
  Jeimy (o como acuerden). Nadie integra su propio PR sin al menos una lectura ajena.

### Formato de commit

```
feat(residente): agregar votacion en asamblea (CU-R-13)
fix(cartera): corregir dias de mora cuando no hay vencidas (RN-21)
docs(equipo): ajustar asignacion de zonas
```

Detalle completo en [`08-convenciones.md`](./08-convenciones.md).

## 5. Trabajar con IA en paralelo

Cada persona puede tener su propia sesión de IA. Para que no se contradigan:

1. **Cada sesión empieza leyendo** [`CLAUDE.md`](../CLAUDE.md) y
   [`09-estado-del-proyecto.md`](./09-estado-del-proyecto.md).
2. **Cada sesión trabaja en su propia rama**, nunca en la de otra persona.
3. **Se le dice a la IA cuál caso de uso implementar**, con su identificador (`CU-R-13`), no
   una descripción libre. El caso de uso es el contrato.
4. **Al terminar, la IA actualiza la bitácora** con lo que hizo. Eso es lo que permite que la
   siguiente sesión (tuya o de otra persona) entienda el estado sin preguntarte.
5. Si la IA propone cambiar una decisión de arquitectura, **eso se discute entre los tres**
   y se registra como ADR. No se cambia por iniciativa de una sesión suelta.

## 6. Ritmo de trabajo sugerido

| Cuándo | Qué |
|---|---|
| **Inicio del día** | Cada quien dice en qué CU va a trabajar hoy → se detectan choques antes de que ocurran. |
| **Durante el día** | Commits pequeños; si vas a tocar un archivo compartido, avisas. |
| **Fin del día** | `push` de tu rama + entrada en la bitácora. Nada se queda solo en tu máquina. |
| **Cierre de fase** | Revisión conjunta contra los criterios de salida del [roadmap](./07-roadmap.md). |

## 7. Qué hacer cuando hay conflicto de merge

1. No borres el trabajo del otro para "arreglarlo rápido".
2. Si el conflicto es en **tu zona**, resuélvelo tú.
3. Si el conflicto es en un **archivo compartido**, resuélvanlo **entre los dos** que lo
   tocaron; casi siempre la respuesta es *conservar ambos cambios*.
4. Después de resolver: `npm run build` antes de subir. Sin excepciones.
