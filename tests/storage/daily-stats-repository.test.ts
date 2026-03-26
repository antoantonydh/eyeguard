import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db/database'
import { dailyStatsRepo } from '../../src/storage/daily-stats-repository'

describe('DailyStatsRepository', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('upserts daily stats', async () => {
    await dailyStatsRepo.upsert('2026-03-26', {
      totalScreenTime: 60,
      avgBlinkRate: 17,
      breaksTaken: 2,
      breaksSkipped: 0,
      stareAlerts: 1,
      score: 90,
    })
    const stats = await dailyStatsRepo.getByDate('2026-03-26')
    expect(stats?.score).toBe(90)
  })

  it('fetches stats for a date range', async () => {
    await dailyStatsRepo.upsert('2026-03-25', { totalScreenTime: 120, avgBlinkRate: 15, breaksTaken: 3, breaksSkipped: 1, stareAlerts: 2, score: 80 })
    await dailyStatsRepo.upsert('2026-03-26', { totalScreenTime: 60, avgBlinkRate: 17, breaksTaken: 2, breaksSkipped: 0, stareAlerts: 1, score: 90 })
    const range = await dailyStatsRepo.getRange('2026-03-24', '2026-03-27')
    expect(range).toHaveLength(2)
  })
})
