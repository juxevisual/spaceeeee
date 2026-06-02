import { useState, useEffect } from 'react'
import { ASSET_QUANTITY_UNITS, getAllAssetTypes } from '../../lib/format'
import { useToast } from '../shared/Toast'
import { Dialog } from '../shared/Dialog'
import { Icon } from '../shared/Icon'
import { TypeCreator } from '../shared/TypeCreator'
import { NumberInput } from '../shared/NumberInput'
import { CurrencySelector } from '../shared/CurrencySelector'

const TYPE_THRESHOLD = 9
const TYPE_SHOW = 6

const QUANTITY_STEP = {
  reksa_dana: 'any',
  saham: 'any',
  emas: 'any',
  crypto: 'any',
  deposito: 'any',
  cash: 'any',
  lainnya: 'any',
}


const empty = {
  platform: '',
  asset_name: '',
  asset_type: 'reksa_dana',
  input_mode: 'value',
  quantity: '',
  avg_buy_price: '',
  current_price: '',
  cost_basis_value: '',
  current_value_input: '',
  currency: 'IDR',
  notes: '',
}

function buildFormState(initial) {
  if (!initial) return { ...empty }
  return {
    ...empty,
    ...initial,
    // Restore value-mode fields from the stored prices when editing
    cost_basis_value: initial.input_mode === 'value' ? String(initial.avg_buy_price ?? '') : '',
    current_value_input: initial.input_mode === 'value' ? String(initial.current_price ?? '') : '',
  }
}

