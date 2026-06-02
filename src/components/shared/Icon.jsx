import { ICON_LIBRARY } from '../../lib/icons'

export function Icon({ name, size = 16, strokeWidth = 1.75, className = '' }) {
  const icon = ICON_LIBRARY.find(i => i.name === name)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon
        ? icon.paths.map((d, i) => <path key={i} d={d} />)
        : <circle cx="12" cy="12" r="9" />
      }
    </svg>
  )
}
