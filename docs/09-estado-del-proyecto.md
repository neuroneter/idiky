# 09 — Estado del proyecto (bitácora)

**Este es el documento que hay que leer primero al retomar el trabajo**, sea una persona
nueva o una sesión de IA distinta.

---

## Estado actual

| | |
|---|---|
| **Versión** | v0.1 — demo PWA navegable |
| **Fase** | 1 de 5 ([roadmap](./07-roadmap.md)) |
| **Foco actual** | **La app del propietario.** Las de administrador y portería se trabajan después (Mary, 2026-08-28) |
| **Backend** | No existe. Datos simulados en el navegador. |
| **Autenticación** | El **flujo** está dibujado —documento, clave de 4 números, código en dispositivo nuevo, activación y **huella**— pero **no autentica**: no se guarda ninguna clave. La huella sí es real (WebAuthn); falta el servidor que la comprobaría ([ADR-0004](./adr/0004-autenticacion-demo.md)) |
| **Casos de uso** | 61 documentados: 20 ✅ en el demo, 9 🟡 a medias, 32 ⬜ pendientes |
| **Reglas de negocio** | 56 (RN-01…RN-56) |
| **Compila** | Sí — `cd apps/pwa && npm run build` |
| **Ortografía** | `cd apps/pwa && python3 herramientas/revisar-ortografia.py` — está en la definición de «terminado» |

### Lo que funciona hoy

**Puerta:** ingreso con **clave de 4 números** —y solo la clave si el teléfono ya te conoce— ·
**huella** donde el aparato tiene lector · código de un solo uso en un dispositivo nuevo ·
activación y recuperación en tres pasos. Todo simulado salvo la huella, y cada pantalla lo dice.

**App del residente:** inicio con resumen · estado de cuenta · pago simulado con comprobante
(PSE, Bre-B y tarjeta) · **solicitudes** —zonas comunes, PQRS y el **paz y salvo, que se emite,
se ve y se guarda como PDF**— · **asambleas
con votación ponderada por coeficiente** · cartelera de comunicados · autorización de
visitantes con código · consulta de correspondencia · consulta del coeficiente.

**Consola del administrador:** tablero de indicadores · unidades y residentes con búsqueda,
ficha y vinculación · cartera con morosidad · registro de pagos manuales · generación de
cuotas con previsualización · aprobación y rechazo de reservas · bandeja de PQRS con SLA ·
publicación de comunicados · registro y entrega de correspondencia.

### Lo que NO existe

Backend, autenticación real, pagos reales, notificaciones push, apps nativas, **la consola de
portería** (el rol ya está decidido, CU-P-01 y CU-P-02), presupuesto, modo oscuro.

Y del núcleo declarado como alcance, lo que falta es **la mitad jurídica de la asamblea** —
quórum, mayorías, poderes, acta— y **los documentos en PDF**: el paz y salvo ya se emite y se
registra, pero no se descarga (ADR-0006 sin escribir). Lo que sí quedó: la citación, el orden
del día, la votación por coeficiente (CU-R-13, CU-R-20) y los coeficientes visibles al
copropietario (CU-R-24).

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

### 2026-08-28 · Mary + IA (Claude) · Huella, clave de 4 números y una puerta que te reconoce

Tres pedidos de Mary sobre el acceso, y el tercero es el que ordena a los otros dos.

1. **Ingreso con huella.**
2. **«Después de creado el usuario solamente debe solicitarle la contraseña.»**
3. **«La contraseña debe ser algo muy sencillo porque tenemos adultos mayores»**, y —lo que lo
   deja claro— *«entiendo los temas de seguridad que se deben implementar pero también debemos
   tener en cuenta todos nuestros usuarios»*.

**La clave pasa a ser 4 números** (RN-55). Una contraseña con mayúsculas y símbolos, tecleada en
un teléfono por alguien de 70 años, es la barrera que hace que la persona deje de entrar y
vuelva a llamar a la administración: es decir, la que hace que la app no sirva. Y la seguridad
no baja, **cambia de sitio** — que es la respuesta honesta a su tensión:

- la clave **solo sirve en un dispositivo ya probado** con un código de un solo uso (RN-54);
- **los intentos se acaban**: cinco fallos y hay que volver a pedir el código;
- quien quiera **entra con huella** y no teclea nada.

Es el razonamiento de la clave del cajero: cuatro dígitos bastan cuando hacen falta la tarjeta y
un número limitado de intentos. Sin el límite de intentos, cuatro dígitos se prueban enteros en
un rato — por eso el límite no es un adorno, es lo que sostiene la decisión.

**La puerta tiene dos caras.** Si alguien ya entró en ese teléfono, muestra su nombre y pide
solo la clave; si no, pide documento y clave. «No soy yo» vuelve al camino largo.

**La huella (RN-56) es real, y eso importa decirlo bien.** Se usa WebAuthn, el estándar del
navegador: el lector es de verdad y el dedo también. Lo que no existe todavía es el servidor que
comprobaría la credencial, así que el demo se queda con que el dispositivo confirmó la identidad
de su dueño. **Donde no hay lector, la opción no se ofrece**: no se simula una huella, porque
fingir que se leyó un dedo es la clase de mentira que después nadie descubre.

Con esto nace `servicios/plataforma.ts`, que **ADR-0002 había dejado escrito antes de que
hiciera falta**: las capacidades del dispositivo entran por una interfaz propia con dos
implementaciones. El ingreso con huella es la primera que la necesitaba.

