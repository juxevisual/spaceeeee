import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { nowJakarta } from '../lib/format'

export function usePace(user, month, year, type = 'personal') {
  const [lastMonthPartial, setLastMonthPartial] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const { year: nowYear, month: nowMonth, day: nowDay } = nowJakarta()
    const isCurrentMonth = month === nowMonth && year === nowYear

    if (!isCurrentMonth) {
      setLastMonthPartial(null)
      return
    }

    const lastMonthYear = month === 1 ? year - 1 : year
    const lastMonth = month === 1 ? 12 : month - 1
    // Clamp to last day of previous month (handles e.g. March 31 vs February)
    const daysInLastMonth = new Date(lastMonthYear, lastMonth, 0).getDate()
    const clampedDay = Math.min(nowDay, daysInLastMonth)

    const startDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`
    const endDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`

    setLoading(true)

    const run = async () => {
      let query = supabase
        .from('expenses')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate)

      if (type === 'personal') {
        query = query.eq('user_id', user.id).eq('type', 'personal')
      } else {
        query = query.eq('type', 'family')
      }

      const { data, error } = await query
      if (!error && data) {
        setLastMonthPartial(data.reduce((s, e) => s + Number(e.amount), 0))
      }
      setLoading(false)
    }

    run()
  }, [user, month, year, type])

  return { lastMonthPartial, loading }
}
