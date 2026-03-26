import { useState } from 'react'
import { useSettings } from '../../hooks/use-settings'
import { userProfileRepo } from '../../storage/user-profile-repository'

const SETTING_INFO: Record<string, { title: string; description: string; source: string }> = {
  breakInterval: {
    title: 'Break Interval (20-20-20 Rule)',
    description: 'The American Optometric Association and American Academy of Ophthalmology recommend looking away from your screen every 20 minutes. This interval has the strongest institutional backing among all tested durations.',
    source: 'American Optometric Association (AOA), American Academy of Ophthalmology (AAO)',
  },
  breakDuration: {
    title: 'Break Duration',
    description: 'Research from SUNY College of Optometry (2023) found that 20-second breaks are ineffective at reducing digital eye strain. Breaks need to be at least 60-120 seconds to allow your eye muscles to fully relax and your tear film to recover.',
    source: 'Rosenfield et al., Ophthalmic & Physiological Optics, 2023',
  },
  blinkThreshold: {
    title: 'Blink Rate Threshold',
    description: 'The healthy resting blink rate averages about 14 blinks/minute (range 8-21). During screen use, it drops to just 4-6 blinks/minute — a 60% reduction. You need at least 12 blinks per minute to keep your tear film stable and prevent dry eyes. That means in any 60-second window, you should blink at least 12 times.',
    source: 'Scientific Reports, 2025; Contact Lens and Anterior Eye, 2025',
  },
  stareDelay: {
    title: 'Stare Alert Delay',
    description: 'The average time between natural blinks is about 6 seconds. Going 10+ seconds without blinking puts your tear film at risk of breaking up, which leads to dry, irritated eyes. Clinical studies show tear film breakup begins around 10 seconds in people with healthy eyes, and even sooner for those with dry eye.',
    source: 'Scientific Reports, 2018; Investigative Ophthalmology & Visual Science',
  },
  cameraFps: {
    title: 'Camera Frame Rate',
    description: 'A natural blink lasts only 100-400 milliseconds. At 15 FPS, each frame is 67ms — a fast 100ms blink only appears in 1-2 frames, which is too few for reliable detection. At 24 FPS (42ms/frame), even fast blinks span 3+ frames, making detection reliable. Higher FPS uses more CPU.',
    source: 'MediaPipe benchmarks; Eye Blink Detection research, 2024',
  },
  soundEnabled: {
    title: 'Sound Alerts',
    description: 'Studies on health reminder apps show that silent notifications are frequently ignored. Sound alerts significantly improve compliance with break and blink reminders. A soft chime is recommended — you can always mute when in meetings.',
    source: 'UX research on medication and health reminder compliance',
  },
}

function InfoButton({ settingKey }: { settingKey: string }) {
  const [open, setOpen] = useState(false)
  const info = SETTING_INFO[settingKey]
  if (!info) return null

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none', border: '1px solid #334', borderRadius: '50%',
          width: 20, height: 20, color: '#4fc3f7', fontSize: 11, fontWeight: 700,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: 8, flexShrink: 0,
        }}
        title={`Learn more about ${info.title}`}
      >
        i
      </button>
      {open && (
        <div style={{
          background: '#0d1520', border: '1px solid #1e2d4d', borderRadius: 8,
          padding: '12px 16px', marginTop: 8, fontSize: 13, lineHeight: 1.6,
        }}>
          <div style={{ color: '#e8f4fd', fontWeight: 600, marginBottom: 6 }}>{info.title}</div>
          <p style={{ color: '#94a3b8', margin: '0 0 8px' }}>{info.description}</p>
          <p style={{ color: '#4fc3f7', fontSize: 11, margin: 0 }}>Source: {info.source}</p>
        </div>
      )}
    </>
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
            <InfoButton settingKey="breakInterval" />
          </div>
          <input id="breakInterval" type="number" min={10} max={60}
            value={settings.breakInterval} onChange={handleNumberChange('breakInterval', 10, 60)}
            style={inputStyle} />
          <span style={hintStyle}>How often to remind you to look away (10-60 min)</span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="breakDuration">Break Duration</label>
            <InfoButton settingKey="breakDuration" />
          </div>
          <input id="breakDuration" type="number" min={20} max={120}
            value={settings.breakDuration} onChange={handleNumberChange('breakDuration', 20, 120)}
            style={inputStyle} />
          <span style={hintStyle}>How long each break lasts (20-120 sec). Research recommends 60+ seconds for effective eye relaxation.</span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="blinkThreshold">Blink Rate Alert</label>
            <InfoButton settingKey="blinkThreshold" />
          </div>
          <input id="blinkThreshold" type="number" min={8} max={20}
            value={settings.blinkThreshold} onChange={handleNumberChange('blinkThreshold', 8, 20)}
            style={inputStyle} />
          <span style={hintStyle}>
            Alert when blinks drop below this rate (8-20/min). You need at least {settings.blinkThreshold} blinks every 60 seconds to keep your eyes moist.
          </span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="stareDelay">Stare Alert Delay</label>
            <InfoButton settingKey="stareDelay" />
          </div>
          <input id="stareDelay" type="number" min={5} max={15}
            value={settings.stareDelay} onChange={handleNumberChange('stareDelay', 5, 15)}
            style={inputStyle} />
          <span style={hintStyle}>
            Alert after this many seconds without blinking (5-15 sec). Normal blink interval is ~6 seconds — tear film starts breaking down after ~10 seconds.
          </span>
        </div>

        <hr style={dividerStyle} />

        <div style={fieldStyle}>
          <div style={labelRowStyle}>
            <label style={labelStyle} htmlFor="cameraFps">Camera Frame Rate</label>
            <InfoButton settingKey="cameraFps" />
          </div>
          <input id="cameraFps" type="number" min={15} max={30}
            value={settings.cameraFps} onChange={handleNumberChange('cameraFps', 15, 30)}
            style={inputStyle} />
          <span style={hintStyle}>
            Higher = more accurate blink detection, but uses more CPU (15-30 FPS). 24 FPS recommended for reliable detection.
          </span>
        </div>

        <hr style={dividerStyle} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input id="soundEnabled" type="checkbox" checked={settings.soundEnabled}
            onChange={e => updateSettings({ soundEnabled: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: '#4fc3f7', cursor: 'pointer' }} />
          <label htmlFor="soundEnabled" style={{ color: '#b0bec5', fontSize: 14, cursor: 'pointer' }}>
            Enable sound alerts
          </label>
          <InfoButton settingKey="soundEnabled" />
        </div>

        <p style={{ color: '#4fc3f7', fontSize: 12, fontWeight: 500, marginTop: 8, textAlign: 'center' }}>
          Changes are saved automatically
        </p>
      </div>

      <div style={{ ...cardStyle, marginTop: 24, background: '#1a1520' }}>
        <div style={fieldStyle}>
          <label style={{ ...labelStyle, color: '#f44336' }}>Danger Zone</label>
          <p style={{ color: '#78909c', fontSize: 13, lineHeight: 1.5 }}>
            Reset all data and start from scratch. This will clear your calibration,
            sessions, history, and settings.
          </p>
          <button
            onClick={async () => {
              if (window.confirm('Are you sure? This will delete all your EyeGuard data and restart onboarding.')) {
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
