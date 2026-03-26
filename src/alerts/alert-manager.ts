export type AlertType = 'blink' | 'break' | 'stare'

export interface AlertState {
  type: AlertType
  message: string
  countdown?: number
}

export interface DetectionState {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  isBreakDue: boolean
  isBreakActive: boolean
  breakCountdown: number
}

export function determineAlert(state: DetectionState, blinkThreshold: number, stareDelay: number): AlertState | null {
  if (state.isBreakActive) return { type: 'break', message: 'Look at something 20 feet away', countdown: state.breakCountdown }
  if (state.isStaring && state.secondsSinceLastBlink >= stareDelay) return { type: 'stare', message: `Blink now — ${Math.round(state.secondsSinceLastBlink)}s without blinking` }
  if (state.isBreakDue) return { type: 'break', message: 'Time for a 20-20-20 break' }
  if (state.blinkRate < blinkThreshold && state.blinkRate > 0) return { type: 'blink', message: `Remember to blink — ${Math.round(state.blinkRate)}/min` }
  return null
}
