import { useState, useEffect, useRef, useCallback } from 'react'
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
}

export function useDetection(
  videoElement: HTMLVideoElement | null,
  stream: MediaStream | null,
  settings: Settings,
  baselineEAR: number,
) {
  const [state, setState] = useState<DetectionState>({
    blinkRate: 0, isStaring: false, secondsSinceLastBlink: 0,
    confidence: 0, isTracking: false, totalBlinks: 0, stareAlerts: 0,
  })

  const trackerRef = useRef<FaceTracker | null>(null)
  const detectorRef = useRef<BlinkDetector | null>(null)
  const rafRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const stareAlertCountRef = useRef(0)
  const wasStaringRef = useRef(false)

  const startTracking = useCallback(async () => {
    if (!videoElement || !stream) return
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
        setState({
          blinkRate: detector.blinkRate, isStaring,
          secondsSinceLastBlink: detector.secondsSinceLastBlink,
          confidence: result.confidence, isTracking: true,
          totalBlinks: detector.totalBlinks, stareAlerts: stareAlertCountRef.current,
        })
      }
      rafRef.current = requestAnimationFrame(processFrame)
    }
    rafRef.current = requestAnimationFrame(processFrame)
  }, [videoElement, stream, settings.cameraFps, settings.stareDelay, baselineEAR])

  const stopTracking = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    trackerRef.current?.destroy()
    detectorRef.current?.reset()
    setState(prev => ({ ...prev, isTracking: false }))
  }, [])

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current); trackerRef.current?.destroy() }
  }, [])

  return { ...state, startTracking, stopTracking }
}
