# spaceeeee — v1 Spec

## Overview

A personal web app named **spaceeeee** for two users (you + partner) to track investment portfolios and monthly expenses. Built with Vite + React + Supabase. Each user has their own account and private data, with a shared combined view for expenses.

**Language:** All UI copy, labels, and navigation are in English.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React |
| Styling | Tailwind CSS |
| Database + Auth | Supabase |
| Deployment | Vercel or Netlify |
| State management | React Context + custom hooks |

---

## Environment Variables

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Auth

- Supabase Auth — email/password
- Two users created manually via Supabase dashboard (no public signup)
- All data scoped by `user_id = auth.uid()`
- Protected routes — redirect to `/login` if not authenticated
- Session persisted via Supabase's built-in session handling
- Logout button in nav

---

## Folder Structure

```
src/
  components/
    portfolio/
      PortfolioDashboard.jsx
      HoldingForm.jsx
      HoldingCard.jsx
      PlatformSection.jsx
      AllocationChart.jsx
    expenses/
      ExpenseDashboard.jsx
      ExpenseForm.jsx
      ExpenseTimeline.jsx
      CombinedSummary.jsx
      charts/
        CategoryChart.jsx
        ComparisonChart.jsx
        MonthlyTrendChart.jsx
    shared/
      Navbar.jsx
      StatCard.jsx
      MonthPicker.jsx
      DarkModeToggle.jsx
  pages/
    Login.jsx
    Portfolio.jsx
    Expenses.jsx
    Combined.jsx
  lib/
    supabase.js
  hooks/
    useAuth.js
    usePortfolio.js
    useExpenses.js
  App.jsx
  main.jsx
```

---

## Database Schema

### Table: `portfolio_entries`

```sql
create table portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  asset_name text not null,
  asset_type text not null check (asset_type in (
    'reksa_dana', 'saham', 'emas', 'crypto', 'deposito', 'lainnya'
  )),
  quantity numeric not null default 0,
  avg_buy_price numeric not null default 0,
  current_price numeric not null default 0,
  currency text not null default 'IDR' check (currency in ('IDR', 'USD')),
  notes text,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

-- RLS
alter table portfolio_entries enable row level security;

create policy "Users can manage their own portfolio"
  on portfolio_entries
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

### Table: `expenses`

```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric not null,
  category text not null check (category in (
    'makan_minuman', 'transport', 'belanja', 'hiburan', 'tagihan', 'lainnya'
  )),
  custom_label text,
  description text,
  date date not null,
  created_at timestamptz default now()
);

-- RLS
alter table expenses enable row level security;

create policy "Users can manage their own expenses"
  on expenses
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Combined summary: both users can read all expenses (for the combined view)
create policy "Users can read all expenses for combined view"
  on expenses
  for select
  using (auth.uid() is not null);
```

> Note: The second policy on `expenses` allows both users to read each other's expense data for the combined summary. The first policy (for all) will conflict — split into separate INSERT/UPDATE/DELETE policies scoped to `user_id`, and a SELECT policy open to all authenticated users.

**Corrected expense policies:**

```sql
create policy "Users can insert their own expenses"
  on expenses for insert
  with check (user_id = auth.uid());

create policy "Users can update their own expenses"
  on expenses for update
  using (user_id = auth.uid());

create policy "Users can delete their own expenses"
  on expenses for delete
  using (user_id = auth.uid());

create policy "Authenticated users can read all expenses"
  on expenses for select
  using (auth.uid() is not null);
```

### Table: `user_settings`

```sql
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  usd_idr_rate numeric not null default 16000,
  display_name text,
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Users manage their own settings"
  on user_settings
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

---

## Module 1: Portfolio Tracker

### Overview

Each user tracks their own holdings across any platform. Values are stored as entered (IDR or USD). USD assets are converted to IDR using the user's manually-set exchange rate for all totals.

### Dashboard (`/portfolio`)

**Stat strip (top, inline):**
- Total net worth in IDR
- Total gain/loss in IDR (and %)
- Number of platforms tracked
- USD/IDR rate — click to edit inline, press Enter to save

**Asset allocation chart:**
- Donut chart broken down by `asset_type`
- Shows percentage and IDR value per type
- Compact, placed alongside or below stat strip

**Holdings cards (grouped by platform):**
- One collapsible section per unique platform
- Section header: platform name + total value IDR + holding count
- Each holding = card row: asset name, type pill, qty, current price, current value IDR, gain/loss badge (green/red)
- Tap/click card to expand: avg buy price, notes, last updated
- Edit and delete buttons in expanded state
- Add holding button per section + global add button

### Add/Edit Holding Form

