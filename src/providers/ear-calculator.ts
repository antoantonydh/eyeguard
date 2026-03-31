export interface Point {
  x: number
  y: number
}

export interface EyeLandmarks {
  p1: Point
  p2: Point
  p3: Point
  p4: Point
  p5: Point
  p6: Point
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function earForOneEye(eye: EyeLandmarks): number {
  const vertical1 = distance(eye.p2, eye.p6)
  const vertical2 = distance(eye.p3, eye.p5)
  const horizontal = distance(eye.p1, eye.p4)

  if (horizontal === 0) return 0

  return (vertical1 + vertical2) / (2 * horizontal)
}

export function calculateEAR(leftEye: EyeLandmarks, rightEye?: EyeLandmarks): number {
  if (!rightEye) return earForOneEye(leftEye)
  return (earForOneEye(leftEye) + earForOneEye(rightEye)) / 2
}
