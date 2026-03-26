import { useEffect } from 'react'
import { playBreakSound } from '../../utils/sounds'

interface Props {
  message: string
  countdown?: number
  soundEnabled: boolean
  onStartBreak: () => void
  onSkipBreak: () => void
}

export function BreakOverlay({ message, countdown, soundEnabled, onStartBreak, onSkipBreak }: Props) {
  useEffect(() => {
    if (soundEnabled) playBreakSound()
  }, [soundEnabled])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, animation: 'fadeIn 0.3s ease-out',
    }} role="alertdialog" aria-label="Break reminder">
      <div style={{
        background: 'linear-gradient(135deg, #0d3320, #1a4a30)',
        border: '1px solid rgba(76, 175, 80, 0.3)',
        borderRadius: 24, padding: '40px 48px',
        textAlign: 'center', maxWidth: 420,
        boxShadow: '0 16px 64px rgba(0,0,0,0.5), 0 0 40px rgba(76,175,80,0.1)',
        animation: 'bounceIn 0.5s ease-out',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
        <div style={{
          color: '#a5d6a7', fontSize: 12, textTransform: 'uppercase',
          letterSpacing: 2, marginBottom: 8, fontWeight: 600,
        }}>20-20-20 Break</div>
        <div style={{
          color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 8,
        }}>
          {countdown != null ? 'Look away from your screen' : message}
        </div>
        <div style={{ color: '#81c784', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
          Focus on something 20 feet away to relax your eye muscles
        </div>

        {countdown != null ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, border: '4px solid #66bb6a', borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#66bb6a', fontSize: 32, fontWeight: 700,
            }}>{countdown}</div>
            <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>seconds remaining</div>
          </div>
        ) : (
          <button onClick={onStartBreak} style={{
            background: '#4caf50', color: '#fff', border: 'none',
            padding: '14px 36px', borderRadius: 12, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', marginBottom: 16, display: 'block', width: '100%',
          }}>Start Break</button>
        )}

        <button onClick={onSkipBreak} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.15)',
          color: '#888', padding: '10px 24px', borderRadius: 10, fontSize: 13,
          cursor: 'pointer', width: '100%',
        }}>Skip this time</button>
      </div>
    </div>
  )
}
