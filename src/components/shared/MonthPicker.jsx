import { nowJakarta } from '../../lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function MonthPicker({ month, year, onChange }) {
  const prev = () => {
    if (month === 1) onChange(12, year - 1)
    else onChange(month - 1, year)
  }
  const next = () => {
    const { year: nowYear, month: nowMonth } = nowJakarta()
    if (year > nowYear || (year === nowYear && month >= nowMonth)) return
    if (month === 12) onChange(1, year + 1)
    else onChange(month + 1, year)
  }

  const isCurrentMonth = () => {
    const { year: nowYear, month: nowMonth } = nowJakarta()
    return month === nowMonth && year === nowYear
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="group p-2.5 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        aria-label="Previous month"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform duration-150 ease-out group-hover:-translate-x-0.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="text-sm font-medium text-surface-700 dark:text-surface-300 min-w-[90px] text-center">
        {MONTHS[month - 1]} {year}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth()}
        className="group p-2.5 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform duration-150 ease-out group-hover:translate-x-0.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
