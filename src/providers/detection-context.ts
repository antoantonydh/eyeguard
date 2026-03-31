import { createContext, useContext } from 'react'
import type { DetectionContextValue } from './detection-types'

export const DetectionContext = createContext<DetectionContextValue | null>(null)

export function useDetectionContext(): DetectionContextValue {
  const ctx = useContext(DetectionContext)
  if (!ctx) throw new Error('useDetectionContext must be used inside <DetectionProvider>')
  return ctx
}
