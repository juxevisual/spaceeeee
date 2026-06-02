import { useState, useEffect } from 'react'
import { MonthPicker } from '../shared/MonthPicker'
import { StatCard } from '../shared/StatCard'
import { ExpenseTimeline } from './ExpenseTimeline'
import { FamilyTimeline } from './FamilyTimeline'
import { ExpenseForm } from './ExpenseForm'
import { formatCompact, CATEGORY_LABELS, nowJakarta } from '../../lib/format'
import { useExpenses } from '../../hooks/useExpenses'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { supabase } from '../../lib/supabase'

function TabBar({ active, onChange }) {
  return (
    <div role="tablist" className="inline-flex gap-0.5 p-0.5 rounded-full bg-surface-100 dark:bg-surface-800">
      <button
        role="tab"
        aria-selected={active === 'personal'}
        onClick={() => onChange('personal')}
        style={active === 'personal' ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
          active === 'personal'
            ? 'text-white shadow-[0_2px_10px_rgba(107,79,255,0.30)]'
            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
        }`}
      >
        Personal
      </button>
      <button
        role="tab"
        aria-selected={active === 'family'}
        onClick={() => onChange('family')}
        style={active === 'family' ? { backgroundColor: 'oklch(0.64 0.19 150)' } : undefined}
        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
          active === 'family'
            ? 'text-white shadow-[0_2px_10px_rgba(50,168,82,0.30)]'
            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
        }`}
      >
        Family
      </button>
    </div>
  )
}

export function ExpenseDashboard({ user }) {
  const { month: nowMonth, year: nowYear } = nowJakarta()
  const [month, setMonth] = useState(nowMonth)
  const [year, setYear] = useState(nowYear)
  const [tab, setTab] = useState('personal')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [userNames, setUserNames] = useState({})
  const [customCategories, setCustomCategories] = useState([])

  useEffect(() => {
    supabase.from('user_settings').select('custom_expense_categories').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.custom_expense_categories) setCustomCategories(data.custom_expense_categories) })
  }, [user.id])

  const addCategory = async (cat) => {
    const updated = [...customCategories, cat]
    await supabase.from('user_settings').upsert({ user_id: user.id, custom_expense_categories: updated, updated_at: new Date().toISOString() })
    setCustomCategories(updated)
    return { error: null }
  }

  const {
    expenses, familyExpenses, familyTotal, loading, error,
    addExpense, updateExpense, deleteExpense,
    monthlyTotal, byCategory,
  } = useExpenses(user, month, year)

  useEffect(() => {
    supabase.from('user_settings').select('user_id, display_name').then(({ data }) => {
      if (!data) return
      setUserNames(Object.fromEntries(data.map(d => [d.user_id, d.display_name || 'Unknown'])))
    })
  }, [])

  const headerRef = useScrollReveal(0)
  const timelineRef = useScrollReveal(80)
  const isFamily = tab === 'family'
  const displayedExpenses = isFamily ? familyExpenses : expenses
  const displayedTotal = isFamily ? familyTotal : monthlyTotal
  const topCategory = Object.entries(
    displayedExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {})
  ).sort(([, a], [, b]) => b - a)[0]

  const handleEdit = (entry) => {
    setEditTarget(entry)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    setFormLoading(true)
    const result = editTarget ? await updateExpense(editTarget.id, data) : await addExpense(data)
    setFormLoading(false)
    if (result?.error) return result  // keep form open on error
    setFormOpen(false)
    setEditTarget(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header — stacks on mobile, single row on sm+ */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <TabBar active={tab} onChange={setTab} />
          <button
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
            aria-label={`Add ${isFamily ? 'family' : 'personal'} expense`}
            style={{ backgroundColor: isFamily ? 'oklch(0.64 0.19 150)' : 'oklch(0.60 0.26 280)' }}
            className="group flex items-center gap-2 pl-4 pr-2 py-2 text-xs font-semibold rounded-full text-white transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
          >
            Add
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 pb-6 border-b border-surface-100 dark:border-surface-800">
        <StatCard
          label={isFamily ? 'Family total' : 'Personal total'}
          value={loading ? '—' : formatCompact(displayedTotal)}
          loading={loading}
        />
        <StatCard
          label="Top category"
          value={loading ? '—' : (topCategory ? CATEGORY_LABELS[topCategory[0]] : '—')}
          sub={loading ? undefined : (topCategory ? formatCompact(topCategory[1]) : undefined)}
          loading={loading}
        />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-loss-light dark:bg-loss/10 border border-loss/20 text-xs text-loss">
          Failed to load expenses. Check your connection and try refreshing.
        </div>
      )}

      <div key={tab} className="tab-fade-in">
        {isFamily ? (
          <FamilyTimeline
            expenses={familyExpenses}
            monthlyTotal={familyTotal}
            onEdit={handleEdit}
            onDelete={deleteExpense}
            loading={loading}
            userNames={userNames}
          />
        ) : (
          <ExpenseTimeline
            expenses={expenses}
            byCategory={byCategory}
            monthlyTotal={monthlyTotal}
            onEdit={handleEdit}
            onDelete={deleteExpense}
            loading={loading}
            customCategories={customCategories}
          />
        )}
      </div>

      {formOpen && (
        <ExpenseForm
          initial={editTarget}
          initialType={isFamily ? 'family' : 'personal'}
          onSubmit={handleSubmit}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          loading={formLoading}
          customCategories={customCategories}
          onAddCategory={addCategory}
        />
      )}
    </div>
  )
}
