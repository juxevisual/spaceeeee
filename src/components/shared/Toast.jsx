import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type, exiting: false }])
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x)), 2350)
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${t.exiting ? 'toast-exit' : 'toast-enter'} px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
              t.type === 'error'
                ? 'bg-loss text-white'
                : 'bg-surface-900 dark:bg-surface-100 text-surface-50 dark:text-surface-900'
            }`}
          >
            {t.message}
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
