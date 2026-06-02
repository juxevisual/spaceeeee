// Icon library — each entry has name, label, and an array of SVG path `d` attributes.
// All icons render at viewBox="0 0 24 24", strokeLinecap="round", strokeLinejoin="round"

export const ICON_LIBRARY = [
  // Finance & assets
  { name: 'trending-up',  label: 'Growth',       paths: ['M3 17l6-6 4 4 8-8', 'M16 7h5v5'] },
  { name: 'bar-chart',    label: 'Stocks',        paths: ['M12 20V10', 'M18 20V4', 'M6 20v-6'] },
  { name: 'diamond',      label: 'Gold',          paths: ['M12 2l10 10-10 10L2 12z', 'M2 12h20', 'M12 2v20'] },
  { name: 'hexagon',      label: 'Crypto',        paths: ['M12 2L20.66 7v10L12 22 3.34 17V7z', 'M12 8v4', 'M12 16h.01'] },
  { name: 'bank',         label: 'Deposit',       paths: ['M3 21h18', 'M3 10h18', 'M5 6l7-3 7 3', 'M4 10v11', 'M12 10v11', 'M20 10v11'] },
  { name: 'layers',       label: 'Other',         paths: ['M12 2 2 7l10 5 10-5-10-5', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'] },
  { name: 'wallet',       label: 'Wallet',        paths: ['M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z', 'M3 10h18', 'M15 15h3'] },
  { name: 'piggy-bank',   label: 'Savings',       paths: ['M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 4.6 5 7.3 10 5.8L17 20h2v-3h1a3 3 0 0 0 0-6h-.17A5.5 5.5 0 0 0 19 5z', 'M2 10h2', 'M6 18h4'] },
  { name: 'house',        label: 'Property',      paths: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'] },
  { name: 'globe',        label: 'Global',        paths: ['M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'] },
  { name: 'briefcase',    label: 'Business',      paths: ['M4 7h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z', 'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M12 12v4', 'M8 14h8'] },
  { name: 'shield',       label: 'Protection',    paths: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'] },
  { name: 'leaf',         label: 'Green',         paths: ['M17 8C8 10 5.9 16.17 3.82 19.94L5.71 21l1-1.06A14 14 0 0 0 14 22c5.5 0 9.83-4.5 10-10.04-.01-1.28-.22-2.5-.63-3.63C21.64 6.59 19.5 5 17 5', 'M2 22s2-8 8-12'] },
  // Expenses & lifestyle
  { name: 'utensils',     label: 'Food',          paths: ['M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2', 'M7 2v20', 'M21 15V2l-6 9v4a3 3 0 0 0 6 0z'] },
  { name: 'car',          label: 'Transport',     paths: ['M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.5L8 4h8l1.5 3H21a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2', 'M7 17h10', 'M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z', 'M13 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z'] },
  { name: 'shopping-bag', label: 'Shopping',      paths: ['M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'] },
  { name: 'film',         label: 'Media',         paths: ['M2 3h20v18H2z', 'M7 3v18', 'M17 3v18', 'M3 9h4', 'M17 9h4', 'M3 15h4', 'M17 15h4'] },
  { name: 'zap',          label: 'Utilities',     paths: ['M13 2 3 14h9l-1 8 10-12h-9z'] },
  { name: 'gift',         label: 'Gifts',         paths: ['M20 12v10H4V12', 'M22 7H2v5h20V7z', 'M12 22V7', 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z', 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'] },
  { name: 'heart',        label: 'Health',        paths: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'] },
  { name: 'book',         label: 'Education',     paths: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'] },
  { name: 'plane',        label: 'Travel',        paths: ['M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'] },
  { name: 'phone',        label: 'Phone',         paths: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'] },
  { name: 'coffee',       label: 'Coffee',        paths: ['M18 8h1a4 4 0 0 1 0 8h-1', 'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z', 'M6 1v3', 'M10 1v3', 'M14 1v3'] },
  { name: 'music',        label: 'Music',         paths: ['M9 18V5l12-2v13', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'] },
  { name: 'dumbbell',     label: 'Fitness',       paths: ['M6.5 6.5h11', 'M6.5 17.5h11', 'M6 7v10', 'M18 7v10', 'M2 9h4v6H2z', 'M18 9h4v6h-4z'] },
  { name: 'sun',          label: 'Outdoor',       paths: ['M12 17A5 5 0 1 0 12 7a5 5 0 0 0 0 10z', 'M12 1v2', 'M12 21v2', 'M4.22 4.22l1.42 1.42', 'M18.36 18.36l1.42 1.42', 'M1 12h2', 'M21 12h2', 'M4.22 19.78l1.42-1.42', 'M18.36 5.64l1.42-1.42'] },
  { name: 'star',         label: 'Favorite',      paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'] },
  { name: 'tag',          label: 'Custom',        paths: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'] },
  { name: 'more',         label: 'Other',         paths: ['M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'] },
]

export const TYPE_COLORS = [
  'oklch(0.60 0.26 280)',
  'oklch(0.64 0.19 150)',
  'oklch(0.68 0.19 35)',
  'oklch(0.60 0.21 310)',
  'oklch(0.62 0.20 220)',
  'oklch(0.58 0.21 18)',
  'oklch(0.72 0.18 80)',
  'oklch(0.60 0.18 185)',
]
