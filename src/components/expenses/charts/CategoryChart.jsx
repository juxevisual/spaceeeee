import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CATEGORY_LABELS, CATEGORY_COLORS, formatCompact } from '../../../lib/format'
import { useChartColors } from '../../../hooks/useChartColors'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-surface-700 dark:text-surface-300">{CATEGORY_LABELS[label] || label}</p>
      <p className="text-surface-500 tabular-nums">{formatCompact(payload[0].value)}</p>
    </div>
  )
}

function CategoryLegend({ categories }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
      {categories.map(cat => (
        <div key={cat} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS[cat] || 'oklch(0.55 0.07 272)' }} aria-hidden="true" />
          <span className="text-[11px] text-surface-500 dark:text-surface-400 truncate">{CATEGORY_LABELS[cat]}</span>
        </div>
      ))}
    </div>
  )
}

export function CategoryChart({ allExpenses }) {
  const { tick, cursor } = useChartColors()

  const data = Object.keys(CATEGORY_LABELS).map(cat => ({
    category: cat,
    total: allExpenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(d => d.total > 0).sort((a, b) => b.total - a.total)

  if (data.length === 0) return null

  const srSummary = data.map(d => `${CATEGORY_LABELS[d.category]}: ${formatCompact(d.total)}`).join(', ')

  return (
    <div>
      <span className="sr-only">Spending by category: {srSummary}</span>
      <div className="h-48" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <XAxis type="number" tickFormatter={v => formatCompact(v)} tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" tickFormatter={v => CATEGORY_LABELS[v]?.split(' ')[0] || v} tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} width={64} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: cursor }} />
            <Bar dataKey="total" radius={[0, 3, 3, 0]} maxBarSize={14}>
              {data.map(entry => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || 'oklch(0.55 0.07 272)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <CategoryLegend categories={data.map(d => d.category)} />
    </div>
  )
}