**Detalle de accesibilidad que vale por sí solo:** los campos de números —cédula, código y
clave— van grandes, centrados y espaciados. No es decoración: es lo que decide si la persona
entra o llama a la administración.

---

### 2026-08-28 · Mary + IA (Claude) · El paz y salvo se imprime, y un modelo real corrigió el modelo de datos

Dos correcciones de Mary sobre el ADR que acababa de escribir, y las dos mejoraron el producto.

**1. «No es necesario estar conectado con nadie».** Yo había razonado sobre un instrumento que
un tercero verifica en línea; lo que la copropiedad emite es **un soporte que el propietario
adjunta a un trámite**. Con esa premisa, exigir servidor y conexión para producir una hoja que
hoy firma el administrador es desproporcionado.

Así que los documentos que el residente se lleva —paz y salvo, estado de cuenta, comprobante—
**se imprimen desde el teléfono**: un bloque `.hoja-documento` y una hoja `@media print` que
oculta el resto de la app. El sistema operativo ofrece «Guardar como PDF». Sin servidor, sin
conexión y **sin agregar una sola dependencia**. El acta y la convocatoria siguen esperando el
backend, porque son instrumentos de la copropiedad y algún día pueden exigir firma.

**CU-R-12 queda terminado.** Era el más viejo de los pendientes de fase 1.

**Y una vista previa dentro de la app** (Mary: «es necesario verlo en la app, por si hay
errores ajustarlos»). El botón «Ver cómo queda» muestra el documento en pantalla, tal como
saldrá impreso. El aspecto del certificado quedó definido **una sola vez** y lo usan las dos
caras —la previa y el papel—: tenerlo dentro de `@media print` obligaba a repetirlo, y dos
copias del mismo documento se separan en cuanto alguien toca una. De paso resuelve que el marco
del demo publicado bloquee el diálogo de impresión: la previa se ve igual.

**Un perfil nuevo en la semilla: un propietario que no debe nada** (Mary). Sin él nadie podía
emitir un paz y salvo sin pagar primero, porque el saldo incluye lo ya facturado (RN-26) y a
todo el mundo se le factura el mes siguiente por anticipado. Jorge Enrique Valencia, Torre 1
apto 202, pagó por adelantado — un caso normal, y el que hay que poder mostrar. De paso, el
botón de la tarjeta con saldo pendiente ahora lleva a **pagar**, no a mirar el estado de
cuenta: quien entró ahí quería su certificado.

**2. El modelo real.** Mary aportó un paz y salvo de verdad —el del Edificio Cocora— y leerlo
corrigió dos supuestos míos que ya estaban en el código:

- **El documento no dice «vale 30 días»; dice hasta qué día la unidad está al día.** No es la
  caducidad del papel, es el alcance de lo que certifica. El campo pasó de `vigenteHasta` a
  **`cubiertoHasta`**, y con él se fue el chip de «Vencido» del historial: un certificado no
  caduca solo, y decir que sí era decir algo falso.
- **Nombra el parqueadero** y admite **varios propietarios**. Las dos cosas estaban en el
  modelo de datos sin usarse; ahora salen impresas.

De paso responde **quién firma** —el administrador, con cédula, cargo y contacto—, que era una
de las preguntas abiertas de §3 ter.

La lección para lo que viene: **pedir el documento real antes de diseñar la pantalla**. Media
hora de leer un paz y salvo de verdad corrigió lo que dos días de suponer habían dejado torcido.

---

### 2026-08-28 · Mary + IA (Claude) · ADR-0006, los documentos formales

Escrito y aceptado. Era el que bloqueaba más trabajo: cinco casos de uso esperaban un PDF
—paz y salvo, estado de cuenta, comprobante, convocatoria y acta—.

El criterio que ordenó toda la decisión: **un documento formal no es un dibujo bonito de unos
datos; es una afirmación que un tercero va a usar para tomar una decisión, y tiene que poder
comprobarse sin la app.** Quien recibe el paz y salvo —una notaría, un banco, quien va a
comprar el apartamento— no tiene Idiky instalado.

De ahí salen cinco decisiones:

1. **Se generan en el servidor, nunca en el cliente.** La razón no es el rendimiento: la app
   corre en el teléfono de quien tiene interés en el resultado, y un cliente modificado puede
   pintar «está a paz y salvo» sobre una unidad en mora. Además, el día que lleven firma
   electrónica, la llave privada no puede vivir en miles de teléfonos.
2. **Se dibujan con HTML y CSS**, no con un lenguaje de coordenadas: la identidad ya está
   escrita en `tokens.css`, y volver a escribirla en otro idioma la desincroniza. Un paz y
   salvo con un azul distinto al de la app parece falso.
3. **El archivo se guarda, no se regenera.** Un paz y salvo dice que la unidad no debía nada
   *el 15 de marzo*; regenerarlo en junio produciría otro documento con el mismo número.
4. **Se verifica desde fuera**: número consecutivo más un código aleatorio, y una página
   pública que responde solo tipo, unidad, fecha y si está vigente o anulado. Nada de nombres,
   cédulas ni montos: quien verifica necesita saber que el papel es auténtico, no la vida
   financiera del propietario.
5. **Un documento no se borra, se anula**, y la verificación lo dice — que es justo lo que hay
   que saber si presentan una copia vieja.

**La consecuencia incómoda, dicha de frente:** los PDF no existen hasta que exista el backend.
Los cinco casos de uso quedan bloqueados por ADR-0008, no por esta decisión. Lo que sí se puede
hacer antes es lo que ya hace el paz y salvo: emitir y registrar el documento.

