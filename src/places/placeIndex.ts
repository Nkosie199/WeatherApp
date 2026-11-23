import type { Place } from './place'

interface IndexedPlace {
  place: Place
  key: string
}

/** Every town and city in public/places.tsv, largest first, searchable by name. */
export class PlaceIndex {
  private constructor(private readonly entries: IndexedPlace[]) {}

  /**
   * places.tsv (built from GeoNames' cities5000): a first line of tab-separated time zones, then one place per line
   * as name, country code, lat, lon and the index of its time zone, sorted by population.
   */
  static parse(text: string): PlaceIndex {
    const [zoneLine, ...lines] = text.split('\n')
    const zones = zoneLine.split('\t')
    const entries = lines.filter(Boolean).map(line => {
      const [name, country, lat, lon, zone] = line.split('\t')
      const place = { name, country, lat: Number(lat), lon: Number(lon), timeZone: zones[Number(zone)] }
      return { place, key: normalise(name) }
    })
    return new PlaceIndex(entries)
  }

  /** Names starting with the query first, then names with a word starting with it; larger places first in each. */
  search(query: string, limit: number): Place[] {
    const wanted = normalise(query)
    if (wanted.length < 2) return []
    const starts: Place[] = []
    const wordStarts: Place[] = []
    for (const { place, key } of this.entries) {
      if (key.startsWith(wanted)) starts.push(place)
      else if (wordStarts.length < limit && key.includes(` ${wanted}`)) wordStarts.push(place)
      if (starts.length >= limit) break
    }
    return [...starts, ...wordStarts].slice(0, limit)
  }

  /** The closest listed place to a position, for naming where the device is. */
  nearest(lat: number, lon: number): Place | null {
    let best: Place | null = null
    let bestDistance = Infinity
    const cosLat = Math.cos((lat * Math.PI) / 180)
    for (const { place } of this.entries) {
      const dLon = (((place.lon - lon + 540) % 360) - 180) * cosLat
      const distance = (place.lat - lat) ** 2 + dLon ** 2
      if (distance < bestDistance) {
        best = place
        bestDistance = distance
      }
    }
    return best
  }
}

export const normalise = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
