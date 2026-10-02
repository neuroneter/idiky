/**
 * Pruebas de navegador del demo (T-42, ADR-0020).
 *
 * Corren contra el servidor de desarrollo, que Playwright levanta solo. No son
 * parte de `npm run build`: se corren con `npm run probar:navegador`.
 * Detalle y convenciones: pruebas/navegador/README.md.
 */
import { defineConfig, devices } from '@playwright/test'

const PUERTO = 5174

export default defineConfig({
  testDir: './pruebas/navegador',
  // Cada prueba arranca de la semilla: el demo guarda en localStorage y un
  // contexto nuevo de navegador lo trae vacio.
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'pruebas/informe' }]],
  outputDir: 'pruebas/resultados',
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    // La copropiedad es colombiana: la hora del demo se lee en Bogota, sea
    // donde sea que corra la prueba.
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
