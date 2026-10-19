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

> **Actualización (2026-10-11, Daniel):** al entrar a un cliente, lo primero es su **estructura** (el
> terreno o la planta, RN-252), para ubicarse de forma gráfica; los primeros pasos quedan en el menú.
> El menú es una **barra de fichas** con dibujos isométricos (Estructura o Planta, Primeros pasos,
> Documentos, Ubicación y «Pronto», donde lo que aún no existe aparece como niveles bloqueados).

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
8. **Pisos por tramos (RN-242 a RN-244, 2026-10-11):** doble clic en una torre u oficina (o
   «Construir pisos») abre **el constructor**: la torre en grande, piso por piso, que se pinta con
   bloques de una paleta, crece y hace sótanos con manijas, y trae plantillas. Por debajo es una pila de tramos —sótanos, locales, vivienda, oficinas, zonas comunes, terraza— con
   sus unidades por piso; un tramo de vivienda puede tener **terraza privada**, y uno de uso
   «terraza» es **zona común** (en la azotea o en un piso intermedio). El dibujo muestra la pila, y
   un espacio dentro del edificio dice en qué piso está.

**Flujos alternativos**
- A1. Copropiedad grande → **Duplicar** una torre ya configurada, o **Importar desde Excel**
  (la ruta experta: ver el árbol antes de confirmar). El detalle de la importación se escribe con CU-B-06.
- A2. Quita una torre o agrupación con cosas dentro → lo de dentro queda suelto (RN-171). Si ya
  tiene historia (unidades con propietarios, reservas), en el producto se **retira**, no se borra.
- A3. Intenta meter una torre en otra, o algo dentro de sí mismo → no se deja (RN-170).

**Reglas de negocio:** RN-169 a RN-173, RN-185, RN-186; la pila de pisos y las terrazas, RN-242 a RN-244; pisos mixtos y el piso de cada espacio, RN-245 y RN-246; la agrupación como capa de color, RN-247.

**Lo que queda abierto**
- ¿Las agrupaciones se anidan (etapa → sector → torres)? Hoy no (RN-170); docs/13 §6 lo permite.
- Asignar parqueaderos también a manzanas y oficinas, y asignar **arrastrando** del parqueadero a
  la torre; la asignación también dentro del popup.
- El arrastre del producto usa eventos de puntero (computador, tableta y teléfono) y guías de
  alineación; el del prototipo es el nativo del navegador y solo sirve con ratón.

**Estado en BLOKY Dev:** 🟡 (2026-10-03) — el terreno funciona y guarda en el esquema de cada
copropiedad (`elemento`, `estructura_version`), con arrastre por eventos de puntero, contención,
asignación, deshacer y control de versión (dos personas no se pisan). Faltan la importación desde
Excel y las guías de alineación. **2026-10-11:** se ve como un juego, en isométrico (torres con su altura y
ventanas, césped, etapas como parcelas de color, etiquetas flotantes; `Sprite.tsx`). Código: `apps/bloky/src/features/estructura/` y
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

### CU-B-10
## CU-B-10 — Armar la copropiedad desde sus documentos (con IA)

- **Actor principal:** Administrador o Delegado
- **Precondiciones:** CU-B-02. La API tiene configurada la IA (`ANTHROPIC_API_KEY`); si no, la
  pantalla lo dice y queda el camino a mano (CU-B-03).
- **Disparador:** «Mi copropiedad → Estructura → Armar desde documentos».
- **Resultado esperado:** El terreno y las unidades quedan armados a partir del reglamento de
  propiedad horizontal, cada unidad con su área, su coeficiente y la página de donde salió, después
  de que una persona revisó y confirmó la propuesta. Decisión: [ADR-0023](../adr/0023-bloky-nativo-para-agentes.md).

**Flujo principal**
1. Sube el PDF del reglamento (o del capítulo de coeficientes), escaneado o no, de hasta 32 MB.
2. BLOKY lo lee en segundo plano (RN-189: Haiku → Sonnet → Opus según la validación) y la pantalla
   muestra «Leyendo…», con el tiempo que va; se puede salir y volver.
