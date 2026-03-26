import { useEffect, useState } from 'react'

interface BlinkReminderProps {
  message: string
  onDismiss: () => void
}

const DISMISS_DELAY_MS = 5000

const styles = {
  container: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    zIndex: 9000,
    maxWidth: '320px',
    color: '#e2e8f0',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
  },
  icon: {
    fontSize: '22px',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    lineHeight: 1.4,
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '18px',
    padding: '0 2px',
    lineHeight: 1,
    flexShrink: 0,
  },
}

export function BlinkReminder({ message, onDismiss }: BlinkReminderProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss()
    }, DISMISS_DELAY_MS)

    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!visible) return null

  return (
    <div style={styles.container} role="status" aria-live="polite">
      <span style={styles.icon} aria-hidden="true">👁️</span>
      <span style={styles.message}>{message}</span>
      <button
        style={styles.dismissButton}
        onClick={() => {
          setVisible(false)
          onDismiss()
        }}
        aria-label="Dismiss blink reminder"
      >
        ×
      </button>
    </div>
  )
}
