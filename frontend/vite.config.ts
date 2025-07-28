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
  build: {
    // Build çıktısını backend static klasörüne yönlendir
    outDir: "../backend/static",
    // Assets klasörünü temizle ve yeniden oluştur
    emptyOutDir: true,
    // Source map'leri devre dışı bırak (production için)
    sourcemap: false,
    // Chunk boyutunu optimize et
    rollupOptions: {
      output: {
        // Chunk'ları daha iyi organize et
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    // Build optimizasyonları
    minify: 'terser',
    target: 'es2015',
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
