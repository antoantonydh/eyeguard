import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db/database'
import { blinkEventRepo } from '../../src/storage/blink-event-repository'

describe('BlinkEventRepository', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('records a blink event', async () => {
    await blinkEventRepo.recordBlink(1, 0.24)
    const events = await blinkEventRepo.getBySession(1)
    expect(events).toHaveLength(1)
    expect(events[0].earValue).toBe(0.24)
  })

  it('bulk records blinks', async () => {
    await blinkEventRepo.recordBlinks([
      { sessionId: 1, timestamp: new Date(), earValue: 0.23 },
      { sessionId: 1, timestamp: new Date(), earValue: 0.22 },
    ])
    const events = await blinkEventRepo.getBySession(1)
    expect(events).toHaveLength(2)
  })

  it('prunes events older than retention period', async () => {
    const old = new Date()
    old.setDate(old.getDate() - 10)
    await db.blinkEvents.add({ sessionId: 1, timestamp: old, earValue: 0.2 })
    await db.blinkEvents.add({ sessionId: 1, timestamp: new Date(), earValue: 0.25 })

    const deleted = await blinkEventRepo.pruneOld(7)
    expect(deleted).toBe(1)

    const remaining = await blinkEventRepo.getBySession(1)
    expect(remaining).toHaveLength(1)
  })
})
