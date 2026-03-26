import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db/database'

describe('Database', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('should have all required tables', () => {
    expect(db.tables.map(t => t.name).sort()).toEqual(
      ['blinkEvents', 'dailyStats', 'sessions', 'userProfile'].sort()
    )
  })

  it('should create a session', async () => {
    const id = await db.sessions.add({
      startTime: new Date(),
      endTime: null,
      avgBlinkRate: 0,
      breaksOffered: 0,
      breaksTaken: 0,
      stareAlerts: 0,
      score: 0,
    })
    expect(id).toBeDefined()
    const session = await db.sessions.get(id)
    expect(session?.startTime).toBeInstanceOf(Date)
  })

  it('should create a blink event', async () => {
    const id = await db.blinkEvents.add({
      sessionId: 1,
      timestamp: new Date(),
      earValue: 0.25,
    })
    const event = await db.blinkEvents.get(id)
    expect(event?.earValue).toBe(0.25)
  })

  it('should create daily stats', async () => {
    await db.dailyStats.put({
      date: '2026-03-26',
      totalScreenTime: 120,
      avgBlinkRate: 17,
      breaksTaken: 3,
      breaksSkipped: 1,
      stareAlerts: 2,
      score: 85,
    })
    const stats = await db.dailyStats.get('2026-03-26')
    expect(stats?.score).toBe(85)
  })

  it('should create user profile', async () => {
    await db.userProfile.put({
      id: 1,
      baselineEAR: 0.25,
      wearsGlasses: false,
      settings: {
        breakInterval: 20,
        breakDuration: 20,
        blinkThreshold: 12,
        stareDelay: 5,
        cameraFps: 15,
        soundEnabled: false,
      },
      calibratedAt: new Date(),
    })
    const profile = await db.userProfile.get(1)
    expect(profile?.baselineEAR).toBe(0.25)
  })
})
