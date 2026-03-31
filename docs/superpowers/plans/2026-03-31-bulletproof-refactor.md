# Bulletproof-React Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/` to follow bulletproof-react conventions — feature isolation, provider-based global state, and enforced unidirectional imports.

**Architecture:** Domain files (detection algorithms, alert logic) co-locate inside `providers/`. Providers expose React contexts consumed by thin hooks in `hooks/`. Feature components in `features/*/components/` read from these hooks, never from each other.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Vitest 4, react-router-dom 7

**Spec:** `docs/superpowers/specs/2026-03-31-bulletproof-refactor-design.md`

---

## File Map

**Created:**
- `src/config/defaults.ts` — DEFAULT_SETTINGS constant
- `src/providers/DetectionProvider.tsx` — camera + detection loop + context
- `src/providers/use-camera.ts` — moved from `src/hooks/`
- `src/providers/face-tracker.ts` — moved from `src/detection/`
- `src/providers/ear-calculator.ts` — moved from `src/detection/`
- `src/providers/blink-detector.ts` — moved from `src/detection/`
- `src/providers/calibrator.ts` — moved from `src/detection/`
- `src/providers/AlertsProvider.tsx` — alerts + break timer + context
- `src/providers/alert-manager.ts` — moved from `src/alerts/`
- `src/providers/break-timer.ts` — moved from `src/alerts/`
- `src/providers/PwaProvider.tsx` — moved from `src/context/`
- `src/hooks/use-detection.ts` — thin `useContext(DetectionContext)` consumer
- `src/hooks/use-alerts.ts` — thin `useContext(AlertsContext)` consumer
- `src/utils/score-calculator.ts` — moved from `src/storage/`
- `src/features/dashboard/components/` — 6 files moved from `src/components/dashboard/`
- `src/features/dashboard/hooks/use-dashboard.ts` — session + chart + timeline (from `use-eye-guard.ts`)
- `src/features/history/components/HistoryPage.tsx` — moved
- `src/features/onboarding/components/` — 6 files moved from `src/components/onboarding/`
- `src/features/overlays/components/` — 4 files moved from `src/components/overlays/`
- `src/features/settings/components/SettingsPage.tsx` — moved
- `src/app/App.tsx` — rewritten with provider bridge pattern

**Deleted:**
- `src/hooks/use-eye-guard.ts`, `src/hooks/use-camera.ts`, `src/hooks/use-detection.ts` (old), `src/hooks/use-alerts.ts` (old)
- `src/context/` (whole folder)
- `src/detection/` (whole folder)
- `src/alerts/` (whole folder)
- `src/storage/score-calculator.ts`
- `src/components/dashboard/`, `src/components/history/`, `src/components/onboarding/`, `src/components/overlays/`, `src/components/settings/`

**Modified:**
- `src/main.tsx` — update App import path
- `src/types/index.ts` — remove DEFAULT_SETTINGS export
- `src/storage/user-profile-repository.ts` — update DEFAULT_SETTINGS import
- `src/components/layout/AppLayout.tsx` — read from useDetection() instead of props
- `src/components/layout/TopNav.tsx` — update if needed
- `tests/detection/*.test.ts` — update import paths
- `tests/storage/score-calculator.test.ts` — update import path
- `eslint.config.js` — add cross-feature import restrictions

---

## Task 1: Pre-flight — establish baseline

**Files:** (read-only)

- [ ] **Step 1: Run existing test suite**

```bash
cd /Users/a.antony.3/Projects/eyeguard
yarn vitest run
```

Expected: all tests pass. Note how many tests pass — this is your regression baseline.

- [ ] **Step 2: Run TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit checkpoint**

```bash
git add -A && git commit -m "chore: pre-refactor baseline checkpoint"
```

---

## Task 2: Extract DEFAULT_SETTINGS to config/

**Files:**
- Create: `src/config/defaults.ts`
- Modify: `src/types/index.ts`
- Modify: `src/storage/user-profile-repository.ts`

- [ ] **Step 1: Create `src/config/defaults.ts`**

```typescript
import type { Settings } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  breakInterval: 20,
  breakDuration: 20,
  blinkThreshold: 12,
  stareDelay: 20,
  cameraFps: 24,
  chartInterval: 60,
  soundEnabled: true,
  nativeNotifications: true,
}
```

- [ ] **Step 2: Remove DEFAULT_SETTINGS from `src/types/index.ts`**

Delete lines 50–59 (the `export const DEFAULT_SETTINGS` block). The file should now end after the `UserProfile` interface.

- [ ] **Step 3: Update import in `src/storage/user-profile-repository.ts`**

Read the file first, then change:
```typescript
// Before
import { DEFAULT_SETTINGS } from '../types'
// After
import { DEFAULT_SETTINGS } from '../config/defaults'
```

- [ ] **Step 4: Update import in `src/hooks/use-settings.ts`**

```typescript
// Before
import type { Settings, UserProfile } from '../types'
import { DEFAULT_SETTINGS } from '../types'
// After
import type { Settings, UserProfile } from '../types'
import { DEFAULT_SETTINGS } from '../config/defaults'
```

- [ ] **Step 5: Verify**

```bash
yarn tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/config/defaults.ts src/types/index.ts src/storage/user-profile-repository.ts src/hooks/use-settings.ts
git commit -m "refactor: extract DEFAULT_SETTINGS from types to config/defaults"
```

---

## Task 3: Move score-calculator to utils/

**Files:**
- Create: `src/utils/score-calculator.ts`
- Modify: `tests/storage/score-calculator.test.ts`

- [ ] **Step 1: Copy file to new location**

```bash
cp src/storage/score-calculator.ts src/utils/score-calculator.ts
```

The file contents are identical — no import changes needed (it has no imports).

- [ ] **Step 2: Update the test import**

In `tests/storage/score-calculator.test.ts`, change:
```typescript
// Before
import { calculateScore } from '../../src/storage/score-calculator'
// After
import { calculateScore } from '../../src/utils/score-calculator'
```

- [ ] **Step 3: Update any src files importing score-calculator**

Search for usages:
```bash
grep -r "storage/score-calculator" src/
```

In `src/hooks/use-eye-guard.ts` (line 9), change:
```typescript
// Before
import { calculateScore } from '../storage/score-calculator'
// After
import { calculateScore } from '../utils/score-calculator'
```

- [ ] **Step 4: Verify tests pass**

```bash
yarn vitest run tests/storage/score-calculator.test.ts
```

Expected: same pass count as baseline.

- [ ] **Step 5: Commit (keep old file for now — deleted in Task 15)**

```bash
git add src/utils/score-calculator.ts tests/storage/score-calculator.test.ts src/hooks/use-eye-guard.ts
git commit -m "refactor: move score-calculator from storage/ to utils/"
```

---

## Task 4: Co-locate domain files in providers/

Move the pure logic files to live alongside the providers that own them. No content changes — only file moves and import path updates within moved files.

