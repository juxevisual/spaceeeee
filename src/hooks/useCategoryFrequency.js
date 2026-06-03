import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCategoryFrequency(user, month, year) {
  const [avgFrequencyByCategory, setAvgFrequencyByCategory] = useState(null)

  useEffect(() => {
    if (!user) return

    // Fetch the 6 full months before the selected month
    let startMonth = month - 6
    let startYear = year
    if (startMonth <= 0) { startMonth += 12; startYear -= 1 }

    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-01` // exclusive

    const run = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('category, date')
        .eq('user_id', user.id)
        .eq('type', 'personal')
        .gte('date', startDate)
        .lt('date', endDate)

      if (error || !data) return

      // Count entries per month per category
      const monthCatCounts = {}
      data.forEach(e => {
        const key = e.date.slice(0, 7) // 'YYYY-MM'
        if (!monthCatCounts[key]) monthCatCounts[key] = {}
        monthCatCounts[key][e.category] = (monthCatCounts[key][e.category] || 0) + 1
      })

      const monthKeys = Object.keys(monthCatCounts)
      if (monthKeys.length === 0) { setAvgFrequencyByCategory({}); return }

      // Average per category across months where it appeared
      const allCats = new Set(data.map(e => e.category))
      const avg = {}
      allCats.forEach(cat => {
        const activeCounts = monthKeys
          .map(m => monthCatCounts[m][cat] || 0)
          .filter(c => c > 0)
        if (activeCounts.length > 0) {
          avg[cat] = Math.round(activeCounts.reduce((s, c) => s + c, 0) / activeCounts.length)
        }
      })

      setAvgFrequencyByCategory(avg)
    }

    run()
  }, [user, month, year])

  return { avgFrequencyByCategory }
}
