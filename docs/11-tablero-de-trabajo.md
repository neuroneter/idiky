# 11 — Tablero de trabajo

Estado de las tareas en curso. **Esta tabla se actualiza en cada sesión de trabajo**; es lo
primero que mira quien llega a retomar algo.

Estados: `📋 Por hacer` · `🔨 En curso` · `👀 En revisión` · `✅ Hecho` · `⛔ Bloqueado`

---

## 0. Rangos de identificadores reservados

Para no volver a renumerar (pasó el 2026-09-10 con Jeimy y el 2026-09-21 con Mary): **cada
quien numera dentro de su rango** y, al agotarlo, pide el siguiente aquí. Los máximos hoy en
`main`: RN-97, CU-R-31, CU-A-27, CU-P-03, T-44, ADR-0012.

| Quién | Reglas (RN) | Casos de uso | Tareas (T) | ADR |
|---|---|---|---|---|
| Mary (ALICE / PWA) | RN-98 … RN-129 (agotado) · **RN-210 … RN-239** (desde 2026-10-02, para T-46 y CU-A-18) | CU-R-32 … CU-R-49 · CU-A-28 … CU-A-39 | T-45 … T-59 | Se piden al integrador |
| Jeimy (contable) | RN-130 … RN-159 | CU-A-40 … CU-A-49 | T-60 … T-74 | Se piden al integrador |
| Integración (infra, BOB, BLOKY) | RN-160 … RN-189 (usadas: RN-160…167) | CU-S-10 … CU-S-29 · CU-P-04 … CU-P-09 · **CU-B-01 … CU-B-49** (BLOKY, usado: CU-B-01) | T-75 … T-89 (usados: T-75…T-82) | ADR-0013 en adelante (usados: 0013…0016, 0018 y 0020; **reservados: 0017 Google Maps y 0019 archivos en R2** —la bitácora del 2026-09-21 los anunció como 0016 y 0017, pero el 0016 lo tomó Jitsi—) |
| Justo (APP / ALICE, `App-Idiky`) | RN-190 … RN-209 | Los CU los definen Mary y Jeimy; Justo los implementa | T-90 … T-104 | Se piden al integrador |

## Ahora — antes de seguir construyendo

