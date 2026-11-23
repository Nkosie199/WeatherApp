import durban from '../../test-support/metDurban.json'
import { formatDay, localParts } from '../localTime'
import type { MetForecast, MetStep } from '../metTypes'
import { summarize } from '../summarize'
import { conditionFor } from '../symbols'

const forecast = durban as MetForecast
const JOHANNESBURG = 'Africa/Johannesburg'

const step = (time: string, temp: number, hourly?: { symbol: string; rain: number }, sixHourly?: { symbol: string; rain: number }): MetStep => ({
  time,
  data: {
    instant: { details: { air_temperature: temp, wind_speed: 5, relative_humidity: 60 } },
    ...(hourly && { next_1_hours: { summary: { symbol_code: hourly.symbol }, details: { precipitation_amount: hourly.rain } } }),
    ...(sixHourly && { next_6_hours: { summary: { symbol_code: sixHourly.symbol }, details: { precipitation_amount: sixHourly.rain } } }),
  },
})

const series = (...steps: MetStep[]): MetForecast => ({ properties: { meta: { updated_at: '2026-11-23T05:00:00Z' }, timeseries: steps } })

describe('conditionFor', () => {
  it.each([
    ['clearsky_day', '☀️', 'Clear'],
    ['clearsky_night', '🌙', 'Clear'],
    ['partlycloudy_night', '⛅', 'Partly cloudy'],
    ['lightrain', '🌧️', 'Light rain'],
    ['rainshowers_day', '🌦️', 'Rain showers'],
    ['heavyrainandthunder', '⛈️', 'Heavy rain and thunder'],
    ['lightssnowshowersandthunder_day', '⛈️', 'Light snow showers and thunder'],
    ['heavysleet', '🌨️', 'Heavy sleet'],
    ['snow', '❄️', 'Snow'],
    ['nonsense', '🌡️', 'Unknown'],
  ])('%s', (code, icon, label) => {
    expect(conditionFor(code)).toEqual({ icon, label })
  })
})

describe('local time', () => {
  it('reads the date and hour in the place\'s time zone', () => {
    expect(localParts('2026-11-23T22:30:00Z', JOHANNESBURG)).toEqual({ date: '2026-11-24', hour: 0 })
    expect(localParts('2026-11-23T22:30:00Z', 'America/New_York')).toEqual({ date: '2026-11-23', hour: 17 })
  })

  it('names today and tomorrow', () => {
    expect(formatDay('2026-11-23', '2026-11-23')).toBe('Today')
    expect(formatDay('2026-11-24', '2026-11-23')).toBe('Tomorrow')
    expect(formatDay('2026-11-26', '2026-11-23')).toMatch(/Thu/)
  })
})

describe('summarize', () => {
  it('reads a real MET forecast: now, 24 hours and about 10 local days', () => {
    const summary = summarize(forecast, JOHANNESBURG, Date.parse('2026-11-23T05:20:00Z'))!

    expect(summary.now).toEqual({ temperature: 23.1, symbol: 'cloudy', windKmh: 2.2 * 3.6, humidity: 72.1 })
    expect(summary.hours).toHaveLength(24)
    expect(summary.hours[0].time).toBe('2026-11-23T05:00:00Z')
    expect(summary.days[0].date).toBe('2026-11-23')
    expect(summary.days.length).toBeGreaterThanOrEqual(9)
    summary.days.forEach(day => {
      expect(day.min).toBeLessThanOrEqual(day.max)
      expect(day.symbol).not.toBe('')
    })
  })

  it('describes a day by its symbolled steps and drops a day that has none', () => {
    const data = series(
      step('2026-11-23T06:00:00Z', 10, undefined, { symbol: 'rain', rain: 2 }),
      step('2026-11-23T12:00:00Z', 14),
      step('2026-11-24T06:00:00Z', 9),
    )
    const days = summarize(data, 'UTC', Date.parse('2026-11-23T06:00:00Z'))!.days

    expect(days).toHaveLength(1)
    expect(days[0]).toMatchObject({ date: '2026-11-23', symbol: 'rain', max: 14 })
  })

  it('skips steps that are already over', () => {
    const data = series(step('2026-11-23T05:00:00Z', 10, { symbol: 'fog', rain: 0 }), step('2026-11-23T06:00:00Z', 12, { symbol: 'fair_day', rain: 0 }))
    expect(summarize(data, 'UTC', Date.parse('2026-11-23T06:10:00Z'))?.now.temperature).toBe(12)
  })

  it('returns null when the whole forecast is in the past', () => {
    expect(summarize(series(), 'UTC', 0)).toBeNull()
  })

  it('adds a day\'s rain without counting overlapping periods twice', () => {
    const data = series(
      step('2026-11-23T10:00:00Z', 10, { symbol: 'rain', rain: 1 }, { symbol: 'rain', rain: 9 }),
      step('2026-11-23T11:00:00Z', 11, { symbol: 'rain', rain: 2 }, { symbol: 'rain', rain: 9 }),
      step('2026-11-23T12:00:00Z', 13, undefined, { symbol: 'cloudy', rain: 3 }),
      step('2026-11-23T18:00:00Z', 9, undefined, { symbol: 'fair_night', rain: 0 }),
    )
    const [day] = summarize(data, 'UTC', Date.parse('2026-11-23T10:00:00Z'))!.days

    expect(day).toMatchObject({ min: 9, max: 13, rainMm: 1 + 2 + 3, symbol: 'cloudy' })
  })

  it('finds the first rainy hour', () => {
    const data = series(
      step('2026-11-23T10:00:00Z', 10, { symbol: 'cloudy', rain: 0.1 }),
      step('2026-11-23T11:00:00Z', 10, { symbol: 'lightrain', rain: 0.4 }),
      step('2026-11-23T12:00:00Z', 10, { symbol: 'rain', rain: 2 }),
    )
    expect(summarize(data, 'UTC', Date.parse('2026-11-23T10:00:00Z'))?.nextRain?.time).toBe('2026-11-23T11:00:00Z')
  })
})
