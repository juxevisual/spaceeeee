# spaceeeee — Spec (current build)

## Overview

A private personal finance web app for two users (you + partner) to track investment portfolios and monthly expenses. Built with Webpack + React + Supabase. Each user has their own private data, with a shared Together view for combined expenses and partner comparison.

**Language:** All UI copy, labels, and navigation in English.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + React Router v6 |
| Bundler | Webpack 5 + Babel |
| Styling | Tailwind CSS v3 (class dark mode) |
| Font | Outfit (Google Fonts) |
| Database + Auth | Supabase (Postgres + RLS) |
| Charts | Recharts |
| Deployment | Vercel or Netlify |
| State | React Context + custom hooks |

> Vite was replaced by Webpack because the esbuild native binary was blocked by Windows group policy on the dev machine. All config is in `webpack.config.cjs`.

---

## Environment Variables

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

The `VITE_` prefix is retained for compatibility; `webpack.config.cjs` reads these and exposes them via `DefinePlugin`.

---

## Auth

- Supabase Auth — email/password only
- Two users created manually via Supabase dashboard (no public signup)
- All data scoped by `user_id = auth.uid()` via RLS
- Protected routes — redirect to `/login` if unauthenticated
- Session persisted via Supabase's built-in session handling
- Logout button in nav

---

## Folder Structure

```
src/
  components/
    portfolio/
      AllocationChart.jsx
      HoldingCard.jsx
      HoldingForm.jsx
      HoldingsControls.jsx       (search + sort + filter bar for holdings)
      DeadWeightFlag             (inline in HoldingCard + PortfolioDashboard strip)
      PlatformSection.jsx
      PortfolioChart.jsx         (performance area chart)
      PortfolioDashboard.jsx
    expenses/
      CombinedSummary.jsx
      ExpenseDashboard.jsx
      ExpenseForm.jsx
      ExpenseTimeline.jsx
      FamilyTimeline.jsx
      MonthReview.jsx            (bottom-sheet month summary for past months)
      SpendingPace.jsx           (current-month pace + vs-last-month delta)
      charts/
        CategoryChart.jsx
        ComparisonChart.jsx
        MonthlyTrendChart.jsx
    shared/
      CurrencySelector.jsx       (searchable ISO 4217 dropdown)
      DarkModeToggle.jsx
      Dialog.jsx                 (focus-trapped modal)
      Icon.jsx
      MonthPicker.jsx
      Navbar.jsx                 (floating glass pill)
      NumberInput.jsx            (live dot-separated thousand formatting)
      StatCard.jsx
      Toast.jsx
      TypeCreator.jsx            (inline custom type/category creator)
  pages/
    Combined.jsx
    Expenses.jsx
    Login.jsx
    Portfolio.jsx
  lib/
    currencies.js                (ISO 4217 list, 36 currencies)
    exchangeRates.js             (free API fetch utilities)
    format.js                    (formatIDR, formatCompact, labels, colors)
    icons.js                     (28 SVG icon definitions)
    supabase.js
  hooks/
    useAuth.js
    useChartColors.js            (dark-mode aware chart tick colors)
    useCountUp.js                (animated number counter)
    useExpenses.js
    useCategoryVelocity.js       (last-month per-category spend for velocity arrows)
    usePace.js                   (last-month partial spend for SpendingPace)
    usePortfolio.js
    useScrollReveal.js           (IntersectionObserver reveal)
  App.jsx
  index.css
  main.jsx
```

---

## Database Schema

### `portfolio_entries`

```sql
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

create policy "portfolio_own"
  on portfolio_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

Notes:
- `currency` accepts any ISO 4217 code (no CHECK constraint). Conversion to IDR uses `user_settings.exchange_rates`.
- `asset_type` accepts any string (no CHECK constraint). Built-in values: `reksa_dana`, `saham`, `emas`, `crypto`, `deposito`, `cash`, `lainnya`. Custom types stored in `user_settings.custom_asset_types` extend the picker UI only.
- `input_mode = 'units'`: `current_value = quantity × current_price × rate`; `input_mode = 'value'`: `quantity = 1`, `avg_buy_price = total invested`, `current_price = current total value`.

### `expenses`

```sql
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
```

Notes:
- `type = 'family'`: visible to both users in the Family tab and Together view. Both users can edit/delete family expenses (RLS allows it).
- `type = 'personal'`: private to the creating user.
- `category`: no CHECK constraint — supports 15 built-in categories plus user-added custom categories (stored in `user_settings.custom_expense_categories`).

### `user_settings`

```sql
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
```

JSON shapes:
```json
// custom_asset_types
[{ "key": "custom_real_estate", "label": "Real Estate", "icon": "home", "color": "oklch(0.60 0.18 185)" }]

