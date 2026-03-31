import type { FacePresence } from '../types'
import type { CameraDevice } from './use-camera'

export interface DetectionContextValue {
  blinkRate: number
  isStaring: boolean
  secondsSinceLastBlink: number
  confidence: number
  isTracking: boolean
  totalBlinks: number
  stareAlerts: number
  lowBlinkDurationSeconds: number
  facePresence: FacePresence
  cameraStatus: 'idle' | 'requesting' | 'active' | 'denied' | 'error'
  stream: MediaStream | null
  devices: CameraDevice[]
  selectedDeviceId: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: (deviceId: string) => Promise<void>
  isStreamAlive: () => boolean
  startTracking: () => Promise<void>
  stopTracking: () => void
}
