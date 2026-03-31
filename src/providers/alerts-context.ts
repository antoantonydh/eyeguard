import { createContext, useContext } from 'react'
import type { AlertsContextValue } from './alerts-types'

export const AlertsContext = createContext<AlertsContextValue | null>(null)

export function useAlertsContext(): AlertsContextValue {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlertsContext must be used inside <AlertsProvider>')
  return ctx
}
