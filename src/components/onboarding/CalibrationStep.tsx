import { useEffect, useRef, useState } from 'react'
import { FaceTracker } from '../../detection/face-tracker'
import { CalibrationSession } from '../../detection/calibrator'

interface Props {
  stream: MediaStream | null
  onComplete: (baselineEAR: number) => void
}

export function CalibrationStep({ stream, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const trackerRef = useRef<FaceTracker | null>(null)
  const calibrationRef = useRef<CalibrationSession | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    let cancelled = false

    async function start(v: HTMLVideoElement, s: MediaStream) {
      v.srcObject = s
      try {
        await v.play()
      } catch {
        if (!cancelled) setError('Could not start video preview.')
        return
      }

      if (v.readyState < 2) {
        await new Promise<void>((resolve) => {
          v.addEventListener('loadeddata', () => resolve(), { once: true })
        })
      }

      if (cancelled) return

      const tracker = new FaceTracker()
      const calibration = new CalibrationSession({ targetSamples: 150 })
      trackerRef.current = tracker
      calibrationRef.current = calibration

      try {
        await tracker.initialize()
      } catch {
        if (!cancelled) setError('Failed to initialize face tracker. Please try again.')
        return
      }

      if (cancelled) return

      const runLoop = () => {
        if (cancelled) return

        const result = tracker.processFrame(v, performance.now())
        if (result) {
          calibration.addSample(result.averageEar)
          setProgress(calibration.progress)

          if (calibration.isComplete) {
            const { baselineEAR } = calibration.getResult()
            onComplete(baselineEAR)
            return
          }
        }

        animFrameRef.current = requestAnimationFrame(runLoop)
      }

      animFrameRef.current = requestAnimationFrame(runLoop)
    }

    start(video, stream)

    return () => {
      cancelled = true
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
      trackerRef.current?.destroy()
      video.srcObject = null
    }
  }, [stream, onComplete])

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
    padding: '40px 40px',
    maxWidth: '480px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  }

  const titleStyle: React.CSSProperties = {
    color: '#e2e8f0',
    fontSize: '24px',
    fontWeight: 700,
    margin: 0,
  }

  const instructionStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '15px',
    lineHeight: 1.6,
    margin: 0,
  }

  const videoStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '320px',
    borderRadius: '12px',
    transform: 'scaleX(-1)',
    background: '#0a1628',
    aspectRatio: '4/3',
    objectFit: 'cover',
  }

  const progressBarTrackStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    background: '#1e2d4a',
    borderRadius: '4px',
    overflow: 'hidden',
  }

  const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${Math.round(progress * 100)}%`,
    background: '#4fc3f7',
    borderRadius: '4px',
    transition: 'width 0.2s ease',
  }

  const progressLabelStyle: React.CSSProperties = {
    color: '#4fc3f7',
    fontSize: '14px',
    fontWeight: 600,
  }

  const errorStyle: React.CSSProperties = {
    color: '#f87171',
    fontSize: '14px',
    background: 'rgba(248,113,113,0.1)',
    borderRadius: '8px',
    padding: '12px 16px',
    margin: 0,
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Calibrating Your Eyes</h1>

        <p style={instructionStyle}>
          Blink naturally for 10 seconds while we measure your baseline eye activity.
          Look directly at the camera and stay relaxed.
        </p>

        <video ref={videoRef} style={videoStyle} muted playsInline />

        {error ? (
          <p style={errorStyle}>{error}</p>
        ) : (
          <>
            <div style={progressBarTrackStyle}>
              <div style={progressBarFillStyle} />
            </div>
            <span style={progressLabelStyle}>
              {Math.round(progress * 100)}% complete
            </span>
          </>
        )}
      </div>
    </div>
  )
}
