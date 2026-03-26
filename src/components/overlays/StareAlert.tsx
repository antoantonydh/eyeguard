const styles = {
  container: {
    position: 'fixed' as const,
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1c1200',
    border: '1px solid #d97706',
    borderRadius: '999px',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    zIndex: 9000,
    color: '#fde68a',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    whiteSpace: 'nowrap' as const,
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#f59e0b',
    flexShrink: 0,
    animation: 'eyeguard-pulse 1s ease-in-out infinite',
  },
  message: {
    color: '#fde68a',
  },
}

const pulseKeyframes = `
  @keyframes eyeguard-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }
`

export function StareAlert({ message }: { message: string }) {
  return (
    <>
      <style>{pulseKeyframes}</style>
      <div style={styles.container} role="alert" aria-live="assertive">
        <div style={styles.dot} aria-hidden="true" />
        <span style={styles.message}>{message}</span>
      </div>
    </>
  )
}
