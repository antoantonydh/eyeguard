import { formatMinutes } from '../../utils/format'
import type { FacePresence } from '../../types'

interface StatusBannerProps {
  blinkRate: number
  minutesUntilBreak: number
  facePresence?: FacePresence
}

const BLINK_THRESHOLD = 12

export function StatusBanner({ blinkRate, minutesUntilBreak, facePresence = 'present' }: StatusBannerProps) {
  const isAbsent = facePresence === 'absent'
  const isHealthy = !isAbsent && blinkRate >= BLINK_THRESHOLD

  const bgColor = isAbsent ? '#1e293b' : isHealthy ? '#0d3b1e' : '#3b1a0d'
  const borderColor = isAbsent ? '#475569' : isHealthy ? '#22c55e' : '#f97316'
  const dotColor = isAbsent ? '#475569' : isHealthy ? '#22c55e' : '#f97316'
  const textColor = isAbsent ? '#94a3b8' : isHealthy ? '#22c55e' : '#f97316'

  const title = isAbsent
    ? 'Face not detected'
    : isHealthy
      ? 'Your eyes look healthy'
      : 'Blink rate is low'

  const subtitle = isAbsent
    ? 'Tracking paused — come back to resume'
    : `Current blink rate: ${blinkRate} blinks/min`

  return (
    <div style={{
      background: bgColor, border: `1px solid ${borderColor}`,
      borderRadius: 12, padding: '20px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <div>
          <div style={{ color: textColor, fontSize: 18, fontWeight: 600 }}>{title}</div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>{subtitle}</div>
        </div>
      </div>
      {!isAbsent && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>Next break in</div>
          <div style={{ color: '#60a5fa', fontSize: 14, fontWeight: 500 }}>{formatMinutes(minutesUntilBreak)}</div>
        </div>
      )}
    </div>
  )
}
