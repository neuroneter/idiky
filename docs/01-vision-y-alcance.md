# 01 — Visión y alcance

## 1. El problema

La administración de propiedad horizontal (PH) en Latinoamérica se sigue gestionando con
herramientas dispersas: grupos de WhatsApp para comunicados, hojas de cálculo para la
cartera, cuadernos físicos para minutas de portería y correspondencia, y llamadas
telefónicas para reservar el salón comunal.

Esto produce tres dolores concretos:

| Dolor | Consecuencia |
|---|---|
| **Falta de trazabilidad** | Nadie sabe quién autorizó a un visitante, quién aprobó una reserva o cuándo se entregó un paquete. |
| **Cartera opaca** | El residente no sabe cuánto debe ni por qué; el administrador persigue la cobranza manualmente. |
| **Comunicación informal** | Los comunicados se pierden en chats; las asambleas carecen de quórum verificable. |

## 2. La propuesta

Una plataforma con **dos caras sobre un mismo núcleo de datos**:

```
                       ┌───────────────────────────┐
   Residente /         │                           │        Administrador /
   Copropietario ─────▶│      NÚCLEO IDIKY         │◀────── Consejo / Portería
   (app móvil, PWA)    │  (datos + reglas de PH)   │        (consola web)
                       └───────────────────────────┘
```

- **App móvil (PWA → Android → iOS):** autogestión del residente. Consultar su estado de
  cuenta, pagar, reservar zonas comunes, radicar PQRS, autorizar visitantes, leer
  comunicados y votar en asambleas.
- **Consola de administración (web):** operación del conjunto. Unidades y residentes,
  generación y recaudo de cuotas, aprobación de reservas, gestión de PQRS, publicación de
  comunicados, correspondencia y asambleas.

## 3. Objetivos del producto

| # | Objetivo | Cómo se mide |
|---|---|---|
| O1 | Que el residente resuelva sin llamar a la administración | % de trámites iniciados en la app |
| O2 | Reducir la mora de la copropiedad | Días de cartera / % de mora |
| O3 | Dejar trazabilidad de toda decisión y trámite | Todo evento tiene autor y fecha |
| O4 | Que un administrador opere varios conjuntos desde un solo lugar | Nº de copropiedades por administrador |

## 4. Alcance

### 4.1 Dentro del alcance (producto completo)

- Gestión de copropiedades, torres/bloques y unidades privadas.
- Directorio de propietarios, residentes/arrendatarios y vehículos.
- Cartera: presupuesto, cuotas ordinarias y extraordinarias, intereses de mora, recibos.
- Pagos en línea (pasarela) y registro de pagos manuales.
- Reserva de zonas comunes con reglas (cupos, horarios, depósitos, sanciones).
- PQRS con SLA y trazabilidad.
- Comunicados y cartelera digital.
- Correspondencia y minuta de portería.
- Autorización de visitantes con código QR.
- Asambleas: convocatoria y citaciones, poderes, quórum por coeficiente, votaciones,
  **transmisión en vivo** y **generación del acta**.
- **Documentos formales descargables:** paz y salvo, informe de estado de cuenta,
  comprobante de pago y acta de asamblea.
- **Coeficientes** visibles para el copropietario y administrables por el administrador.
- Multi-copropiedad y multi-rol para un mismo usuario.

> Los tres puntos en negrita se agregaron el 2026-08-26 con el alcance declarado por el
> equipo ([`12-levantamiento-pendiente.md` §0](./12-levantamiento-pendiente.md)).

### 4.2 Fuera del alcance (por ahora)

- Contabilidad completa / libros oficiales (se integrará con software contable).
- Nómina de empleados del conjunto.
- Control de acceso por hardware (talanqueras, torniquetes) — solo se contempla la
  integración futura vía API.
- Facturación electrónica ante la autoridad tributaria (fase posterior).

## 5. Alcance del DEMO v0.1 (lo que existe hoy)

El demo es **navegable y con datos simulados**, para validar flujos con usuarios antes de
construir el backend. Ver estado detallado en [`09-estado-del-proyecto.md`](./09-estado-del-proyecto.md).

Incluye:

- Selección de perfil (residente / administrador) sin autenticación real.
- App residente: inicio, estado de cuenta y pago simulado, reservas, PQRS, comunicados,
  visitantes con QR, correspondencia.
- Consola admin: tablero, unidades y residentes, cartera, aprobación de reservas, bandeja
  de PQRS, publicación de comunicados.
- Persistencia local en el navegador (`localStorage`) para que el demo "recuerde" lo que
  el usuario hace durante la prueba.

No incluye: backend, autenticación real, pagos reales, notificaciones push, empaquetado
Android/iOS.

## 6. Principios de diseño

1. **Móvil primero.** El residente vive en el teléfono; la consola admin vive en el escritorio.
2. **La copropiedad es el contexto.** Todo dato pertenece a una copropiedad; nada es global.
3. **Todo trámite deja rastro.** Estado, autor, fecha, historial.
4. **El demo debe poder desecharse.** La capa de datos simulada se reemplaza por la real
   sin tocar la interfaz (ver [ADR-0003](./adr/0003-capa-de-datos.md)).
