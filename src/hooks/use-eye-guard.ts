import { useEffect, useRef, useCallback, useState } from 'react'
import { useCamera } from './use-camera'
import { useDetection } from './use-detection'
import { useAlerts } from './use-alerts'
import { useSettings } from './use-settings'
import { sessionRepo } from '../storage/session-repository'
import { blinkEventRepo } from '../storage/blink-event-repository'
import { dailyStatsRepo } from '../storage/daily-stats-repository'
import { calculateScore } from '../storage/score-calculator'
import type { BlinkRateEntry } from '../components/dashboard/BlinkRateChart'
import type { Segment } from '../components/dashboard/SessionTimeline'

const RETENTION_DAYS = 7
const CHART_INTERVAL_MS = 10 * 60 * 1000 // 10-minute buckets

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useEyeGuard() {
  const { settings, profile, loading: settingsLoading, isCalibrated, updateSettings } = useSettings()
  const baselineEAR = profile?.baselineEAR ?? 0.25

  const camera = useCamera()
  const { videoRef } = camera

  // Attach stream to video element as it becomes available
  useEffect(() => {
    const video = videoRef.current
    if (!video || !camera.stream) return
    video.srcObject = camera.stream
    video.play().catch(() => {
      // play() rejection is benign when stream is not yet ready
    })
  }, [camera.stream, videoRef])

  const detection = useDetection(
    videoRef.current,
    camera.stream,
    settings,
    baselineEAR,
  )

  const alerts = useAlerts({
    blinkRate: detection.blinkRate,
    isStaring: detection.isStaring,
    secondsSinceLastBlink: detection.secondsSinceLastBlink,
    settings,
    isTracking: detection.isTracking,
  })

  // Session lifecycle
  const sessionIdRef = useRef<number | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

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
    try {
      await sessionRepo.endSession(id, {
        avgBlinkRate: detection.blinkRate,
        breaksOffered: alerts.breaksOffered,
        breaksTaken: alerts.breaksTaken,
        stareAlerts: detection.stareAlerts,
        blinkThreshold: settings.blinkThreshold,
      })

      // Persist daily stats
      const sessionMinutes = sessionStartRef.current
        ? Math.round((Date.now() - sessionStartRef.current.getTime()) / 60000)
        : 0

      const score = calculateScore({
        avgBlinkRate: detection.blinkRate,
        breaksTaken: alerts.breaksTaken,
        breaksOffered: alerts.breaksOffered,
        stareAlerts: detection.stareAlerts,
        blinkThreshold: settings.blinkThreshold,
      })

      await dailyStatsRepo.upsert(todayString(), {
        totalScreenTime: sessionMinutes,
        avgBlinkRate: detection.blinkRate,
        breaksTaken: alerts.breaksTaken,
        breaksSkipped: alerts.breaksOffered - alerts.breaksTaken,
        stareAlerts: detection.stareAlerts,
        score,
      })
    } catch (err) {
      console.error('Failed to end session:', err)
    }
    sessionIdRef.current = null
    sessionStartRef.current = null
  }, [
    detection.blinkRate,
    detection.stareAlerts,
    alerts.breaksOffered,
    alerts.breaksTaken,
    settings.blinkThreshold,
  ])

  // Start session on mount (after settings loaded), end on unmount / page hide
  useEffect(() => {
    if (settingsLoading) return

    startSession()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endSession()
      } else {
        startSession()
      }
    }

    const handleBeforeUnload = () => {
      endSession()
    }

    // Prune old blink events on mount
    blinkEventRepo.pruneOld(RETENTION_DAYS).catch(() => {
      // Non-critical: silent failure is acceptable
    })

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      endSession()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading])

  // Record blink events to IndexedDB when totalBlinks changes
  const lastRecordedBlinksRef = useRef(0)
  useEffect(() => {
    const id = sessionIdRef.current
    if (id === null || detection.totalBlinks <= lastRecordedBlinksRef.current) return
    lastRecordedBlinksRef.current = detection.totalBlinks
    blinkEventRepo.recordBlink(id, baselineEAR).catch(() => {
      // Non-critical
    })
  }, [detection.totalBlinks, baselineEAR])

  // Chart data: one entry per 10-minute bucket
  const chartDataRef = useRef<BlinkRateEntry[]>([])
  const lastChartBucketRef = useRef<number>(0)
  const [chartData, setChartData] = useState<BlinkRateEntry[]>([])

  useEffect(() => {
    if (!detection.isTracking) return
    const now = Date.now()
    const bucket = Math.floor(now / CHART_INTERVAL_MS) * CHART_INTERVAL_MS
    if (bucket === lastChartBucketRef.current) return
    lastChartBucketRef.current = bucket
    const entry: BlinkRateEntry = { time: new Date(bucket), rate: detection.blinkRate }
    chartDataRef.current = [...chartDataRef.current, entry]
    setChartData(chartDataRef.current)
  }, [detection.blinkRate, detection.isTracking])

  // Timeline segments
  const [timelineSegments, setTimelineSegments] = useState<Segment[]>([])
  const lastSegmentTypeRef = useRef<Segment['type'] | null>(null)
  const segmentStartRef = useRef<number>(Date.now())
  const segmentsRef = useRef<Segment[]>([])

  useEffect(() => {
    if (!detection.isTracking) return

    let currentType: Segment['type']
    if (detection.isStaring) {
      currentType = 'low-blink'
    } else if (detection.blinkRate < settings.blinkThreshold) {
      currentType = 'low-blink'
    } else {
      currentType = 'healthy'
    }

    if (lastSegmentTypeRef.current === null) {
      lastSegmentTypeRef.current = currentType
      segmentStartRef.current = Date.now()
      return
    }

    if (currentType !== lastSegmentTypeRef.current) {
      const durationMinutes = Math.max(
        1,
        Math.round((Date.now() - segmentStartRef.current) / 60000),
      )
      const newSegment: Segment = { type: lastSegmentTypeRef.current, durationMinutes }
      segmentsRef.current = [...segmentsRef.current, newSegment]
      setTimelineSegments(segmentsRef.current)
      lastSegmentTypeRef.current = currentType
      segmentStartRef.current = Date.now()
    }
  }, [detection.isStaring, detection.blinkRate, detection.isTracking, settings.blinkThreshold])

  // Total session time in minutes
  const [totalSessionTime, setTotalSessionTime] = useState(0)
  useEffect(() => {
    if (!sessionStartRef.current) return
    const interval = setInterval(() => {
      const minutes = Math.round((Date.now() - (sessionStartRef.current?.getTime() ?? Date.now())) / 60000)
      setTotalSessionTime(minutes)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return {
    camera,
    detection,
    alerts,
    settings,
    profile,
    isCalibrated,
    updateSettings,
    videoRef,
    chartData,
    timelineSegments,
    totalSessionTime,
    baselineEAR,
  }
}
