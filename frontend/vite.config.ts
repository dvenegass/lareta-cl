import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const backendUrl = env.BACKEND_URL || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // El navegador solo habla con Vite (mismo origen); Vite reenvía la API a
      // Django. Así la cookie de sesión y el CSRF funcionan sin configurar CORS.
      // changeOrigin: false mantiene el host del frontend, para que las URLs de
      // imágenes que arma Django (fotos, avatares) también pasen por aquí.
      proxy: {
        "/api": { target: backendUrl, changeOrigin: false },
        "/media": { target: backendUrl, changeOrigin: false },
        // Enlaces para compartir con vista previa (los genera Django)
        "/share": { target: backendUrl, changeOrigin: false },
        // WebSockets del chat de grupos (Django Channels)
        "/ws": { target: backendUrl, changeOrigin: false, ws: true },
      },
    },
  };
});