En el demo entró la parte que sí se puede: el certificado ya trae su **código de verificación**
—sin las letras que se confunden al dictarlo, la I con el 1 y la O con el 0— y la pantalla
explica para qué sirve. `codigoVerificacion` deja de ser una pregunta abierta en el modelo.

**Lo que el ADR no responde, a propósito**, porque es de producto y sigue en §3 ter: quién
firma el paz y salvo, cuánto vale (los 30 días de hoy son un supuesto), si el comprobante tiene
requisitos fiscales, y si el paz y salvo necesita autorización previa del administrador.

---

### 2026-08-28 · Mary + IA (Claude) · La puerta de la app

Mary señaló el hueco de fondo: **«lo que hemos trabajado son las pantallas adentro de la app»**.
Cierto —cartera, asambleas, solicitudes— y la puerta no existía: en su lugar había una lista de
perfiles, que es un atajo de demostración y no una pantalla de producto.

Tres decisiones suyas la definieron:

1. **Se identifica con el documento.** Es lo que la administración ya tiene de cada propietario
   y no cambia cuando cambia el correo o el celular.
2. **Contraseña y, en un teléfono nuevo, además un código de un solo uso** (RN-54). Desde la
   app se paga plata; el segundo factor solo en dispositivo nuevo evita que el trámite estorbe
   todos los días.
3. **La cuenta nace vinculada** (RN-53): la administración registra la unidad y sus residentes
   (CU-A-02), y la persona **activa** su cuenta —no la crea—. Nadie entra a una copropiedad
   sin que la administración lo haya puesto ahí.

De ahí salieron tres pantallas: ingreso, activación en tres pasos (documento → código →
contraseña) y recuperación, que es el mismo trámite con otro texto. Todas con el degradado de
la marca: es la primera pantalla que ve alguien, y la única donde la marca se ve antes de que
empiece a leer datos.

**Lo que el demo no hace, y lo dice.** No guarda ninguna contraseña —ni cifrada ni en claro—,
acepta cualquiera con la longitud mínima, y el código se muestra en pantalla. Guardar
credenciales de mentira enseñaría la forma equivocada, y un código que nunca llega haría el
demo inmostrable. Cada pantalla lo advierte. ADR-0004 quedó actualizado con esa tabla.

El atajo de perfiles sigue, plegado debajo: hace falta para mostrar la consola del
administrador sin teclear cédulas. Ya no es la puerta.

**Y las torres del fondo también** (Mary): la puerta y el interior son el mismo edificio. Al
llevarlas allá se sacaron a `componentes/SiluetaTorres.tsx`: estaban dibujadas a mano dentro
del cascarón del residente, y un dibujo repetido en dos sitios se desincroniza el día que
alguien cambia uno.

Un efecto secundario que vale la pena: como el acceso arma la sesión desde la persona y su
residencia, **los doce residentes de la semilla pueden entrar con su documento**, no solo los
tres perfiles. El demo se siente menos maqueta.

---

### 2026-08-28 · Mary + IA (Claude) · El rol de portería, y Bre-B como medio de pago

**Se crea el rol de portería** (Mary). Salió de una pregunta suya: ¿quién debería registrar los
paquetes que llegan? El administrador no: el domiciliario llega a las siete de la noche o un
sábado, y un registro hecho al día siguiente pierde la hora real. Además **registrar es asumir
la custodia**, y el portero suele ser empleado de una empresa de vigilancia externa — con la
cuenta del administrador vería la cartera de todos.

De ahí salen tres cosas, y el orden importa porque **la app del propietario va primero** (Mary):

1. **El rol existe en el modelo:** `RolUsuario` ya admite `porteria`, y RN-52 dice qué puede
   hacer —correspondencia y validar visitantes— y qué no: cartera y PQRS, no.
2. **El hueco que la pregunta destapó, tapado:** `Correspondencia.registradoPor`. La entidad
   guardaba quién *retira* el paquete pero no quién lo *recibió* del mensajero. Si se pierde, el
   registro no decía quién lo tenía.
3. **La consola de la portería queda documentada, no construida** (CU-P-01, CU-P-02, ámbito
   nuevo `CU-P`). Se alcanzó a escribir y se dejó fuera al confirmar Mary el orden. Ahí queda
   dicho lo que falta decidir: la minuta, los turnos, si se registra el ingreso además de
   validarlo.

Vale anotar lo que CU-P-02 deja a la vista: **hoy nadie puede validar el código de un
visitante**. El residente lo genera (CU-R-10) y en la entrada no hay a quién presentárselo. Es
la mitad que le falta a un caso de uso que figura como ✅.

**Bre-B entra como medio de pago** (Mary). El sistema de pagos inmediatos del Banco de la
República: se paga con una llave desde el banco propio y llega al instante. Está en la pantalla
de pago del residente y en el registro manual del administrador. La opción lleva una línea que
explica qué es: es nuevo y un medio de pago que hay que adivinar no se usa. **Integrarlo de
verdad es decisión de fase 2**, como PSE: el demo lo simula.

**Cerrar sesión toma color** (Mary eligió entre dos propuestas): relleno azul suave de marca,
el mismo del avatar que está arriba en esa hoja, para que el bloque se lea como parte del
perfil. Ni violeta —el color de la acción principal, y salir no lo es— ni rojo, reservado para
la plata.

