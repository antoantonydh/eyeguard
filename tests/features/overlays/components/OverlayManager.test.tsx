import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OverlayManager } from '../../../../src/features/overlays/components/OverlayManager'
import type { AlertState } from '../../../../src/providers/alert-manager'

const mockAlert: { value: AlertState | null } = { value: null }

vi.mock('../../../../src/hooks/use-alerts', () => ({
  useAlerts: () => ({
    alert: mockAlert.value,
    isBreakActive: false,
    minutesUntilBreak: 20,
    breaksOffered: 0,
    breaksTaken: 0,
    startBreak: vi.fn(),
    skipBreak: vi.fn(),
    resetBreakTimer: vi.fn(),
  }),
}))

vi.mock('../../../../src/hooks/use-settings', () => ({
  useSettings: () => ({
    settings: {
      soundEnabled: false,
      nativeNotifications: false,
      breakInterval: 20,
      breakDuration: 20,
      blinkThreshold: 12,
      stareDelay: 20,
      cameraFps: 24,
      chartInterval: 60,
    },
    profile: null,
    loading: false,
    isCalibrated: false,
    updateSettings: vi.fn(),
    reload: vi.fn(),
  }),
}))

describe('OverlayManager', () => {
  beforeEach(() => {
    mockAlert.value = null
  })

  it('renders nothing when no alert', () => {
    const { container } = render(<OverlayManager />)
    expect(container.firstChild).toBeNull()
  })

  it('renders blink reminder for blink alert', () => {
    mockAlert.value = { type: 'blink', message: 'Your blink rate is 8/min (target: 12+)' }
    render(<OverlayManager />)
    expect(screen.getByText(/Remember to Blink/)).toBeInTheDocument()
  })

  it('renders break overlay for break alert', () => {
    mockAlert.value = { type: 'break', message: 'Time for a 20-20-20 break' }
    render(<OverlayManager />)
    expect(screen.getByText(/Start Break/)).toBeInTheDocument()
  })

  it('renders stare alert for stare type', () => {
    mockAlert.value = { type: 'stare', message: '7s without blinking' }
    render(<OverlayManager />)
    expect(screen.getByText(/Blink Now/)).toBeInTheDocument()
  })
})
