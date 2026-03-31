import { useDetectionContext, type DetectionContextValue } from '../providers/DetectionProvider'

export type { DetectionContextValue }

export function useDetection() {
  return useDetectionContext()
}
