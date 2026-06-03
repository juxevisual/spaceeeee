import { useState, useMemo } from 'react'
import { AllocationChart } from './AllocationChart'
import { PortfolioChart } from './PortfolioChart'
import { PlatformSection } from './PlatformSection'
import { HoldingForm } from './HoldingForm'
import { HoldingsControls } from './HoldingsControls'
import { formatCompact, formatRelativeTime, ASSET_TYPE_LABELS } from '../../lib/format'
import { useCountUp } from '../../hooks/useCountUp'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const BEZEL_OUTER = 'p-1 rounded-[1.5rem] ring-1 ring-black/[0.06] dark:ring-white/[0.15] bg-black/[0.015] dark:bg-white/[0.04]'
const BEZEL_INNER = 'rounded-[calc(1.5rem-0.25rem)] bg-surface-50 dark:bg-surface-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'

function ExchangeRatesPanel({ holdings, exchangeRates, ratesUpdatedAt, onRefresh, refreshing }) {
  const usedCurrencies = [...new Set(
    (holdings || []).filter(h => h.currency && h.currency !== 'IDR').map(h => h.currency)
  )].sort()

  if (usedCurrencies.length === 0) return null

  return (
    <div className="border-t border-surface-100 dark:border-surface-800/60 pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em]">Rates</p>
        <div className="flex items-center gap-2">
          {ratesUpdatedAt && (
            <span className="text-[10px] text-surface-300 dark:text-surface-600">{formatRelativeTime(ratesUpdatedAt)}</span>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh exchange rates"
            className="p-1 rounded-md text-surface-400 dark:text-surface-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              className={refreshing ? 'animate-spin' : ''} aria-hidden="true">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>
      {usedCurrencies.map(code => (
        <div key={code} className="flex items-center justify-between py-0.5">
          <span className="font-mono text-xs font-bold text-surface-500 dark:text-surface-400">{code}</span>
          <span className="text-xs tabular-nums text-surface-700 dark:text-surface-300">
            {exchangeRates[code]
              ? `Rp ${Math.round(exchangeRates[code]).toLocaleString('id-ID')}`
              : <span className="text-surface-300 dark:text-surface-600 text-[10px]">no rate</span>
            }
          </span>
        </div>
      ))}
    </div>
  )
}

function EyeIcon({ closed }) {
  return closed ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function PortfolioDashboard({ holdings, settings, loading, error, netWorth, gainLoss, gainLossPct, allocationByType, onAdd, onEdit, onDelete, onUpdateUsdRate, customAssetTypes = [], onAddAssetType, userId, exchangeRates = {}, ratesUpdatedAt, onRefreshRates, refreshingRates, onAddCurrencyRate }) {
  const [hideValues, setHideValues] = useState(() => localStorage.getItem('portfolio_private_mode') === 'true')
  const toggleHideValues = () => setHideValues(v => {
    const next = !v
    localStorage.setItem('portfolio_private_mode', next)
    return next
  })

  const [chartTab, setChartTab] = useState('performance')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [defaultPlatform, setDefaultPlatform] = useState('')

  const platformGroups = holdings.reduce((acc, h) => {
    if (!acc[h.platform]) acc[h.platform] = []
    acc[h.platform].push(h)
    return acc
  }, {})

  const handleAddForPlatform = (platform) => {
    setDefaultPlatform(platform)
    setEditTarget(null)
    setFormOpen(true)
  }

  const handleEdit = (holding) => {
    setEditTarget(holding)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    setFormLoading(true)
    const result = editTarget ? await onEdit(editTarget.id, data) : await onAdd(data)
    setFormLoading(false)
    if (result?.error) return result  // keep form open on error
    setFormOpen(false)
    setEditTarget(null)
  }

  const isGain = gainLoss >= 0

  // Search / filter / sort state
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('value-desc')
  const [filterTypes, setFilterTypes] = useState([])
  const [filterPlatforms, setFilterPlatforms] = useState([])
  const [filterCurrencies, setFilterCurrencies] = useState([])

  // Available filter options (from all holdings, not filtered)
  const availableTypes = useMemo(() => [...new Set(holdings.map(h => h.asset_type))], [holdings])
  const availablePlatforms = useMemo(() => [...new Set(holdings.map(h => h.platform))].sort(), [holdings])
  const availableCurrencies = useMemo(() => [...new Set(holdings.map(h => h.currency))].sort(), [holdings])

  // Filtered + sorted holdings
  const filteredSortedHoldings = useMemo(() => {
    let result = [...holdings]
    const q = search.trim().toLowerCase()
    if (q) result = result.filter(h => h.asset_name.toLowerCase().includes(q) || h.platform.toLowerCase().includes(q))
    if (filterTypes.length) result = result.filter(h => filterTypes.includes(h.asset_type))
    if (filterPlatforms.length) result = result.filter(h => filterPlatforms.includes(h.platform))
    if (filterCurrencies.length) result = result.filter(h => filterCurrencies.includes(h.currency))
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'value-asc':  return a.currentValue - b.currentValue
        case 'gain-desc':  return b.gainLossPct - a.gainLossPct
        case 'gain-asc':   return a.gainLossPct - b.gainLossPct
        case 'name-asc':   return a.asset_name.localeCompare(b.asset_name)
        case 'updated':    return new Date(b.last_updated) - new Date(a.last_updated)
        default:           return b.currentValue - a.currentValue // value-desc
      }
    })
  }, [holdings, search, sortBy, filterTypes, filterPlatforms, filterCurrencies])

  // Platform groups from filtered/sorted results, sorted by total value desc
  const filteredPlatformGroups = useMemo(() =>
    filteredSortedHoldings.reduce((acc, h) => {
      if (!acc[h.platform]) acc[h.platform] = []
      acc[h.platform].push(h)
      return acc
    }, {}),
    [filteredSortedHoldings]
  )

  const sortedPlatforms = useMemo(() =>
    Object.keys(filteredPlatformGroups).sort((a, b) => {
      const ag = filteredPlatformGroups[a]
      const bg = filteredPlatformGroups[b]
      switch (sortBy) {
        case 'value-asc': {
          const aT = ag.reduce((s, h) => s + h.currentValue, 0)
          const bT = bg.reduce((s, h) => s + h.currentValue, 0)
          return aT - bT
        }
        case 'gain-desc': {
          const aAvg = ag.reduce((s, h) => s + h.gainLossPct, 0) / ag.length
          const bAvg = bg.reduce((s, h) => s + h.gainLossPct, 0) / bg.length
          return bAvg - aAvg
        }
        case 'gain-asc': {
          const aAvg = ag.reduce((s, h) => s + h.gainLossPct, 0) / ag.length
          const bAvg = bg.reduce((s, h) => s + h.gainLossPct, 0) / bg.length
          return aAvg - bAvg
        }
        case 'name-asc':
          return a.localeCompare(b)
        case 'updated': {
          const aMax = Math.max(...ag.map(h => new Date(h.last_updated).getTime()))
          const bMax = Math.max(...bg.map(h => new Date(h.last_updated).getTime()))
          return bMax - aMax
        }
        default: { // value-desc
          const aT = ag.reduce((s, h) => s + h.currentValue, 0)
          const bT = bg.reduce((s, h) => s + h.currentValue, 0)
          return bT - aT
        }
      }
    }),
    [filteredPlatformGroups, sortBy]
  )

  // Auto-expand sections only when search or filters are active
  const forceExpand = !!(search || filterTypes.length || filterPlatforms.length || filterCurrencies.length)

  const hasActiveControls = !!(search || filterTypes.length || filterPlatforms.length || filterCurrencies.length)
  const clearFilters = () => { setSearch(''); setFilterTypes([]); setFilterPlatforms([]); setFilterCurrencies([]) }

  const animatedNetWorth = useCountUp(loading ? 0 : netWorth, 750)
  const animatedGainLoss = useCountUp(loading ? 0 : Math.abs(gainLoss), 750)

  const netWorthRef = useScrollReveal(0)
  const allocationRef = useScrollReveal(80)
  const holdingsRef = useScrollReveal(60)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 space-y-6 lg:space-y-0">

        {/* â”€â”€ Left column: net worth + allocation â”€â”€ */}
        <div className="space-y-4">

          {/* Net worth double-bezel panel */}
          <div ref={netWorthRef} className={BEZEL_OUTER}>
            <div className={`${BEZEL_INNER} p-5`}>
              <div className="mb-2 flex items-center gap-1.5">
                {!loading && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500"
                    style={{ backgroundColor: isGain ? 'oklch(0.60 0.19 150)' : 'oklch(0.55 0.18 18)' }}
                    aria-hidden="true"
                  />
                )}
                <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em]">Net worth</p>
                <button
                  onClick={toggleHideValues}
                  aria-label={hideValues ? 'Show values' : 'Hide values'}
                  title={hideValues ? 'Show values' : 'Hide values'}
                  className="ml-auto p-1 rounded-md text-surface-300 dark:text-surface-600 hover:text-surface-500 dark:hover:text-surface-400 transition-colors"
                >
                  <EyeIcon closed={hideValues} />
                </button>
              </div>

              {loading ? (
                <div className="animate-pulse h-10 w-36 bg-surface-200 dark:bg-surface-700 rounded-lg mb-3" />
              ) : (
                <p className="text-[2.6rem] font-bold text-surface-900 dark:text-surface-100 tabular-nums tracking-[-0.03em] leading-none mb-4">
                  {hideValues ? "••••••" : formatCompact(animatedNetWorth)}
                </p>
              )}

              {!loading && (
                <>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums ${
                    isGain
                      ? 'bg-gain-light dark:bg-gain/15 text-gain-dark dark:text-gain'
                      : 'bg-loss-light dark:bg-loss/15 text-loss-dark dark:text-loss'
                  }`}>
                    {hideValues ? "••••" : (
                      <>
                        {isGain ? "+" : "−"}{formatCompact(animatedGainLoss)}
                        <span className="opacity-40">·</span>
                        {isGain ? "+" : "−"}{Math.abs(gainLossPct).toFixed(2)}%
                      </>
                    )}
                  </span>
                  {availablePlatforms.length > 0 && (
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-3">
                      {availablePlatforms.length} platform{availablePlatforms.length !== 1 ? 's' : ''} · {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  <ExchangeRatesPanel
                    holdings={holdings}
                    exchangeRates={exchangeRates}
                    ratesUpdatedAt={ratesUpdatedAt}
                    onRefresh={onRefreshRates}
                    refreshing={refreshingRates}
                  />
                </>
              )}
            </div>
          </div>

          {/* Performance / Allocation tabbed panel */}
          <div ref={allocationRef} className={BEZEL_OUTER}>
            <div className={`${BEZEL_INNER} p-5`}>
              {/* Tab pills */}
              <div className="flex gap-1 mb-4">
                {[
                  { key: 'performance', label: 'Performance' },
                  { key: 'allocation',  label: 'Allocation' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setChartTab(key)}
                    style={chartTab === key ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      chartTab === key
                        ? 'text-white'
                        : 'text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div key={chartTab} className="tab-fade-in">
                {chartTab === 'performance' ? (
                  <PortfolioChart userId={userId} />
                ) : (
                  Object.keys(allocationByType).length > 0
                    ? <AllocationChart allocationByType={allocationByType} />
                    : <p className="text-[11px] text-surface-400 dark:text-surface-500 text-center py-6">No holdings to show</p>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && !loading && (
            <div className="px-4 py-3 rounded-xl bg-loss-light dark:bg-loss/10 border border-loss/20 text-xs text-loss">
              Could not load portfolio data. Check your connection and try refreshing.
            </div>
          )}
        </div>

        {/* â”€â”€ Right column: holdings â”€â”€ */}
        <div ref={holdingsRef}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em]">Holdings</h2>
            <button
              onClick={() => { setDefaultPlatform(''); setEditTarget(null); setFormOpen(true) }}
              className="group flex items-center gap-2 pl-4 pr-2 py-2 text-xs font-semibold rounded-full bg-primary-500 text-white transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-600 hover:shadow-[0_4px_16px_rgba(107,79,255,0.35)] active:scale-[0.97]"
            >
              <span className="hidden sm:inline">Add holding</span><span className="sm:hidden">Add</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading holdings">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-16 rounded-2xl bg-surface-100 dark:bg-surface-800" />
              ))}
            </div>
          ) : holdings.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400 dark:text-surface-500" aria-hidden="true">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-surface-500 dark:text-surface-400">No holdings yet</p>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Add your first asset to start tracking your portfolio</p>
              </div>
              <button
                onClick={() => { setDefaultPlatform(''); setEditTarget(null); setFormOpen(true) }}
                className="px-5 py-2 text-sm font-semibold rounded-full bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.97] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Add holding
              </button>
            </div>
          ) : (
            <>
              <HoldingsControls
                search={search} onSearch={setSearch}
                sortBy={sortBy} onSort={setSortBy}
                filterTypes={filterTypes} onFilterTypes={setFilterTypes}
                filterPlatforms={filterPlatforms} onFilterPlatforms={setFilterPlatforms}
                filterCurrencies={filterCurrencies} onFilterCurrencies={setFilterCurrencies}
                availableTypes={availableTypes}
                availablePlatforms={availablePlatforms}
                availableCurrencies={availableCurrencies}
                totalCount={holdings.length}
                filteredCount={filteredSortedHoldings.length}
              />
              {sortedPlatforms.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="text-surface-400 dark:text-surface-500" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Nothing matches</p>
                    <button onClick={clearFilters} className="mt-1.5 text-xs font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      Clear filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedPlatforms.map((platform, i) => (
                    <PlatformSection
                      key={platform}
                      index={i}
                      platform={platform}
                      holdings={filteredPlatformGroups[platform]}
                      onEdit={handleEdit}
                      onDelete={onDelete}
                      onAddForPlatform={handleAddForPlatform}
                      forceOpen={forceExpand}
                      hideValues={hideValues}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {formOpen && (
        <HoldingForm
          initial={editTarget ? { ...editTarget } : (defaultPlatform ? { platform: defaultPlatform, asset_name: '', asset_type: 'reksa_dana', quantity: '', avg_buy_price: '', current_price: '', currency: 'IDR', notes: '' } : null)}
          onSubmit={handleSubmit}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          loading={formLoading}
          customAssetTypes={customAssetTypes}
          onAddAssetType={onAddAssetType}
          exchangeRates={exchangeRates}
          onAddCurrencyRate={onAddCurrencyRate}
        />
      )}
    </div>
  )
}

