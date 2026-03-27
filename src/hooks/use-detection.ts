import { useState, useRef, useCallback, type RefObject } from 'react'
import { FaceTracker } from '../detection/face-tracker'
import { BlinkDetector } from '../detection/blink-detector'
import type { Settings, FacePresence } from '../types'

const GRACE_PERIOD_MS = 15_000

interface DetectionState {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  confidence: number
  isTracking: boolean
  totalBlinks: number
  stareAlerts: number
  lowBlinkDurationSeconds: number
  facePresence: FacePresence
}

export function useDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  stream: MediaStream | null,
  settings: Settings,
  baselineEAR: number,
) {
  const [state, setState] = useState<DetectionState>({
    blinkRate: 0, isStaring: false, secondsSinceLastBlink: 0,
    confidence: 0, isTracking: false, totalBlinks: 0, stareAlerts: 0,
    lowBlinkDurationSeconds: 0, facePresence: 'absent',
  })

  const trackerRef = useRef<FaceTracker | null>(null)
  const detectorRef = useRef<BlinkDetector | null>(null)
  const rafRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const stareAlertCountRef = useRef(0)
  const wasStaringRef = useRef(false)
  const lowBlinkStartRef = useRef<number | null>(null)

  // Face presence tracking
  const lastFaceSeenRef = useRef<number>(Date.now())
  const presenceRef = useRef<FacePresence>('absent')

  const startTracking = useCallback(async () => {
    const videoElement = videoRef.current
    if (!videoElement || !stream) return

    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream
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
        // Face detected
        const wasAbsent = presenceRef.current === 'absent'
        lastFaceSeenRef.current = now
        presenceRef.current = 'present'

        if (wasAbsent) {
          // Returning from absent — reset stale data
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
        // No face detected — determine presence state
        const timeSinceFace = now - lastFaceSeenRef.current

        let newPresence: FacePresence
        if (timeSinceFace < GRACE_PERIOD_MS) {
          newPresence = 'grace'
        } else {
          newPresence = 'absent'
        }
        presenceRef.current = newPresence

        // When absent: freeze all counters, reset low-blink tracking
        if (newPresence === 'absent') {
          lowBlinkStartRef.current = null
          wasStaringRef.current = false
        }

        setState(prev => ({
          ...prev,
          confidence: 0,
          isTracking: true,
          facePresence: newPresence,
          // When absent, reset stare-related fields
          ...(newPresence === 'absent' ? {
            isStaring: false,
            secondsSinceLastBlink: 0,
            lowBlinkDurationSeconds: 0,
          } : {}),
        }))
      }

      rafRef.current = requestAnimationFrame(processFrame)
    }

    setState(prev => ({ ...prev, isTracking: true, facePresence: 'present' }))
    rafRef.current = requestAnimationFrame(processFrame)
  }, [videoRef, stream, settings.cameraFps, settings.stareDelay, settings.blinkThreshold, baselineEAR])

  const stopTracking = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    trackerRef.current?.destroy()
    trackerRef.current = null
    detectorRef.current?.reset()
    presenceRef.current = 'absent'
    setState(prev => ({ ...prev, isTracking: false, facePresence: 'absent' }))
  }, [])

  return { ...state, startTracking, stopTracking }
}