| # | Tarea | Responsable | Estado | Notas |
|---|---|---|---|---|
| T-01 | **Completar el levantamiento de requisitos** con el equipo | Los tres | 🔨 En curso | El alcance funcional quedó declarado ([§0](./12-levantamiento-pendiente.md)). **Faltan §3 bis (asambleas) y §3 ter (documentos)**, que bloquean el diseño |
| T-02 | Validar/ajustar los casos de uso ya documentados | Los tres | 🔨 En curso | Catálogo actualizado con 12 CU nuevos. Falta que el equipo los revise |
| T-03 | Confirmar la asignación de zonas del equipo | Los tres | 📋 Por hacer | Tabla §1 de [`10-equipo-y-orquestacion.md`](./10-equipo-y-orquestacion.md). **Mary indicó que trabajará en la app móvil**, hoy asignada a Jeimy |
| T-04 | Recorrer el demo v0.1 y anotar observaciones | Los tres | 📋 Por hacer | Cada quien anota en la bitácora qué sobra, qué falta y qué está mal planteado |
| T-10 | **Responder las preguntas de asamblea** (§3 bis) | Los tres | 🟡 A medias (2026-09-10) | Quórum, mayorías, poderes y acta **están construidos y verificados** contra la Ley 675 (RN-28, RN-74, RN-30, RN-92, RN-94), y la pantalla ya dice si un punto se aprobó, citando el artículo. El término de la comisión quedó resuelto el 2026-09-17: lo fija el administrador (RN-95). Queda **una** del reglamento —el tope de poderes— y una para el abogado —la mixta con mayoría calificada— |
| T-11 | ~~**Confirmar el tope legal de poderes** (Ley 675 de 2001)~~ | Los tres | ✅ Hecho (2026-09-10) | Se leyó el artículo, y el resultado fue **que no hay tope legal que citar**: la Ley 675 no fija ninguno. Lo puede fijar el reglamento. RN-30 muestra el acumulado por apoderado y **no rechaza a nadie** |
| T-12 | **Decidir si visitantes, correspondencia y cartelera siguen** | Los tres | 📋 Por hacer | Están implementados pero nadie los mencionó en el alcance |
| T-13 | **ADR-0006 — cómo se generan los PDF** | Daniel | ✅ Hecho | Escrito el 2026-08-28. Los cinco documentos quedan bloqueados por el backend (ADR-0008), no por la decisión |
| T-14 | ~~ADR-0007 — proveedor de transmisión en vivo~~ | Daniel | ✅ Hecho (2026-09-10) | **No hay proveedor que elegir**: se enlaza Zoom/Meet. El costo por minuto desaparece. **2026-09-28:** Vimeo entra como opción con su salvedad (RN-98) y la grabación quedó resuelta como soporte del acta (RN-99) |
| T-15 | Corregir los bugs del demo detectados en la revisión | Zona A / D | ✅ Hecho | Zona horaria, íconos PWA, vigencia del visitante y doble toque. Ver bitácora del 2026-08-26 |
| T-17 | **Definir qué se intercambia con la app contable de Jeimy** | Mary + Jeimy | 📋 Por hacer | La destinación específica de una extraordinaria (RN-48) es dato contable: lo recaudado tiene que poder cruzarse con lo gastado en esa destinación |
| T-18 | **Cómo se envía el código de un solo uso** (SMS, WhatsApp o correo) y con qué proveedor | Daniel | 📋 Por hacer | Sale del flujo de acceso decidido el 2026-08-28 y **rehecho el 2026-10-01: sin clave, solo código por SMS o correo** (RN-54), así que este proveedor pasa a ser la puerta entera. Tiene costo por mensaje y afecta el ADR de backend |
| T-19 | **Consola de portería** (CU-P-01, CU-P-02) | Jeimy | 🟡 A medias | Construida el 2026-08-28: turno, visitantes y correspondencia. **Falta la minuta**, que espera las respuestas de T-08 |
| T-75 | **BLOKY Dev, primer módulo: el ingreso** (CU-B-01). App `apps/bloky/` + API `apps/bloky-api/` + pod `idiky-bloky` (8083). Construido y probado en local, y **desplegado y probado en el servidor contra el BOB real** el 2026-09-21 (commit `dfc061e`; ver la bitácora de ese día) | Responsable de integración | ✅ Hecho (2026-09-21) | Pendiente aparte: regenerar el token «bloky-api» en BOB (se compartió por chat) y redesplegar `bloky`. Google y Microsoft esperan credenciales y HTTPS (ADR-0008) |
| T-76 | **HTTPS y dominio para BLOKY Dev** (`https://bloky-dev.idiky.com`) con un túnel de Cloudflare ([ADR-0014](./adr/0014-https-para-bloky-dev-con-tunel-de-cloudflare.md)); es lo que enciende el ingreso con Google y Microsoft (CU-B-01). **Desplegado el 2026-09-21:** DNS en Cloudflare, túnel `idiky-dev` sano, `https://bloky-dev.idiky.com` responde con certificado y `BLOKY_URL_PUBLICA` ya apunta ahí. Aplicaciones de Google y Microsoft registradas y cargadas; **los tres canales probados con cuentas reales** (2026-09-21). Pendiente de higiene: regenerar los dos secretos; el de Microsoft vence en 2028-09 | Responsable de integración | ✅ Hecho (2026-09-21) | Sin acceso a Azure: todo se resuelve en GoDaddy y Cloudflare |
| T-78 | **Jitsi para las asambleas virtuales** ([ADR-0016](./adr/0016-jitsi-propio-para-las-asambleas-virtuales.md)): servicio `jitsi` en `infra/jitsi/` (repo `Jitsi-Streaming-Idiky` desde el 2026-10-02), pod de cinco contenedores en el 8085 y `10000/udp`. **Escrito y registrado el 2026-09-26, sin desplegar.** Bloqueado por tres cosas, en este orden: **1)** una **regla `10000/udp` en el grupo de seguridad de red de Azure**, que el equipo no puede crear (ADR-0014); **2)** la **decisión de fondo**: por qué Jitsi propio y no el enlace a Zoom o Meet que decidió ADR-0007; **3)** el **disco**, que queda en el mínimo de 3 GB tras traer las imágenes | Responsable de integración | 🟡 Desplegado (2026-10-02) | **La regla `Dev-Udp` (10000/udp) ya existe en Azure.** Jitsi está publicado (`52c913f.jitsi-8d1a8c7`): videobridge sano, `10000/udp` escuchando, `http://<ip>:8085` responde. **`https://jitsi-dev.idiky.com` responde** (ruta del túnel `idiky-dev` → `http://10.0.2.2:8085`, con WebSocket 101) y **la cuenta `daniel` existe**. Falta: una reunión de prueba con dos personas y video real, y la decisión de fondo frente a ADR-0007 (ADR-0016 sigue en Propuesta). Integrarlo en BLOKY es otro CU |
| T-79 | **Un repositorio por sistema** ([ADR-0018](./adr/0018-un-repositorio-por-sistema-e-idiky-como-arnes.md), [`16`](./16-mapa-de-repositorios.md)): BLOKY, BOB y Jitsi mudados a `Bloky-Idiky`, `BOB-Idiky` y `Jitsi-Streaming-Idiky` con las mismas rutas (BLOKY y BOB con su historial); `desplegar.sh` trae el `origin/main` de cada uno. Probado sin servidor: la carpeta que llega es idéntica a la de antes. Cada repo tiene un `CLAUDE.md` que manda a leer `idiky` | Responsable de integración | ✅ Hecho (2026-10-02) | **Desplegados desde sus repos:** `bloky` `e71c429.bloky-5766873` y `gestion` `e71c429.gestion-bf7c9a6`, los dos sanos; `https://bloky-dev.idiky.com` responde. En el camino: archivos `._` de macOS (corregido en `desplegar.sh`) y falta de disco (Daniel limpió las imágenes sin uso). LangFlow verificado igual en cada paso |
| T-80 | **ADR de ALICE en Flutter** (`App-Idiky`). ADR-0001 y ADR-0002 dicen React + Capacitor para la app del residente; ALICE ya arrancó en Flutter sin ADR. Hay que escribir el porqué y marcar lo que reemplaza | Responsable de integración | 📋 Por hacer | El README de `App-Idiky` ya explica alcance y CU; falta la decisión |
| T-81 | **ADR de los contratos inteligentes** (`SmartContrat-Idiky`): login ERC-4337 sobre Polygon, Idiky paga el gas, doble firma para salir. Ningún documento de `idiky` lo registra, y ningún caso de uso lo pide todavía: su propio README dice que un contrato nace de un CU | Responsable de integración | 📋 Por hacer | Incluye decidir qué CU lo justifica (¿CU-R-01, el acceso?) |
| T-82 | **Reglas de trabajo** ([`17`](./17-reglas-de-trabajo.md)): Mary y Jeimy en `idiky` con su rama y merge a `main` al terminar; Justo (APP) y Daniel (BLOKY) con Git Flow. Hecho: `CLAUDE.md` §5, el aviso de inicio de sesión de `idiky` (avisa si se está en `main`), y en los cinco repos de desarrollo la rama `develop`, la sección Git Flow del `CLAUDE.md` y su propio aviso de rama | Responsable de integración | ✅ Hecho (2026-10-02) | Falta: dar a Justo acceso a los repos y que elija su rama de trabajo; decidir si `develop` pasa a ser la rama por defecto en GitHub |
| T-77 | **La capa de datos de BLOKY** ([ADR-0015](./adr/0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md)): catálogo de copropiedades, un esquema por copropiedad, `repositorio.para()`, migraciones por copropiedad, API de administración (aprovisionar · respaldar · retirar · eliminar con código) y el botón «Aprovisionar en BLOKY» en BOB. Se construye con el primer módulo de datos (estructura y unidades). Superadministrador = rol Super Admin de BOB; retención del respaldo a elegir (6 m, 1 a, 2 a); migraciones versionadas por esquema con *expandir y contraer* | Responsable de integración | ⬜ Pendiente | Diseño cerrado el 2026-09-21 |
| T-43 | **Mary trae `main` a su rama** (`git merge origin/main` en `claude/repository-review-c0p1wd`) y verifica asambleas y registros sobre la semilla 22 | Mary | ✅ Hecho (2026-10-02) | La rama de Mary trajo `main` y se integró por la solicitud #3 (`bf05bc6`). Desde ahora el aviso de inicio de sesión y `docs/17` hacen que cada sesión empiece trayendo `main` |
| T-42 | **Dónde viven las suites de Playwright** — **decidido** ([ADR-0020](./adr/0020-pruebas-de-navegador-de-la-pwa.md)): `apps/pwa/pruebas/navegador/`, Playwright Test, `npm run probar:navegador`, reloj fijo (`pruebas/navegador/base.ts`). **Mary trajo sus suites el 2026-10-02**: `reservas.spec.ts` (12), `usuarios.spec.ts` (11), `cartera.spec.ts` (2) y `pantallas.spec.ts` (las 36 pantallas), más el `humo.spec.ts` de Daniel: **30 pruebas en verde en 1,9 min**, con «autocierre» y «seis» ya independientes de la hora | Daniel → Mary | ✅ Hecho (2026-10-02) | Las once suites de asambleas eran de sesiones anteriores y ya no existen: se reescriben cuando se toque asambleas (CU-A-18, T-46) |
| T-16 | Saldar las tres deudas de arquitectura | Daniel (zona C) | 📋 Por hacer | Validar las reglas en el repositorio y no solo en la UI —**empezando por RN-49: `generarCuotas()` no comprueba quién la llama**— · usar `imputarPago()` en vez de reimplementarlo · RN-22 debe filtrar por copropiedad |

