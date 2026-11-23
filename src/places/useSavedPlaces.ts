import * as React from 'react'
import type { Place } from './place'
import { choosePlace, forgetPlace, readSavedPlaces, SavedPlaces, writeSavedPlaces } from './savedPlaces'

export function useSavedPlaces() {
  const [saved, setSaved] = React.useState<SavedPlaces>(() => readSavedPlaces())

  const update = React.useCallback((change: (current: SavedPlaces) => SavedPlaces) => {
    setSaved(current => {
      const next = change(current)
      writeSavedPlaces(next)
      return next
    })
  }, [])

  const choose = React.useCallback((place: Place) => update(current => choosePlace(current, place)), [update])
  const forget = React.useCallback((place: Place) => update(current => forgetPlace(current, place)), [update])
  return { ...saved, choose, forget }
}
