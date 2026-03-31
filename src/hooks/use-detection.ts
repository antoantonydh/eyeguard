import { useDetectionContext } from '../providers/detection-context'
import type { DetectionContextValue } from '../providers/detection-types'

export type { DetectionContextValue }

export function useDetection() {
  return useDetectionContext()
}
