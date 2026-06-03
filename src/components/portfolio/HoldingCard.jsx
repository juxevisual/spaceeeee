import { useState } from 'react'
import { formatIDR, formatCompact, formatPct, formatQuantity, formatRelativeTime, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS_MAP } from '../../lib/format'

function parseDotSep(str) {
  return Number(String(str).replace(/\./g, '').replace(/,/g, '')) || 0
}
function formatDotSep(n) {
  return Math.round(n).toLocaleString('id-ID')
}

export function HoldingCard({ holding, onEdit, onDelete, onClose, hideValues = false }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeInput, setCloseInput] = useState('')
  const [closeLoading, setCloseLoading] = useState(false)

  const isCash = holding.asset_type === 'cash'

  const openClosePanel = () => {
    setConfirming(false)
    setCloseInput(formatDotSep(holding.currentValue))
    setClosing(true)
  }

  const handleCloseInputChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '')
    setCloseInput(raw ? Number(raw).toLocaleString('id-ID') : '')
  }

  const closeProceeds = parseDotSep(closeInput)
  const closeDelta = closeProceeds - holding.costBasis
  const closeDeltaPct = holding.costBasis > 0 ? (closeDelta / holding.costBasis) * 100 : 0

  const handleConfirmClose = async () => {
    if (closeProceeds <= 0 || !onClose) return
    setCloseLoading(true)
    await onClose(holding.id, closeProceeds)
    setCloseLoading(false)
    setClosing(false)
  }

  const isGain = holding.gainLoss >= 0
  const daysSinceUpdate = Math.floor((Date.now() - new Date(holding.last_updated)) / 86400000)
  const isStale = daysSinceUpdate >= 90 && isFinite(holding.gainLossPct) && Math.abs(holding.gainLossPct) < 2

  // Use pre-resolved typeLabel/typeColor from hook (supports custom types)
  const typeColor = holding.typeColor || ASSET_TYPE_COLORS_MAP[holding.asset_type]
  const typeLabel = holding.typeLabel || ASSET_TYPE_LABELS[holding.asset_type] || holding.asset_type
  const typeBadgeStyle = typeColor ? {
    backgroundColor: typeColor.replace(')', ' / 0.10)'),
    color: typeColor,
  } : {}

  return (
    /* Double-bezel outer shell */
    <div className="p-[3px] rounded-[0.875rem] ring-1 ring-black/[0.05] dark:ring-white/[0.14] bg-black/[0.01] dark:bg-white/[0.03] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-black/[0.09] dark:hover:ring-white/[0.24] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      {/* Inner core */}
      <div className="rounded-[calc(0.875rem-3px)] bg-surface-50 dark:bg-surface-900 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">

        <button
          className="w-full text-left px-4 py-3 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate tracking-[-0.01em]">
                  {holding.asset_name}
                </span>
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-[0.06em] transition-colors duration-200"
                  style={typeBadgeStyle}
                >
                  {typeLabel}
                </span>
                {holding.currency && holding.currency !== 'IDR' && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                    {holding.currency}
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5 tabular-nums">
                {hideValues ? "••••" : (
                  holding.input_mode === 'value'
                    ? `Total value · ${holding.currency === 'USD' ? `$${holding.current_price.toLocaleString()}` : formatCompact(holding.current_price)}`
                    : `${formatQuantity(holding.quantity, holding.asset_type)} · ${holding.currency === 'USD' ? `$${holding.current_price.toLocaleString()}` : formatIDR(holding.current_price)}`
                )}
                <span className="mx-1.5 text-surface-200 dark:text-surface-700">·</span>
                <span className="text-[11px]">{formatRelativeTime(holding.last_updated)}</span>
                {isStale && !hideValues && (
                  <>
                    <span className="mx-1.5 text-surface-200 dark:text-surface-700">·</span>
                    <span className="text-[11px] text-surface-300 dark:text-surface-600">flat</span>
                  </>
                )}
              </p>
            </div>

            <div className="text-right flex-shrink-0 space-y-1">
              <p className="text-sm font-bold text-surface-900 dark:text-surface-100 tabular-nums tracking-[-0.02em]">
                {hideValues ? "••••" : formatCompact(holding.currentValue)}
              </p>
              <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                isGain
                  ? 'bg-gain-light dark:bg-gain/15 text-gain-dark dark:text-gain'
                  : 'bg-loss-light dark:bg-loss/15 text-loss-dark dark:text-loss'
              }`}>
                {hideValues ? "••" : `${isGain ? '+' : '-'}${formatPct(Math.abs(holding.gainLossPct)).replace(/[+-]/, '')}`}
              </span>
            </div>

            <svg
              width="13" height="13"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              className={`text-surface-300 dark:text-surface-600 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Smooth expand */}
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-black/[0.04] dark:border-white/[0.04]">
              <div className="pt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="text-surface-400 dark:text-surface-500">
                    {holding.input_mode === 'value' ? 'Amount invested' : 'Avg buy price'}
                  </span>
                  <p className="font-semibold text-surface-700 dark:text-surface-300 tabular-nums mt-0.5">
                    {hideValues ? "••••" : (
                      holding.currency === 'USD'
                        ? `$${holding.avg_buy_price.toLocaleString()}`
                        : holding.input_mode === 'value' ? formatCompact(holding.avg_buy_price) : formatIDR(holding.avg_buy_price)
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-surface-400 dark:text-surface-500">Gain / Loss</span>
                  <p className={`font-semibold tabular-nums mt-0.5 ${isGain ? 'text-gain-dark dark:text-gain' : 'text-loss-dark dark:text-loss'}`}>
                    {hideValues ? "••••" : `${isGain ? '+' : ''}${formatCompact(holding.gainLoss)}`}
                  </p>
                </div>
                {holding.notes && (
                  <div className="col-span-2">
                    <span className="text-surface-400 dark:text-surface-500">Notes</span>
                    <p className="font-medium text-surface-700 dark:text-surface-300 mt-0.5">{holding.notes}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-surface-400 dark:text-surface-500">Last updated</span>
                  <p className="font-medium text-surface-700 dark:text-surface-300 mt-0.5">
                    {new Date(holding.last_updated).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                  </p>
                </div>
              </div>

              {closing ? (
                <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.04] space-y-3">
                  <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em]">Close position</p>

                  <div>
                    <label className="text-[11px] text-surface-400 dark:text-surface-500 mb-1 block">Proceeds (IDR)</label>
                    <div className="flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 px-3 py-2">
                      <span className="text-xs text-surface-400 dark:text-surface-500 flex-shrink-0">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={closeInput}
                        onChange={handleCloseInputChange}
                        className="flex-1 text-xs font-semibold text-surface-900 dark:text-surface-100 bg-transparent outline-none tabular-nums"
                        autoFocus
                      />
                    </div>
                  </div>

                  {closeProceeds > 0 && (
                    <p className={`text-xs font-semibold tabular-nums ${closeDelta >= 0 ? 'text-gain-dark dark:text-gain' : 'text-loss-dark dark:text-loss'}`}>
                      {closeDelta >= 0 ? '+' : ''}{formatCompact(closeDelta)}
                      <span className="font-normal opacity-70 ml-1.5">({closeDelta >= 0 ? '+' : ''}{closeDeltaPct.toFixed(1)}%)</span>
                    </p>
                  )}

                  <p className="text-[11px] text-surface-400 dark:text-surface-500">
                    Proceeds go to Cash on {holding.platform}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmClose}
                      disabled={closeProceeds <= 0 || closeLoading}
                      style={{ backgroundColor: 'oklch(0.60 0.26 280)' }}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-full text-white disabled:opacity-40 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                    >
                      {closeLoading ? 'Closing…' : 'Confirm close'}
                    </button>
                    <button
                      onClick={() => setClosing(false)}
                      className="py-1.5 px-4 text-xs font-semibold rounded-full border border-surface-200 dark:border-surface-700 text-surface-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => onEdit(holding)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-full border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  >
                    Edit
                  </button>
                  {confirming ? (
                    <div className="flex-1 flex gap-1">
                      <button
                        onClick={() => onDelete(holding.id)}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-full bg-loss text-white hover:opacity-90 transition-opacity"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirming(false)}
                        className="py-1.5 px-3 text-xs font-semibold rounded-full border border-surface-200 dark:border-surface-700 text-surface-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirming(true)}
                        className="py-1.5 px-4 text-xs font-semibold rounded-full text-loss hover:bg-loss-light dark:hover:bg-loss/10 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      >
                        Delete
                      </button>
                      {!isCash && (
                        <button
                          onClick={openClosePanel}
                          className="ml-auto py-1.5 px-3 text-xs font-medium rounded-full text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        >
                          Close position
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

