import { describe, it, expect, beforeEach } from 'vitest'
import { determineAlert, resetAlertCooldowns, type DetectionState } from '../../src/alerts/alert-manager'

describe('determineAlert', () => {
  const baseState: DetectionState = {
    blinkRate: 18, isStaring: false, secondsSinceLastBlink: 2,
    isBreakDue: false, isBreakActive: false, breakCountdown: 0,
    lowBlinkDurationSeconds: 0, facePresence: 'present',
  }

  beforeEach(() => {
    resetAlertCooldowns()
  })

  it('returns null when everything is healthy', () => {
    expect(determineAlert(baseState, 12, 5)).toBeNull()
  })

  it('returns stare alert when staring detected', () => {
    const s = { ...baseState, isStaring: true, secondsSinceLastBlink: 7 }
    expect(determineAlert(s, 12, 5)?.type).toBe('stare')
  })

  it('returns break alert when break is due', () => {
    const s = { ...baseState, isBreakDue: true }
    expect(determineAlert(s, 12, 5)?.type).toBe('break')
  })

  it('returns blink reminder only after sustained low blink rate (30+ seconds)', () => {
    // Low blink rate but not sustained long enough — should NOT alert
    const shortLow = { ...baseState, blinkRate: 8, lowBlinkDurationSeconds: 10 }
    expect(determineAlert(shortLow, 12, 5)).toBeNull()

    // Sustained for 30+ seconds — should alert
    const sustainedLow = { ...baseState, blinkRate: 8, lowBlinkDurationSeconds: 35 }
    expect(determineAlert(sustainedLow, 12, 5)?.type).toBe('blink')
  })

  it('does not fire blink alert again within cooldown period', () => {
    const s = { ...baseState, blinkRate: 8, lowBlinkDurationSeconds: 35 }
    // First call fires
    expect(determineAlert(s, 12, 5)?.type).toBe('blink')
    // Second call within cooldown does not fire
    expect(determineAlert(s, 12, 5)).toBeNull()
  })

  it('prioritizes stare over blink', () => {
    const s = { ...baseState, blinkRate: 8, isStaring: true, secondsSinceLastBlink: 7, lowBlinkDurationSeconds: 35 }
    expect(determineAlert(s, 12, 5)?.type).toBe('stare')
  })

  it('prioritizes break over blink', () => {
    const s = { ...baseState, blinkRate: 8, isBreakDue: true, lowBlinkDurationSeconds: 35 }
    expect(determineAlert(s, 12, 5)?.type).toBe('break')
  })

  it('returns null when face is absent regardless of other conditions', () => {
    const s = { ...baseState, blinkRate: 8, isStaring: true, secondsSinceLastBlink: 7, isBreakDue: true, lowBlinkDurationSeconds: 35, facePresence: 'absent' as const }
    expect(determineAlert(s, 12, 5)).toBeNull()
  })

  it('returns null when face is in grace period', () => {
    const s = { ...baseState, isBreakDue: true, facePresence: 'grace' as const }
    expect(determineAlert(s, 12, 5)).toBeNull()
  })

  it('returns break-active with countdown', () => {
    const s = { ...baseState, isBreakActive: true, breakCountdown: 14 }
    const a = determineAlert(s, 12, 5)
    expect(a?.type).toBe('break')
    expect(a?.countdown).toBe(14)
  })
})
