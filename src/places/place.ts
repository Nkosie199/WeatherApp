export interface Place {
  name: string
  /** ISO 3166 country code, e.g. "ZA". */
  country: string
  lat: number
  lon: number
  timeZone: string
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

export const countryName = (code: string) => (code ? regionNames.of(code) ?? code : '')

export const placeLabel = (place: Place) => [place.name, countryName(place.country)].filter(Boolean).join(', ')

export const samePlace = (a: Place, b: Place) => a.lat === b.lat && a.lon === b.lon && a.name === b.name
