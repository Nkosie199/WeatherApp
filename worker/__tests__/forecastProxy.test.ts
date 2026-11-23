/** @jest-environment node */
import { coordinatesFrom } from '../coordinates'
import { forecastFor, ProxyDeps } from '../forecastProxy'

const NOW = Date.parse('2026-11-23T10:00:00Z')
const LATER = 'Mon, 23 Nov 2026 10:30:00 GMT'
const EARLIER = 'Mon, 23 Nov 2026 09:30:00 GMT'
const MODIFIED = 'Mon, 23 Nov 2026 09:00:00 GMT'
const durban = { lat: -29.86, lon: 31.03 }

class MemoryCache {
  entries = new Map<string, Response>()
  async match(key: string) {
    return this.entries.get(key)?.clone()
  }
  async put(key: string, response: Response) {
    this.entries.set(key, response)
  }
}

function setup(upstream: (init?: RequestInit) => Response | Promise<Response>) {
  const cache = new MemoryCache()
  const calls: RequestInit[] = []
  const deps: ProxyDeps = {
    cache: cache as unknown as Cache,
    fetch: (async (_url: string, init?: RequestInit) => {
      calls.push(init ?? {})
      return upstream(init)
    }) as typeof fetch,
    userAgent: 'TestApp/1.0',
    now: () => NOW,
  }
  return { cache, calls, deps }
}

const metResponse = (body: string, expires: string, status = 200) =>
  new Response(status === 304 ? null : body, { status, headers: { Expires: expires, 'Last-Modified': MODIFIED } })

describe('coordinatesFrom', () => {
  it('rounds to 2 decimals', () => {
    expect(coordinatesFrom(new URLSearchParams('lat=-29.85791&lon=31.02918'))).toEqual(durban)
  })

  it.each(['lat=1', 'lat=abc&lon=1', 'lat=91&lon=0', 'lat=0&lon=181', ''])('rejects %p', query => {
    expect(coordinatesFrom(new URLSearchParams(query))).toBeNull()
  })
})

describe('forecastFor', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined))
  afterEach(() => jest.restoreAllMocks())

  it('fetches from MET once, identifying the app, then serves the cache until Expires', async () => {
    const { calls, deps } = setup(() => metResponse('{"a":1}', LATER))

    const first = await forecastFor(durban, deps)
    const second = await forecastFor(durban, deps)

    expect(await first.json()).toEqual({ a: 1 })
    expect(await second.json()).toEqual({ a: 1 })
    expect(calls).toHaveLength(1)
    expect(calls[0].headers).toEqual({ 'User-Agent': 'TestApp/1.0' })
    expect(second.headers.get('Cache-Control')).toBe('public, max-age=1800')
  })

  it('collapses concurrent misses for one place into one upstream call', async () => {
    const { calls, deps } = setup(() => metResponse('{}', LATER))
    await Promise.all([forecastFor(durban, deps), forecastFor(durban, deps), forecastFor(durban, deps)])
    expect(calls).toHaveLength(1)
  })

  it('revalidates an expired copy with If-Modified-Since and keeps the body on 304', async () => {
    const { cache, calls, deps } = setup(() => metResponse('', LATER, 304))
    const key = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=-29.86&lon=31.03'
    await cache.put(key, metResponse('{"old":true}', EARLIER))

    const response = await forecastFor(durban, deps)

    expect(calls[0].headers).toEqual({ 'User-Agent': 'TestApp/1.0', 'If-Modified-Since': MODIFIED })
    expect(await response.json()).toEqual({ old: true })
    expect((await cache.match(key))?.headers.get('Expires')).toBe(LATER)
  })

  it('serves the last good copy, marked stale, when MET throttles', async () => {
    const { cache, deps } = setup(() => new Response('', { status: 429 }))
    await cache.put('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=-29.86&lon=31.03', metResponse('{"old":true}', EARLIER))

    const response = await forecastFor(durban, deps)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Forecast-Stale')).toBe('1')
    expect(await response.json()).toEqual({ old: true })
  })

  it('answers 502 when MET is unreachable and nothing is cached', async () => {
    const { deps } = setup(() => Promise.reject(new Error('offline')))
    expect((await forecastFor({ lat: 1, lon: 2 }, deps)).status).toBe(502)
  })
})