**Y tres defectos del revisor de ortografía.** Descartaba las líneas que contuvieran `id: '`, y
`{ id: 'pse', texto: 'PSE / debito a cuenta' }` lleva las dos cosas: el descarte se llevaba por
delante el texto visible. Así llevaban semanas «debito» y «credito» en la pantalla de pago.
Tampoco seguía los comentarios `/* … */` que no empiezan con `{`, ni descartaba las líneas de
una unión de tipos (`| 'mas'`). Corregidos los tres, y de paso entró `mas` → `más` al
diccionario: la forma sin tilde existe, pero equivale a «pero» y no aparece en una interfaz.
Salieron «la deuda mas antigua», «Que vas a pagar» y «Cuanto pesa tu voto».

---

### 2026-08-27 · Mary + IA (Claude) · Un destino, una identidad

Mary vio dos caminos al mismo sitio: el acceso directo del inicio y la pestaña de la barra.
Mi primera lectura fue quitar el acceso directo, y me corrigió: **no se elimina del inicio**.
Tenía razón, y la corrección afina la regla.

El problema no era que el destino apareciera dos veces —el acceso del inicio y la pestaña son
dos alcances distintos, la mano a lo de hoy y la navegación permanente—. El problema era que se
**veía** como dos destinos: el acceso llevaba el ícono de PQRS y caía en el segmento de PQRS,
mientras la pestaña llevaba la bandeja y caía en la vista. Dos dibujos y dos aterrizajes para
el mismo sitio.

**Ahora se repite entero:** mismo ícono, mismo nombre y mismo aterrizaje (`/app/solicitudes`).
Y el contador aparece **una sola vez**, en el acceso del inicio, junto a los de Visitantes y
Paquetes, que es donde se compara con ellos. Quedó escrito en las convenciones como «un
destino, una identidad».

De paso quedó nombrada una regla que no existía: `solicitudesEsperandoRespuesta()` en
`reglas.ts` suma la PQRS sin cerrar y la reserva sin aprobar, porque la persona las vive igual
—«pedí algo y no me han contestado»— aunque en el modelo sean dos entidades. El acceso directo
antes contaba solo las PQRS. El paz y salvo no cuenta: se emite solo, no lo aprueba nadie.

---

### 2026-08-27 · Mary + IA (Claude) · Asambleas en el menú y Solicitudes unificado

Tres pedidos de Mary sobre la barra inferior del residente, en orden:

1. **Asambleas entra al menú.** Es donde el copropietario decide, y no tenía pestaña.
2. **Reservas y PQRS se unifican en Solicitudes.** Son la misma acción vistas desde quien la
   hace: pedirle algo a la administración.
3. **Solicitudes son tres, no dos:** reservar zona común, radicar una PQRS y **generar el paz
   y salvo**.
4. **En asambleas se vota**, y vale para la ordinaria y para la extraordinaria.

La barra queda en cinco: Inicio · Cuenta · Solicitudes · Asambleas · Cartelera. Las rutas
viejas (`/app/reservas`, `/app/pqrs`) redirigen, por si alguien las dejó guardadas en la
pantalla de inicio del teléfono.

**Lo que se construyó de asambleas, y lo que no.** Entraron `Asamblea`, `PuntoOrdenDelDia`,
`Votacion` y `Voto`; el residente ve la citación y el orden del día (CU-R-20), vota los puntos
(CU-R-13) y ve el conteo por coeficiente. Quedaron fuera **a propósito** `Asistencia`, `Poder`
y el quórum: dependen de RN-28 y RN-30, que el equipo no ha confirmado (T-10, T-11).

De ahí la línea que se respetó en la pantalla: **la app cuenta los votos, pero no dice si el
punto se aprobó.** Contar por coeficiente es aritmética y ya está resuelto (RN-27); declarar
aprobado exige la mayoría exigida y el quórum de instalación, que es derecho y no se escribe de
memoria. La pantalla lo dice en voz alta en vez de inventarlo.

**Regla nueva: vota el propietario (RN-51).** Sale de la palabra que usó Mary. El arrendatario
usa la copropiedad pero no decide sobre ella: el voto va con la propiedad, igual que la cuota.
Falta definir el rol `autorizado` y el apoderado (CU-R-23). La comprobación quedó en el
repositorio y no solo en la pantalla, que es lo que pedía T-16: esconder un botón no es una
regla.

**Paz y salvo (CU-R-12), a medias y con la mitad que faltaba dicha.** Se implementó lo decidido
—RN-26 (saldo cero) y RN-36 (consecutivo)—: el certificado se emite, queda registrado y se ve
en pantalla. **Falta el PDF**, que es ADR-0006.

Y una pregunta que apareció construyéndolo, ya respondida: ¿«saldo cero» incluye la cuota del
periodo que aún no vence? **Sí, incluye lo ya facturado** (Mary, 2026-08-27). Estar sin mora no
basta: el certificado afirma que la unidad no debe nada, y lo facturado se debe. Como el caso
desconcierta —no estoy atrasado y aun así no puedo emitir—, la pantalla lo explica cuando el
saldo existe pero no hay nada vencido.

**De paso, la ortografía.** El revisor solo miraba las pantallas, no los datos de ejemplo —que
es justo lo que se lee en una demostración—. Se extendió a `semilla.ts` y aparecieron 78
palabras sin tilde («salon social», «orden del dia», «informe de gestion»). Se corrigieron
todas. Se le agregó además una comprobación nueva: **la pregunta se abre y se cierra**; cuatro
frases nuevas se habían escrito «Aprueba el presupuesto?». Lo que la herramienta no puede
decidir —`esta`/`está`, `cual`/`cuál`— se corrigió a mano, y queda dicho en las convenciones
que ahí no hay diccionario que valga.

