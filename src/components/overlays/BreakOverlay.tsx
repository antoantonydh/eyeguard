interface BreakOverlayProps {
  message: string
  countdown?: number
  onStartBreak: () => void
  onSkipBreak: () => void
}

const styles = {
  container: {
    position: 'fixed' as const,
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#0f2918',
    border: '1px solid #16a34a',
    borderRadius: '999px',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    zIndex: 9000,
    color: '#bbf7d0',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    whiteSpace: 'nowrap' as const,
  },
  icon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    color: '#86efac',
  },
  countdown: {
    backgroundColor: '#166534',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: '#bbf7d0',
    flexShrink: 0,
  },
  startButton: {
    backgroundColor: '#16a34a',
    border: 'none',
    borderRadius: '999px',
    padding: '6px 14px',
    cursor: 'pointer',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
  },
  skipButton: {
    background: 'none',
    border: '1px solid #166534',
    borderRadius: '999px',
    padding: '6px 12px',
    cursor: 'pointer',
    color: '#86efac',
    fontSize: '13px',
  },
}

export function BreakOverlay({ message, countdown, onStartBreak, onSkipBreak }: BreakOverlayProps) {
  return (
    <div style={styles.container} role="alertdialog" aria-label="Break reminder">
      <span style={styles.icon} aria-hidden="true">🌿</span>
      <span style={styles.message}>{message}</span>
      {countdown !== undefined ? (
        <div style={styles.countdown} aria-label={`${countdown} seconds remaining`}>
          {countdown}s
        </div>
      ) : (
        <button style={styles.startButton} onClick={onStartBreak}>
          Start break
        </button>
      )}
      <button style={styles.skipButton} onClick={onSkipBreak} aria-label="Skip break">
        Skip
      </button>
    </div>
  )
}
