import { useAlertsContext, type AlertsContextValue } from '../providers/AlertsProvider'

export type { AlertsContextValue }

export function useAlerts() {
  return useAlertsContext()
}
