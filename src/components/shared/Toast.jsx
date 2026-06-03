import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, options = {}) => {
    // Backward compat: show(msg, 'error') still works
    const opts = typeof options === 'string' ? { type: options } : options
    const { type = 'success', action } = opts

    const duration = action ? 5000 : 2350
    const id = Date.now()
    setToasts(t => [...t, { id, message, type, action, exiting: false }])
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x)), duration)
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration + 200)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${t.exiting ? 'toast-exit' : 'toast-enter'} flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
              t.action ? 'pointer-events-auto' : ''
            } ${
              t.type === 'error'
                ? 'bg-loss text-white'
                : 'bg-surface-900 dark:bg-surface-100 text-surface-50 dark:text-surface-900'
            }`}
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  setToasts(ts => ts.filter(x => x.id !== t.id))
                  t.action.onClick()
                }}
                className="text-xs font-bold underline opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
