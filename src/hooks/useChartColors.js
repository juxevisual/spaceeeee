import { useState, useEffect } from 'react'

export function useChartColors() {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return {
    tick:   dark ? 'oklch(0.50 0.005 280)' : 'oklch(0.50 0.005 280)',
    cursor: dark ? 'oklch(0.17 0.008 280 / 0.7)' : 'oklch(0.92 0.003 280 / 0.6)',
    grid:   dark ? 'oklch(0.17 0.008 280)' : 'oklch(0.92 0.003 280)',
  }
}
