import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db/database'
import { userProfileRepo } from '../../src/storage/user-profile-repository'
import { DEFAULT_SETTINGS } from '../../src/config/defaults'

describe('UserProfileRepository', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('returns default settings when no profile exists', async () => {
    const settings = await userProfileRepo.getSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('creates and retrieves a profile', async () => {
    await userProfileRepo.saveCalibration(0.25, false)
    const profile = await userProfileRepo.getProfile()
    expect(profile?.baselineEAR).toBe(0.25)
    expect(profile?.wearsGlasses).toBe(false)
  })

  it('updates settings', async () => {
    await userProfileRepo.saveCalibration(0.25, false)
    await userProfileRepo.updateSettings({ breakInterval: 30 })
    const settings = await userProfileRepo.getSettings()
    expect(settings.breakInterval).toBe(30)
  })

  it('checks if calibration is done', async () => {
    expect(await userProfileRepo.isCalibrated()).toBe(false)
    await userProfileRepo.saveCalibration(0.25, true)
    expect(await userProfileRepo.isCalibrated()).toBe(true)
  })
})
