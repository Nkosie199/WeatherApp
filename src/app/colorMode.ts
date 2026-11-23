import * as React from 'react'

export type ColorMode = 'light' | 'dark'

/** Sent by DeepDiary (and Mynger) to a framed app so it matches their light or dark mode. */
export const COLOR_MODE_MESSAGE = 'MYNGER_COLOR_MODE'

export function colorModeFrom(data: unknown): ColorMode | null {
  const message = data as { type?: unknown; mode?: unknown } | null
  if (message?.type !== COLOR_MODE_MESSAGE) return null
  return message.mode === 'light' || message.mode === 'dark' ? message.mode : null
}

const systemMode = (): ColorMode => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

/** The device's light or dark setting, until a parent page says which mode it's showing. */
export function useColorMode(): ColorMode {
  const [mode, setMode] = React.useState<ColorMode>(systemMode)

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return
      const next = colorModeFrom(event.data)
      if (next) setMode(next)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  React.useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  return mode
}
