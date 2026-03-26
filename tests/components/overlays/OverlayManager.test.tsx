import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OverlayManager } from '../../../src/components/overlays/OverlayManager'
import type { AlertState } from '../../../src/alerts/alert-manager'

describe('OverlayManager', () => {
  const noop = vi.fn()
  const baseProps = { onStartBreak: noop, onSkipBreak: noop, soundEnabled: false }

  it('renders nothing when no alert', () => {
    const { container } = render(<OverlayManager alert={null} {...baseProps} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders blink reminder for blink alert', () => {
    const alert: AlertState = { type: 'blink', message: 'Your blink rate is 8/min (target: 12+)' }
    render(<OverlayManager alert={alert} {...baseProps} />)
    expect(screen.getByText(/Remember to Blink/)).toBeInTheDocument()
  })

  it('renders break overlay for break alert', () => {
    const alert: AlertState = { type: 'break', message: 'Time for a 20-20-20 break' }
    render(<OverlayManager alert={alert} {...baseProps} />)
    expect(screen.getByText(/Start Break/)).toBeInTheDocument()
  })

  it('renders stare alert for stare type', () => {
    const alert: AlertState = { type: 'stare', message: '7s without blinking' }
    render(<OverlayManager alert={alert} {...baseProps} />)
    expect(screen.getByText(/Blink Now/)).toBeInTheDocument()
  })
})
