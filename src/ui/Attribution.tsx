import * as React from 'react'

/** Both data sources are CC BY 4.0, which asks for credit and a link to the licence. */
export const Attribution: React.FC<{ updatedAt?: string }> = ({ updatedAt }) => (
  <footer className="attribution muted">
    {updatedAt && <span>Forecast updated {new Date(updatedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}. </span>}
    Forecast data from <a href="https://www.met.no/en" target="_blank" rel="noreferrer">MET Norway</a>, place names
    from <a href="https://www.geonames.org" target="_blank" rel="noreferrer">GeoNames</a>, both
    under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.
  </footer>
)
