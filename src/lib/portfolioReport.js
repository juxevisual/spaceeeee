const TZ = 'Asia/Jakarta'

function escapeCSV(val) {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function toRow(cells) {
  return cells.map(escapeCSV).join(',')
}

export function downloadPortfolioReport({ holdings, netWorth, gainLoss, gainLossPct }) {
  const now = new Date()
  const dateLabel = now.toLocaleDateString('id-ID', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
  const fileName = `portfolio-${now.toISOString().split('T')[0]}.csv`

  const lines = []

  // Summary block
  lines.push(toRow(['Portfolio Report', dateLabel]))
  lines.push(toRow(['Net Worth (IDR)', Math.round(netWorth)]))
  lines.push(toRow(['Total Gain/Loss (IDR)', Math.round(gainLoss)]))
  lines.push(toRow(['Total Gain/Loss %', gainLossPct.toFixed(2) + '%']))
  lines.push('')

  // Holdings table
  lines.push(toRow([
    'Platform', 'Asset', 'Type', 'Currency',
    'Quantity', 'Avg Buy Price', 'Current Price',
    'Value (IDR)', 'Cost Basis (IDR)', 'Gain/Loss (IDR)', 'Gain/Loss %',
    'Last Updated',
  ]))

  for (const h of holdings) {
    lines.push(toRow([
      h.platform,
      h.asset_name,
      h.typeLabel || h.asset_type,
      h.currency,
      h.quantity,
      h.avg_buy_price,
      h.current_price,
      Math.round(h.currentValue),
      Math.round(h.costBasis),
      Math.round(h.gainLoss),
      h.gainLossPct.toFixed(2) + '%',
      new Date(h.last_updated).toLocaleDateString('id-ID', { timeZone: TZ }),
    ]))
  }

  const csv = '﻿' + lines.join('\n') // BOM for Excel UTF-8
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
