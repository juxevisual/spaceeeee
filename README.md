# spaceeeee

A private personal finance app for two users to track investment portfolios and monthly expenses. Built with React, Tailwind CSS, and Supabase.

## Features

- **Portfolio Tracker** — holdings grouped by platform, donut chart by asset type, USD/IDR rate input
- **Expense Tracker** — monthly expenses grouped by category with add/edit/delete and month navigation
- **Combined View** — both users' expenses merged with stat cards, category chart, comparison chart, and month-over-month trend
- Dark mode toggle persisted to localStorage
- Row-level security via Supabase — each user only sees their own data, except the shared combined view

## Stack

- React 18 + React Router
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Recharts
- Webpack

## Getting Started

**1. Clone the repo**

```bash
git clone https://github.com/juxevisual/spaceeeee.git
cd spaceeeee
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env
```

Fill in your Supabase project URL and anon key:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**4. Run the dev server**

```bash
npm run dev
```

**5. Build for production**

```bash
npm run build
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Notes

This is a private app — no public signup. User accounts are created manually via the Supabase dashboard.
