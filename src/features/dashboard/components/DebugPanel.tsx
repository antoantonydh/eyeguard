import { useEffect, useRef, useState } from 'react'
import type { FacePresence } from '../../../types'

interface Props {
  stream: MediaStream | null
  blinkRate: number
  confidence: number
  isStaring: boolean
  secondsSinceLastBlink: number
  totalBlinks: number
  facePresence: FacePresence
}

export function DebugPanel({
  stream, blinkRate, confidence, isStaring,
  secondsSinceLastBlink, totalBlinks, facePresence,
}: Props) {
  const [visible, setVisible] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream || !visible) return
    video.srcObject = stream
    video.play().catch(() => {})
  }, [stream, visible])

  return (
    <div style={{ background: '#16213e', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setVisible(v => !v)}
        style={{
          width: '100%', padding: '12px 24px', background: 'none',
          border: 'none', color: '#4fc3f7', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', textAlign: 'left',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>Debug Camera View</span>
        <span style={{ color: '#888' }}>{visible ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {visible && (
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', maxHeight: 300, display: 'block', transform: 'scaleX(-1)' }}
            />

            {/* Overlay stats on video */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '8px 12px', background: 'rgba(0,0,0,0.6)',
              display: 'flex', gap: 16, flexWrap: 'wrap',
            }}>
              <Stat label="Face" value={facePresence.toUpperCase()} color={
                facePresence === 'present' ? '#4caf50' : facePresence === 'grace' ? '#f59e0b' : '#f44336'
              } />
              <Stat label="Blinks/min" value={String(blinkRate)} color={blinkRate >= 12 ? '#4caf50' : '#ff9800'} />
              <Stat label="Confidence" value={`${Math.round(confidence * 100)}%`} color={confidence > 0.5 ? '#4caf50' : '#ff9800'} />
              <Stat label="Total Blinks" value={String(totalBlinks)} color="#4fc3f7" />
            </div>

            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '8px 12px', background: 'rgba(0,0,0,0.6)',
              display: 'flex', gap: 16,
            }}>
              <Stat
                label="Stare"
                value={isStaring ? `YES (${Math.round(secondsSinceLastBlink)}s)` : 'No'}
                color={isStaring ? '#f44336' : '#4caf50'}
              />
              <Stat
                label="Last Blink"
                value={`${secondsSinceLastBlink.toFixed(1)}s ago`}
                color={secondsSinceLastBlink > 5 ? '#ff9800' : '#888'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
