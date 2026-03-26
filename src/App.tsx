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
    reloadSettings,
  } = useEyeGuard()

  const wantTrackingRef = useRef(false)
  const hasAutoStarted = useRef(false)

  // Auto-start after onboarding
  useEffect(() => {
    if (!isCalibrated || hasAutoStarted.current) return
    hasAutoStarted.current = true
    wantTrackingRef.current = true
    camera.start()
  }, [isCalibrated, camera])

  // React to stream becoming available — start detection when stream is ready and user wants tracking
  useEffect(() => {
    if (wantTrackingRef.current && camera.stream && !detection.isTracking) {
      detection.startTracking()
    }
  }, [camera.stream, detection])

  const handleToggleTracking = () => {
    if (detection.isTracking) {
      wantTrackingRef.current = false
      detection.stopTracking()
      camera.stop()
    } else {
      wantTrackingRef.current = true
      camera.start()
    }
  }

  if (!isCalibrated) {
    return (
      <>
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
        <OnboardingFlow onComplete={() => {
          hasAutoStarted.current = false
          reloadSettings()
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
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

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
                  stream={camera.stream}
                  isStaring={detection.isStaring}
                  secondsSinceLastBlink={detection.secondsSinceLastBlink}
                  totalBlinks={detection.totalBlinks}
                  isTracking={detection.isTracking}
                  onCameraPause={() => {
                    wantTrackingRef.current = false
                    detection.stopTracking()
                    camera.stop()
                  }}
                  onRecalibrate={() => {
                    detection.stopTracking()
                    camera.stop()
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
