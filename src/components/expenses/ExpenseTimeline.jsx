import { useState } from 'react'
import { formatIDR, formatDate, CATEGORY_LABELS, CATEGORY_COLORS, getAllCategories, todayJakarta } from '../../lib/format'

function EntryRow({ entry, onEdit, onDelete, categoryLookup = {}, hideDate = false }) {
  const [confirming, setConfirming] = useState(false)
  const catInfo = categoryLookup[entry.category] || {}
  const label = entry.category === 'lainnya' && entry.custom_label
    ? entry.custom_label
    : catInfo.label || CATEGORY_LABELS[entry.category] || entry.category
  const dot = catInfo.color || CATEGORY_COLORS[entry.category] || 'oklch(0.55 0.08 60)'

  return (
    <div className="flex items-center gap-3 py-3 group">
      <span
        className="block w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: dot }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-baseline gap-2">
          {!hideDate && (
            <span className="text-[11px] font-medium text-surface-400 dark:text-surface-500 tabular-nums">{formatDate(entry.date)}</span>
          )}
          <span className="text-xs font-medium" style={{ color: dot }}>{label}</span>
        </div>
        {entry.description && (
          <span className="text-[11px] text-surface-400 dark:text-surface-500 block truncate mt-0.5">{entry.description}</span>
        )}
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

export function CategorySummaryBar({ byCategory, total, categoryLookup = {}, velocityByCategory = null, currentFrequency = null, avgFrequencyByCategory = null }) {
  const entries = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  if (entries.length === 0) return null

  return (
    <div className="space-y-2.5">
      {entries.map(([cat, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0
        const catInfo = categoryLookup[cat] || {}
        const dot = catInfo.color || CATEGORY_COLORS[cat] || 'oklch(0.55 0.08 60)'
        const catLabel = catInfo.label || CATEGORY_LABELS[cat] || cat

        let velocityGlyph = null
        if (velocityByCategory !== null) {
          const last = velocityByCategory[cat]
          if (last > 0) {
            const deltaPct = (amount - last) / last * 100
            if (deltaPct > 10) {
              velocityGlyph = <span className="text-[10px] font-semibold text-loss-dark dark:text-loss leading-none" aria-label="spending faster than last month">↑</span>
            } else if (deltaPct < -10) {
              velocityGlyph = <span className="text-[10px] font-semibold text-gain-dark dark:text-gain leading-none" aria-label="spending slower than last month">↓</span>
            }
          }
        }

        const currentCount = currentFrequency?.[cat] ?? null
        const avgCount = avgFrequencyByCategory?.[cat] ?? null
        const showFreq = currentCount !== null && currentCount >= 2

        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                <span className="text-xs text-surface-600 dark:text-surface-400 truncate">{catLabel}</span>
                {velocityGlyph}
                {showFreq && (
                  <span className="text-[10px] text-surface-400 dark:text-surface-500 flex-shrink-0" aria-label={`${currentCount} entries this month${avgCount ? `, average ${avgCount}` : ''}`}>
                    {currentCount}×{avgCount !== null && avgCount !== currentCount ? ` avg ${avgCount}` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-surface-400 dark:text-surface-500 tabular-nums">{pct.toFixed(0)}%</span>
                <span className="text-xs font-medium text-surface-700 dark:text-surface-300 tabular-nums flex-shrink-0 text-right">{formatIDR(amount)}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
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

export function ExpenseTimeline({ expenses, byCategory, monthlyTotal, onEdit, onDelete, loading, customCategories = [], velocityByCategory = null, currentFrequency = null, avgFrequencyByCategory = null }) {
  const categoryLookup = Object.fromEntries(
    getAllCategories(customCategories).map(c => [c.key, c])
  )

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
      <div className="py-14 flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400 dark:text-surface-500" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 2.5 2L12 18l2.5 2L17 18l3 2V4a2 2 0 0 0-2-2z" />
            <line x1="9" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-surface-500 dark:text-surface-400">Nothing logged yet</p>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Add an expense to start tracking this month</p>
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
      {/* Category summary */}
      <div className="pb-5 mb-2 border-b border-surface-100 dark:border-surface-800">
        <p className="text-xs font-medium uppercase tracking-[0.07em] mb-3" style={{ color: 'oklch(0.60 0.16 280)' }}>By category</p>
        <CategorySummaryBar byCategory={byCategory} total={monthlyTotal} categoryLookup={categoryLookup} velocityByCategory={velocityByCategory} currentFrequency={currentFrequency} avgFrequencyByCategory={avgFrequencyByCategory} />
      </div>

      {/* Day-grouped timeline */}
      <div>
        {sortedDates.map(date => (
          <div key={date}>
            <DayHeader dateStr={date} todayStr={todayStr} />
            <div className="divide-y divide-surface-50 dark:divide-surface-800/60">
              {grouped[date].map(entry => (
                <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} categoryLookup={categoryLookup} hideDate />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
