export const formatTemperature = (celsius: number) => `${Math.round(celsius)}°`

export const formatRain = (mm: number) => (mm < 0.1 ? '' : `${mm < 10 ? mm.toFixed(1) : Math.round(mm)} mm`)

export const formatWind = (kmh: number) => `${Math.round(kmh)} km/h`
