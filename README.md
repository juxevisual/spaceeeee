# spaceeeee

A private personal finance web app for two users — track investment portfolios and monthly expenses together. Built with React, Webpack, Tailwind CSS, and Supabase.

## Features

**Portfolio tracker**
- Holdings grouped by platform with expandable double-bezel cards
- Two input modes: by units (qty × price) or by total value (invested + current)
- Multi-currency: any ISO 4217 currency with auto exchange rates (fetched daily, no API key needed)
- Asset types: Mutual Fund, Stocks, Gold, Crypto, Deposit, Cash, Others — plus custom types with custom icons and colors
- Net worth in IDR with gain/loss pill (green/red)
- Historical performance chart with period selector (1M, 3M, 6M, 1Y, All)
- Allocation donut chart by asset type
- Portfolio snapshots auto-recorded on every holding change (powers the performance chart)

**Expense tracker**
- Personal and Family expense types — separate tabs, shared in the Together view
- 15 built-in categories + custom categories with icons and colors
- Chronological timeline with category color coding
- Category summary bars with relative spend percentages
- Month navigation

**Together view**
- Partner picker — choose which partner to compare with
- Family expenses section (shared household costs visible to both users)
- Comparison bar chart: your spending vs partner's per category
- Category breakdown chart (combined total)
- 6-month trend line chart (you + partner as separate lines)

**General**
- Floating glass-pill navbar, dark/light mode toggle (localStorage)
- Scroll-reveal entry animations, spring physics transitions
- Fully responsive — single-column on mobile, 2-column on desktop for Portfolio
- Accessible: focus trap in dialogs, ARIA labels, screen-reader summaries on charts

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 |
| Bundler | Webpack 5 + Babel |
| Styling | Tailwind CSS v3 |
| Database + Auth | Supabase (Postgres + RLS) |
| Charts | Recharts |
| Font | Outfit (Google Fonts) |

> Webpack is used instead of Vite — esbuild's native binary may be blocked in certain Windows enterprise environments. Webpack is pure JS and has no native binary requirement.

---

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, and copy the **Project URL** and **anon public** key.

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run database migrations

Open the Supabase **SQL Editor** and run these in order:

```sql
-- portfolio_entries
create table portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  asset_name text not null,
  asset_type text not null,
  quantity numeric not null default 0,
  avg_buy_price numeric not null default 0,
  current_price numeric not null default 0,
  currency text not null default 'IDR',
  notes text,
  input_mode text not null default 'value' check (input_mode in ('units', 'value')),
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);
alter table portfolio_entries enable row level security;
create policy "portfolio_own" on portfolio_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric not null,
  category text not null,
  custom_label text,
  description text,
  date date not null,
  type text not null default 'personal' check (type in ('personal', 'family')),
  created_at timestamptz default now()
);
alter table expenses enable row level security;
create policy "expenses_insert" on expenses for insert with check (user_id = auth.uid());
create policy "expenses_update" on expenses for update
  using (user_id = auth.uid() or type = 'family');
create policy "expenses_delete" on expenses for delete
  using (user_id = auth.uid() or type = 'family');
create policy "expenses_select" on expenses for select using (auth.uid() is not null);

-- user_settings
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  usd_idr_rate numeric not null default 16000,
  display_name text,
  custom_asset_types jsonb not null default '[]'::jsonb,
  custom_expense_categories jsonb not null default '[]'::jsonb,
  exchange_rates jsonb not null default '{"USD": 16000}'::jsonb,
  rates_updated_at timestamptz,
  updated_at timestamptz default now()
);
alter table user_settings enable row level security;
create policy "settings_own" on user_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "settings_select_all" on user_settings for select
  using (auth.uid() is not null);

-- portfolio_snapshots (powers the performance chart)
create table portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  net_worth numeric not null,
  recorded_at timestamptz default now() not null
);
alter table portfolio_snapshots enable row level security;
create policy "snapshots_own" on portfolio_snapshots for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create index portfolio_snapshots_user_date
  on portfolio_snapshots(user_id, recorded_at desc);
```

### 4. Create user accounts

In Supabase: **Authentication → Users → Invite user**. Create exactly 2 accounts. No public signup is available by design.

### 5. Install and run

```bash
npm install --ignore-scripts
npm run dev
```

Open `http://localhost:5173`.

> `--ignore-scripts` skips the esbuild postinstall step. The app uses Webpack so esbuild is not needed at runtime.

---

## Scripts

```bash
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build → /dist
npm run preview  # serve the production build
```

---

## Architecture

- All Supabase queries are in `src/hooks/` — no raw queries in components
- No hardcoded user IDs — all data is scoped by `auth.uid()` via RLS
- Exchange rates fetched from `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api` (free, no key), cached 24h in `user_settings.exchange_rates`
- Portfolio net worth is snapshotted automatically on every holding change (add, edit, delete, rate change) — this powers the performance chart
- Family expenses use `type = 'family'` in the shared `expenses` table, readable by both authenticated users
- Custom asset types and expense categories are stored as JSON arrays in `user_settings` — no DB schema change required to add new ones
