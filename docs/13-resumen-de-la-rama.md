# 13 — Resumen de la rama

**Corte:** rama `claude/repository-review-c0p1wd`, commit `e315cbf`, 2026-09-10.

> **Para qué sirve este documento y para qué no.** La bitácora
> ([`09-estado-del-proyecto.md`](./09-estado-del-proyecto.md)) cuenta el trabajo **en orden
> cronológico**: sesión por sesión, qué se hizo y por qué. Esto es el **corte transversal**:
> qué contiene la rama hoy, sin tener que leer 91 commits ni 39 entradas de bitácora.
>
> Si vas a **retomar el trabajo**, sigue leyendo la bitácora — dice dónde quedó todo.
> Si vas a **entender o revisar la rama entera**, empieza aquí.

Este documento es un **snapshot fechado**. No se actualiza en cada sesión: cuando quede viejo,
se hace otro corte o se borra. Lo que sí se actualiza en cada sesión es la bitácora y el
[tablero](./11-tablero-de-trabajo.md).

---

## 1. Los números

| | |
|---|---|
| **Commits** | 91 hasta el corte (26–28 de agosto; 7–10 de septiembre) |
| **Código** | 68 archivos TypeScript/TSX · ~19.600 líneas |
| **Documentación** | ~7.100 líneas en `docs/` |
| **Casos de uso** | 67 documentados: **35 ✅** · 10 🟡 · 21 ⬜ · 1 ⛔ retirado |
| **Reglas de negocio** | RN-01…RN-77, con RN-41 retirada → **76 vigentes** |
| **ADR** | 8 escritos y aceptados; falta ADR-0008 (backend) |
| **Dependencias de producción** | React, React DOM, React Router. **Nada más** |

La rama **contiene el proyecto entero**: no hay `main`. Las otras dos ramas del repositorio
(`demo-copropiedad-app-mqd87l`, `repository-review-1fbujq`) divergen 89 commits atrás.

---

## 2. Qué hay construido

Un demo PWA navegable, **sin backend**, con datos simulados en el navegador
([ADR-0003](./adr/0003-capa-de-datos.md)) y **tres caras**.

### La puerta

Clave de 4 números —y solo la clave si el teléfono ya te conoce—, **huella** donde el aparato
tiene lector, código de un solo uso en un dispositivo nuevo, activación y recuperación en tres
pasos. **Tamaño de la letra al 100 %, 125 % o 150 %** aplicado a toda la app (CU-R-26).

Todo simulado salvo la huella, que es WebAuthn de verdad, y **cada pantalla lo dice**
([ADR-0004](./adr/0004-autenticacion-demo.md)).

### App del residente

Inicio con resumen · estado de cuenta · pago simulado con comprobante (PSE, Bre-B, tarjeta) ·
solicitudes unificadas —zonas comunes, PQRS y **el paz y salvo, que se emite, se ve y se
imprime**— · cartelera · autorización de visitantes con código QR · correspondencia · su
coeficiente.

Y las dos piezas grandes de este ciclo:

- **Registro de las personas de la unidad** (CU-R-27, CU-R-28): con foto del documento y de la
  persona, que **adjunta ella misma**, autorización de quien registró, y autorización de
  tratamiento de datos antes de subir nada (RN-66).
- **Asambleas** (CU-R-21, CU-R-13, CU-R-23): marcar asistencia según la modalidad, otorgar y
  revocar poder **desde la app**, votar con el peso del coeficiente, y leer el acta cuando el
  administrador la pone a disposición.
- **El proceso sancionatorio de su unidad** (CU-R-29): el mismo expediente que ve el
  administrador, con descargos e impugnación.

### Consola del administrador

Tablero · unidades y residentes con búsqueda, ficha y vinculación · cartera con morosidad ·
registro de pagos manuales · generación de cuotas con previsualización · reservas · PQRS con
SLA · comunicados · correspondencia · registro de propietarios con la tabla de quién registró
a quién.

Y lo que entró en este ciclo:

- **El módulo de asambleas completo** (CU-A-12, CU-A-17, CU-A-19, CU-A-20): convocar según la
  modalidad, instalar, ver la asistencia ponderada en vivo, registrar poderes de papel, y
  **levantar el acta**.
- **Catálogo de multas con su respaldo**, y la reincidencia con el suyo (CU-A-22).
- **Procesos sancionatorios con debido proceso completo** (CU-A-23): notificar citando la
  norma, oír, decidir, permitir impugnar, dar firmeza.
- **La cuota extraordinaria exigiendo el acta que la aprobó** (CU-A-05).

