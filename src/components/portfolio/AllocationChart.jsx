import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, formatCompact } from '../../lib/format'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-surface-800 dark:text-surface-200">{ASSET_TYPE_LABELS[name] || name}</p>
      <p className="text-surface-500 dark:text-surface-400">{formatCompact(value)}</p>
      <p className="text-primary-500">{p.pct}%</p>
    </div>
  )
}

export function AllocationChart({ allocationByType }) {
  const total = Object.values(allocationByType).reduce((a, b) => a + b, 0)

  const data = Object.entries(allocationByType)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: key,
      value,
      pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-surface-400 dark:text-surface-500">
        No holdings yet
      </div>
    )
  }

  const srSummary = data.map(d => `${ASSET_TYPE_LABELS[d.name] || d.name}: ${d.pct}%`).join(', ')

  return (
    <div className="flex items-center gap-6">
      <span className="sr-only">Asset allocation: {srSummary}</span>
      <div className="w-32 h-32 flex-shrink-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={56}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={ASSET_TYPE_COLORS[i % ASSET_TYPE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: ASSET_TYPE_COLORS[i % ASSET_TYPE_COLORS.length] }}
            />
            <span className="text-surface-600 dark:text-surface-400 truncate">
              {ASSET_TYPE_LABELS[entry.name] || entry.name}
            </span>
            <span className="text-surface-400 dark:text-surface-500 ml-auto pl-2 tabular-nums">
              {entry.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
