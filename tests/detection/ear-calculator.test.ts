import { describe, it, expect } from 'vitest'
import { calculateEAR, type EyeLandmarks } from '../../src/providers/ear-calculator'

describe('calculateEAR', () => {
  const openEye: EyeLandmarks = {
    p1: { x: 0, y: 0 },
    p2: { x: 0.2, y: 0.15 },
    p3: { x: 0.4, y: 0.15 },
    p4: { x: 0.6, y: 0 },
    p5: { x: 0.4, y: -0.15 },
    p6: { x: 0.2, y: -0.15 },
  }

  const closedEye: EyeLandmarks = {
    p1: { x: 0, y: 0 },
    p2: { x: 0.2, y: 0.02 },
    p3: { x: 0.4, y: 0.02 },
    p4: { x: 0.6, y: 0 },
    p5: { x: 0.4, y: -0.02 },
    p6: { x: 0.2, y: -0.02 },
  }

  it('returns high EAR for open eye', () => {
    const ear = calculateEAR(openEye)
    expect(ear).toBeGreaterThan(0.2)
  })

  it('returns low EAR for closed eye', () => {
    const ear = calculateEAR(closedEye)
    expect(ear).toBeLessThan(0.1)
  })

  it('returns average EAR for both eyes', () => {
    const avg = calculateEAR(openEye, closedEye)
    const singleOpen = calculateEAR(openEye)
    const singleClosed = calculateEAR(closedEye)
    expect(avg).toBeCloseTo((singleOpen + singleClosed) / 2, 5)
  })

  it('returns 0 for degenerate landmarks (zero horizontal distance)', () => {
    const degenerate: EyeLandmarks = {
      p1: { x: 0, y: 0 },
      p2: { x: 0, y: 0.1 },
      p3: { x: 0, y: 0.1 },
      p4: { x: 0, y: 0 },
      p5: { x: 0, y: -0.1 },
      p6: { x: 0, y: -0.1 },
    }
    expect(calculateEAR(degenerate)).toBe(0)
  })
})