**Files:**
- Create: `src/providers/` directory with 7 domain files

- [ ] **Step 1: Create providers directory and move detection files**

```bash
mkdir -p src/providers

# Detection domain — only DetectionProvider will use these
cp src/detection/face-tracker.ts src/providers/face-tracker.ts
cp src/detection/ear-calculator.ts src/providers/ear-calculator.ts
cp src/detection/blink-detector.ts src/providers/blink-detector.ts
cp src/detection/calibrator.ts src/providers/calibrator.ts
cp src/hooks/use-camera.ts src/providers/use-camera.ts

# Alerts domain — only AlertsProvider will use these
cp src/alerts/alert-manager.ts src/providers/alert-manager.ts
cp src/alerts/break-timer.ts src/providers/break-timer.ts
```

- [ ] **Step 2: Fix the import inside `src/providers/face-tracker.ts`**

The file imports from `./ear-calculator`. It was at `src/detection/face-tracker.ts` and imported `./ear-calculator`. The new path `src/providers/face-tracker.ts` importing `./ear-calculator` is identical — no change needed. ✓

- [ ] **Step 3: Fix the import inside `src/providers/alert-manager.ts`**

The file imports `from '../types'`. From `src/providers/alert-manager.ts`, `../types` still resolves to `src/types`. ✓ No change needed.

- [ ] **Step 4: Verify TypeScript sees new files**

```bash
yarn tsc --noEmit
```

Expected: 0 errors (old files still exist, so nothing is broken yet).

- [ ] **Step 5: Commit**

```bash
git add src/providers/
git commit -m "refactor: co-locate domain files in providers/ alongside their owning providers"
```

---

## Task 5: Create providers/PwaProvider.tsx

**Files:**
- Create: `src/providers/PwaProvider.tsx`

- [ ] **Step 1: Write `src/providers/PwaProvider.tsx`**

This is a direct copy of `src/context/PwaContext.tsx` with updated import paths:

```typescript
import { createContext, useContext, type ReactNode } from 'react'
import { usePwa, type PwaState } from '../hooks/use-pwa'

const PwaContext = createContext<PwaState | null>(null)

export function PwaProvider({ children }: { children: ReactNode }) {
  const pwa = usePwa()
  return <PwaContext.Provider value={pwa}>{children}</PwaContext.Provider>
}

export function usePwaContext(): PwaState {
  const ctx = useContext(PwaContext)
  if (!ctx) throw new Error('usePwaContext must be used inside <PwaProvider>')
  return ctx
}
```

- [ ] **Step 2: Verify**

```bash
yarn tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/providers/PwaProvider.tsx
git commit -m "refactor: add providers/PwaProvider (moved from context/PwaContext)"
```

---

## Task 6: Create providers/DetectionProvider.tsx

This is the most complex new file. It absorbs the logic from `use-detection.ts`, `use-camera.ts` (now co-located), and the camera lifecycle effects from `App.tsx`.

**Files:**
- Create: `src/providers/DetectionProvider.tsx`

- [ ] **Step 1: Write `src/providers/DetectionProvider.tsx`**

