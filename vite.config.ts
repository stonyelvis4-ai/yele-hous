import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('motion') || id.includes('framer-motion')) {
            return 'vendor-framework'
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'vendor-framework'
          }

          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }

          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }

          return 'vendor'
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4174',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
})