export function HoldingForm({ initial, onSubmit, onClose, loading, customAssetTypes = [], onAddAssetType, exchangeRates = {}, onAddCurrencyRate }) {
  const toast = useToast()
  const [showAddType, setShowAddType] = useState(false)
  const [typeExpanded, setTypeExpanded] = useState(false)
  const allAssetTypes = getAllAssetTypes(customAssetTypes)
  const needsTypeCollapse = allAssetTypes.length > TYPE_THRESHOLD

  const [form, setForm] = useState(() => buildFormState(initial))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm(buildFormState(initial))
    setErrors({})
  }, [initial])

  // Auto-expand if the selected asset type is in the hidden section
  useEffect(() => {
    if (!needsTypeCollapse || typeExpanded) return
    const idx = allAssetTypes.findIndex(t => t.key === form.asset_type)
    if (idx >= TYPE_SHOW) setTypeExpanded(true)
  }, [form.asset_type, allAssetTypes.length, needsTypeCollapse, typeExpanded])

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const isValueMode = form.input_mode === 'value'
  const currLabel = form.currency === 'USD' ? 'USD' : 'IDR'

  const validate = () => {
    const e = {}
    if (!form.platform.trim()) e.platform = 'Required'
    if (!form.asset_name.trim()) e.asset_name = 'Required'
    if (isValueMode) {
      if (!form.cost_basis_value || Number(form.cost_basis_value) <= 0) e.cost_basis_value = 'Must be > 0'
      if (!form.current_value_input || Number(form.current_value_input) <= 0) e.current_value_input = 'Must be > 0'
    } else {
      if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Must be > 0'
      if (form.avg_buy_price === '' || Number(form.avg_buy_price) < 0) e.avg_buy_price = 'Required'
      if (form.current_price === '' || Number(form.current_price) < 0) e.current_price = 'Required'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    let payload
    if (isValueMode) {
      payload = {
        platform: form.platform, asset_name: form.asset_name,
        asset_type: form.asset_type, currency: form.currency, notes: form.notes,
        input_mode: 'value', quantity: 1,
        avg_buy_price: Number(form.cost_basis_value),
        current_price: Number(form.current_value_input),
      }
    } else {
      payload = {
        platform: form.platform, asset_name: form.asset_name,
        asset_type: form.asset_type, currency: form.currency, notes: form.notes,
        input_mode: 'units',
        quantity: Number(form.quantity),
        avg_buy_price: Number(form.avg_buy_price),
        current_price: Number(form.current_price),
      }
    }
    const { error } = await onSubmit(payload) || {}
    if (!error) toast(initial ? 'Holding updated' : 'Holding added')
  }

  const inputClass = (field) =>
    `w-full px-3 py-2 text-sm rounded-lg border bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-shadow [color-scheme:light] dark:[color-scheme:dark] ${
      errors[field]
        ? 'border-loss'
        : 'border-surface-200 dark:border-surface-700 focus:border-primary-400 dark:focus:border-primary-500'
    }`

  const titleId = 'holding-form-title'

  return (
    <Dialog
      titleId={titleId}
      onClose={onClose}
      className="w-full max-w-md bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-2xl flex flex-col max-h-[90dvh]"
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-surface-100 dark:border-surface-800">
        <h2 id={titleId} className="font-semibold text-surface-900 dark:text-surface-100 text-sm">
          {initial ? 'Edit holding' : 'Add holding'}
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

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5 overflow-y-auto flex-1 scrollbar-none">
        {/* Input mode toggle */}
        <div role="group" aria-label="Input method" className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={form.input_mode === 'units'}
            onClick={() => set('input_mode', 'units')}
            style={form.input_mode === 'units' ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
            className={`py-3 text-xs font-semibold rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
              form.input_mode === 'units'
                ? 'text-white shadow-[0_4px_16px_rgba(107,79,255,0.30)]'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            By units
          </button>
          <button
            type="button"
            aria-pressed={form.input_mode === 'value'}
            onClick={() => set('input_mode', 'value')}
            style={form.input_mode === 'value' ? { backgroundColor: 'oklch(0.60 0.26 280)' } : undefined}
            className={`py-3 text-xs font-semibold rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
              form.input_mode === 'value'
                ? 'text-white shadow-[0_4px_16px_rgba(107,79,255,0.30)]'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            By total value
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="hf-platform" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Platform</label>
            <input
              id="hf-platform"
              className={inputClass('platform')}
              placeholder="e.g. Bibit"
              value={form.platform}
              onChange={e => set('platform', e.target.value)}
            />
            {errors.platform && <p className="text-xs text-loss mt-1" role="alert">{errors.platform}</p>}
          </div>
          <div>
            <label htmlFor="hf-asset-name" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Asset name</label>
            <input
              id="hf-asset-name"
              className={inputClass('asset_name')}
              placeholder="e.g. BBCA"
              value={form.asset_name}
              onChange={e => set('asset_name', e.target.value)}
            />
            {errors.asset_name && <p className="text-xs text-loss mt-1" role="alert">{errors.asset_name}</p>}
          </div>
        </div>

        {/* Asset type visual picker */}
        <div>
          <label className="block text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-2">Asset type</label>
          <div role="group" aria-label="Asset type" className="grid grid-cols-3 gap-2">
            {(needsTypeCollapse && !typeExpanded
              ? allAssetTypes.slice(0, TYPE_SHOW)
              : allAssetTypes
            ).map(type => {
              const isSelected = form.asset_type === type.key
              return (
                <button
                  key={type.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => { set('asset_type', type.key); setShowAddType(false) }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isSelected
                      ? 'text-white shadow-[0_2px_12px_rgba(0,0,0,0.18)] scale-[1.02]'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                  style={isSelected ? { background: type.color } : {}}
                >
                  <Icon name={type.icon} size={17} strokeWidth={isSelected ? 2 : 1.75} />
                  <span className="text-[11px] font-semibold leading-none text-center">{type.label}</span>
                </button>
              )
            })}
            {/* "+ New" only visible when not collapsed */}
            {(!needsTypeCollapse || typeExpanded) && (
              <button
                type="button"
                onClick={() => setShowAddType(s => !s)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  showAddType
                    ? 'border-primary-400 text-primary-500 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-surface-300 dark:border-surface-600 text-surface-400 dark:text-surface-500 hover:border-primary-400 hover:text-primary-500'
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[11px] font-semibold leading-none">New</span>
              </button>
            )}
          </div>

          {/* Expand / collapse toggle */}
          {needsTypeCollapse && (
            <button
              type="button"
              onClick={() => { setTypeExpanded(e => !e); setShowAddType(false) }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
                className={`transition-transform duration-200 ${typeExpanded ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {typeExpanded ? 'Show less' : `${allAssetTypes.length - TYPE_SHOW} more`}
            </button>
          )}

          {/* Inline type creator */}
          <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showAddType ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <TypeCreator
                placeholder="e.g. Real Estate"
                onSave={async (type) => {
                  await onAddAssetType?.(type)
                  set('asset_type', type.key)
                  setShowAddType(false)
                  toast('Asset type added')
                }}
                onCancel={() => setShowAddType(false)}
              />
            </div>
          </div>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.07em] mb-2">Currency</label>
          <CurrencySelector
            value={form.currency}
            onChange={v => set('currency', v)}
            exchangeRates={exchangeRates}
            onAddRate={onAddCurrencyRate}
          />
        </div>

        {isValueMode ? (
          <div className="space-y-3">
            {form.asset_type === 'cash' ? (
              /* Cash: single amount field — current value = amount (cash doesn't gain/lose) */
              <div>
                <label htmlFor="hf-cost-basis" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
                  Amount <span className="font-normal text-surface-300 dark:text-surface-600">({currLabel})</span>
                </label>
                <NumberInput
                  id="hf-cost-basis"
                  allowDecimal
                  className={inputClass('cost_basis_value')}
                  placeholder="1.000.000"
                  value={form.cost_basis_value}
                  onChange={e => {
                    const v = e.target.value
                    setForm(f => ({ ...f, cost_basis_value: v, current_value_input: v }))
                    setErrors(err => ({ ...err, cost_basis_value: undefined, current_value_input: undefined }))
                  }}
                />
                {errors.cost_basis_value && <p className="text-xs text-loss mt-1" role="alert">{errors.cost_basis_value}</p>}
                <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-1.5">Cash value is always equal to amount — no gain or loss.</p>
              </div>
            ) : (
              /* All other assets: two fields */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="hf-cost-basis" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
                    Amount invested <span className="font-normal text-surface-300 dark:text-surface-600">({currLabel})</span>
                  </label>
                  <NumberInput
                    id="hf-cost-basis"
                    allowDecimal
                    className={inputClass('cost_basis_value')}
                    placeholder="0"
                    value={form.cost_basis_value}
                    onChange={e => {
                      const v = e.target.value
                      setForm(f => ({
                        ...f,
                        cost_basis_value: v,
                        current_value_input: (!f.current_value_input || f.current_value_input === f.cost_basis_value)
                          ? v
                          : f.current_value_input,
                      }))
                      setErrors(err => ({ ...err, cost_basis_value: undefined }))
                    }}
                  />
                  {errors.cost_basis_value && <p className="text-xs text-loss mt-1" role="alert">{errors.cost_basis_value}</p>}
                </div>
                <div>
                  <label htmlFor="hf-current-value" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
                    Current value <span className="font-normal text-surface-300 dark:text-surface-600">({currLabel})</span>
                  </label>
                  <NumberInput
                    id="hf-current-value"
                    allowDecimal
                    className={inputClass('current_value_input')}
                    placeholder="0"
                    value={form.current_value_input}
                    onChange={e => set('current_value_input', e.target.value)}
                  />
                  {errors.current_value_input && <p className="text-xs text-loss mt-1" role="alert">{errors.current_value_input}</p>}
                </div>
              </div>
            )}
            {form.asset_type !== 'cash' && form.cost_basis_value && form.current_value_input && (
              <div className="px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs text-surface-500 dark:text-surface-400">
                Gain/loss preview:{' '}
                <span className={Number(form.current_value_input) >= Number(form.cost_basis_value) ? 'text-gain font-medium' : 'text-loss font-medium'}>
                  {Number(form.current_value_input) >= Number(form.cost_basis_value) ? '+' : ''}
                  {(((Number(form.current_value_input) - Number(form.cost_basis_value)) / Number(form.cost_basis_value)) * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="hf-quantity" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
                Quantity <span className="font-normal text-surface-300 dark:text-surface-600">({ASSET_QUANTITY_UNITS[form.asset_type] || 'Unit'})</span>
              </label>
              <input
                id="hf-quantity"
                type="number" min="0"
                step={QUANTITY_STEP[form.asset_type] || 'any'}
                className={inputClass('quantity')}
                placeholder={['deposito', 'cash'].includes(form.asset_type) ? '1000000' : '0'}
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
              />
              {errors.quantity && <p className="text-xs text-loss mt-1" role="alert">{errors.quantity}</p>}
            </div>
            <div>
              <label htmlFor="hf-avg-buy" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Avg buy</label>
              <NumberInput
                id="hf-avg-buy"
                allowDecimal
                className={inputClass('avg_buy_price')}
                placeholder="0"
                value={form.avg_buy_price}
                onChange={e => set('avg_buy_price', e.target.value)}
              />
              {errors.avg_buy_price && <p className="text-xs text-loss mt-1" role="alert">{errors.avg_buy_price}</p>}
            </div>
            <div>
              <label htmlFor="hf-current-price" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Current price</label>
              <NumberInput
                id="hf-current-price"
                allowDecimal
                className={inputClass('current_price')}
                placeholder="0"
                value={form.current_price}
                onChange={e => set('current_price', e.target.value)}
              />
              {errors.current_price && <p className="text-xs text-loss mt-1" role="alert">{errors.current_price}</p>}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="hf-notes" className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
            Notes <span className="font-normal text-surface-300 dark:text-surface-600">(optional)</span>
          </label>
          <textarea
            id="hf-notes"
            rows={2}
            className={`${inputClass('notes')} resize-none`}
            placeholder="Any notes..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
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
            {loading ? 'Saving…' : initial ? 'Save changes' : 'Add holding'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

