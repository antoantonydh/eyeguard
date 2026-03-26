export type SegmentType = 'healthy' | 'low-blink' | 'break'

export interface Segment {
  type: SegmentType
  durationMinutes: number
  label?: string
}

interface SessionTimelineProps {
  segments?: Segment[]
  totalMinutes?: number
}

const SEGMENT_COLORS: Record<SegmentType, string> = {
  healthy: '#22c55e',
  'low-blink': '#f97316',
  break: '#3b82f6',
}

const SEGMENT_LABELS: Record<SegmentType, string> = {
  healthy: 'Healthy',
  'low-blink': 'Low blink',
  break: 'Break',
}

export function SessionTimeline({ segments = [], totalMinutes }: SessionTimelineProps) {
  const total = totalMinutes ?? segments.reduce((sum, s) => sum + s.durationMinutes, 0)

  const containerStyle: React.CSSProperties = {
    background: '#16213e',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const titleStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const barStyle: React.CSSProperties = {
    display: 'flex',
    height: '28px',
    borderRadius: '6px',
    overflow: 'hidden',
    background: '#0f1729',
    gap: '2px',
  }

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
  }

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Session Timeline</div>
      {total === 0 ? (
        <div style={{ color: '#475569', fontSize: '14px', textAlign: 'center', paddingBlock: '8px' }}>
          No session data yet.
        </div>
      ) : (
        <>
          <div style={barStyle}>
            {segments.map((segment, idx) => {
              const widthPct = total > 0 ? (segment.durationMinutes / total) * 100 : 0
              return (
                <div
                  key={idx}
                  title={`${SEGMENT_LABELS[segment.type]}: ${segment.durationMinutes} min`}
                  style={{
                    width: `${widthPct}%`,
                    background: SEGMENT_COLORS[segment.type],
                    minWidth: widthPct > 0 ? '2px' : 0,
                  }}
                />
              )
            })}
          </div>
          <div style={legendStyle}>
            {(['healthy', 'low-blink', 'break'] as SegmentType[]).map(type => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: SEGMENT_COLORS[type],
                  }}
                />
                <span style={{ color: '#64748b', fontSize: '12px' }}>{SEGMENT_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
