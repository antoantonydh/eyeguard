import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { HistoryPage } from './components/history/HistoryPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { OverlayManager } from './components/overlays/OverlayManager'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { useEyeGuard } from './hooks/use-eye-guard'

export default function App() {
  const {
    camera,
    detection,
    alerts,
    settings,
    profile,
    isCalibrated,
    videoRef,
    chartData,
    timelineSegments,
  } = useEyeGuard()

  const hasAutoStarted = useRef(false)

  // Auto-start camera and detection after onboarding completes
  useEffect(() => {
    if (!isCalibrated || hasAutoStarted.current) return
    hasAutoStarted.current = true
    camera.start().then(() => {
      detection.startTracking()
    }).catch(() => {
      // Camera start failure is handled inside useCamera (sets status to 'denied'/'error')
    })
  }, [isCalibrated, camera, detection])

  const handleToggleTracking = () => {
    if (detection.isTracking) {
      detection.stopTracking()
      camera.stop()
    } else {
      camera.start().then(() => {
        detection.startTracking()
      }).catch(() => {})
    }
  }

  if (!isCalibrated) {
    return (
      <>
        {/* Hidden video element required for calibration inside OnboardingFlow */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
        <OnboardingFlow onComplete={() => {
          // isCalibrated will flip to true after profile is saved;
          // the useEffect above will trigger auto-start.
          hasAutoStarted.current = false
        }} />
      </>
    )
  }

  const avgBlinkRate =
    chartData.length > 0
      ? Math.round(chartData.reduce((sum, e) => sum + e.rate, 0) / chartData.length)
      : detection.blinkRate

  const score = detection.isTracking
    ? Math.round(
        (detection.blinkRate >= settings.blinkThreshold ? 40 : (detection.blinkRate / settings.blinkThreshold) * 40) +
        (alerts.breaksOffered === 0 ? 40 : (alerts.breaksTaken / alerts.breaksOffered) * 40) +
        (detection.stareAlerts < 5 ? 20 : Math.max(0, 20 - detection.stareAlerts)),
      )
    : 0

  return (
    <>
      {/* Hidden video element used by the detection engine */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />

      <BrowserRouter>
        <Routes>
          <Route
            element={
              <AppLayout
                isTrackingActive={detection.isTracking}
                onToggleTracking={handleToggleTracking}
              />
            }
          >
            <Route
              index
              element={
                <DashboardPage
                  blinkRate={detection.blinkRate}
                  minutesUntilBreak={alerts.minutesUntilBreak}
                  blinkHistory={chartData}
                  blinkThreshold={settings.blinkThreshold}
                  score={score}
                  breaksTaken={alerts.breaksTaken}
                  breaksOffered={alerts.breaksOffered}
                  avgBlinkRate={avgBlinkRate}
                  segments={timelineSegments}
                  cameraActive={camera.status === 'active'}
                  cameraConfidence={detection.confidence}
                  wearsGlasses={profile?.wearsGlasses ?? false}
                  cameraFps={settings.cameraFps}
                  onCameraPause={() => {
                    detection.stopTracking()
                    camera.stop()
                  }}
                  onRecalibrate={() => {
                    detection.stopTracking()
                    camera.stop()
                    // Navigate to root to restart onboarding — profile cleared externally
                    window.location.reload()
                  }}
                />
              }
            />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>

        <OverlayManager
          alert={alerts.alert}
          onStartBreak={alerts.startBreak}
          onSkipBreak={alerts.skipBreak}
        />
      </BrowserRouter>
    </>
  )
}
