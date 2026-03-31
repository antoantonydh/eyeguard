import {
  createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode,
} from 'react'
import type { Settings, FacePresence } from '../types'
import { BreakTimer } from './break-timer'
import { determineAlert, resetAlertCooldowns, type AlertState } from './alert-manager'
import { sendNativeNotification } from '../utils/notifications'

const BREAK_TIMER_KEY = 'eyeguard_break_timer_start'

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

const AlertsContext = createContext<AlertsContextValue | null>(null)

export function useAlertsContext(): AlertsContextValue {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlertsContext must be used inside <AlertsProvider>')
  return ctx
}

interface AlertsProviderProps {
  children: ReactNode
  settings: Settings
  detection: AlertsDetectionInput
}

export function AlertsProvider({ children, settings, detection }: AlertsProviderProps) {
  const {
    blinkRate, isStaring, secondsSinceLastBlink, lowBlinkDurationSeconds,
    facePresence, isTracking,
  } = detection

  const [isBreakDue, setIsBreakDue] = useState(false)
  const [isBreakActive, setIsBreakActive] = useState(false)
  const [breakCountdown, setBreakCountdown] = useState(0)
  const [minutesUntilBreak, setMinutesUntilBreak] = useState(settings.breakInterval)
  const [breaksOffered, setBreaksOffered] = useState(0)
  const [breaksTaken, setBreaksTaken] = useState(0)
  const timerRef = useRef<BreakTimer | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Break timer lifecycle — restarts when isTracking or interval/duration settings change
  useEffect(() => {
    if (!isTracking) return

    const timer = new BreakTimer({
      intervalMinutes: settings.breakInterval,
      breakDurationSeconds: settings.breakDuration,
      onBreakDue: () => {
        setIsBreakDue(true)
        setBreaksOffered(prev => prev + 1)
        if (settings.nativeNotifications) {
          sendNativeNotification({
            title: '👁 Time for a Break',
            body: `Look at something 20 feet away for ${settings.breakDuration} seconds to rest your eyes.`,
            tag: 'eyeguard-break',
          })
        }
      },
      onBreakComplete: (taken) => {
        setIsBreakActive(false)
        setIsBreakDue(false)
        setBreakCountdown(0)
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        if (taken) setBreaksTaken(prev => prev + 1)
      },
    })

    const saved = localStorage.getItem(BREAK_TIMER_KEY)
    const savedTs = saved ? parseInt(saved, 10) : null
    const isToday = savedTs && (Date.now() - savedTs) < 24 * 60 * 60 * 1000
    if (isToday && savedTs) {
      timer.start(savedTs)
    } else {
      const now = Date.now()
      localStorage.setItem(BREAK_TIMER_KEY, String(now))
      timer.start(now)
    }
    timerRef.current = timer

    const interval = setInterval(() => {
      if (timerRef.current) setMinutesUntilBreak(timerRef.current.minutesUntilBreak)
    }, 1000)

    return () => {
      timer.stop()
      clearInterval(interval)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [isTracking, settings.breakInterval, settings.breakDuration, settings.nativeNotifications])

  // Compute active alert (pure derivation — no side effects)
  const alert = useMemo(() => {
    return determineAlert(
      { blinkRate, isStaring, secondsSinceLastBlink, isBreakDue, isBreakActive, breakCountdown, lowBlinkDurationSeconds, facePresence },
      settings.blinkThreshold,
      settings.stareDelay,
    )
  }, [blinkRate, isStaring, secondsSinceLastBlink, lowBlinkDurationSeconds, facePresence, isBreakDue, isBreakActive, breakCountdown, settings.blinkThreshold, settings.stareDelay])

  // Native notification when alert type changes
  const prevAlertTypeRef = useRef<string | null>(null)
  useEffect(() => {
    const type = alert?.type ?? null
    if (type === prevAlertTypeRef.current) return
    prevAlertTypeRef.current = type
    if (type === 'blink' && settings.nativeNotifications && alert) {
      sendNativeNotification({ title: '👁 Remember to Blink', body: alert.message, tag: 'eyeguard-blink' })
    }
  }, [alert, settings.nativeNotifications])

  // resetBreakTimer defined before the face-return effect that calls it
  const resetBreakTimer = useCallback(() => {
    timerRef.current?.reset()
    const now = Date.now()
    localStorage.setItem(BREAK_TIMER_KEY, String(now))
    timerRef.current?.start(now)
    setIsBreakDue(false)
    setIsBreakActive(false)
    setBreakCountdown(0)
    setMinutesUntilBreak(settings.breakInterval)
    resetAlertCooldowns()
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [settings.breakInterval])

  const startBreak = useCallback(() => {
    setIsBreakActive(true)
    setIsBreakDue(false)
    setBreakCountdown(settings.breakDuration)
    timerRef.current?.startBreakCountdown()
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    countdownIntervalRef.current = setInterval(() => {
      setBreakCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [settings.breakDuration])

  const skipBreak = useCallback(() => {
    timerRef.current?.skipBreak()
    setIsBreakDue(false)
    setIsBreakActive(false)
    setBreakCountdown(0)
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  // Reset break timer when face returns after genuine absence (from use-eye-guard.ts)
  // Defined after resetBreakTimer so the callback reference is stable when the effect runs.
  const prevFacePresenceRef = useRef(facePresence)
  const hasBeenPresentRef = useRef(false)
  const isBreakActiveRef = useRef(isBreakActive)
  useEffect(() => { isBreakActiveRef.current = isBreakActive }, [isBreakActive])

  useEffect(() => {
    const prev = prevFacePresenceRef.current
    prevFacePresenceRef.current = facePresence
    if (facePresence === 'present') {
      if (prev === 'absent' && hasBeenPresentRef.current && !isBreakActiveRef.current) {
        resetBreakTimer()
      }
      hasBeenPresentRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facePresence])

  const value: AlertsContextValue = {
    alert, isBreakActive, minutesUntilBreak, breaksOffered, breaksTaken,
    startBreak, skipBreak, resetBreakTimer,
  }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}