## Siguiente — cuando T-01 esté cerrado

| # | Tarea | Responsable sugerido | Estado |
|---|---|---|---|
| T-05 | Ajustar el modelo de datos al alcance real | Daniel | 📋 Por hacer |
| T-06 | ~~Decidir el stack de backend (ADR-0008)~~ | Daniel | ✅ Hecho (2026-09-21) — API propia de BLOKY, ver T-75 |
| T-07 | Documentar los casos de uso de asambleas — **hecho, ver CU-R-13, CU-R-20…24 y CU-A-12, CU-A-17…21** | Mary | ✅ Hecho |
| T-08 | Documentar el módulo de portería (minuta, validación de visitantes) | Jeimy | 🔨 En curso |
| T-09 | Definir la identidad visual real (colores, logo, tipografía) | Zona D | ✅ Hecho |
| T-22 | ~~Definir qué información intercambian la PWA y la contable~~ — **es la misma tarea que T-17**; se lleva allí | Jeimy + Mary | 📋 Por hacer |
| T-23 | Resto de la contable: proveedores, presupuesto anual, saldos de apertura de caja | Jeimy | 📋 Por hacer |
| T-27 | **Que el contador de la copropiedad valide los códigos del PUC** | Jeimy | 📋 Por hacer |
| T-29 | Crear y editar tipos de comprobante desde la pantalla (hoy solo se ven y se usan) | Jeimy | 📋 Por hacer |
| T-31 | Declarar y pagar a la DIAN las retenciones acumuladas en 2365 y 2368 | Jeimy | 📋 Por hacer |
| T-33 | **Validar la cartera integrada en la PWA**: paz y salvo, sanciones y abonos parciales sobre el modelo de `saldo` por cuota (RN-75 a RN-79) | Mary + Jeimy | 📋 Por hacer |
| T-34 | Unificar las dos herramientas de empaquetado del demo (`empaquetar-demo.py` y `empaquetar.mjs`) en una sola | Zona D | 📋 Por hacer |
| T-35 | **Despliegue de infraestructura**: entorno, dominio y pipeline para publicar la PWA y la contable. **El entorno de desarrollo ya existe** (2026-09-10, [ADR-0011](./adr/0011-entorno-de-desarrollo-en-contenedores.md), [`infra/`](../infra/README.md)); abierto al equipo con clave, por HTTP. **Cada quien despliega lo suyo desde `main`** ([`infra/guia-de-despliegue.md`](../infra/guia-de-despliegue.md)): Mary su maqueta, Jeimy la suya, BOB solo integración. Faltan HTTPS y dominio, y el pipeline | Responsable de integración | 🔨 En curso |
| T-46 | **El poder dado desde la app lo aprueba el apoderado y lo recibe la administración** (Mary, 2026-10-02: *«si es usuario de Idiky lo debería aprobar y la administración debe darlo como recibido»*). Si el apoderado usa Idiky, lo aprueba en su app; la administración lo da por recibido en la consola; si el apoderado no usa Idiky, basta con que la administración lo reciba. A los dos les llega un aviso. Mientras falte un paso, vota el propietario (como RN-96). Cambia CU-R-23 y CU-A-19. **Necesita regla nueva: espera el rango de Daniel**; se construye junto con CU-A-18 | Mary | 📋 Por hacer |
| T-45 | **Llevar a BLOKY las reservas y las zonas comunes, con el informe de uso en la consola del administrador** (Mary, 2026-10-01). El informe (CU-A-30) es trabajo de escritorio del administrador: se ve y se **descarga para Excel en la versión web**, y en BLOKY debe vivir en su consola. Lo que hay que llevar está en la maqueta: CU-A-06, CU-A-10, CU-A-29, CU-A-30, CU-S-03 y RN-104 a RN-126. Los procesos que el demo hace al abrir la app (vencer solicitudes, recordatorios: `aplicarProcesosDelSistema`) los hará allá un proceso del servidor a su hora | Mary + responsable de integración | 📋 Por hacer |
| T-37 | **BOB, el back office de IDIKY** (la administración de la empresa, no de las copropiedades): Strapi 5 + PostgreSQL 17 en `apps/gestion/` ([ADR-0012](./adr/0012-sistema-de-gestion-strapi.md)). **Instalado en el entorno el 2026-09-10**: pod en 8082 abierto al equipo, superadministrador creado, respaldo diario y **el panel con la marca de IDIKY**. **Primeras entidades construidas el 2026-09-10**: copropiedades, personas, asignaciones de Administrador y Delegado, planes, servicios adicionales, contrataciones y solicitudes, con sus reglas en el servidor ([docs/13 §8](./13-bob-copropiedades-y-contratos.md)). Faltan el responsable y el disco de datos | Por definir | 🔨 En curso |
| T-38 | **Módulo de auditoría del sistema de gestión**: quién cambió qué, cuándo y cómo estaba antes. Strapi Community no lo trae; se construye (ADR-0012) | Por definir | 📋 Por hacer |
| T-39 | **Refinar cómo entra una copropiedad a BOB**: planes y contrato, perfiles raíz (Administrador y Delegado), ficha, ubicación, jerarquía e ingreso a BLOKY ([`13-bob-copropiedades-y-contratos.md`](./13-bob-copropiedades-y-contratos.md)). Faltan dos choques con reglas existentes, IVA, renovación y bordes del prorrateo | Responsable de integración | 🔨 En curso |

