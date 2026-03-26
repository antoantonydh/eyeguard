let audioCtx: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void {
  const ctx = getContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)

  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

/** Gentle double chime — soft reminder to blink */
export function playBlinkSound(): void {
  playTone(880, 0.15, 'sine', 0.2)
  setTimeout(() => playTone(1047, 0.2, 'sine', 0.15), 180)
}

/** Calm descending bell — time for a break */
export function playBreakSound(): void {
  playTone(784, 0.3, 'sine', 0.25)
  setTimeout(() => playTone(659, 0.3, 'sine', 0.2), 300)
  setTimeout(() => playTone(523, 0.4, 'sine', 0.15), 600)
}

/** Urgent rising pulse — stare detected, blink now */
export function playStareSound(): void {
  playTone(440, 0.1, 'square', 0.15)
  setTimeout(() => playTone(554, 0.1, 'square', 0.18), 130)
  setTimeout(() => playTone(659, 0.15, 'square', 0.2), 260)
}
