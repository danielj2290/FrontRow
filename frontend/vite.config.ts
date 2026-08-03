import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward any /api/* request to the Express backend during development.
    // WHY: the browser blocks cross-origin requests (CORS), and in production
    // both apps will sit behind the same domain anyway — this proxy makes
    // dev behave like production.
    proxy: {
      '/api': 'http://localhost:3000', // must match PORT in the root .env
    },
  },
})
