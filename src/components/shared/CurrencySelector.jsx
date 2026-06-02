import { useState, useRef, useEffect } from 'react'
import { CURRENCIES } from '../../lib/currencies'
import { fetchSingleRate } from '../../lib/exchangeRates'
import { formatIDR } from '../../lib/format'

export function CurrencySelector({ value, onChange, exchangeRates = {}, onAddRate }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [fetching, setFetching] = useState(null)
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const q = search.toUpperCase()
  const filtered = CURRENCIES.filter(c =>
    c.code.includes(q) || c.name.toUpperCase().includes(q)
  ).slice(0, 20)

  const handleSelect = async (code) => {
    setOpen(false)
    setSearch('')
    onChange(code)

    if (code !== 'IDR' && !exchangeRates[code]) {
      setFetching(code)
      try {
        const rate = await fetchSingleRate(code)
        onAddRate?.(code, rate)
      } catch {}
      setFetching(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg w-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
      >
        <span className="font-mono font-bold text-sm flex-1 text-left">{value}</span>
        {fetching === value && (
          <span className="text-[10px] text-surface-400 dark:text-surface-500">fetching…</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`text-surface-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-surface-100 dark:border-surface-800">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setOpen(false)
                if (e.key === 'Enter' && filtered.length) handleSelect(filtered[0].code)
              }}
              placeholder="Search currency…"
              className="w-full text-xs px-2 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="max-h-48 overflow-y-auto scrollbar-none">
            {filtered.map(c => {
              const isSelected = c.code === value
              const rate = c.code === 'IDR' ? null : exchangeRates[c.code]
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  <span className={`font-mono font-bold text-xs w-10 flex-shrink-0 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-surface-800 dark:text-surface-200'}`}>
                    {c.code}
                  </span>
                  <span className="text-xs text-surface-500 dark:text-surface-400 truncate flex-1">{c.name}</span>
                  {rate && (
                    <span className="text-[10px] text-surface-400 dark:text-surface-500 flex-shrink-0 tabular-nums">
                      {formatIDR(rate)}
                    </span>
                  )}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-surface-400 dark:text-surface-500 px-3 py-3 text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
