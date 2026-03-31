interface ScoreInput {
  breaksTaken: number
  breaksOffered: number
  avgBlinkRate: number
  blinkThreshold: number
  stareAlerts: number
}

export function calculateScore(input: ScoreInput): number {
  const { breaksTaken, breaksOffered, avgBlinkRate, blinkThreshold, stareAlerts } = input

  const breakScore = breaksOffered === 0
    ? 40
    : (breaksTaken / breaksOffered) * 40

  const blinkScore = avgBlinkRate >= blinkThreshold
    ? 40
    : (avgBlinkRate / blinkThreshold) * 40

  const stareScore = stareAlerts < 5
    ? 20
    : Math.max(0, 20 - stareAlerts)

  return Math.round(breakScore + blinkScore + stareScore)
}
