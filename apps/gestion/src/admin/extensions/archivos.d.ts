// Tipos de los archivos que app.tsx importa: Vite los convierte en URL o los inyecta (T-37).
declare module '*.svg' {
  const url: string;
  export default url;
}

declare module '*.css';
