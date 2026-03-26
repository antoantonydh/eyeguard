import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'

interface AppLayoutProps {
  isTrackingActive: boolean
  onToggleTracking: () => void
}

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

export function AppLayout({ isTrackingActive, onToggleTracking }: AppLayoutProps) {
  return (
    <div style={layoutStyle}>
      <TopNav
        isTrackingActive={isTrackingActive}
        onToggleTracking={onToggleTracking}
      />
      <main style={contentStyle}>
        <Outlet />
      </main>
    </div>
  )
}
