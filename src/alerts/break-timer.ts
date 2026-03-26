interface BreakTimerConfig {
  intervalMinutes: number
  breakDurationSeconds: number
  onBreakDue: () => void
  onBreakComplete: (taken: boolean) => void
}

export class BreakTimer {
  private config: BreakTimerConfig
  private intervalId: ReturnType<typeof setInterval> | null = null
  private countdownId: ReturnType<typeof setTimeout> | null = null
  private startedAt: number = 0
  private _breaksOffered = 0
  private _breaksTaken = 0
  private _breakCountdownRemaining = 0

  constructor(config: BreakTimerConfig) { this.config = config }

  start(fromTimestamp?: number): void {
    const intervalMs = this.config.intervalMinutes * 60 * 1000
    this.startedAt = fromTimestamp ?? Date.now()
    // How far into the current interval are we?
    const elapsed = Date.now() - this.startedAt
    const remaining = intervalMs - (elapsed % intervalMs)
    // Fire first tick at the right offset, then regular interval
    this.intervalId = setTimeout(() => {
      this._breaksOffered++
      this.config.onBreakDue()
      this.intervalId = setInterval(() => { this._breaksOffered++; this.config.onBreakDue() }, intervalMs)
    }, remaining) as unknown as ReturnType<typeof setInterval>
  }

  stop(): void {
    if (this.intervalId) { clearInterval(this.intervalId); clearTimeout(this.intervalId as unknown as ReturnType<typeof setTimeout>); this.intervalId = null }
    if (this.countdownId) { clearTimeout(this.countdownId); this.countdownId = null }
  }

  startBreakCountdown(): void {
    this._breakCountdownRemaining = this.config.breakDurationSeconds
    this.countdownId = setTimeout(() => { this._breaksTaken++; this._breakCountdownRemaining = 0; this.config.onBreakComplete(true) }, this.config.breakDurationSeconds * 1000)
  }

  skipBreak(): void {
    if (this.countdownId) { clearTimeout(this.countdownId); this.countdownId = null }
    this._breakCountdownRemaining = 0
    this.config.onBreakComplete(false)
  }

  get minutesUntilBreak(): number {
    if (!this.startedAt) return this.config.intervalMinutes
    const elapsed = Date.now() - this.startedAt
    const intervalMs = this.config.intervalMinutes * 60 * 1000
    return (intervalMs - (elapsed % intervalMs)) / 60_000
  }

  get breaksOffered(): number { return this._breaksOffered }
  get breaksTaken(): number { return this._breaksTaken }
  get breakCountdownRemaining(): number { return this._breakCountdownRemaining }

  reset(): void { this.stop(); this.startedAt = 0; this._breaksOffered = 0; this._breaksTaken = 0; this._breakCountdownRemaining = 0 }
}
