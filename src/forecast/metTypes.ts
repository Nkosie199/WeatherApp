/** The parts of MET Norway's Locationforecast 2.0 "compact" response that Weather reads. */
export interface MetForecast {
  properties: { meta: { updated_at: string }; timeseries: MetStep[] }
}

export interface MetStep {
  time: string
  data: {
    instant: { details: MetInstant }
    next_1_hours?: MetPeriod
    next_6_hours?: MetPeriod
    next_12_hours?: { summary: { symbol_code: string } }
  }
}

export interface MetInstant {
  air_temperature: number
  wind_speed: number
  relative_humidity: number
}

export interface MetPeriod {
  summary: { symbol_code: string }
  details?: { precipitation_amount?: number }
}
