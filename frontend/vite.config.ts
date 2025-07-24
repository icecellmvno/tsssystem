import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:7001",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "ws://localhost:7001",
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
