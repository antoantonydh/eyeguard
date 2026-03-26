import Dexie, { type EntityTable } from 'dexie'
import type { Session, BlinkEvent, DailyStats, UserProfile } from '../types'

class EyeGuardDB extends Dexie {
  sessions!: EntityTable<Session, 'id'>
  blinkEvents!: EntityTable<BlinkEvent, 'id'>
  dailyStats!: EntityTable<DailyStats, 'date'>
  userProfile!: EntityTable<UserProfile, 'id'>

  constructor() {
    super('EyeGuardDB')
    this.version(1).stores({
      sessions: '++id, startTime',
      blinkEvents: '++id, sessionId, timestamp',
      dailyStats: 'date',
      userProfile: '++id',
    })
  }

  async pruneOldBlinkEvents(retentionDays: number = 7): Promise<number> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    return this.blinkEvents.where('timestamp').below(cutoff).delete()
  }
}

export const db = new EyeGuardDB()
