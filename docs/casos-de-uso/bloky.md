# Casos de uso de BLOKY — el sistema de las copropiedades

Ámbito **`B`** (2026-09-21, [ADR-0013](../adr/0013-bloky-dev-separada-del-demo.md)). Son los
casos de uso propios de BLOKY que no existen en el demo. Cuando un caso de uso del demo
(`CU-A-NN`) se implemente en BLOKY conserva su identificador; aquí solo van los nuevos.

Quién entra a BLOKY lo define BOB ([`13-bob-copropiedades-y-contratos.md` §3](../13-bob-copropiedades-y-contratos.md)):
el **Administrador** y el **Delegado** de cada copropiedad, y después los perfiles que ellos
creen. BLOKY no crea a nadie por su cuenta.

---

### CU-B-01
## CU-B-01 — Ingresar a BLOKY

- **Actor principal:** Administrador o Delegado de una copropiedad
- **Precondiciones:** La copropiedad existe en BOB, está **activa** o **en implementación**, y la
  persona tiene en BOB una asignación **vigente** como Administrador o Delegado (basta uno de los
  dos perfiles para que la copropiedad pueda entrar).
- **Disparador:** Abre BLOKY.
- **Resultado esperado:** Queda dentro, con su nombre, la o las copropiedades a su cargo y el rol
  con el que entra a cada una. La sesión dura doce horas o hasta que la cierre.

**Flujo principal**
1. Escribe su **tipo y número de documento**. No hay contraseña: la identidad la prueban el celular
   o la cuenta de correo que IDIKY registró en BOB (RN-160).
2. BLOKY busca a la persona en BOB y comprueba que hoy tenga al menos una copropiedad a la que
   pueda entrar (RN-161, RN-162). Le muestra su nombre y **por dónde puede confirmar que es ella**:
   - **Código por SMS** al celular registrado, con la pista «••• 4567» (RN-163).
   - **Google** o **Microsoft**, con la cuenta registrada, pista «o•••@gmail.com» (RN-164). Se
     ofrece **solo el que corresponde al correo**: Gmail → Google; Hotmail, Outlook, Live o MSN →
     Microsoft; Yahoo → Yahoo; otro dominio → solo SMS (RN-167).
   Un solo código por intento, por el canal que elija ([docs/13 §4](../13-bob-copropiedades-y-contratos.md)).
3. **Por SMS:** recibe un código de seis números, válido diez minutos, y lo escribe.
   **Por Google, Microsoft o Yahoo:** el navegador va al proveedor, la persona elige su cuenta y vuelve.
   BLOKY compara el correo que el proveedor verificó con el de BOB: tiene que ser el mismo.
4. Queda dentro. Si tiene varias copropiedades, las ve todas con su rol en cada una.

**Flujos alternativos**
- A1. El documento no está en BOB → «Quien te registra es IDIKY, al crear tu copropiedad».
- A2. Está en BOB pero sin asignación vigente, o su copropiedad es prospecto, suspendida o
  retirada → «Hoy no tienes una copropiedad activa a tu cargo. Escribe a operaciones@idiky.com».
- A3. Código incorrecto o vencido → puede pedir otro. Al **quinto** error en quince minutos el
  documento queda bloqueado quince minutos (RN-166).
- A4. Entró con una cuenta de Google o Microsoft cuyo correo **no es** el de BOB → se rechaza y
  vuelve a la puerta con el motivo. No se le dice cuál es el correo correcto.
- A5. El registro de BOB no tiene celular utilizable ni correo → no hay canal; se le manda a
  operaciones.
- A6. Cierra la sesión → la sesión queda revocada (RN-165); la cookie ya no sirve.

**Reglas de negocio**
- RN-160 a RN-167, en [`05-modelo-de-datos.md`](../05-modelo-de-datos.md).

**Lo que queda abierto**
- El perfil de portería y los perfiles internos que crean el Administrador y el Delegado entran
  por la misma puerta cuando existan (docs/13 §3.5); hoy BOB solo tiene los dos perfiles raíz.
