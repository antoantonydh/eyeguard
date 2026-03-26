import { formatMinutes } from '../../utils/format'

interface StatusBannerProps {
  blinkRate: number
  minutesUntilBreak: number
}

const BLINK_THRESHOLD = 12

export function StatusBanner({ blinkRate, minutesUntilBreak }: StatusBannerProps) {
  const isHealthy = blinkRate >= BLINK_THRESHOLD

  const containerStyle: React.CSSProperties = {
    background: isHealthy ? '#0d3b1e' : '#3b1a0d',
    border: `1px solid ${isHealthy ? '#22c55e' : '#f97316'}`,
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  }

  const statusDotStyle: React.CSSProperties = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: isHealthy ? '#22c55e' : '#f97316',
    flexShrink: 0,
  }

  const statusTextStyle: React.CSSProperties = {
    color: isHealthy ? '#22c55e' : '#f97316',
    fontSize: '18px',
    fontWeight: 600,
  }

  const metaStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '14px',
  }

  const breakStyle: React.CSSProperties = {
    color: '#60a5fa',
    fontSize: '14px',
    fontWeight: 500,
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={statusDotStyle} />
        <div>
          <div style={statusTextStyle}>
            {isHealthy ? 'Your eyes look healthy' : 'Blink rate is low'}
          </div>
          <div style={metaStyle}>
            Current blink rate: {blinkRate} blinks/min
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={metaStyle}>Next break in</div>
        <div style={breakStyle}>{formatMinutes(minutesUntilBreak)}</div>
      </div>
    </div>
  )
}
