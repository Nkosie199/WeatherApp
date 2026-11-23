import * as React from 'react'
import { formatDay, localParts } from '../forecast/localTime'
import type { Day } from '../forecast/summarize'
import { conditionFor } from '../forecast/symbols'
import { formatRain, formatTemperature, formatWind } from './format'

/** One row per day for the coming week and a bit, for planning ahead. */
export const DailyList: React.FC<{ days: Day[]; timeZone: string }> = ({ days, timeZone }) => {
  const today = localParts(new Date().toISOString(), timeZone).date
  return (
    <section className="card" aria-labelledby="days-heading">
      <h2 id="days-heading">Next {days.length} days</h2>
      <ul className="days">
        {days.map(day => {
          const condition = conditionFor(day.symbol)
          return (
            <li key={day.date} className="day">
              <span className="day-name">{formatDay(day.date, today)}</span>
              <span className="day-icon" role="img" aria-label={condition.label}>{condition.icon}</span>
              <span className="day-condition muted">{condition.label}</span>
              <span className="rain">{formatRain(day.rainMm)}</span>
              <span className="muted day-wind">{formatWind(day.maxWindKmh)}</span>
              <span className="day-temps">
                <span className="muted">{formatTemperature(day.min)}</span> {formatTemperature(day.max)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
