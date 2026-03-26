import { describe, it, expect } from 'vitest'
import { determineAlert, type AlertState, type DetectionState } from '../../src/alerts/alert-manager'

describe('determineAlert', () => {
  const baseState: DetectionState = { blinkRate: 18, isStaring: false, secondsSinceLastBlink: 2, isBreakDue: false, isBreakActive: false, breakCountdown: 0 }

  it('returns null when everything is healthy', () => { expect(determineAlert(baseState, 12, 5)).toBeNull() })
  it('returns stare alert when staring detected', () => { const s = { ...baseState, isStaring: true, secondsSinceLastBlink: 7 }; expect(determineAlert(s, 12, 5)?.type).toBe('stare') })
  it('returns break alert when break is due', () => { const s = { ...baseState, isBreakDue: true }; expect(determineAlert(s, 12, 5)?.type).toBe('break') })
  it('returns blink reminder when blink rate is low', () => { const s = { ...baseState, blinkRate: 8 }; expect(determineAlert(s, 12, 5)?.type).toBe('blink') })
  it('prioritizes stare over blink', () => { const s = { ...baseState, blinkRate: 8, isStaring: true, secondsSinceLastBlink: 7 }; expect(determineAlert(s, 12, 5)?.type).toBe('stare') })
  it('prioritizes break over blink', () => { const s = { ...baseState, blinkRate: 8, isBreakDue: true }; expect(determineAlert(s, 12, 5)?.type).toBe('break') })
  it('returns break-active with countdown', () => { const s = { ...baseState, isBreakActive: true, breakCountdown: 14 }; const a = determineAlert(s, 12, 5); expect(a?.type).toBe('break'); expect(a?.countdown).toBe(14) })
})
