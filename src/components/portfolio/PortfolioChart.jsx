import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, defs, linearGradient, stop,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { formatCompact } from '../../lib/format'
import { useChartColors } from '../../hooks/useChartColors'

const PERIODS = [
  { key: '1M',  label: '1M',  days: 30 },
  { key: '3M',  label: '3M',  days: 90 },
  { key: '6M',  label: '6M',  days: 180 },
  { key: '1Y',  label: '1Y',  days: 365 },
  { key: 'all', label: 'All', days: null },
]

function formatTick(dateStr, period) {
  const d = new Date(dateStr)
  if (period === 'all') return d.getFullYear().toString()
  if (period === '1M') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { date, value } = payload[0].payload
  return (
    <div className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 shadow-lg text-xs pointer-events-none">
      <p className="text-surface-400 dark:text-surface-500 mb-0.5">
        {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      <p className="font-bold text-surface-900 dark:text-surface-100 tabular-nums tracking-tight">
        {formatCompact(value)}
      </p>
    </div>
  )
}

export function PortfolioChart({ userId }) {
  const [period, setPeriod] = useState('3M')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const { tick } = useChartColors()

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    const periodDays = PERIODS.find(p => p.key === period)?.days
    let query = supabase
      .from('portfolio_snapshots')
      .select('net_worth, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: true })

    if (periodDays) {
      const start = new Date(Date.now() - periodDays * 86400000).toISOString()
      query = query.gte('recorded_at', start)
    }

    query.then(({ data: rows }) => {
      setData((rows || []).map(r => ({ date: r.recorded_at, value: r.net_worth })))
      setLoading(false)
    })
  }, [userId, period])

  const firstValue = data[0]?.value || 0
  const lastValue = data[data.length - 1]?.value || 0
  const isGain = lastValue >= firstValue
  const hasData = data.length > 1

  // Gain/loss-aware colors (using inline oklch for reliability)
  const lineColor  = isGain ? 'oklch(0.60 0.19 150)' : 'oklch(0.55 0.18 18)'
  const fillId = isGain ? 'grad-gain' : 'grad-loss'
  const fillColorStop = isGain ? 'oklch(0.62 0.17 150)' : 'oklch(0.56 0.19 18)'

  const changePct = firstValue > 0
    ? (((lastValue - firstValue) / firstValue) * 100).toFixed(2)
    : null

  return (
    <div>
      {/* Period + change summary row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-0.5">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              style={period === key ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                period === key
                  ? 'text-white'
                  : 'text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {!loading && changePct !== null && hasData && (
          <span className={`text-[11px] font-semibold tabular-nums ${
            isGain ? 'text-gain-dark dark:text-gain' : 'text-loss-dark dark:text-loss'
          }`}>
            {isGain ? '+' : ''}{changePct}%
          </span>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-600 animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      ) : !hasData ? (
        <div className="h-32 flex flex-col items-center justify-center text-center px-4">
          <p className="text-[11px] font-medium text-surface-400 dark:text-surface-500">No data for this period</p>
          <p className="text-[10px] text-surface-300 dark:text-surface-600 mt-0.5">
            Your chart grows with each portfolio update
          </p>
        </div>
      ) : (
        <div className="h-32" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fillColorStop} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={fillColorStop} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: tick }}
                tickFormatter={v => formatTick(v, period)}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: tick, strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={1.75}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Screen-reader summary */}
      {hasData && (
        <span className="sr-only">
          Portfolio performance {period}: {formatCompact(firstValue)} to {formatCompact(lastValue)}, {changePct}% change.
        </span>
      )}
    </div>
  )
}
