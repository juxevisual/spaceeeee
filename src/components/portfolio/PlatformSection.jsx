import { useState, useEffect } from 'react'
import { HoldingCard } from './HoldingCard'
import { formatCompact } from '../../lib/format'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const PLATFORM_COLORS = [
  'oklch(0.60 0.26 280)',
  'oklch(0.64 0.19 150)',
  'oklch(0.60 0.21 310)',
  'oklch(0.68 0.19 35)',
  'oklch(0.62 0.20 220)',
  'oklch(0.58 0.21 18)',
]

let colorIndex = 0
const colorMap = {}
function getPlatformColor(platform) {
  if (!colorMap[platform]) {
    colorMap[platform] = PLATFORM_COLORS[colorIndex % PLATFORM_COLORS.length]
    colorIndex++
  }
  return colorMap[platform]
}

export function PlatformSection({ platform, holdings, onEdit, onDelete, onClose, onAddForPlatform, index = 0, forceOpen = false, hideValues = false }) {
  const [open, setOpen] = useState(false)

  // Auto-expand when a search makes this section relevant
  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])
  const total = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  const color = getPlatformColor(platform)
  const initial = platform[0]?.toUpperCase() || '?'
  const revealRef = useScrollReveal(index * 70)

  return (
    <div ref={revealRef}>
      {/* Double-bezel outer shell */}
      <div className="p-1 rounded-[1.25rem] ring-1 ring-black/[0.06] dark:ring-white/[0.15] bg-black/[0.015] dark:bg-white/[0.04]">
        {/* Inner core */}
        <div className="rounded-[calc(1.25rem-0.25rem)] bg-surface-50 dark:bg-surface-900 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">

          <button
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
          >
            {/* Platform initial badge */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              style={{ background: color }}
              aria-hidden="true"
            >
              {initial}
            </div>

            <div className="flex-1 text-left min-w-0">
              <span className="font-semibold text-sm text-surface-800 dark:text-surface-200 truncate">{platform}</span>
              <span className="text-xs text-surface-400 dark:text-surface-500 ml-2 flex-shrink-0">
                {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-sm font-bold text-surface-900 dark:text-surface-100 tabular-nums tracking-[-0.02em]">
                {hideValues ? "••••" : formatCompact(total)}
              </span>
              <svg
                width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className={`text-surface-400 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          {/* Smooth expand */}
          <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="px-3 pb-3 space-y-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                <div className="pt-2 space-y-2.5">
                  {holdings.map(h => (
                    <HoldingCard key={h.id} holding={h} onEdit={onEdit} onDelete={onDelete} onClose={onClose} hideValues={hideValues} />
                  ))}
                </div>
                <button
                  onClick={() => onAddForPlatform(platform)}
                  className="w-full py-2.5 text-xs font-semibold rounded-xl border border-dashed border-surface-200 dark:border-surface-700 text-surface-400 dark:text-surface-500 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-600 dark:hover:text-primary-400 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  + Add holding to {platform}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
