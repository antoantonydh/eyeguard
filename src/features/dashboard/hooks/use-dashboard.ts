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
