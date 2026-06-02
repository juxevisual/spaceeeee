// Free no-key API: rates relative to IDR
const API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json'
const FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies/idr.json'

// Fetch fresh rates for all codes currently in existingRates (+ always USD)
export async function fetchLiveRates(existingRates = {}) {
  let data
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error('primary failed')
    data = await res.json()
  } catch {
    const res = await fetch(FALLBACK_URL)
    if (!res.ok) throw new Error('Both rate endpoints failed')
    data = await res.json()
  }

  const idrRates = data.idr  // { usd: 0.0000625, jpy: 0.00924, ... }

  const updated = {}
  const codesToFetch = new Set(['USD', ...Object.keys(existingRates)])

  for (const code of codesToFetch) {
    if (code === 'IDR') continue
    const idrCode = code.toLowerCase()
    const idrPerForeign = idrRates[idrCode]
    if (idrPerForeign) {
      // idrRates[code] = how much foreign currency 1 IDR buys
      // We want: how many IDR per 1 foreign unit
      updated[code] = parseFloat((1 / idrPerForeign).toFixed(2))
    }
  }

  return updated
}

// Fetch rate for a single new currency code
export async function fetchSingleRate(code) {
  if (code === 'IDR') return 1
  let data
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error()
    data = await res.json()
  } catch {
    const res = await fetch(FALLBACK_URL)
    data = await res.json()
  }
  const idrCode = code.toLowerCase()
  const idrPerForeign = data.idr[idrCode]
  if (!idrPerForeign) throw new Error(`Currency ${code} not available`)
  return parseFloat((1 / idrPerForeign).toFixed(2))
}

export function isRatesStale(ratesUpdatedAt) {
  if (!ratesUpdatedAt) return true
  return new Date(ratesUpdatedAt) < new Date(Date.now() - 24 * 60 * 60 * 1000)
}
