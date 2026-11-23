import * as React from 'react'
import { formatHour } from '../forecast/localTime'
import type { Summary } from '../forecast/summarize'
import { conditionFor } from '../forecast/symbols'
import { formatTemperature, formatWind } from './format'

interface Props {
  placeName: string
  summary: Summary
  timeZone: string
}

/** The weather right now, and when the next rain is due. */
export const NowCard: React.FC<Props> = ({ placeName, summary, timeZone }) => {
  const { now, nextRain } = summary
  const condition = conditionFor(now.symbol)
  return (
    <section className="card now" aria-labelledby="now-heading">
      <h1 id="now-heading" className="now-place">{placeName}</h1>
      <div className="now-main">
        <span className="now-icon" role="img" aria-label={condition.label}>{condition.icon}</span>
        <span className="now-temp">{formatTemperature(now.temperature)}</span>
      </div>
      <p className="now-condition">{condition.label}</p>
      <p className="muted">Wind {formatWind(now.windKmh)} · Humidity {Math.round(now.humidity)}%</p>
      <p className="now-plan">{nextRain ? `Rain likely from ${formatHour(nextRain.time, timeZone)}` : 'Dry for the next 24 hours'}</p>
    </section>
  )
}
