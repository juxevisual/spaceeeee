import { useState, useEffect } from 'react'
import { getAllCategories } from '../../lib/format'
import { useToast } from '../shared/Toast'
import { Dialog } from '../shared/Dialog'
import { Icon } from '../shared/Icon'
import { TypeCreator } from '../shared/TypeCreator'
const today = () => new Date().toISOString().split('T')[0]
const empty = { amount: '', category: 'makan_minuman', custom_label: '', description: '', date: today(), type: 'personal' }

export function ExpenseForm({ initial, onSubmit, onClose, loading, initialType = 'personal', customCategories = [], onAddCategory }) {
  const toast = useToast()
  const [showAddCategory, setShowAddCategory] = useState(false)
  const allCategories = getAllCategories(customCategories)
  const [form, setForm] = useState(initial ? { ...empty, ...initial } : { ...empty, type: initialType })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : { ...empty, type: initialType })
    setErrors({})
  }, [initial, initialType])

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (!form.date) e.date = 'Required'
    if (form.category === 'lainnya' && !form.custom_label.trim()) e.custom_label = 'Required for Others'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const { error } = await onSubmit({
      ...form,
      amount: Number(form.amount),
      custom_label: form.category === 'lainnya' ? form.custom_label : null,
      type: form.type || 'personal',
    }) || {}
    if (!error) toast(initial ? 'Expense updated' : 'Expense added')
  }

  const inputClass = (field) =>
    `w-full px-3 py-2 text-sm rounded-lg border bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-shadow [color-scheme:light] dark:[color-scheme:dark] ${
      errors[field] ? 'border-loss' : 'border-surface-200 dark:border-surface-700 focus:border-primary-400 dark:focus:border-primary-500'
    }`

  const titleId = 'expense-form-title'

  return (
    <Dialog
      titleId={titleId}
      onClose={onClose}
      className="w-full max-w-sm bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-2xl"
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-surface-100 dark:border-surface-800">
        <h2 id={titleId} className="font-semibold text-surface-900 dark:text-surface-100 text-sm">
          {initial ? 'Edit expense' : 'Add expense'}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
        {/* Expense type toggle */}
        <div role="group" aria-label="Expense type" className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!!initial}
            aria-pressed={form.type === 'personal'}
            onClick={() => set('type', 'personal')}
            style={form.type === 'personal' ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
            className={`py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:cursor-default ${
              form.type === 'personal'
                ? 'text-white shadow-[0_4px_16px_rgba(107,79,255,0.30)]'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50'
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            disabled={!!initial}
            aria-pressed={form.type === 'family'}
            onClick={() => set('type', 'family')}
            style={form.type === 'family' ? { backgroundColor: 'oklch(0.64 0.19 150)' } : undefined}
            className={`py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:cursor-default ${
              form.type === 'family'
                ? 'text-white shadow-[0_4px_16px_rgba(50,168,82,0.30)]'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50'
            }`}
          >
            Family
          </button>
        </div>

        <div>
          <label htmlFor="ef-amount" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Amount (IDR)</label>
          <input
            id="ef-amount"
            type="number" min="1" step="1"
            className={inputClass('amount')}
            placeholder="0"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
          />
          {errors.amount && <p className="text-xs text-loss mt-1" role="alert">{errors.amount}</p>}
        </div>

        {/* Category visual picker */}
        <div>
          <label className="block text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-2">Category</label>
          <div role="group" aria-label="Expense category" className="grid grid-cols-3 gap-2">
            {allCategories.map(cat => {
              const isSelected = form.category === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => { set('category', cat.key); setShowAddCategory(false) }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isSelected
                      ? 'text-white shadow-[0_2px_12px_rgba(0,0,0,0.18)] scale-[1.02]'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                  style={isSelected ? { background: cat.color } : {}}
                >
                  <Icon name={cat.icon} size={17} strokeWidth={isSelected ? 2 : 1.75} />
                  <span className="text-[11px] font-semibold leading-none text-center">{cat.label.split(' ')[0]}</span>
                </button>
              )
            })}
            {/* Add new category */}
            <button
              type="button"
              onClick={() => setShowAddCategory(s => !s)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                showAddCategory
                  ? 'border-primary-400 text-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-surface-300 dark:border-surface-600 text-surface-400 dark:text-surface-500 hover:border-primary-400 hover:text-primary-500'
              }`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-[11px] font-semibold leading-none">New</span>
            </button>
          </div>

          {/* Inline category creator */}
          <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showAddCategory ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <TypeCreator
                placeholder="e.g. Pet care"
                onSave={async (cat) => {
                  await onAddCategory?.(cat)
                  set('category', cat.key)
                  setShowAddCategory(false)
                  toast('Category added')
                }}
                onCancel={() => setShowAddCategory(false)}
              />
            </div>
          </div>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="ef-date" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Date</label>
          <input
            id="ef-date"
            type="date"
            className={inputClass('date')}
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
          {errors.date && <p className="text-xs text-loss mt-1" role="alert">{errors.date}</p>}
        </div>

        {form.category === 'lainnya' && (
          <div>
            <label htmlFor="ef-custom-label" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Label</label>
            <input
              id="ef-custom-label"
              className={inputClass('custom_label')}
              placeholder="e.g. Gift for friend"
              value={form.custom_label}
              onChange={e => set('custom_label', e.target.value)}
            />
            {errors.custom_label && <p className="text-xs text-loss mt-1" role="alert">{errors.custom_label}</p>}
          </div>
        )}

        <div>
          <label htmlFor="ef-description" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
            Description <span className="font-normal text-surface-300 dark:text-surface-600">(optional)</span>
          </label>
          <input
            id="ef-description"
            className={inputClass('description')}
            placeholder="Any notes..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Savingâ€¦' : initial ? 'Save' : 'Add expense'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

