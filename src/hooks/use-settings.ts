import { useState, useEffect, useCallback } from 'react'
import type { Settings, UserProfile } from '../types'
import { DEFAULT_SETTINGS } from '../config/defaults'
import { userProfileRepo } from '../storage/user-profile-repository'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reload = async () => {
      const [s, p] = await Promise.all([
        userProfileRepo.getSettings(),
        userProfileRepo.getProfile(),
      ])
      setSettings(s)
      setProfile(p ?? null)
      setLoading(false)
    }
    reload()
  }, [])

  const reload = useCallback(async () => {
    const [s, p] = await Promise.all([
      userProfileRepo.getSettings(),
      userProfileRepo.getProfile(),
    ])
    setSettings(s)
    setProfile(p ?? null)
    setLoading(false)
  }, [])

  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    await userProfileRepo.updateSettings(partial)
    setSettings(prev => ({ ...prev, ...partial }))
  }, [])

  const isCalibrated = profile != null && profile.baselineEAR > 0

  return { settings, profile, loading, isCalibrated, updateSettings, reload }
}
