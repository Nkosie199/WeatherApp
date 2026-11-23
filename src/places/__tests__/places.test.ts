import { PlaceIndex } from '../placeIndex'
import { choosePlace, forgetPlace, readSavedPlaces, writeSavedPlaces } from '../savedPlaces'

const TSV = [
  'Africa/Johannesburg\tEurope/London',
  'Johannesburg\tZA\t-26.20\t28.04\t0',
  'Durban\tZA\t-29.86\t31.03\t0',
  'London\tGB\t51.51\t-0.13\t1',
  'East London\tZA\t-33.02\t27.91\t0',
  'Durbanville\tZA\t-33.83\t18.65\t0',
  'São Tomé\tST\t0.34\t6.73\t1',
  '',
].join('\n')

const index = PlaceIndex.parse(TSV)

describe('PlaceIndex', () => {
  it('finds names starting with the query first, larger places first', () => {
    expect(index.search('durb', 5).map(p => p.name)).toEqual(['Durban', 'Durbanville'])
  })

  it('then names with a word starting with the query', () => {
    expect(index.search('london', 5).map(p => p.name)).toEqual(['London', 'East London'])
  })

  it('ignores case and accents, and needs 2 letters', () => {
    expect(index.search('SAO TO', 5)[0]).toMatchObject({ name: 'São Tomé', country: 'ST', timeZone: 'Europe/London' })
    expect(index.search('d', 5)).toEqual([])
  })

  it('names the nearest place to a position', () => {
    expect(index.nearest(-29.8, 31.0)?.name).toBe('Durban')
    expect(index.nearest(51.4, -0.2)?.name).toBe('London')
  })
})

describe('saved places', () => {
  const durban = index.search('durban', 1)[0]
  const london = index.search('london', 1)[0]

  it('keeps chosen places newest first, without duplicates', () => {
    let saved = choosePlace({ selected: null, recent: [] }, durban)
    saved = choosePlace(saved, london)
    saved = choosePlace(saved, durban)
    expect(saved).toEqual({ selected: durban, recent: [durban, london] })
  })

  it('moves to the next place when the selected one is removed', () => {
    const saved = forgetPlace({ selected: durban, recent: [durban, london] }, durban)
    expect(saved).toEqual({ selected: london, recent: [london] })
  })

  it('round-trips through storage and treats broken storage as empty', () => {
    writeSavedPlaces({ selected: durban, recent: [durban] }, localStorage)
    expect(readSavedPlaces(localStorage).selected).toEqual(durban)

    localStorage.setItem('weather.places', '{not json')
    expect(readSavedPlaces(localStorage)).toEqual({ selected: null, recent: [] })
  })
})
