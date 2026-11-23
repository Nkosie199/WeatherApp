export interface AppConfig {
  /** deepdiary-backend's public forecast endpoint. */
  forecastUrl: string
}

const PRODUCTION_API = 'https://api.deepdiary.mynger.com/api'

/**
 * Production's backend unless the build sets VITE_API_URL. `npm run dev` uses /api, which Vite passes to the
 * local backend.
 */
export function readConfig(env: { VITE_API_URL?: string; DEV: boolean }): AppConfig {
  const apiUrl = env.VITE_API_URL || (env.DEV ? '/api' : PRODUCTION_API)
  return { forecastUrl: `${apiUrl}/public/weather/forecast` }
}
