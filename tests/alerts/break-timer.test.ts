import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BreakTimer } from '../../src/alerts/break-timer'

describe('BreakTimer', () => {
  let timer: BreakTimer
  let onBreakDue: ReturnType<typeof vi.fn>
  let onBreakComplete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    onBreakDue = vi.fn()
    onBreakComplete = vi.fn()
    timer = new BreakTimer({ intervalMinutes: 20, breakDurationSeconds: 20, onBreakDue, onBreakComplete })
  })

  afterEach(() => { timer.stop(); vi.useRealTimers() })

  it('fires onBreakDue after interval', () => { timer.start(); vi.advanceTimersByTime(20*60*1000); expect(onBreakDue).toHaveBeenCalledOnce() })
  it('does not fire before interval', () => { timer.start(); vi.advanceTimersByTime(19*60*1000); expect(onBreakDue).not.toHaveBeenCalled() })
  it('tracks remaining time until next break', () => { timer.start(); vi.advanceTimersByTime(5*60*1000); expect(timer.minutesUntilBreak).toBeCloseTo(15, 0) })
  it('counts break as taken after full duration', () => { timer.start(); vi.advanceTimersByTime(20*60*1000); timer.startBreakCountdown(); vi.advanceTimersByTime(20*1000); expect(onBreakComplete).toHaveBeenCalledWith(true); expect(timer.breaksTaken).toBe(1); expect(timer.breaksOffered).toBe(1) })
  it('counts break as skipped', () => { timer.start(); vi.advanceTimersByTime(20*60*1000); timer.skipBreak(); expect(timer.breaksTaken).toBe(0); expect(timer.breaksOffered).toBe(1) })
  it('resets all counters', () => { timer.start(); vi.advanceTimersByTime(20*60*1000); timer.skipBreak(); timer.reset(); expect(timer.breaksTaken).toBe(0); expect(timer.breaksOffered).toBe(0) })
})
