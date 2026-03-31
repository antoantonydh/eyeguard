interface Props {
  onAnswer: (wearsGlasses: boolean) => void
}

export function GlassesCheckStep({ onAnswer }: Props) {
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
    fontSize: '15px',
    lineHeight: 1.6,
    margin: 0,
  }

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
  }

  const yesButtonStyle: React.CSSProperties = {
    background: '#4fc3f7',
    color: '#0a1628',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 48px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  }

  const noButtonStyle: React.CSSProperties = {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '14px 48px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Glasses icon */}
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="14" r="4" />
          <circle cx="18" cy="14" r="4" />
          <path d="M2 14a4 4 0 014-4h12a4 4 0 014 4" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>

        <h1 style={titleStyle}>Do you wear glasses?</h1>

        <p style={descriptionStyle}>
          This helps EyeGuard calibrate eye tracking more accurately.
          Glasses can slightly affect how blinks are detected.
        </p>

        <div style={buttonRowStyle}>
          <button style={yesButtonStyle} onClick={() => onAnswer(true)}>
            Yes
          </button>
          <button style={noButtonStyle} onClick={() => onAnswer(false)}>
            No
          </button>
        </div>
      </div>
    </div>
  )
}
