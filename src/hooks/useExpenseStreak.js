import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { todayJakarta } from '../lib/format'

function prevDateStr(dateStr) {
  // Use noon UTC so subtracting one day is never ambiguous across DST or tz shifts
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

export function useExpenseStreak(user) {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user) return

    const run = async () => {
      const today = todayJakarta()

      // Fetch last 400 days of personal expense dates
      const cutoff = prevDateStr(
        (() => {
          const d = new Date(today + 'T12:00:00Z')
          d.setUTCDate(d.getUTCDate() - 400)
          return d.toISOString().split('T')[0]
        })()
      )

      const { data, error } = await supabase
        .from('expenses')
        .select('date')
        .eq('user_id', user.id)
        .eq('type', 'personal')
        .gte('date', cutoff)

      if (error || !data) return

      const dateSet = new Set(data.map(e => e.date))

      // Walk backwards from today counting consecutive days with expenses.
      // If today has no entry yet, start from yesterday — streak is alive until
      // a full calendar day passes with nothing logged.
      let cursor = today
      let count = 0

      if (!dateSet.has(cursor)) {
        cursor = prevDateStr(cursor)
      }

      while (dateSet.has(cursor)) {
        count++
        cursor = prevDateStr(cursor)
      }

      setStreak(count)
    }

    run()
  }, [user])

  return { streak }
}
