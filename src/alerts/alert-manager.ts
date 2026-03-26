export type AlertType = 'blink' | 'break' | 'stare'

export interface AlertState {
  type: AlertType
  message: string
  countdown?: number
}

import type { FacePresence } from '../types'

export interface DetectionState {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  isBreakDue: boolean
  isBreakActive: boolean
  breakCountdown: number
  lowBlinkDurationSeconds: number
  facePresence: FacePresence
}

const SUSTAINED_LOW_BLINK_SECONDS = 30
const BLINK_ALERT_COOLDOWN_MS = 60_000

let lastBlinkAlertTime = 0

export function determineAlert(state: DetectionState, blinkThreshold: number, stareDelay: number): AlertState | null {
  // No alerts when face is not present
  if (state.facePresence !== 'present') return null

  if (state.isBreakActive) return { type: 'break', message: 'Look at something 20 feet away', countdown: state.breakCountdown }
  if (state.isStaring && state.secondsSinceLastBlink >= stareDelay) return { type: 'stare', message: `Blink now — ${Math.round(state.secondsSinceLastBlink)}s without blinking` }
  if (state.isBreakDue) return { type: 'break', message: 'Time for a 20-20-20 break' }

  // Only alert for low blink rate after sustained 30+ seconds below threshold, with cooldown
  if (
    state.blinkRate < blinkThreshold &&
    state.blinkRate > 0 &&
    state.lowBlinkDurationSeconds >= SUSTAINED_LOW_BLINK_SECONDS &&
    Date.now() - lastBlinkAlertTime >= BLINK_ALERT_COOLDOWN_MS
  ) {
    lastBlinkAlertTime = Date.now()
    return { type: 'blink', message: `Your blink rate is ${Math.round(state.blinkRate)}/min (target: ${blinkThreshold}+)` }
  }

  return null
}

export function resetAlertCooldowns(): void {
  lastBlinkAlertTime = 0
}
