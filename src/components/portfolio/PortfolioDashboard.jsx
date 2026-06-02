import { useState } from 'react'
import { AllocationChart } from './AllocationChart'
import { PlatformSection } from './PlatformSection'
import { HoldingForm } from './HoldingForm'
import { formatCompact, formatPct } from '../../lib/format'
import { useCountUp } from '../../hooks/useCountUp'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const BEZEL_OUTER = 'p-1 rounded-[1.5rem] ring-1 ring-black/[0.06] dark:ring-white/[0.15] bg-black/[0.015] dark:bg-white/[0.04]'
const BEZEL_INNER = 'rounded-[calc(1.5rem-0.25rem)] bg-surface-50 dark:bg-surface-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'

function UsdRateInline({ rate, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(rate))
  const [saving, setSaving] = useState(false)

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      const n = Number(val)
      if (!n || n <= 0) return
      setSaving(true)
      await onSave(n)
      setSaving(false)
      setEditing(false)
    }
    if (e.key === 'Escape') {
      setVal(String(rate))
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div>
        <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-1">USD/IDR</p>
        <input
          autoFocus
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { setVal(String(rate)); setEditing(false) }}
          disabled={saving}
          className="text-sm font-semibold text-surface-900 dark:text-surface-100 tabular-nums bg-transparent border-b border-primary-400 focus:outline-none w-24"
        />
        <p className="text-[11px] mt-0.5 text-surface-400">Enter Â· Esc</p>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setVal(String(rate)); setEditing(true) }}
      className="text-right group"
      title="Click to edit USD/IDR rate"
    >
      <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-1">USD/IDR</p>
      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 tabular-nums group-hover:text-primary-500 transition-colors duration-200">
        {rate.toLocaleString('id-ID')}
      </p>
      <p className="text-[11px] mt-0.5 text-surface-300 dark:text-surface-600 group-hover:text-primary-400 transition-colors duration-200">
        Edit
      </p>
    </button>
  )
}

export function PortfolioDashboard({ holdings, settings, loading, error, netWorth, gainLoss, gainLossPct, allocationByType, onAdd, onEdit, onDelete, onUpdateUsdRate, customAssetTypes = [], onAddAssetType }) {
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
    if (editTarget) {
      await onEdit(editTarget.id, data)
    } else {
      await onAdd(data)
    }
    setFormLoading(false)
    setFormOpen(false)
    setEditTarget(null)
  }

  const isGain = gainLoss >= 0
  const platforms = Object.keys(platformGroups).sort()
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
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em]">Net worth</p>
                <UsdRateInline rate={settings.usd_idr_rate} onSave={onUpdateUsdRate} />
              </div>

              {loading ? (
                <div className="animate-pulse h-10 w-36 bg-surface-200 dark:bg-surface-700 rounded-lg mb-3" />
              ) : (
                <p className="text-[2.6rem] font-bold text-surface-900 dark:text-surface-100 tabular-nums tracking-[-0.03em] leading-none mb-3">
                  {formatCompact(animatedNetWorth)}
                </p>
              )}

              {!loading && (
                <>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums ${
                    isGain
                      ? 'bg-gain-light dark:bg-gain/15 text-gain-dark dark:text-gain'
                      : 'bg-loss-light dark:bg-loss/15 text-loss-dark dark:text-loss'
                  }`}>
                    {isGain ? '+' : 'âˆ’'}{formatCompact(animatedGainLoss)}
                    <span className="opacity-40">Â·</span>
                    {isGain ? '+' : 'âˆ’'}{Math.abs(gainLossPct).toFixed(2)}%
                  </span>
                  {platforms.length > 0 && (
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-3">
                      {platforms.length} platform{platforms.length !== 1 ? 's' : ''} Â· {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Allocation chart double-bezel panel */}
          {!loading && Object.keys(allocationByType).length > 0 && (
            <div ref={allocationRef} className={BEZEL_OUTER}>
              <div className={`${BEZEL_INNER} p-5`}>
                <h2 className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-4">Allocation</h2>
                <AllocationChart allocationByType={allocationByType} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="px-4 py-3 rounded-xl bg-loss-light dark:bg-loss/10 border border-loss/20 text-xs text-loss">
              Could not load portfolio data. Check your connection and try refreshing.
            </div>
          )}
        </div>

        {/* â”€â”€ Right column: holdings â”€â”€ */}
        <div ref={holdingsRef}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em]">Holdings</h2>
            <button
              onClick={() => { setDefaultPlatform(''); setEditTarget(null); setFormOpen(true) }}
              className="group flex items-center gap-2 pl-4 pr-2 py-2 text-xs font-semibold rounded-full bg-primary-500 text-white transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-600 hover:shadow-[0_4px_16px_rgba(107,79,255,0.35)] active:scale-[0.97]"
            >
              Add holding
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
          ) : platforms.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl">
              <p className="text-sm font-semibold text-surface-500 dark:text-surface-400">No holdings yet</p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Add your first holding to get started</p>
              <button
                onClick={() => { setDefaultPlatform(''); setEditTarget(null); setFormOpen(true) }}
                className="mt-5 px-5 py-2 text-sm font-semibold rounded-full bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.97] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Add holding
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {platforms.map((platform, i) => (
                <PlatformSection
                  key={platform}
                  index={i}
                  platform={platform}
                  holdings={platformGroups[platform]}
                  onEdit={handleEdit}
                  onDelete={onDelete}
                  onAddForPlatform={handleAddForPlatform}
                />
              ))}
            </div>
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
        />
      )}
    </div>
  )
}