### Portería

El puesto (CU-P-01, CU-P-02): turno, validación del código del visitante, correspondencia.
Ve **rostros pero nunca documentos** (RN-52, RN-67). **Falta la minuta.**

---

## 3. Las decisiones que le dan forma

| ADR | Decisión | Lo que evita |
|---|---|---|
| [0001](./adr/0001-stack-tecnologico.md) | React + TypeScript + Vite, **sin librería de UI ni de estado** | Que el demo engorde y deje de ser portable |
| [0002](./adr/0002-estrategia-multiplataforma.md) | Una sola base web envuelta con Capacitor | Mantener tres bases de código |
| [0003](./adr/0003-capa-de-datos.md) | **Todo el acceso a datos pasa por `repositorio.ts`** | Que cambiar a backend real obligue a tocar cada pantalla |
| [0004](./adr/0004-autenticacion-demo.md) | Sin autenticación real; el flujo está dibujado y se dice | Fingir seguridad que no existe |
| [0005](./adr/0005-codigo-qr-sin-dependencias.md) | El QR se genera sin librería | Una dependencia por un cuadrado de píxeles |
| [0006](./adr/0006-documentos-formales.md) | Los documentos formales se generan **en el servidor**, con HTML y CSS, y se verifican sin la app | Un PDF falso hecho en el navegador |
| [0007](./adr/0007-transmision-en-vivo.md) | **Idiky no transmite**: enlaza el Zoom o Meet que la copropiedad ya usa | Competir con Zoom, y pagar por minuto |
| [0009](./adr/0009-soportes-fotograficos.md) | Las fotos se capturan con HTML de siempre y se reducen en el navegador | Una librería de cámara; y sobre todo, olvidar que lo difícil es el dato, no la foto |
| **0008** | **Stack de backend** | ⬜ **Sin escribir.** Es el que destraba el PDF real, el push y la autenticación |

Dos principios transversales, que aparecen en casi todos los commits:

- **Nada se borra** (RN-61). Las sanciones se archivan, los poderes se revocan, los
  certificados se anulan, las revisiones caducan. Todo queda, con fecha.
- **La regla vive en el dominio y se comprueba en el repositorio**, no en el botón (T-16).
  Esconder un botón no es una regla: hay comprobaciones que se verifican quitándole el
  `disabled` al botón y confirmando que el repositorio igual rechaza.

---

## 4. Lo verificado contra la Ley 675 de 2001

Es lo que distingue a esta rama, y vale la pena que esté junto. La costumbre la instaló Mary el
2026-09-09 con un *«pero revisa la norma»*, y desde entonces **ninguna afirmación jurídica entró
sin leer el artículo**.

| Norma | Qué dice | Dónde vive |
|---|---|---|
| **Art. 41** | Si la primera convocatoria no pudo sesionar, la segunda sesiona con **cualquier número plural**, sea cual sea el coeficiente | RN-28 |
| **Art. 42** | La reunión no presencial vale **«de conformidad con el quórum requerido para el respectivo caso»** — el mismo quórum, no uno propio | RN-75 |
| **Art. 45** | Quórum: **número plural de propietarios** *y* **más de la mitad** de los coeficientes. Son dos condiciones, y se **supera** la mitad, no se alcanza | RN-28 |
| **Art. 46** | Mayoría calificada: **70 % de los coeficientes del edificio** —otra base—. Lo adoptado en contravención es **absolutamente nulo**, y las mayorías superiores de un reglamento se tienen por no escritas | RN-74 |
| **Art. 46, parágrafo** | Esas decisiones **no pueden tomarse en reunión no presencial**, ni en segunda convocatoria salvo que aun así se obtenga el 70 % | RN-77 |
| **Art. 47** | El acta: qué debe indicar, quién la firma, y **20 días hábiles** para verificarla y ponerla a disposición | RN-35, CU-A-20 |
| **Decreto 398 de 2020, art. 1** | Las reglas de convocatoria, quórum y mayorías de las presenciales **se aplican igual** a las no presenciales **y a las mixtas** | RN-75, RN-77 |

Y **dos veces la norma dijo que no hay nada que buscar**, que es un resultado distinto de
«falta el dato»:

- **La Ley 675 no fija tope de poderes** por apoderado. Lo puede fijar el reglamento. Mientras
  no lo haga, Idiky **muestra el acumulado y no rechaza a nadie** (RN-30).
- **La Ley 675 no exige comisión verificadora** del acta: el art. 47 pide presidente y
  secretario y nada más. Por eso la comisión es **opcional** (RN-76).

