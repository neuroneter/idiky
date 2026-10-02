import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const paquete = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

// La base relativa permite servir el demo desde cualquier subruta
// (GitHub Pages, un subdirectorio, o el WebView de Capacitor en fase 3).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist' },
  // Lo que la app sabe de si misma al compilarse. La revision del servidor no
  // va aqui a proposito: la escribe el despliegue en revision.txt despues de
  // compilar, y la app la lee en tiempo de ejecucion (servicios/version.ts).
  define: {
    __VERSION_APP__: JSON.stringify(paquete.version),
    __FECHA_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
})
