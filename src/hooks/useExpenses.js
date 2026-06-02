import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useExpenses(user, month, year) {
  const [expenses, setExpenses] = useState([])      // my personal expenses only
  const [allExpenses, setAllExpenses] = useState([]) // everyone + both types
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const [myRes, allRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'personal')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

      if (myRes.error) throw myRes.error
      if (allRes.error) throw allRes.error
      setExpenses(myRes.data || [])
      setAllExpenses(allRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const addExpense = useCallback(async (data) => {
    const { error } = await supabase.from('expenses').insert({
      ...data,
      user_id: user.id,
      type: data.type || 'personal',
    })
    if (!error) fetchData()
    return { error }
  }, [user, fetchData])

  const updateExpense = useCallback(async (id, data) => {
    const { error } = await supabase.from('expenses').update(data).eq('id', id)
    if (!error) fetchData()
    return { error }
  }, [fetchData])

  const deleteExpense = useCallback(async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error) fetchData()
    return { error }
  }, [fetchData])

  const monthlyTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {})

  const familyExpenses = allExpenses.filter(e => e.type === 'family')
  const familyTotal = familyExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const monthOverMonth = async (months = 6) => {
    const endDate = new Date(year, month - 1 + 1, 0)
    const startDate = new Date(year, month - 1 - (months - 1), 1)
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]

    const { data } = await supabase
      .from('expenses')
      .select('amount, user_id, date, type')
      .gte('date', start)
      .lte('date', end)

    const rows = data || []
    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const prefix = `${y}-${String(m).padStart(2, '0')}`
      results.push({ year: y, month: m, data: rows.filter(r => r.date.startsWith(prefix)) })
    }
    return results
  }

  return {
    expenses,
    allExpenses,
    familyExpenses,
    familyTotal,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    monthlyTotal,
    byCategory,
    monthOverMonth,
    refetch: fetchData,
  }
}
