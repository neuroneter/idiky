// Tipos de los archivos que app.tsx importa: Vite los convierte en URL o los inyecta (T-37).
declare module '*.svg' {
  const url: string;
  export default url;
}

// El CSS de la marca se importa como texto (?raw) y app.tsx lo inyecta: Strapi no enlaza las
// hojas de estilo que saca la compilacion.
declare module '*.css?raw' {
  const css: string;
  export default css;
}