```typescript
import {
  createContext, useContext, useRef, useCallback, useState, useEffect, type ReactNode,
} from 'react'
import type { Settings, FacePresence } from '../types'
import { useCamera, type CameraDevice } from './use-camera'
import { FaceTracker } from './face-tracker'
import { BlinkDetector } from './blink-detector'

const GRACE_PERIOD_MS = 15_000

export interface DetectionContextValue {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  confidence: number
  isTracking: boolean
  totalBlinks: number
  stareAlerts: number
  lowBlinkDurationSeconds: number
  facePresence: FacePresence
  cameraStatus: 'idle' | 'requesting' | 'active' | 'denied' | 'error'
  stream: MediaStream | null
  devices: CameraDevice[]
  selectedDeviceId: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: (deviceId: string) => Promise<void>
  isStreamAlive: () => boolean
  startTracking: () => Promise<void>
  stopTracking: () => void
}

const DetectionContext = createContext<DetectionContextValue | null>(null)

export function useDetectionContext(): DetectionContextValue {
  const ctx = useContext(DetectionContext)
  if (!ctx) throw new Error('useDetectionContext must be used inside <DetectionProvider>')
  return ctx
}

interface DetectionProviderProps {
  children: ReactNode
  settings: Settings
  baselineEAR: number
}

export function DetectionProvider({ children, settings, baselineEAR }: DetectionProviderProps) {
  const camera = useCamera()
  const { videoRef } = camera

  const [state, setState] = useState({
    blinkRate: 0, isStaring: false, secondsSinceLastBlink: 0,
    confidence: 0, isTracking: false, totalBlinks: 0, stareAlerts: 0,
    lowBlinkDurationSeconds: 0, facePresence: 'absent' as FacePresence,
  })

  const trackerRef = useRef<FaceTracker | null>(null)
  const detectorRef = useRef<BlinkDetector | null>(null)
  const rafRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const stareAlertCountRef = useRef(0)
  const wasStaringRef = useRef(false)
  const lowBlinkStartRef = useRef<number | null>(null)
  const lastFaceSeenRef = useRef<number>(Date.now())
  const presenceRef = useRef<FacePresence>('absent')
  const wantTrackingRef = useRef(false)

  const startTracking = useCallback(async () => {
    const videoElement = videoRef.current
    if (!videoElement || !camera.stream) return

    if (videoElement.srcObject !== camera.stream) {
      videoElement.srcObject = camera.stream
    }
    await videoElement.play().catch(() => {})

    if (videoElement.readyState < 2) {
      await new Promise<void>((resolve) => {
        videoElement.addEventListener('loadeddata', () => resolve(), { once: true })
      })
    }

    const tracker = new FaceTracker()
    await tracker.initialize()
    trackerRef.current = tracker

    const detector = new BlinkDetector({ earThreshold: baselineEAR })
    detectorRef.current = detector

    const fpsInterval = 1000 / settings.cameraFps
    lastFaceSeenRef.current = Date.now()
    presenceRef.current = 'present'

    const processFrame = (timestamp: number) => {
      if (timestamp - lastFrameRef.current < fpsInterval) {
        rafRef.current = requestAnimationFrame(processFrame)
        return
      }
      lastFrameRef.current = timestamp

      const result = tracker.processFrame(videoElement, timestamp)
      const now = Date.now()

      if (result && result.confidence > 0) {
        const wasAbsent = presenceRef.current === 'absent'
        lastFaceSeenRef.current = now
        presenceRef.current = 'present'

        if (wasAbsent) {
          detector.reset()
          lowBlinkStartRef.current = null
          wasStaringRef.current = false
        }

        detector.processEAR(result.averageEar)
        const isStaring = detector.isStaring(settings.stareDelay)
        if (isStaring && !wasStaringRef.current) stareAlertCountRef.current++
        wasStaringRef.current = isStaring

        const isLowBlink = detector.blinkRate < settings.blinkThreshold && detector.blinkRate > 0
        if (isLowBlink) {
          if (lowBlinkStartRef.current === null) lowBlinkStartRef.current = now
        } else {
          lowBlinkStartRef.current = null
        }
        const lowBlinkDurationSeconds = lowBlinkStartRef.current !== null
          ? (now - lowBlinkStartRef.current) / 1000
          : 0

        setState({
          blinkRate: detector.blinkRate, isStaring,
          secondsSinceLastBlink: detector.secondsSinceLastBlink,
          confidence: result.confidence, isTracking: true,
          totalBlinks: detector.totalBlinks, stareAlerts: stareAlertCountRef.current,
          lowBlinkDurationSeconds, facePresence: 'present',
        })
      } else {
        const timeSinceFace = now - lastFaceSeenRef.current
        const newPresence: FacePresence = timeSinceFace < GRACE_PERIOD_MS ? 'grace' : 'absent'
        presenceRef.current = newPresence

        if (newPresence === 'absent') {
          lowBlinkStartRef.current = null
          wasStaringRef.current = false
        }

        setState(prev => ({
          ...prev, confidence: 0, isTracking: true, facePresence: newPresence,
          ...(newPresence === 'absent' ? { isStaring: false, secondsSinceLastBlink: 0, lowBlinkDurationSeconds: 0 } : {}),
        }))
      }

      rafRef.current = requestAnimationFrame(processFrame)
    }

    setState(prev => ({ ...prev, isTracking: true, facePresence: 'present' }))
    rafRef.current = requestAnimationFrame(processFrame)
  }, [videoRef, camera.stream, settings.cameraFps, settings.stareDelay, settings.blinkThreshold, baselineEAR])

  const stopTracking = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    trackerRef.current?.destroy()
    trackerRef.current = null
    detectorRef.current?.reset()
    presenceRef.current = 'absent'
    setState(prev => ({ ...prev, isTracking: false, facePresence: 'absent' }))
  }, [])

  // Auto-start when stream arrives and we want tracking
  useEffect(() => {
    if (wantTrackingRef.current && camera.stream && !state.isTracking) {
      startTracking()
    }
  }, [camera.stream, state.isTracking, startTracking])

  // Auto-start on mount when already calibrated (baselineEAR > 0)
  const hasAutoStarted = useRef(false)
  useEffect(() => {
    if (baselineEAR <= 0 || hasAutoStarted.current) return
    hasAutoStarted.current = true
    wantTrackingRef.current = true
    camera.start()
  }, [baselineEAR, camera])

  // Detect dead stream (OS sleep/wake reclaims camera)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!wantTrackingRef.current) return
      if (!camera.isStreamAlive()) {
        stopTracking()
        camera.stop()
        setTimeout(() => camera.start(), 300)
      }
    }, 5_000)
    return () => clearInterval(interval)
  }, [camera, stopTracking])

  // bfcache recovery (PWA close→reopen)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      stopTracking()
      camera.stop()
      wantTrackingRef.current = false
      setTimeout(() => {
        if (baselineEAR <= 0) return
        wantTrackingRef.current = true
        camera.start()
      }, 500)
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [camera, stopTracking, baselineEAR])

  const startCamera = useCallback(async () => {
    wantTrackingRef.current = true
    await camera.start()
  }, [camera])

  const stopCamera = useCallback(() => {
    wantTrackingRef.current = false
    stopTracking()
    camera.stop()
  }, [camera, stopTracking])

  const switchCamera = useCallback(async (deviceId: string) => {
    stopTracking()
    await camera.switchCamera(deviceId)
    await startTracking()
  }, [camera, stopTracking, startTracking])

  const value: DetectionContextValue = {
    ...state,
    cameraStatus: camera.status,
    stream: camera.stream,
    devices: camera.devices,
    selectedDeviceId: camera.selectedDeviceId,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    isStreamAlive: camera.isStreamAlive,
    startTracking,
    stopTracking,
  }

  return (
    <DetectionContext.Provider value={value}>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      {children}
    </DetectionContext.Provider>
  )
}
```

- [ ] **Step 2: Verify**

```bash
yarn tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/providers/DetectionProvider.tsx
git commit -m "feat: add DetectionProvider — camera lifecycle + ML detection context"
```

---

## Task 7: Create providers/AlertsProvider.tsx

Absorbs `use-alerts.ts` logic, `alert-manager.ts`, `break-timer.ts`, and the face-return reset from `use-eye-guard.ts`.

**Files:**
- Create: `src/providers/AlertsProvider.tsx`

- [ ] **Step 1: Write `src/providers/AlertsProvider.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify**

```bash
yarn tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/providers/AlertsProvider.tsx
git commit -m "feat: add AlertsProvider — break timer, alert computation, face-return reset"
```

---

## Task 8: Create thin consumer hooks

Replace the old logic hooks with thin `useContext` wrappers under the same names.

**Files:**
- Create: `src/hooks/use-detection.ts` (new — thin consumer)
- Create: `src/hooks/use-alerts.ts` (new — thin consumer)

- [ ] **Step 1: Write `src/hooks/use-detection.ts`**

```typescript
import { useDetectionContext, type DetectionContextValue } from '../providers/DetectionProvider'

export type { DetectionContextValue }

export function useDetection() {
  return useDetectionContext()
}
```

- [ ] **Step 2: Write `src/hooks/use-alerts.ts`**

```typescript
import { useAlertsContext, type AlertsContextValue } from '../providers/AlertsProvider'

export type { AlertsContextValue }

export function useAlerts() {
  return useAlertsContext()
}
```

- [ ] **Step 3: Verify**

```bash
yarn tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-detection.ts src/hooks/use-alerts.ts
git commit -m "refactor: add thin useDetection/useAlerts context consumer hooks"
```

---

## Task 9: Move dashboard components + create use-dashboard hook

**Files:**
- Create: `src/features/dashboard/components/` (6 files moved from `src/components/dashboard/`)
- Create: `src/features/dashboard/hooks/use-dashboard.ts`

- [ ] **Step 1: Create directories and copy dashboard components**

```bash
mkdir -p src/features/dashboard/components
mkdir -p src/features/dashboard/hooks

