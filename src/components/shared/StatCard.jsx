export function StatCard({ label, value, sub, trend, loading, labelStyle }) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-2.5 w-16 bg-surface-200 dark:bg-surface-700 rounded mb-2" />
        <div className="h-7 w-28 bg-surface-200 dark:bg-surface-700 rounded" />
      </div>
    )
  }
  return (
    <div>
      <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-1.5 leading-none" style={labelStyle}>
        {label}
      </p>
      <p key={value} className="text-xl font-bold text-surface-900 dark:text-surface-100 tabular-nums tracking-[-0.01em] leading-tight stat-value-in">
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 font-medium leading-none ${
          trend === 'up' ? 'text-gain' :
          trend === 'down' ? 'text-loss' :
          'text-surface-400 dark:text-surface-500'
        }`}>
          {sub}
        </p>
      )}
    </div>
  )
}
