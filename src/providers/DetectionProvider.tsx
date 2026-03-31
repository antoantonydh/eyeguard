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
