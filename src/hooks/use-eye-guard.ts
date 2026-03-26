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
const MAX_CHART_POINTS = 20 // keep last 20 data points on screen

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useEyeGuard() {
  const { settings, profile, loading: settingsLoading, isCalibrated, updateSettings, reload: reloadSettings } = useSettings()
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
    videoRef,
    camera.stream,
    settings,
    baselineEAR,
  )

  const alerts = useAlerts({
    blinkRate: detection.blinkRate,
    isStaring: detection.isStaring,
    secondsSinceLastBlink: detection.secondsSinceLastBlink,
    lowBlinkDurationSeconds: detection.lowBlinkDurationSeconds,
    facePresence: detection.facePresence,
    settings,
    isTracking: detection.isTracking,
  })

  // Reset break timer only when face returns after genuinely being away
  // (not on initial startup where absent→present is the normal first transition)
  const prevFacePresenceRef = useRef(detection.facePresence)
  const hasBeenPresentRef = useRef(false)
  useEffect(() => {
    const prev = prevFacePresenceRef.current
    prevFacePresenceRef.current = detection.facePresence

    if (detection.facePresence === 'present') {
      if (prev === 'absent' && hasBeenPresentRef.current) {
        // Genuine return: was present before, went absent, now back
        alerts.resetBreakTimer()
      }
      hasBeenPresentRef.current = true
    }
  }, [detection.facePresence, alerts])

  // Load today's saved stats from IndexedDB on mount
  const [savedDailyStats, setSavedDailyStats] = useState<{
    breaksTaken: number
    breaksSkipped: number
    stareAlerts: number
    totalScreenTime: number
    avgBlinkRate: number
    score: number
    totalBlinks: number
  } | null>(null)

  useEffect(() => {
    if (settingsLoading) return
    async function loadToday() {
      const stats = await dailyStatsRepo.getByDate(todayString())
      if (!stats) return
      // Count today's total blinks from blink_events
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const events = await blinkEventRepo.getByTimeRange(startOfDay, new Date())
      setSavedDailyStats({
        breaksTaken: stats.breaksTaken,
        breaksSkipped: stats.breaksSkipped,
        stareAlerts: stats.stareAlerts,
        totalScreenTime: stats.totalScreenTime,
        avgBlinkRate: stats.avgBlinkRate,
        score: stats.score,
        totalBlinks: events.length,
      })
    }
    loadToday()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading])

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

      // Accumulate into today's daily stats (not replace)
      const existing = await dailyStatsRepo.getByDate(todayString())
      await dailyStatsRepo.upsert(todayString(), {
        totalScreenTime: (existing?.totalScreenTime ?? 0) + sessionMinutes,
        avgBlinkRate: detection.blinkRate > 0 ? detection.blinkRate : (existing?.avgBlinkRate ?? 0),
        breaksTaken: (existing?.breaksTaken ?? 0) + alerts.breaksTaken,
        breaksSkipped: (existing?.breaksSkipped ?? 0) + (alerts.breaksOffered - alerts.breaksTaken),
        stareAlerts: (existing?.stareAlerts ?? 0) + detection.stareAlerts,
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
      // On tab hide: only save to DB on actual page unload, not tab switch
      // Detection pauses automatically (rAF stops), but session stays alive
      if (document.visibilityState === 'hidden') {
        // Save current stats to DB without ending the session ID
        // so data isn't lost if the user closes mid-session
        void dailyStatsRepo.getByDate(todayString()).then(async (existing) => {
          const sessionMinutes = sessionStartRef.current
            ? Math.round((Date.now() - sessionStartRef.current.getTime()) / 60000)
            : 0
          await dailyStatsRepo.upsert(todayString(), {
            totalScreenTime: (existing?.totalScreenTime ?? 0) + sessionMinutes,
            avgBlinkRate: detection.blinkRate > 0 ? detection.blinkRate : (existing?.avgBlinkRate ?? 0),
            breaksTaken: (existing?.breaksTaken ?? 0) + alerts.breaksTaken,
            breaksSkipped: (existing?.breaksSkipped ?? 0) + (alerts.breaksOffered - alerts.breaksTaken),
            stareAlerts: (existing?.stareAlerts ?? 0) + detection.stareAlerts,
            score: calculateScore({
              avgBlinkRate: detection.blinkRate,
              breaksTaken: alerts.breaksTaken,
              breaksOffered: alerts.breaksOffered,
              stareAlerts: detection.stareAlerts,
              blinkThreshold: settings.blinkThreshold,
            }),
          })
        })
      }
      // No action on visibility restore — detection resumes automatically via rAF
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
    if (id === null || detection.facePresence !== 'present' || detection.totalBlinks <= lastRecordedBlinksRef.current) return
    lastRecordedBlinksRef.current = detection.totalBlinks
    blinkEventRepo.recordBlink(id, baselineEAR).catch(() => {
      // Non-critical
    })
  }, [detection.totalBlinks, detection.facePresence, baselineEAR])

  // Chart data: one entry per chartInterval seconds
  const chartDataRef = useRef<BlinkRateEntry[]>([])
  const [chartData, setChartData] = useState<BlinkRateEntry[]>([])
  const blinkRateRef = useRef(0)
  const hasFirstDataPointRef = useRef(false)

  // Load today's historical chart + timeline data from IndexedDB on mount
  useEffect(() => {
    if (settingsLoading) return
    async function loadHistoricalData() {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const now = new Date()

      const events = await blinkEventRepo.getByTimeRange(startOfDay, now)
      if (events.length === 0) return

      const intervalMs = settings.chartInterval * 1000
      const blinkThreshold = settings.blinkThreshold

      // Group blink events into chartInterval buckets
      const buckets = new Map<number, number>()
      for (const event of events) {
        const t = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp)
        const bucket = Math.floor(t.getTime() / intervalMs) * intervalMs
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
      }

      const blinksPerMinuteScale = 60 / settings.chartInterval
      const sortedBuckets = Array.from(buckets.entries()).sort(([a], [b]) => a - b)

      // Build chart entries
      const entries: BlinkRateEntry[] = sortedBuckets
        .slice(-MAX_CHART_POINTS)
        .map(([ts, count]) => ({
          time: new Date(ts),
          rate: Math.round(count * blinksPerMinuteScale),
        }))

      if (entries.length > 0) {
        chartDataRef.current = entries
        setChartData(entries)
        hasFirstDataPointRef.current = true
      }

      // Build timeline segments from per-minute blink rates
      const ONE_MIN_MS = 60_000
      const minuteBuckets = new Map<number, number>()
      for (const event of events) {
        const t = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp)
        const min = Math.floor(t.getTime() / ONE_MIN_MS) * ONE_MIN_MS
        minuteBuckets.set(min, (minuteBuckets.get(min) ?? 0) + 1)
      }

      const sortedMinutes = Array.from(minuteBuckets.entries()).sort(([a], [b]) => a - b)
      const segments: Segment[] = []
      let currentType: Segment['type'] | null = null
      let currentDuration = 0

      for (const [, count] of sortedMinutes) {
        const segType: Segment['type'] = count >= blinkThreshold ? 'healthy' : 'low-blink'
        if (segType === currentType) {
          currentDuration++
        } else {
          if (currentType !== null) segments.push({ type: currentType, durationMinutes: currentDuration })
          currentType = segType
          currentDuration = 1
        }
      }
      if (currentType !== null) segments.push({ type: currentType, durationMinutes: currentDuration })

      if (segments.length > 0) {
        segmentsRef.current = segments
        setTimelineSegments(segments)
      }
    }

    loadHistoricalData()
  }, [settingsLoading, settings.chartInterval, settings.blinkThreshold])

  // Keep a fresh reference to blinkRate for the interval callback
  // Also update chart immediately when blinkRate first becomes non-zero
  useEffect(() => {
    blinkRateRef.current = detection.blinkRate

    // Add first data point as soon as we get a real reading (append to historical, don't replace)
    if (detection.blinkRate > 0 && !hasFirstDataPointRef.current && detection.isTracking) {
      hasFirstDataPointRef.current = true
      const entry: BlinkRateEntry = { time: new Date(), rate: detection.blinkRate }
      chartDataRef.current = [...chartDataRef.current.slice(-MAX_CHART_POINTS + 1), entry]
      setChartData([...chartDataRef.current])
    }
    if (!detection.isTracking) {
      hasFirstDataPointRef.current = false
    }
  }, [detection.blinkRate, detection.isTracking])

  useEffect(() => {
    if (!detection.isTracking) return

    const intervalMs = settings.chartInterval * 1000
    // Don't reset chart — keep historical data and append to it

    const interval = setInterval(() => {
      const rate = blinkRateRef.current
      // Only record when face is present and we have actual data
      if (rate > 0) {
        const entry: BlinkRateEntry = { time: new Date(), rate }
        chartDataRef.current = [...chartDataRef.current.slice(-MAX_CHART_POINTS + 1), entry]
        setChartData([...chartDataRef.current])
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [detection.isTracking, settings.chartInterval])

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
    reloadSettings,
    savedDailyStats,
  }
}
