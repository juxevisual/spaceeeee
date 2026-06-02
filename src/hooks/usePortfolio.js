import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { fetchLiveRates, fetchSingleRate, isRatesStale } from '../lib/exchangeRates'
import { getAllAssetTypes } from '../lib/format'

function toIDR(holding, exchangeRates) {
  const rate = holding.currency === 'IDR' ? 1 : (exchangeRates?.[holding.currency] || 0)
  const currentValue = holding.quantity * holding.current_price * rate
  const costBasis = holding.quantity * holding.avg_buy_price * rate
  const gainLoss = currentValue - costBasis
  const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0
  return { currentValue, costBasis, gainLoss, gainLossPct }
}

function computeNetWorth(holdingsData, exchangeRates) {
  return (holdingsData || []).reduce((sum, h) => {
    const rate = h.currency === 'IDR' ? 1 : (exchangeRates?.[h.currency] || 0)
    return sum + (h.quantity || 0) * (h.current_price || 0) * rate
  }, 0)
}

async function recordSnapshot(userId, netWorthValue) {
  if (!netWorthValue || netWorthValue <= 0) return
  await supabase.from('portfolio_snapshots').insert({ user_id: userId, net_worth: netWorthValue })
}

export function usePortfolio(user) {
  const [holdings, setHoldings] = useState([])
  const [settings, setSettings] = useState({ exchange_rates: { USD: 16000 }, display_name: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshingRates, setRefreshingRates] = useState(false)

  const fetchData = useCallback(async (shouldRecord = false) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [holdingsRes, settingsRes] = await Promise.all([
        supabase.from('portfolio_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      ])

      if (holdingsRes.error) throw holdingsRes.error
      const holdingsData = holdingsRes.data || []
      setHoldings(holdingsData)

      const settingsData = settingsRes.data
      if (settingsData) {
        // Migrate: copy usd_idr_rate into exchange_rates if needed
        if (settingsData.usd_idr_rate && !settingsData.exchange_rates?.USD) {
          settingsData.exchange_rates = { ...(settingsData.exchange_rates || {}), USD: settingsData.usd_idr_rate }
        }
        setSettings(settingsData)

        // Auto-fetch rates if stale
        if (isRatesStale(settingsData.rates_updated_at)) {
          fetchRatesBackground(settingsData.exchange_rates || { USD: 16000 }, holdingsData, settingsData)
        }
      } else {
        const defaultSettings = {
          user_id: user.id,
          usd_idr_rate: 16000,
          exchange_rates: { USD: 16000 },
          display_name: user.email?.split('@')[0] || 'User',
          custom_asset_types: [],
        }
        await supabase.from('user_settings').upsert(defaultSettings)
        setSettings(defaultSettings)
      }

      const rates = settingsData?.exchange_rates || { USD: 16000 }
      const netWorthValue = computeNetWorth(holdingsData, rates)

      if (shouldRecord) {
        await recordSnapshot(user.id, netWorthValue)
      } else {
        const { data: existing } = await supabase.from('portfolio_snapshots').select('id').eq('user_id', user.id).limit(1)
        if (!existing?.length) await recordSnapshot(user.id, netWorthValue)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchRatesBackground = useCallback(async (currentRates, holdingsData, settingsData) => {
    try {
      const updated = await fetchLiveRates(currentRates)
      const newSettings = { ...settingsData, exchange_rates: updated, rates_updated_at: new Date().toISOString() }
      await supabase.from('user_settings').upsert({ user_id: user.id, exchange_rates: updated, rates_updated_at: new Date().toISOString() })
      setSettings(s => ({ ...s, exchange_rates: updated, rates_updated_at: new Date().toISOString() }))
    } catch {}
  }, [user])

  useEffect(() => { fetchData(false) }, [fetchData])

  const refreshRates = useCallback(async () => {
    setRefreshingRates(true)
    try {
      const currentRates = settings.exchange_rates || { USD: 16000 }
      const updated = await fetchLiveRates(currentRates)
      await supabase.from('user_settings').upsert({ user_id: user.id, exchange_rates: updated, rates_updated_at: new Date().toISOString() })
      setSettings(s => ({ ...s, exchange_rates: updated, rates_updated_at: new Date().toISOString() }))
    } catch {}
    setRefreshingRates(false)
  }, [user, settings])

  const addCurrencyRate = useCallback(async (code, rate) => {
    if (code === 'IDR') return
    const newRates = { ...settings.exchange_rates, [code]: rate }
    const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, exchange_rates: newRates, updated_at: new Date().toISOString() })
    if (!error) setSettings(s => ({ ...s, exchange_rates: newRates }))
    return { error }
  }, [user, settings])

  const addHolding = useCallback(async (data) => {
    const { error } = await supabase.from('portfolio_entries').insert({ ...data, user_id: user.id })
    if (!error) fetchData(true)
    return { error }
  }, [user, fetchData])

  const updateHolding = useCallback(async (id, data) => {
    const { error } = await supabase.from('portfolio_entries').update({ ...data, last_updated: new Date().toISOString() }).eq('id', id)
    if (!error) fetchData(true)
    return { error }
  }, [fetchData])

  const deleteHolding = useCallback(async (id) => {
    const { error } = await supabase.from('portfolio_entries').delete().eq('id', id)
    if (!error) fetchData(true)
    return { error }
  }, [fetchData])

  const addAssetType = useCallback(async (type) => {
    const current = settings.custom_asset_types || []
    const updated = [...current, type]
    const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, custom_asset_types: updated, updated_at: new Date().toISOString() })
    if (!error) setSettings(s => ({ ...s, custom_asset_types: updated }))
    return { error }
  }, [user, settings])

  const exchangeRates = settings.exchange_rates || { USD: 16000 }

  // Record snapshot after USD rate change (legacy compat + multi-currency)
  const updateUsdRate = useCallback(async (rate) => {
    return addCurrencyRate('USD', rate)
  }, [addCurrencyRate])

  const derived = useMemo(() => {
    // Build a lookup from ALL types (built-in + custom) for label/color resolution
    const allTypes = getAllAssetTypes(settings.custom_asset_types || [])
    const typeLookup = Object.fromEntries(allTypes.map(t => [t.key, t]))

    let netWorth = 0, gainLoss = 0, costBasisTotal = 0
    const allocationByType = {}
    const holdingsWithCalc = holdings.map(h => {
      const calc = toIDR(h, exchangeRates)
      netWorth += calc.currentValue
      gainLoss += calc.gainLoss
      costBasisTotal += calc.costBasis
      allocationByType[h.asset_type] = (allocationByType[h.asset_type] || 0) + calc.currentValue
      const typeInfo = typeLookup[h.asset_type] || {}
      return {
        ...h,
        ...calc,
        typeLabel: typeInfo.label || h.asset_type,
        typeColor: typeInfo.color,
      }
    })
    const gainLossPct = costBasisTotal > 0 ? (gainLoss / costBasisTotal) * 100 : 0
    return { netWorth, gainLoss, gainLossPct, allocationByType, holdingsWithCalc }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings, JSON.stringify(exchangeRates), JSON.stringify(settings.custom_asset_types)])

  const { netWorth, gainLoss, gainLossPct, allocationByType, holdingsWithCalc } = derived

  return {
    holdings: holdingsWithCalc,
    settings,
    loading,
    error,
    addHolding,
    updateHolding,
    deleteHolding,
    updateUsdRate,
    addCurrencyRate,
    refreshRates,
    refreshingRates,
    exchangeRates,
    ratesUpdatedAt: settings.rates_updated_at,
    addAssetType,
    customAssetTypes: settings.custom_asset_types || [],
    netWorth,
    gainLoss,
    gainLossPct,
    allocationByType,
    userId: user?.id,
    refetch: fetchData,
  }
}
