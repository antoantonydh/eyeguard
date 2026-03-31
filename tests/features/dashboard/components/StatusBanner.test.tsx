import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBanner } from '../../../../src/components/dashboard/StatusBanner'

describe('StatusBanner', () => {
  it('shows healthy status when blink rate is good', () => {
    render(<StatusBanner blinkRate={18} minutesUntilBreak={14} />)
    expect(screen.getByText(/healthy/i)).toBeInTheDocument()
  })
  it('shows warning when blink rate is low', () => {
    render(<StatusBanner blinkRate={8} minutesUntilBreak={14} />)
    expect(screen.getByText(/low/i)).toBeInTheDocument()
  })
  it('shows next break countdown', () => {
    render(<StatusBanner blinkRate={18} minutesUntilBreak={14.5} />)
    expect(screen.getByText(/14:30/)).toBeInTheDocument()
  })
})
