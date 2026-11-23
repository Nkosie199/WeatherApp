import { localParts } from './localTime'
import type { MetForecast, MetStep } from './metTypes'

export interface Hour {
  time: string
  temperature: number
  symbol: string
  rainMm: number
}

export interface Day {
  date: string
  min: number
  max: number
  symbol: string
  rainMm: number
  maxWindKmh: number
}

export interface Summary {
  updatedAt: string
  now: { temperature: number; symbol: string; windKmh: number; humidity: number }
  hours: Hour[]
  days: Day[]
  /** The first of the next 24 hours with noticeable rain, if any. */
  nextRain: Hour | null
}

const HOURS_SHOWN = 24
export const RAIN_THRESHOLD_MM = 0.2
const HOUR_MS = 3600_000
const MS_TO_KMH = 3.6

/** Turns MET's time series into what Weather shows: now, the next 24 hours, and one row per local day. */
export function summarize(forecast: MetForecast, timeZone: string, nowMs: number): Summary | null {
  const steps = stepsFrom(forecast.properties.timeseries, nowMs)
  const current = steps[0]
  if (!current) return null

  const hours = steps.filter(step => step.data.next_1_hours).slice(0, HOURS_SHOWN).map(toHour)
  const details = current.data.instant.details
  return {
    updatedAt: forecast.properties.meta.updated_at,
    now: {
      temperature: details.air_temperature,
      symbol: symbolOf(current),
      windKmh: details.wind_speed * MS_TO_KMH,
      humidity: details.relative_humidity,
    },
    hours,
    days: toDays(steps, timeZone),
    nextRain: hours.find(hour => hour.rainMm >= RAIN_THRESHOLD_MM) ?? null,
  }
}

/** Drops steps whose period is already over: the first step kept is the one covering now. */
function stepsFrom(timeseries: MetStep[], nowMs: number): MetStep[] {
  const endOf = (i: number) => (timeseries[i + 1] ? Date.parse(timeseries[i + 1].time) : Date.parse(timeseries[i].time) + HOUR_MS)
  const start = timeseries.findIndex((_, i) => endOf(i) > nowMs)
  return start < 0 ? [] : timeseries.slice(start)
}

function toHour(step: MetStep): Hour {
  return {
    time: step.time,
    temperature: step.data.instant.details.air_temperature,
    symbol: symbolOf(step),
    rainMm: step.data.next_1_hours?.details?.precipitation_amount ?? 0,
  }
}

function symbolOf(step: MetStep): string {
  const { next_1_hours, next_6_hours, next_12_hours } = step.data
  return (next_1_hours ?? next_6_hours ?? next_12_hours)?.summary.symbol_code ?? ''
}

/** Rain falling until the next step: hourly steps use next_1_hours, 6-hourly ones next_6_hours. */
function rainUntilNext(step: MetStep, next: MetStep | undefined): number {
  const gapHours = next ? (Date.parse(next.time) - Date.parse(step.time)) / HOUR_MS : 1
  const period = gapHours >= 6 ? step.data.next_6_hours : step.data.next_1_hours
  return period?.details?.precipitation_amount ?? 0
}

function toDays(steps: MetStep[], timeZone: string): Day[] {
  const byDate = new Map<string, { step: MetStep; hour: number; rain: number }[]>()
  steps.forEach((step, i) => {
    const { date, hour } = localParts(step.time, timeZone)
    const entries = byDate.get(date) ?? []
    entries.push({ step, hour, rain: rainUntilNext(step, steps[i + 1]) })
    byDate.set(date, entries)
  })
  // MET's last steps carry only temperatures; a day with no weather symbol at all is too thin to show.
  return [...byDate].filter(([, entries]) => entries.some(e => symbolOf(e.step))).map(([date, entries]) => {
    const temperatures = entries.map(e => e.step.data.instant.details.air_temperature)
    // A day is described by the weather around midday.
    const midday = entries
      .filter(e => symbolOf(e.step))
      .reduce((best, e) => (Math.abs(e.hour - 12) < Math.abs(best.hour - 12) ? e : best))
    return {
      date,
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      symbol: midday.step.data.next_6_hours?.summary.symbol_code ?? symbolOf(midday.step),
      rainMm: entries.reduce((sum, e) => sum + e.rain, 0),
      maxWindKmh: Math.max(...entries.map(e => e.step.data.instant.details.wind_speed)) * MS_TO_KMH,
    }
  })
}
