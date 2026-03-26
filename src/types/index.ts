export interface Session {
  id?: number
  startTime: Date
  endTime: Date | null
  avgBlinkRate: number
  breaksOffered: number
  breaksTaken: number
  stareAlerts: number
  score: number
}

export interface BlinkEvent {
  id?: number
  sessionId: number
  timestamp: Date
  earValue: number
}

export interface DailyStats {
  date: string // YYYY-MM-DD, primary key
  totalScreenTime: number // minutes
  avgBlinkRate: number
  breaksTaken: number
  breaksSkipped: number
  stareAlerts: number
  score: number
}

export interface Settings {
  breakInterval: number  // minutes, default 20
  breakDuration: number  // seconds, default 20
  blinkThreshold: number // blinks/min, default 12
  stareDelay: number     // seconds, default 5
  cameraFps: number      // default 15
  soundEnabled: boolean  // default false
}

export interface UserProfile {
  id?: number
  baselineEAR: number
  wearsGlasses: boolean
  settings: Settings
  calibratedAt: Date
}

export const DEFAULT_SETTINGS: Settings = {
  breakInterval: 20,
  breakDuration: 20,
  blinkThreshold: 12,
  stareDelay: 5,
  cameraFps: 15,
  soundEnabled: false,
}
