import { NavLink } from 'react-router-dom'
import { usePwaContext } from '../../providers/PwaProvider'

interface TopNavProps {
  isTrackingActive: boolean
  onToggleTracking: () => void
}

const navStyle: React.CSSProperties = {
  background: '#16213e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  height: '56px',
  borderBottom: '1px solid #1e2d4d',
  flexShrink: 0,
}

const brandStyle: React.CSSProperties = {
  color: '#4fc3f7',
  fontWeight: 700,
  fontSize: '18px',
  letterSpacing: '0.5px',
  userSelect: 'none',
}

const linksStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}

const baseLinkStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'color 0.15s, background 0.15s',
}

function navLinkStyle({ isActive }: { isActive: boolean }): React.CSSProperties {
  return {
    ...baseLinkStyle,
    color: isActive ? '#4fc3f7' : '#888',
    background: isActive ? 'rgba(79, 195, 247, 0.08)' : 'transparent',
  }
}

const toggleButtonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '6px 16px',
  borderRadius: '6px',
  border: `1px solid ${isActive ? '#ef5350' : '#4fc3f7'}`,
  background: isActive ? 'rgba(239, 83, 80, 0.12)' : 'rgba(79, 195, 247, 0.12)',
  color: isActive ? '#ef5350' : '#4fc3f7',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.3px',
  transition: 'all 0.15s',
})

export function TopNav({ isTrackingActive, onToggleTracking }: TopNavProps) {
  const { canInstall, install } = usePwaContext()

  return (
    <nav style={navStyle}>
      <span style={brandStyle}>👁 EyeGuard</span>

      <div style={linksStyle}>
        <NavLink to="/" end style={navLinkStyle}>Dashboard</NavLink>
        <NavLink to="/history" style={navLinkStyle}>History</NavLink>
        <NavLink to="/settings" style={navLinkStyle}>Settings</NavLink>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {canInstall && (
          <button
            onClick={install}
            title="Install EyeGuard as a standalone app — runs in its own window so tab-switching doesn't pause tracking"
            style={{
              padding: '6px 14px', borderRadius: 6,
              border: '1px solid #22c55e', background: 'rgba(34,197,94,0.12)',
              color: '#22c55e', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ⬇ Install App
          </button>
        )}

        <button
          style={toggleButtonStyle(isTrackingActive)}
          onClick={onToggleTracking}
          aria-label={isTrackingActive ? 'Stop camera tracking' : 'Start camera tracking'}
        >
          {isTrackingActive ? 'Camera: ON' : 'Camera: OFF'}
        </button>
      </div>
    </nav>
  )
}
