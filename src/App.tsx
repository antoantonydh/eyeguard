import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { HistoryPage } from './components/history/HistoryPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { OverlayManager } from './components/overlays/OverlayManager'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { useEyeGuard } from './hooks/use-eye-guard'
import { requestNotificationPermission } from './utils/notifications'
import { usePwaUpdate } from './hooks/use-pwa-update'

export default function App() {
  const { updateAvailable, applyUpdate } = usePwaUpdate()
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
    savedDailyStats,
  } = useEyeGuard()

  // Combine saved (historical) data with live session data
  const totalBlinks = (savedDailyStats?.totalBlinks ?? 0) + detection.totalBlinks
  const breaksTaken = (savedDailyStats?.breaksTaken ?? 0) + alerts.breaksTaken
  const breaksOffered = (savedDailyStats?.breaksTaken ?? 0) + (savedDailyStats?.breaksSkipped ?? 0) + alerts.breaksOffered

  const wantTrackingRef = useRef(false)
  const hasAutoStarted = useRef(false)

  // Request notification permission if setting is enabled
  useEffect(() => {
    if (settings.nativeNotifications) {
      requestNotificationPermission()
    }
  }, [settings.nativeNotifications])

  // Auto-start after onboarding
  useEffect(() => {
    if (!isCalibrated || hasAutoStarted.current) return
    hasAutoStarted.current = true
    wantTrackingRef.current = true
    camera.start()
  }, [isCalibrated, camera])

  // Recover from bfcache restore (PWA close→reopen) or dead stream (system logout→login).
  // pageshow with persisted=true means the page was restored from bfcache — JS state is
  // frozen so hasAutoStarted=true and stream may be dead. Force a full reinit.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return // normal page load, not bfcache
      // Stream is dead after bfcache restore — reinitialize everything
      detection.stopTracking()
      camera.stop()
      hasAutoStarted.current = false
      wantTrackingRef.current = false
      setTimeout(() => {
        if (!isCalibrated) return
        hasAutoStarted.current = true
        wantTrackingRef.current = true
        camera.start()
      }, 500) // brief delay to let browser settle after bfcache restore
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [camera, detection, isCalibrated])

  // Detect dead stream (tracks ended by OS without bfcache — e.g. system sleep/wake).
  // Check stream health every 5s and restart if tracks have ended unexpectedly.
  useEffect(() => {
    if (!isCalibrated) return
    const interval = setInterval(() => {
      if (!wantTrackingRef.current) return
      if (!camera.isStreamAlive()) {
        // Stream died (OS reclaimed camera) — restart
        detection.stopTracking()
        camera.stop()
        setTimeout(() => camera.start(), 300)
      }
    }, 5_000)
    return () => clearInterval(interval)
  }, [isCalibrated, camera, detection])

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
        <OnboardingFlow
          cameraStatus={camera.status}
          stream={camera.stream}
          onStartCamera={camera.start}
          onComplete={() => {
            hasAutoStarted.current = false
            reloadSettings()
          }}
        />
      </>
    )
  }

  const avgBlinkRate =
    chartData.length > 0
      ? Math.round(chartData.reduce((sum, e) => sum + e.rate, 0) / chartData.length)
      : detection.blinkRate

  const score = breaksOffered === 0 && !detection.isTracking
    ? (savedDailyStats?.score ?? 0)
    : Math.round(
        (detection.blinkRate >= settings.blinkThreshold ? 40 : detection.blinkRate > 0 ? (detection.blinkRate / settings.blinkThreshold) * 40 : 40) +
        (breaksOffered === 0 ? 40 : (breaksTaken / breaksOffered) * 40) +
        (detection.stareAlerts < 5 ? 20 : Math.max(0, 20 - detection.stareAlerts)),
      )

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

      <BrowserRouter basename="/eyeguard">
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
                  breaksTaken={breaksTaken}
                  breaksOffered={breaksOffered}
                  avgBlinkRate={avgBlinkRate}
                  segments={timelineSegments}
                  cameraActive={camera.status === 'active'}
                  cameraConfidence={detection.confidence}
                  wearsGlasses={profile?.wearsGlasses ?? false}
                  cameraFps={settings.cameraFps}
                  stream={camera.stream}
                  isStaring={detection.isStaring}
                  secondsSinceLastBlink={detection.secondsSinceLastBlink}
                  totalBlinks={totalBlinks}
                  facePresence={detection.facePresence}
                  cameraDevices={camera.devices}
                  selectedCameraId={camera.selectedDeviceId}
                  onSwitchCamera={async (deviceId) => {
                    detection.stopTracking()
                    await camera.switchCamera(deviceId)
                    detection.startTracking()
                  }}
                  onCameraPause={() => {
                    wantTrackingRef.current = false
                    detection.stopTracking()
                    camera.stop()
                  }}
                  onRecalibrate={() => {
                    detection.stopTracking()
                    camera.stop()
                    window.location.href = '/'
                  }}
                />
              }
            />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>

        {updateAvailable && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
            background: '#1e3a5f', borderBottom: '1px solid #4fc3f7',
            padding: '10px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 16,
          }}>
            <span style={{ color: '#e2e8f0', fontSize: 14 }}>
              ✨ A new version of EyeGuard is available
            </span>
            <button onClick={applyUpdate} style={{
              background: '#4fc3f7', color: '#0f1729', border: 'none',
              padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Update now
            </button>
          </div>
        )}

        <OverlayManager
          alert={alerts.alert}
          soundEnabled={settings.soundEnabled}
          onStartBreak={alerts.startBreak}
          onSkipBreak={alerts.skipBreak}
        />
      </BrowserRouter>
    </>
  )
}
