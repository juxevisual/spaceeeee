import { formatCompact, nowJakarta } from '../../lib/format'

export function SpendingPace({ currentTotal, lastMonthPartial, month, year, loading }) {
  const { day: nowDay } = nowJakarta()
  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyAvg = nowDay > 0 ? currentTotal / nowDay : 0
  const projected = Math.round(dailyAvg * daysInMonth)

  const hasComparison = lastMonthPartial !== null && lastMonthPartial > 0
  const delta = hasComparison ? currentTotal - lastMonthPartial : null
  const deltaPct = hasComparison && delta !== null ? (delta / lastMonthPartial) * 100 : null

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate()
  const lastMonthProjected = hasComparison && nowDay > 0 ? Math.round((lastMonthPartial / nowDay) * daysInPrevMonth) : null
  const projectionDeltaPct = lastMonthProjected && lastMonthProjected > 0 ? ((projected - lastMonthProjected) / lastMonthProjected) * 100 : null
  const projectionColor = projectionDeltaPct !== null
    ? projectionDeltaPct > 10 ? 'text-loss-dark dark:text-loss'
    : projectionDeltaPct < -10 ? 'text-gain-dark dark:text-gain'
    : 'text-surface-700 dark:text-surface-300'
    : 'text-surface-700 dark:text-surface-300'

  // Nothing to show if no spending yet and not loading
  if (!loading && currentTotal <= 0) return null

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="animate-pulse h-2.5 w-40 bg-surface-100 dark:bg-surface-800 rounded-full" />
        <div className="animate-pulse h-2.5 w-32 bg-surface-100 dark:bg-surface-800 rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {hasComparison && delta !== null && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.06em]">
              vs last month
            </span>
            <span className={`text-xs font-semibold tabular-nums ${
              delta > 0
                ? 'text-loss-dark dark:text-loss'
                : 'text-gain-dark dark:text-gain'
            }`}>
              {delta > 0 ? '+' : '-'}{formatCompact(Math.abs(delta))}
            </span>
            {deltaPct !== null && (
              <span className={`text-[10px] tabular-nums opacity-70 ${
                delta > 0 ? 'text-loss-dark dark:text-loss' : 'text-gain-dark dark:text-gain'
              }`}>
                ({delta > 0 ? '+' : ''}{deltaPct.toFixed(0)}%)
              </span>
            )}
          </div>
          <span className="text-surface-200 dark:text-surface-700" aria-hidden="true">·</span>
        </>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.06em]">
          on pace for
        </span>
        <span className={`text-xs font-semibold tabular-nums ${projectionColor}`}>
          {formatCompact(projected)}
        </span>
      </div>
    </div>
  )
}
