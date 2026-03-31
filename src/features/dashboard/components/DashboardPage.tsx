import { useDetection } from '../../../hooks/use-detection'
import { useAlerts } from '../../../hooks/use-alerts'
import { useSettings } from '../../../hooks/use-settings'
import { useDashboard } from '../hooks/use-dashboard'
import { userProfileRepo } from '../../../storage/user-profile-repository'
import { calculateScore } from '../../../utils/score-calculator'
import { StatusBanner } from '../../../components/dashboard/StatusBanner'
import { BlinkRateChart } from './BlinkRateChart'
import { DailyScore } from './DailyScore'
import { SessionTimeline } from './SessionTimeline'
import { CameraStatusBar } from './CameraStatusBar'
import { DebugPanel } from './DebugPanel'

interface DashboardPageProps {
  onRecalibrate: () => void
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

export function DashboardPage({ onRecalibrate }: DashboardPageProps) {
  const detection = useDetection()
  const alerts = useAlerts()
  const { settings, profile } = useSettings()
  const { chartData, timelineSegments, savedDailyStats } = useDashboard()

  const totalBlinks = (savedDailyStats?.totalBlinks ?? 0) + detection.totalBlinks
  const breaksTaken = (savedDailyStats?.breaksTaken ?? 0) + alerts.breaksTaken
  const breaksOffered =
    (savedDailyStats?.breaksTaken ?? 0) +
    (savedDailyStats?.breaksSkipped ?? 0) +
    alerts.breaksOffered

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
    <div style={pageStyle}>
      <StatusBanner
        blinkRate={detection.blinkRate}
        minutesUntilBreak={alerts.minutesUntilBreak}
        facePresence={detection.facePresence}
        isBreakActive={alerts.isBreakActive}
        breakCountdown={alerts.alert?.type === 'break' ? (alerts.alert.countdown ?? 0) : 0}
      />

      <CameraStatusBar
        isActive={detection.cameraStatus === 'active'}
        confidence={detection.confidence}
        wearsGlasses={profile?.wearsGlasses ?? false}
        fps={settings.cameraFps}
        totalBlinks={totalBlinks}
        blinkRate={detection.blinkRate}
        facePresence={detection.facePresence}
        devices={detection.devices}
        selectedDeviceId={detection.selectedDeviceId}
        onSwitchCamera={(deviceId) => detection.switchCamera(deviceId)}
        onPause={() => detection.stopCamera()}
        onRecalibrate={handleRecalibrate}
      />

      <div style={rowStyle}>
        <BlinkRateChart data={chartData} threshold={settings.blinkThreshold} />
        <DailyScore
          score={score}
          breaksTaken={breaksTaken}
          breaksOffered={breaksOffered}
          avgBlinkRate={avgBlinkRate}
        />
      </div>

      <SessionTimeline segments={timelineSegments} />

      <DebugPanel
        stream={detection.stream}
        blinkRate={detection.blinkRate}
        confidence={detection.confidence}
        isStaring={detection.isStaring}
        secondsSinceLastBlink={detection.secondsSinceLastBlink}
        totalBlinks={totalBlinks}
        facePresence={detection.facePresence}
      />
    </div>
  )
}
