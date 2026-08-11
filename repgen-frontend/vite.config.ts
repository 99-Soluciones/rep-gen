import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Backend al que el proxy de /api reenvía en desarrollo. Por defecto apunta
  // al backend local; se puede sobreescribir en .env (DEV_API_PROXY_TARGET)
  // para apuntar a un backend remoto (ej. DigitalOcean) sin tocar código.
  const apiProxyTarget = env.DEV_API_PROXY_TARGET || "http://localhost:3000";

  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    server: {
      // Proxya /api al backend para que, igual que en producción (donde
      // vercel.json hace el mismo rewrite), el navegador vea todo como
      // same-origin. Así la cookie de sesión puede usar sameSite: "lax" en
      // ambos entornos en vez de necesitar sameSite: "none" en desarrollo.
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[0]
                .toString();
            }
          },
          codeSplitting: {
            groups: [
              {
                test: /node_modules\/react/,
                name: "react",
              },
              {
                test: /node_modules\/react-dom/,
                name: "react-dom",
              },
              {
                test: /node_modules\/react-router-dom/,
                name: "react-router-dom",
              },
              {
                test: /node_modules\/ag-grid-community/,
                name: "ag-grid-community",
              },
              {
                test: /node_modules\/ag-grid-react/,
                name: "ag-grid-react",
              },
              {
                test: /node_modules\/lucide-react/,
                name: "lucide-react",
              },
              {
                test: /node_modules\/react-hot-toast/,
                name: "react-hot-toast",
              },
              {
                test: /node_modules\/tailwindcss/,
                name: "tailwindcss",
              },
            ],
          },
        },
      },
    },
  };
});
