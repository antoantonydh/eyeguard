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
  breakInterval: number  // minutes, default 20 (AOA/AAO consensus)
  breakDuration: number  // seconds, default 60 (20s shown ineffective, 60-120s recommended)
  blinkThreshold: number // blinks/min, default 12 (healthy avg ~14, alert below 12)
  stareDelay: number     // seconds, default 10 (normal interblink ~6s, alert at 10s)
  cameraFps: number      // default 24 (need 3+ frames per 100ms blink)
  chartInterval: number  // seconds between chart data points, default 30
  soundEnabled: boolean  // default true (health apps need sound for compliance)
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
  breakDuration: 60,
  blinkThreshold: 12,
  stareDelay: 10,
  cameraFps: 24,
  chartInterval: 30,
  soundEnabled: true,
}
