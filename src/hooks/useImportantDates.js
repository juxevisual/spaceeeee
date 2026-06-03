import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useImportantDates(user) {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDates = useCallback(async () => {
    const { data } = await supabase
      .from('important_dates')
      .select('*')
      .order('date', { ascending: true })
    setDates(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDates() }, [fetchDates])

  const addDate = useCallback(async (data) => {
    const { error } = await supabase.from('important_dates').insert({ ...data, user_id: user.id })
    if (!error) fetchDates()
    return { error }
  }, [user, fetchDates])

  const updateDate = useCallback(async (id, updates) => {
    const { error } = await supabase.from('important_dates').update(updates).eq('id', id)
    if (!error) fetchDates()
    return { error }
  }, [fetchDates])

  const deleteDate = useCallback(async (id) => {
    const { error } = await supabase.from('important_dates').delete().eq('id', id)
    if (!error) fetchDates()
    return { error }
  }, [fetchDates])

  return { dates, loading, addDate, updateDate, deleteDate }
}
