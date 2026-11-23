import * as React from 'react'
import type { Place } from '../places/place'
import type { MetForecast } from './metTypes'
import { summarize, Summary } from './summarize'

export type ForecastState =
  | { status: 'loading' }
  | { status: 'ready'; summary: Summary; stale: boolean }
  | { status: 'failed'; message: string }

// Reopening the app after this long fetches again; the Worker and browser caches make most of these free.
const REFRESH_AFTER_MS = 10 * 60 * 1000

/** The forecast for a place, loaded when the place changes and again when the app is reopened later. */
export function useForecast(place: Place | null): ForecastState {
  const [state, setState] = React.useState<ForecastState>({ status: 'loading' })
  const [loadedAt, setLoadedAt] = React.useState(0)
  const [refreshes, setRefreshes] = React.useState(0)

  React.useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - loadedAt > REFRESH_AFTER_MS) setRefreshes(n => n + 1)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadedAt])

  const shownPlace = React.useRef<Place | null>(null)

  React.useEffect(() => {
    if (!place) return
    let current = true
    // A refresh keeps showing the current forecast until the new one arrives; a new place starts blank.
    if (shownPlace.current !== place) setState({ status: 'loading' })
    shownPlace.current = place
    fetchForecast(place)
      .then(next => {
        if (!current) return
        setState(next)
        setLoadedAt(Date.now())
      })
    return () => {
      current = false
    }
  }, [place, refreshes])

  return state
}

async function fetchForecast(place: Place): Promise<ForecastState> {
  try {
    const response = await fetch(`/api/forecast?lat=${place.lat}&lon=${place.lon}`)
    if (!response.ok) return { status: 'failed', message: 'The forecast isn\'t available right now. Try again in a few minutes.' }
    const summary = summarize((await response.json()) as MetForecast, place.timeZone, Date.now())
    if (!summary) return { status: 'failed', message: 'There\'s no forecast for this place right now.' }
    return { status: 'ready', summary, stale: response.headers.get('X-Forecast-Stale') === '1' }
  } catch {
    return { status: 'failed', message: 'Couldn\'t reach the forecast. Check your connection.' }
  }
}
