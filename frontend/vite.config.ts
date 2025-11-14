import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  // Environment variables with VITE_ prefix are automatically exposed to client
  // Validate required environment variables at build time
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:8000'
    ),
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(
      process.env.VITE_CLERK_PUBLISHABLE_KEY || ''
    ),
  },
})