// custom_expense_categories
[{ "key": "custom_pet", "label": "Pet Care", "icon": "heart", "color": "oklch(0.62 0.18 320)" }]

// exchange_rates
{ "USD": 16250, "JPY": 108, "EUR": 17800, "last_updated": "2026-06-03" }
```

### `portfolio_snapshots`

```sql
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

A snapshot is inserted whenever: (a) a holding is added, edited, or deleted; (b) an exchange rate is changed; (c) first load and no snapshots exist yet (backfill). Powers the Performance chart.

---

## Module 1: Portfolio Tracker (`/portfolio`)

### Layout

Desktop: 2-column. Left sidebar (300px): net worth panel + Performance/Allocation tabbed chart. Right: holdings grouped by platform.

Mobile: single column, left sidebar stacks above holdings.

### Net worth panel

- Large `text-4xl` net worth number (counts up from 0 on load)
- Gain/loss colored pill (green/red) below the number
- Platform count + holdings count
- Exchange rates section (non-IDR currencies in use + last-updated timestamp + refresh button)

### Performance / Allocation tabs

**Performance tab:**
- Recharts AreaChart, monotone curve
- Period selector: 1M / 3M / 6M / 1Y / All
- Line + fill color: green if net worth is up vs period start, red if down
- Change percentage for the selected period
- Empty state when no snapshots for selected period

**Allocation tab:**
- Recharts PieChart (donut) by asset type
- Legend with percentage per type
- Hidden when no holdings

### Holdings (right column)

**Dead weight strip** (above HoldingsControls, only when stale holdings exist):
- A single quiet line: "N holdings unchanged for 90+ days"
- Condition: `|gainLossPct| < 2%` AND `last_updated` is 90+ days ago AND `gainLossPct` is finite
- Purely informational — no action, no color alarm, surface-400 text

**Dead weight card indicator** (inline on HoldingCard):
- When a holding meets the stale condition, the metadata line appends `· flat` in surface-300
- Hidden when private mode (hideValues) is active

**HoldingsControls bar** (above holdings list):
- Search input (filters by asset name, platform, or type)
- Sort dropdown: Value high→low, Value low→high, Gain best→worst, Gain worst→best, Name A→Z, Recently updated
- Filter panel (collapsible): filter by asset type, platform, currency — shown as pill toggles; only shown when >1 unique value exists for that dimension
- Active filter chips with individual remove + "Clear all"
- Result count shown when search/filters are active

**Holdings list:**
- Grouped by platform — each platform in a double-bezel collapsible section
- Platform header: colored initial badge, platform name, holding count, total IDR value
- Each holding: double-bezel card, expandable
  - Collapsed: asset name + type badge (type-colored tint) + currency badge + quantity/price metadata + updated time + current value + gain/loss pill
  - Expanded: avg buy price, gain/loss IDR, notes, last updated, edit/delete buttons

### Add/Edit Holding Form

Fields:
- Input mode toggle: **By units** / **By total value**
- Platform (free text)
- Asset name (free text)
- Asset type — visual icon grid (3 cols), collapses to 2 rows if > 9 items, "+ New" expands TypeCreator
- Currency — `CurrencySelector` (searchable dropdown, 36 currencies, auto-fetches rate on new currency selection)
- If by units: Quantity + Avg buy price + Current price (live dot-separator formatting)
- If by total value: Amount invested + Current value (auto-fills current from invested for cash; auto-fills current from invested for all types until manually changed)
- Notes (optional)

### Exchange rates

- Source: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json` (free, no key, daily updates)
- Fallback: `https://latest.currency-api.pages.dev/v1/currencies/idr.json`
- Auto-fetched on Portfolio page load if rates are older than 24h
- Cached in `user_settings.exchange_rates`
- Manual refresh button in the rates panel
- On selecting a new currency in HoldingForm, its rate is fetched immediately

