import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { nowJakarta } from '../lib/format'

export function useCategoryVelocity(user, month, year) {
  const [lastMonthByCategory, setLastMonthByCategory] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const { year: nowYear, month: nowMonth, day: nowDay } = nowJakarta()
    const isCurrentMonth = month === nowMonth && year === nowYear

    if (!isCurrentMonth) {
      setLastMonthByCategory(null)
      return
    }

    const lastMonthYear = month === 1 ? year - 1 : year
    const lastMonth = month === 1 ? 12 : month - 1
    const daysInLastMonth = new Date(lastMonthYear, lastMonth, 0).getDate()
    const clampedDay = Math.min(nowDay, daysInLastMonth)

    const startDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`
    const endDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`

    setLoading(true)

    const run = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('type', 'personal')
        .gte('date', startDate)
        .lte('date', endDate)

      if (!error && data) {
        setLastMonthByCategory(
          data.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
            return acc
          }, {})
        )
      }
      setLoading(false)
    }

    run()
  }, [user, month, year])

  return { lastMonthByCategory, loading }
}
