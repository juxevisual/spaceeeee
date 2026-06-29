const BASE = 'https://api.coingecko.com/api/v3'
const OVERRIDES_KEY = 'crypto_coin_overrides_v1'

export function getCoinOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}') } catch { return {} }
}

export function saveCoinOverride(symbol, coinId) {
  try {
    const overrides = getCoinOverrides()
    overrides[normalizeSymbol(symbol)] = coinId
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
  } catch {}
}

export function normalizeSymbol(sym) {
  return sym.toUpperCase().trim().replace(/^\$/, '')
}

async function fetchMarkets() {
  // Fetch top-500 in parallel (two pages of 250)
  const [r1, r2] = await Promise.all([
    fetch(`${BASE}/coins/markets?vs_currency=usd&per_page=250&page=1&order=market_cap_desc&sparkline=false`),
    fetch(`${BASE}/coins/markets?vs_currency=usd&per_page=250&page=2&order=market_cap_desc&sparkline=false`),
  ])
  const coins = [
    ...(r1.ok ? await r1.json() : []),
    ...(r2.ok ? await r2.json() : []),
  ]
  const map = {}
  for (const coin of coins) {
    const sym = normalizeSymbol(coin.symbol)
    if (!(sym in map)) map[sym] = coin.current_price // first = highest rank
  }
  return map
}

// Returns coins with exact symbol match, sorted by market cap rank
export async function searchCoinCandidates(sym) {
  const normalized = normalizeSymbol(sym)
  const res = await fetch(`${BASE}/search?query=${encodeURIComponent(normalized)}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.coins || [])
    .filter(c => normalizeSymbol(c.symbol) === normalized)
    .sort((a, b) => (a.market_cap_rank ?? 999999) - (b.market_cap_rank ?? 999999))
    .slice(0, 6)
}

export async function fetchPriceById(coinId) {
  const res = await fetch(`${BASE}/simple/price?ids=${coinId}&vs_currencies=usd`)
  if (!res.ok) return null
  const data = await res.json()
  return data[coinId]?.usd ?? null
}

export async function fetchCryptoPrices(symbols) {
  if (!symbols?.length) return {}
  const upper = [...new Set(symbols.map(normalizeSymbol))]
  const overrides = getCoinOverrides()

  // User-saved overrides always win — fetch by pinned ID
  const overriddenSyms = []
  const needsResolution = []
  for (const sym of upper) {
    if (overrides[sym]) overriddenSyms.push(sym)
    else needsResolution.push(sym)
  }

  const found = {}

  if (overriddenSyms.length > 0) {
    const ids = overriddenSyms.map(s => overrides[s])
    const res = await fetch(`${BASE}/simple/price?ids=${ids.join(',')}&vs_currencies=usd`)
    if (res.ok) {
      const prices = await res.json()
      for (const sym of overriddenSyms) {
        const id = overrides[sym]
        if (prices[id]?.usd !== undefined) found[sym] = prices[id].usd
      }
    }
  }

  if (needsResolution.length === 0) return found

  // Step 1: top-500 markets
  const top500 = await fetchMarkets()
  const missing = []
  for (const sym of needsResolution) {
    if (top500[sym] !== undefined) found[sym] = top500[sym]
    else missing.push(sym)
  }

  // Step 2: long-tail — search per symbol (ranked by market cap), batch price fetch
  if (missing.length > 0) {
    const searches = await Promise.all(
      missing.map(sym =>
        fetch(`${BASE}/search?query=${encodeURIComponent(sym)}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    )

    const symToId = {}
    for (let i = 0; i < missing.length; i++) {
      const sym = missing[i]
      const coins = searches[i]?.coins
      if (!coins?.length) continue
      const match = coins.find(c => normalizeSymbol(c.symbol) === sym) ?? coins[0]
      if (match?.id) symToId[sym] = match.id
    }

    const ids = Object.values(symToId)
    if (ids.length > 0) {
      const priceRes = await fetch(`${BASE}/simple/price?ids=${ids.join(',')}&vs_currencies=usd`)
      if (priceRes.ok) {
        const prices = await priceRes.json()
        for (const [sym, id] of Object.entries(symToId)) {
          if (prices[id]?.usd !== undefined) found[sym] = prices[id].usd
        }
      }
    }
  }

  return found // { BTC: 65000, ETH: 3200, ... } all in USD
}

export function isCryptoPricesStale(updatedAt) {
  if (!updatedAt) return true
  return Date.now() - new Date(updatedAt).getTime() > 24 * 60 * 60 * 1000
}
