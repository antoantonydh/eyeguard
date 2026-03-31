import { useEffect } from 'react'
import { playStareSound } from '../../../utils/sounds'

interface Props {
  message: string
  soundEnabled: boolean
}

export function StareAlert({ message, soundEnabled }: Props) {
  useEffect(() => {
    if (soundEnabled) playStareSound()
  }, [soundEnabled])

  return (
    <>
      <style>{`
        @keyframes eyeguard-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes eyeguard-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,152,0,0.3); }
          50% { box-shadow: 0 0 40px rgba(255,152,0,0.6); }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #3e2200, #4a2800)',
        border: '2px solid rgba(255, 152, 0, 0.6)',
        borderRadius: 16, padding: '18px 28px',
        display: 'flex', alignItems: 'center', gap: 14,
        zIndex: 9999, minWidth: 320,
        animation: 'slideUp 0.4s ease-out, shake 0.5s ease-in-out 0.4s, eyeguard-glow 1.5s ease-in-out 0.9s infinite',
      }} role="alert" aria-live="assertive">
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: '#ff9800', flexShrink: 0,
          boxShadow: '0 0 12px #ff9800',
          animation: 'eyeguard-pulse 1s ease-in-out infinite',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#ffcc80', fontSize: 16, fontWeight: 700 }}>
            Blink Now
          </div>
          <div style={{ color: '#c8956a', fontSize: 14, marginTop: 2 }}>
            {message}
          </div>
        </div>
        <div style={{
          color: '#ff9800', fontSize: 24, fontWeight: 700, fontFamily: 'monospace',
        }}>!</div>
      </div>
    </>
  )
}
