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

export function BlinkRateChart({ data = [], threshold = DEFAULT_THRESHOLD }: BlinkRateChartProps) {
  const maxRate = Math.max(...data.map(d => d.rate), threshold * 2, 25)

  const containerStyle: React.CSSProperties = {
    background: '#16213e',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }

  const titleStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const chartAreaStyle: React.CSSProperties = {
    position: 'relative',
    height: '160px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
  }

  const thresholdPct = (threshold / maxRate) * 100

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Blink Rate Over Time</div>
      {data.length === 0 ? (
        <div style={{ color: '#475569', fontSize: '14px', textAlign: 'center', paddingBlock: '40px' }}>
          No data yet — start a session to see your blink rate.
        </div>
      ) : (
        <>
          <div style={chartAreaStyle}>
            {/* Threshold line */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${thresholdPct}%`,
                borderTop: '1px dashed #f97316',
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: `${thresholdPct}%`,
                transform: 'translateY(-100%)',
                color: '#f97316',
                fontSize: '11px',
                zIndex: 3,
              }}
            >
              {threshold} min
            </div>
            {/* Bars */}
            {data.map((entry, idx) => {
              const heightPct = (entry.rate / maxRate) * 100
              const isAbove = entry.rate >= threshold
              return (
                <div
                  key={idx}
                  title={`${formatTime(entry.time)}: ${entry.rate} blinks/min`}
                  style={{
                    flex: 1,
                    height: `${heightPct}%`,
                    background: isAbove ? '#22c55e' : '#f97316',
                    borderRadius: '3px 3px 0 0',
                    minWidth: '6px',
                  }}
                />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {data.length > 0 && (
              <>
                <span style={{ color: '#475569', fontSize: '11px' }}>{formatTime(data[0].time)}</span>
                <span style={{ color: '#475569', fontSize: '11px' }}>{formatTime(data[data.length - 1].time)}</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
