import { Place, samePlace } from './place'

const STORAGE_KEY = 'weather.places'
const MAX_SAVED = 6

export interface SavedPlaces {
  selected: Place | null
  recent: Place[]
}

const EMPTY: SavedPlaces = { selected: null, recent: [] }

/** The places this browser has looked at, newest first. Storage can be blocked, so failures mean "none saved". */
export function readSavedPlaces(storage: Storage = window.localStorage): SavedPlaces {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as SavedPlaces | null
    return saved && Array.isArray(saved.recent) ? saved : EMPTY
  } catch {
    return EMPTY
  }
}

export function choosePlace(saved: SavedPlaces, place: Place): SavedPlaces {
  return { selected: place, recent: [place, ...saved.recent.filter(p => !samePlace(p, place))].slice(0, MAX_SAVED) }
}

export function forgetPlace(saved: SavedPlaces, place: Place): SavedPlaces {
  const recent = saved.recent.filter(p => !samePlace(p, place))
  const selected = saved.selected && samePlace(saved.selected, place) ? recent[0] ?? null : saved.selected
  return { selected, recent }
}

export function writeSavedPlaces(saved: SavedPlaces, storage: Storage = window.localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Private windows and blocked storage: the places just aren't remembered.
  }
}
