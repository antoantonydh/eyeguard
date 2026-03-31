import { useAlertsContext } from '../providers/alerts-context'
import type { AlertsContextValue } from '../providers/alerts-types'

export type { AlertsContextValue }

export function useAlerts() {
  return useAlertsContext()
}
