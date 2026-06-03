import { useState, useEffect, useRef } from 'react'
import { MonthPicker } from '../shared/MonthPicker'
import { StatCard } from '../shared/StatCard'
import { ComparisonChart } from './charts/ComparisonChart'
import { CategoryChart } from './charts/CategoryChart'
import { MonthlyTrendChart } from './charts/MonthlyTrendChart'
import { formatCompact, formatIDR, formatDate, CATEGORY_LABELS, CATEGORY_COLORS, nowJakarta } from '../../lib/format'
import { useExpenses } from '../../hooks/useExpenses'
import { supabase } from '../../lib/supabase'

function FamilyCompact({ expenses, userNames }) {
  if (expenses.length === 0) return null
  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div className="px-4 py-3 bg-surface-100/60 dark:bg-surface-800/40 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-surface-700 dark:text-surface-300">Family expenses</h2>
        <span className="text-xs font-semibold text-surface-900 dark:text-surface-100 tabular-nums">
          {formatIDR(expenses.reduce((s, e) => s + Number(e.amount), 0))}
        </span>
      </div>
      <div className="divide-y divide-surface-50 dark:divide-surface-800/60 px-4">
        {expenses.map(e => {
          const dot = CATEGORY_COLORS[e.category] || 'oklch(0.55 0.08 60)'
          const label = e.category === 'lainnya' && e.custom_label
            ? e.custom_label
            : CATEGORY_LABELS[e.category]
          return (
            <div key={e.id} className="flex items-center gap-3 py-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-surface-700 dark:text-surface-300">{label}</span>
                {e.description && <span className="text-xs text-surface-400 dark:text-surface-500 ml-2">{e.description}</span>}
                <span className="text-[11px] text-surface-400 dark:text-surface-500 ml-2">{formatDate(e.date)}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums">{formatIDR(e.amount)}</p>
                <p className="text-[11px] text-surface-400 dark:text-surface-500">by {userNames[e.user_id] || 'Unknown'}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PartnerPicker({ partners, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = partners.find(p => p.user_id === selectedId)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (partners.length === 0) return (
    <span className="text-xs text-surface-400 dark:text-surface-500">No partner found</span>
  )

  if (partners.length === 1 && selectedId) return (
    <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
      with <span className="text-surface-700 dark:text-surface-300">{selected?.display_name || 'Partner'}</span>
    </span>
  )

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
      >
        with <span className="text-surface-700 dark:text-surface-300">{selected?.display_name || 'choose partner'}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Select partner"
          className="absolute right-0 top-full mt-2 w-44 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
        >
          {partners.map(p => (
            <button
              key={p.user_id}
              role="option"
              aria-selected={p.user_id === selectedId}
              onClick={() => { onSelect(p.user_id); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                p.user_id === selectedId
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
            >
              {p.display_name || p.user_id.slice(0, 8) + '…'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChartSection({ title, children, featured = false }) {
  return (
    <div
      className={`border-b last:border-0 last:pb-0 ${featured ? 'pb-8' : 'pb-6'}`}
      style={{ borderBottomColor: 'oklch(0.64 0.19 150 / 0.15)' }}
    >
      <h2 className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-4">{title}</h2>
      {children}
    </div>
  )
}

export function CombinedSummary({ user }) {
  const { month: nowMonth, year: nowYear } = nowJakarta()
  const [month, setMonth] = useState(nowMonth)
  const [year, setYear] = useState(nowYear)
  const [trendData, setTrendData] = useState([])
  const [myName, setMyName] = useState('Me')
  const [partners, setPartners] = useState([])
  const [selectedPartnerId, setSelectedPartnerId] = useState(null)

  const { allExpenses, familyExpenses, familyTotal, loading, error, monthOverMonth } = useExpenses(user, month, year)

  const [userNames, setUserNames] = useState({})

  useEffect(() => {
    supabase.from('user_settings').select('user_id, display_name').then(({ data }) => {
      if (!data) return
      const mine = data.find(d => d.user_id === user.id)
      const others = data.filter(d => d.user_id !== user.id)
      if (mine?.display_name) setMyName(mine.display_name)
      setPartners(others)
      if (others.length === 1) setSelectedPartnerId(others[0].user_id)
      setUserNames(Object.fromEntries(data.map(d => [d.user_id, d.display_name || 'Unknown'])))
    })
  }, [user.id])

  useEffect(() => {
    monthOverMonth(6).then(setTrendData)
  }, [month, year])

  const selectedPartner = partners.find(p => p.user_id === selectedPartnerId)
  const partnerName = selectedPartner?.display_name || 'Partner'

  // Filter expenses to only include me + selected partner
  const filteredExpenses = selectedPartnerId
    ? allExpenses.filter(e => e.user_id === user.id || e.user_id === selectedPartnerId)
    : allExpenses.filter(e => e.user_id === user.id)

  const combinedTotal = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const myTotal = filteredExpenses.filter(e => e.user_id === user.id).reduce((s, e) => s + Number(e.amount), 0)
  const partnerTotal = combinedTotal - myTotal

  const topCategory = Object.entries(
    filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {})
  ).sort(([, a], [, b]) => b - a)[0]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header: avatar strip + month/partner picker as one composed unit */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {myName && selectedPartner && (
              <div className="flex -space-x-2 flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-primary-500 ring-2 ring-surface-50 dark:ring-surface-950 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white leading-none">{myName[0]?.toUpperCase()}</span>
                </div>
                <div className="w-7 h-7 rounded-full ring-2 ring-surface-50 dark:ring-surface-950 flex items-center justify-center" style={{ backgroundColor: 'oklch(0.64 0.19 150)' }}>
                  <span className="text-[10px] font-bold text-white leading-none">{partnerName[0]?.toUpperCase()}</span>
                </div>
              </div>
            )}
            <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
          </div>
          <div className="flex-shrink-0">
            <PartnerPicker partners={partners} selectedId={selectedPartnerId} onSelect={setSelectedPartnerId} />
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 pb-6 border-b border-surface-100 dark:border-surface-800">
        {[
          {
            label: 'Combined personal',
            value: loading ? '—' : formatCompact(combinedTotal),
            sub: familyTotal > 0 ? `+${formatCompact(familyTotal)} family` : undefined,
          },
          {
            label: myName,
            value: loading ? '—' : formatCompact(myTotal),
            sub: combinedTotal > 0 ? `${((myTotal / combinedTotal) * 100).toFixed(0)}% of personal` : undefined,
          },
          {
            label: partnerName,
            value: loading ? '—' : formatCompact(partnerTotal),
            sub: combinedTotal > 0 ? `${((partnerTotal / combinedTotal) * 100).toFixed(0)}% of personal` : undefined,
          },
          {
            label: 'Family',
            value: loading ? '—' : (familyTotal > 0 ? formatCompact(familyTotal) : '—'),
            sub: !loading && familyTotal > 0 ? `${familyExpenses.length} item${familyExpenses.length !== 1 ? 's' : ''}` : undefined,
          },
        ].map((card) => (
          <div key={card.label} className="p-1 rounded-[1.25rem] ring-1 ring-black/[0.06] dark:ring-white/[0.15] bg-black/[0.015] dark:bg-white/[0.04]">
            <div className="rounded-[calc(1.25rem-0.25rem)] bg-surface-50 dark:bg-surface-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] p-4">
              <StatCard {...card} loading={loading} />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-loss-light dark:bg-loss/10 border border-loss/20 text-xs text-loss">
          Failed to load data. Check your connection and try refreshing.
        </div>
      )}

      {!selectedPartnerId && partners.length > 0 && (
        <div className="py-16 flex flex-col items-center gap-4">
          <div className="flex -space-x-2" aria-hidden="true">
            <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 ring-2 ring-surface-50 dark:ring-surface-950" />
            <div className="w-10 h-10 rounded-full bg-surface-300 dark:bg-surface-600 ring-2 ring-surface-50 dark:ring-surface-950" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-surface-500 dark:text-surface-400">Pick a partner above</p>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Your combined view will appear here</p>
          </div>
        </div>
      )}

      {loading && selectedPartnerId ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading combined data">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-48 rounded-2xl bg-surface-100 dark:bg-surface-800" />
          ))}
        </div>
      ) : selectedPartnerId ? (
        <div className="space-y-6">
          {familyExpenses.length > 0 && (
            <FamilyCompact expenses={familyExpenses} userNames={userNames} />
          )}

          <ChartSection title={`${myName} vs ${partnerName}`} featured>
            <ComparisonChart
              allExpenses={filteredExpenses}
              userId={user.id}
              partnerId={selectedPartnerId}
              user1Name={myName}
              user2Name={partnerName}
            />
          </ChartSection>

          <ChartSection title="Category breakdown">
            <CategoryChart allExpenses={filteredExpenses} />
          </ChartSection>

          <ChartSection title="6-month trend">
            <MonthlyTrendChart
              trendData={trendData}
              userId={user.id}
              partnerId={selectedPartnerId}
              user1Name={myName}
              user2Name={partnerName}
            />
          </ChartSection>
        </div>
      ) : null}
    </div>
  )
}

