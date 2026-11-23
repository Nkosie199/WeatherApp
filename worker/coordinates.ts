export interface Coordinates {
  lat: number
  lon: number
}

/**
 * Reads lat/lon from a query string, rounded to 2 decimals (about 1 km): close enough for a forecast, it lets
 * neighbours share one cached answer, and it keeps exact positions out of the upstream logs.
 */
export function coordinatesFrom(params: URLSearchParams): Coordinates | null {
  const lat = Number(params.get('lat'))
  const lon = Number(params.get('lon'))
  if (!params.has('lat') || !params.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { lat: round2(lat), lon: round2(lon) }
}

const round2 = (value: number) => Math.round(value * 100) / 100 + 0
