import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

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
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Pick up prompt captured early in main.tsx (fires before React mounts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const early = (window as any).__pwaInstallPrompt
    if (early) setInstallPrompt(early)

    // Also listen for future events (e.g. after navigating back)
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__pwaInstallPrompt = e
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__pwaInstallPrompt = null
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    const prompt = installPrompt as BeforeInstallPromptEvent
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  return (
    <nav style={navStyle}>
      <span style={brandStyle}>👁 EyeGuard</span>

      <div style={linksStyle}>
        <NavLink to="/" end style={navLinkStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/history" style={navLinkStyle}>
          History
        </NavLink>
        <NavLink to="/settings" style={navLinkStyle}>
          Settings
        </NavLink>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {installPrompt && !isInstalled && (
          <button
            onClick={handleInstall}
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
