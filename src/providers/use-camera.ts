import { useState, useEffect, useCallback, useRef } from 'react'

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

export interface CameraDevice {
  deviceId: string
  label: string
}

const SELECTED_CAMERA_KEY = 'eyeguard_camera_device'

export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [devices, setDevices] = useState<CameraDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    () => localStorage.getItem(SELECTED_CAMERA_KEY) ?? ''
  )
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Enumerate available cameras (need permission first for real labels)
  const refreshDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices()
    const cams = all
      .filter(d => d.kind === 'videoinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${i + 1}`,
      }))
    setDevices(cams)
  }, [])

  useEffect(() => {
    refreshDevices()
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices)
  }, [refreshDevices])

  const start = useCallback(async (deviceId?: string) => {
    setStatus('requesting')
    const targetDevice = deviceId ?? selectedDeviceId
    try {
      const constraints: MediaStreamConstraints = {
        video: targetDevice
          ? { deviceId: { exact: targetDevice }, width: 640, height: 480 }
          : { facingMode: 'user', width: 640, height: 480 },
      }
      // Timeout prevents hanging indefinitely (e.g. after system restore when camera hardware isn't ready)
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new DOMException('Camera request timed out', 'TimeoutError')), 10_000)
      )
      const mediaStream = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        timeout,
      ])
      setStream(mediaStream)
      setStatus('active')
      refreshDevices()
    } catch (err) {
      const error = err as DOMException
      if (error.name === 'NotAllowedError') {
        setStatus('denied')
      } else {
        setStatus('error')
      }
    }
  }, [selectedDeviceId, refreshDevices])

  /** Check if current stream tracks are still alive (not ended by OS/bfcache) */
  const isStreamAlive = useCallback((): boolean => {
    if (!stream) return false
    return stream.getTracks().every(t => t.readyState === 'live')
  }, [stream])

  const stop = useCallback(() => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    setStatus('idle')
  }, [stream])

  const switchCamera = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    localStorage.setItem(SELECTED_CAMERA_KEY, deviceId)
    // Restart stream with new device
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    await start(deviceId)
  }, [stream, start])

  useEffect(() => {
    return () => { stream?.getTracks().forEach(track => track.stop()) }
  }, [stream])

  return { status, stream, videoRef, devices, selectedDeviceId, start, stop, switchCamera, isStreamAlive }
}
