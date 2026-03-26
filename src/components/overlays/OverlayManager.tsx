import { useCallback, useState } from 'react'
import type { AlertState } from '../../alerts/alert-manager'
import { BlinkReminder } from './BlinkReminder'
import { BreakOverlay } from './BreakOverlay'
import { StareAlert } from './StareAlert'

interface OverlayManagerProps {
  alert: AlertState | null
  onStartBreak: () => void
  onSkipBreak: () => void
}

export function OverlayManager({ alert, onStartBreak, onSkipBreak }: OverlayManagerProps) {
  const [dismissed, setDismissed] = useState<string | null>(null)

  const handleDismiss = useCallback(() => {
    setDismissed(alert?.message ?? null)
  }, [alert?.message])

  if (alert === null) return null

  if (dismissed === alert.message) return null

  if (alert.type === 'blink') {
    return (
      <BlinkReminder
        message={alert.message}
        onDismiss={handleDismiss}
      />
    )
  }

  if (alert.type === 'break') {
    return (
      <BreakOverlay
        message={alert.message}
        countdown={alert.countdown}
        onStartBreak={onStartBreak}
        onSkipBreak={onSkipBreak}
      />
    )
  }

  if (alert.type === 'stare') {
    return <StareAlert message={alert.message} />
  }

  return null
}
