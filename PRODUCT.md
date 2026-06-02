# spaceeeee — Product Context

## Product Purpose

A private personal finance web app for two users (you + partner) to track investment portfolios and monthly expenses. Each user has their own private data. A shared Together view merges both users' expense data for household visibility.

## Users

Two Indonesian young professionals in a relationship, tracking their own investment holdings and shared household expenses. Private app — no public access, no signup. Both users log in with email/password credentials created manually via Supabase.

## Register

product

## Brand

- Name: spaceeeee (five e's, intentionally playful)
- Tone: calm, clear, no-nonsense. This is a tool, not a product dashboard. Language is English throughout.
- Anti-references: SaaS hero-metric dashboards, crypto neon aesthetics, heavy animation sequences, marketing gradients, corporate fintech blue-and-white.

## Strategic Principles

1. Clarity over decoration. Users want to see numbers fast, not admire the interface.
2. Private by design. RLS enforced — no data leaks between users except the intentional shared views (combined expenses, family expenses).
3. Works on mobile. Both users check from their phones in the evening.
4. Honest data. No decorative numbers, no sparkles on values. If the portfolio is down, show red — clearly.

## Stack

- React 18 + React Router v6
- Webpack 5 + Babel (replaces Vite due to esbuild binary restrictions on dev machine)
- Tailwind CSS v3
- Supabase (Auth + Postgres + RLS)
- Recharts (charts)
- Outfit font (Google Fonts)
- No additional UI component library

## Modules

1. **Portfolio Tracker** (`/portfolio`) — holdings grouped by platform, performance chart, allocation donut, multi-currency support with auto exchange rates
2. **Expense Tracker** (`/expenses`) — personal and family expense tabs, timeline with category colors, category summary bars, month navigation
3. **Together View** (`/combined`) — both users' personal + family expenses merged, partner picker, comparison charts, 6-month trend

## Asset Types (built-in, English labels)

| Key | Label |
|---|---|
| `reksa_dana` | Mutual Fund |
| `saham` | Stocks |
| `emas` | Gold |
| `crypto` | Crypto |
| `deposito` | Deposit |
| `cash` | Cash |
| `lainnya` | Others |

Users can add custom asset types with custom labels, icons, and colors (stored in `user_settings`).

## Expense Categories (built-in, ordered by frequency)

| Key | Label |
|---|---|
| `makan_minuman` | Food & Drinks |
| `snack` | Snack & Treat |
| `transport` | Transport |
| `belanja` | Groceries |
| `household` | Household |
| `tagihan` | Bills & Utilities |
| `phone` | Phone |
| `subscription` | Subscription |
| `beauty` | Beauty |
| `health` | Health |
| `parking` | Parking |
| `hiburan` | Entertainment |
| `gift` | Gift |
| `education` | Education |
| `lainnya` | Others |

Users can add custom categories with custom labels, icons, and colors (stored in `user_settings`). Category picker collapses to 2 visible rows with "N more" expand if there are more than 9 total.

## Currency

Any ISO 4217 currency. Exchange rates auto-fetched daily from `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api` (free, no API key). Cached in `user_settings.exchange_rates`. All portfolio values converted to IDR for display.

## Theme

Light mode default. Dark mode toggle persisted to `localStorage`.

## Design Direction

- **Register:** product
- **Color strategy:** Restrained — one electric indigo accent (`oklch(0.60 0.26 280)`), semantic forest green (`oklch(0.64 0.19 150)`) for gains, electric red (`oklch(0.58 0.21 18)`) for losses. Near-achromatic surfaces with ghost indigo tint (`chroma 0.002–0.010`).
- **Scene:** Two partners glancing at their portfolio and last month's spending on a phone or laptop at home in the evening — calm, quick-check mode, wanting clarity in under 30 seconds.
- **Anchor references:** Linear (purposeful structure, tight spacing, zero decoration), Fathom Analytics (stat strips + data clarity), Vercel dashboard (monochrome with single accent).
- **Anti-references (design):** Coin market cap dashboards, Robinhood green/red heavy theming, generic SaaS white-with-blue-CTAs, glassmorphism wallpaper apps.
- **Typography:** Outfit font. Fixed rem scale. One family throughout. Net worth at `text-4xl font-bold tracking-[-0.03em]`. Section labels at `text-[11px] font-semibold uppercase tracking-[0.07em]`.
- **Motion:** Spring physics transitions `cubic-bezier(0.32,0.72,0,1)`. Scroll-reveal entry animations via IntersectionObserver. Number count-up on net worth load. Dialog entrance (slide-up fade). No decorative infinite loops.
- **Cards:** Double-bezel architecture (outer shell + inner core with inset highlight). Platform sections collapsible with CSS grid-rows animation.
- **Nav:** Floating glass-pill navbar, detached from viewport edge, `backdrop-blur-xl`.
- **Forms:** Dialog with focus trap + Escape key. Scrollable form body within fixed max height. Live thousand-separator on number inputs (dot separator, e.g., `1.250.000`).
- **Holdings:** Card-based grouped by platform. No data tables. Expand/collapse per card. Type badge uses asset type color as 10% background tint.
- **Expenses:** Timeline (chronological, newest first). Category label text takes the category color for instant scanability.
- **Together:** Green (gain color) as page identity accent — dividers, Together nav link active state, dual-avatar strip.
