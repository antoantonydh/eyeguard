import { db } from '../db/database'
import type { BlinkEvent } from '../types'

export const blinkEventRepo = {
  async recordBlink(sessionId: number, earValue: number): Promise<void> {
    await db.blinkEvents.add({
      sessionId,
      timestamp: new Date(),
      earValue,
    })
  },

  async recordBlinks(events: Omit<BlinkEvent, 'id'>[]): Promise<void> {
    await db.blinkEvents.bulkAdd(events)
  },

  async getBySession(sessionId: number): Promise<BlinkEvent[]> {
    return db.blinkEvents
      .where('sessionId')
      .equals(sessionId)
      .toArray()
  },

  async pruneOld(retentionDays: number = 7): Promise<number> {
    return db.pruneOldBlinkEvents(retentionDays)
  },
}
