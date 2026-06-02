# spaceeeee — Product Context

## Product Purpose

Personal finance web app for two users (you + partner) to track investment portfolios and monthly expenses. Each user has their own private data. A shared combined view merges both users' expense data.

## Users

Two Indonesian young professionals in a relationship, tracking their own holdings and shared household expenses. Private app — no public access, no signup. Both users log in with email/password credentials created manually via Supabase.

## Register

product

## Brand

- Name: spaceeeee
- Tone: calm, clear, no-nonsense. This is a tool, not a product dashboard. Language is English throughout.
- Anti-references: SaaS hero-metric dashboards, crypto neon aesthetics, heavy animation, marketing gradients.

## Strategic Principles

1. Clarity over decoration. Users want to see numbers fast, not admire the interface.
2. Private by design. RLS enforced — no data leaks between users except the intentional combined expense view.
3. Works on mobile. Both users may check from their phones.

## Stack

- Vite + React
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Recharts
- React Context + custom hooks
- Vercel or Netlify deployment

## Modules

1. **Portfolio Tracker** (`/portfolio`) — holdings table, donut chart by asset type, platform summary cards, USD/IDR rate input
2. **Expense Tracker** (`/expenses`) — monthly expense list grouped by category, add/edit/delete, month navigation
3. **Combined View** (`/combined`) — both users' expenses merged, stat cards, category chart, comparison chart, MoM trend

## Asset Types

reksa_dana, saham, emas, crypto, deposito, lainnya

## Expense Categories

makan_minuman → Food & Drinks, transport → Transport, belanja → Groceries & Household, hiburan → Entertainment & Subscriptions, tagihan → Bills & Utilities, lainnya → Others

## Theme

Light mode default. Dark mode toggle persisted to localStorage.

## Design Direction

- **Register:** product
- **Color strategy:** Restrained — one steel-indigo accent (oklch(0.52 0.17 272)), semantic green (oklch(0.62 0.14 155)) for gains, muted crimson (oklch(0.53 0.18 20)) for losses. Neutral surfaces tinted toward indigo at chroma 0.007.
- **Scene:** Two partners reviewing their investments and shared expenses on a laptop at home after dinner — calm, analytical, wanting clarity.
- **Anchor references:** Linear (purposeful structure, tight spacing), Fathom Analytics (stat strips + data clarity), Wise (tinted neutrals, zero decoration)
- **Typography:** Inter or system-ui. Fixed rem scale (1.125 ratio). One family throughout.
- **Holdings:** Card-based grouped by platform. No tables.
- **Expenses:** Timeline list (chronological) + category summary bar.
- **Combined:** Comparison chart leads, then category, then trend. Stat strip inline at top.
- **USD rate:** Inline editable in portfolio stat strip, not a separate component.
