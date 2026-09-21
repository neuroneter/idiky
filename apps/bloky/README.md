# apps/bloky — BLOKY Dev

**BLOKY**, el sistema de las copropiedades de IDIKY, construido de cero sobre los casos de uso
del demo, sin tocar el demo ([ADR-0013](../../docs/adr/0013-bloky-dev-separada-del-demo.md)).
Entran solo los módulos que se van desarrollando; hoy, el ingreso (CU-B-01).

| | |
|---|---|
| **Stack** | React + TypeScript + Vite, como el demo (ADR-0001). Sin librería de UI |
| **Identidad visual** | `src/estilos/tokens.css` es una copia de la de ALICE: un solo diseño |
| **Datos** | Solo por `src/datos/api.ts`, que habla con `apps/bloky-api` (ADR-0003). La sesión es una cookie httpOnly: la app no guarda tokens |
| **Puerto** | `8083` en el entorno de desarrollo, servido por el nginx del pod `idiky-bloky` |

## Correr en tu máquina

```bash
# Terminal 1: la API (ver apps/bloky-api/README.md)
cd apps/bloky-api && npm install && BOB_URL=… BOB_API_TOKEN=… npm run dev

# Terminal 2: la app
cd apps/bloky && npm install && npm run dev      # http://localhost:5173, /api va al 3000
```

Antes de dar por terminado un cambio: `npm run build` debe pasar.

## Lo que se trae del demo y lo que no

Se copian **tokens.css** y **Logotipo.tsx** tal cual, y se toman los casos de uso ya
documentados. **No** se copian pantallas, semilla ni `localStorage`: BLOKY tiene backend desde
el primer día. Cuando un componente del demo haga falta, se copia a `src/componentes/` y se
adapta; no se importa desde `apps/pwa`.
