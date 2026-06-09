import { useState, useEffect } from 'react'
import { formatCompact, formatDate, CATEGORY_LABELS, CATEGORY_COLORS, getAllCategories } from '../../lib/format'
import { supabase } from '../../lib/supabase'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function MonthReview({ expenses, familyExpenses, monthlyTotal, familyTotal, month, year, onClose, customCategories = [] }) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const [prevTotal, setPrevTotal] = useState(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
    const endDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0]
    supabase
      .from('expenses')
      .select('amount')
      .gte('date', startDate)
      .lte('date', endDate)
      .then(({ data }) => {
        if (data) setPrevTotal(data.reduce((s, e) => s + Number(e.amount), 0))
      })
  }, [month, year])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 280)
  }

  const isSlid = mounted && !closing
  const allExpenses = [...expenses, ...familyExpenses]
  const totalCombined = monthlyTotal + familyTotal

  const delta = prevTotal !== null ? totalCombined - prevTotal : null
  const deltaPct = (prevTotal !== null && prevTotal > 0) ? (delta / prevTotal) * 100 : null

  const categoryLookup = Object.fromEntries(
    getAllCategories(customCategories).map(c => [c.key, c])
  )

  const combinedByCategory = allExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {})

  const topCategories = Object.entries(combinedByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const entryCount = allExpenses.length
  const activeDays = new Set(allExpenses.map(e => e.date)).size

  const byDay = allExpenses.reduce((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + Number(e.amount)
    return acc
  }, {})
  const biggestDay = Object.entries(byDay).sort(([, a], [, b]) => b - a)[0]

  const biggestExpense = [...allExpenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0]

  const prevMonthName = MONTH_NAMES[month === 1 ? 11 : month - 2]
  const hasSplit = monthlyTotal > 0 && familyTotal > 0

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 dark:bg-black/60 transition-opacity duration-300 ${isSlid ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${MONTH_NAMES[month - 1]} ${year} review`}
        className={`fixed bottom-0 inset-x-0 z-50 flex flex-col rounded-t-[1.75rem] bg-surface-50 dark:bg-surface-900 shadow-[0_-8px_40px_rgba(0,0,0,0.14)] transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isSlid ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '90dvh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden="true">
          <div className="w-9 h-1 rounded-full bg-surface-200 dark:bg-surface-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-4 flex-shrink-0 border-b border-surface-100 dark:border-surface-800">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-0.5" style={{ color: 'oklch(0.60 0.16 280)' }}>Month review</p>
            <h2 className="text-base font-bold text-surface-900 dark:text-surface-100 tracking-tight">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close review"
            className="p-2 rounded-full text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-7">

          {/* Hero: total + delta */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'oklch(0.60 0.16 280)' }}>Total spent</p>
            <p className="text-[2.6rem] font-bold text-surface-900 dark:text-surface-100 tracking-[-0.03em] leading-none tabular-nums">
              {formatCompact(totalCombined)}
            </p>
            {delta !== null && (
              <p className={`text-sm font-semibold tabular-nums mt-2.5 ${
                delta > 0 ? 'text-loss-dark dark:text-loss' : 'text-gain-dark dark:text-gain'
              }`}>
                {delta > 0 ? '+' : '-'}{formatCompact(Math.abs(delta))}
                {deltaPct !== null && (
                  <span className="font-normal opacity-70 ml-1.5 text-xs">
                    ({delta > 0 ? '+' : ''}{deltaPct.toFixed(0)}%) vs {prevMonthName}
                  </span>
                )}
              </p>
            )}
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-2 tabular-nums">
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'} across {activeDays} {activeDays === 1 ? 'day' : 'days'}
            </p>
          </div>

          {/* Top categories */}
          {topCategories.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: 'oklch(0.60 0.16 280)' }}>Top categories</p>
              <div className="space-y-3.5">
                {topCategories.map(([cat, amount]) => {
                  const pct = totalCombined > 0 ? (amount / totalCombined) * 100 : 0
                  const catInfo = categoryLookup[cat] || {}
                  const dot = catInfo.color || CATEGORY_COLORS[cat] || 'oklch(0.55 0.08 60)'
                  const catLabel = catInfo.label || CATEGORY_LABELS[cat] || cat
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{catLabel}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-surface-400 dark:text-surface-500 tabular-nums">{pct.toFixed(0)}%</span>
                          <span className="text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums w-16 text-right">{formatCompact(amount)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: dot }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Highlights */}
          {(biggestDay || biggestExpense || hasSplit) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: 'oklch(0.60 0.16 280)' }}>Highlights</p>
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {biggestDay && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs text-surface-500 dark:text-surface-400">Biggest day</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums">{formatCompact(biggestDay[1])}</p>
                      <p className="text-[11px] text-surface-400 dark:text-surface-500">{formatDate(biggestDay[0])}</p>
                    </div>
                  </div>
                )}
                {biggestExpense && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs text-surface-500 dark:text-surface-400">Biggest expense</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums">{formatCompact(Number(biggestExpense.amount))}</p>
                      <p className="text-[11px] text-surface-400 dark:text-surface-500 max-w-[140px] truncate">
                        {biggestExpense.description
                          ? biggestExpense.description
                          : (categoryLookup[biggestExpense.category]?.label || CATEGORY_LABELS[biggestExpense.category] || biggestExpense.category)
                        }
                      </p>
                    </div>
                  </div>
                )}
                {hasSplit && (
                  <>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-xs text-surface-500 dark:text-surface-400">Personal</span>
                      <span className="text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums">{formatCompact(monthlyTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-xs text-surface-500 dark:text-surface-400">Family</span>
                      <span className="text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums">{formatCompact(familyTotal)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="h-2" />
        </div>
      </div>
    </>
  )
}
