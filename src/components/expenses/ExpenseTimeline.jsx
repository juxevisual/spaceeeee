import { useState } from 'react'
import { formatIDR, formatDate, CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/format'

function EntryRow({ entry, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const label = entry.category === 'lainnya' && entry.custom_label
    ? entry.custom_label
    : CATEGORY_LABELS[entry.category] || entry.category
  const dot = CATEGORY_COLORS[entry.category] || 'oklch(0.55 0.08 60)'

  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className="flex-shrink-0 mt-0.5">
        <span
          className="block w-2.5 h-2.5 rounded-full mt-1"
          style={{ background: dot }}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-surface-400 dark:text-surface-500 tabular-nums">{formatDate(entry.date)}</span>
          <span className="text-xs font-medium" style={{ color: dot }}>{label}</span>
          {entry.description && (
            <span className="text-xs text-surface-400 dark:text-surface-500 truncate">{entry.description}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums">
          {formatIDR(entry.amount)}
        </span>
        {confirming ? (
          <div className="flex gap-1">
            <button
              onClick={() => onDelete(entry.id)}
              className="text-[11px] font-medium text-loss border border-loss/30 rounded-md px-2 py-1 hover:bg-loss-light dark:hover:bg-loss/10 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px] text-surface-400 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(entry)}
              aria-label="Edit expense"
              className="p-1.5 rounded-md text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => setConfirming(true)}
              aria-label="Delete expense"
              className="p-1.5 rounded-md text-surface-300 dark:text-surface-600 hover:text-loss hover:bg-loss-light dark:hover:bg-loss/10 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function CategorySummaryBar({ byCategory, total }) {
  const entries = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  if (entries.length === 0) return null

  return (
    <div className="space-y-2.5">
      {entries.map(([cat, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0
        const dot = CATEGORY_COLORS[cat] || 'oklch(0.55 0.08 60)'
        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                <span className="text-xs text-surface-600 dark:text-surface-400">{CATEGORY_LABELS[cat]}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-surface-400 dark:text-surface-500 tabular-nums">{pct.toFixed(0)}%</span>
                <span className="text-xs font-medium text-surface-700 dark:text-surface-300 tabular-nums w-24 text-right">{formatIDR(amount)}</span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: dot }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ExpenseTimeline({ expenses, byCategory, monthlyTotal, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading expenses">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse h-10 rounded-lg bg-surface-100 dark:bg-surface-800" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl">
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Nothing logged this month</p>
        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Tap + Add to record your first expense</p>
      </div>
    )
  }

  return (
    <div>
      {/* Category summary bar */}
      <div className="pb-5 mb-6 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em]">By category</p>
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 tabular-nums">{formatIDR(monthlyTotal)}</p>
        </div>
        <CategorySummaryBar byCategory={byCategory} total={monthlyTotal} />
      </div>

      {/* Timeline */}
      <div className="divide-y divide-surface-50 dark:divide-surface-800/60">
        {expenses.map(entry => (
          <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

