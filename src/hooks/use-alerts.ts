import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { BreakTimer } from '../alerts/break-timer'
import { determineAlert, type DetectionState } from '../alerts/alert-manager'
import type { Settings, FacePresence } from '../types'
import { sendNativeNotification } from '../utils/notifications'

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
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const BREAK_TIMER_KEY = 'eyeguard_break_timer_start'

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

    // Restore timer position from previous session if within the same day
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
      if (timerRef.current) {
        setMinutesUntilBreak(timerRef.current.minutesUntilBreak)
      }
    }, 1000)

    return () => {
      timer.stop()
      clearInterval(interval)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [isTracking, settings.breakInterval, settings.breakDuration])

  // Compute alert (pure derivation — no side effects here)
  const alert = useMemo(() => {
    const detectionState: DetectionState = {
      blinkRate, isStaring, secondsSinceLastBlink, isBreakDue, isBreakActive,
      breakCountdown, lowBlinkDurationSeconds, facePresence,
    }
    return determineAlert(detectionState, settings.blinkThreshold, settings.stareDelay)
  }, [blinkRate, isStaring, secondsSinceLastBlink, lowBlinkDurationSeconds, facePresence, isBreakDue, isBreakActive, breakCountdown, settings])

  // Send native notification when alert TYPE changes (not on every recompute)
  const prevAlertTypeRef = useRef<string | null>(null)
  useEffect(() => {
    const type = alert?.type ?? null
    if (type === prevAlertTypeRef.current) return
    prevAlertTypeRef.current = type

    if (type === 'blink' && settings.nativeNotifications && alert) {
      sendNativeNotification({
        title: '👁 Remember to Blink',
        body: alert.message,
        tag: 'eyeguard-blink',
      })
    }
  }, [alert, settings.nativeNotifications])

  const startBreak = useCallback(() => {
    const duration = settings.breakDuration
    setIsBreakActive(true)
    setIsBreakDue(false)
    setBreakCountdown(duration)
    timerRef.current?.startBreakCountdown()

    // Tick the countdown down every second
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

  const resetBreakTimer = useCallback(() => {
    timerRef.current?.reset()
    const now = Date.now()
    localStorage.setItem('eyeguard_break_timer_start', String(now))
    timerRef.current?.start(now)
    setIsBreakDue(false)
    setIsBreakActive(false)
    setBreakCountdown(0)
    setMinutesUntilBreak(settings.breakInterval)
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [settings.breakInterval])

  return { alert, startBreak, skipBreak, resetBreakTimer, minutesUntilBreak, breaksOffered, breaksTaken, isBreakActive }
}
