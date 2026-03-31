import { useCallback, useState } from 'react'
import { useAlerts } from '../../../hooks/use-alerts'
import { useSettings } from '../../../hooks/use-settings'
import { BlinkReminder } from './BlinkReminder'
import { BreakOverlay } from './BreakOverlay'
import { StareAlert } from './StareAlert'

export function OverlayManager() {
  const { alert, startBreak, skipBreak } = useAlerts()
  const { settings } = useSettings()
  const [dismissed, setDismissed] = useState<string | null>(null)

  const handleDismiss = useCallback(() => {
    setDismissed(alert?.message ?? null)
  }, [alert?.message])

  if (alert === null) return null
  if (dismissed === alert.message) return null

  switch (alert.type) {
    case 'blink':
      return (
        <BlinkReminder
          message={alert.message}
          soundEnabled={settings.soundEnabled}
          onDismiss={handleDismiss}
        />
      )
    case 'break':
      return (
        <BreakOverlay
          message={alert.message}
          countdown={alert.countdown}
          soundEnabled={settings.soundEnabled}
          onStartBreak={startBreak}
          onSkipBreak={skipBreak}
        />
      )
    case 'stare':
      return <StareAlert message={alert.message} soundEnabled={settings.soundEnabled} />
  }
}
