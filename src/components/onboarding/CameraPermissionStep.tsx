interface Props {
  cameraStatus: 'idle' | 'requesting' | 'active' | 'denied' | 'error'
  onAllow: () => void
  onSkip: () => void
}

export function CameraPermissionStep({ cameraStatus, onAllow, onSkip }: Props) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    textAlign: 'center',
    padding: '32px 24px',
  }

  const cardStyle: React.CSSProperties = {
    background: '#0f3460',
    borderRadius: '16px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  }

  const titleStyle: React.CSSProperties = {
    color: '#e2e8f0',
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
  }

  const privacyStyle: React.CSSProperties = {
    color: '#4ade80',
    fontSize: '14px',
    lineHeight: 1.6,
    margin: 0,
  }

  const descriptionStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '16px',
    lineHeight: 1.6,
    margin: 0,
  }

  const buttonStyle: React.CSSProperties = {
    background: '#4fc3f7',
    color: '#0a1628',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 40px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    opacity: cameraStatus === 'requesting' ? 0.7 : 1,
  }

  const fallbackButtonStyle: React.CSSProperties = {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '14px',
    cursor: 'pointer',
  }

  const errorStyle: React.CSSProperties = {
    color: '#f87171',
    fontSize: '14px',
    lineHeight: 1.5,
    background: 'rgba(248,113,113,0.1)',
    borderRadius: '8px',
    padding: '12px 16px',
    margin: 0,
  }

  const isDenied = cameraStatus === 'denied' || cameraStatus === 'error'

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>

        <h1 style={titleStyle}>Camera Access</h1>

        <p style={descriptionStyle}>
          EyeGuard needs your camera to track eye movements and detect blink patterns.
          Your video is processed locally and never leaves your device.
        </p>

        <p style={privacyStyle}>
          Your privacy is protected — all processing happens on your device. No video is recorded or transmitted.
        </p>

        {isDenied && (
          <p style={errorStyle}>
            Camera access was denied. Please allow camera access in your system settings,
            or continue without camera tracking.
          </p>
        )}

        <button
          style={buttonStyle}
          onClick={onAllow}
          disabled={cameraStatus === 'requesting'}
        >
          {cameraStatus === 'requesting' ? 'Requesting…' : 'Allow Camera'}
        </button>

        {isDenied && (
          <button style={fallbackButtonStyle} onClick={onSkip}>
            Continue without camera
          </button>
        )}
      </div>
    </div>
  )
}
