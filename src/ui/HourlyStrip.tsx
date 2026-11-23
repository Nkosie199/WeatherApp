import * as React from 'react'
import { formatHour } from '../forecast/localTime'
import type { Hour } from '../forecast/summarize'
import { conditionFor } from '../forecast/symbols'
import { formatRain, formatTemperature } from './format'

/** The next 24 hours, scrolling sideways. */
export const HourlyStrip: React.FC<{ hours: Hour[]; timeZone: string }> = ({ hours, timeZone }) => (
  <section className="card" aria-labelledby="hours-heading">
    <h2 id="hours-heading">Next 24 hours</h2>
    <ol className="hours" tabIndex={0} aria-label="Hourly forecast">
      {hours.map(hour => {
        const condition = conditionFor(hour.symbol)
        return (
          <li key={hour.time} className="hour">
            <span className="muted">{formatHour(hour.time, timeZone)}</span>
            <span className="hour-icon" role="img" aria-label={condition.label}>{condition.icon}</span>
            <span className="hour-temp">{formatTemperature(hour.temperature)}</span>
            <span className="rain">{formatRain(hour.rainMm)}</span>
          </li>
        )
      })}
    </ol>
  </section>
)
