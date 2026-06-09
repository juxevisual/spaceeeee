import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CATEGORY_LABELS, formatCompact } from '../../../lib/format'
import { useChartColors } from '../../../hooks/useChartColors'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-surface-700 dark:text-surface-300 mb-1">{CATEGORY_LABELS[label] || label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }} className="tabular-nums">
          {p.name}: {formatCompact(p.value)}
        </p>
      ))}
    </div>
  )
}

export function ComparisonChart({ allExpenses, userId, partnerId, user1Name, user2Name }) {
  const { tick, cursor } = useChartColors()
  const categories = Object.keys(CATEGORY_LABELS)

  const data = categories.map(cat => {
    const mine = allExpenses.filter(e => e.category === cat && e.user_id === userId).reduce((s, e) => s + Number(e.amount), 0)
    const partner = allExpenses.filter(e => e.category === cat && e.user_id === partnerId).reduce((s, e) => s + Number(e.amount), 0)
    return { category: cat, [user1Name]: mine, [user2Name]: partner }
  }).filter(d => d[user1Name] > 0 || d[user2Name] > 0)

  if (data.length === 0) return (
    <div className="h-48 flex items-center justify-center text-sm text-surface-400 dark:text-surface-500">
      No data for this month
    </div>
  )

  const srSummary = data.map(d =>
    `${CATEGORY_LABELS[d.category]}: ${user1Name} ${formatCompact(d[user1Name])}, ${user2Name} ${formatCompact(d[user2Name])}`
  ).join('; ')

  return (
    <div>
      <span className="sr-only">{srSummary}</span>
      <div style={{ height: Math.max(180, data.length * 40 + 32) }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <XAxis type="number" tickFormatter={v => formatCompact(v)} tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" tickFormatter={v => CATEGORY_LABELS[v]?.split(' ')[0] || v} tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: cursor }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Bar dataKey={user1Name} fill="oklch(0.60 0.26 280)" radius={[0, 3, 3, 0]} maxBarSize={16} />
            <Bar dataKey={user2Name} fill="oklch(0.64 0.19 150)" radius={[0, 3, 3, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
