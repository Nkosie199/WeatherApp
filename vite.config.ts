import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // In `npm run dev`, forecasts come from the Worker running under `npm start` on 8787.
  server: { proxy: { '/api': 'http://localhost:8787' } },
})
