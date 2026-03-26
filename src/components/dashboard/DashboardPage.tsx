import { StatusBanner } from './StatusBanner'
import { BlinkRateChart } from './BlinkRateChart'
import type { BlinkRateEntry } from './BlinkRateChart'
import { DailyScore } from './DailyScore'
import { SessionTimeline } from './SessionTimeline'
import type { Segment } from './SessionTimeline'
import { CameraStatusBar } from './CameraStatusBar'

interface DashboardPageProps {
  blinkRate?: number
  minutesUntilBreak?: number
  blinkHistory?: BlinkRateEntry[]
  blinkThreshold?: number
  score?: number
  breaksTaken?: number
  breaksOffered?: number
  avgBlinkRate?: number
  segments?: Segment[]
  cameraActive?: boolean
  cameraConfidence?: number
  wearsGlasses?: boolean
  cameraFps?: number
  onCameraPause?: () => void
  onRecalibrate?: () => void
}

const pageStyle: React.CSSProperties = {
  background: '#0f1729',
  minHeight: '100vh',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '16px',
}

export function DashboardPage({
  blinkRate = 0,
  minutesUntilBreak = 20,
  blinkHistory = [],
  blinkThreshold = 12,
  score = 0,
  breaksTaken = 0,
  breaksOffered = 0,
  avgBlinkRate = 0,
  segments = [],
  cameraActive = false,
  cameraConfidence = 0,
  wearsGlasses = false,
  cameraFps = 0,
  onCameraPause,
  onRecalibrate,
}: DashboardPageProps) {
  return (
    <div style={pageStyle}>
      <StatusBanner blinkRate={blinkRate} minutesUntilBreak={minutesUntilBreak} />

      <div style={rowStyle}>
        <BlinkRateChart data={blinkHistory} threshold={blinkThreshold} />
        <DailyScore
          score={score}
          breaksTaken={breaksTaken}
          breaksOffered={breaksOffered}
          avgBlinkRate={avgBlinkRate}
        />
      </div>

      <SessionTimeline segments={segments} />

      <CameraStatusBar
        isActive={cameraActive}
        confidence={cameraConfidence}
        wearsGlasses={wearsGlasses}
        fps={cameraFps}
        onPause={onCameraPause}
        onRecalibrate={onRecalibrate}
      />
    </div>
  )
}
