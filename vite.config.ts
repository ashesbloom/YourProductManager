import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vendors change far less often than app code, so give them their own
        // long-lived chunks instead of busting one bundle on every edit.
        // Matched by path rather than package name: the name form misses
        // sub-entries like `react-dom/client`, which left react-dom in the entry.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('node_modules/gsap')) return 'gsap'
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) return 'motion'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          return 'vendor'
        },
      },
    },
  },
})
