import { useState, useEffect, useRef } from 'react'
import { useNotes } from '../hooks/useNotes'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/shared/Toast'

const NOTE_COLORS = [
  { key: 'default', swatch: 'oklch(0.838 0.004 280)', bgLight: null,                  bgDark: null                  },
  { key: 'yellow',  swatch: 'oklch(0.78 0.14 85)',    bgLight: 'oklch(0.96 0.08 85)',  bgDark: 'oklch(0.22 0.06 85)'  },
  { key: 'green',   swatch: 'oklch(0.64 0.19 150)',   bgLight: 'oklch(0.94 0.07 150)', bgDark: 'oklch(0.20 0.07 150)' },
  { key: 'indigo',  swatch: 'oklch(0.60 0.26 280)',   bgLight: 'oklch(0.93 0.07 280)', bgDark: 'oklch(0.22 0.08 280)' },
  { key: 'rose',    swatch: 'oklch(0.65 0.20 5)',     bgLight: 'oklch(0.95 0.06 10)',  bgDark: 'oklch(0.22 0.07 10)'  },
  { key: 'sky',     swatch: 'oklch(0.62 0.18 220)',   bgLight: 'oklch(0.94 0.05 220)', bgDark: 'oklch(0.22 0.06 220)' },
]

const REACTIONS = [
  {
    key: 'check',
    label: 'Done',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    key: 'heart',
    label: 'Love',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
        <path d="M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13z" />
      </svg>
    ),
  },
  {
    key: 'flag',
    label: 'Flag',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
]

function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

function getNoteStyle(colorKey, isDark) {
  const c = NOTE_COLORS.find(n => n.key === colorKey) || NOTE_COLORS[0]
  if (!c.bgLight) return {}
  return { backgroundColor: isDark ? c.bgDark : c.bgLight }
}

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function parseChecklist(content) {
  try { return JSON.parse(content) } catch { return [] }
}

function ColorPicker({ selected, onChange }) {
  const [hoveredKey, setHoveredKey] = useState(null)
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Note color">
      {NOTE_COLORS.map(c => (
        <button
          key={c.key}
          type="button"
          role="radio"
          aria-checked={selected === c.key}
          aria-label={c.key}
          onClick={() => onChange(c.key)}
          onMouseEnter={() => setHoveredKey(c.key)}
          onMouseLeave={() => setHoveredKey(null)}
          className={`w-5 h-5 rounded-full transition-all duration-150 ${
            selected === c.key
              ? 'scale-125 ring-2 ring-offset-1 ring-surface-400 dark:ring-surface-500'
              : 'hover:scale-110'
          }`}
          style={{
            backgroundColor: c.swatch,
            filter: hoveredKey === c.key && selected !== c.key && c.bgLight
              ? `drop-shadow(0 0 5px ${c.swatch})`
              : 'none',
          }}
        />
      ))}
    </div>
  )
}

