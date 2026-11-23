import { PlaceIndex } from './placeIndex'

let loading: Promise<PlaceIndex> | null = null

/** The place list is about 1 MB, so it's fetched once, the first time it's needed. */
export function loadPlaceIndex(): Promise<PlaceIndex> {
  loading ??= fetch('/places.tsv')
    .then(response => {
      if (!response.ok) throw new Error(`places.tsv: ${response.status}`)
      return response.text()
    })
    .then(PlaceIndex.parse)
    .catch(error => {
      loading = null
      throw error
    })
  return loading
}
