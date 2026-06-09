import { useState } from 'react'
import { formatIDR, formatDate, CATEGORY_LABELS, CATEGORY_COLORS, todayJakarta } from '../../lib/format'

function FamilyEntryRow({ entry, onEdit, onDelete, authorName, hideDate = false }) {
  const [confirming, setConfirming] = useState(false)
  const label = entry.category === 'lainnya' && entry.custom_label
    ? entry.custom_label
    : CATEGORY_LABELS[entry.category] || entry.category
  const dot = CATEGORY_COLORS[entry.category] || 'oklch(0.55 0.08 60)'

  return (
    <div className="flex items-center gap-3 py-3 group">
      <span className="block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot }} aria-hidden="true" />
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-baseline gap-2">
          {!hideDate && (
            <span className="text-[11px] font-medium text-surface-400 dark:text-surface-500 tabular-nums">{formatDate(entry.date)}</span>
          )}
          <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{label}</span>
        </div>
        {entry.description && (
          <span className="text-[11px] text-surface-400 dark:text-surface-500 block truncate mt-0.5">{entry.description}</span>
        )}
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

function DayHeader({ dateStr, todayStr }) {
  const label = dateStr === todayStr ? 'Today' : formatDate(dateStr)
  return (
    <div className="flex items-center gap-3 pt-4 pb-1 first:pt-0">
      <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.08em] flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-surface-100 dark:bg-surface-800" />
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
      <div className="py-14 flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400 dark:text-surface-500" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-surface-500 dark:text-surface-400">No family expenses yet</p>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Shared household costs will appear here</p>
        </div>
      </div>
    )
  }

  // Group by date, newest first
  const grouped = expenses.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
  const todayStr = todayJakarta()

  return (
    <div>
      <p className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-2">Family this month</p>
      <div>
        {sortedDates.map(date => (
          <div key={date}>
            <DayHeader dateStr={date} todayStr={todayStr} />
            <div className="divide-y divide-surface-50 dark:divide-surface-800/60">
              {grouped[date].map(entry => (
                <FamilyEntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  authorName={userNames[entry.user_id] || 'Unknown'}
                  hideDate
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