> **El criterio, dicho en una línea:** la app **suma y registra** (aritmética) y **afirma
> umbrales solo cuando tiene el artículo** (derecho). Antes de verificar, decía «no puedo
> afirmar que haya quórum». Después, dice «hay quórum» **y cita el artículo**.

---

## 5. Lo que cambió de rumbo

Una rama que no registra sus errores es una rama en la que no se puede confiar. Estos son los
que quedaron corregidos **a la vista**, no borrados:

| Qué se creía | Qué resultó | Dónde |
|---|---|---|
| «El tope de poderes lo fija la Ley 675 y no lo tenemos» | **La ley no fija ninguno.** Era una afirmación mía, sin verificar | RN-30 |
| «Las cuotas adicionales son una figura aparte» | Mary se retractó el mismo día: **son la extraordinaria**. CU-A-24 se retiró y RN-41 con ella | RN-73 |
| El acta reportaba puntos «aprobados» aunque constatara que faltó quórum | Se contradecía a sí misma. Ahora dice que la asamblea **no quedó habilitada** | RN-35 |
| La extraordinaria de la cubierta se podía votar en la asamblea mixta | **No se puede**: exige mayoría calificada, y el parágrafo del art. 46 lo prohíbe. Habría producido un acta que prueba su propia nulidad | RN-77 |
| «Las dos formas de asistir suman al mismo quórum» (escrito antes de preguntarlo) | Se quitó por no estar respaldado; se volvió a poner **el día que Mary lo respondió y la norma lo confirmó** | RN-75 |

---

## 6. Lo que NO existe

Backend · autenticación real · pagos reales · notificaciones push · apps nativas · presupuesto ·
modo oscuro · **la minuta de portería** · la consola del operador de Idiky · el canal por el que
se envía el código de un solo uso (T-18).

Y **el PDF de verdad**. Los documentos formales —paz y salvo, poder, acta— se ven en pantalla y
salen al imprimir, pero **no se finge una descarga**: el archivo lo genera el servidor, que no
existe ([ADR-0006](./adr/0006-documentos-formales.md), ADR-0008).

---

## 7. Lo que está abierto, y de quién es

Detalle completo en [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md).

**Del reglamento de la copropiedad** — las responde Mary con el documento a la mano:

1. ¿Fija **tope de poderes** por apoderado? (§3 bis)
2. ¿Le da a la **comisión verificadora** un término propio para revisar? Hoy corre el
   supletorio de 20 días hábiles del art. 47.

**Para el abogado** — una sola, y salió de construir:

3. ¿Una **asamblea mixta** con quórum presencial suficiente puede adoptar una decisión de
   mayoría calificada? El art. 46 dice «no presenciales» y en 2001 no existía la mixta; el
   Decreto 398 las asimila. Idiky **bloquea, que es lo conservador**, pero es deducción, no
   cita. Si la respuesta es sí, se afloja en una línea.

**Bloques enteros sin abrir:**

- **§3 quinquies — interés de mora** (8 preguntas). Es el único hueco de respaldo que le queda
  a la cartera (RN-43).
- **§3 sexies — habeas data**: cuánto se conservan las fotos de cédula y dónde viven. Y una que
  apareció con los poderes: **el apoderado externo nunca autoriza el tratamiento de sus datos**.
- **Mora y voto**: ¿el copropietario en mora puede votar? ¿Puede recibir poderes? Hoy la mora
  solo bloquea reservas.

**Técnicas:** ADR-0008 (backend) · T-18 (canal del código) · el modelo de perfiles que RN-65
necesita para delegar · la consola del operador.

---

## 8. Cómo comprobar la rama

```bash
cd apps/pwa
npm install
npm run build                              # typecheck + build de producción
python3 herramientas/revisar-ortografia.py # tildes del texto visible
npm run dev                                # http://localhost:5173
python3 herramientas/empaquetar-demo.py    # un solo HTML para compartir
```

`npm run build` y el revisor de ortografía están **en la definición de «terminado»**
([`CLAUDE.md`](../CLAUDE.md)).

Además hay **once suites de Playwright** que se escribieron junto con el módulo de asambleas y
recorren el navegador de verdad (convocatoria, asistencia, quórum, poderes por las dos puertas,
la hoja del poder, el acta, la comisión verificadora, la mayoría calificada). **Viven fuera del
repositorio**, en el directorio de trabajo de la sesión, y eso es una deuda: si se quieren
conservar, hay que decidir dónde van y con qué runner — hoy se ejecutan a mano con el Chromium
del contenedor.
