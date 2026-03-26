import { useState, useEffect, useCallback, useRef } from 'react'

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const start = useCallback(async () => {
    setStatus('requesting')
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      setStream(mediaStream)
      setStatus('active')
    } catch (err) {
      const error = err as DOMException
      setStatus(error.name === 'NotAllowedError' ? 'denied' : 'error')
    }
  }, [])

  const stop = useCallback(() => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    setStatus('idle')
  }, [stream])

  useEffect(() => {
    return () => { stream?.getTracks().forEach(track => track.stop()) }
  }, [stream])

  return { status, stream, videoRef, start, stop }
}
