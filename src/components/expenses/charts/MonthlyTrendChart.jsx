import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCompact } from '../../../lib/format'
import { useChartColors } from '../../../hooks/useChartColors'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-surface-700 dark:text-surface-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.stroke }} className="tabular-nums">
          {p.name}: {formatCompact(p.value)}
        </p>
      ))}
    </div>
  )
}

export function MonthlyTrendChart({ trendData, user1Name, user2Name, userId, partnerId }) {
  const { tick } = useChartColors()

  if (!trendData?.length) return (
    <div className="h-40 flex items-center justify-center text-sm text-surface-400 dark:text-surface-500">
      Loading trend…
    </div>
  )

  const chartData = trendData.map(({ year, month, data }) => {
    const mine = data.filter(e => e.user_id === userId).reduce((s, e) => s + Number(e.amount), 0)
    const partner = data.filter(e => e.user_id === partnerId).reduce((s, e) => s + Number(e.amount), 0)
    return { label: `${MONTHS_SHORT[month - 1]} ${String(year).slice(2)}`, [user1Name]: mine, [user2Name]: partner }
  })

  const srSummary = chartData.map(d =>
    `${d.label}: ${user1Name} ${formatCompact(d[user1Name])}, ${user2Name} ${formatCompact(d[user2Name])}`
  ).join('; ')

  return (
    <div>
      <span className="sr-only">Monthly trend: {srSummary}</span>
      <div className="h-48" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => formatCompact(v)} tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Line type="monotone" dataKey={user1Name} stroke="oklch(0.60 0.26 280)" strokeWidth={2} dot={{ r: 3, fill: 'oklch(0.60 0.26 280)', strokeWidth: 0 }} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey={user2Name} stroke="oklch(0.64 0.19 150)" strokeWidth={2} dot={{ r: 3, fill: 'oklch(0.64 0.19 150)', strokeWidth: 0 }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
