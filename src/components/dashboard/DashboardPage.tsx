import type { FacePresence } from '../../types'
import type { CameraDevice } from '../../hooks/use-camera'
import { StatusBanner } from './StatusBanner'
import { BlinkRateChart } from './BlinkRateChart'
import type { BlinkRateEntry } from './BlinkRateChart'
import { DailyScore } from './DailyScore'
import { SessionTimeline } from './SessionTimeline'
import type { Segment } from './SessionTimeline'
import { CameraStatusBar } from './CameraStatusBar'
import { DebugPanel } from './DebugPanel'

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
  stream?: MediaStream | null
  isStaring?: boolean
  secondsSinceLastBlink?: number
  totalBlinks?: number
  facePresence?: FacePresence
  cameraDevices?: CameraDevice[]
  selectedCameraId?: string
  onSwitchCamera?: (deviceId: string) => void
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
  stream = null,
  isStaring = false,
  secondsSinceLastBlink = 0,
  totalBlinks = 0,
  facePresence = 'absent',
  cameraDevices = [],
  selectedCameraId = '',
  onSwitchCamera,
  onCameraPause,
  onRecalibrate,
}: DashboardPageProps) {
  return (
    <div style={pageStyle}>
      <StatusBanner blinkRate={blinkRate} minutesUntilBreak={minutesUntilBreak} facePresence={facePresence} />

      <CameraStatusBar
        isActive={cameraActive}
        confidence={cameraConfidence}
        wearsGlasses={wearsGlasses}
        fps={cameraFps}
        totalBlinks={totalBlinks}
        blinkRate={blinkRate}
        facePresence={facePresence}
        devices={cameraDevices}
        selectedDeviceId={selectedCameraId}
        onSwitchCamera={onSwitchCamera}
        onPause={onCameraPause}
        onRecalibrate={onRecalibrate}
      />

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

      <DebugPanel
        stream={stream}
        blinkRate={blinkRate}
        confidence={cameraConfidence}
        isStaring={isStaring}
        secondsSinceLastBlink={secondsSinceLastBlink}
        totalBlinks={totalBlinks}
        facePresence={facePresence}
      />
    </div>
  )
}
