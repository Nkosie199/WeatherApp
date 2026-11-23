import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { fakeResponse } from '../../test-support/fakeResponse'
import durban from '../../test-support/metDurban.json'
import { COLOR_MODE_MESSAGE, colorModeFrom } from '../colorMode'
import { readConfig } from '../config'
import { WeatherApp as App } from '../WeatherApp'

const config = { forecastUrl: 'https://api.test/api/public/weather/forecast' }
const WeatherApp = () => <App config={config} />

const PLACES = 'Africa/Johannesburg\nDurban\tZA\t-29.86\t31.03\t0\nDurbanville\tZA\t-33.83\t18.65\t0\n'
const FORECAST_TIME = new Date('2026-11-23T05:20:00Z')

function respond(url: string): Response {
  if (url === '/places.tsv') return fakeResponse(PLACES)
  if (url.startsWith(config.forecastUrl)) return fakeResponse(JSON.stringify(durban))
  return fakeResponse('', 404)
}

beforeEach(() => {
  jest.useFakeTimers({ now: FORECAST_TIME, doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'] })
  localStorage.clear()
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => respond(String(input))) as typeof fetch
})

afterEach(() => jest.useRealTimers())

describe('WeatherApp', () => {
  it('asks for a place on first visit', () => {
    render(<WeatherApp />)
    expect(screen.getByRole('heading', { name: 'Plan around the weather' })).toBeInTheDocument()
  })

  it('searches the place list and shows the chosen place\'s forecast', async () => {
    const user = userEvent.setup()
    render(<WeatherApp />)

    await user.type(screen.getByRole('combobox', { name: 'Search for a town or city' }), 'durb')
    expect(await screen.findByRole('option', { name: /Durbanville/ })).toBeInTheDocument()
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('heading', { name: 'Durban' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Durban' })).getByText('23°')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Hourly forecast' }).children).toHaveLength(24)
    expect(screen.getByRole('heading', { name: /^Next \d+ days$/ })).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('https://api.test/api/public/weather/forecast?lat=-29.86&lon=31.03')
    expect(JSON.parse(localStorage.getItem('weather.places') ?? '{}').selected.name).toBe('Durban')
  })

  it('says so when the forecast can\'t be fetched', async () => {
    localStorage.setItem('weather.places', JSON.stringify({ selected: { name: 'Durban', country: 'ZA', lat: -29.86, lon: 31.03, timeZone: 'Africa/Johannesburg' }, recent: [] }))
    globalThis.fetch = jest.fn(async () => fakeResponse('', 502)) as typeof fetch

    render(<WeatherApp />)

    expect(await screen.findByRole('alert')).toHaveTextContent('The forecast isn\'t available right now')
  })

  it('follows the colour mode its parent page sends', async () => {
    render(<WeatherApp />)
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: COLOR_MODE_MESSAGE, mode: 'dark' }, source: window.parent }))
    })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

describe('colorModeFrom', () => {
  it('reads only well-formed colour-mode messages', () => {
    expect(colorModeFrom({ type: COLOR_MODE_MESSAGE, mode: 'light' })).toBe('light')
    expect(colorModeFrom({ type: COLOR_MODE_MESSAGE, mode: 'pink' })).toBeNull()
    expect(colorModeFrom({ type: 'OTHER', mode: 'dark' })).toBeNull()
    expect(colorModeFrom(null)).toBeNull()
  })
})

describe('readConfig', () => {
  it('uses the production backend, the dev proxy, or what the build sets', () => {
    expect(readConfig({ DEV: false }).forecastUrl).toBe('https://api.deepdiary.mynger.com/api/public/weather/forecast')
    expect(readConfig({ DEV: true }).forecastUrl).toBe('/api/public/weather/forecast')
    expect(readConfig({ DEV: false, VITE_API_URL: 'https://api.test/api' }).forecastUrl).toBe('https://api.test/api/public/weather/forecast')
  })
})
