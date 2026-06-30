function escapeCSV(val) {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function toRow(cells) {
  return cells.map(escapeCSV).join(',')
}

export function downloadExpenseReport({ expenses, catMap, title, fileName, userNames = null }) {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.created_at?.localeCompare(a.created_at ?? '') || 0)

  const headers = userNames
    ? ['Date', 'Person', 'Type', 'Category', 'Label', 'Notes', 'Amount (IDR)']
    : ['Date', 'Type', 'Category', 'Label', 'Notes', 'Amount (IDR)']

  const lines = [
    toRow([title]),
    toRow(['Total (IDR)', Math.round(total)]),
    '',
    toRow(headers),
    ...sorted.map(e => userNames
      ? toRow([e.date, userNames[e.user_id] || 'Unknown', e.type, catMap[e.category] || e.category, e.custom_label || '', e.description || '', Math.round(Number(e.amount))])
      : toRow([e.date, e.type, catMap[e.category] || e.category, e.custom_label || '', e.description || '', Math.round(Number(e.amount))])
    ),
  ]

  const csv = '﻿' + lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
