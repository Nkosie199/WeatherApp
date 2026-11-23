import * as React from 'react'
import { ForecastState, useForecast } from '../forecast/useForecast'
import type { Place } from '../places/place'
import { PlaceSearch } from '../places/PlaceSearch'
import { RecentPlaces } from '../places/RecentPlaces'
import { useDevicePlace } from '../places/useDevicePlace'
import { useSavedPlaces } from '../places/useSavedPlaces'
import { Attribution } from '../ui/Attribution'
import { DailyList } from '../ui/DailyList'
import { HourlyStrip } from '../ui/HourlyStrip'
import { NowCard } from '../ui/NowCard'
import { useColorMode } from './colorMode'

export const WeatherApp: React.FC = () => {
  useColorMode()
  const places = useSavedPlaces()
  const device = useDevicePlace(places.choose)
  const forecast = useForecast(places.selected)

  return (
    <main className="app">
      <div className="toolbar">
        <PlaceSearch onChoose={places.choose} />
        <button type="button" className="button" onClick={device.locate} disabled={device.state.status === 'locating'}>
          {device.state.status === 'locating' ? 'Finding you...' : 'Use my location'}
        </button>
      </div>
      {device.state.status === 'failed' && <p className="notice" role="alert">{device.state.message}</p>}
      <RecentPlaces places={places.recent} selected={places.selected} onChoose={places.choose} onForget={places.forget} />
      {places.selected ? <Forecast place={places.selected} state={forecast} /> : <Welcome />}
      <Attribution updatedAt={forecast.status === 'ready' ? forecast.summary.updatedAt : undefined} />
    </main>
  )
}

const Welcome: React.FC = () => (
  <section className="card welcome">
    <h1>Plan around the weather</h1>
    <p className="muted">Search for a town or city, or use your location, to see the next 24 hours and the coming days.</p>
  </section>
)

const Forecast: React.FC<{ place: Place; state: ForecastState }> = ({ place, state }) => {
  if (state.status === 'loading') return <p className="card muted" aria-live="polite">Loading the forecast...</p>
  if (state.status === 'failed') return <p className="card notice" role="alert">{state.message}</p>
  return (
    <>
      {state.stale && <p className="notice">Showing the last forecast we had; a newer one couldn't be fetched.</p>}
      <NowCard placeName={place.name} summary={state.summary} timeZone={place.timeZone} />
      <HourlyStrip hours={state.summary.hours} timeZone={place.timeZone} />
      <DailyList days={state.summary.days} timeZone={place.timeZone} />
    </>
  )
}
