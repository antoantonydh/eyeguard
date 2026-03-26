import { describe, it, expect } from 'vitest'
import { calculateScore } from '../../src/storage/score-calculator'

describe('calculateScore', () => {
  it('returns 100 for perfect session', () => {
    const score = calculateScore({
      breaksTaken: 4,
      breaksOffered: 4,
      avgBlinkRate: 18,
      blinkThreshold: 12,
      stareAlerts: 0,
    })
    expect(score).toBe(100)
  })

  it('returns 0 when all metrics are worst case', () => {
    const score = calculateScore({
      breaksTaken: 0,
      breaksOffered: 4,
      avgBlinkRate: 0,
      blinkThreshold: 12,
      stareAlerts: 20,
    })
    expect(score).toBe(0)
  })

  it('penalizes skipped breaks proportionally', () => {
    const score = calculateScore({
      breaksTaken: 2,
      breaksOffered: 4,
      avgBlinkRate: 18,
      blinkThreshold: 12,
      stareAlerts: 0,
    })
    expect(score).toBe(80)
  })

  it('penalizes low blink rate proportionally', () => {
    const score = calculateScore({
      breaksTaken: 4,
      breaksOffered: 4,
      avgBlinkRate: 6,
      blinkThreshold: 12,
      stareAlerts: 0,
    })
    expect(score).toBe(80)
  })

  it('penalizes excessive stare alerts', () => {
    const score = calculateScore({
      breaksTaken: 4,
      breaksOffered: 4,
      avgBlinkRate: 18,
      blinkThreshold: 12,
      stareAlerts: 10,
    })
    expect(score).toBe(90)
  })

  it('handles zero breaksOffered without dividing by zero', () => {
    const score = calculateScore({
      breaksTaken: 0,
      breaksOffered: 0,
      avgBlinkRate: 18,
      blinkThreshold: 12,
      stareAlerts: 0,
    })
    expect(score).toBe(100)
  })
})