- La clave de cuatro números y la huella del demo (ADR-0004) son de ALICE, la app del
  propietario; BLOKY no las usa.

**Desde el 2026-10-03 (ADR-0022):** la persona se lee del **directorio de acceso** de BLOKY, que se
refresca desde BOB en cada ingreso (si BOB no responde, se entra con lo que tiene). Después de
entrar, cada copropiedad tiene su dirección (`/c/<id>`), con un selector en la barra para cambiar
sin salir, y la API comprueba el rol en cada petición: quitar un rol en BOB corta el acceso en
cuanto BOB avisa o en la siguiente conciliación.

**Estado en BLOKY Dev:** ✅ — en el repo `Bloky-Idiky`: `apps/bloky/src/features/acceso/` y `apps/bloky-api/src/acceso/`.
Probado el flujo por SMS contra un BOB simulado (`apps/bloky-api/pruebas/humo.ts`) y, el
2026-09-21, la identificación contra el BOB real en el servidor de desarrollo (bitácora). **Google y
Microsoft probados con cuentas reales el 2026-09-21** en `https://bloky-dev.idiky.com`
(ADR-0014); Google sigue «en pruebas» en su consola, solo para los usuarios de prueba.
La puerta **se adapta al aparato** (2026-09-21): hoja pegada abajo en el celular, tarjeta en la
tableta y dos paneles en el computador; muestra los dos pasos (Documento · Autenticación) y trae
el control del tamaño de la letra (CU-R-26).

---

> **Del CU-B-02 al CU-B-05 (2026-10-03, Daniel):** el primer módulo con datos, *configurar la
> copropiedad*, refinado sobre el prototipo clicable
> [«Arma tu copropiedad»](../prototipos/arma-tu-copropiedad/README.md) (abrir `index.html#demo`).
> El prototipo es la referencia visual de estos casos de uso: lo que aquí se describe, allá se
> puede tocar. La decisión de guardar los flujos como datos está en
> [ADR-0021](../adr/0021-flujos-de-uso-como-datos.md).

### CU-B-02
## CU-B-02 — Poner en marcha la copropiedad: primeros pasos y menú de BLOKY

- **Actor principal:** Administrador o Delegado de la copropiedad
- **Precondiciones:** Entró a BLOKY (CU-B-01) y la copropiedad está aprovisionada (T-77, ADR-0015).
- **Disparador:** Entra a una copropiedad.
- **Resultado esperado:** Sabe en todo momento qué le falta para usar BLOKY completo y puede
  llegar a cualquier módulo desde un menú agrupado por tarea.

**Los primeros pasos (RN-168).** Mientras la copropiedad no esté lista, el Inicio muestra un
camino con anillo de avance; cada paso dice qué falta y lleva a donde se hace:

| Paso | Qué se hace | Caso de uso | ¿Obligatorio? |
|---|---|---|---|
| 1. Arma tu copropiedad | Estructuras, unidades, espacios y sus relaciones, en el terreno | CU-B-03 | Sí |
| 2. Unidades y coeficientes | Matrícula, área y coeficiente de cada unidad privada (suman 100 %), a mano o por Excel | CU-B-06 | Sí, para cobrar y para asambleas |
| 3. Propietarios y residentes | Quién es dueño y quién vive en cada unidad | CU-B-07 | Sí, para cobrar y para notificar |
| 4. Tu equipo | Colaboradores (portería, zonas sociales, contador…) y sus grupos | CU-B-08 | Para alertas y aprobaciones |
| 5. Espacios y reglas de uso | El flujo de uso de cada espacio | CU-B-04 | Para abrir reservas |
| 6. Ubicación y fotos | Mapa, entradas, portería y galería | CU-B-09 | Opcional |

**El menú**, agrupado por la tarea y no por el tipo de documento (la misma idea que la contable):