---

### 2026-08-27 · Mary + IA (Claude) · Parametrizar la cartera, no cobrar caso por caso

Mary precisó la palabra: el administrador de la copropiedad es quien tiene el rol para
**parametrizar** las cuotas, las multas y los intereses. Vale la pena tomarla al pie de la
letra, porque separa dos actos que hasta ahora iban juntos en RN-49:

- **Parametrizar** es definir qué existe y cuánto vale —el valor de la ordinaria, el catálogo
  de multas, la tasa y si se cobra, los conceptos adicionales—. Es facultad exclusiva del
  administrador de esa copropiedad (RN-49).
- **Que el cobro caiga en una unidad** se sigue de esa parametrización y de su regla, no de una
  decisión caso por caso (RN-50, nueva). El interés lo liquida el sistema sobre lo vencido; la
  multa se escoge del catálogo y solo genera cuota cuando queda firme; la extraordinaria se
  traslada del acta.

El administrador **configura la regla; no toca el caso**. Eso es lo mismo que protege al
administrador cuando el copropietario reclama: el cobro no es una decisión suya sobre esa
unidad, es la regla vigente aplicada a todas.

**Y deja una frontera con nombre:** ¿puede ajustar el valor de una multa al imponerla? Si puede,
sí está decidiendo sobre el caso. Estaba marcado con **(?)** en el modelo; ahora se sabe por qué
importa. Sigue en §3 quater del levantamiento.

---

### 2026-08-27 · Mary + IA (Claude) · Cobrar es una facultad del administrador

Mary cerró quién origina un cobro: **solo el administrador, desde su perfil** (RN-49). Aplica a
todo lo que entra en la cartera —ordinaria, extraordinaria, multa, cobro adicional, interés—.
En la app del residente no hay ninguna acción que cree un cobro, y esa asimetría es
deliberada: quien debe el dinero no puede tocar lo que debe.

Con una precisión que ya había aparecido con la tasa de interés: es **el administrador de esa
copropiedad**, no cualquiera con perfil de administrador (RN-01).

**Y esto destapó una deuda concreta.** Hoy la regla vive solo en la interfaz: `App.tsx` protege
`/admin`, pero `generarCuotas()` en el repositorio **no recibe quién la llama ni lo comprueba**.
En el demo da igual —cada quien corre su copia—, pero es justo la clase de comprobación que no
puede quedarse en el cliente: con backend, el servidor tiene que verificar rol y copropiedad sin
confiar en que la petición venga de la consola. Anotado en T-16, que ya recogía «validar las
reglas en el repositorio y no solo en la UI»; ahora tiene un primer caso con nombre.

---

### 2026-08-27 · Mary + IA (Claude) · El respaldo se justifica, y la extraordinaria tiene destino

Cuatro precisiones de Mary que endurecieron el principio del respaldo, en orden:

**1. La extraordinaria siempre se aprueba en asamblea.** No admite la opción «reglamento» que
sí tienen las multas y la tasa: su respaldo es siempre un acta (RN-46).

**2. El respaldo se justifica por escrito.** Primero se planteó exigir el acta **adjunta**, y
Mary lo corrigió: en su lugar va una **casilla de justificación que alude al acta y a su
fecha** (RN-47). Sin ella el cobro no se crea, y el copropietario la lee desde su estado de
cuenta.

Vale dejar dicho el costo, porque la razón para adjuntar era buena: un acta citada a mano es
más débil que el documento —la fecha puede estar mal, o el acta puede no decir eso— y el
copropietario no puede verificarla solo. Se acepta a cambio de no meter en la fase 1 una
capacidad que la app no tiene: **almacenar archivos que suben los usuarios**. Cuando exista
(fase 2, ADR-0006), el adjunto **se suma** a la justificación; no la reemplaza, porque el texto
es lo que se lee de un vistazo.

**3. La extraordinaria tiene destinación específica.** La asamblea no aprueba «una
extraordinaria», aprueba una extraordinaria **para algo** (RN-48). Escribir otra cosa es cobrar
por algo que nadie votó.

**4. Y el concepto sí es texto libre.** Segunda corrección de Mary, sobre la conclusión que yo
había sacado del punto 3: el «para qué» puede ser un proyecto de mejora de zonas comunes,
reparar un daño del edificio, automatizar la entrada —no hay lista que las cubra—. El campo es
abierto; lo que no es discrecional es **el hecho** que describe. La distinción que importa: no
se restringe el formato del dato, se exige que corresponda a lo aprobado, y eso lo sostiene la
justificación del punto 2, no un menú desplegable.

**Dos consecuencias que exceden la cartera**

- **Recibir archivos sigue pendiente, ahora sin bloquear la fase 1.** No hay nada en el demo ni
  en el modelo que guarde un PDF subido por alguien: dónde viven, qué tamaño se admite, quién
  puede verlos. Queda anotado en ADR-0006, que hasta ahora solo trataba **generar** documentos.
  Generar un PDF y recibir uno son problemas distintos.
- **La destinación específica es dato contable.** Lo recaudado por una extraordinaria tiene que
  poder cruzarse con lo gastado en esa destinación, y eso vive en la aplicación contable de
  Jeimy. Es el primer caso concreto de lo que las dos apps tienen que intercambiar (T-17).

**El demo hoy incumple RN-46.** `CarteraPage` genera extraordinarias sin pedir acta, así que
CU-A-05 pasó de ✅ a 🟡.

---

