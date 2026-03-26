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
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setStatus('active')
      // After getting permission, real device labels are available
      refreshDevices()
    } catch (err) {
      const error = err as DOMException
      setStatus(error.name === 'NotAllowedError' ? 'denied' : 'error')
    }
  }, [selectedDeviceId, refreshDevices])

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

  return { status, stream, videoRef, devices, selectedDeviceId, start, stop, switchCamera }
}