cp src/components/dashboard/BlinkRateChart.tsx src/features/dashboard/components/
cp src/components/dashboard/CameraStatusBar.tsx src/features/dashboard/components/
cp src/components/dashboard/DailyScore.tsx src/features/dashboard/components/
cp src/components/dashboard/DashboardPage.tsx src/features/dashboard/components/
cp src/components/dashboard/DebugPanel.tsx src/features/dashboard/components/
cp src/components/dashboard/SessionTimeline.tsx src/features/dashboard/components/
```

- [ ] **Step 2: Fix relative imports inside the copied dashboard components**

Each file moved one level deeper (`components/dashboard/` → `features/dashboard/components/`). Update any imports in these files:

In each of the 6 copied files, change `../../` paths to `../../../` for imports going above `src/`. Specifically:
- `../../hooks/` → `../../../hooks/`
- `../../storage/` → `../../../storage/`
- `../../types` → `../../../types`
- `../../utils/` → `../../../utils/`
- `../../config/` → `../../../config/`

Paths to sibling components (e.g., `./BlinkRateChart`) stay the same.

Run to discover all imports needing changes:
```bash
grep -n "from '\.\." src/features/dashboard/components/*.tsx | grep -v "from '\.\./\."
```

Fix each one. After fixing, verify:
```bash
yarn tsc --noEmit
```

- [ ] **Step 3: Rewrite `src/features/dashboard/components/DashboardPage.tsx` to consume contexts**

DashboardPage previously received ~20 props from App.tsx. It now reads from hooks. Replace its current content with:

```typescript
import { useDetection } from '../../../hooks/use-detection'
import { useAlerts } from '../../../hooks/use-alerts'
import { useSettings } from '../../../hooks/use-settings'
import { useDashboard } from '../hooks/use-dashboard'
import { BlinkRateChart } from './BlinkRateChart'
import { CameraStatusBar } from './CameraStatusBar'
import { DailyScore } from './DailyScore'
import { DebugPanel } from './DebugPanel'
import { SessionTimeline } from './SessionTimeline'
import { userProfileRepo } from '../../../storage/user-profile-repository'
import { calculateScore } from '../../../utils/score-calculator'

interface DashboardPageProps {
  onRecalibrate: () => void
}

export function DashboardPage({ onRecalibrate }: DashboardPageProps) {
  const detection = useDetection()
  const alerts = useAlerts()
  const { settings, profile } = useSettings()
  const { chartData, timelineSegments, savedDailyStats } = useDashboard()

  const totalBlinks = (savedDailyStats?.totalBlinks ?? 0) + detection.totalBlinks
  const breaksTaken = (savedDailyStats?.breaksTaken ?? 0) + alerts.breaksTaken
  const breaksOffered =
    (savedDailyStats?.breaksTaken ?? 0) + (savedDailyStats?.breaksSkipped ?? 0) + alerts.breaksOffered

  const avgBlinkRate =
    chartData.length > 0
      ? Math.round(chartData.reduce((sum, e) => sum + e.rate, 0) / chartData.length)
      : detection.blinkRate

  const score =
    breaksOffered === 0 && !detection.isTracking
      ? (savedDailyStats?.score ?? 0)
      : calculateScore({
          avgBlinkRate: detection.blinkRate,
          breaksTaken,
          breaksOffered,
          stareAlerts: detection.stareAlerts,
          blinkThreshold: settings.blinkThreshold,
        })

  const handleRecalibrate = async () => {
    detection.stopCamera()
    await userProfileRepo.clearCalibration()
    onRecalibrate()
  }

  return (
    // Render the same JSX as before, passing props to child components.
    // Replace all former prop references with the local variables above.
    // Child components (BlinkRateChart, CameraStatusBar, etc.) keep their existing prop APIs unchanged.
    <div>
      <CameraStatusBar
        cameraStatus={detection.cameraStatus}
        confidence={detection.confidence}
        facePresence={detection.facePresence}
        wearsGlasses={profile?.wearsGlasses ?? false}
        cameraFps={settings.cameraFps}
        stream={detection.stream}
        devices={detection.devices}
        selectedCameraId={detection.selectedDeviceId}
        onSwitchCamera={detection.switchCamera}
        onPause={() => detection.stopCamera()}
        onRecalibrate={handleRecalibrate}
      />
      <DailyScore
        score={score}
        breaksTaken={breaksTaken}
        breaksOffered={breaksOffered}
        avgBlinkRate={avgBlinkRate}
        blinkThreshold={settings.blinkThreshold}
      />
      <BlinkRateChart
        data={chartData}
        blinkThreshold={settings.blinkThreshold}
        minutesUntilBreak={alerts.minutesUntilBreak}
        blinkRate={detection.blinkRate}
        isStaring={detection.isStaring}
        secondsSinceLastBlink={detection.secondsSinceLastBlink}
        totalBlinks={totalBlinks}
        isBreakActive={alerts.isBreakActive}
        breakCountdown={alerts.alert?.type === 'break' ? (alerts.alert.countdown ?? 0) : 0}
      />
      <SessionTimeline segments={timelineSegments} />
      {import.meta.env.DEV && (
        <DebugPanel
          blinkRate={detection.blinkRate}
          confidence={detection.confidence}
          facePresence={detection.facePresence}
          isTracking={detection.isTracking}
          stareAlerts={detection.stareAlerts}
        />
      )}
    </div>
  )
}
```

> **Note:** Read the original `src/components/dashboard/DashboardPage.tsx` to get the exact JSX structure and child prop names before rewriting. The code above shows the data-wiring pattern — keep the exact JSX from the original, replacing prop references with the hook-derived variables.

- [ ] **Step 4: Create `src/features/dashboard/hooks/use-dashboard.ts`**

Extracts session lifecycle, chart data, and timeline logic from `src/hooks/use-eye-guard.ts`:

```typescript
import { useEffect, useRef, useCallback, useState } from 'react'
import { useDetection } from '../../../hooks/use-detection'
import { useAlerts } from '../../../hooks/use-alerts'
import { useSettings } from '../../../hooks/use-settings'
import { sessionRepo } from '../../../storage/session-repository'
import { blinkEventRepo } from '../../../storage/blink-event-repository'
import { dailyStatsRepo } from '../../../storage/daily-stats-repository'
import { calculateScore } from '../../../utils/score-calculator'
import type { BlinkRateEntry } from '../components/BlinkRateChart'
import type { Segment } from '../components/SessionTimeline'

const RETENTION_DAYS = 7
const MAX_CHART_POINTS = 20

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useDashboard() {
  const detection = useDetection()
  const alerts = useAlerts()
  const { settings, profile, loading: settingsLoading } = useSettings()
  const baselineEAR = profile?.baselineEAR ?? 0.25

  // ── Saved daily stats ──────────────────────────────────────────────────
  const [savedDailyStats, setSavedDailyStats] = useState<{
    breaksTaken: number; breaksSkipped: number; stareAlerts: number
    totalScreenTime: number; avgBlinkRate: number; score: number; totalBlinks: number
  } | null>(null)

  useEffect(() => {
    if (settingsLoading) return
    async function loadToday() {
      const stats = await dailyStatsRepo.getByDate(todayString())
      if (!stats) return
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const events = await blinkEventRepo.getByTimeRange(startOfDay, new Date())
      setSavedDailyStats({
        breaksTaken: stats.breaksTaken, breaksSkipped: stats.breaksSkipped,
        stareAlerts: stats.stareAlerts, totalScreenTime: stats.totalScreenTime,
        avgBlinkRate: stats.avgBlinkRate, score: stats.score, totalBlinks: events.length,
      })
    }
    loadToday()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading])

  // ── Session lifecycle ──────────────────────────────────────────────────
  const sessionIdRef = useRef<number | null>(null)
  const sessionStartRef = useRef<Date | null>(null)
  const sessionStatsRef = useRef({
    totalBlinks: 0, blinkRate: 0, stareAlerts: 0,
    breaksTaken: 0, breaksOffered: 0, blinkThreshold: settings.blinkThreshold,
  })

  useEffect(() => {
    sessionStatsRef.current = {
      totalBlinks: detection.totalBlinks, blinkRate: detection.blinkRate,
      stareAlerts: detection.stareAlerts, breaksTaken: alerts.breaksTaken,
      breaksOffered: alerts.breaksOffered, blinkThreshold: settings.blinkThreshold,
    }
  }, [detection.totalBlinks, detection.blinkRate, detection.stareAlerts,
      alerts.breaksTaken, alerts.breaksOffered, settings.blinkThreshold])

  const startSession = useCallback(async () => {
    try {
      const session = await sessionRepo.startSession()
      sessionIdRef.current = session.id ?? null
      sessionStartRef.current = session.startTime
    } catch (err) {
      console.error('Failed to start session:', err)
    }
  }, [])

  const endSession = useCallback(async () => {
    const id = sessionIdRef.current
    if (id === null) return
    const { totalBlinks, stareAlerts, breaksTaken, breaksOffered, blinkThreshold } = sessionStatsRef.current
    try {
      const sessionMinutes = sessionStartRef.current
        ? Math.max(1, (Date.now() - sessionStartRef.current.getTime()) / 60000) : 1
      const sessionAvgBlinkRate = Math.round(totalBlinks / sessionMinutes)

      await sessionRepo.endSession(id, {
        avgBlinkRate: sessionAvgBlinkRate, breaksOffered, breaksTaken, stareAlerts, blinkThreshold,
      })

      const sessionMinutesRounded = Math.round(sessionMinutes)
      const score = calculateScore({ avgBlinkRate: sessionAvgBlinkRate, breaksTaken, breaksOffered, stareAlerts, blinkThreshold })
      const existing = await dailyStatsRepo.getByDate(todayString())
      const existingMinutes = existing?.totalScreenTime ?? 0
      const totalMinutes = existingMinutes + sessionMinutesRounded
      const weightedAvgBlink = totalMinutes > 0
        ? Math.round(((existing?.avgBlinkRate ?? 0) * existingMinutes + sessionAvgBlinkRate * sessionMinutesRounded) / totalMinutes)
        : sessionAvgBlinkRate

      await dailyStatsRepo.upsert(todayString(), {
        totalScreenTime: totalMinutes, avgBlinkRate: weightedAvgBlink,
        breaksTaken: (existing?.breaksTaken ?? 0) + breaksTaken,
        breaksSkipped: (existing?.breaksSkipped ?? 0) + (breaksOffered - breaksTaken),
        stareAlerts: (existing?.stareAlerts ?? 0) + stareAlerts, score,
      })
    } catch (err) {
      console.error('Failed to end session:', err)
    }
    sessionIdRef.current = null
    sessionStartRef.current = null
  }, [])

  useEffect(() => {
    if (settingsLoading) return
    startSession()

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return
      const { totalBlinks, blinkRate, stareAlerts, breaksTaken, breaksOffered, blinkThreshold } = sessionStatsRef.current
      void dailyStatsRepo.getByDate(todayString()).then(async (existing) => {
        const sessionMins = sessionStartRef.current
          ? Math.max(1, (Date.now() - sessionStartRef.current.getTime()) / 60000) : 1
        const sessionMinsRounded = Math.round(sessionMins)
        const checkpointAvg = Math.round(totalBlinks / sessionMins)
        const existingMins = existing?.totalScreenTime ?? 0
        const totalMins = existingMins + sessionMinsRounded
        const weightedAvg = totalMins > 0
          ? Math.round(((existing?.avgBlinkRate ?? 0) * existingMins + checkpointAvg * sessionMinsRounded) / totalMins)
          : checkpointAvg
        await dailyStatsRepo.upsert(todayString(), {
          totalScreenTime: totalMins, avgBlinkRate: weightedAvg,
          breaksTaken: (existing?.breaksTaken ?? 0) + breaksTaken,
          breaksSkipped: (existing?.breaksSkipped ?? 0) + (breaksOffered - breaksTaken),
          stareAlerts: (existing?.stareAlerts ?? 0) + stareAlerts,
          score: calculateScore({ avgBlinkRate: blinkRate, breaksTaken, breaksOffered, stareAlerts, blinkThreshold }),
        })
      })
    }

    blinkEventRepo.pruneOld(RETENTION_DAYS).catch(() => {})
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', endSession)

    return () => {
      endSession()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', endSession)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading])

  // Record blink events to IndexedDB
  const lastRecordedBlinksRef = useRef(0)
  useEffect(() => {
    const id = sessionIdRef.current
    if (id === null || detection.facePresence !== 'present' || detection.totalBlinks <= lastRecordedBlinksRef.current) return
    if (alerts.isBreakActive) return
    lastRecordedBlinksRef.current = detection.totalBlinks
    blinkEventRepo.recordBlink(id, baselineEAR).catch(() => {})
  }, [detection.totalBlinks, detection.facePresence, alerts.isBreakActive, baselineEAR])

  // ── Chart data ─────────────────────────────────────────────────────────
  const chartDataRef = useRef<BlinkRateEntry[]>([])
  const [chartData, setChartData] = useState<BlinkRateEntry[]>([])
  const blinkRateRef = useRef(0)
  const hasFirstDataPointRef = useRef(false)
  const isBreakActiveRef = useRef(false)
  const facePresenceRef = useRef(detection.facePresence)

  useEffect(() => {
    if (settingsLoading) return
    async function loadHistoricalData() {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const events = await blinkEventRepo.getByTimeRange(startOfDay, new Date())
      if (events.length === 0) return

      const intervalMs = settings.chartInterval * 1000
      const buckets = new Map<number, number>()
      for (const event of events) {
        const t = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp)
        const bucket = Math.floor(t.getTime() / intervalMs) * intervalMs
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
      }
      const blinksPerMinuteScale = 60 / settings.chartInterval
      const entries: BlinkRateEntry[] = Array.from(buckets.entries())
        .sort(([a], [b]) => a - b)
        .slice(-MAX_CHART_POINTS)
        .map(([ts, count]) => ({ time: new Date(ts), rate: Math.round(count * blinksPerMinuteScale) }))

      if (entries.length > 0) {
        chartDataRef.current = entries
        setChartData(entries)
        hasFirstDataPointRef.current = true
      }

      // Timeline from per-minute buckets
      const ONE_MIN_MS = 60_000
      const minuteBuckets = new Map<number, number>()
      for (const event of events) {
        const t = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp)
        const min = Math.floor(t.getTime() / ONE_MIN_MS) * ONE_MIN_MS
        minuteBuckets.set(min, (minuteBuckets.get(min) ?? 0) + 1)
      }
      const segments: Segment[] = []
      let currentType: Segment['type'] | null = null
      let currentDuration = 0
      for (const [, count] of Array.from(minuteBuckets.entries()).sort(([a], [b]) => a - b)) {
        const segType: Segment['type'] = count >= settings.blinkThreshold ? 'healthy' : 'low-blink'
        if (segType === currentType) { currentDuration++ }
        else {
          if (currentType !== null) segments.push({ type: currentType, durationMinutes: currentDuration })
          currentType = segType; currentDuration = 1
        }
      }
      if (currentType !== null) segments.push({ type: currentType, durationMinutes: currentDuration })
      if (segments.length > 0) { segmentsRef.current = segments; setTimelineSegments(segments) }
    }
    loadHistoricalData()
  }, [settingsLoading, settings.chartInterval, settings.blinkThreshold])

  useEffect(() => {
    blinkRateRef.current = detection.blinkRate
    isBreakActiveRef.current = alerts.isBreakActive
    facePresenceRef.current = detection.facePresence

    if (detection.blinkRate > 0 && !hasFirstDataPointRef.current && detection.isTracking && !alerts.isBreakActive && detection.facePresence === 'present') {
      hasFirstDataPointRef.current = true
      const entry: BlinkRateEntry = { time: new Date(), rate: detection.blinkRate }
      chartDataRef.current = [...chartDataRef.current.slice(-MAX_CHART_POINTS + 1), entry]
      setChartData([...chartDataRef.current])
    }
    if (!detection.isTracking) hasFirstDataPointRef.current = false
  }, [detection.blinkRate, detection.isTracking, detection.facePresence, alerts.isBreakActive])

  useEffect(() => {
    if (!detection.isTracking) return
    const intervalMs = settings.chartInterval * 1000
    const interval = setInterval(() => {
      const rate = blinkRateRef.current
      if (rate > 0 && !isBreakActiveRef.current && facePresenceRef.current === 'present') {
        const entry: BlinkRateEntry = { time: new Date(), rate }
        chartDataRef.current = [...chartDataRef.current.slice(-MAX_CHART_POINTS + 1), entry]
        setChartData([...chartDataRef.current])
      }
    }, intervalMs)
    return () => clearInterval(interval)
  }, [detection.isTracking, settings.chartInterval])

  // ── Timeline segments ──────────────────────────────────────────────────
  const [timelineSegments, setTimelineSegments] = useState<Segment[]>([])
  const lastSegmentTypeRef = useRef<Segment['type'] | null>(null)
  const segmentStartRef = useRef<number>(Date.now())
  const segmentsRef = useRef<Segment[]>([])

  useEffect(() => {
    if (!detection.isTracking) return
    let currentType: Segment['type']
    if (detection.facePresence !== 'present') currentType = 'away'
    else if (alerts.isBreakActive) currentType = 'break'
    else if (detection.isStaring || detection.blinkRate < settings.blinkThreshold) currentType = 'low-blink'
    else currentType = 'healthy'

    if (lastSegmentTypeRef.current === null) {
      lastSegmentTypeRef.current = currentType; segmentStartRef.current = Date.now(); return
    }
    if (currentType !== lastSegmentTypeRef.current) {
      const durationMinutes = Math.max(1, Math.round((Date.now() - segmentStartRef.current) / 60000))
      segmentsRef.current = [...segmentsRef.current, { type: lastSegmentTypeRef.current, durationMinutes }]
      setTimelineSegments(segmentsRef.current)
      lastSegmentTypeRef.current = currentType; segmentStartRef.current = Date.now()
    }
  }, [alerts.isBreakActive, detection.facePresence, detection.isStaring, detection.blinkRate, detection.isTracking, settings.blinkThreshold])

  return { chartData, timelineSegments, savedDailyStats }
}
```

- [ ] **Step 5: Verify**

```bash
yarn tsc --noEmit
```

Expected: 0 errors (old files still exist so nothing is broken).

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/
git commit -m "refactor: add features/dashboard — components + use-dashboard hook"
```

---

## Task 10: Move history and onboarding features

**Files:**
- Create: `src/features/history/components/HistoryPage.tsx`
- Create: `src/features/onboarding/components/` (6 files)

- [ ] **Step 1: Copy history feature**

```bash
mkdir -p src/features/history/components
cp src/components/history/HistoryPage.tsx src/features/history/components/
```

Update relative imports inside the copied file (depth increases by one level):
- `../../storage/` → `../../../storage/`
- `../../types` → `../../../types`
- `../../utils/` → `../../../utils/`

- [ ] **Step 2: Copy onboarding feature**

```bash
mkdir -p src/features/onboarding/components

cp src/components/onboarding/CalibrationStep.tsx src/features/onboarding/components/
cp src/components/onboarding/CameraPermissionStep.tsx src/features/onboarding/components/
cp src/components/onboarding/GlassesCheckStep.tsx src/features/onboarding/components/
cp src/components/onboarding/OnboardingFlow.tsx src/features/onboarding/components/
cp src/components/onboarding/ReadyStep.tsx src/features/onboarding/components/
cp src/components/onboarding/WelcomeStep.tsx src/features/onboarding/components/
```

Update relative imports (same depth shift as above).

- [ ] **Step 3: Update onboarding components to consume DetectionContext**

`CameraPermissionStep` and `CalibrationStep` currently receive camera-related props. They should now call `useDetection()` internally instead:

In `src/features/onboarding/components/CameraPermissionStep.tsx`:
- Add `import { useDetection } from '../../../hooks/use-detection'`
- Remove camera props from the component signature
- Get `cameraStatus` and `onStartCamera` from `useDetection()`

In `src/features/onboarding/components/CalibrationStep.tsx`:
- Add `import { useDetection } from '../../../hooks/use-detection'`
- Remove `stream` and camera props from the component signature
- Get `stream`, `videoRef` from `useDetection()`

In `src/features/onboarding/components/OnboardingFlow.tsx`:
- Remove camera-related props from its signature (keep only `onComplete`)
- Stop passing camera props down to `CameraPermissionStep` and `CalibrationStep` (they now read from context)

> **Note:** Read each original file first to see its exact prop interface, then make the minimal changes to remove camera props and replace with `useDetection()` calls.

- [ ] **Step 4: Verify**

```bash
yarn tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/history/ src/features/onboarding/
git commit -m "refactor: add features/history and features/onboarding — move components, consume DetectionContext"
```

---

## Task 11: Move overlays and settings features

**Files:**
- Create: `src/features/overlays/components/` (4 files)
- Create: `src/features/settings/components/SettingsPage.tsx`

- [ ] **Step 1: Copy overlays feature**

```bash
mkdir -p src/features/overlays/components

cp src/components/overlays/BlinkReminder.tsx src/features/overlays/components/
cp src/components/overlays/BreakOverlay.tsx src/features/overlays/components/
cp src/components/overlays/OverlayManager.tsx src/features/overlays/components/
cp src/components/overlays/StareAlert.tsx src/features/overlays/components/
```

Update relative imports (depth shift: `../../` → `../../../`).

Update `OverlayManager.tsx` to consume `useAlerts()` internally instead of receiving alert props. Read the original first to see its current props, then:
- Add `import { useAlerts } from '../../../hooks/use-alerts'`
- Remove alert props from the signature
- Call `useAlerts()` to get `alert`, `startBreak`, `skipBreak`

The `soundEnabled` setting: get from `import { useSettings } from '../../../hooks/use-settings'` → `useSettings().settings.soundEnabled`.

- [ ] **Step 2: Copy settings feature**

```bash
mkdir -p src/features/settings/components
cp src/components/settings/SettingsPage.tsx src/features/settings/components/
```

Update relative imports (depth shift). `SettingsPage` keeps its `onReset` prop — App.tsx passes a reset handler through the Route element.

Update `SettingsPage` to call `useDetection()` for camera stop instead of receiving it as a prop:
- Add `import { useDetection } from '../../../hooks/use-detection'`
- On reset: call `detection.stopCamera()` internally, then call the `onReset` prop

- [ ] **Step 3: Update AppLayout to consume DetectionContext**

`src/components/layout/AppLayout.tsx` currently receives `isTrackingActive` and `onToggleTracking` as props. Read the file, then update it to:
- Add `import { useDetection } from '../../hooks/use-detection'`
- Remove those props from the interface
- Get `isTracking`, `startCamera`, `stopCamera` from `useDetection()` directly

- [ ] **Step 4: Verify**

```bash
yarn tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/features/overlays/ src/features/settings/ src/components/layout/
git commit -m "refactor: add features/overlays and features/settings — move components, consume contexts"
```

---

## Task 12: Rewrite app/App.tsx

**Files:**
- Create: `src/app/App.tsx` (replace the root `src/App.tsx`)

- [ ] **Step 1: Create `src/app/` directory and write new App.tsx**

```bash
mkdir -p src/app
```

Write `src/app/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useCallback } from 'react'
import type { Settings } from '../types'
import { DetectionProvider } from '../providers/DetectionProvider'
import { AlertsProvider, type AlertsDetectionInput } from '../providers/AlertsProvider'
import { PwaProvider, usePwaContext } from '../providers/PwaProvider'
import { useDetection } from '../hooks/use-detection'
import { useSettings } from '../hooks/use-settings'
import { requestNotificationPermission } from '../utils/notifications'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../features/dashboard/components/DashboardPage'
import { HistoryPage } from '../features/history/components/HistoryPage'
import { SettingsPage } from '../features/settings/components/SettingsPage'
import { OverlayManager } from '../features/overlays/components/OverlayManager'
import { OnboardingFlow } from '../features/onboarding/components/OnboardingFlow'

// Layer 2: inside DetectionProvider — bridges detection state to AlertsProvider
function AppWithAlerts({
  settings,
  isCalibrated,
  reloadSettings,
}: {
  settings: Settings
  isCalibrated: boolean
  reloadSettings: () => void
}) {
  const detection = useDetection()

  const detectionInput: AlertsDetectionInput = {
    blinkRate: detection.blinkRate,
    isStaring: detection.isStaring,
    secondsSinceLastBlink: detection.secondsSinceLastBlink,
    lowBlinkDurationSeconds: detection.lowBlinkDurationSeconds,
    facePresence: detection.facePresence,
    isTracking: detection.isTracking,
    totalBlinks: detection.totalBlinks,
  }

  return (
    <AlertsProvider settings={settings} detection={detectionInput}>
      <AppRoutes settings={settings} isCalibrated={isCalibrated} reloadSettings={reloadSettings} />
    </AlertsProvider>
  )
}

// Layer 3: inside both providers — the actual UI
function AppRoutes({
  settings,
  isCalibrated,
  reloadSettings,
}: {
  settings: Settings
  isCalibrated: boolean
  reloadSettings: () => void
}) {
  useEffect(() => {
    if (settings.nativeNotifications) requestNotificationPermission()
  }, [settings.nativeNotifications])

  const handleOnboardingComplete = useCallback(() => {
    reloadSettings()
  }, [reloadSettings])

  const handleSettingsReset = useCallback(() => {
    reloadSettings()
  }, [reloadSettings])

  const handleRecalibrate = useCallback(() => {
    reloadSettings()
  }, [reloadSettings])

  if (!isCalibrated) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />
  }

  return (
    <>
      <BrowserRouter basename="/eyeguard">
        <PwaBanner />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage onRecalibrate={handleRecalibrate} />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage onReset={handleSettingsReset} />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <OverlayManager />
    </>
  )
}

function PwaBanner() {
  const { updateAvailable, applyUpdate } = usePwaContext()
  if (!updateAvailable) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: '#1e3a5f', borderBottom: '1px solid #4fc3f7',
      padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <span style={{ color: '#e2e8f0', fontSize: 14 }}>✨ A new version of EyeGuard is available</span>
      <button onClick={applyUpdate} style={{
        background: '#4fc3f7', color: '#0f1729', border: 'none',
        padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>
        Update now
      </button>
    </div>
  )
}

// Layer 1: reads settings, mounts DetectionProvider
function AppWithSettings() {
  const { settings, profile, isCalibrated, reload: reloadSettings } = useSettings()
  return (
    <DetectionProvider settings={settings} baselineEAR={profile?.baselineEAR ?? 0.25}>
      <AppWithAlerts settings={settings} isCalibrated={isCalibrated} reloadSettings={reloadSettings} />
    </DetectionProvider>
  )
}

export default function App() {
  return (
    <PwaProvider>
      <AppWithSettings />
    </PwaProvider>
  )
}
```

- [ ] **Step 2: Update `src/main.tsx` to import from new location**

```typescript
// Before
import App from './App'
// After
import App from './app/App'
```

- [ ] **Step 3: Verify**

```bash
yarn tsc --noEmit
```

Expected: 0 errors. If there are errors, they will point to remaining prop mismatches in feature components — fix them before proceeding.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/main.tsx
git commit -m "feat: rewrite App.tsx with three-layer provider bridge pattern"
```

---

## Task 13: Update test imports

**Files:**
- Modify: `tests/detection/blink-detector.test.ts`
- Modify: `tests/detection/ear-calculator.test.ts`
- Modify: `tests/detection/calibrator.test.ts`

- [ ] **Step 1: Update detection test imports**

In each test file, update the import source:
```typescript
// Before (example)
import { BlinkDetector } from '../../src/detection/blink-detector'
// After
import { BlinkDetector } from '../../src/providers/blink-detector'
```

```typescript
// ear-calculator.test.ts
// Before
import { calculateEAR } from '../../src/detection/ear-calculator'
// After
import { calculateEAR } from '../../src/providers/ear-calculator'
```

```typescript
// calibrator.test.ts
// Before
import { CalibrationSession } from '../../src/detection/calibrator'
// After
import { CalibrationSession } from '../../src/providers/calibrator'
```

- [ ] **Step 2: Run detection tests**

```bash
yarn vitest run tests/detection/
```

Expected: same pass count as baseline.

- [ ] **Step 3: Run full test suite**

```bash
yarn vitest run
```

Expected: same total pass count as baseline.

- [ ] **Step 4: Move component test files to mirror the new src/ structure**

The spec requires `tests/` to mirror `src/` post-refactor. Component tests currently live under `tests/components/` — they need to move to `tests/features/`:

```bash
# Check what's in the component test folders
ls tests/components/dashboard/ tests/components/overlays/

# Move to new locations mirroring features/
mkdir -p tests/features/dashboard/components
mkdir -p tests/features/overlays/components

# Move each test file (adjust filenames to match what ls shows above)
mv tests/components/dashboard/*.test.* tests/features/dashboard/components/
mv tests/components/overlays/*.test.* tests/features/overlays/components/

# Remove empty directories
rmdir tests/components/dashboard tests/components/overlays
rmdir tests/components 2>/dev/null || true  # only if now empty
```

Update import paths inside the moved test files (depth increases by one level for features vs components):
- `../../../src/components/dashboard/` → `../../../src/features/dashboard/components/`
- `../../../src/components/overlays/` → `../../../src/features/overlays/components/`

- [ ] **Step 5: Run full test suite**

```bash
yarn vitest run
```

Expected: same total pass count as Task 1 baseline.

- [ ] **Step 6: Commit**

```bash
git add tests/
git commit -m "test: update import paths and migrate component tests to features/ structure"
```

---

## Task 14: Delete old files

Old files are no longer imported anywhere. Remove them.

**Files:** All deletion targets below.

- [ ] **Step 1: Verify nothing imports from old paths**

```bash
grep -r "from '.*hooks/use-eye-guard" src/ || echo "clean"
grep -r "from '.*hooks/use-camera" src/ || echo "clean"
grep -r "from '.*context/PwaContext" src/ || echo "clean"
grep -r "from '.*alerts/alert-manager\|from '.*alerts/break-timer" src/ || echo "clean"
grep -r "from '.*detection/face-tracker\|from '.*detection/blink-detector\|from '.*detection/ear-calculator\|from '.*detection/calibrator" src/ || echo "clean"
grep -r "from '.*components/dashboard\|from '.*components/history\|from '.*components/onboarding\|from '.*components/overlays\|from '.*components/settings" src/ || echo "clean"
```

Each should print "clean". Fix any remaining references before proceeding.

- [ ] **Step 2: Delete old hooks**

```bash
rm src/hooks/use-eye-guard.ts
rm src/hooks/use-camera.ts
# Note: use-detection.ts and use-alerts.ts in hooks/ are already the NEW thin consumers
# (created in Task 8). Do NOT delete them.
```

- [ ] **Step 3: Delete old domain folders**

```bash
rm -rf src/alerts/
rm -rf src/detection/
rm -rf src/context/
```

- [ ] **Step 4: Delete old component subfolders (keep layout/)**

```bash
rm -rf src/components/dashboard/
rm -rf src/components/history/
rm -rf src/components/onboarding/
rm -rf src/components/overlays/
rm -rf src/components/settings/
```

- [ ] **Step 5: Delete old score-calculator from storage/**

```bash
rm src/storage/score-calculator.ts
```

- [ ] **Step 6: Delete root-level App.tsx (replaced by src/app/App.tsx)**

```bash
rm src/App.tsx
```

- [ ] **Step 7: Verify nothing is broken**

```bash
yarn tsc --noEmit && yarn vitest run
```

Expected: 0 TypeScript errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: delete all relocated files after verifying clean imports"
```

---

## Task 15: Add ESLint import boundaries

Enforce the "no cross-feature imports" rule to prevent future violations.

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: Read current `eslint.config.js`**

Read the file to understand its current structure before editing.

- [ ] **Step 2: Add the cross-feature restriction rule**

Add this rule to the main config object (inside the `rules` block):

```javascript
'no-restricted-imports': ['error', {
  patterns: [
    {
      group: ['*/features/dashboard/*'],
      importNames: [],
      message: 'Import from hooks/ or storage/ instead of other features.',
    },
  ],
}],
```

A simpler and more maintainable approach — add an explicit override per feature directory using flat config's `files` field:

```javascript
// Append to the exports array in eslint.config.js
{
  files: ['src/features/dashboard/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        '../overlays/*', '../history/*', '../onboarding/*', '../settings/*',
        '../../overlays/*', '../../history/*', '../../onboarding/*', '../../settings/*',
      ].map(pattern => ({ group: [pattern], message: 'Cross-feature imports forbidden. Use hooks/ instead.' })),
    }],
  },
},
{
  files: ['src/features/overlays/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        '../dashboard/*', '../history/*', '../onboarding/*', '../settings/*',
        '../../dashboard/*', '../../history/*', '../../onboarding/*', '../../settings/*',
      ].map(pattern => ({ group: [pattern], message: 'Cross-feature imports forbidden. Use hooks/ instead.' })),
    }],
  },
},
// Repeat for history, onboarding, settings features
```

- [ ] **Step 3: Verify lint passes**

```bash
yarn lint
```

Expected: 0 errors on existing code (the boundaries are already respected).

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js
git commit -m "chore: add ESLint cross-feature import boundaries"
```

---

## Task 16: Final verification

- [ ] **Step 1: Full TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Full test suite**

```bash
yarn vitest run
```

Expected: same pass count as Task 1 baseline. All tests green.

- [ ] **Step 3: Lint check**

```bash
yarn lint
```

Expected: 0 errors.

- [ ] **Step 4: Verify the directory structure matches the spec**

```bash
ls src/app/ src/components/ src/config/ src/features/ src/hooks/ src/providers/ src/storage/ src/types/ src/utils/
```

Expected output matches:
```
src/app/: App.tsx
src/components/: layout/
src/config/: defaults.ts
src/features/: dashboard/ history/ onboarding/ overlays/ settings/
src/hooks/: use-alerts.ts use-detection.ts use-pwa.ts use-settings.ts
src/providers/: AlertsProvider.tsx DetectionProvider.tsx PwaProvider.tsx alert-manager.ts blink-detector.ts break-timer.ts calibrator.ts ear-calculator.ts face-tracker.ts use-camera.ts
src/storage/: blink-event-repository.ts daily-stats-repository.ts database.ts session-repository.ts user-profile-repository.ts
src/types/: index.ts
src/utils/: format.ts notifications.ts score-calculator.ts sounds.ts
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: bulletproof-react refactor complete — verified clean build and tests"
```
