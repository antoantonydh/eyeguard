import { useState, useEffect, useRef, useCallback } from 'react'
import { BreakTimer } from '../alerts/break-timer'
import { determineAlert, type AlertState, type DetectionState } from '../alerts/alert-manager'
import type { Settings } from '../types'

interface UseAlertsInput {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  settings: Settings
  isTracking: boolean
}

export function useAlerts(input: UseAlertsInput) {
  const { blinkRate, isStaring, secondsSinceLastBlink, settings, isTracking } = input
  const [alert, setAlert] = useState<AlertState | null>(null)
  const [isBreakDue, setIsBreakDue] = useState(false)
  const [isBreakActive, setIsBreakActive] = useState(false)
  const [breakCountdown, setBreakCountdown] = useState(0)
  const timerRef = useRef<BreakTimer | null>(null)

  useEffect(() => {
    if (!isTracking) return
    const timer = new BreakTimer({
      intervalMinutes: settings.breakInterval,
      breakDurationSeconds: settings.breakDuration,
      onBreakDue: () => setIsBreakDue(true),
      onBreakComplete: () => { setIsBreakActive(false); setIsBreakDue(false); setBreakCountdown(0) },
    })
    timer.start()
    timerRef.current = timer
    return () => timer.stop()
  }, [isTracking, settings.breakInterval, settings.breakDuration])

  useEffect(() => {
    const detectionState: DetectionState = {
      blinkRate, isStaring, secondsSinceLastBlink, isBreakDue, isBreakActive, breakCountdown,
    }
    const newAlert = determineAlert(detectionState, settings.blinkThreshold, settings.stareDelay)
    setAlert(newAlert)
  }, [blinkRate, isStaring, secondsSinceLastBlink, isBreakDue, isBreakActive, breakCountdown, settings])

  const startBreak = useCallback(() => { setIsBreakActive(true); setIsBreakDue(false); timerRef.current?.startBreakCountdown() }, [])
  const skipBreak = useCallback(() => { timerRef.current?.skipBreak(); setIsBreakDue(false); setIsBreakActive(false) }, [])

  const minutesUntilBreak = timerRef.current?.minutesUntilBreak ?? settings.breakInterval
  const breaksOffered = timerRef.current?.breaksOffered ?? 0
  const breaksTaken = timerRef.current?.breaksTaken ?? 0

  return { alert, startBreak, skipBreak, minutesUntilBreak, breaksOffered, breaksTaken }
}
