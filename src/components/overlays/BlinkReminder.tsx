import { useEffect, useState } from 'react'
import { playBlinkSound } from '../../utils/sounds'

interface Props {
  message: string
  soundEnabled: boolean
  onDismiss: () => void
}

export function BlinkReminder({ message, soundEnabled, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (soundEnabled) playBlinkSound()
  }, [soundEnabled])

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onDismiss() }, 8000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32,
      background: 'linear-gradient(135deg, #1a2744, #1e3a5f)',
      border: '1px solid rgba(79, 195, 247, 0.4)',
      borderRadius: 16, padding: '20px 28px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(79,195,247,0.1)',
      zIndex: 9999, maxWidth: 400, minWidth: 320,
      animation: 'slideInRight 0.3s ease-out',
    }} role="status" aria-live="polite">
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'rgba(79, 195, 247, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>👁️</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          Remember to Blink
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.4 }}>
          {message}
        </div>
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss() }}
        style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid #334',
          color: '#94a3b8', fontSize: 14, padding: '6px 10px', borderRadius: 8,
          cursor: 'pointer', flexShrink: 0,
        }}
      >✕</button>
    </div>
  )
}
