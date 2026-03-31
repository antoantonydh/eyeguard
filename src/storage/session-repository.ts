import { db } from '../db/database'
import type { Session } from '../types'
import { calculateScore } from '../utils/score-calculator'

interface EndSessionMetrics {
  avgBlinkRate: number
  breaksOffered: number
  breaksTaken: number
  stareAlerts: number
  blinkThreshold?: number
}

export const sessionRepo = {
  async startSession(): Promise<Session> {
    const session: Session = {
      startTime: new Date(),
      endTime: null,
      avgBlinkRate: 0,
      breaksOffered: 0,
      breaksTaken: 0,
      stareAlerts: 0,
      score: 0,
    }
    const id = await db.sessions.add(session)
    return { ...session, id }
  },

  async endSession(id: number, metrics: EndSessionMetrics): Promise<Session> {
    const score = calculateScore({
      ...metrics,
      blinkThreshold: metrics.blinkThreshold ?? 12,
    })
    await db.sessions.update(id, {
      endTime: new Date(),
      ...metrics,
      score,
    })
    const session = await db.sessions.get(id)
    return session!
  },

  async getSessionsByDateRange(from: Date, to: Date): Promise<Session[]> {
    return db.sessions
      .where('startTime')
      .between(from, to, true, true)
      .toArray()
  },
}
