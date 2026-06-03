import { useState, useEffect } from 'react'
import { MonthPicker } from '../shared/MonthPicker'
import { StatCard } from '../shared/StatCard'
import { ExpenseTimeline } from './ExpenseTimeline'
import { FamilyTimeline } from './FamilyTimeline'
import { ExpenseForm } from './ExpenseForm'
import { formatCompact, CATEGORY_LABELS, getAllCategories, nowJakarta } from '../../lib/format'
import { useToast } from '../shared/Toast'
import { useExpenses } from '../../hooks/useExpenses'
import { usePace } from '../../hooks/usePace'
import { useCategoryVelocity } from '../../hooks/useCategoryVelocity'
import { useCategoryFrequency } from '../../hooks/useCategoryFrequency'
import { useExpenseStreak } from '../../hooks/useExpenseStreak'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { supabase } from '../../lib/supabase'
import { SpendingPace } from './SpendingPace'
import { MonthReview } from './MonthReview'

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
  const toast = useToast()
  const { month: nowMonth, year: nowYear } = nowJakarta()
  const [month, setMonth] = useState(nowMonth)
  const [year, setYear] = useState(nowYear)
  const [tab, setTab] = useState('personal')
  const [formOpen, setFormOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
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
    addExpense, updateExpense, deleteExpense: deleteExpenseRaw,
    monthlyTotal, byCategory,
  } = useExpenses(user, month, year)

  useEffect(() => {
    supabase.from('user_settings').select('user_id, display_name').then(({ data }) => {
      if (!data) return
      setUserNames(Object.fromEntries(data.map(d => [d.user_id, d.display_name || 'Unknown'])))
    })
  }, [])

  const isCurrentMonth = month === nowMonth && year === nowYear
  const { lastMonthPartial, loading: paceLoading } = usePace(
    user, month, year, tab === 'family' ? 'family' : 'personal'
  )
  const { lastMonthByCategory } = useCategoryVelocity(user, month, year)
  const { avgFrequencyByCategory } = useCategoryFrequency(user, month, year)

  const currentFrequency = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1
    return acc
  }, {})
  const { streak } = useExpenseStreak(user)

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

  const deleteExpense = async (id) => {
    const expToRestore = [...expenses, ...familyExpenses].find(e => e.id === id)
    await deleteExpenseRaw(id)
    toast('Expense deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (expToRestore) addExpense({
            amount: expToRestore.amount,
            category: expToRestore.category,
            custom_label: expToRestore.custom_label,
            description: expToRestore.description,
            date: expToRestore.date,
            type: expToRestore.type,
          })
        },
      },
    })
  }

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
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header — stacks on mobile, single row on sm+ */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-1">
          <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
          {!isCurrentMonth && (expenses.length > 0 || familyExpenses.length > 0) && (
            <button
              onClick={() => setReviewOpen(true)}
              className="text-[11px] font-semibold text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 px-2.5 py-1.5 rounded-full hover:bg-primary-50 dark:hover:bg-surface-800 transition-colors"
            >
              Review
            </button>
          )}
          {isCurrentMonth && streak >= 2 && (
            <span className="text-[11px] text-surface-400 dark:text-surface-500 pl-1" aria-label={`${streak}-day logging streak`}>
              {streak}d streak
            </span>
          )}
        </div>
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

      {/* Stat strip — constrained width so cards don't stretch hollow on desktop */}
      <div className="grid grid-cols-2 gap-3 max-w-xs sm:max-w-sm mb-3">
        <div className="p-1 rounded-[1.25rem] ring-1 ring-black/[0.06] dark:ring-white/[0.15] bg-black/[0.015] dark:bg-white/[0.04]">
          <div className="rounded-[calc(1.25rem-0.25rem)] bg-surface-50 dark:bg-surface-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] p-4">
            <StatCard
              label={isFamily ? 'Family total' : 'Personal total'}
              value={loading ? '—' : formatCompact(displayedTotal)}
              loading={loading}
            />
          </div>
        </div>
        <div className="p-1 rounded-[1.25rem] ring-1 ring-black/[0.06] dark:ring-white/[0.15] bg-black/[0.015] dark:bg-white/[0.04]">
          <div className="rounded-[calc(1.25rem-0.25rem)] bg-surface-50 dark:bg-surface-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] p-4">
            <StatCard
              label="Top category"
              value={loading ? '—' : (topCategory ? (
                getAllCategories(customCategories).find(c => c.key === topCategory[0])?.label ||
                CATEGORY_LABELS[topCategory[0]] ||
                topCategory[0]
              ) : '—')}
              sub={loading ? undefined : (topCategory ? formatCompact(topCategory[1]) : undefined)}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* SpendingPace anchored tightly to stats, generous gap before timeline */}
      {isCurrentMonth && (
        <div className="mb-8 pb-6 border-b border-surface-100 dark:border-surface-800">
          <SpendingPace
            currentTotal={displayedTotal}
            lastMonthPartial={lastMonthPartial}
            month={month}
            year={year}
            loading={loading || paceLoading}
          />
        </div>
      )}
      {!isCurrentMonth && <div className="mb-8 border-b border-surface-100 dark:border-surface-800" />}

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-loss-light dark:bg-loss/10 border border-loss/20 text-xs text-loss">
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
            velocityByCategory={tab === 'personal' ? lastMonthByCategory : null}
            currentFrequency={tab === 'personal' ? currentFrequency : null}
            avgFrequencyByCategory={tab === 'personal' ? avgFrequencyByCategory : null}
          />
        )}
      </div>

      {reviewOpen && (
        <MonthReview
          expenses={expenses}
          familyExpenses={familyExpenses}
          monthlyTotal={monthlyTotal}
          familyTotal={familyTotal}
          month={month}
          year={year}
          onClose={() => setReviewOpen(false)}
          customCategories={customCategories}
        />
      )}

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
