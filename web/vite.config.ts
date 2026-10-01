/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento, chamadas a /api/... vão para a API em http://localhost:4000/...
    // Assim o navegador fala com uma única origem e não há problema de CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        rewrite: (caminho) => caminho.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/setup.ts'],
  },
})
