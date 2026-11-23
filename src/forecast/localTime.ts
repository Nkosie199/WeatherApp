/** Calendar date ("2026-11-23") and hour (0-23) of an instant, in a place's own time zone. */
export function localParts(isoTime: string, timeZone: string): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(isoTime))
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return { date: `${part('year')}-${part('month')}-${part('day')}`, hour: Number(part('hour')) }
}

export const formatHour = (isoTime: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-ZA', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(isoTime))

/** "Today", "Tomorrow", or a short weekday and date, for a local calendar date. */
export function formatDay(date: string, today: string): string {
  if (date === today) return 'Today'
  if (date === addDays(today, 1)) return 'Tomorrow'
  return new Intl.DateTimeFormat('en-ZA', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(`${date}T12:00:00Z`))
}

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}
