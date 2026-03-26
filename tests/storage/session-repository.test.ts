import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db/database'
import { sessionRepo } from '../../src/storage/session-repository'

describe('SessionRepository', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('starts a new session', async () => {
    const session = await sessionRepo.startSession()
    expect(session.id).toBeDefined()
    expect(session.endTime).toBeNull()
    expect(session.avgBlinkRate).toBe(0)
  })

  it('ends a session with metrics', async () => {
    const session = await sessionRepo.startSession()
    const ended = await sessionRepo.endSession(session.id!, {
      avgBlinkRate: 17,
      breaksOffered: 3,
      breaksTaken: 2,
      stareAlerts: 1,
    })
    expect(ended.endTime).toBeInstanceOf(Date)
    expect(ended.avgBlinkRate).toBe(17)
    expect(ended.score).toBeGreaterThan(0)
  })

  it('fetches sessions by date range', async () => {
    await sessionRepo.startSession()
    const sessions = await sessionRepo.getSessionsByDateRange(
      new Date(Date.now() - 86400000),
      new Date()
    )
    expect(sessions).toHaveLength(1)
  })
})
