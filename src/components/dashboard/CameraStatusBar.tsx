import type { FacePresence } from '../../types'
import type { CameraDevice } from '../../hooks/use-camera'

interface CameraStatusBarProps {
  isActive?: boolean
  confidence?: number
  wearsGlasses?: boolean
  fps?: number
  totalBlinks?: number
  blinkRate?: number
  facePresence?: FacePresence
  devices?: CameraDevice[]
  selectedDeviceId?: string
  onSwitchCamera?: (deviceId: string) => void
  onPause?: () => void
  onRecalibrate?: () => void
}

export function CameraStatusBar({
  isActive = false,
  confidence = 0,
  wearsGlasses = false,
  fps = 0,
  totalBlinks = 0,
  blinkRate = 0,
  facePresence = 'absent',
  devices = [],
  selectedDeviceId = '',
  onSwitchCamera,
  onPause,
  onRecalibrate,
}: CameraStatusBarProps) {
  const containerStyle: React.CSSProperties = {
    background: '#16213e',
    borderRadius: '12px',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  }

  const statusDotStyle: React.CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: isActive ? '#22c55e' : '#475569',
    flexShrink: 0,
  }

  const labelStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '13px',
  }

  const valueStyle: React.CSSProperties = {
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 500,
  }

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '20px',
    background: '#1e2d4a',
    flexShrink: 0,
  }

  const buttonStyle = (variant: 'secondary' | 'primary'): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    background: variant === 'primary' ? '#3b82f6' : '#1e2d4a',
    color: variant === 'primary' ? '#fff' : '#94a3b8',
  })

  return (
    <div style={containerStyle}>
      {/* Camera icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#22c55e' : '#475569'} strokeWidth="2">
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>

      <div style={{
        ...statusDotStyle,
        background: facePresence === 'present' ? '#22c55e'
          : facePresence === 'grace' ? '#f59e0b'
          : '#475569',
      }} />
      <span style={valueStyle}>
        {!isActive ? 'Paused'
          : facePresence === 'present' ? 'Active'
          : facePresence === 'grace' ? 'Detecting...'
          : 'No face — paused'}
      </span>

      <div style={dividerStyle} />

      <span style={labelStyle}>Confidence</span>
      <span style={valueStyle}>{Math.round(confidence * 100)}%</span>

      <div style={dividerStyle} />

      <span style={labelStyle}>Glasses</span>
      <span style={valueStyle}>{wearsGlasses ? 'Detected' : 'Not detected'}</span>

      <div style={dividerStyle} />

      <span style={labelStyle}>Blinks</span>
      <span style={{ ...valueStyle, color: '#4fc3f7', fontWeight: 700, fontSize: '15px' }}>{totalBlinks}</span>

      <div style={dividerStyle} />

      <span style={labelStyle}>Rate</span>
      <span style={{
        ...valueStyle,
        color: blinkRate >= 12 ? '#22c55e' : blinkRate > 0 ? '#f59e0b' : '#94a3b8',
        fontWeight: 700, fontSize: '15px',
      }}>{blinkRate}/min</span>

      <div style={dividerStyle} />

      <span style={labelStyle}>FPS</span>
      <span style={valueStyle}>{fps}</span>

      <div style={{ flex: 1 }} />

      {devices.length > 1 && (
        <select
          value={selectedDeviceId}
          onChange={e => onSwitchCamera?.(e.target.value)}
          title="Switch camera"
          style={{
            background: '#1e2d4a', border: '1px solid #334', color: '#94a3b8',
            borderRadius: 6, padding: '5px 8px', fontSize: 12, cursor: 'pointer',
          }}
        >
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
          ))}
        </select>
      )}

      <button style={buttonStyle('secondary')} onClick={onPause}>
        {isActive ? 'Pause' : 'Resume'}
      </button>
      <button style={buttonStyle('primary')} onClick={onRecalibrate}>
        Recalibrate
      </button>
    </div>
  )
}
