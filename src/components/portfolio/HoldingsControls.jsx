import { useState, useRef, useEffect } from 'react'
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS_MAP } from '../../lib/format'

const SORT_OPTIONS = [
  { key: 'value-desc', label: 'Value: high to low' },
  { key: 'value-asc', label: 'Value: low to high' },
  { key: 'gain-desc', label: 'Gain: best to worst' },
  { key: 'gain-asc', label: 'Gain: worst to best' },
  { key: 'name-asc', label: 'Name A to Z' },
  { key: 'updated', label: 'Recently updated' },
]

function SortMenu({ sortBy, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = SORT_OPTIONS.find(o => o.key === sortBy)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(s => !s)}
        aria-expanded={open}
        aria-label="Sort holdings"
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="9" y2="18" />
        </svg>
        <span className="hidden sm:inline max-w-[112px] truncate">{current?.label ?? 'Sort'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl py-1 overflow-hidden">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                sortBy === opt.key
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-semibold'
                  : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium'
              }`}
            >
              {sortBy === opt.key ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : <span className="w-[10px]" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-[11px] font-semibold text-surface-700 dark:text-surface-300 ring-1 ring-surface-200/80 dark:ring-surface-700/40">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter`}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </span>
  )
}

export function HoldingsControls({
  search, onSearch,
  sortBy, onSort,
  filterTypes, onFilterTypes,
  filterPlatforms, onFilterPlatforms,
  filterCurrencies, onFilterCurrencies,
  availableTypes, availablePlatforms, availableCurrencies,
  totalCount, filteredCount,
}) {
  const [showFilter, setShowFilter] = useState(false)

  const activeChipCount = filterTypes.length + filterPlatforms.length + filterCurrencies.length
  const hasAnyActive = !!(search || activeChipCount)

  const toggle = (arr, setter, val) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const clearAll = () => {
    onSearch('')
    onFilterTypes([])
    onFilterPlatforms([])
    onFilterCurrencies([])
    setShowFilter(false)
  }

  const showTypeFilter = availableTypes.length > 1
  const showPlatformFilter = availablePlatforms.length > 1
  const showCurrencyFilter = availableCurrencies.length > 1
  const hasFilterOptions = showTypeFilter || showPlatformFilter || showCurrencyFilter

  return (
    <div className="space-y-2 mb-4">
      {/* Control bar */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="flex-1 relative min-w-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search holdings..."
            className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 dark:focus:border-primary-500 transition-shadow"
          />
          {search && (
            <button type="button" onClick={() => onSearch('')} aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <SortMenu sortBy={sortBy} onChange={onSort} />

        {hasFilterOptions && (
          <button
            type="button"
            onClick={() => setShowFilter(s => !s)}
            aria-expanded={showFilter}
            aria-label="Filter holdings"
            className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] flex-shrink-0 ${
              showFilter || activeChipCount > 0
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {activeChipCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: 'oklch(0.60 0.26 280)' }}>
                {activeChipCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Inline filter panel */}
      {hasFilterOptions && (
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showFilter ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="p-3 rounded-2xl bg-surface-100 dark:bg-surface-800 space-y-3 ring-1 ring-black/[0.04] dark:ring-white/[0.06] mt-0.5">
              {showTypeFilter && (
                <div>
                  <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-1.5">Asset type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTypes.map(type => {
                      const isActive = filterTypes.includes(type)
                      const color = ASSET_TYPE_COLORS_MAP[type]
                      return (
                        <button key={type} type="button" onClick={() => toggle(filterTypes, onFilterTypes, type)}
                          style={isActive && color ? { backgroundColor: color } : undefined}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 active:scale-[0.97] ${
                            isActive ? 'text-white shadow-sm' : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-600'
                          }`}>
                          {ASSET_TYPE_LABELS[type] || type}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {showPlatformFilter && (
                <div>
                  <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-1.5">Platform</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePlatforms.map(p => {
                      const isActive = filterPlatforms.includes(p)
                      return (
                        <button key={p} type="button" onClick={() => toggle(filterPlatforms, onFilterPlatforms, p)}
                          style={isActive ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 active:scale-[0.97] ${
                            isActive ? 'text-white shadow-sm' : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-600'
                          }`}>
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {showCurrencyFilter && (
                <div>
                  <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-1.5">Currency</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCurrencies.map(c => {
                      const isActive = filterCurrencies.includes(c)
                      return (
                        <button key={c} type="button" onClick={() => toggle(filterCurrencies, onFilterCurrencies, c)}
                          style={isActive ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
                          className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-full transition-all duration-200 active:scale-[0.97] ${
                            isActive ? 'text-white shadow-sm' : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-600'
                          }`}>
                          {c}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active chips */}
      {activeChipCount > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {filterTypes.map(t => <FilterChip key={t} label={ASSET_TYPE_LABELS[t] || t} onRemove={() => onFilterTypes(filterTypes.filter(x => x !== t))} />)}
          {filterPlatforms.map(p => <FilterChip key={p} label={p} onRemove={() => onFilterPlatforms(filterPlatforms.filter(x => x !== p))} />)}
          {filterCurrencies.map(c => <FilterChip key={c} label={c} onRemove={() => onFilterCurrencies(filterCurrencies.filter(x => x !== c))} />)}
          <button type="button" onClick={clearAll} className="text-[11px] font-medium text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
            Clear all
          </button>
        </div>
      )}

      {/* Result count */}
      {hasAnyActive && (
        <p className="text-[11px] text-surface-400 dark:text-surface-500">
          {filteredCount === 0
            ? 'No holdings match'
            : filteredCount < totalCount
              ? `Showing ${filteredCount} of ${totalCount} holdings`
              : null}
        </p>
      )}
    </div>
  )
}
