import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BLOKY se sirve en la raiz de su propio dominio o puerto (ADR-0013). En desarrollo, /api va a
// la API de BLOKY corriendo en el 3000 (apps/bloky-api, `npm run dev`).
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: 'dist' },
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false } },
  },
})
