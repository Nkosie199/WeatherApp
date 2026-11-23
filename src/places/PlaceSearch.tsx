import * as React from 'react'
import { countryName, Place } from './place'
import { usePlaceSearch } from './usePlaceSearch'

const LIST_ID = 'place-results'

/** A search box over the bundled list of towns and cities, usable with the keyboard as a combobox. */
export const PlaceSearch: React.FC<{ onChoose: (place: Place) => void }> = ({ onChoose }) => {
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const { results, listState, prepare } = usePlaceSearch(query)
  const open = query.trim().length >= 2 && results.length > 0

  const choose = (place: Place) => {
    onChoose(place)
    setQuery('')
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') setQuery('')
    if (!open) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive(current => (current + step + results.length) % results.length)
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[active])
    }
  }

  return (
    <div className="search">
      <label className="visually-hidden" htmlFor="place-search">Search for a town or city</label>
      <input
        id="place-search"
        className="search-input"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={LIST_ID}
        aria-autocomplete="list"
        aria-activedescendant={open ? `place-${active}` : undefined}
        autoComplete="off"
        placeholder="Search for a town or city"
        value={query}
        onFocus={prepare}
        onChange={event => {
          setQuery(event.target.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
      />
      <SearchHint query={query} listState={listState} hasResults={results.length > 0} />
      {open && (
        <ul id={LIST_ID} className="search-results" role="listbox" aria-label="Places">
          {results.map((place, i) => (
            <li
              key={`${place.name}-${place.lat}-${place.lon}`}
              id={`place-${i}`}
              role="option"
              aria-selected={i === active}
              className="search-result"
              onMouseDown={event => event.preventDefault()}
              onClick={() => choose(place)}
            >
              <span>{place.name}</span>
              <span className="muted">{countryName(place.country)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const SearchHint: React.FC<{ query: string; listState: string; hasResults: boolean }> = ({ query, listState, hasResults }) => {
  if (listState === 'failed') return <p className="search-hint" role="alert">Couldn't load the list of places. Reload to try again.</p>
  if (query.trim().length < 2) return null
  if (listState === 'loading') return <p className="search-hint">Loading places...</p>
  if (!hasResults) return <p className="search-hint">No towns or cities match "{query.trim()}".</p>
  return null
}