| Entrada | Qué tiene |
|---|---|
| **Inicio** | Los primeros pasos mientras falten; después, el resumen de la copropiedad |
| **Pendientes** | Lo que espera una decisión de la administración, con contador (CU-B-05, RN-184) |
| **Mi copropiedad** | Estructura (el terreno) · Unidades y coeficientes · Personas · Equipo · Espacios y reglas de uso · Ubicación y fotos |
| **Convivencia** | Reservas · Comunicados · PQRS · Portería |
| **Dinero** | Cartera · Pagos · Multas |
| **Gobierno** | Asambleas · Procesos |

**Flujo principal**
1. Entra a la copropiedad. Si faltan pasos obligatorios, el Inicio muestra el camino con el
   siguiente paso destacado («Empieza por armar tu copropiedad»).
2. Toca un paso y llega a su pantalla; al terminarlo, vuelve al Inicio con el paso marcado y el
   anillo avanzado.
3. Con los seis pasos (o los obligatorios), el Inicio pasa a ser el resumen.

**Flujos alternativos**
- A1. Abre un módulo antes de tiempo → **los módulos están abiertos, con un aviso** de lo que
  falta y un enlace al paso (Daniel, 2026-10-03). Lo que **mueve plata** —liquidar cuotas,
  registrar pagos, causar— queda deshabilitado hasta completar los pasos 1, 2 y 3, con el motivo
  a la vista (RN-168).
- A2. Cambia algo de un paso ya hecho (p. ej., agrega una torre) → el paso sigue hecho; si el
  cambio deja algo incompleto (unidades nuevas sin coeficiente), el paso vuelve a «falta» y lo dice.

**Reglas de negocio:** RN-168, RN-184.

**Estado en BLOKY Dev:** ⬜ — hoy el interior es vacío a propósito (`features/inicio/InicioPage.tsx`).

---

### CU-B-03
## CU-B-03 — Armar la estructura de la copropiedad (el terreno)

- **Actor principal:** Administrador o Delegado
- **Precondiciones:** CU-B-02.
- **Disparador:** Paso 1 de los primeros pasos, o «Mi copropiedad → Estructura».
- **Resultado esperado:** La copropiedad tiene sus estructuras, unidades y espacios, dónde está
  cada cosa (contención) y a quién le sirve (asignación), y el croquis guardado.

**Flujo principal**
1. Ve el **terreno**: una cuadrícula con el nombre de la copropiedad, un resumen («5 torres ·
   1 oficina · 154 unidades · 64 puestos de trabajo») y el anillo de avance.
2. Del **catálogo** (pestañas **Estructura** y **Espacios**) arrastra al terreno y suelta donde va:
   - **Estructura:** Agrupación (etapa, sector, bloque, zona social, zona comercial), Torre,
     Manzana, **Oficina** (RN-186) y Locales.
   - **Espacios:** Parqueaderos, Depósitos, Portería, Salón social, Piscina, Gimnasio, Parque
     infantil, Entrada vehicular y **Otro espacio**, que abre «Crea tu espacio» para elegir ícono y
     nombre (RN-185).
3. **Toca** una cosa para configurarla en el panel (pisos, apartamentos por piso, locales en el
   primer piso, casas, cantidad, renombrar, duplicar, quitar); **dos toques o clic derecho** abren
   el popup de configurar (CU-B-04).
4. **«Está dentro de» (contención, RN-170):** suelta algo encima de una torre, oficina o
   agrupación y queda dentro, dibujado con ella. Se saca con la ×, arrastrándolo fuera o con el
   selector «Está en». Lo que está dentro se toca y se configura ahí mismo.
5. **«Pertenece a» (asignación, RN-172):** en parqueaderos y depósitos asigna cuántos puestos son
   de cada torre; se dibujan líneas hacia ellas y el resto queda para visitantes.