### 2026-08-27 · Mary + IA (Claude) · El principio del respaldo

Mary precisó que **las multas solo se dan si están en el reglamento de copropiedad o fueron
aprobadas en asamblea**. Es la tercera vez que aparece la misma forma —ya había pasado con la
tasa de interés, y aplica igual a las cuotas extraordinarias—, así que se nombró como regla
transversal (RN-45) en vez de repetirla caso por caso:

> **Ningún cobro que no sea la cuota ordinaria puede existir sin apuntar a qué lo autoriza: el
> reglamento de la copropiedad o un acta de asamblea.**

En el modelo son siempre los mismos tres campos: `origen`, `actaId` y `referencia`. Los llevan
`TasaInteres` y `ConceptoSancion`.

**Y eso destapó un hueco que nadie había señalado:** `Cuota` **no los tiene**, así que una
cuota extraordinaria hoy se puede generar sin acta que la respalde. Una extraordinaria sin
respaldo es tan impugnable como una multa inventada. Queda en RN-45, pendiente.

La consecuencia práctica del principio: cuando un copropietario pregunte «¿por qué me cobran
esto?», el sistema siempre puede responder con un acta o un artículo, y no con un número
suelto.

---

### 2026-08-27 · Mary + IA (Claude) · Multas y cobros adicionales entran al alcance

Mary pidió que el administrador pueda cobrar **cuotas adicionales** y **multas**, y que dentro
de multas exista un subnivel para definir cuáles existen. Salió de una pregunta suya: dónde se
elige el concepto de un pago.

**Lo que la pregunta destapó.** El residente no elige concepto a propósito —RN-06 imputa a la
deuda más antigua—, pero al revisarlo apareció que `TipoCuota` ya contemplaba `interes` y
`sancion` y **nada en la app los generaba**. Eran valores muertos en el modelo.

**Lo documentado** — CU-A-22 (catálogo de multas), CU-A-23 (imponer una multa), CU-A-24 (cuota
adicional), más las entidades `ConceptoSancion` y `Sancion` y las reglas RN-38 a RN-41.
`TipoCuota` gana `'adicional'`.

Una decisión de modelado que evita trabajo: **una multa y un cobro adicional no son entidades
nuevas en la cartera, son `Cuota` con su tipo**. Así entran solos en el saldo, en la imputación
por antigüedad y en el estado de cuenta, sin tocar nada de eso.

**⚠️ CU-A-23 queda bloqueado, y no por falta de tiempo.** La Ley 675 de 2001 exige **debido
proceso** antes de sancionar: hay que oír al copropietario. Una app que imponga una multa de un
toque y la mande directo a la cartera puede producir **multas nulas** y demandas contra la
administración. Por eso `Sancion` se modeló con estados —propuesta, notificada, en descargos,
firme— y la cuota nace **solo cuando queda firme** (RN-39).

