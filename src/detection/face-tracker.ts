import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { calculateEAR, type EyeLandmarks } from './ear-calculator'

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144] as const
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const

export interface FaceTrackerResult {
  leftEar: number
  rightEar: number
  averageEar: number
  confidence: number
}

export class FaceTracker {
  private landmarker: FaceLandmarker | null = null

  async initialize(): Promise<void> {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )
    this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    })
  }

  processFrame(video: HTMLVideoElement, timestampMs: number): FaceTrackerResult | null {
    if (!this.landmarker) return null

    const results = this.landmarker.detectForVideo(video, timestampMs)
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) return null

    const landmarks = results.faceLandmarks[0]

    const extractEye = (indices: readonly number[]): EyeLandmarks => ({
      p1: landmarks[indices[0]],
      p2: landmarks[indices[1]],
      p3: landmarks[indices[2]],
      p4: landmarks[indices[3]],
      p5: landmarks[indices[4]],
      p6: landmarks[indices[5]],
    })

    const leftEye = extractEye(LEFT_EYE_INDICES)
    const rightEye = extractEye(RIGHT_EYE_INDICES)
    const leftEar = calculateEAR(leftEye)
    const rightEar = calculateEAR(rightEye)
    const averageEar = (leftEar + rightEar) / 2

    // Confidence = how well both eyes are being tracked symmetrically.
    //
    // Blendshape scores are face action-unit intensities (eyeBlink, jawOpen, …).
    // On a neutral face virtually all are ~0, so their average is 0.06–0.08
    // regardless of tracking quality — semantically wrong for a confidence signal.
    //
    // The `visibility` field would be ideal but FaceLandmarker does not populate
    // it (that's a Pose-only feature in this SDK version; it will be 0 for all
    // face landmarks).
    //
    // Best available proxy: EAR symmetry. When both eyes track consistently
    // (leftEar ≈ rightEar), the face is well-aligned for measurement → high
    // confidence. Large asymmetry indicates a turned face or occlusion → lower.
    const eyePoints = [...LEFT_EYE_INDICES, ...RIGHT_EYE_INDICES].map(i => landmarks[i])
    const avgVisibility = eyePoints.reduce((s, p) => s + p.visibility, 0) / eyePoints.length

    let confidence: number
    if (avgVisibility > 0) {
      // Model populated visibility — use it directly.
      confidence = avgVisibility
    } else {
      // EAR symmetry fallback: 1 when both eyes identical, lower as they diverge.
      const maxEar = Math.max(leftEar, rightEar, 0.001)
      confidence = Math.max(0, 1 - Math.abs(leftEar - rightEar) / maxEar)
    }

    return { leftEar, rightEar, averageEar, confidence }
  }

  destroy(): void {
    this.landmarker?.close()
    this.landmarker = null
  }
}
