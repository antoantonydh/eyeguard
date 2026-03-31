import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyScore } from '../../../../src/features/dashboard/components/DailyScore'

describe('DailyScore', () => {
  it('renders the score value', () => {
    render(<DailyScore score={85} breaksTaken={3} breaksOffered={4} avgBlinkRate={17} />)
    expect(screen.getByText('85')).toBeInTheDocument()
  })
  it('renders break stats', () => {
    render(<DailyScore score={85} breaksTaken={3} breaksOffered={4} avgBlinkRate={17} />)
    expect(screen.getByText(/3\/4 breaks/i)).toBeInTheDocument()
  })
})
