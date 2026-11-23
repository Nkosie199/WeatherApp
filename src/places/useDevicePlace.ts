import * as React from 'react'
import { loadPlaceIndex } from './loadPlaceIndex'
import type { Place } from './place'

export type DevicePlaceState = { status: 'idle' | 'locating' } | { status: 'failed'; message: string }

const GEOLOCATION_OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 }

/** Finds where the device is (with the browser's permission) and names it after the nearest town. */
export function useDevicePlace(onFound: (place: Place) => void) {
  const [state, setState] = React.useState<DevicePlaceState>({ status: 'idle' })

  const locate = React.useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'failed', message: 'This browser can\'t share your location. Search for a place instead.' })
      return
    }
    setState({ status: 'locating' })
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          onFound(await nearbyPlace(coords.latitude, coords.longitude))
          setState({ status: 'idle' })
        } catch {
          setState({ status: 'failed', message: 'Couldn\'t load the list of places. Check your connection and try again.' })
        }
      },
      error => setState({ status: 'failed', message: geolocationMessage(error) }),
      GEOLOCATION_OPTIONS,
    )
  }, [onFound])

  return { state, locate }
}

async function nearbyPlace(lat: number, lon: number): Promise<Place> {
  const nearest = (await loadPlaceIndex()).nearest(lat, lon)
  const timeZone = nearest?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  return { name: nearest ? `Near ${nearest.name}` : 'Your location', country: nearest?.country ?? '', lat: round2(lat), lon: round2(lon), timeZone }
}

const round2 = (value: number) => Math.round(value * 100) / 100

function geolocationMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) return 'Location is turned off for this site. Search for a place instead.'
  return 'Couldn\'t find your location. Search for a place instead.'
}
