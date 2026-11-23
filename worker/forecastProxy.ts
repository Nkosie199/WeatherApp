import type { Coordinates } from './coordinates'

const MET_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'
// How long a forecast stays in the cache for If-Modified-Since revalidation after it expires.
const KEEP_FOR_REVALIDATION_S = 24 * 60 * 60
const MIN_CLIENT_MAX_AGE_S = 60

export interface ProxyDeps {
  cache: Cache
  fetch: typeof fetch
  userAgent: string
  now: () => number
}

const inflight = new Map<string, Promise<Response>>()

/**
 * MET Norway's forecast for these coordinates, from the shared cache until MET's Expires time, then revalidated
 * with If-Modified-Since. Concurrent misses for one place share a single upstream call, and the last good copy is
 * served (marked stale) when MET is unreachable or throttling.
 */
export async function forecastFor(coords: Coordinates, deps: ProxyDeps): Promise<Response> {
  const key = `${MET_URL}?lat=${coords.lat}&lon=${coords.lon}`
  let pending = inflight.get(key)
  if (!pending) {
    pending = loadForecast(key, deps).finally(() => inflight.delete(key))
    inflight.set(key, pending)
  }
  return (await pending).clone()
}

async function loadForecast(key: string, deps: ProxyDeps): Promise<Response> {
  const cached = await deps.cache.match(key)
  if (cached && expiresAt(cached) > deps.now()) return forClient(cached, deps.now())

  let upstream: Response
  try {
    upstream = await deps.fetch(key, { headers: upstreamHeaders(deps.userAgent, cached) })
  } catch (error) {
    console.error('MET forecast request failed', error)
    return staleOrError(cached, deps.now())
  }

  if (upstream.status === 304 && cached) return store(key, await cached.text(), upstream.headers, cached.headers, deps)
  if (upstream.ok) return store(key, await upstream.text(), upstream.headers, undefined, deps)
  console.error('MET forecast answered', upstream.status)
  return staleOrError(cached, deps.now())
}

function upstreamHeaders(userAgent: string, cached: Response | undefined): HeadersInit {
  const headers: Record<string, string> = { 'User-Agent': userAgent }
  const lastModified = cached?.headers.get('Last-Modified')
  if (lastModified) headers['If-Modified-Since'] = lastModified
  return headers
}

async function store(key: string, body: string, fresh: Headers, previous: Headers | undefined, deps: ProxyDeps) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': `public, max-age=${KEEP_FOR_REVALIDATION_S}`,
  })
  for (const name of ['Expires', 'Last-Modified']) {
    const value = fresh.get(name) ?? previous?.get(name)
    if (value) headers.set(name, value)
  }
  const entry = new Response(body, { headers })
  await deps.cache.put(key, entry.clone())
  return forClient(entry, deps.now())
}

function staleOrError(cached: Response | undefined, now: number): Response {
  if (!cached) return Response.json({ error: 'The forecast service is unavailable. Try again shortly.' }, { status: 502 })
  const response = forClient(cached, now)
  response.headers.set('X-Forecast-Stale', '1')
  return response
}

function forClient(entry: Response, now: number): Response {
  const maxAge = Math.max(MIN_CLIENT_MAX_AGE_S, Math.round((expiresAt(entry) - now) / 1000))
  const response = new Response(entry.body, entry)
  response.headers.set('Cache-Control', `public, max-age=${maxAge}`)
  return response
}

function expiresAt(response: Response): number {
  const expires = Date.parse(response.headers.get('Expires') ?? '')
  return Number.isNaN(expires) ? 0 : expires
}
