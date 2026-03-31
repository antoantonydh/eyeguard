import { formatTime } from '../../../utils/format'

export interface BlinkRateEntry {
  time: Date
  rate: number
}

interface BlinkRateChartProps {
  data?: BlinkRateEntry[]
  threshold?: number
}

const DEFAULT_THRESHOLD = 12
const BAR_ZONE_PX = 140   // fixed pixel height of the bar drawing area
const LABEL_HEIGHT_PX = 18 // value label above each bar
const TIME_HEIGHT_PX = 16  // time label below each bar

export function BlinkRateChart({ data = [], threshold = DEFAULT_THRESHOLD }: BlinkRateChartProps) {
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

  const maxRate = Math.max(...data.map(d => d.rate), threshold + 5)
  // Round maxRate up to a clean number for the Y-axis
  const yMax = Math.ceil(maxRate / 5) * 5
  const avg = Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length)

  // Y-axis gridline values: 0, and steps up to yMax
  const step = yMax <= 20 ? 5 : 10
  const ySteps: number[] = []
  for (let v = 0; v <= yMax; v += step) ySteps.push(v)

  const toPx = (rate: number) => Math.max(2, (rate / yMax) * BAR_ZONE_PX)
  const thresholdPx = toPx(threshold)

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={titleStyle}>Blink Rate Over Time</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>
          Avg: <strong style={{ color: avg >= threshold ? '#22c55e' : '#f59e0b' }}>{avg}/min</strong>
        </span>
      </div>

      {/* Chart body: Y-axis + bar area */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>

        {/* Y-axis labels — positioned over the bar zone + label space */}
        <div style={{
          width: 24, flexShrink: 0,
          height: BAR_ZONE_PX + LABEL_HEIGHT_PX,
          position: 'relative',
        }}>
          {ySteps.map(v => (
            <span key={v} style={{
              position: 'absolute',
              bottom: (v / yMax) * BAR_ZONE_PX,
              right: 0,
              color: '#475569', fontSize: 10, lineHeight: '1',
              transform: 'translateY(50%)',
            }}>
              {v}
            </span>
          ))}
        </div>

        {/* Bar + gridline area */}
        <div style={{ flex: 1, position: 'relative' }}>

          {/* Gridlines sit inside the bar zone only */}
          <div style={{ position: 'relative', height: BAR_ZONE_PX + LABEL_HEIGHT_PX }}>
            {ySteps.map(v => (
              <div key={v} style={{
                position: 'absolute',
                left: 0, right: 0,
                bottom: (v / yMax) * BAR_ZONE_PX,
                borderTop: `1px solid ${v === 0 ? '#334155' : '#1e293b'}`,
                zIndex: 0,
              }} />
            ))}

            {/* Threshold line */}
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              bottom: thresholdPx,
              borderTop: '2px dashed #f97316',
              zIndex: 2,
            }}>
              <span style={{
                position: 'absolute', right: 0, top: -14,
                color: '#f97316', fontSize: 9, fontWeight: 600,
                background: '#16213e', padding: '0 3px',
              }}>
                {threshold}/min
              </span>
            </div>

            {/* Bars with value labels — all in pixel heights */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              display: 'flex',
              alignItems: 'flex-end',
              gap: data.length > 12 ? 2 : 4,
              height: BAR_ZONE_PX + LABEL_HEIGHT_PX,
            }}>
              {data.map((entry, idx) => {
                const barPx = toPx(entry.rate)
                const isAbove = entry.rate >= threshold
                const barColor = isAbove ? '#22c55e' : '#f59e0b'

                return (
                  <div key={idx} style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center',
                    height: BAR_ZONE_PX + LABEL_HEIGHT_PX,
                    justifyContent: 'flex-end',
                  }}>
                    {/* Value label — fixed height above bar */}
                    <span style={{
                      color: barColor, fontSize: 10, fontWeight: 700,
                      height: LABEL_HEIGHT_PX, lineHeight: `${LABEL_HEIGHT_PX}px`,
                      textAlign: 'center', overflow: 'hidden',
                    }}>
                      {Math.round(entry.rate)}
                    </span>

                    {/* Bar — pixel height */}
                    <div
                      title={`${formatTime(entry.time)}: ${Math.round(entry.rate)} blinks/min`}
                      style={{
                        width: '100%', maxWidth: 36,
                        height: barPx,
                        background: barColor,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                        zIndex: 1,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time labels — separate row below bar area */}
          <div style={{
            display: 'flex', gap: data.length > 12 ? 2 : 4,
            height: TIME_HEIGHT_PX, alignItems: 'center',
          }}>
            {data.map((entry, idx) => (
              <div key={idx} style={{
                flex: 1, minWidth: 0,
                textAlign: 'center',
                color: '#475569', fontSize: 9,
                overflow: 'hidden', whiteSpace: 'nowrap',
              }}>
                {formatTime(entry.time)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
          Healthy
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
          Below threshold
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
