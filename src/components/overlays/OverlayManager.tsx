import { useCallback, useState } from 'react'
import type { AlertState } from '../../alerts/alert-manager'
import { BlinkReminder } from './BlinkReminder'
import { BreakOverlay } from './BreakOverlay'
import { StareAlert } from './StareAlert'

interface Props {
  alert: AlertState | null
  soundEnabled: boolean
  onStartBreak: () => void
  onSkipBreak: () => void
}

export function OverlayManager({ alert, soundEnabled, onStartBreak, onSkipBreak }: Props) {
  const [dismissed, setDismissed] = useState<string | null>(null)

  const handleDismiss = useCallback(() => {
    setDismissed(alert?.message ?? null)
  }, [alert?.message])

  if (alert === null) return null
  if (dismissed === alert.message) return null

  switch (alert.type) {
    case 'blink':
      return <BlinkReminder message={alert.message} soundEnabled={soundEnabled} onDismiss={handleDismiss} />
    case 'break':
      return (
        <BreakOverlay
          message={alert.message}
          countdown={alert.countdown}
          soundEnabled={soundEnabled}
          onStartBreak={onStartBreak}
          onSkipBreak={onSkipBreak}
        />
      )
    case 'stare':
      return <StareAlert message={alert.message} soundEnabled={soundEnabled} />
  }
}
