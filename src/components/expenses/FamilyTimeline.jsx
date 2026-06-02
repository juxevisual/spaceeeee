import { useState } from 'react'
import { formatIDR, formatDate, CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/format'

function FamilyEntryRow({ entry, onEdit, onDelete, authorName }) {
  const [confirming, setConfirming] = useState(false)
  const label = entry.category === 'lainnya' && entry.custom_label
    ? entry.custom_label
    : CATEGORY_LABELS[entry.category] || entry.category
  const dot = CATEGORY_COLORS[entry.category] || 'oklch(0.55 0.08 60)'

  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className="flex-shrink-0 mt-0.5">
        <span className="block w-2.5 h-2.5 rounded-full mt-1" style={{ background: dot }} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-surface-400 dark:text-surface-500 tabular-nums">{formatDate(entry.date)}</span>
          <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{label}</span>
          {entry.description && (
            <span className="text-xs text-surface-400 dark:text-surface-500 truncate">{entry.description}</span>
          )}
        </div>
        <span className="text-[11px] text-surface-400 dark:text-surface-600 mt-0.5 block">by {authorName}</span>
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
              aria-label="Edit family expense"
              className="p-1.5 rounded-md text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => setConfirming(true)}
              aria-label="Delete family expense"
              className="p-1.5 rounded-md text-surface-300 dark:text-surface-600 hover:text-loss hover:bg-loss-light dark:hover:bg-loss/10 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function FamilyTimeline({ expenses, monthlyTotal, onEdit, onDelete, loading, userNames }) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading family expenses">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-10 rounded-lg bg-surface-100 dark:bg-surface-800" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl">
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">No family expenses this month</p>
        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Tap + Add to log a shared household expense</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-100 dark:border-surface-800">
        <p className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em]">Family this month</p>
        <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 tabular-nums">{formatIDR(monthlyTotal)}</p>
      </div>
      <div className="divide-y divide-surface-50 dark:divide-surface-800/60">
        {expenses.map(entry => (
          <FamilyEntryRow
            key={entry.id}
            entry={entry}
            onEdit={onEdit}
            onDelete={onDelete}
            authorName={userNames[entry.user_id] || 'Unknown'}
          />
        ))}
      </div>
    </div>
  )
}

