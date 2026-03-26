import { useSettings } from '../../hooks/use-settings'
import { userProfileRepo } from '../../storage/user-profile-repository'

interface SettingInfo {
  text: string
  sourceLabel: string
  sourceUrl: string
}

const SETTING_INFO: Record<string, SettingInfo> = {
  breakInterval: {
    text: 'AOA & AAO recommend every 20 min. The strongest evidence-backed interval for reducing digital eye strain.',
    sourceLabel: 'American Academy of Ophthalmology',
    sourceUrl: 'https://www.aao.org/eye-health/tips-prevention/computer-usage',
  },
  breakDuration: {
    text: '20-second breaks are ineffective (SUNY, 2023). 60-120 seconds needed for eye muscles and tear film to recover.',
    sourceLabel: 'Rosenfield et al., 2023',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/35963776/',
  },
  blinkThreshold: {
    text: 'Healthy average: ~14 blinks/min. Screen use drops it to 4-6/min. Below 12/min your tear film destabilizes.',
    sourceLabel: 'Scientific Reports, 2025',
    sourceUrl: 'https://www.nature.com/articles/s41598-025-26424-z',
  },
  stareDelay: {
    text: 'Normal interblink: ~6 sec. Tear film starts breaking down at ~10 sec. Alert fires before damage occurs.',
    sourceLabel: 'Scientific Reports, 2018',
    sourceUrl: 'https://www.nature.com/articles/s41598-018-31814-7',
  },
  cameraFps: {
    text: 'A blink lasts 100-400ms. At 24 FPS (42ms/frame) even fast blinks span 3+ frames for reliable detection.',
    sourceLabel: 'MediaPipe Blink Detection Research',
    sourceUrl: 'https://www.preprints.org/manuscript/202410.0131/v2/download',
  },
  soundEnabled: {
    text: 'Studies show silent health notifications are frequently ignored. Sound improves compliance significantly.',
    sourceLabel: 'Notification UX Research',
    sourceUrl: 'https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/',
  },
}

