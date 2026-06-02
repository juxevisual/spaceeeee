import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

function toIDR(holding, usdRate) {
  const rate = holding.currency === 'USD' ? usdRate : 1
  const currentValue = holding.quantity * holding.current_price * rate
  const costBasis = holding.quantity * holding.avg_buy_price * rate
  const gainLoss = currentValue - costBasis
  const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0
  return { currentValue, costBasis, gainLoss, gainLossPct }
}

export function usePortfolio(user) {
  const [holdings, setHoldings] = useState([])
  const [settings, setSettings] = useState({ usd_idr_rate: 16000, display_name: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [holdingsRes, settingsRes] = await Promise.all([
        supabase
          .from('portfolio_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ])

      if (holdingsRes.error) throw holdingsRes.error
      setHoldings(holdingsRes.data || [])

      if (settingsRes.data) {
        setSettings(settingsRes.data)
      } else {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          usd_idr_rate: 16000,
          display_name: user.email?.split('@')[0] || 'User',
          custom_asset_types: [],
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const addHolding = useCallback(async (data) => {
    const { error } = await supabase.from('portfolio_entries').insert({
      ...data,
      user_id: user.id,
    })
    if (!error) fetchData()
    return { error }
  }, [user, fetchData])

  const updateHolding = useCallback(async (id, data) => {
    const { error } = await supabase
      .from('portfolio_entries')
      .update({ ...data, last_updated: new Date().toISOString() })
      .eq('id', id)
    if (!error) fetchData()
    return { error }
  }, [fetchData])

  const deleteHolding = useCallback(async (id) => {
    const { error } = await supabase.from('portfolio_entries').delete().eq('id', id)
    if (!error) fetchData()
    return { error }
  }, [fetchData])

  const addAssetType = useCallback(async (type) => {
    const current = settings.custom_asset_types || []
    const updated = [...current, type]
    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      custom_asset_types: updated,
      updated_at: new Date().toISOString(),
    })
    if (!error) setSettings(s => ({ ...s, custom_asset_types: updated }))
    return { error }
  }, [user, settings])

  const updateUsdRate = useCallback(async (rate) => {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, usd_idr_rate: rate, updated_at: new Date().toISOString() })
    if (!error) setSettings(s => ({ ...s, usd_idr_rate: rate }))
    return { error }
  }, [user])

  const usdRate = settings.usd_idr_rate

  const derived = useMemo(() => {
    let netWorth = 0, gainLoss = 0, costBasisTotal = 0
    const allocationByType = {}
    const holdingsWithCalc = holdings.map(h => {
      const calc = toIDR(h, usdRate)
      netWorth += calc.currentValue
      gainLoss += calc.gainLoss
      costBasisTotal += calc.costBasis
      allocationByType[h.asset_type] = (allocationByType[h.asset_type] || 0) + calc.currentValue
      return { ...h, ...calc }
    })
    const gainLossPct = costBasisTotal > 0 ? (gainLoss / costBasisTotal) * 100 : 0
    return { netWorth, gainLoss, gainLossPct, allocationByType, holdingsWithCalc }
  }, [holdings, usdRate])

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
    addAssetType,
    customAssetTypes: settings.custom_asset_types || [],
    netWorth,
    gainLoss,
    gainLossPct,
    allocationByType,
    refetch: fetchData,
  }
}
