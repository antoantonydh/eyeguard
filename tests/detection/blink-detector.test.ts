import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BlinkDetector } from '../../src/providers/blink-detector'

describe('BlinkDetector', () => {
  let detector: BlinkDetector

  beforeEach(() => {
    detector = new BlinkDetector({ earThreshold: 0.21 })
  })

  it('detects a blink when EAR drops below threshold then rises', () => {
    detector.processEAR(0.30)
    detector.processEAR(0.28)
    detector.processEAR(0.15)
    detector.processEAR(0.30)
    expect(detector.totalBlinks).toBe(1)
  })

  it('does not count staying closed as multiple blinks', () => {
    detector.processEAR(0.30)
    detector.processEAR(0.15)
    detector.processEAR(0.10)
    detector.processEAR(0.12)
    detector.processEAR(0.30)
    expect(detector.totalBlinks).toBe(1)
  })

  it('calculates rolling blink rate over 60 seconds', () => {
    vi.useFakeTimers()
    const now = Date.now()
    for (let i = 0; i < 15; i++) {
      vi.setSystemTime(now + i * 4000)
      detector.processEAR(0.30)
      detector.processEAR(0.10)
      detector.processEAR(0.30)
    }
    vi.setSystemTime(now + 60000)
    expect(detector.blinkRate).toBeCloseTo(15, 0)
    vi.useRealTimers()
  })

  it('detects prolonged stare (no blink for N seconds)', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)
    detector.processEAR(0.30)
    detector.processEAR(0.10)
    detector.processEAR(0.30)
    vi.setSystemTime(now + 6000)
    detector.processEAR(0.30)
    expect(detector.isStaring(5)).toBe(true)
    expect(detector.secondsSinceLastBlink).toBeGreaterThanOrEqual(6)
    vi.useRealTimers()
  })

  it('resets stare detection after a blink', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)
    detector.processEAR(0.30)
    detector.processEAR(0.10)
    detector.processEAR(0.30)
    vi.setSystemTime(now + 6000)
    expect(detector.isStaring(5)).toBe(true)
    detector.processEAR(0.10)
    detector.processEAR(0.30)
    expect(detector.isStaring(5)).toBe(false)
    vi.useRealTimers()
  })

  it('tracks cumulative totalBlinks across the session', () => {
    detector.processEAR(0.30)
    detector.processEAR(0.10)
    detector.processEAR(0.30)
    detector.processEAR(0.10)
    detector.processEAR(0.30)
    expect(detector.totalBlinks).toBe(2)
  })

  it('resets all state', () => {
    detector.processEAR(0.30)
    detector.processEAR(0.10)
    detector.processEAR(0.30)
    expect(detector.totalBlinks).toBe(1)
    detector.reset()
    expect(detector.totalBlinks).toBe(0)
    expect(detector.blinkRate).toBe(0)
  })
})