### Calculation

```
rate = currency === 'IDR' ? 1 : exchange_rates[currency]
current_value_idr = quantity × current_price × rate
cost_basis_idr    = quantity × avg_buy_price × rate
gain_loss_idr     = current_value_idr − cost_basis_idr
gain_loss_pct     = (gain_loss_idr / cost_basis_idr) × 100
net_worth         = sum(all current_value_idr)
```

For `input_mode = 'value'`: quantity is stored as 1, avg_buy_price = total invested, current_price = current total value. The calculation above still holds.

---

## Module 2: Expense Tracker (`/expenses`)

### Header

- Month picker (left); when viewing a past month with any expenses, a **"Review"** button appears inline → opens MonthReview sheet
- Tab switcher: **Personal** / **Family** + Add button (right)
- Tab active states use inline `style` for color (Tailwind purge limitation)

### Category velocity

Shown only on the Personal tab for the current month, as `↑` / `↓` glyphs next to each category label in the summary bars.

- Fetched by `useCategoryVelocity` — same day-clamped range logic as `usePace`, but returns a `{ [category]: amount }` map for the previous month
- `↑` (loss-color) = spending >10% faster than last month at this point
- `↓` (gain-color) = spending >10% slower
- No glyph = within ±10% (flat)
- Hidden when tab is Family or viewing a past month

### SpendingPace

Shown only on the current month, between the stat strip and timeline:
- **"vs last month"** — compares current spend-to-date against the same day range in the previous month (day-clamped for short months). Shows delta in IDR + percentage, red if higher, green if lower.
- **"on pace for"** — daily average × days in month = projected end-of-month total.
- Hidden when no spending yet. Fetched via `usePace` hook.

### MonthReview (bottom sheet)

Slide-up sheet (spring animation, Escape to dismiss, backdrop click to dismiss) for past months. Triggered by the "Review" button in the header. Contains:
- **Total spent** — large display number; delta vs previous month in IDR + percentage (green/red)
- Entry count + active days count
- **Top 3 categories** — horizontal bars with color dots, %, IDR amount
- **Highlights** — biggest spending day (date + amount), biggest single expense (description/category + amount), personal vs family split (when both > 0)

### Personal tab

- Category summary bars: horizontal bars, category color, label, %, subtotal
- Timeline: chronological newest-first; each entry has category dot, category label (category-colored text), description, amount; hover shows edit/delete icon buttons (always visible on mobile)
- Empty state with CTA

### Family tab

- All family expenses from both users, with "by [name]" attribution
- Same timeline design
- Both users can edit/delete any family expense

### Add/Edit Expense Form

Fields:
- Type toggle: **Personal** / **Family** (locked when editing)
- Amount (IDR, live dot-separator)
- Category — visual icon grid (3 cols), collapses to 2 rows if > 9 items (15 default categories → shows 6 collapsed, "9 more" expands); auto-expands if selected category is in hidden rows
- Date
- Custom label (shown only for "Others" category)
- Description (optional)

### Built-in expense categories (ordered by frequency)

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

---

## Module 3: Together View (`/combined`)

### Header

- "Together" indicator strip (dual-avatar dots + "[User] & [Partner]" when partner selected)
- Month picker + Partner picker

### Partner picker

Fetches all `user_settings` rows. Auto-selects if only one other user. Dropdown if multiple.

### Stat strip

4 stats: Personal total | Your personal | Partner's personal | Family

### Content

1. Family expenses compact card (if any this month)
2. Comparison bar chart — hero, `featured` prop gives extra bottom padding
3. Category breakdown horizontal bar chart + legend
4. 6-month trend line chart

All chart axes use `useChartColors()` hook which switches tick/cursor colors based on dark mode.

---

## Custom Hooks

### `useAuth.js`
```js
// { user, session, loading, signIn, signOut }
```

