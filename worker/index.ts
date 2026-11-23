import { coordinatesFrom } from './coordinates'
import { forecastFor } from './forecastProxy'

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  MET_USER_AGENT: string
  FRAME_ANCESTORS: string
}

declare const caches: CacheStorage & { default: Cache }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/forecast') return forecast(url, env)
    return withPageHeaders(await env.ASSETS.fetch(request), env.FRAME_ANCESTORS)
  },
}

function forecast(url: URL, env: Env): Promise<Response> | Response {
  const coords = coordinatesFrom(url.searchParams)
  if (!coords) return Response.json({ error: 'lat and lon are required.' }, { status: 400 })
  // The Workers runtime rejects a detached `fetch`, so it's wrapped rather than passed as is.
  const upstreamFetch: typeof fetch = (input, init) => fetch(input, init)
  return forecastFor(coords, { cache: caches.default, fetch: upstreamFetch, userAgent: env.MET_USER_AGENT, now: Date.now })
}

/** Only the listed sites may show Weather in a frame. */
function withPageHeaders(asset: Response, frameAncestors: string): Response {
  const response = new Response(asset.body, asset)
  response.headers.set('Content-Security-Policy', `frame-ancestors ${frameAncestors}`)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}
