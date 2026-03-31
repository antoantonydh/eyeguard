import type { FacePresence } from '../types'
import type { AlertState } from './alert-manager'

export interface AlertsDetectionInput {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  lowBlinkDurationSeconds: number
  facePresence: FacePresence
  isTracking: boolean
  totalBlinks: number
}

export interface AlertsContextValue {
  alert: AlertState | null
  isBreakActive: boolean
  minutesUntilBreak: number
  breaksOffered: number
  breaksTaken: number
  startBreak: () => void
  skipBreak: () => void
  resetBreakTimer: () => void
}
