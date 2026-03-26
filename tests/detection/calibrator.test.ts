import { describe, it, expect } from 'vitest'
import { CalibrationSession } from '../../src/detection/calibrator'

describe('CalibrationSession', () => {
  it('calculates baseline EAR from samples', () => {
    const session = new CalibrationSession()
    session.addSample(0.30)
    session.addSample(0.28)
    session.addSample(0.32)
    session.addSample(0.15) // blink — should be excluded
    session.addSample(0.29)
    session.addSample(0.31)
    const result = session.getResult()
    expect(result.baselineEAR).toBeGreaterThan(0.15)
    expect(result.baselineEAR).toBeLessThan(0.25)
  })

  it('detects glasses from landmark variance', () => {
    const session = new CalibrationSession()
    for (let i = 0; i < 10; i++) {
      session.addSample(0.28 + Math.random() * 0.04)
    }
    const result = session.getResult()
    expect(result.wearsGlasses).toBe(false)
  })

  it('reports progress as percentage', () => {
    const session = new CalibrationSession({ targetSamples: 100 })
    for (let i = 0; i < 50; i++) { session.addSample(0.30) }
    expect(session.progress).toBeCloseTo(0.5, 1)
  })

  it('reports completion', () => {
    const session = new CalibrationSession({ targetSamples: 10 })
    for (let i = 0; i < 10; i++) { session.addSample(0.30) }
    expect(session.isComplete).toBe(true)
  })
})
