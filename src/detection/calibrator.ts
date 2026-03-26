interface CalibrationConfig {
  targetSamples?: number
  blinkEarCutoff?: number
  thresholdRatio?: number
}

export interface CalibrationResult {
  baselineEAR: number
  wearsGlasses: boolean
}

export class CalibrationSession {
  private samples: number[] = []
  private readonly targetSamples: number
  private readonly blinkCutoff: number
  private readonly thresholdRatio: number

  constructor(config: CalibrationConfig = {}) {
    this.targetSamples = config.targetSamples ?? 150
    this.blinkCutoff = config.blinkEarCutoff ?? 0.20
    this.thresholdRatio = config.thresholdRatio ?? 0.6
  }

  addSample(ear: number): void {
    this.samples.push(ear)
  }

  get progress(): number {
    return Math.min(1, this.samples.length / this.targetSamples)
  }

  get isComplete(): boolean {
    return this.samples.length >= this.targetSamples
  }

  getResult(): CalibrationResult {
    const openEyeSamples = this.samples.filter(s => s > this.blinkCutoff)

    if (openEyeSamples.length === 0) {
      return { baselineEAR: 0.21, wearsGlasses: false }
    }

    const sorted = [...openEyeSamples].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const baselineEAR = median * this.thresholdRatio

    const mean = openEyeSamples.reduce((a, b) => a + b, 0) / openEyeSamples.length
    const variance =
      openEyeSamples.reduce((sum, s) => sum + (s - mean) ** 2, 0) / openEyeSamples.length
    const cv = Math.sqrt(variance) / mean
    const wearsGlasses = cv > 0.15

    return { baselineEAR, wearsGlasses }
  }
}
