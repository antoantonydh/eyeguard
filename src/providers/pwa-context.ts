import { createContext, useContext } from 'react'
import type { PwaState } from '../hooks/use-pwa'

export const PwaContext = createContext<PwaState | null>(null)

export function usePwaContext(): PwaState {
  const ctx = useContext(PwaContext)
  if (!ctx) throw new Error('usePwaContext must be used inside <PwaProvider>')
  return ctx
}
