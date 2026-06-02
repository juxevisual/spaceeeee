import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { DarkModeToggle } from './DarkModeToggle'
import { supabase } from '../../lib/supabase'
import { useToast } from './Toast'

function NamePopover({ displayName, userId, onUpdated, onClose }) {
  const [val, setVal] = useState(displayName || '')
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])

  const save = async () => {
    if (!val.trim()) return
    setSaving(true)
    await supabase.from('user_settings').upsert({
      user_id: userId,
      display_name: val.trim(),
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    onUpdated(val.trim())
    toast('Name updated')
    onClose()
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-xl z-50 p-3">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Display name</p>
      <input
        ref={ref}
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose() }}
        className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 [color-scheme:light] dark:[color-scheme:dark]"
        placeholder="e.g. Rina"
        maxLength={30}
      />
      <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-1">Shown in the Together view</p>
      <button
        onClick={save}
        disabled={saving || !val.trim()}
        className="w-full mt-2 py-1.5 text-xs font-semibold rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
      >
        {saving ? 'Savingâ€¦' : 'Save'}
      </button>
    </div>
  )
}

export function Navbar({ onSignOut, displayName: initialName, userId, onNameUpdated }) {
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [displayName, setDisplayName] = useState(initialName || '')
  const wrapRef = useRef(null)

  useEffect(() => { setDisplayName(initialName || '') }, [initialName])

  useEffect(() => {
    if (!showNameEdit) return
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setShowNameEdit(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNameEdit])

  const pillLink = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      isActive
        ? 'bg-primary-500 text-white shadow-[0_2px_8px_rgba(107,79,255,0.35)]'
        : 'text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-black/5 dark:hover:bg-white/5'
    }`

  const togetherLink = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      isActive
        ? 'bg-gain text-white shadow-[0_2px_8px_rgba(50,168,82,0.35)]'
        : 'text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-black/5 dark:hover:bg-white/5'
    }`

  // Mobile-only bottom tab classes
  const mobileTab = ({ isActive }) =>
    `flex-1 py-2.5 text-xs font-semibold text-center transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      isActive ? 'text-primary-500 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'
    }`

  const mobileTogetherTab = ({ isActive }) =>
    `flex-1 py-2.5 text-xs font-semibold text-center transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      isActive ? 'text-gain dark:text-gain' : 'text-surface-400 dark:text-surface-500'
    }`

  const pillBase = 'ring-1 ring-black/[0.06] dark:ring-white/[0.14] bg-surface-50/92 dark:bg-surface-950/92 backdrop-blur-xl shadow-[0_2px_16px_rgba(0,0,0,0.07),_0_1px_3px_rgba(0,0,0,0.04)]'

  return (
    <div className="fixed top-0 inset-x-0 z-40 flex flex-col items-center px-4 pt-4 gap-2 pointer-events-none">

      {/* Brand + desktop nav + actions pill */}
      <div className={`pointer-events-auto w-full max-w-3xl flex items-center h-12 px-2 rounded-full ${pillBase}`}>

        <NavLink
          to="/portfolio"
          className="font-bold text-sm tracking-tight text-surface-900 dark:text-surface-100 px-3 py-1.5 flex-shrink-0"
        >
          spaceeeee
        </NavLink>

        {/* Desktop nav â€” hidden on mobile (shown md+) */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          <NavLink to="/portfolio" className={pillLink}>Portfolio</NavLink>
          <NavLink to="/expenses" className={pillLink}>Expenses</NavLink>
          <NavLink to="/combined" className={togetherLink}>Together</NavLink>
        </nav>

        {/* Spacer on mobile so actions go to the right */}
        <div className="flex-1 md:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <div ref={wrapRef} className="relative">
            <button
              onClick={() => setShowNameEdit(s => !s)}
              aria-label={displayName ? `Edit name: ${displayName}` : 'Set your display name'}
              aria-expanded={showNameEdit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              <span className="hidden lg:inline font-medium">{displayName || 'Set name'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {showNameEdit && userId && (
              <NamePopover
                displayName={displayName}
                userId={userId}
                onUpdated={(name) => { setDisplayName(name); onNameUpdated?.(name) }}
                onClose={() => setShowNameEdit(false)}
              />
            )}
          </div>

          <DarkModeToggle />

          <button
            onClick={onSignOut}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-surface-400 dark:text-surface-500 hover:text-loss dark:hover:text-loss hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <span className="hidden sm:inline">Sign out</span>
            {/* Icon-only on mobile */}
            <svg className="sm:hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile-only nav tab pill (hidden md+) */}
      <nav
        className={`pointer-events-auto md:hidden w-full max-w-3xl flex rounded-full overflow-hidden ${pillBase}`}
        aria-label="Main navigation"
      >
        <NavLink to="/portfolio" className={mobileTab}>Portfolio</NavLink>
        <NavLink to="/expenses" className={mobileTab}>Expenses</NavLink>
        <NavLink to="/combined" className={mobileTogetherTab}>Together</NavLink>
      </nav>
    </div>
  )
}

