import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// La base relativa permite servir el demo desde cualquier subruta
// (GitHub Pages, un subdirectorio, o el WebView de Capacitor en fase 3).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist' },
})
