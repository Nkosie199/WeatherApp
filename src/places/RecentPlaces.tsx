import * as React from 'react'
import { Place, placeLabel, samePlace } from './place'

interface Props {
  places: Place[]
  selected: Place | null
  onChoose: (place: Place) => void
  onForget: (place: Place) => void
}

/** The places looked at recently, one tap away. */
export const RecentPlaces: React.FC<Props> = ({ places, selected, onChoose, onForget }) => {
  if (places.length < 2) return null
  return (
    <ul className="recent" aria-label="Recent places">
      {places.map(place => {
        const current = selected !== null && samePlace(place, selected)
        return (
          <li key={`${place.name}-${place.lat}-${place.lon}`} className={current ? 'chip chip-current' : 'chip'}>
            <button type="button" className="chip-name" aria-pressed={current} onClick={() => onChoose(place)}>
              {place.name}
            </button>
            <button type="button" className="chip-remove" aria-label={`Remove ${placeLabel(place)}`} onClick={() => onForget(place)}>
              ×
            </button>
          </li>
        )
      })}
    </ul>
  )
}
