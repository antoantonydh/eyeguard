interface Props {
  onStart: () => void
}

export function ReadyStep({ onStart }: Props) {
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

  const descriptionStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '16px',
    lineHeight: 1.6,
    margin: 0,
  }

  const buttonStyle: React.CSSProperties = {
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 40px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Checkmark icon */}
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 11.5 14.5 16 9.5" />
        </svg>

        <h1 style={titleStyle}>You're all set!</h1>

        <p style={descriptionStyle}>
          EyeGuard is calibrated and ready to protect your eyes. It will monitor your
          blink rate and remind you to take breaks, keeping eye fatigue at bay.
        </p>

        <button style={buttonStyle} onClick={onStart}>
          Start Tracking
        </button>
      </div>
    </div>
  )
}
