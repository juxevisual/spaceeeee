import { useState } from 'react'
import { Icon } from './Icon'
import { ICON_LIBRARY, TYPE_COLORS } from '../../lib/icons'

export function TypeCreator({ placeholder = 'e.g. Cryptocurrency', onSave, onCancel }) {
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('tag')
  const [color, setColor] = useState(TYPE_COLORS[0])

  const handleSave = () => {
    if (!label.trim()) return
    const key = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 24)
    onSave({ key, label: label.trim(), icon, color })
  }

  return (
    <div className="space-y-3 p-3 rounded-2xl bg-surface-100 dark:bg-surface-800 ring-1 ring-black/[0.04] dark:ring-white/[0.12]">

      {/* Label input */}
      <input
        autoFocus
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel() }}
        placeholder={placeholder}
        maxLength={32}
        className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 [color-scheme:light] dark:[color-scheme:dark]"
      />

      {/* Preview */}
      {label && (
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color }}>
            <Icon name={icon} size={14} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">{label}</span>
        </div>
      )}

      {/* Color swatches */}
      <div>
        <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-2">Color</p>
        <div className="flex gap-2 flex-wrap">
          {TYPE_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                color === c
                  ? 'scale-125 ring-2 ring-offset-2 ring-offset-surface-100 dark:ring-offset-surface-800'
                  : 'hover:scale-110'
              }`}
              style={{ background: c, '--tw-ring-color': c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Icon picker */}
      <div>
        <p className="text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-2">Icon</p>
        <div className="grid grid-cols-7 gap-1 max-h-[108px] overflow-y-auto scrollbar-none">
          {ICON_LIBRARY.map(({ name }) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon(name)}
              className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                icon === name
                  ? 'scale-[1.1] shadow-[0_2px_8px_rgba(107,79,255,0.4)]'
                  : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
              style={icon === name ? { background: color, color: 'white' } : {}}
              aria-pressed={icon === name}
              aria-label={name}
            >
              <Icon name={name} size={14} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 text-xs font-semibold rounded-full border border-surface-200 dark:border-surface-700 text-surface-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!label.trim()}
          className="flex-1 py-1.5 text-xs font-semibold rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
        >
          Save
        </button>
      </div>
    </div>
  )
}

