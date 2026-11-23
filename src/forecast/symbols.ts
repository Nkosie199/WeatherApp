export interface Condition {
  icon: string
  label: string
}

const SKY: Record<string, Condition> = {
  clearsky: { icon: '☀️', label: 'Clear' },
  fair: { icon: '🌤️', label: 'Fair' },
  partlycloudy: { icon: '⛅', label: 'Partly cloudy' },
  cloudy: { icon: '☁️', label: 'Cloudy' },
  fog: { icon: '🌫️', label: 'Fog' },
}
const NIGHT_ICONS: Record<string, string> = { clearsky: '🌙', fair: '🌙' }
const PRECIPITATION_ICONS = { rain: '🌧️', showers: '🌦️', sleet: '🌨️', snow: '❄️', thunder: '⛈️' }
const UNKNOWN: Condition = { icon: '🌡️', label: 'Unknown' }

// e.g. "lightrainshowersandthunder"; MET spells some light codes "lights...".
const PRECIPITATION = /^(lights?|heavy)?(rain|sleet|snow)(showers)?(andthunder)?$/

/** An icon and a plain label for a MET symbol code such as "partlycloudy_day" or "heavyrainandthunder". */
export function conditionFor(symbolCode: string): Condition {
  const [base, time] = symbolCode.split('_')
  const sky = SKY[base]
  if (sky) return time === 'night' && NIGHT_ICONS[base] ? { ...sky, icon: NIGHT_ICONS[base] } : sky

  const match = PRECIPITATION.exec(base)
  if (!match) return UNKNOWN
  const [, intensity, kind, showers, thunder] = match
  const strength = intensity ? (intensity.startsWith('light') ? 'Light' : 'Heavy') : ''
  const label = [strength, kind, showers && 'showers', thunder && 'and thunder'].filter(Boolean).join(' ')
  return { icon: PRECIPITATION_ICONS[iconKey(kind, Boolean(showers), Boolean(thunder))], label: capitalise(label) }
}

function iconKey(kind: string, showers: boolean, thunder: boolean): keyof typeof PRECIPITATION_ICONS {
  if (thunder) return 'thunder'
  if (kind === 'rain') return showers ? 'showers' : 'rain'
  return kind === 'snow' ? 'snow' : 'sleet'
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
