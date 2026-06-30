import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getAllCategories, nowJakarta } from '../../lib/format'
import { downloadExpenseReport } from '../../lib/expenseReport'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function TypePills({ value, onChange }) {
  const opts = [
    { key: 'both',     label: 'Both',     color: 'oklch(0.56 0.14 250)' },
    { key: 'personal', label: 'Personal', color: 'oklch(0.60 0.26 280)' },
    { key: 'family',   label: 'Family',   color: 'oklch(0.64 0.19 150)' },
  ]
  return (
    <div className="flex gap-2">
      {opts.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          style={value === o.key ? { backgroundColor: o.color, color: 'white' } : {}}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 active:scale-[0.97] ${
            value === o.key
              ? 'shadow-sm'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function MonthYearSelect({ month, year, onMonthChange, onYearChange, years }) {
  const selectCls = 'px-3 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 [color-scheme:light] dark:[color-scheme:dark]'
  return (
    <div className="flex gap-2">
      <select value={month} onChange={e => onMonthChange(Number(e.target.value))} className={`flex-1 ${selectCls}`}>
        {MONTH_NAMES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
      </select>
      <select value={year} onChange={e => onYearChange(Number(e.target.value))} className={selectCls}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

export function ExpenseExport({ onClose, month, year, expenses, familyExpenses, tab, customCategories = [], user }) {
  const { year: nowYear } = nowJakarta()
  const years = Array.from({ length: nowYear - 2022 }, (_, i) => 2023 + i)

  const [mode, setMode] = useState('month')
  const [monthType, setMonthType] = useState('both')
  const [fromMonth, setFromMonth] = useState(month)
  const [fromYear, setFromYear] = useState(year)
  const [toMonth, setToMonth] = useState(month)
  const [toYear, setToYear] = useState(year)
  const [rangeType, setRangeType] = useState('both')
  const [loading, setLoading] = useState(false)

  const catMap = Object.fromEntries(getAllCategories(customCategories).map(c => [c.key, c.label]))

  const monthData =
    monthType === 'personal' ? expenses
    : monthType === 'family' ? familyExpenses
    : [...expenses, ...familyExpenses]
  const monthTotal = monthData.reduce((s, e) => s + Number(e.amount), 0)

  const pad = n => String(n).padStart(2, '0')

  const handleMonthExport = () => {
    downloadExpenseReport({
      expenses: monthData,
      catMap,
      title: `Expenses – ${MONTH_NAMES[month - 1]} ${year}`,
      fileName: `expenses-${year}-${pad(month)}.csv`,
    })
    onClose()
  }

  const handleRangeExport = async () => {
    setLoading(true)
    try {
      const fromDate = `${fromYear}-${pad(fromMonth)}-01`
      const toLastDay = new Date(toYear, toMonth, 0).getDate()
      const toDate = `${toYear}-${pad(toMonth)}-${pad(toLastDay)}`

      let data
      if (rangeType === 'both') {
        const [pRes, fRes] = await Promise.all([
          supabase.from('expenses').select('*').eq('user_id', user.id).eq('type', 'personal').gte('date', fromDate).lte('date', toDate),
          supabase.from('expenses').select('*').eq('type', 'family').gte('date', fromDate).lte('date', toDate),
        ])
        data = [...(pRes.data || []), ...(fRes.data || [])]
      } else if (rangeType === 'personal') {
        const res = await supabase.from('expenses').select('*').eq('user_id', user.id).eq('type', 'personal').gte('date', fromDate).lte('date', toDate)
        data = res.data || []
      } else {
        const res = await supabase.from('expenses').select('*').eq('type', 'family').gte('date', fromDate).lte('date', toDate)
        data = res.data || []
      }

      const sameMonth = fromMonth === toMonth && fromYear === toYear
      const titleLabel = sameMonth
        ? `${MONTH_NAMES[fromMonth - 1]} ${fromYear}`
        : `${MONTH_NAMES[fromMonth - 1]} ${fromYear} – ${MONTH_NAMES[toMonth - 1]} ${toYear}`
      const fileSlug = sameMonth
        ? `${fromYear}-${pad(fromMonth)}`
        : `${fromYear}${pad(fromMonth)}-${toYear}${pad(toMonth)}`

      downloadExpenseReport({
        expenses: data,
        catMap,
        title: `Expenses – ${titleLabel}`,
        fileName: `expenses-${fileSlug}.csv`,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const sectionLabel = 'text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-2'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export expenses"
    >
      <div className="dialog-backdrop-enter absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="dialog-panel-enter relative w-full max-w-sm bg-surface-50 dark:bg-surface-900 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] dark:ring-white/[0.12] overflow-hidden">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-100 dark:border-surface-800">
          <h2 className="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">Export Expenses</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Mode toggle */}
          <div className="inline-flex gap-0.5 p-0.5 rounded-full bg-surface-100 dark:bg-surface-800">
            {[['month', 'This month'], ['range', 'Date range']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={mode === m ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                  mode === m ? 'text-white' : 'text-surface-500 dark:text-surface-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'month' ? (
            <div className="space-y-4">
              <div>
                <p className={sectionLabel}>Period</p>
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                  {MONTH_NAMES[month - 1]} {year}
                </p>
              </div>

              <div>
                <p className={sectionLabel}>Type</p>
                <TypePills value={monthType} onChange={setMonthType} />
              </div>

              <div className="px-4 py-3 rounded-2xl bg-surface-100 dark:bg-surface-800">
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-0.5">
                  {monthData.length} {monthData.length === 1 ? 'entry' : 'entries'}
                </p>
                <p className="text-lg font-bold tracking-tight text-surface-800 dark:text-surface-200">
                  Rp {Math.round(monthTotal).toLocaleString('id-ID')}
                </p>
              </div>

              <button
                onClick={handleMonthExport}
                disabled={monthData.length === 0}
                style={{ backgroundColor: 'oklch(0.60 0.26 280)' }}
                className="w-full py-2.5 text-xs font-semibold rounded-full text-white disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.97] transition-all ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <DownloadIcon />
                Download CSV
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className={sectionLabel}>From</p>
                <MonthYearSelect month={fromMonth} year={fromYear} onMonthChange={setFromMonth} onYearChange={setFromYear} years={years} />
              </div>

              <div>
                <p className={sectionLabel}>To</p>
                <MonthYearSelect month={toMonth} year={toYear} onMonthChange={setToMonth} onYearChange={setToYear} years={years} />
              </div>

              <div>
                <p className={sectionLabel}>Type</p>
                <TypePills value={rangeType} onChange={setRangeType} />
              </div>

              <button
                onClick={handleRangeExport}
                disabled={loading}
                style={{ backgroundColor: 'oklch(0.60 0.26 280)' }}
                className="w-full py-2.5 text-xs font-semibold rounded-full text-white disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.97] transition-all ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                {loading ? <SpinIcon /> : <DownloadIcon />}
                {loading ? 'Fetching…' : 'Export CSV'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function SpinIcon() {
  return (
    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M22 12A10 10 0 0 0 12 2" />
    </svg>
  )
}
