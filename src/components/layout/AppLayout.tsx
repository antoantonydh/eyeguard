import { Outlet } from 'react-router-dom'
import { useDetection } from '../../hooks/use-detection'
import { TopNav } from './TopNav'

const layoutStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0f1729',
  display: 'flex',
  flexDirection: 'column',
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}

export function AppLayout() {
  const detection = useDetection()

  const handleToggleTracking = () => {
    if (detection.isTracking) {
      detection.stopCamera()
    } else {
      detection.startCamera()
    }
  }

  return (
    <div style={layoutStyle}>
      <TopNav
        isTrackingActive={detection.isTracking}
        onToggleTracking={handleToggleTracking}
      />
      <main style={contentStyle}>
        <Outlet />
      </main>
    </div>
  )
}
