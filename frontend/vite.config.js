import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      host: true,
    },
    define: {
      'import.meta.env.VITE_API_URL': mode === 'production'
        ? JSON.stringify(process.env.VITE_API_URL || 'https://medqueue-be.shujaalik.com')
        : 'window.location.protocol + "//" + window.location.hostname + ":5000"'
    }
  }
})