3. Ve **la propuesta**: cuántas estructuras y unidades, los controles de RN-188 con su resultado
   (✓ o el motivo), las filas dudosas destacadas para revisar contra el documento, las
   observaciones de la lectura y la tabla de unidades por estructura con su página.
4. **Confirma** (RN-187): el terreno recibe las etapas como agrupaciones y las torres (o
   parqueaderos, depósitos, locales) con sus pisos y unidades por piso, y las unidades quedan
   guardadas con su fuente. Lo lleva al terreno para acomodar el croquis.

**Flujos alternativos**
- A1. La lectura no pasa la validación en ningún peldaño → la propuesta se ve con sus motivos y
  no se puede confirmar; puede subir otro documento o seguir a mano.
- A2. El terreno ya tiene estructuras → la propuesta se puede revisar pero no confirmar (RN-187).
- A3. Descarta la propuesta → queda registrada como descartada; no toca nada.
- A4. Ya hay una lectura en curso en la copropiedad → espera a que termine (RN-189).

**Reglas de negocio:** RN-187 a RN-189; el documento se guarda y se transcribe (RN-240, RN-241, CU-B-11).

**Lo que queda abierto**
- Unir una propuesta con un terreno ya armado (emparejar torres por nombre).
- Varios documentos en un mismo paquete (reglamento, reformas, planos) y partir los grandes en
  pedazos de menos de 100.000 tokens para la tarifa base de Haiku (ADR-0023 §5).
- Marcar en el terreno lo que vino de la IA y ver la página del documento al lado del dato
  (el archivo ya se guarda desde el 2026-10-11: ADR-0019, CU-B-11).

**Estado en BLOKY Dev:** 🟡 (2026-10-11) — **desplegado** (`68c8b19.bloky-9ab02d8`, con la IA configurada) desde
`develop` (`5979f5c`): subir el PDF, lectura en segundo plano con la escalera, validación,
propuesta con la página de cada unidad, confirmar en el terreno y la tabla `unidad`. Probado contra
la API de Anthropic con el reglamento de Oasis (Haiku pasó al primer peldaño, 0,02 US$) y en la app
con la API simulada. Falta la prueba de Daniel en Torres del Parque. Código: `apps/bloky-api/src/{ia,alta}/` y
`apps/bloky/src/features/alta/`.

---

### CU-B-11
## CU-B-11 — Los documentos de la copropiedad y su versión digital

- **Actor principal:** Administrador o Delegado
- **Precondiciones:** CU-B-02. El almacén de archivos configurado (ADR-0019); la versión digital,
  además, con la IA configurada (ADR-0023).
- **Disparador:** «Mi copropiedad → Documentos», o subir el reglamento en CU-B-10 (que lo guarda solo).
- **Resultado esperado:** Los documentos de la copropiedad (reglamento, reformas, planos, actas)
  están guardados y cada uno tiene su versión digital: el texto de cada página y su índice, listos
  para leer, buscar y para que el chat de IA los use citando artículo y página.

**Flujo principal**
1. Ve la lista de documentos: tipo, título, quién lo subió y cuándo, páginas, y el estado de la
   versión digital («Transcribiendo… 30 de 120 páginas», «Lista»).
2. Sube un documento (PDF hasta 32 MB) con su tipo y título; BLOKY lo guarda (RN-240) y lo
   transcribe en segundo plano (RN-241).
3. Abre un documento: el índice a un lado (capítulos, artículos) y el texto página por página; el
   botón «Ver el PDF» abre el original.
4. Busca una palabra en todos los documentos («mascotas», «parqueadero») y ve en qué documento y
   página aparece.

**Flujos alternativos**
- A1. El mismo archivo ya está → se reutiliza; no se transcribe dos veces (RN-240).
- A2. La transcripción falla en un tramo → la versión digital queda «fallida» con lo que alcanzó y
  se puede reintentar; el PDF sigue guardado.

**Reglas de negocio:** RN-240, RN-241.

**Lo que queda abierto**
- El chat de IA que responde con esta versión digital (ADR-0023).
- Corregir a mano la transcripción de una página.
- Fotos y planos como imagen (CU-B-09).

