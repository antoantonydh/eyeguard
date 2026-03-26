import { useState, useEffect } from 'react'
import type { DailyStats } from '../../types'
import { dailyStatsRepo } from '../../storage/daily-stats-repository'

function getDateRange(): { from: string; to: string } {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const fromDate = new Date(today)
  fromDate.setDate(fromDate.getDate() - 6)
  const from = fromDate.toISOString().slice(0, 10)
  return { from, to }
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function scoreColor(score: number): string {
  if (score >= 80) return '#4caf50'
  if (score >= 60) return '#ffa726'
  return '#ef5350'
}

const pageStyle: React.CSSProperties = {
  padding: '32px 24px',
  maxWidth: '720px',
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

const gridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const cardStyle: React.CSSProperties = {
  background: '#16213e',
  borderRadius: '12px',
  padding: '18px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
}

const dateStyle: React.CSSProperties = {
  color: '#b0bec5',
  fontSize: '13px',
  fontWeight: 600,
  minWidth: '100px',
}

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  flex: 1,
  flexWrap: 'wrap',
}

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const statLabelStyle: React.CSSProperties = {
  color: '#546e7a',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
}

const statValueStyle: React.CSSProperties = {
  color: '#e8f4fd',
  fontSize: '14px',
  fontWeight: 500,
}

function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: `3px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontWeight: 700,
        fontSize: '14px',
        flexShrink: 0,
      }}
    >
      {score}
    </div>
  )
}

function DayCard({ stats }: { stats: DailyStats }) {
  return (
    <div style={cardStyle}>
      <span style={dateStyle}>{formatDate(stats.date)}</span>

      <div style={statsRowStyle}>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Screen Time</span>
          <span style={statValueStyle}>{formatMinutes(stats.totalScreenTime)}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Breaks</span>
          <span style={statValueStyle}>{stats.breaksTaken}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Avg Blink Rate</span>
          <span style={statValueStyle}>{stats.avgBlinkRate.toFixed(1)}/min</span>
        </div>
      </div>

      <ScoreBadge score={stats.score} />
    </div>
  )
}

const emptyStyle: React.CSSProperties = {
  background: '#16213e',
  borderRadius: '12px',
  padding: '48px 24px',
  textAlign: 'center',
  color: '#546e7a',
  fontSize: '15px',
}

export function HistoryPage() {
  const [days, setDays] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { from, to } = getDateRange()
        const results = await dailyStatsRepo.getRange(from, to)
        const sorted = [...results].sort((a, b) => b.date.localeCompare(a.date))
        setDays(sorted)
      } catch (err) {
        console.error('Failed to load history:', err)
        setDays([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ ...pageStyle, color: '#546e7a', fontSize: '14px' }}>
        Loading history…
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Last 7 Days</h1>

      <div style={gridStyle}>
        {days.length === 0 ? (
          <div style={emptyStyle}>No data yet — start tracking to see your history.</div>
        ) : (
          days.map(day => <DayCard key={day.date} stats={day} />)
        )}
      </div>
    </div>
  )
}
