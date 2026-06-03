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

  const goToNow = () => {
    const { year: nowYear, month: nowMonth } = nowJakarta()
    onChange(nowMonth, nowYear)
  }

  const isCurrent = (() => {
    const { year: nowYear, month: nowMonth } = nowJakarta()
    return month === nowMonth && year === nowYear
  })()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={prev}
        className="group p-2.5 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        aria-label="Previous month"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform duration-150 ease-out group-hover:-translate-x-0.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="relative flex flex-col items-center min-w-[90px]">
        <span className={`text-sm font-medium text-center transition-colors ${isCurrent ? 'text-surface-900 dark:text-surface-100' : 'text-surface-600 dark:text-surface-400'}`}>
          {MONTHS[month - 1]} {year}
        </span>
        {isCurrent && (
          <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary-500" aria-hidden="true" />
        )}
      </div>

      <button
        onClick={next}
        disabled={isCurrent}
        className="group p-2.5 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform duration-150 ease-out group-hover:translate-x-0.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {!isCurrent && (
        <button
          onClick={goToNow}
          className="text-[10px] font-semibold text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 px-1.5 py-0.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          Now
        </button>
      )}
    </div>
  )
}
