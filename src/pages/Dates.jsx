import { useState, useEffect } from 'react'
import { useImportantDates } from '../hooks/useImportantDates'
import { supabase } from '../lib/supabase'
import { todayJakarta } from '../lib/format'
import { useToast } from '../components/shared/Toast'

const DATE_CATEGORIES = {
  anniversary:  { label: 'Anniversary',  color: 'oklch(0.65 0.20 5)'   },
  personal:     { label: 'Personal',     color: 'oklch(0.60 0.26 280)'  },
  document:     { label: 'Document',     color: 'oklch(0.72 0.15 75)'   },
  bill:         { label: 'Bill',         color: 'oklch(0.64 0.19 150)'  },
  health:       { label: 'Health',       color: 'oklch(0.62 0.18 165)'  },
  travel:       { label: 'Travel',       color: 'oklch(0.62 0.18 220)'  },
  subscription: { label: 'Subscription', color: 'oklch(0.62 0.18 310)'  },
  work:         { label: 'Work',         color: 'oklch(0.65 0.15 55)'   },
  others:       { label: 'Others',       color: 'oklch(0.55 0.05 280)'  },
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function daysUntilNext(dateStr, recurring) {
  const today = new Date(todayJakarta() + 'T12:00:00Z')
  let d = new Date(dateStr + 'T12:00:00Z')
  if (recurring) {
    d.setUTCFullYear(today.getUTCFullYear())
    if (d < today) d.setUTCFullYear(today.getUTCFullYear() + 1)
  }
  return Math.round((d - today) / 86400000)
}

function daysSinceLastOccurrence(dateStr) {
  const today = new Date(todayJakarta() + 'T12:00:00Z')
  let d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCFullYear(today.getUTCFullYear())
  if (d >= today) d.setUTCFullYear(today.getUTCFullYear() - 1)
  return Math.round((today - d) / 86400000)
}

function formatDateDisplay(dateStr, recurring) {
  const d = new Date(dateStr + 'T12:00:00Z')
  if (recurring) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function DaysChip({ days }) {
  if (days === 0) return <span className="text-xs font-bold tabular-nums" style={{ color: 'oklch(0.54 0.18 220)' }}>Today</span>
  if (days === 1) return <span className="text-xs font-semibold tabular-nums text-surface-500 dark:text-surface-400">Tomorrow</span>
  if (days > 0) return <span className="text-xs font-semibold tabular-nums text-surface-500 dark:text-surface-400">{days}d away</span>
  return <span className="text-xs text-surface-400 dark:text-surface-500 tabular-nums">{Math.abs(days)}d ago</span>
}

function MonthGrid({ year, month, dateDotMap }) {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const todayStr = todayJakarta()

  return (
    <div>
      <p className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-[0.07em] mb-2">
        {MONTH_SHORT[month]}
      </p>
      <div className="grid grid-cols-7 gap-y-0.5">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-[8px] text-surface-300 dark:text-surface-700 text-center pb-0.5">{d}</div>
        ))}
        {Array.from({ length: offset }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dots = dateDotMap[dateStr] || []
          const isToday = dateStr === todayStr
          return (
            <div key={day} className="relative group/day flex flex-col items-center">
              <span className={`text-[9px] w-5 h-5 flex items-center justify-center rounded-full leading-none ${
                isToday
                  ? 'font-bold text-white'
                  : 'text-surface-500 dark:text-surface-400'
              }`}
                style={isToday ? { backgroundColor: 'oklch(0.54 0.18 220)' } : {}}
              >
                {day}
              </span>
              {dots.length > 0 && (
                <>
                  <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                    {dots.slice(0, 2).map((dot, di) => (
                      <span key={di} className="w-1 h-1 rounded-full" style={{ backgroundColor: dot.color }} />
                    ))}
                    {dots.length > 2 && (
                      <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
                    )}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/day:block z-20 pointer-events-none">
                    <div
                      className="px-2 py-1 rounded-md shadow-lg text-[9px] font-medium whitespace-nowrap"
                      style={{ backgroundColor: 'oklch(0.108 0.009 280)', color: 'oklch(0.958 0.003 280)' }}
                    >
                      {dots.map(d => d.label).join(' · ')}
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function YearCalendar({ dates }) {
  const today = new Date(todayJakarta() + 'T12:00:00Z')
  const year = today.getUTCFullYear()

  const dateDotMap = {}
  dates.forEach(d => {
    const cat = DATE_CATEGORIES[d.category] || DATE_CATEGORIES.personal
    const dot = { label: d.label, color: cat.color }
    if (d.recurring) {
      const key = `${year}-${d.date.slice(5)}`
      if (!dateDotMap[key]) dateDotMap[key] = []
      dateDotMap[key].push(dot)
    } else if (d.date.startsWith(String(year))) {
      if (!dateDotMap[d.date]) dateDotMap[d.date] = []
      dateDotMap[d.date].push(dot)
    }
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(DATE_CATEGORIES).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            <span className="text-[11px] text-surface-400 dark:text-surface-500">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: 12 }, (_, i) => (
          <MonthGrid key={i} year={year} month={i} dateDotMap={dateDotMap} />
        ))}
      </div>
    </div>
  )
}

function DateForm({ initial, onSubmit, onClose, loading }) {
  const [label, setLabel] = useState(initial?.label || '')
  const [date, setDate] = useState(initial?.date || '')
  const [recurring, setRecurring] = useState(initial?.recurring ?? false)
  const [category, setCategory] = useState(initial?.category || 'personal')
  const [description, setDescription] = useState(initial?.description || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!label.trim() || !date) return
    onSubmit({ label: label.trim(), date, recurring, category, description: description.trim() || null })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={initial ? 'Edit date' : 'Add important date'}>
      <div className="dialog-backdrop-enter absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="dialog-panel-enter relative w-full max-w-sm bg-surface-50 dark:bg-surface-900 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] dark:ring-white/[0.12] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-100 dark:border-surface-800">
          <h2 className="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">
            {initial ? 'Edit date' : 'Add date'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 overflow-y-auto max-h-[80dvh]">
          <div>
            <label className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] block mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Anniversary, Passport expiry..."
              maxLength={80}
              className="w-full px-3 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 dark:focus:border-primary-500 transition-shadow [color-scheme:light] dark:[color-scheme:dark]"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] block mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 dark:focus:border-primary-500 transition-shadow [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] block mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DATE_CATEGORIES).map(([key, { label: catLabel, color }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  style={category === key ? { backgroundColor: color, color: 'white' } : {}}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 active:scale-[0.97] ${
                    category === key ? 'shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  {catLabel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] block mb-1.5">
              Notes <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Any details worth remembering..."
              maxLength={300}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 dark:focus:border-primary-500 transition-shadow resize-none [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <button
            type="button"
            onClick={() => setRecurring(r => !r)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all duration-200 ${
              recurring
                ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-surface-800'
                : 'border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${recurring ? 'border-primary-500 bg-primary-500' : 'border-surface-300 dark:border-surface-600'}`}>
              {recurring && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-surface-700 dark:text-surface-300">Recurring annually</p>
              <p className="text-[11px] text-surface-400 dark:text-surface-500">Repeats every year on this date</p>
            </div>
          </button>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-xs font-semibold rounded-full border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label.trim() || !date || loading}
              style={{ backgroundColor: 'oklch(0.54 0.18 220)' }}
              className="flex-1 py-2 text-xs font-semibold rounded-full text-white disabled:opacity-40 transition-opacity active:scale-[0.97] ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              {loading ? 'Saving...' : (initial ? 'Save' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UpcomingStrip({ dates }) {
  const upcoming = dates
    .map(d => ({ ...d, days: daysUntilNext(d.date, d.recurring) }))
    .filter(d => d.days >= 0 && d.days <= 60)
    .sort((a, b) => a.days - b.days)

  if (upcoming.length === 0) return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.08em]">Coming up</p>
      <p className="text-xs text-surface-300 dark:text-surface-600">Nothing in the next 60 days</p>
    </div>
  )

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.08em]">Coming up</p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {upcoming.map(d => {
          const cat = DATE_CATEGORIES[d.category] || DATE_CATEGORIES.personal
          return (
            <div key={d.id} className={`flex-shrink-0 w-28 p-3 rounded-2xl flex flex-col gap-1 ${d.days === 0 ? 'dates-card-today' : 'ring-1 ring-black/[0.06] dark:ring-white/[0.12] bg-surface-50 dark:bg-surface-900'}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 truncate">{cat.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums leading-none tracking-[-0.03em]" style={{ color: d.days === 0 ? 'oklch(0.54 0.18 220)' : 'oklch(0.50 0.17 220)' }}>
                {d.days === 0 ? '!' : d.days}
              </p>
              <p className="text-[10px] text-surface-400 dark:text-surface-500">{d.days === 0 ? 'Today' : d.days === 1 ? 'tomorrow' : 'days'}</p>
              <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 leading-tight line-clamp-2">{d.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DateRow({ date, userId, userNames, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const isOwn = date.user_id === userId
  const cat = DATE_CATEGORIES[date.category] || DATE_CATEGORIES.personal
  const days = daysUntilNext(date.date, date.recurring)
  const since = date.recurring && days > 0 ? daysSinceLastOccurrence(date.date) : null
  const sinceLabel = since === null ? null
    : since >= 365
      ? `${Math.floor(since / 365)} yr${Math.floor(since / 365) !== 1 ? 's' : ''} since last`
      : `${since}d since last`

  return (
    <div className="flex items-start gap-3 py-3 group">
      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: cat.color }} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">{date.label}</span>
          {date.recurring && (
            <span className="text-[10px] font-semibold text-surface-300 dark:text-surface-600 uppercase tracking-[0.06em]">annual</span>
          )}
        </div>
        <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{formatDateDisplay(date.date, date.recurring)}</p>
        {date.description && (
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 leading-relaxed">{date.description}</p>
        )}
        {sinceLabel && (
          <p className="text-[11px] text-surface-300 dark:text-surface-600 mt-0.5">{sinceLabel}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <DaysChip days={days} />
        {isOwn && (
          confirming ? (
            <div className="flex gap-1">
              <button onClick={() => onDelete(date.id)} className="text-[10px] font-medium text-loss border border-loss/30 rounded-md px-2 py-1 hover:bg-loss-light dark:hover:bg-loss/10 transition-colors">Delete</button>
              <button onClick={() => setConfirming(false)} className="text-[10px] text-surface-400 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(date)} aria-label="Edit date" className="p-1.5 rounded-md text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button onClick={() => setConfirming(true)} aria-label="Delete date" className="p-1.5 rounded-md text-surface-300 dark:text-surface-600 hover:text-loss hover:bg-loss-light dark:hover:bg-loss/10 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export function Dates({ user }) {
  const { dates, loading, addDate, updateDate, deleteDate: deleteDateRaw } = useImportantDates(user)
  const toast = useToast()
  const [view, setView] = useState('list')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [userNames, setUserNames] = useState({})

  useEffect(() => {
    supabase.from('user_settings').select('user_id, display_name').then(({ data }) => {
      if (data) setUserNames(Object.fromEntries(data.map(d => [d.user_id, d.display_name || 'Unknown'])))
    })
  }, [])

  const handleSubmit = async (data) => {
    setFormLoading(true)
    const result = editTarget ? await updateDate(editTarget.id, data) : await addDate(data)
    setFormLoading(false)
    if (!result.error) { setFormOpen(false); setEditTarget(null) }
  }

  const deleteDate = async (id) => {
    const dateToRestore = dates.find(d => d.id === id)
    await deleteDateRaw(id)
    toast('Date removed', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (dateToRestore) addDate({
            label: dateToRestore.label,
            date: dateToRestore.date,
            recurring: dateToRestore.recurring,
            category: dateToRestore.category,
            description: dateToRestore.description,
          })
        },
      },
    })
  }

  const handleEdit = (date) => { setEditTarget(date); setFormOpen(true) }

  const allSorted = [...dates].sort((a, b) =>
    daysUntilNext(a.date, a.recurring) - daysUntilNext(b.date, b.recurring)
  )
  const upcomingDates = allSorted.filter(d => daysUntilNext(d.date, d.recurring) >= 0)
  const pastDates = allSorted
    .filter(d => !d.recurring && daysUntilNext(d.date, d.recurring) < 0)
    .reverse()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'oklch(0.58 0.17 220)' }}>Important dates</h2>
          <div className="inline-flex gap-0.5 p-0.5 rounded-full bg-surface-100 dark:bg-surface-800">
            {[
              { key: 'list', label: 'List' },
              { key: 'year', label: 'Year' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  view === key
                    ? 'bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-200 shadow-sm'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          style={{ backgroundColor: 'oklch(0.54 0.18 220)' }}
          className="group flex items-center gap-2 pl-4 pr-2 py-2 text-xs font-semibold rounded-full text-white transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.97]"
        >
          Add
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-200">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-12 rounded-xl bg-surface-100 dark:bg-surface-800" />)}
        </div>
      ) : dates.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm font-medium text-surface-400 dark:text-surface-500">No dates added yet</p>
          <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">Add anniversaries, document expiries, and anything worth remembering</p>
        </div>
      ) : (
        <div key={view} className="tab-fade-in">
          {view === 'year' ? (
            <YearCalendar dates={dates} />
          ) : (
            <div className="space-y-8">
              <UpcomingStrip dates={dates} />
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.08em] mb-1">All dates</p>
                <div className="divide-y divide-surface-50 dark:divide-surface-800/60">
                  {upcomingDates.map((d, i) => (
                    <div key={d.id} className="date-row-enter" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                      <DateRow date={d} userId={user.id} userNames={userNames} onEdit={handleEdit} onDelete={deleteDate} />
                    </div>
                  ))}
                </div>
                {pastDates.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-[10px] font-semibold text-surface-300 dark:text-surface-600 uppercase tracking-[0.08em] whitespace-nowrap">Past</p>
                      <div className="flex-1 h-px bg-surface-100 dark:bg-surface-800" />
                    </div>
                    <div className="divide-y divide-surface-50 dark:divide-surface-800/60">
                      {pastDates.map((d, i) => (
                        <div key={d.id} className="date-row-enter" style={{ animationDelay: `${Math.min(i, 4) * 40}ms` }}>
                          <DateRow date={d} userId={user.id} userNames={userNames} onEdit={handleEdit} onDelete={deleteDate} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <DateForm
          initial={editTarget}
          onSubmit={handleSubmit}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          loading={formLoading}
        />
      )}
    </div>
  )
}
