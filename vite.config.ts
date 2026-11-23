import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // In `npm run dev`, /api goes to a local deepdiary-backend (API_PROXY picks another one).
  server: { proxy: { '/api': process.env.API_PROXY ?? 'http://localhost:8080' } },
})