Cuántos estados hacen falta, quién impone, quién resuelve los descargos y con qué plazo **sale
del reglamento de la copropiedad**, no de un supuesto nuestro. Las preguntas quedaron en
[`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md) §3 quater.

**Qué sí se puede construir ya:** el catálogo (CU-A-22) y la cuota adicional (CU-A-24). Ninguno
tiene consecuencias jurídicas.

**El interés de mora, configurable por copropiedad**

Mary añadió: se calcula según la normativa vigente en Colombia, pero **cada copropiedad decide
si lo cobra**, porque no todas lo hacen. Eso cerró en parte una pregunta que estaba abierta
desde el arranque. Quedó como CU-A-25 y RN-42.

La parte técnica que obliga a decidir: **«normativa vigente» significa una tasa que cambia y
que fija una autoridad externa**, con un tope legal por encima del cual el cobro es usura. Un
número escrito en el código quedaría desactualizado y expondría a la copropiedad. Por eso la
tasa se modeló como `TasaInteres`, un dato **con vigencia y fuente** (RN-43), y no como una
constante.

**La ley pone el techo, la asamblea pone la tasa.** Mary precisó que, aunque hay una norma que
regula el interés de mora, **cada copropiedad tiene su propio reglamento y sus aprobaciones de
asamblea**. Eso cambió el modelo para mejor: `TasaInteres` no guarda solo un número, guarda
**qué lo autoriza** — el artículo del reglamento o el acta de la asamblea que lo aprobó. Y esa
referencia al acta **enlaza el módulo de cartera con el de asambleas** (CU-A-20).

Sin eso, un copropietario que pregunte «¿por qué me cobran este interés?» no tiene respuesta.
Con eso, la respuesta es un acta o un artículo.

**Quién mantiene la tasa: el administrador de cada copropiedad** (Mary, 2026-08-27). Eso tiene
una consecuencia de diseño: si la teclea una persona, se puede equivocar o dejarla vieja, y
cobrar por encima del tope es usura. Así que el sistema **rechaza una tasa sobre el tope legal
y avisa cuando la vigente está vencida** (RN-43). No evita el error, pero lo hace visible.

Lo que **no se escribió y no se debe escribir de memoria**: cuál es la tasa aplicable y su
tope. Eso hay que verificarlo en la ley, igual que el tope de poderes de asamblea — y ahora es
más urgente, porque el freno del sistema depende de conocer ese tope.

Con el interruptor y sin las respuestas se puede construir CU-A-25, pero no el cálculo.

---

### 2026-08-27 · Mary + IA (Claude) · Las tildes, y una herramienta para no perderlas

Mary: «cuidado con el tema de la ortografía, dice mucho de la calidad de una aplicación».
Tenía razón y el alcance era mayor de lo que parecía: **toda la interfaz estaba escrita sin
tildes**, no solo la palabra que señaló.

**Por qué no bastaba arreglarlo a mano.** La primera pasada dejó fuera frases que estaban
solas en su línea, sin etiquetas alrededor —«Generar codigo de acceso» entre ellas—. Por eso
se hizo `herramientas/revisar-ortografia.py`, que recorre el texto visible y falla si encuentra
algo. Entra en la definición de "terminado".

**Lo difícil no era encontrar, era no dañar.** El detector marcaba de entrada
`sesion!.personaId`, `telefono: ''` y `descripcion?: string`, que son código. Y marcaba
`autor: 'administracion'`, que es el **valor del dominio** que distingue quién escribió un
mensaje: con tilde se rompería la comparación. La regla que los separa quedó escrita en las
convenciones y dentro de la herramienta:

> Una etiqueta visible nunca es una sola palabra en minúscula.

Con eso, `texto: 'Peticion'` se corrige y `id: 'peticion'` se respeta.

---

### 2026-08-27 · Mary + IA (Claude) · El botón de confirmar quedaba bajo la barra

**El síntoma.** Al abrir el modal para radicar una PQRS o autorizar un visitante, el botón de
confirmar aparecía **partido por la barra inferior**. Y no era solo visual:
`document.elementFromPoint` en el centro del botón devolvía la barra, así que **el botón no
recibía el toque**.

**La causa fue un efecto colateral del degradado.** Para poner el contenido sobre la zona de
marca se le había dado `z-index: 1` a `.contenido-movil`. Eso **crea un contexto de
apilamiento**, y los modales de las pantallas viven dentro de ese contenedor: su `z-index: 60`
dejó de competir con la barra inferior (30) y pasó a competir solo dentro de la caja. La barra
ganaba.

Se quitó el `z-index`. `position: relative` sin `z-index` basta para quedar sobre la zona de
marca, porque entre elementos posicionados sin `z-index` decide el orden del DOM — y no crea
contexto de apilamiento.

De paso, el fondo del modal descuenta `env(safe-area-inset-bottom)`: sin eso, en un teléfono
con muesca el botón queda pegado al borde y encima del indicador del sistema.

**La lección, que vale para lo que viene:** `z-index` no es un número global. Cada
`position` + `z-index` encierra a sus hijos. Antes de poner uno, hay que preguntarse qué queda
atrapado dentro — aquí quedaron atrapados todos los modales de las pantallas.

---

### 2026-08-27 · Mary + IA (Claude) · Dos ajustes de texto

**Un solo nombre para el mismo número.** El inicio decía «Valor adeudado» y el estado de
cuenta «Saldo total», del mismo dato y para la misma persona. Ahora los dos dicen **«Valor
adeudado»**. «Saldo» se queda en la consola del administrador, donde quien lee es contable, y
en el código (`calcularSaldo`, RN-03): el nombre del dominio no cambia, cambia lo que lee la
persona.

**Fuera el título repetido.** En Zonas comunes la barra superior decía «Zonas comunes» y justo
debajo el título de sección lo repetía. Se eliminó el segundo.

---

### 2026-08-27 · Mary + IA (Claude) · Decisión final: degradado completo y acción en violeta

Mary eligió, viendo las versiones renderizadas: **el degradado cubre el fondo de toda la app
del residente**, fijo a la pantalla, y **el color de acción es un violeta tomado del propio
degradado** (`#812485`, al 60 % del recorrido).

Se había propuesto lo contrario —volver a una banda— con el argumento de que el degradado a
pantalla completa no dejaba trabajar a los demás colores. El argumento era correcto en los
hechos y equivocado en la conclusión: **los cinco problemas ya estaban resueltos** uno por uno,
así que el costo estaba pagado. La decisión era de producto, no técnica. La banda se revirtió.

**Dos cosas que el violeta obligó a resolver**

1. **El chip del filtro puede disolverse en el fondo.** El violeta sale del degradado, así que
   en algún punto del scroll coincide con él. El filtro elegido lleva ahora un **filo claro**
   que lo despega siempre. Regla general: todo control apoyado directamente sobre el
   degradado, sin tarjeta debajo, necesita ese filo.
2. **La puerta del logotipo perdió su brillo.** Usaba `--color-acento`, así que se volvió
   violeta y se apagó contra el azul. Pasa a `--color-marca-claro` —el fucsia del extremo del
   degradado—: **el logotipo no es un control** y no debe cambiar si mañana cambia el color de
   los botones.

---

### 2026-08-27 · Mary + IA (Claude) · El inicio deja de ser cajas blancas

**El diagnóstico**

Mary: «el inicio está muy básico, queremos una app que tenga también una marca». Lo que lo
hacía verse básico no era la falta de color: era que **todo pesaba igual**. Barra, saldo,
accesos y secciones eran bloques del mismo tamaño apilados, y las cuatro tarjetas eran
rectángulos blancos idénticos que se leían como una sola mancha.

**Zona de marca**

El encabezado y el saldo dejan de ser dos bloques y pasan a ser uno: el degradado ocupa el
tercio superior, con borde inferior curvo para que lea como un techo sobre el contenido. El
monto va directo sobre el degradado y los accesos flotan montados sobre el borde. Detrás, una
**silueta de torres** al 9 % de opacidad, con el mismo trazo del logotipo: es la copropiedad,
no una textura cualquiera.

En el inicio la barra pierde su fondo y **deja de ser pegajosa a propósito**: transparente y
pegajosa dejaría pasar el contenido por debajo.

El chip rojo de mora no se lee sobre el fucsia, así que en la zona de marca la alarma la da el
contraste —blanco translúcido— y no el tono.

**Cada sección con su carácter**

| Sección | Tratamiento | Por qué |
|---|---|---|
| Comunicado | Borde azul a la izquierda | Es texto editorial; un icono competiría con el chip de categoría |
| Tu unidad | Distintivo en azul suave | |
| Próxima reserva | **Bloque de calendario** (2 · SEP) | Una reserva es una fecha, y así se reconoce sin leer |
| Portería | **Superficie fucsia** | El fucsia significa acción en toda la app: algo te espera y no lo has resuelto |

Y los encabezados dejaron de ser todos la misma etiqueta gris en mayúsculas: ahora el título
tiene peso y, donde hay más que ver, la acción vive en el encabezado («Ver cartelera»).

**El degradado pasa a cubrir toda la vista, fijo a la pantalla**

Mary quiso probar el degradado en toda la pantalla y no solo en el tercio superior. Se probó
la versión directa —el degradado estirado con el alto del contenido— y **se descartó**: el
color de cada punto acababa dependiendo de cuántos datos tuviera la persona. Con tres
comunicados y dos reservas, la misma zona de la pantalla sería de otro color, y la marca
dejaría de ser una constante.

La versión que quedó fija el degradado **a la pantalla, no al contenido** (`position: fixed`
limitado al ancho de la columna móvil), y el contenido pasa por encima al desplazarse.

Cubrir todo el fondo cuesta dos señales, y las dos se recuperaron en otro soporte:

| Señal perdida | Cómo se recuperó |
|---|---|
| «Ver cartelera» era azul y por eso se leía como tocable; en blanco plano se confundía con el título | Pasa a una pastilla translúcida |
| La portería avisaba con superficie fucsia, que sobre fondo fucsia desaparece | Avisa con un filo fucsia a la izquierda, igual que el comunicado con el suyo |

El texto blanco se midió en todo el recorrido del degradado: 12,2:1 en el extremo azul, 9,2:1
a la mitad y 5,4:1 en el fucsia. Pasa AA en los tres puntos.

**El degradado pasa a todas las vistas del residente**

Ya no es solo el inicio: el degradado fijo es el fondo de toda la app del residente. Eso obligó
a dos correcciones:

- Los textos que van **sueltos, sin tarjeta** —títulos de sección en mayúsculas, párrafos de
  ayuda— estaban en gris oscuro y quedaban ilegibles sobre el color. Pasan a blanco.
- **La alerta de mora parecía un enlace.** Era una pastilla translúcida, idéntica a las de
  «Ver cartelera» y «Ver reservas», que son navegación. El dato más alarmante de la app
  —«$ 4.119.500 vencido · 78 días de mora»— estaba vestido de control. Ahora es una pastilla
  **blanca sólida con el rojo dentro**: el blanco le devuelve al rojo un fondo donde se lee, y
  la solidez la distingue de los controles translúcidos.

Esto último es la misma lección de ayer con el botón de cerrar sesión, al revés: allá se usó
el rojo donde no correspondía, aquí se le quitó el soporte donde sí hacía falta.

**El botón primario pasa al color de acción**

El azul marino de los botones se enturbiaba sobre el degradado. Pero el problema de fondo era
otro: **la regla decía una cosa y el código hacía la contraria.** El fucsia estaba definido
como «lo que puedes hacer» y todas las acciones de la app —pagar, reservar, radicar,
autorizar— usaban el azul, que es el color de «dónde estás».

La prueba estaba en el CSS: **`.boton--acento` existía con el estilo fucsia y no lo usaba
ninguna pantalla.** El color de acción estaba definido y muerto.

Ahora `.boton--primario` es fucsia y `.boton--acento` se eliminó, porque pasaron a ser lo
mismo. Texto blanco sobre el botón: 5,37:1, y 7,20:1 presionado.

El **filtro elegido** siguió el mismo camino, por la misma razón. Eso dejó dibujada la línea
entre los dos colores, que quedó escrita en las convenciones: **lo que se navega es azul
—la pestaña activa, la barra, el lateral— y lo que se acciona es fucsia.** Un filtro no es un
sitio donde estás, es un control que tocaste.

**La parte blanca**

Las tarjetas tenían filete de 1 px más una sombra apenas visible, y esa combinación es la que
las hacía ver de maqueta. Perdieron el filete, se apoyan solo en la sombra y el fondo se
profundizó de `#f5f5fb` a `#eceef7` para que se despeguen.

> ⚠️ **Al oscurecer el fondo, `--color-texto-tenue` se cayó del contraste AA** (bajó a
> 4,41:1). Hubo que oscurecerlo con él, a 4,62:1. **Los grises van amarrados al fondo:** si se
> vuelve a tocar `--color-fondo`, hay que volver a medirlos.

**Tres defectos encontrados al verificar**

1. **Texto centrado en las tarjetas.** `.fila` reparte con `space-between`, así que separaba
   el distintivo del contenido. Se creó `.tarjeta__cuerpo`. Regla: **`.fila` es para repartir,
   no para agrupar.**
2. **El hueco inferior no descontaba la safe-area**, que la barra inferior sí suma a su alto.
3. Un tercer «defecto» resultó no serlo: en capturas con `fullPage` la barra inferior aparece
   cortando el contenido, porque es `position: fixed`. En la app no ocurre.

---

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
