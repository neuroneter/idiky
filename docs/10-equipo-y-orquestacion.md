# 10 — Equipo y orquestación del trabajo

Somos **tres personas trabajando en paralelo** sobre el mismo repositorio: **Jeimy**, **Mary**
y **Daniel**. Este documento define cómo nos repartimos el trabajo sin pisarnos.

> Regla base: **el conflicto se evita por diseño, no por suerte.** Cada quien es dueño de
> unos archivos; los archivos compartidos tienen un protocolo especial.

---

## 1. Zonas de propiedad (ownership)

Cada módulo tiene **un responsable**. Puedes leer todo el repositorio, pero **solo modificas
tu zona** salvo acuerdo explícito.

| Zona | Archivos | Responsable propuesto |
|---|---|---|
| **A. App del residente** | `apps/pwa/src/features/residente/**` | Jeimy |
| **B. Consola de administración** | `apps/pwa/src/features/admin/**` | Mary |
| **C. Núcleo, datos y documentación** | `apps/pwa/src/{dominio,datos,estado}/**`, `docs/**` | Daniel |
| **D. Diseño y componentes** | `apps/pwa/src/{componentes,estilos}/**` | Rotativo (ver §3) |

> Esta asignación es una **propuesta inicial**. Ajústenla en la reunión de arranque y
> actualicen esta tabla en el mismo commit en que lo decidan.

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
