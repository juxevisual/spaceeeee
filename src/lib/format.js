export function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompact(amount) {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}K`
  }
  return formatIDR(amount)
}

export function formatPct(pct) {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr.split('T')[0])
}

// Ordered by typical spending frequency (most → least)
export const CATEGORY_LABELS = {
  makan_minuman: 'Food & Drinks',
  snack:         'Snack & Treat',
  transport:     'Transport',
  belanja:       'Groceries',
  household:     'Household',
  tagihan:       'Bills & Utilities',
  phone:         'Phone',
  subscription:  'Subscription',
  beauty:        'Beauty',
  health:        'Health',
  parking:       'Parking',
  hiburan:       'Entertainment',
  gift:          'Gift',
  education:     'Education',
  lainnya:       'Others',
}

export const CATEGORY_COLORS = {
  makan_minuman: 'oklch(0.68 0.19 35)',   // orange
  snack:         'oklch(0.60 0.15 45)',   // warm brown
  transport:     'oklch(0.62 0.20 220)',   // blue
  belanja:       'oklch(0.64 0.19 150)',   // green
  household:     'oklch(0.66 0.16 62)',    // amber
  tagihan:       'oklch(0.60 0.26 280)',   // indigo
  phone:         'oklch(0.58 0.16 200)',   // teal
  subscription:  'oklch(0.56 0.18 255)',   // violet-blue
  beauty:        'oklch(0.62 0.18 320)',   // pink-violet
  health:        'oklch(0.58 0.20 160)',   // forest green
  parking:       'oklch(0.54 0.10 210)',   // slate
  hiburan:       'oklch(0.60 0.21 310)',   // violet
  gift:          'oklch(0.60 0.19 15)',    // red
  education:     'oklch(0.60 0.20 240)',   // deep blue
  lainnya:       'oklch(0.56 0.08 280)',   // muted indigo
}

export const ASSET_TYPE_LABELS = {
  reksa_dana: 'Mutual Fund',
  saham:      'Stocks',
  emas:       'Gold',
  crypto:     'Crypto',
  deposito:   'Deposit',
  cash:       'Cash',
  lainnya:    'Others',
}

export const ASSET_TYPE_ICONS = {
  reksa_dana: 'bar-chart',
  saham:      'trending-up',
  emas:       'diamond',
  crypto:     'hexagon',
  deposito:   'bank',
  cash:       'wallet',
  lainnya:    'layers',
}

export const ASSET_TYPE_COLORS_MAP = {
  reksa_dana: 'oklch(0.60 0.260 280)',
  saham:      'oklch(0.64 0.190 150)',
  emas:       'oklch(0.68 0.190 35)',
  crypto:     'oklch(0.60 0.210 310)',
  deposito:   'oklch(0.62 0.200 220)',
  cash:       'oklch(0.72 0.130 82)',
  lainnya:    'oklch(0.56 0.080 280)',
}

export const CATEGORY_ICONS = {
  makan_minuman: 'utensils',
  snack:         'coffee',
  transport:     'car',
  belanja:       'shopping-bag',
  household:     'home',
  tagihan:       'zap',
  phone:         'phone',
  subscription:  'wifi',
  beauty:        'scissors',
  health:        'pill',
  parking:       'parking',
  hiburan:       'film',
  gift:          'gift',
  education:     'book',
  lainnya:       'more',
}

export function getAllAssetTypes(custom = []) {
  const defaults = Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => ({
    key,
    label,
    icon: ASSET_TYPE_ICONS[key] || 'more',
    color: ASSET_TYPE_COLORS_MAP[key] || 'oklch(0.56 0.08 280)',
  }))
  return [...defaults, ...custom]
}

export function getAllCategories(custom = []) {
  const defaults = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    icon: CATEGORY_ICONS[key] || 'more',
    color: CATEGORY_COLORS[key] || 'oklch(0.56 0.08 280)',
  }))
  return [...defaults, ...custom]
}

export const ASSET_QUANTITY_UNITS = {
  reksa_dana: 'Unit',
  saham:      'Shares',
  emas:       'Gram',
  crypto:     'Coin',
  deposito:   'IDR',
  cash:       'IDR',
  lainnya:    'Unit',
}

export function formatQuantity(quantity, assetType) {
  const unit = ASSET_QUANTITY_UNITS[assetType] || 'Unit'
  const num = Number(quantity)
  // Show up to 8 decimal places for crypto, 4 for others, strip trailing zeros
  const decimals = assetType === 'crypto' ? 8 : assetType === 'emas' ? 4 : 2
  const formatted = num % 1 === 0
    ? num.toLocaleString('id-ID')
    : num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
  return `${formatted} ${unit}`
}

export const ASSET_TYPE_COLORS = [
  'oklch(0.60 0.260 280)',  // electric indigo
  'oklch(0.64 0.190 150)',  // electric green
  'oklch(0.68 0.190 35)',   // electric orange
  'oklch(0.60 0.210 310)',  // electric violet
  'oklch(0.62 0.200 220)',  // electric blue
  'oklch(0.72 0.130 82)',   // warm gold (cash)
  'oklch(0.56 0.080 280)',  // muted indigo
]
