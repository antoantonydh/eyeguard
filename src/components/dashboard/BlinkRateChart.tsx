import { formatTime } from '../../utils/format'

export interface BlinkRateEntry {
  time: Date
  rate: number
}

interface BlinkRateChartProps {
  data?: BlinkRateEntry[]
  threshold?: number
}

const DEFAULT_THRESHOLD = 12
const Y_AXIS_STEPS = [0, 10, 20, 30]

export function BlinkRateChart({ data = [], threshold = DEFAULT_THRESHOLD }: BlinkRateChartProps) {
  const maxRate = Math.max(...data.map(d => d.rate), 30)
  const chartHeight = 180

  if (data.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>Blink Rate Over Time</span>
        </div>
        <div style={{ color: '#475569', fontSize: 14, textAlign: 'center', paddingBlock: 40 }}>
          No data yet — tracking will fill this chart.
        </div>
      </div>
    )
  }

  const avg = Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length)

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={titleStyle}>Blink Rate Over Time</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>
          Avg: <strong style={{ color: avg >= threshold ? '#22c55e' : '#f59e0b' }}>{avg}/min</strong>
        </span>
      </div>

      {/* Chart area with Y-axis */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Y-axis labels */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          height: chartHeight, paddingBottom: 20, /* align with bar area */
        }}>
          {[...Y_AXIS_STEPS].reverse().map(v => (
            <span key={v} style={{ color: '#475569', fontSize: 10, textAlign: 'right', width: 20, lineHeight: '1' }}>
              {v}
            </span>
          ))}
        </div>

        {/* Bars area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Gridlines */}
          {Y_AXIS_STEPS.map(v => (
            <div key={v} style={{
              position: 'absolute', left: 0, right: 0,
              bottom: `${(v / maxRate) * 100}%`,
              borderTop: '1px solid #1e293b',
              height: 0, zIndex: 0,
              marginBottom: -20 * (v / maxRate), /* offset for bar area padding */
            }} />
          ))}

          {/* Threshold line */}
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `calc(${(threshold / maxRate) * 100}% + 20px)`, /* 20px accounts for time labels */
            borderTop: '2px dashed #f97316', zIndex: 2,
          }}>
            <span style={{
              position: 'absolute', right: 0, top: -16,
              color: '#f97316', fontSize: 10, fontWeight: 600, background: '#16213e', padding: '0 4px',
            }}>
              {threshold}/min threshold
            </span>
          </div>

          {/* Bars with labels */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: data.length > 10 ? 2 : 6,
            height: chartHeight,
          }}>
            {data.map((entry, idx) => {
              const heightPct = Math.max(2, (entry.rate / maxRate) * 100)
              const isAbove = entry.rate >= threshold
              const barColor = isAbove ? '#22c55e' : '#f59e0b'

              return (
                <div key={idx} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', minWidth: 0,
                }}>
                  {/* Value label above bar */}
                  <span style={{
                    color: barColor, fontSize: 11, fontWeight: 700,
                    marginBottom: 2, lineHeight: '1',
                  }}>
                    {Math.round(entry.rate)}
                  </span>

                  {/* Bar */}
                  <div
                    title={`${formatTime(entry.time)}: ${Math.round(entry.rate)} blinks/min`}
                    style={{
                      width: '100%', maxWidth: 32,
                      height: `${heightPct}%`,
                      background: barColor,
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                      transition: 'height 0.3s ease',
                    }}
                  />

                  {/* Time label below bar */}
                  <span style={{
                    color: '#475569', fontSize: 9, marginTop: 4,
                    whiteSpace: 'nowrap', lineHeight: '1',
                  }}>
                    {formatTime(entry.time)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
          Healthy
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
          Below threshold
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
          <span style={{ width: 8, height: 1, borderTop: '2px dashed #f97316', display: 'inline-block' }} />
          Target ({threshold}/min)
        </span>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  background: '#16213e',
  borderRadius: 12,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const titleStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
