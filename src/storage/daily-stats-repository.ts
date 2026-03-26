import { db } from '../db/database'
import type { DailyStats } from '../types'

type DailyStatsInput = Omit<DailyStats, 'date'>

export const dailyStatsRepo = {
  async upsert(date: string, stats: DailyStatsInput): Promise<void> {
    await db.dailyStats.put({ date, ...stats })
  },

  async getByDate(date: string): Promise<DailyStats | undefined> {
    return db.dailyStats.get(date)
  },

  async getRange(fromDate: string, toDate: string): Promise<DailyStats[]> {
    return db.dailyStats
      .where('date')
      .between(fromDate, toDate)
      .toArray()
  },
}