function InfoTooltip({ settingKey }: { settingKey: string }) {
  const info = SETTING_INFO[settingKey]
  if (!info) return null

  const tooltipId = `tooltip-${settingKey}`

  return (
    <span className="info-tooltip-wrap" style={{ position: 'relative', display: 'inline-flex', marginLeft: 8 }}>
      <span
        className={`info-trigger-${tooltipId}`}
        style={{
          background: 'none', border: '1px solid #334', borderRadius: '50%',
          width: 18, height: 18, color: '#4fc3f7', fontSize: 10, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'help', flexShrink: 0,
        }}
      >
        i
      </span>
      <span
        className={`info-popup-${tooltipId}`}
        style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: '#0d1520', border: '1px solid #1e2d4d', borderRadius: 8,
          padding: '10px 14px', fontSize: 12, lineHeight: 1.5, color: '#94a3b8',
          width: 300, marginBottom: 8, pointerEvents: 'none',
          opacity: 0, transition: 'opacity 0.15s', zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        {info.text}
        <a
          href={info.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', marginTop: 6, color: '#4fc3f7', fontSize: 11,
            textDecoration: 'underline',
          }}
        >
          Source: {info.sourceLabel}
        </a>
      </span>
      <style>{`
        .info-trigger-${tooltipId}:hover + .info-popup-${tooltipId},
        .info-popup-${tooltipId}:hover {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </span>
  )
}

const pageStyle: React.CSSProperties = {
  padding: '32px 24px', maxWidth: '540px', margin: '0 auto', width: '100%',
}

const headingStyle: React.CSSProperties = {
  color: '#e8f4fd', fontSize: '22px', fontWeight: 700, marginBottom: '28px',
}

const cardStyle: React.CSSProperties = {
  background: '#16213e', borderRadius: '12px', padding: '24px',
  display: 'flex', flexDirection: 'column', gap: '20px',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '6px',
}

const labelRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
}

const labelStyle: React.CSSProperties = {
  color: '#b0bec5', fontSize: '13px', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.5px',
}

const inputStyle: React.CSSProperties = {
  background: '#0f1729', border: '1px solid #1e2d4d', borderRadius: '8px',
  color: '#e8f4fd', fontSize: '15px', padding: '10px 14px', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

const hintStyle: React.CSSProperties = { color: '#546e7a', fontSize: '12px' }
const dividerStyle: React.CSSProperties = { border: 'none', borderTop: '1px solid #1e2d4d', margin: '4px 0' }

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings()

  if (loading) {
    return <div style={{ ...pageStyle, color: '#546e7a', fontSize: '14px' }}>Loading settings...</div>
  }

  function handleNumberChange(
    field: 'breakInterval' | 'breakDuration' | 'blinkThreshold' | 'stareDelay' | 'cameraFps',
    min: number, max: number,
  ) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseInt(e.target.value, 10)
      if (isNaN(raw)) return
      updateSettings({ [field]: Math.min(max, Math.max(min, raw)) })
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Settings</h1>

      <div style={cardStyle}>
        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="breakInterval">Break Interval</label>
            <InfoTooltip settingKey="breakInterval" />
          </div>
          <input id="breakInterval" type="number" min={10} max={60}
            value={settings.breakInterval} onChange={handleNumberChange('breakInterval', 10, 60)}
            style={inputStyle} />
          <span style={hintStyle}>Minutes between break reminders (10-60)</span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="breakDuration">Break Duration</label>
            <InfoTooltip settingKey="breakDuration" />
          </div>
          <input id="breakDuration" type="number" min={20} max={120}
            value={settings.breakDuration} onChange={handleNumberChange('breakDuration', 20, 120)}
            style={inputStyle} />
          <span style={hintStyle}>Seconds per break (20-120). 60+ sec recommended.</span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="blinkThreshold">Blink Rate Alert</label>
            <InfoTooltip settingKey="blinkThreshold" />
          </div>
          <input id="blinkThreshold" type="number" min={8} max={20}
            value={settings.blinkThreshold} onChange={handleNumberChange('blinkThreshold', 8, 20)}
            style={inputStyle} />
          <span style={hintStyle}>
            Alert below this rate. Need {settings.blinkThreshold}+ blinks per 60 sec.
          </span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="stareDelay">Stare Alert Delay</label>
            <InfoTooltip settingKey="stareDelay" />
          </div>
          <input id="stareDelay" type="number" min={5} max={15}
            value={settings.stareDelay} onChange={handleNumberChange('stareDelay', 5, 15)}
            style={inputStyle} />
          <span style={hintStyle}>Seconds without blinking before alert (5-15)</span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="cameraFps">Camera FPS</label>
            <InfoTooltip settingKey="cameraFps" />
          </div>
          <input id="cameraFps" type="number" min={15} max={30}
            value={settings.cameraFps} onChange={handleNumberChange('cameraFps', 15, 30)}
            style={inputStyle} />
          <span style={hintStyle}>Higher = better detection, more CPU (15-30)</span>
        </div>

        <hr style={dividerStyle} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input id="soundEnabled" type="checkbox" checked={settings.soundEnabled}
            onChange={e => updateSettings({ soundEnabled: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: '#4fc3f7', cursor: 'pointer' }} />
          <label htmlFor="soundEnabled" style={{ color: '#b0bec5', fontSize: 14, cursor: 'pointer' }}>
            Enable sound alerts
          </label>
          <InfoTooltip settingKey="soundEnabled" />
        </div>

        <p style={{ color: '#4fc3f7', fontSize: 12, fontWeight: 500, textAlign: 'center' }}>
          Changes saved automatically
        </p>
      </div>

      <div style={{ ...cardStyle, marginTop: 24, background: '#1a1520' }}>
        <div style={fieldStyle}>
          <label style={{ ...labelStyle, color: '#f44336' }}>Danger Zone</label>
          <p style={{ color: '#78909c', fontSize: 13, lineHeight: 1.5 }}>
            Clear all data and restart onboarding from scratch.
          </p>
          <button
            onClick={async () => {
              if (window.confirm('Delete all EyeGuard data and restart?')) {
                await userProfileRepo.resetAll()
                window.location.reload()
              }
            }}
            style={{
              background: '#f4433620', border: '1px solid #f44336', color: '#f44336',
              padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', marginTop: 8,
            }}
          >
            Reset Everything
          </button>
        </div>
      </div>
    </div>
  )
}
