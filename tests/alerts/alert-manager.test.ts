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

  it('returns null when face is absent and no break is active', () => {
    const s = { ...baseState, blinkRate: 8, isStaring: true, secondsSinceLastBlink: 7, isBreakDue: true, lowBlinkDurationSeconds: 35, facePresence: 'absent' as const }
    expect(determineAlert(s, 12, 5)).toBeNull()
  })

  it('returns null when face is in grace period and no break is active', () => {
    const s = { ...baseState, isBreakDue: true, facePresence: 'grace' as const }
    expect(determineAlert(s, 12, 5)).toBeNull()
  })

  it('returns break-active with countdown', () => {
    const s = { ...baseState, isBreakActive: true, breakCountdown: 14 }
    const a = determineAlert(s, 12, 5)
    expect(a?.type).toBe('break')
    expect(a?.countdown).toBe(14)
  })

  // --- Break overlay must survive face-absent during active break ---
  it('keeps break overlay visible when face goes absent during active break', () => {
    // Simulates user correctly looking away — face disappears — overlay should NOT dismiss
    const s = { ...baseState, isBreakActive: true, breakCountdown: 15, facePresence: 'absent' as const }
    const a = determineAlert(s, 12, 5)
    expect(a?.type).toBe('break')
    expect(a?.countdown).toBe(15)
  })

  it('keeps break overlay visible when face is in grace period during active break', () => {
    const s = { ...baseState, isBreakActive: true, breakCountdown: 10, facePresence: 'grace' as const }
    const a = determineAlert(s, 12, 5)
    expect(a?.type).toBe('break')
    expect(a?.countdown).toBe(10)
  })

  it('break overlay countdown reflects remaining seconds', () => {
    const s20 = { ...baseState, isBreakActive: true, breakCountdown: 20 }
    expect(determineAlert(s20, 12, 5)?.countdown).toBe(20)
    const s5 = { ...baseState, isBreakActive: true, breakCountdown: 5 }
    expect(determineAlert(s5, 12, 5)?.countdown).toBe(5)
  })
})
