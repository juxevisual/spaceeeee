import { useRef } from 'react'

// Display: 1.000.000 (dot thousands, comma decimal for allowDecimal)
// Stored: raw digits string e.g. "1000000" or "1000000.5"

function toDisplay(raw, allowDecimal) {
  if (raw === '' || raw === null || raw === undefined) return ''
  const str = String(raw)

  if (allowDecimal && str.includes('.')) {
    const [int, dec] = str.split('.')
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec
  }

  return str.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function fromDisplay(display, allowDecimal) {
  if (!display) return ''
  if (allowDecimal) {
    // dots = thousands separator, comma = decimal point
    return display.replace(/\./g, '').replace(',', '.')
  }
  return display.replace(/\./g, '').replace(/[^0-9]/g, '')
}

/**
 * Number input with live dot-separated thousand formatting.
 * Stored value is always a raw number string (no formatting).
 * Emits onChange compatible with standard e => set(key, e.target.value).
 */
export function NumberInput({
  value,
  onChange,
  allowDecimal = false,
  className,
  placeholder,
  id,
  disabled,
  autoFocus,
  'aria-label': ariaLabel,
}) {
  const ref = useRef(null)

  const handleChange = (e) => {
    const el = e.target
    const cursorBefore = el.selectionStart
    const typed = el.value

    // Count how many digit characters were before the cursor
    const digitsBeforeCursor = typed.slice(0, cursorBefore).replace(/[^0-9]/g, '').length

    // Convert display → raw → back to display
    const raw = fromDisplay(typed, allowDecimal)
    const formatted = toDisplay(raw, allowDecimal)

    // Tell parent the raw value
    onChange({ target: { value: raw } })

    // Restore cursor after React re-renders the formatted value
    requestAnimationFrame(() => {
      if (!ref.current) return
      let pos = 0
      let digits = 0
      for (let i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted[i])) {
          digits++
          if (digits === digitsBeforeCursor) { pos = i + 1; break }
        }
      }
      if (digitsBeforeCursor === 0) pos = 0
      else if (digits < digitsBeforeCursor) pos = formatted.length
      ref.current.setSelectionRange(pos, pos)
    })
  }

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={toDisplay(value, allowDecimal)}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
    />
  )
}
