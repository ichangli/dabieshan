import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
  ],
  optimizeDeps: {
    exclude: ['@arcgis/core']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/geoserver': {
        target: 'http://localhost:3200',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3200',
        changeOrigin: true
      }
    }
  },
  base: mode === 'demo' ? '/dabieshan/' : '/',
}))