6. Mueve, alinea y duplica. Lo que suelta cae donde lo ve, ajustado a una cuadrícula fina; con
   algo seleccionado, las flechas lo afinan (RN-173). Todo se puede **deshacer**.
   **Quitar** algo (el botón del panel, o la tecla **Suprimir**/**Borrar** con algo seleccionado;
   Daniel, 2026-10-03) **pregunta antes**: qué se quita, que lo de dentro queda suelto y sus
   asignaciones se pierden, y que se recupera con Deshacer. El botón por defecto es «Cancelar»:
   un Enter sin leer no quita nada.
7. Guarda: el croquis queda con la posición de cada cosa (RN-173).

**Flujos alternativos**
- A1. Copropiedad grande → **Duplicar** una torre ya configurada, o **Importar desde Excel**
  (la ruta experta: ver el árbol antes de confirmar). El detalle de la importación se escribe con CU-B-06.
- A2. Quita una torre o agrupación con cosas dentro → lo de dentro queda suelto (RN-171). Si ya
  tiene historia (unidades con propietarios, reservas), en el producto se **retira**, no se borra.
- A3. Intenta meter una torre en otra, o algo dentro de sí mismo → no se deja (RN-170).

**Reglas de negocio:** RN-169 a RN-173, RN-185, RN-186.

**Lo que queda abierto**
- ¿Las agrupaciones se anidan (etapa → sector → torres)? Hoy no (RN-170); docs/13 §6 lo permite.
- Asignar parqueaderos también a manzanas y oficinas, y asignar **arrastrando** del parqueadero a
  la torre; la asignación también dentro del popup.
- El arrastre del producto usa eventos de puntero (computador, tableta y teléfono) y guías de
  alineación; el del prototipo es el nativo del navegador y solo sirve con ratón.

**Estado en BLOKY Dev:** 🟡 (2026-10-03) — el terreno funciona y guarda en el esquema de cada
copropiedad (`elemento`, `estructura_version`), con arrastre por eventos de puntero, contención,
asignación, deshacer y control de versión (dos personas no se pisan). Faltan la importación desde
Excel y las guías de alineación. Código: `apps/bloky/src/features/estructura/` y
`apps/bloky-api/src/estructura/`.

---

### CU-B-04
## CU-B-04 — Configurar un espacio y su flujo de uso

- **Actor principal:** Administrador (el Delegado: ver «Lo que queda abierto»)
- **Precondiciones:** El espacio o la agrupación existe (CU-B-03).
- **Disparador:** Dos toques o clic derecho sobre el espacio, o «⚙ Configurar» en el panel.
- **Resultado esperado:** El espacio dice quién lo puede usar, cuándo, con qué autorizaciones,
  cuánto cuesta y cómo se paga, a quién se avisa y qué pasa si no se cumple; y el administrador
  lo comprobó con una persona de prueba antes de guardar.

**El popup tiene dos pestañas** (las estructuras solo la primera, RN-169):

- **General:** nombre, ícono (en «Otro espacio»), «Está en» (su contenedor), descripción corta y
  **condiciones y reglas de uso** (texto, un renglón por punto, RN-182).
- **Flujo de uso:** todo lo demás se arma con **bloques** (RN-174). No hay pestaña de capacidad
  ni de horario: el flujo lo estructura (Daniel, 2026-10-03).

**El catálogo de bloques**

| Categoría | Bloques |
|---|---|
| ◆ Preguntas (abren Sí y No) | ¿Está en horario? (con sus franjas por día) · ¿Qué edad tiene? · ¿A qué hora? · ¿Qué día? · ¿Quién es? · ¿Cuántos van? · ¿Está en mora? (ver abierto) |
| ⧗ Reserva y uso | Pide reserva previa (turno, anticipación) · Aforo máximo (exclusivo o compartido) · Reservas al mes · Horas por uso |
| ✔ Autorizaciones | Aprueba la administración · Aprueba el consejo · Va con un adulto responsable · Acepta las condiciones de uso |
| ↺ Después de reservar | ¿Canceló? · ¿Canceló tarde? · ¿Llegó a tiempo? · Cancelar y liberar la zona · Multa · ★ Camino completo (RN-178, RN-179) |
| 🔑 Acceso | Código de acceso (RN-181) |
| $ Pagos | Alquiler · Reserva · Aseo · Mantenimiento · Depósito · Otro cobro; cada uno por reserva, hora o persona, con quién lo autoriza y cómo se paga (RN-176, RN-177) |
| 🔔 Alertas | Por dónde, a quién, cuándo y el mensaje (RN-180) |
| ⚑ Finales | Puede usarlo · No puede usarlo (con el porqué que verá el residente) |

**Flujo principal**
1. Abre el popup. Ve el flujo: «🙋 Alguien quiere usar *Salón social*» arriba, «Si nada lo
   detiene → puede usarlo» abajo y, si el espacio está dentro de una agrupación con flujo, un
   bloque gris «Primero pasa por el flujo de *Zona social*» (RN-175).
2. Arranca de una **plantilla** (salón con alquiler, piscina con horarios, gimnasio por edades) o
   en blanco.
3. **Arrastra bloques** del catálogo y los encaja entre otros; un toque los pone al final. Cada
   bloque se edita ahí mismo, se mueve y se quita. Las preguntas abren dos caminos que se juntan
   debajo: así se combina cualquier regla («¿entre 19:00 y 21:00? → ¿menor de 18? → no puede»).
4. Las **misiones** le dicen qué falta: un bloque, algo en cada camino de cada pregunta, quién
   autoriza cada cobro y multa, por dónde y a quién va cada alerta y código, y probarlo.
5. **Prueba:** elige una persona (perfil, edad, día, hora, cuántos van, si reservó, cómo va su
   pago, si llegó o canceló) y una ficha recorre el flujo. Ve el camino que tomó, el veredicto
   (puede · pendiente · no puede · cancelada), lo que debe cumplir, lo que paga y cómo, la tarjeta
   del código, la **línea de tiempo de las alertas** y, si hubo multa, **la tarjeta tal como la
   verá el residente en la app**.
6. Guarda. El flujo queda como datos, versionado (ADR-0021).

**Flujos alternativos**
- A1. Un cobro o una multa sin quién los autoriza, una alerta o código sin medio o destinatario,
  una franja que termina antes de empezar → no deja guardar y dice qué falta (RN-176, RN-180).
- A2. Cambia el flujo de un espacio con reservas → las reservas hechas siguen con el flujo con
  que se hicieron (RN-183).
- A3. Crea un grupo de colaboradores desde una alerta («+ grupo») → queda disponible para todas
  las alertas (CU-B-08).

**Reglas de negocio:** RN-169, RN-174 a RN-183.

**Relación con las zonas comunes del demo (Mary, CU-A-10).** El demo configura las zonas con
campos fijos (RN-104 a RN-129). En BLOKY esas mismas reglas son bloques; ninguna se pierde:

| Regla del demo | En el flujo de BLOKY |
|---|---|
| RN-104 fotos y especificaciones | General (descripción, condiciones) y paso 6 (fotos) |
| RN-105 turnos que caben exactos en el horario | Pide reserva previa (turno) + ¿Está en horario? |
| RN-106 cambiar las reglas no toca lo reservado | RN-183 |
| RN-109 cobro por uso y depósito con respaldo | Pagos (con quién lo autoriza) |
| RN-110 multa por no cancelar, del catálogo | Camino «Después de reservar» + Multa — **cambia: ver abajo** |
| RN-111 exclusiva o compartida · RN-113 cuántos van | Aforo máximo (modo) · ¿Cuántos van? |
| RN-114 horario por día | ¿Está en horario? (franjas) |
| RN-116 portería deja entrar a los invitados | Alerta a portería · Código de acceso |
| RN-119 cobro por uso a la cuenta de cobro | Pago «con la cuota de administración» |
| RN-122, RN-123 solicitudes que vencen y se deciden | Aprueba la administración + Pendientes |
| RN-124 condiciones aceptadas | Acepta las condiciones de uso (con el texto de General) |
| RN-125 recordatorio | Alerta a quien reservó, X antes |
| RN-128 hasta cuándo se cancela | ¿Canceló tarde? |

**Lo que cambia frente al demo:** la multa por no asistir o cancelar tarde **se carga directo** en
la cuenta de cobro y el residente la puede **refutar** desde la app; la administración la retira o
la mantiene (RN-179). En el demo (RN-110, RN-39) la multa no se cobra sola: pasa por el proceso
sancionatorio. Mary debe conocerlo antes de seguir con reservas (T-84).

**Lo que queda abierto** (T-85)
- **¿Está en mora?** Restringir zonas comunes por deuda es delicado en Colombia: el bloque lleva la
  marca ⚖ «solo si el reglamento lo permite» hasta que lo revise alguien con criterio jurídico.
- ¿El Delegado arma flujos, o solo el Administrador?
- ¿La refutación de una multa tiene plazo?
- ¿El depósito puede ir con la cuota? (un depósito que llega después del uso no garantiza nada).
- El pago en línea por IDIKY y la conexión del código con cerraduras, torniquetes y lectores QR
  aparecen como «próximamente»: cada uno con su ADR.
- Enviar alertas pide un programador de tareas y proveedores de correo, SMS y llamada; con costo,
  posiblemente como servicio adicional del plan (docs/13 §2).

**Estado en BLOKY Dev:** ⬜

---

### CU-B-05
## CU-B-05 — Resolver los pendientes: soportes de pago y refutaciones de multas

- **Actor principal:** Administrador (o el colaborador al que se le delegue)
- **Precondiciones:** Hay algo esperando decisión.
- **Disparador:** Entra a **Pendientes** (el contador lo avisa) o le llega la alerta.
- **Resultado esperado:** Cada pendiente queda decidido, con motivo, y quien lo originó lo sabe.

**Flujo principal**
1. Ve la bandeja con los pendientes de todos los módulos, el más antiguo arriba, cada uno con su
   origen (espacio, reserva, unidad) y cuánto lleva esperando.
2. **Soporte de pago** (RN-177): ve el soporte (foto o PDF), el valor, la cuenta y el plazo.
   **Aprueba** → la reserva se confirma y el pago entra como recaudo; **rechaza con motivo** → el
   residente lo sabe y puede cargar otro mientras el plazo siga abierto.
3. **Refutación de multa** (RN-179): ve la multa, su motivo y la refutación del residente con su
   adjunto. **Retira** → el cargo queda anulado en la cuenta de cobro (no se borra); **mantiene con
   respuesta** → el residente ve la respuesta.
4. **Reserva por aprobar** (bloque «Aprueba la administración»): aprueba o rechaza con motivo.

**Flujos alternativos**
- A1. Vence el plazo de un soporte sin cargar → la reserva se libera sola y el pendiente desaparece
  con esa constancia (RN-177).

**Reglas de negocio:** RN-177, RN-179, RN-184.

**Lo que queda abierto**
- Cómo entra a la contabilidad el pago aprobado (recaudo con recibo de caja): coordinar con la
  contable de Jeimy (regla de la plata que entra).
- El lado del residente —cargar el soporte, ver y refutar la multa, ver el código y las alertas—
  es de ALICE: lo definen Mary y Justo (T-84).

**Estado en BLOKY Dev:** ⬜

---

### CU-B-06 a CU-B-09 — por escribir

Los demás pasos de la puesta en marcha (CU-B-02) tienen número reservado y se escriben cuando
se construyan: **CU-B-06** Unidades y coeficientes (con la carga masiva desde Excel y la
propuesta de coeficiente por área para comparar, docs/09 2026-09-21) · **CU-B-07** Propietarios y
residentes · **CU-B-08** Tu equipo y sus grupos de colaboradores · **CU-B-09** Ubicación y fotos
(Google Maps, ADR-0017; galería en R2, ADR-0019).
