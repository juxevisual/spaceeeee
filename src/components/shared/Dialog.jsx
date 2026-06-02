import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Dialog({ titleId, onClose, children, className }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const getFocusable = () => Array.from(panel.querySelectorAll(FOCUSABLE))
    getFocusable()[0]?.focus()

    const trap = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const els = getFocusable()
      const first = els[0]; const last = els[els.length - 1]
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus() } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus() } }
    }
    panel.addEventListener('keydown', trap)
    return () => panel.removeEventListener('keydown', trap)
  }, [onClose])

  return (
    <div
      className="dialog-backdrop-enter fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-surface-900/50 dark:bg-surface-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`dialog-panel-enter ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
