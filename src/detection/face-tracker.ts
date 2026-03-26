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

    let confidence = 0.5

    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const scores = results.faceBlendshapes[0].categories
        .map(c => c.score)
        .filter(s => s > 0)
      confidence =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5
    } else {
      const eyePoints = [...LEFT_EYE_INDICES, ...RIGHT_EYE_INDICES].map(i => landmarks[i])
      const avgY = eyePoints.reduce((s, p) => s + p.y, 0) / eyePoints.length
      const variance =
        eyePoints.reduce((s, p) => s + (p.y - avgY) ** 2, 0) / eyePoints.length
      confidence = Math.min(1, Math.max(0, 1 - variance * 100))
    }

    return { leftEar, rightEar, averageEar, confidence }
  }

  destroy(): void {
    this.landmarker?.close()
    this.landmarker = null
  }
}