**Estado en BLOKY Dev:** 🟡 (2026-10-11) — desplegado (`221a6fd.bloky-b9b2944`) con R2 (bucket `idiky-dev`) y la IA:
subir, guardar, transcribir por tramos, buscar y leer por página. Falta la prueba de Daniel y el chat de IA.
Código: `apps/bloky-api/src/{almacen,documentos}/` y `apps/bloky/src/features/documentos/`.

---

### CU-B-09
## CU-B-09 — Ubicar la copropiedad: su dirección y el plano real

- **Actor principal:** Administrador o Delegado
- **Precondiciones:** CU-B-02.
- **Disparador:** «Mi copropiedad → Ubicación», el paso 6 de los primeros pasos o el botón del terreno.
- **Resultado esperado:** La copropiedad tiene su dirección y su punto, y el terreno se dibuja
  dentro de su barrio real: las calles y carreras con su nombre, los vecinos y los parques, a escala
  y con el norte (ADR-0017).

**Flujo principal** (rehecho el 2026-10-11 con Daniel: *ellos conocen el lugar*)
1. Escribe **la ciudad y el barrio** (el barrio es opcional) y toca «Ir al mapa»: el mapa va a esa
   zona (satélite o calles).
2. **Mueve y acerca el mapa hasta que el pin del centro quede sobre su conjunto.** Si sabe la
   dirección, puede escribirla como atajo («Carrera 68 # 74-80», RN-248): si se encuentra, el mapa se
   acerca solo; si no, no pasa nada y sigue moviéndolo.
3. «📍 Mi conjunto está aquí» guarda el punto al instante; **las calles del barrio se descargan en
   segundo plano** (RN-249) y el terreno avisa «Descargando las calles…» hasta que aparecen; si los
   servidores fallan, se puede reintentar. La primera vez, la copropiedad se centra en su punto.
4. En el terreno ve su copropiedad sobre el barrio, con zoom para acercar y alejar.
5. **Demarcar (RN-250):** en el terreno, «🗺 Ver el mapa» parte la pantalla: a un lado el terreno, al
   otro el mapa real (calles o satélite). Marca el lote moviendo las esquinas del recuadro y pone
   las entradas; todo aparece al instante en el terreno y queda guardado para los demás.
6. **Ajustar el plano al lote (RN-251):** el terreno no crece ni hace scroll: el plano se arrastra
   con el mouse o el dedo, como un mapa, y la rueda acerca alrededor del cursor. Al abrir, el lote
   llena la pantalla y lo de afuera se oscurece («⌖» lo vuelve a encajar). El plano se gira para
   que el lote quede derecho: solo, la primera vez, por su lado más largo, o con ⟲ ⟳ de 15° y
   «Auto»; las torres se mueven con el barrio. Las torres y oficinas van a escala real, con su
   ancho y fondo en metros.

**Flujos alternativos**
- A1. No encuentra el barrio → el mapa queda en la ciudad y lo dice; la persona lo mueve hasta su conjunto.
- A2. Los servidores del mapa no responden al descargar el barrio → el punto ya quedó guardado; el terreno lo dice y deja reintentar.

**Reglas de negocio:** RN-248, RN-249, RN-250, RN-251.

**Lo que queda abierto:** calcar los bloques sobre el satélite y asociarlos a las torres; las
calles de acceso; el catastro abierto; tomar la dirección de la escritura en «Armar desde
documentos»; las fotos (galería en R2, ADR-0019).

**Estado en BLOKY Dev:** 🟡 (2026-10-11) — desplegado (`08eda9a.bloky-6f68e3b`): ubicar, descargar el
barrio, demarcar el lote y las entradas (RN-250) y ajustar el plano al lote (RN-251). Falta calcar
los bloques sobre el satélite y tomar la dirección de la escritura. Código:
`apps/bloky-api/src/ubicacion/` y `apps/bloky/src/features/ubicacion/`.

---

### CU-B-12
## CU-B-12 — Armar la planta de un espacio de trabajo

> Solo para los clientes cuyo negocio es **espacio de trabajo** (RN-252, ADR-0024): una empresa o un
> coworking que administra su espacio por reservas. En una copropiedad, las oficinas son unidades
> privadas y se arman en el terreno (CU-B-03, RN-253).

- **Actor principal:** Administrador o Delegado del espacio de trabajo
- **Precondiciones:** CU-B-01; el cliente está aprovisionado en BLOKY con negocio `espacio_trabajo`.
- **Disparador:** «Mi espacio de trabajo → Planta» o el paso 1 de los primeros pasos.
- **Resultado esperado:** El espacio tiene sus pisos con sus recintos (salas, oficinas privadas,
  zonas de puestos, recepción, baños…) y sus puestos, con áreas y capacidades, listos para
  reservar (CU-B-13). Referencia: el modo «Plano» de Spot.

**Flujo principal**
0. La primera vez crea su **sede** (RN-259): el nombre de la oficina, el edificio, la dirección, la
   ciudad y el país. Después puede agregar más sedes (otros edificios, ciudades o países) y pasar
   de una a otra; cada sede tiene sus propios pisos.
1. Para cada piso nuevo elige una **plantilla**: piso abierto, oficinas con pasillo, coworking,
   sótano de parqueo o vacío, y el tamaño del piso en metros.
2. Ve la **planta en isométrico, con el estilo de juego del terreno** (2026-10-11, Daniel: *se
   siente de cuadritos*): losa, fachada con ventanas, suelos con su material, muros en corte y los
   muebles de cada tipo (escritorios, mesa de juntas, sofás, cocineta, baños, ascensores), con el
   nombre de cada recinto flotando. Se arrastra y se acerca con la rueda, como el terreno (RN-251).
3. **Agrega espacios** desde el catálogo «Espacios», cada uno con su miniatura isométrica (zona de
   puestos, sala, oficina privada, recepción…; en el código y en las reglas se llaman recintos) y
   los **mueve y ajusta arrastrando sus esquinas**, de a 0,5 m (RN-254). No se pueden montar uno
   sobre otro.
4. Al tocar un recinto, en el panel cambia su nombre, su tipo, su tamaño, su capacidad y si se puede
   reservar (RN-255).
5. En una zona de puestos o una oficina, **«Llenar de puestos»** la llena de escritorios
   numerados; también se agregan, mueven, **duplican** y quitan uno por uno (RN-256).
5a. Agrega **parqueaderos de carros, motos o bicicletas** donde van (un sótano, por ejemplo): los
   cupos salen del tamaño del área y se ven con sus líneas y vehículos (RN-260).
5b. **Amobla** cada espacio desde la pestaña «Objetos»: mesas de juntas de 4 a 16 personas, mesas
   de comedor, mesitas de café, sofás, salas y sillas de espera, poltronas, matas y tableros, cada
   uno con su miniatura (RN-258). Se arrastran, se giran, se les cambia la capacidad y se duplican;
   un espacio también se duplica con todo lo que tiene (Cmd/Ctrl + D).
6. **Agrega pisos** (vacíos o como copia de otro, para los pisos iguales) y pasa de uno a otro.
7. Todo se guarda solo, con versión, y se puede deshacer (RN-257). El resumen dice el área, los
   puestos, las salas, las oficinas y la capacidad total.

**Flujos alternativos**
- A1. Otra persona cambió la planta mientras tanto → no se pisa; se avisa y se recarga.
- A2. Un recinto quedaría fuera del piso o encima de otro → no se suelta ahí; vuelve a su lugar.

**Reglas de negocio:** RN-252, RN-254, RN-255, RN-256, RN-257, RN-258, RN-259, RN-260.

**Lo que queda abierto:** muros en ángulo y puertas; ubicar cada sede en el mapa (CU-B-09); las reservas (CU-B-13); los
miembros y empresas que reservan; tarifas.

**Estado en BLOKY Dev:** 🟡 (2026-10-11) — desplegado (`2a10ec0.bloky-e1f5ab7`) con BOB `gestion-581faf5`; cliente de prueba **Cowork Centro 93** (espacio de trabajo) aprovisionado, administrado por Olga Lucía Henao. Falta la prueba de Daniel. Código: `apps/bloky/src/features/planta/` y `apps/bloky-api/src/planta/`.

---

### CU-B-14
## CU-B-14 — Tu equipo: los colaboradores y sus horarios

> Para los dos negocios (RN-252). Daniel (2026-10-11): *que sea muy entretenido crearlos… y el
> horario fácil de ajustar en cualquier momento… que tengan movimiento, algo divertido*.

- **Actor principal:** Administrador o Delegado
- **Precondiciones:** CU-B-01; el cliente está aprovisionado.
- **Disparador:** la ficha «Equipo» del menú.
- **Resultado esperado:** Cada persona que trabaja en la copropiedad o en el espacio de trabajo
  está en BLOKY con su nombre, su cargo, su personaje y su horario de la semana; se ve quién está en
  turno ahora y quién cubre cada hora de hoy.

**Flujo principal**
1. Ve **la sala**: los colaboradores como personajes animados (respiran, parpadean, caminan,
   saludan al pasar el ratón). Quien está en turno camina por la zona de trabajo; quien no,
   descansa en la banca. Debajo, **«Hoy»** muestra quién cubre cada hora, con la hora actual.
2. **Crea un colaborador** como quien arma un personaje en un juego: (1) su nombre y su cargo, con
   hombres y mujeres mezclados en las tarjetas (el vigilante, la portera…); el cargo lo viste con su
   kit (gorra, ropa, lo de la mano, insignia); (2) **el creador de personajes**: primero **hombre o
   mujer** (cambia la figura y pone primero sus peinados; a la mujer no le ofrece barba), y luego
   galerías de piel, ojos, boca, cabello, color de cabello, barba, gafas, lo de la
   cabeza, ropa, color de la ropa, lo de la mano e insignia; cada opción se ve puesta sobre el mismo
   personaje, y 🎲 arma uno al azar; (3) un turno de un toque y los días. Se une al equipo con su saludo.
3. Toca a alguien para ver su ficha: cambia su nombre o su cargo («Ponerle la ropa de…» lo viste
   con el kit del cargo nuevo) y **edita su personaje** en el mismo creador.
4. **Ajusta el horario** en la grilla de la semana: arrastra en un día vacío para crear un turno,
   arrastra un turno para moverlo (a otra hora u otro día) y su borde para estirarlo, de a media
   hora; Suprimir lo quita; pone turnos de un toque en los días marcados (RN-262).
5. Todo se guarda solo, con versión, y se deshace con Ctrl/Cmd + Z (RN-263).

**Flujos alternativos**
- A1. Un turno se cruzaría con otro de la misma persona → no se acepta; vuelve y se avisa.
- A2. Alguien deja de trabajar → se **retira** (no se borra) y se puede traer de vuelta.

**Reglas de negocio:** RN-261, RN-262, RN-263.

**Lo que queda abierto:** novedades del día (incapacidades, reemplazos), marcar llegada y salida,
avisos a los colaboradores, sus permisos en BLOKY (perfiles, CU-B-01) y que **cada colaborador
ajuste su propio personaje desde su app** con las mismas partes (RN-261).

**Estado en BLOKY Dev:** ⚪ (2026-10-11) — en `develop` de `Bloky-Idiky` (`70c341f`, con el creador por partes, hombre y mujer), probado con la
API simulada; falta desplegar. Código: `apps/bloky/src/features/equipo/` y `apps/bloky-api/src/equipo/`.

---

### CU-B-06 a CU-B-08 — por escribir

Los demás pasos de la puesta en marcha (CU-B-02) tienen número reservado y se escriben cuando
se construyan: **CU-B-06** Unidades y coeficientes (con la carga masiva desde Excel y la
propuesta de coeficiente por área para comparar, docs/09 2026-09-21) · **CU-B-07** Propietarios y
residentes · **CU-B-08** Tu equipo y sus grupos de colaboradores. (CU-B-09 ya está escrito arriba.)
