import { useState, useRef, useCallback, type RefObject } from 'react'
import { FaceTracker } from '../detection/face-tracker'
import { BlinkDetector } from '../detection/blink-detector'
import type { Settings } from '../types'

interface DetectionState {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  confidence: number
  isTracking: boolean
  totalBlinks: number
  stareAlerts: number
  lowBlinkDurationSeconds: number
}

export function useDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  stream: MediaStream | null,
  settings: Settings,
  baselineEAR: number,
) {
  const [state, setState] = useState<DetectionState>({
    blinkRate: 0, isStaring: false, secondsSinceLastBlink: 0,
    confidence: 0, isTracking: false, totalBlinks: 0, stareAlerts: 0, lowBlinkDurationSeconds: 0,
  })

  const trackerRef = useRef<FaceTracker | null>(null)
  const detectorRef = useRef<BlinkDetector | null>(null)
  const rafRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const stareAlertCountRef = useRef(0)
  const wasStaringRef = useRef(false)
  const lowBlinkStartRef = useRef<number | null>(null)

  const startTracking = useCallback(async () => {
    const videoElement = videoRef.current
    if (!videoElement || !stream) return

    // Ensure video is playing with the stream
    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream
    }
    await videoElement.play().catch(() => {})

    // Wait for video to be ready
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

    const processFrame = (timestamp: number) => {
      if (timestamp - lastFrameRef.current < fpsInterval) {
        rafRef.current = requestAnimationFrame(processFrame)
        return
      }
      lastFrameRef.current = timestamp

      const result = tracker.processFrame(videoElement, timestamp)
      if (result && result.confidence > 0) {
        detector.processEAR(result.averageEar)
        const isStaring = detector.isStaring(settings.stareDelay)
        if (isStaring && !wasStaringRef.current) stareAlertCountRef.current++
        wasStaringRef.current = isStaring

        // Track how long blink rate has been below threshold
        const isLowBlink = detector.blinkRate < settings.blinkThreshold && detector.blinkRate > 0
        if (isLowBlink) {
          if (lowBlinkStartRef.current === null) lowBlinkStartRef.current = Date.now()
        } else {
          lowBlinkStartRef.current = null
        }
        const lowBlinkDurationSeconds = lowBlinkStartRef.current !== null
          ? (Date.now() - lowBlinkStartRef.current) / 1000
          : 0

        setState({
          blinkRate: detector.blinkRate, isStaring,
          secondsSinceLastBlink: detector.secondsSinceLastBlink,
          confidence: result.confidence, isTracking: true,
          totalBlinks: detector.totalBlinks, stareAlerts: stareAlertCountRef.current,
          lowBlinkDurationSeconds,
        })
      }
      rafRef.current = requestAnimationFrame(processFrame)
    }

    setState(prev => ({ ...prev, isTracking: true }))
    rafRef.current = requestAnimationFrame(processFrame)
  }, [videoRef, stream, settings.cameraFps, settings.stareDelay, baselineEAR])

  const stopTracking = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    trackerRef.current?.destroy()
    trackerRef.current = null
    detectorRef.current?.reset()
    setState(prev => ({ ...prev, isTracking: false }))
  }, [])

  return { ...state, startTracking, stopTracking }
}
