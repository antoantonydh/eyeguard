import type { ReactNode } from 'react'
import { usePwa } from '../hooks/use-pwa'
import { PwaContext } from './pwa-context'

export function PwaProvider({ children }: { children: ReactNode }) {
  const pwa = usePwa()
  return <PwaContext.Provider value={pwa}>{children}</PwaContext.Provider>
}
