interface Props {
  onNext: () => void
}

export function WelcomeStep({ onNext }: Props) {
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
    background: '#4fc3f7',
    color: '#0a1628',
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
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="12" rx="9" ry="5.5" />
          <circle cx="12" cy="12" r="2.5" fill="#4fc3f7" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="#0f3460" stroke="none" />
        </svg>

        <h1 style={titleStyle}>Welcome to EyeGuard</h1>

        <p style={descriptionStyle}>
          EyeGuard monitors your eye health in real time, detecting blink rate and alerting
          you when it's time to take a break. Protect yourself from digital eye fatigue
          with personalized tracking calibrated to your eyes.
        </p>

        <button style={buttonStyle} onClick={onNext}>
          Get Started
        </button>
      </div>
    </div>
  )
}
