import { useSettings } from '../../hooks/use-settings'

const pageStyle: React.CSSProperties = {
  padding: '32px 24px',
  maxWidth: '540px',
  margin: '0 auto',
  width: '100%',
}

const headingStyle: React.CSSProperties = {
  color: '#e8f4fd',
  fontSize: '22px',
  fontWeight: 700,
  marginBottom: '28px',
  letterSpacing: '0.3px',
}

const cardStyle: React.CSSProperties = {
  background: '#16213e',
  borderRadius: '12px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const labelStyle: React.CSSProperties = {
  color: '#b0bec5',
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const inputStyle: React.CSSProperties = {
  background: '#0f1729',
  border: '1px solid #1e2d4d',
  borderRadius: '8px',
  color: '#e8f4fd',
  fontSize: '15px',
  padding: '10px 14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const hintStyle: React.CSSProperties = {
  color: '#546e7a',
  fontSize: '12px',
}

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const checkboxLabelStyle: React.CSSProperties = {
  color: '#b0bec5',
  fontSize: '14px',
  cursor: 'pointer',
}

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #1e2d4d',
  margin: '4px 0',
}

const savedBadgeStyle: React.CSSProperties = {
  color: '#4fc3f7',
  fontSize: '12px',
  fontWeight: 500,
  marginTop: '8px',
  textAlign: 'center',
}

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings()

  if (loading) {
    return (
      <div style={{ ...pageStyle, color: '#546e7a', fontSize: '14px' }}>
        Loading settings…
      </div>
    )
  }

  function handleNumberChange(
    field: 'breakInterval' | 'breakDuration' | 'blinkThreshold' | 'stareDelay',
    min: number,
    max: number,
  ) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseInt(e.target.value, 10)
      if (isNaN(raw)) return
      const clamped = Math.min(max, Math.max(min, raw))
      updateSettings({ [field]: clamped })
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Settings</h1>

      <div style={cardStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="breakInterval">
            Break Interval
          </label>
          <input
            id="breakInterval"
            type="number"
            min={10}
            max={60}
            value={settings.breakInterval}
            onChange={handleNumberChange('breakInterval', 10, 60)}
            style={inputStyle}
          />
          <span style={hintStyle}>Minutes between break reminders (10–60 min)</span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="breakDuration">
            Break Duration
          </label>
          <input
            id="breakDuration"
            type="number"
            min={10}
            max={60}
            value={settings.breakDuration}
            onChange={handleNumberChange('breakDuration', 10, 60)}
            style={inputStyle}
          />
          <span style={hintStyle}>Duration of each break in seconds (10–60 sec)</span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="blinkThreshold">
            Blink Threshold
          </label>
          <input
            id="blinkThreshold"
            type="number"
            min={8}
            max={15}
            value={settings.blinkThreshold}
            onChange={handleNumberChange('blinkThreshold', 8, 15)}
            style={inputStyle}
          />
          <span style={hintStyle}>
            Alert below this blink rate (8–15 blinks/min)
          </span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="stareDelay">
            Stare Alert Delay
          </label>
          <input
            id="stareDelay"
            type="number"
            min={3}
            max={10}
            value={settings.stareDelay}
            onChange={handleNumberChange('stareDelay', 3, 10)}
            style={inputStyle}
          />
          <span style={hintStyle}>
            Seconds without blinking before stare alert (3–10 sec)
          </span>
        </div>

        <hr style={dividerStyle} />

        <div style={checkboxRowStyle}>
          <input
            id="soundEnabled"
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={e => updateSettings({ soundEnabled: e.target.checked })}
            style={{ width: '16px', height: '16px', accentColor: '#4fc3f7', cursor: 'pointer' }}
          />
          <label htmlFor="soundEnabled" style={checkboxLabelStyle}>
            Enable sound alerts
          </label>
        </div>

        <p style={savedBadgeStyle}>Changes are saved automatically</p>
      </div>
    </div>
  )
}
