import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { HistoryPage } from './components/history/HistoryPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { OverlayManager } from './components/overlays/OverlayManager'

export default function App() {
  const [isTracking, setIsTracking] = useState(false)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AppLayout
              isTrackingActive={isTracking}
              onToggleTracking={() => setIsTracking(prev => !prev)}
            />
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <OverlayManager alert={null} onStartBreak={() => {}} onSkipBreak={() => {}} />
    </BrowserRouter>
  )
}