Fields:
- Platform (free text, e.g. "Bibit", "Stockbit", "Pluang", "Pintu")
- Asset name (free text, e.g. "BBCA", "Bitcoin", "Reksa Dana Pasar Uang X")
- Asset type (dropdown: Reksa Dana, Saham, Emas, Crypto, Deposito, Lainnya)
- Quantity (number)
- Average buy price (number)
- Current price (number)
- Currency (IDR / USD toggle)
- Notes (optional textarea)

### Logic

```
current_value_idr =
  if currency === 'IDR': quantity * current_price
  if currency === 'USD': quantity * current_price * usd_idr_rate

cost_basis_idr =
  if currency === 'IDR': quantity * avg_buy_price
  if currency === 'USD': quantity * avg_buy_price * usd_idr_rate

gain_loss_idr = current_value_idr - cost_basis_idr
gain_loss_pct = (gain_loss_idr / cost_basis_idr) * 100

total_net_worth = sum of all current_value_idr
```

---

## Module 2: Expense Tracker

### My Expenses View (`/expenses`)

**Add expense form:**
- Amount (IDR, number input)
- Category (dropdown)
- Custom label (shown only if category = "Lainnya")
- Description (optional)
- Date (date picker, defaults to today)

**Category summary bar:**
- Horizontal mini bars showing relative spend per category this month
- Each bar: category name, subtotal amount, % of total
- Grand total at top

**Timeline list:**
- Chronological, newest first
- Each entry: date chip, category colored dot, description (or custom label), amount
- Edit and delete inline per entry

**Month navigation:**
- Month/year picker to browse past months
- Defaults to current month

### Combined Summary View (`/combined`)

Both users can see this. Shows data from both users merged.

**Month picker** — navigate by month.

**Compact stat strip (inline, top):**
- Combined total this month (IDR)
- Your share vs partner's share (amounts)
- vs last month (↑↓ % change)
- Biggest spending category

**Charts (in this order):**

1. **My spending vs partner's spending** — stacked bar chart per category. Color-coded by user. Uses `display_name` from `user_settings`. This is the hero chart — shown first.

2. **Category breakdown** — horizontal bar chart. Total per category (both users combined).

3. **Month-over-month trend** — line chart for last 6 months. Two lines: User 1 and User 2. Shows monthly totals.

**Expense categories (display labels):**

| Key | Label |
|---|---|
| `makan_minuman` | Food & Drinks |
| `transport` | Transport |
| `belanja` | Groceries & Household |
| `hiburan` | Entertainment & Subscriptions |
| `tagihan` | Bills & Utilities |
| `lainnya` | Others |

---

## UI / UX

### Theme
- Light mode default
- Dark mode toggle (persisted to `localStorage`)
- Clean and minimal — generous whitespace, simple typography
- No heavy animations

### Layout
- Top navigation bar: **spaceeeee** logo/wordmark, nav links (Portfolio, Expenses, Combined), dark mode toggle, logout
- Fully responsive — single column on mobile

### Color palette (suggestion)
- Primary: `#1a56db` (blue)
- Success/positive: `#0e9f6e` (green)
- Danger/negative: `#e02424` (red)
- Neutral: gray scale

### Chart library
- Use **Recharts** (already available in the Vite + React ecosystem, no extra CDN needed)

---

## Custom Hooks

### `useAuth.js`
```js
// Returns: { user, session, loading, signIn, signOut }
```

### `usePortfolio.js`
```js
// Returns: { holdings, settings, loading, addHolding, updateHolding,
//            deleteHolding, updateUsdRate, netWorth, gainLoss, allocationByType }
```

### `useExpenses.js`
```js
// Returns: { expenses, allExpenses, loading, addExpense, updateExpense,
//            deleteExpense, monthlyTotal, byCategory, monthOverMonth }
// allExpenses = both users (for combined view)
```

---

## Supabase Setup Checklist

1. Create project at [supabase.com](https://supabase.com)
2. Copy `Project URL` and `anon public` key → paste into `.env`
3. Go to **SQL Editor** → run all migration SQL above
4. Go to **Authentication → Users** → create 2 accounts manually (Invite user)
5. Each user should log in once and trigger creation of their `user_settings` row (handle via upsert on login)
6. Verify RLS is enabled on all 3 tables

---

## What to Tell Claude Code

Paste this at the start of your Claude Code session:

> "Build a personal finance web app called **spaceeeee** using Vite + React + Tailwind + Supabase. All UI copy must be in English. The spec is in `spec.md`. Follow the folder structure exactly. Start with: (1) Supabase client setup in `src/lib/supabase.js`, (2) Auth flow with protected routes, (3) Portfolio module, (4) Expense module, (5) Combined summary view. Use Recharts for all charts. All Supabase queries go inside custom hooks in `src/hooks/`. Do not hardcode user IDs anywhere."

---

## Out of Scope for v1

- Push notifications
- Export to CSV/PDF
- Budget limits / alerts
- Automatic price fetching
- More than 2 users
