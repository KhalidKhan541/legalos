# ⚖️ LegalOS — Legal Practice Management

> **The operating system for modern law firms.** Matters, intake, documents, billing, trust accounting, court deadlines and firm analytics — one crimson-accented workspace.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwindcss&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Overview

LegalOS is a fullstack legal practice management platform built for solo practitioners through mid-size firms. Every screen is wired to a rich typed dataset, so the whole product is explorable out of the box — perfect for demos, white-labeling, or bootstrapping a real practice-management product.

## Features

| Feature | Where | What it does |
| --- | --- | --- |
| **Firm dashboard** | `/dashboard` | KPIs, billing vs collections, matter funnel, court-date countdowns, activity feed |
| **Analytics** | `/dashboard/analytics` | Revenue, realization, matter flow, utilization, client concentration |
| **Client management** | `/dashboard/clients` | Balances, LTV, risk scoring, expandable contact + matters detail |
| **Intake pipeline** | `/dashboard/intake` | Lead → consult → retain workflow with conversion stats |
| **Contacts** | `/dashboard/contacts` | Opposing counsel, courts, vendors, experts directory |
| **Matters** | `/dashboard/matters` | Docket with budgets, deadlines, teams, opposing parties |
| **Court dates** | `/dashboard/court-dates` | Hearings/trials/depositions with countdowns and remote links |
| **Filings** | `/dashboard/filings` | E-filing tracker, fees, clerk confirmations, service of process |
| **Documents** | `/dashboard/documents` | Versioned repository with status workflow and tags |
| **Contracts** | `/dashboard/contracts` | Counterparty, value, risk, renewal countdowns |
| **Templates** | `/dashboard/templates` | Reusable clause & filing templates with usage stats |
| **Time tracking** | `/dashboard/time` | Live timer, billable %, weekly utilization |
| **Invoices** | `/dashboard/invoices` | Line items, aging buckets, reminders, mark-paid |
| **Trust accounting** | `/dashboard/trust` | IOLTA rules, three-way reconciliation, client ledgers |
| **Legal research** | `/dashboard/research` | Issues, citations, citator treatment (good law / overruled) |
| **Precedents** | `/dashboard/precedents` | Curated case law library with favorability scoring |
| **Team** | `/dashboard/team` | Roster, bar licenses, permissions matrix, invites |
| **Reports** | `/dashboard/reports` | Scheduled + on-demand reports with exports |
| **API** | `/dashboard/api` | Keys, scopes, webhooks, usage, request logs |
| **Settings** | `/dashboard/settings` | Firm profile, appearance, billing, integrations, security |

## Tech stack

- **Next.js 14** (App Router) + **React 18**
- **TypeScript** (strict) — every dataset is fully typed
- **Tailwind CSS 3.4** with `darkMode: 'class'` and a custom **crimson** palette
- **Recharts** for analytics
- **framer-motion**, **react-hot-toast**, **lucide-react**, **clsx**, **tailwind-merge**, **zod**

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npx tsc --noEmit` | Type-check without emitting |

## Project structure

```
legalos/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Providers, fonts, FOUC-free theme bootstrap
│   │   ├── page.tsx              # Marketing landing page
│   │   ├── not-found.tsx         # 404
│   │   ├── api/health/route.ts   # Health check endpoint
│   │   └── dashboard/            # 20 authenticated routes (see table above)
│   ├── components/
│   │   ├── ui/                   # Card, Badge, Button, Avatar, MetricCard, Tabs
│   │   └── layout/               # Sidebar, TopBar, DashboardShell
│   ├── contexts/                 # Theme, Sidebar, Notification providers
│   └── lib/
│       ├── constants.ts          # Nav, roles, statuses, thresholds
│       ├── mock-data.ts          # Typed fixture dataset (MOCK_* exports)
│       └── utils.ts              # cn, formatters, date helpers
├── tailwind.config.ts            # Crimson palette + animation tokens
└── package.json
```

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Returns `{ status, uptime, version, memory }` — no cache |

```bash
curl -s http://localhost:3000/api/health
```

## Theming

- **Tokens**: all colors flow from `--lg-*` CSS variables in `src/app/globals.css`, overridden under `.dark`
- **Palette**: custom `crimson` / `lg` scale in `tailwind.config.ts`, primary `#dc2626`
- **Theme toggle**: `useTheme()` from `@/contexts/ThemeContext`, persisted to `localStorage`
  (`lg-theme` / `legalos-theme`), applied pre-hydration by an inline script to prevent FOUC
- **Components**: `lg-card`, `lg-btn-*`, `lg-badge-*`, `lg-input`, `lg-table`, `lg-skeleton` utility classes

## Mock data

All screens read from `src/lib/mock-data.ts` — typed `MOCK_*` exports covering clients, matters,
court dates, filings, invoices, trust accounts, research, team and more. Swap these for real API
responses without touching the UI layer.

## License

MIT © 2026 KhalidKhan541
