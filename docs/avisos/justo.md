# Avisos para Justo — temas para hablar con Daniel

> **Para el agente de IA:** si quien abre la sesión es **Justo**, antes de cualquier tarea muéstrale
> los avisos **abiertos** de esta página, en palabras sencillas, y pregúntale si ya los habló con
> Daniel. **Vocabulario:** «el middleware de IDIKY» es el único punto de acceso a la capa de datos de
> IDIKY para BOB, ALICE, la app de BLOKY y cualquier otro sistema (hoy en `Bloky-Idiky/apps/bloky-api`,
> ADR-0025). Mientras un aviso esté abierto, **no construyas nada que lo contradiga** (abajo dice qué).
> Los avisos los abre y los cierra Daniel; cuando se resuelvan, se marcan ✅ con la fecha.

---

## 1. Las personas ya no viven en BOB — ⏳ abierto (2026-10-20)

**Qué se decidió:** [ADR-0025](../adr/0025-directorio-unico-y-mapa-de-ubicaciones.md). Todas las
personas de IDIKY (también el Administrador y el Delegado) viven **solo en el directorio de BLOKY**.
BOB las gestiona con un módulo **«Personas del cliente»** que lee y escribe ese directorio por la
entrada de administración del **middleware de IDIKY**, y **no guarda copia**. En BOB queda solo el trámite (`solicitud`), con el
id de la persona. `persona` y `asignacion` **se van de BOB** al final de T-89 (primero se pasan los
datos al directorio y se verifican). **Hecho el 2026-10-20:** las 6 asignaciones y tu persona de prueba (Justo Soto, sin
asignaciones) ya están en el directorio, gestionadas por IDIKY, y **la copia desde BOB está apagada**: lo que se cree en
`persona` o `asignacion` de BOB ya no da acceso a BLOKY.

**Mientras se habla:** no construir nada nuevo sobre `persona` ni `asignacion` de BOB, y no quitarlas
todavía (Strapi borra solas las tablas que su código ya no tiene). Daniel decidió (2026-10-20) **no ocultarlas ni
borrarlas hasta hablarlo contigo**: tu plugin `cuentas-polygon` usa `persona`, así que el retiro se hace cuando tú
hagas tus cambios. Mientras tanto, la gestión real ya está en BOB: el panel «Personas del cliente» de la ficha de
cada copropiedad y la página «Personas de IDIKY» del menú, con permisos «Ver» y «Gestionar» por rol (RN-270).

**Para hablar:** si el módulo «Personas del cliente» lo hace Justo o el equipo de BLOKY.

## 2. El plugin `cuentas-polygon` y los datos de la cadena — ⏳ abierto (2026-10-20)

Hoy la `persona` de BOB guarda los datos del login con contratos inteligentes (`tipoAutenticador`,
`cuentaDia`, `hashCorreo`, `cuentaFinanciera`, `estadoCadena`…) y el plugin `cuentas-polygon` atiende
sus cinco acciones desde BOB (T-81, T-87). Con ADR-0025 esos datos pasan al **directorio de BLOKY**, y
la persona de ALICE se identifica ante el **middleware de IDIKY**, no ante los usuarios de Strapi.

**Para hablar:** ¿el plugin se queda en BOB (atendiendo sin guardar personas) o pasa al middleware
de IDIKY? Esto resuelve también T-87.

**Mientras se habla:** no agregar más campos de la cadena a la `persona` de BOB.

## 3. Las reuniones con video son de BLOKY, no de BOB — ⏳ abierto (2026-10-20)

Sobre tu propuesta de pasar Jitsi a pases (JWT): el plan técnico está bien (modo `jwt`, sala de espera,
cierre a tiempo, prueba con dos personas), pero **cambia quién hace cada cosa**:

| En tu propuesta | Va en |
|---|---|
| El endpoint que entrega el enlace | **El middleware de IDIKY** (las reuniones son de BLOKY) |
| Firmar el pase (la clave se comparte entre Jitsi y **el middleware**) | **El middleware** |
| Responder la duración de la sala (Prosody pregunta) | **El middleware** — Jitsi necesita llegar a él |
| Revisar quién puede abrir la reunión | **El middleware** |
| — | **BOB:** solo si el cliente **puede** usar reuniones y **cuántas al mes** (falta ese campo en el plan o un servicio adicional) |

**Mientras se habla:** no crear en BOB el endpoint ni la firma de los pases.

## 4. ALICE usa el mismo directorio y nunca toca una base — ⏳ abierto (2026-10-20)

ALICE **no tiene directorio propio**: entra por el middleware de IDIKY, el único que sabe dónde vive cada
cliente (el **mapa**, ADR-0025 §4). Ninguna app se conecta a una base de datos.

**Para hablar:** cómo se arma el ingreso de ALICE con el login de contratos inteligentes sobre ese
directorio (T-80, T-81).

---

**Para entenderlo de un vistazo:** el diagrama
[`docs/diagramas/reuniones-y-usuarios.drawio`](../diagramas/reuniones-y-usuarios.drawio) (se abre en
app.diagrams.net → Abrir existente → GitHub). Página 1: quién guarda qué. Página 2: una reunión paso a
paso. Página 3: el mapa de dónde vive cada cliente.
