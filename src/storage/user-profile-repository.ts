import { db } from '../db/database'
import type { Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

export const userProfileRepo = {
  async getProfile() {
    return db.userProfile.get(1)
  },

  async getSettings(): Promise<Settings> {
    const profile = await db.userProfile.get(1)
    return profile?.settings ?? { ...DEFAULT_SETTINGS }
  },

  async saveCalibration(baselineEAR: number, wearsGlasses: boolean): Promise<void> {
    const existing = await db.userProfile.get(1)
    await db.userProfile.put({
      id: 1,
      baselineEAR,
      wearsGlasses,
      settings: existing?.settings ?? { ...DEFAULT_SETTINGS },
      calibratedAt: new Date(),
    })
  },

  async updateSettings(partial: Partial<Settings>): Promise<void> {
    const profile = await db.userProfile.get(1)
    if (!profile) return
    await db.userProfile.update(1, {
      settings: { ...profile.settings, ...partial },
    })
  },

  async isCalibrated(): Promise<boolean> {
    const profile = await db.userProfile.get(1)
    return profile != null && profile.baselineEAR > 0
  },

  async resetAll(): Promise<void> {
    await db.userProfile.clear()
    await db.sessions.clear()
    await db.blinkEvents.clear()
    await db.dailyStats.clear()
  },
}
