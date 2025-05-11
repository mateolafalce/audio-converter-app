import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8082,
    host: true,
    allowedHosts: [
      'comunicaciontest.duckdns.org'
    ]
  }
})