## Hecho

| # | Tarea | Estado |
|---|---|---|
| T-00 | Estructura del repositorio, documentación base y demo PWA v0.1 | ✅ Hecho |
| T-36 | **Integración de las ramas de Mary y Jeimy** en una sola, con la numeración unificada (2026-09-10) | ✅ Hecho |
| T-44 | **Segunda integración** (2026-09-21): la infraestructura (Podman, BOB) y los 7 commits de Mary del 10 al 17 entran a `main`, con su numeración corrida a RN-92…97 y CU-R-31 | ✅ Hecho |
| T-20 | Módulos de cartera y pagos con abonos parciales y recibos de caja (CU-R-30, CU-A-27) | ✅ Hecho |
| T-21 | Aplicación contable: cartera, pagos y recibos de caja sin compilación (ADR-0010) | ✅ Hecho |
| T-24 | Contable: gastos, movimientos por cliente, estado de resultados y situación financiera | ✅ Hecho |
| T-26 | Contable: partida doble, plan de cuentas y comprobantes de ajuste | ✅ Hecho |
| T-25 | Contable: PUC colombiano editable, con la cuenta guardada en cada documento | ✅ Hecho |
| T-28 | Contable: los cinco niveles del PUC y alta de cuentas en cascada | ✅ Hecho |
| T-30 | Contable: tipos de comprobante con su asiento, para que el administrador no elija cuentas | ✅ Hecho |
| T-32 | Contable: módulo de pagos a proveedores con egresos, retenciones y directorio | ✅ Hecho |
| T-40 | Contable: menú de ocho entradas a tres, agrupadas por tarea en un módulo de Contabilidad | ✅ Hecho |
| T-41 | Contable: guía de despliegue en el servidor de desarrollo ([`14`](./14-despliegue-de-la-contable.md)) | ✅ Hecho |

---

## Cómo usar este tablero

- Al **empezar** una tarea: pon tu nombre y cámbiala a `🔨 En curso`.
- Al **subir el PR**: `👀 En revisión`.
- Al **integrar**: `✅ Hecho` y muévela a la sección "Hecho".
- Si te **bloqueas**: `⛔ Bloqueado` + una nota de qué necesitas y de quién.
- **No borres tareas**, muévelas. El historial de lo que se hizo es información valiosa.
