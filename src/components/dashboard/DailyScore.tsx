interface DailyScoreProps {
  score: number
  breaksTaken: number
  breaksOffered: number
  avgBlinkRate: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#f97316'
  return '#ef4444'
}

function buildRingPath(score: number): string {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return `stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}`
}

export function DailyScore({ score, breaksTaken, breaksOffered, avgBlinkRate }: DailyScoreProps) {
  const color = getScoreColor(score)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const containerStyle: React.CSSProperties = {
    background: '#16213e',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  }

  const titleStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const scoreTextStyle: React.CSSProperties = {
    color,
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: 1,
  }

  const statRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
  }

  const statLabelStyle: React.CSSProperties = {
    color: '#64748b',
    fontSize: '12px',
  }

  const statValueStyle: React.CSSProperties = {
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: 500,
  }

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Daily Score</div>
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#1e2d4a"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={scoreTextStyle}>{score}</span>
        </div>
      </div>
      <div style={statRowStyle}>
        <span style={statValueStyle}>{breaksTaken}/{breaksOffered} breaks taken</span>
        <span style={statLabelStyle}>Break compliance</span>
      </div>
      <div style={statRowStyle}>
        <span style={statValueStyle}>{avgBlinkRate} blinks/min</span>
        <span style={statLabelStyle}>Avg blink rate</span>
      </div>
    </div>
  )
}
