interface BlinkDetectorConfig {
  earThreshold: number
}

export class BlinkDetector {
  private readonly threshold: number
  private eyesClosed = false
  private recentBlinks: number[] = []
  private _totalBlinks = 0
  private lastBlinkTime: number = Date.now()

  constructor(config: BlinkDetectorConfig) {
    this.threshold = config.earThreshold
  }

  processEAR(ear: number): boolean {
    const now = Date.now()
    let blinkDetected = false

    if (ear < this.threshold) {
      this.eyesClosed = true
    } else if (this.eyesClosed) {
      this.eyesClosed = false
      this.recentBlinks.push(now)
      this._totalBlinks++
      this.lastBlinkTime = now
      blinkDetected = true
    }

    const cutoff = now - 60_000
    this.recentBlinks = this.recentBlinks.filter(t => t >= cutoff)

    return blinkDetected
  }

  get totalBlinks(): number {
    return this._totalBlinks
  }

  get blinkRate(): number {
    return this.recentBlinks.length
  }

  get secondsSinceLastBlink(): number {
    return (Date.now() - this.lastBlinkTime) / 1000
  }

  isStaring(thresholdSeconds: number): boolean {
    return this.secondsSinceLastBlink >= thresholdSeconds
  }

  reset(): void {
    this.eyesClosed = false
    this.recentBlinks = []
    this._totalBlinks = 0
    this.lastBlinkTime = Date.now()
  }
}
