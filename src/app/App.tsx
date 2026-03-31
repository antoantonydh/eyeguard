import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useCallback } from 'react'
import type { Settings } from '../types'
import { DetectionProvider } from '../providers/DetectionProvider'
import { AlertsProvider, type AlertsDetectionInput } from '../providers/AlertsProvider'
import { PwaProvider, usePwaContext } from '../providers/PwaProvider'
import { useDetection } from '../hooks/use-detection'
import { useSettings } from '../hooks/use-settings'
import { requestNotificationPermission } from '../utils/notifications'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../features/dashboard/components/DashboardPage'
import { HistoryPage } from '../features/history/components/HistoryPage'
import { SettingsPage } from '../features/settings/components/SettingsPage'
import { OverlayManager } from '../features/overlays/components/OverlayManager'
import { OnboardingFlow } from '../features/onboarding/components/OnboardingFlow'

// Layer 2: inside DetectionProvider — bridges detection state to AlertsProvider
function AppWithAlerts({
  settings,
  isCalibrated,
  reloadSettings,
}: {
  settings: Settings
  isCalibrated: boolean
  reloadSettings: () => void
}) {
  const detection = useDetection()

  const detectionInput: AlertsDetectionInput = {
    blinkRate: detection.blinkRate,
    isStaring: detection.isStaring,
    secondsSinceLastBlink: detection.secondsSinceLastBlink,
    lowBlinkDurationSeconds: detection.lowBlinkDurationSeconds,
    facePresence: detection.facePresence,
    isTracking: detection.isTracking,
    totalBlinks: detection.totalBlinks,
  }

  return (
    <AlertsProvider settings={settings} detection={detectionInput}>
      <AppRoutes settings={settings} isCalibrated={isCalibrated} reloadSettings={reloadSettings} />
    </AlertsProvider>
  )
}

// Layer 3: inside both providers — the actual UI
function AppRoutes({
  settings,
  isCalibrated,
  reloadSettings,
}: {
  settings: Settings
  isCalibrated: boolean
  reloadSettings: () => void
}) {
  useEffect(() => {
    if (settings.nativeNotifications) requestNotificationPermission()
  }, [settings.nativeNotifications])

  const handleOnboardingComplete = useCallback(() => {
    reloadSettings()
  }, [reloadSettings])

  const handleSettingsReset = useCallback(() => {
    reloadSettings()
  }, [reloadSettings])

  const handleRecalibrate = useCallback(() => {
    reloadSettings()
  }, [reloadSettings])

  if (!isCalibrated) {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
      />
    )
  }

  return (
    <>
      <BrowserRouter basename="/eyeguard">
        <PwaBanner />
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              index
              element={
                <DashboardPage
                  onRecalibrate={handleRecalibrate}
                />
              }
            />
            <Route path="history" element={<HistoryPage />} />
            <Route
              path="settings"
              element={<SettingsPage onReset={handleSettingsReset} />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
      <OverlayManager />
    </>
  )
}

function PwaBanner() {
  const { updateAvailable, applyUpdate } = usePwaContext()
  if (!updateAvailable) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: '#1e3a5f', borderBottom: '1px solid #4fc3f7',
      padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <span style={{ color: '#e2e8f0', fontSize: 14 }}>✨ A new version of EyeGuard is available</span>
      <button onClick={applyUpdate} style={{
        background: '#4fc3f7', color: '#0f1729', border: 'none',
        padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>
        Update now
      </button>
    </div>
  )
}

// Layer 1: reads settings, mounts DetectionProvider
function AppWithSettings() {
  const { settings, profile, isCalibrated, reload: reloadSettings } = useSettings()
  return (
    <DetectionProvider settings={settings} baselineEAR={profile?.baselineEAR ?? 0.25}>
      <AppWithAlerts settings={settings} isCalibrated={isCalibrated} reloadSettings={reloadSettings} />
    </DetectionProvider>
  )
}

export default function App() {
  return (
    <PwaProvider>
      <AppWithSettings />
    </PwaProvider>
  )
}