function TypeToggle({ value, onChange }) {
  return (
    <div className="inline-flex gap-0.5 p-0.5 rounded-full bg-surface-100 dark:bg-surface-800">
      {['text', 'checklist'].map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] capitalize ${
            value === t ? 'text-white shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
          style={value === t ? { backgroundColor: 'oklch(0.58 0.18 75)' } : {}}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function ChecklistEditor({ items, onChange, autoFocusFirst = false }) {
  const lastRef = useRef(null)

  const update = (id, text) => onChange(items.map(i => i.id === id ? { ...i, text } : i))
  const remove = (id) => onChange(items.filter(i => i.id !== id))
  const add = () => {
    onChange([...items, { id: Date.now(), text: '', checked: false }])
    setTimeout(() => lastRef.current?.focus(), 50)
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm border border-surface-300 dark:border-surface-600 flex-shrink-0" aria-hidden="true" />
          <input
            ref={idx === items.length - 1 ? lastRef : null}
            autoFocus={autoFocusFirst && idx === 0}
            type="text"
            value={item.text}
            onChange={e => update(item.id, e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); add() }
              if (e.key === 'Backspace' && !item.text && items.length > 1) {
                e.preventDefault()
                remove(item.id)
              }
            }}
            placeholder={idx === 0 ? 'First item...' : 'Add item...'}
            className="flex-1 text-sm bg-transparent outline-none text-surface-800 dark:text-surface-200 placeholder-surface-300 dark:placeholder-surface-600"
          />
          {items.length > 1 && (
            <button type="button" onClick={() => remove(item.id)} className="text-surface-500 dark:text-surface-400 hover:text-loss transition-colors flex-shrink-0">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1.5 text-[11px] text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors mt-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add item
      </button>
    </div>
  )
}

function ReactionBar({ reactions, userId, noteId, onReact, readOnly = false }) {
  const counts = Object.values(reactions || {}).reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1
    return acc
  }, {})
  const myReaction = (reactions || {})[userId]

  return (
    <div className="flex items-center gap-1">
      {REACTIONS.map(({ key, label, icon }) => {
        const count = counts[key] || 0
        const isActive = myReaction === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onReact(noteId, reactions, userId, key)}
            aria-label={`${label}${count > 0 ? ` (${count})` : ''}`}
            aria-pressed={isActive}
            disabled={readOnly}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-150 ${readOnly ? 'cursor-default' : 'active:scale-[0.82]'} ${
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400'
                : readOnly
                  ? 'text-surface-400 dark:text-surface-500'
                  : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-black/[0.06] dark:hover:bg-surface-800'
            }`}
          >
            {icon}
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

function NoteCard({ note, userId, userNames, isDark, onUpdate, onDelete, onPin, onArchive, onReact }) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.content)
  const [editColor, setEditColor] = useState(note.color || 'default')
  const [editItems, setEditItems] = useState([])
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAllDone, setShowAllDone] = useState(false)
  const textareaRef = useRef(null)

  const isOwn = note.user_id === userId
  const isChecklist = note.type === 'checklist'
  const checklistItems = isChecklist ? parseChecklist(note.content) : []
  const authorInitial = (userNames[note.user_id] || 'U')[0]?.toUpperCase()

  const openEdit = () => {
    setEditContent(note.content)
    setEditColor(note.color || 'default')
    if (isChecklist) setEditItems(parseChecklist(note.content))
    setEditing(true)
  }

  useEffect(() => {
    if (editing && !isChecklist) textareaRef.current?.focus()
  }, [editing, isChecklist])

  const handleSave = async () => {
    const content = isChecklist
      ? JSON.stringify(editItems.filter(i => i.text.trim()).map(i => ({ ...i, text: i.text.trim() })))
      : editContent.trim()
    if (!content || content === '[]') return
    setSaving(true)
    await onUpdate(note.id, { content, color: editColor })
    setSaving(false)
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditContent(note.content)
    setEditColor(note.color || 'default')
  }

  const toggleChecklistItem = async (itemId) => {
    const updated = checklistItems.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i)
    await onUpdate(note.id, { content: JSON.stringify(updated) })
  }

  const doneCount = checklistItems.filter(i => i.checked).length
  const totalCount = checklistItems.length
  const prevAllDoneRef = useRef(doneCount === totalCount && totalCount > 0)

  useEffect(() => {
    if (!isChecklist || totalCount === 0) return
    const allDone = doneCount === totalCount
    if (allDone && !prevAllDoneRef.current) {
      setShowAllDone(true)
      const t = setTimeout(() => setShowAllDone(false), 1800)
      prevAllDoneRef.current = true
      return () => clearTimeout(t)
    }
    if (!allDone) {
      prevAllDoneRef.current = false
      setShowAllDone(false)
    }
  }, [doneCount, totalCount, isChecklist])

  return (
    <div
      className={`rounded-2xl ring-1 ring-black/[0.07] dark:ring-white/[0.12] p-4 flex flex-col gap-3 transition-all duration-200 ${note.archived ? 'opacity-60' : ''}`}
      style={getNoteStyle(editing ? editColor : (note.color || 'default'), isDark)}
    >
      {editing ? (
        <>
          {isChecklist
            ? <ChecklistEditor items={editItems} onChange={setEditItems} />
            : (
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave() }}
                maxLength={500}
                rows={4}
                className="w-full text-sm text-surface-800 dark:text-surface-200 bg-transparent resize-none outline-none leading-relaxed"
              />
            )
          }
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <ColorPicker selected={editColor} onChange={setEditColor} />
            <div className="flex gap-1.5">
              <button onClick={cancelEdit} className="px-3 py-1 text-xs font-medium rounded-full border border-surface-200 dark:border-surface-700 text-surface-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: 'oklch(0.58 0.18 75)' }}
                className="px-3 py-1 text-xs font-semibold rounded-full text-white disabled:opacity-40 transition-opacity"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {isChecklist ? (
            <div className="space-y-2">
              {totalCount > 0 && (
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors duration-300"
                  style={{ color: showAllDone ? 'oklch(0.58 0.18 75)' : undefined }}
                  aria-live="polite"
                >
                  <span className={showAllDone ? '' : 'text-surface-400 dark:text-surface-500'}>
                    {showAllDone ? 'All done!' : `${doneCount}/${totalCount} done`}
                  </span>
                </p>
              )}
              <div className="space-y-1.5">
                {checklistItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleChecklistItem(item.id)}
                    className="flex items-center gap-2.5 w-full text-left group"
                  >
                    <span className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                      item.checked
                        ? 'border-transparent'
                        : 'border-surface-300 dark:border-surface-600'
                    }`}
                      style={item.checked ? { backgroundColor: 'oklch(0.58 0.18 75)' } : {}}
                    >
                      {item.checked && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" aria-hidden="true" className="check-mark-enter">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm leading-relaxed transition-all duration-150 ${
                      item.checked
                        ? 'line-through text-surface-400 dark:text-surface-500'
                        : 'text-surface-800 dark:text-surface-200'
                    }`}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-surface-800 dark:text-surface-200 whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>
          )}

          <ReactionBar
            reactions={note.reactions}
            userId={userId}
            noteId={note.id}
            onReact={isOwn ? null : onReact}
            readOnly={isOwn}
          />

          <div className="flex items-center justify-between gap-2 mt-auto pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: isOwn ? 'oklch(0.60 0.26 280)' : 'oklch(0.64 0.19 150)' }}
                aria-hidden="true"
              >
                {authorInitial}
              </span>
              <span className="text-[11px] text-surface-400 dark:text-surface-500 truncate">
                {formatRelative(note.updated_at || note.created_at)}
              </span>
            </div>

            {isOwn && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {!note.archived && (
                  <button
                    onClick={() => onPin(note.id, note.pinned)}
                    aria-label={note.pinned ? 'Unpin' : 'Pin'}
                    className={`p-2.5 rounded-lg transition-colors ${
                      note.pinned
                        ? 'text-primary-500 dark:text-primary-400'
                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                    }`}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={note.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 2L8 6H4l4 4-2 8 6-4 6 4-2-8 4-4h-4z" />
                    </svg>
                  </button>
                )}

                {!note.archived && (
                  <button onClick={openEdit} aria-label="Edit" className="p-2.5 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => onArchive(note.id, note.archived)}
                  aria-label={note.archived ? 'Unarchive' : 'Archive'}
                  title={note.archived ? 'Unarchive' : 'Archive'}
                  className="p-2.5 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    {note.archived
                      ? <><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></>
                      : <><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12l2 2 4-4" /></>
                    }
                  </svg>
                </button>

                {confirming ? (
                  <div className="flex gap-1">
                    <button onClick={() => onDelete(note.id)} className="text-[10px] font-medium text-loss border border-loss/30 rounded-md px-2 py-0.5 hover:bg-loss-light dark:hover:bg-loss/10 transition-colors">Delete</button>
                    <button onClick={() => setConfirming(false)} className="text-[10px] text-surface-400 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-0.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirming(true)} aria-label="Delete" className="p-2.5 rounded-lg text-surface-500 dark:text-surface-400 hover:text-loss transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AddNoteForm({ onAdd }) {
  const [noteType, setNoteType] = useState('text')
  const [content, setContent] = useState('')
  const [items, setItems] = useState([{ id: 1, text: '', checked: false }])
  const [color, setColor] = useState('default')
  const [loading, setLoading] = useState(false)
  const isDark = useIsDark()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const finalContent = noteType === 'checklist'
      ? JSON.stringify(items.filter(i => i.text.trim()).map(i => ({ ...i, text: i.text.trim() })))
      : content.trim()
    if (!finalContent || finalContent === '[]') return
    setLoading(true)
    await onAdd({ content: finalContent, color, type: noteType })
    setLoading(false)
    setContent('')
    setItems([{ id: Date.now(), text: '', checked: false }])
    setColor('default')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="rounded-2xl ring-1 ring-black/[0.07] dark:ring-white/[0.12] p-4 transition-all duration-200"
        style={getNoteStyle(color, isDark)}
      >
        <div className="flex items-center justify-between mb-3">
          <TypeToggle value={noteType} onChange={setNoteType} />
        </div>

        {noteType === 'checklist' ? (
          <ChecklistEditor items={items} onChange={setItems} autoFocusFirst />
        ) : (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e) }}
            autoFocus
            placeholder="Add a note..."
            maxLength={500}
            rows={3}
            className="w-full text-sm text-surface-800 dark:text-surface-200 bg-transparent resize-none outline-none leading-relaxed placeholder-surface-300 dark:placeholder-surface-600"
          />
        )}

        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
          <ColorPicker selected={color} onChange={setColor} />
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: 'oklch(0.58 0.18 75)' }}
            className="px-4 py-1.5 text-xs font-semibold rounded-full text-white disabled:opacity-40 transition-opacity active:scale-[0.97] ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </form>
  )
}

export function Notes({ user }) {
  const { notes, loading, addNote, updateNote, deleteNote: deleteNoteRaw, togglePin, archiveNote, toggleReaction } = useNotes(user)
  const toast = useToast()
  const [userNames, setUserNames] = useState({})
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const isDark = useIsDark()

  const deleteNote = async (id) => {
    const noteToRestore = notes.find(n => n.id === id)
    await deleteNoteRaw(id)
    toast('Note deleted', {
      color: 'oklch(0.58 0.18 75)',
      action: {
        label: 'Undo',
        onClick: () => {
          if (noteToRestore) addNote({
            content: noteToRestore.content,
            color: noteToRestore.color || 'default',
            type: noteToRestore.type || 'text',
          })
        },
      },
    })
  }

  useEffect(() => {
    supabase.from('user_settings').select('user_id, display_name').then(({ data }) => {
      if (data) setUserNames(Object.fromEntries(data.map(d => [d.user_id, d.display_name || 'Unknown'])))
    })
  }, [])

  const handleAddNote = async (data) => {
    await addNote(data)
    setFormOpen(false)
  }

  const active = notes.filter(n => !n.archived)
  const archived = notes.filter(n => n.archived)
  const pinned = active.filter(n => n.pinned)
  const unpinned = active.filter(n => !n.pinned)

  const cardProps = {
    userId: user.id,
    userNames,
    isDark,
    onUpdate: updateNote,
    onDelete: deleteNote,
    onPin: togglePin,
    onArchive: archiveNote,
    onReact: toggleReaction,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'oklch(0.62 0.16 75)' }}>Notes</h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-surface-300 dark:text-surface-600">
            {active.length} {active.length === 1 ? 'note' : 'notes'}
          </span>
          <button
            onClick={() => setFormOpen(true)}
            style={{ backgroundColor: 'oklch(0.58 0.18 75)' }}
            className="group flex items-center gap-2 pl-4 pr-2 py-2 text-xs font-semibold rounded-full text-white transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.97]"
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

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-28 rounded-2xl bg-surface-100 dark:bg-surface-800" />
          ))}
        </div>
      ) : active.length === 0 && !loading ? (
        <div className="py-14 text-center">
          <p className="text-sm font-medium text-surface-400 dark:text-surface-500">Your shared space</p>
          <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">Anything worth remembering goes here</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'oklch(0.62 0.16 75)' }}>Pinned</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {pinned.map((n, i) => (
                  <div key={n.id} className="note-card-enter" style={{ animationDelay: `${Math.min(i, 5) * 55}ms` }}>
                    <NoteCard note={n} {...cardProps} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'oklch(0.62 0.14 75)' }}>Recent</p>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {unpinned.map((n, i) => (
                  <div key={n.id} className="note-card-enter" style={{ animationDelay: `${Math.min(i, 5) * 55}ms` }}>
                    <NoteCard note={n} {...cardProps} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-10 pt-4 border-t border-surface-100 dark:border-surface-800">
          <button
            onClick={() => setShowArchived(s => !s)}
            className="flex items-center gap-2 text-[11px] font-semibold text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform duration-200 ${showArchived ? 'rotate-90' : ''}`} aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {archived.length} archived
          </button>
          {showArchived && (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {archived.map((n, i) => (
                <div key={n.id} className="note-card-enter" style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}>
                  <NoteCard note={n} {...cardProps} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="New note">
          <div className="dialog-backdrop-enter absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setFormOpen(false)} aria-hidden="true" />
          <div className="dialog-panel-enter relative w-full max-w-sm bg-surface-50 dark:bg-surface-900 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] dark:ring-white/[0.12] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-100 dark:border-surface-800">
              <h2 className="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">New note</h2>
              <button
                onClick={() => setFormOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-full text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-5">
              <AddNoteForm onAdd={handleAddNote} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
