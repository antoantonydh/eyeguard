import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { BreakTimer } from '../alerts/break-timer'
import { determineAlert, type DetectionState } from '../alerts/alert-manager'
import type { Settings, FacePresence } from '../types'

interface UseAlertsInput {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  lowBlinkDurationSeconds: number
  facePresence: FacePresence
  settings: Settings
  isTracking: boolean
}

export function useAlerts(input: UseAlertsInput) {
  const { blinkRate, isStaring, secondsSinceLastBlink, lowBlinkDurationSeconds, facePresence, settings, isTracking } = input
  const [isBreakDue, setIsBreakDue] = useState(false)
  const [isBreakActive, setIsBreakActive] = useState(false)
  const [breakCountdown, setBreakCountdown] = useState(0)
  const [minutesUntilBreak, setMinutesUntilBreak] = useState(settings.breakInterval)
  const [breaksOffered, setBreaksOffered] = useState(0)
  const [breaksTaken, setBreaksTaken] = useState(0)
  const timerRef = useRef<BreakTimer | null>(null)

  useEffect(() => {
    if (!isTracking) return
    const timer = new BreakTimer({
      intervalMinutes: settings.breakInterval,
      breakDurationSeconds: settings.breakDuration,
      onBreakDue: () => { setIsBreakDue(true); setBreaksOffered(prev => prev + 1) },
      onBreakComplete: (taken) => {
        setIsBreakActive(false); setIsBreakDue(false); setBreakCountdown(0)
        if (taken) setBreaksTaken(prev => prev + 1)
      },
    })
    timer.start()
    timerRef.current = timer

    const interval = setInterval(() => {
      if (timerRef.current) {
        setMinutesUntilBreak(timerRef.current.minutesUntilBreak)
      }
    }, 1000)

    return () => { timer.stop(); clearInterval(interval) }
  }, [isTracking, settings.breakInterval, settings.breakDuration])

  const alert = useMemo(() => {
    const detectionState: DetectionState = {
      blinkRate, isStaring, secondsSinceLastBlink, isBreakDue, isBreakActive,
      breakCountdown, lowBlinkDurationSeconds, facePresence,
    }
    return determineAlert(detectionState, settings.blinkThreshold, settings.stareDelay)
  }, [blinkRate, isStaring, secondsSinceLastBlink, lowBlinkDurationSeconds, facePresence, isBreakDue, isBreakActive, breakCountdown, settings])

  const startBreak = useCallback(() => { setIsBreakActive(true); setIsBreakDue(false); timerRef.current?.startBreakCountdown() }, [])
  const skipBreak = useCallback(() => { timerRef.current?.skipBreak(); setIsBreakDue(false); setIsBreakActive(false) }, [])

  const resetBreakTimer = useCallback(() => {
    timerRef.current?.reset()
    timerRef.current?.start()
    setIsBreakDue(false)
    setIsBreakActive(false)
    setBreakCountdown(0)
    setMinutesUntilBreak(settings.breakInterval)
  }, [settings.breakInterval])

  return { alert, startBreak, skipBreak, resetBreakTimer, minutesUntilBreak, breaksOffered, breaksTaken }
}
