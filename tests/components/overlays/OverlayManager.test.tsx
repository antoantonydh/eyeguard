import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OverlayManager } from '../../../src/components/overlays/OverlayManager'
import type { AlertState } from '../../../src/alerts/alert-manager'

describe('OverlayManager', () => {
  const noop = vi.fn()

  it('renders nothing when no alert', () => {
    const { container } = render(<OverlayManager alert={null} onStartBreak={noop} onSkipBreak={noop} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders blink reminder for blink alert', () => {
    const alert: AlertState = { type: 'blink', message: 'Remember to blink — 8/min' }
    render(<OverlayManager alert={alert} onStartBreak={noop} onSkipBreak={noop} />)
    expect(screen.getByText(/Remember to blink/)).toBeInTheDocument()
  })

  it('renders break overlay for break alert', () => {
    const alert: AlertState = { type: 'break', message: 'Time for a 20-20-20 break' }
    render(<OverlayManager alert={alert} onStartBreak={noop} onSkipBreak={noop} />)
    expect(screen.getByText(/20-20-20/)).toBeInTheDocument()
  })

  it('renders stare alert for stare type', () => {
    const alert: AlertState = { type: 'stare', message: 'Blink now — 7s without blinking' }
    render(<OverlayManager alert={alert} onStartBreak={noop} onSkipBreak={noop} />)
    expect(screen.getByText(/Blink now/)).toBeInTheDocument()
  })
})