### `usePortfolio.js`
```js
// {
//   holdings,           // holdingsWithCalc (includes currentValue, gainLoss, etc.)
//   settings,
//   loading, error,
//   addHolding, updateHolding, deleteHolding,
//   updateUsdRate,      // legacy alias for addCurrencyRate('USD', rate)
//   addCurrencyRate,    // (code, rate) → saves to exchange_rates
//   refreshRates,       // force-fetch all rates from API
//   refreshingRates,
//   exchangeRates,      // { USD: 16250, JPY: 108, ... }
//   ratesUpdatedAt,
//   addAssetType,       // saves to custom_asset_types in user_settings
//   customAssetTypes,
//   netWorth, gainLoss, gainLossPct, allocationByType,
//   userId,
//   refetch
// }
```

### `useExpenses.js`
```js
// {
//   expenses,         // current user's personal expenses for the month
//   allExpenses,      // all expenses (both users, both types)
//   familyExpenses,   // allExpenses filtered to type='family'
//   familyTotal,
//   loading, error,
//   addExpense, updateExpense, deleteExpense,
//   monthlyTotal,     // sum of personal expenses
//   byCategory,       // { category_key: total }
//   monthOverMonth,   // async fn returning 6-month data in single query
//   refetch
// }
```

### `useCategoryVelocity.js`
```js
// useCategoryVelocity(user, month, year)
// → { lastMonthByCategory, loading }
//
// Only active on the current month. Fetches personal expenses from the previous
// month up to the same day as today (day-clamped). Returns { [category]: total }
// for the previous month's same-day range. Used by CategorySummaryBar to render
// velocity arrows (↑/↓) per category.
```

### `usePace.js`
```js
// usePace(user, month, year, type = 'personal')
// → { lastMonthPartial, loading }
//
// Only active when viewing the current month.
// Fetches sum of expenses from the previous month up to the same day as today
// (day-clamped to handle short months, e.g. March 31 → Feb 28).
// Used by SpendingPace to compute the "vs last month" delta.
```

---

## Design System

### Colors (tailwind.config.js)

```
primary: electric indigo    oklch(0.60 0.26 280)  — buttons, active states, focus rings
gain:    forest green       oklch(0.64 0.19 150)  — portfolio gains, Together accents
loss:    electric red       oklch(0.58 0.21 18)   — losses
surface: near-achromatic    oklch(0.985–0.070 0.002–0.010 280)  — ghost indigo tint
```

### Typography

- Font: Outfit (300–800 weights)
- `font-optical-sizing: auto`, `text-rendering: optimizeLegibility`
- Net worth display: `text-4xl font-bold tracking-[-0.03em]`
- Section labels: `text-[11px] font-semibold uppercase tracking-[0.07em]`
- Body/labels: `text-xs font-medium` or `text-sm font-semibold`

### Components

- **Dialog**: focus trap, Escape to close, spring entrance animation (`cubic-bezier(0.32,0.72,0,1)`)
- **NumberInput**: type="text" with live dot-separated thousand formatting, cursor preservation
- **CurrencySelector**: searchable dropdown, shows current rate next to each currency
- **TypeCreator**: inline creator for custom asset types and expense categories (label + icon picker + 8 color swatches)
- **Toast**: 2.5s auto-dismiss, spring fade-in from bottom
- **Icon**: renders from 28-icon library (thin SVG paths)

---

## Supabase Setup Checklist

1. Create project at [supabase.com](https://supabase.com)
2. Copy Project URL + anon key → `.env`
3. Run all 4 SQL migrations above (portfolio_entries, expenses, user_settings, portfolio_snapshots)
4. Create 2 user accounts via **Authentication → Users → Invite user**
5. Each user logs in once — their `user_settings` row is upserted automatically on first Portfolio load
6. Verify RLS is enabled on all 4 tables

---

## Known Limitations

- Custom asset types stored in `user_settings.custom_asset_types` provide UI picker entries but do not modify the DB schema — any custom type key can be stored in `portfolio_entries.asset_type` (no constraint).
- Exchange rates are fetched client-side and stored per user — both users get their own cached rates. If one user refreshes and the other doesn't, their rates may differ temporarily.
- The performance chart data density is proportional to how often holdings are edited — infrequent editors get sparse charts.
- Partner comparison in the Together view requires both users to have their `display_name` set in user settings.

---

## Out of Scope

- Push notifications
- Export to CSV/PDF
- Budget limits or alerts
- Automatic price fetching for individual assets
- More than 2 users
