import * as React from 'react'
import { loadPlaceIndex } from './loadPlaceIndex'
import type { Place } from './place'
import type { PlaceIndex } from './placeIndex'

const MAX_RESULTS = 8

export type PlaceListState = 'idle' | 'loading' | 'ready' | 'failed'

/** Matches for a search query, loading the place list the first time someone starts searching. */
export function usePlaceSearch(query: string) {
  const [index, setIndex] = React.useState<PlaceIndex | null>(null)
  const [listState, setListState] = React.useState<PlaceListState>('idle')

  const prepare = React.useCallback(() => {
    if (index || listState === 'loading') return
    setListState('loading')
    loadPlaceIndex()
      .then(loaded => {
        setIndex(loaded)
        setListState('ready')
      })
      .catch(() => setListState('failed'))
  }, [index, listState])

  const results = React.useMemo<Place[]>(() => index?.search(query, MAX_RESULTS) ?? [], [index, query])
  return { results, listState, prepare }
}
