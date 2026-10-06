# ⚖️ LegalOS — Legal Practice Management

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwindcss&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green)

**Run your firm like a business.**

LegalOS is a full-stack legal practice management platform — matters, clients, intake, documents, billing, trust accounting, court deadlines, research and analytics in a single crimson-accented workspace. It is the operating system for modern law firms, built to feel like the tool a Fortune 500 legal department would actually use.

---

## Overview

| | |
| --- | --- |
| **Product** | LegalOS — Legal Practice Management |
| **Version** | 0.1.0 |
| **Stack** | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS |
| **Data** | Deterministic mock datasets (no database required to run) |
| **License** | MIT |

LegalOS ships a production-quality UI kit, three global contexts (theme, sidebar, notifications), 20+ application pages backed by a 7k-line mock data layer, and a live health endpoint — everything needed to demo, extend, or wire to a real backend later.

---

## Features

Every feature is mapped to the real dashboard route and the source directory that powers it.

| Feature | What you get | Dashboard route | Source |
| --- | --- | --- | --- |
| **Matter Management** | Matters with parties, practice area, stage, priority, risk scoring and owner; filter, sort, drill into a matter | `/dashboard/matters` | `src/app/dashboard/matters/page.tsx` |
| **Client Intake** | Intake pipeline (new → consulting → retained), lead sources, conflict-ready records, client roster | `/dashboard/intake`, `/dashboard/clients` | `src/app/dashboard/intake/`, `src/app/dashboard/clients/` |
| **Document Automation** | Documents, contracts and clause templates with statuses, version history and matter linkage | `/dashboard/documents`, `/dashboard/contracts`, `/dashboard/templates` | `src/app/dashboard/documents/`, `src/app/dashboard/contracts/`, `src/app/dashboard/templates/` |
| **Time & Billing** | Timers and time entries, invoices with line items, aging, realization and collection metrics | `/dashboard/time`, `/dashboard/invoices` | `src/app/dashboard/time/`, `src/app/dashboard/invoices/` |
| **Trust Accounting** | IOLTA trust accounts, retainers, three-way reconciliation signals and shortfall alerts | `/dashboard/trust` | `src/app/dashboard/trust/page.tsx` |
| **Court Calendar** | Hearings, depositions, filing deadlines and court dockets with lead-time reminders | `/dashboard/court-dates`, `/dashboard/filings` | `src/app/dashboard/court-dates/`, `src/app/dashboard/filings/` |
| **Legal Research** | Research queue and precedent library linked back to the matter at hand | `/dashboard/research`, `/dashboard/precedents` | `src/app/dashboard/research/`, `src/app/dashboard/precedents/` |
| **Firm Analytics** | KPI trends (billing, collections, realization, utilization), charts and downloadable reports | `/dashboard/analytics`, `/dashboard/reports` | `src/app/dashboard/analytics/`, `src/app/dashboard/reports/` |

Supporting modules: **Contacts** (`/dashboard/contacts`), **Team** (`/dashboard/team`), **API keys & webhooks** (`/dashboard/api`), **Settings** (`/dashboard/settings`).

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 14.2** (App Router, RSC, route handlers) | File-based routing, metadata API, edge-ready |
| UI | **React 18** + **TypeScript 5.5** (strict) | Type-safe components end to end |
| Styling | **Tailwind CSS 3.4** + CSS design tokens (`--lg-*`) | Utility classes with a token-driven theming layer |
| Motion | **framer-motion** wrapped in `<MotionConfig reducedMotion="user">` | Scroll reveals that respect the OS reduced-motion setting |
| Icons | **lucide-react** | Consistent 24px stroke iconography |
| Charts | **recharts** | Analytics / reports visualizations |
| Toasts | **react-hot-toast** | Global `<Toaster>` mounted in the root layout |
| Dates / numbers | **date-fns** + `Intl` | Formatting helpers in `src/lib/utils.ts` |
| Validation | **zod** | Schema validation for form and API payloads |
| Class merging | **clsx** + **tailwind-merge** (`cn()` helper) | Conflict-free conditional class names |

---

## Quick start

**Prerequisites:** Node.js 18.17+ (20 LTS recommended) and npm 9+.

```bash
# 1. Clone and enter the project
git clone <repo-url> legalos
cd legalos

# 2. Install dependencies
npm install

# 3. Configure environment (optional — the app runs on mock data without it)
cp .env.example .env.local

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and
[http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the workspace.

### Scripts

| Script | Command | What it does |
| --- | --- | --- |
| Development | `npm run dev` | Start Next.js dev server with hot reload |
| Production build | `npm run build` | Type-check and create an optimized production bundle |
| Production server | `npm run start` | Serve the production build (requires `npm run build` first) |
| Lint | `npm run lint` | Run ESLint via `next lint` |
| Type check | `npm run typecheck` | `tsc --noEmit` — full project type checking |

---

## Project structure

```
legalos/
├── .env.example              # Environment variable template (copy to .env.local)
├── next.config.js            # Next config: strict mode, remote image hosts, fs fallback
├── package.json              # Dependencies + scripts
├── postcss.config.js         # PostCSS: tailwindcss + autoprefixer
├── tailwind.config.ts        # darkMode:'class', crimson/lg palettes, fonts, animations
├── tsconfig.json             # Strict TS, path alias `@/* -> ./src/*`
│
└── src/
    ├── app/                  # App Router: routes, layouts, metadata, API handlers
    │   ├── layout.tsx        # Root layout: Inter font, 3 providers, <Toaster>,
    │   │                     #   OG/Twitter metadata, viewport themeColor,
    │   │                     #   inline pre-hydration theme script (no FOUC)
    │   ├── page.tsx          # Marketing landing page (hero, features, pricing,
    │   │                     #   testimonials, CTA band, 4-column footer)
    │   ├── not-found.tsx     # Self-contained 404 with gradient headline
    │   ├── globals.css       # Design tokens (--lg-*), .dark overrides, lg-* components
    │   ├── api/
    │   │   └── health/
    │   │       └── route.ts  # GET /api/health — force-dynamic, no-store probe
    │   └── dashboard/        # Authenticated workspace shell + all product pages
    │       ├── layout.tsx    # Wraps pages in <DashboardShell> (sidebar + topbar)
    │       ├── page.tsx      # Dashboard home: KPIs, activity, alerts, deadlines
    │       ├── analytics/    # Charts: billing, collections, realization, utilization
    │       ├── api/          # API keys, webhooks, integration docs
    │       ├── clients/      # Client roster & detail
    │       ├── contacts/     # Address book
    │       ├── contracts/    # Contract lifecycle
    │       ├── court-dates/  # Calendar of hearings & deadlines
    │       ├── documents/    # Document library
    │       ├── filings/      # Court filings & e-filing status
    │       ├── intake/       # Intake pipeline
    │       ├── invoices/     # Invoicing & A/R
    │       ├── matters/      # Matter list & drill-down
    │       ├── precedents/   # Precedent library
    │       ├── reports/      # Report builder
    │       ├── research/     # Legal research workspace
    │       ├── settings/     # Firm preferences & integrations
    │       ├── team/         # Team roster, utilization, CLE
    │       ├── templates/    # Document templates
    │       ├── time/         # Time tracking
    │       └── trust/        # Trust (IOLTA) accounting
    │
    ├── components/
    │   ├── icons.tsx         # Brand / domain-specific SVG icons
    │   ├── layout/           # DashboardShell, Sidebar, TopBar
    │   └── ui/               # Button, Card, Badge, Avatar, Tabs, MetricCard
    │
    ├── contexts/             # Client-side global state (all "use client")
    │   ├── ThemeContext.tsx  # useTheme() — light/dark/system, persists to localStorage
    │   ├── SidebarContext.tsx# useSidebar() — desktop collapse + mobile drawer
    │   └── NotificationContext.tsx # useNotifications() — notification feed & unread count
    │
    └── lib/
        ├── constants.ts      # APP_*, SIDEBAR_NAV, statuses, roles, thresholds
        ├── mock-data.ts      # ~7,000 lines of deterministic fixtures + helpers
        └── utils.ts          # cn(), formatters (currency, dates, duration, initials)
```

---

## Page routes

| Route | Source file | Description |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Landing page: hero, 8 features, pricing, testimonials, CTA, footer |
| `/dashboard` | `src/app/dashboard/page.tsx` | Firm overview: KPI cards, activity feed, alerts, upcoming deadlines |
| `/dashboard/analytics` | `src/app/dashboard/analytics/page.tsx` | Billing, collections, realization and utilization charts |
| `/dashboard/clients` | `src/app/dashboard/clients/page.tsx` | Client roster with status, billing and matter counts |
| `/dashboard/intake` | `src/app/dashboard/intake/page.tsx` | Intake pipeline by stage and lead source |
| `/dashboard/contacts` | `src/app/dashboard/contacts/page.tsx` | Contacts address book |
| `/dashboard/matters` | `src/app/dashboard/matters/page.tsx` | Matter list with filters, priority and risk |
| `/dashboard/court-dates` | `src/app/dashboard/court-dates/page.tsx` | Upcoming hearings, depositions and deadlines |
| `/dashboard/filings` | `src/app/dashboard/filings/page.tsx` | Filings with e-filing status |
| `/dashboard/documents` | `src/app/dashboard/documents/page.tsx` | Document library by type and status |
| `/dashboard/contracts` | `src/app/dashboard/contracts/page.tsx` | Contract lifecycle (drafting → executed) |
| `/dashboard/templates` | `src/app/dashboard/templates/page.tsx` | Reusable document templates |
| `/dashboard/time` | `src/app/dashboard/time/page.tsx` | Time entries, timers and billable totals |
| `/dashboard/invoices` | `src/app/dashboard/invoices/page.tsx` | Invoices, line items, aging and payments |
| `/dashboard/trust` | `src/app/dashboard/trust/page.tsx` | Trust accounts, retainers and reconciliation |
| `/dashboard/research` | `src/app/dashboard/research/page.tsx` | Research items and review status |
| `/dashboard/precedents` | `src/app/dashboard/precedents/page.tsx` | Precedent library |
| `/dashboard/team` | `src/app/dashboard/team/page.tsx` | Team roster, utilization, rates and CLE |
| `/dashboard/reports` | `src/app/dashboard/reports/page.tsx` | Report catalog (billing, profitability, AR…) |
| `/dashboard/api` | `src/app/dashboard/api/page.tsx` | API keys, webhooks and integration surface |
| `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | Firm profile, preferences, integrations |
| `/api/health` | `src/app/api/health/route.ts` | Health probe (JSON, never cached) |
| *any unknown route* | `src/app/not-found.tsx` | 404 page |

Sidebar navigation is defined once in `SIDEBAR_NAV` (`src/lib/constants.ts`); the sidebar resolves those root-relative hrefs to their `/dashboard/*` routes at render time.

---

## API

### `GET /api/health`

Liveness / readiness probe for uptime checks, load balancers and container orchestrators.

- `export const dynamic = 'force-dynamic'` → always evaluated at request time (never statically prerendered)
- Response headers: `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`, `Pragma: no-cache`, `Expires: 0`
- Always returns **200** with process-level telemetry

```bash
curl -i http://localhost:3000/api/health
```

**Sample response**

```json
{
  "status": "ok",
  "name": "legalos",
  "version": "0.1.0",
  "uptime": 4123,
  "uptimeHuman": "1h 8m 43s",
  "timestamp": "2026-10-06T09:12:44.881Z",
  "runtime": "v20.15.1 (win32/x64)",
  "environment": "production",
  "memory": {
    "rss": "86.4 MB",
    "heapTotal": "61.2 MB",
    "heapUsed": "48.9 MB",
    "external": "4.1 MB",
    "rssBytes": 90586112,
    "heapUsedBytes": 51267584
  },
  "startedAt": "2026-10-06T08:03:41.221Z"
}
```

| Field | Meaning |
| --- | --- |
| `status` | Always `"ok"` when the process is serving requests |
| `name` / `version` | Read from `package.json` at build time |
| `uptime` / `uptimeHuman` | Process uptime in seconds and humanized form |
| `runtime` | Node version plus platform/arch |
| `environment` | `NODE_ENV` |
| `memory.*` | Human-readable and raw byte memory figures (RSS, heap, external) |
| `startedAt` | ISO timestamp captured when the route module first loaded |

---

## Theming

LegalOS is token-driven. Two layers work together:

### 1. CSS design tokens (`--lg-*`)

Declared in `src/app/globals.css` on `:root`, re-declared for `.dark`:

| Group | Tokens |
| --- | --- |
| Brand (crimson) | `--lg-primary`, `--lg-primary-hover`, `--lg-primary-active`, `--lg-primary-soft`, `--lg-primary-soft-hover`, `--lg-primary-ring`, `--lg-primary-text`, `--lg-on-primary` |
| Surfaces | `--lg-bg`, `--lg-bg-elevated`, `--lg-surface`, `--lg-surface-muted`, `--lg-surface-sunken`, `--lg-border`, `--lg-border-strong`, `--lg-border-subtle` |
| Text | `--lg-text`, `--lg-text-secondary`, `--lg-text-muted`, `--lg-text-inverse` |
| Feedback | `--lg-success`, `--lg-warning`, `--lg-danger`, `--lg-info` (+ `-soft` variants) |
| Effects | `--lg-shadow-sm/md/lg`, `--lg-radius-sm/md/lg/full`, `--lg-transition`, `--lg-transition-slow` |
| Layout | `--lg-sidebar-width` (16rem), `--lg-header-height` (4rem) |
| Fonts | `--lg-font-sans` (Inter via `next/font`), `--lg-font-mono` |

Component classes (`lg-card`, `lg-btn*`, `lg-input`, `lg-table`, `lg-badge*`, `lg-kpi`, `lg-skeleton`, …) are built on those tokens, so switching theme variables re-skins the whole app.

### 2. Crimson palette (Tailwind)

`tailwind.config.ts` exposes two identical ramps you can use anywhere:

```text
crimson-50 #fef2f2   crimson-400 #f87171   crimson-700 #b91c1c
crimson-100 #fee2e2   crimson-500 #ef4444   crimson-800 #991b1b
crimson-200 #fecaca   crimson-600 #dc2626   crimson-900 #7f1d1d
crimson-300 #fca5a5                     crimson-950 #450a0a
```

`crimson-600 (#dc2626)` is the brand primary; `lg` is an alias of the same scale. Dark-mode neutrals live in the `night` palette (`night`, `night-raised`, `night-muted`, `night-sunken`, `night-line`).

### Dark / light mode

- `darkMode: 'class'` — the `.dark` class on `<html>` switches every token and Tailwind `dark:` variant.
- `useTheme()` (`src/contexts/ThemeContext.tsx`) exposes `theme`, `resolvedTheme`, `setTheme` and `toggleTheme`, with `light | dark | system` support.
- **Pre-hydration script:** the root layout inlines a parser-blocking script that runs before first paint. It reads the stored theme — **`lg-theme` first, falling back to ThemeContext's `legalos-theme` key**, then `prefers-color-scheme` — and applies the `dark` class plus `color-scheme`, so there is no light/dark flash (FOUC) on load.
- `viewport.themeColor` is exported for both schemes: `#f7f8fa` (light) and `#0b0f17` (dark).

### Local storage keys

| Key | Owner | Values |
| --- | --- | --- |
| `lg-theme` | Public theming key (read first by the FOUC script) | `light` · `dark` |
| `legalos-theme` | `ThemeContext` (persisted on change) | `light` · `dark` · `system` |
| `legalos-sidebar-collapsed` | `SidebarContext` | `1` · `0` |
| `legalos-notifications` | `NotificationContext` | JSON array of notifications |

### Motion

Landing-page reveals are wrapped in `<MotionConfig reducedMotion="user">`; combined with the global `prefers-reduced-motion` rule in `globals.css`, animations collapse automatically when the OS setting asks for reduced motion.

---

## Mock data

All UI runs against `src/lib/mock-data.ts` — deterministic, typed fixtures (no network, no database). Swap them for real API calls by changing imports at the page level.

| Export | Type | Records |
| --- | --- | --- |
| `MOCK_FIRM` | `Firm` | 1 |
| `MOCK_CLIENTS` | `Client[]` | 20 |
| `MOCK_MATTERS` | `Matter[]` | 25 |
| `MOCK_INTAKE` | `IntakeRecord[]` | 10 |
| `MOCK_CONTACTS` | `Contact[]` | 15 |
| `MOCK_COURT_DATES` | `CourtDate[]` | 12 |
| `MOCK_FILINGS` | `Filing[]` | 12 |
| `MOCK_DOCUMENTS` | `Document[]` | 20 |
| `MOCK_CONTRACTS` | `Contract[]` | 15 |
| `MOCK_TEMPLATES` | `Template[]` | 8 |
| `MOCK_TIME_ENTRIES` | `TimeEntry[]` | 25 |
| `MOCK_INVOICES` | `Invoice[]` | 15 |
| `MOCK_TRUST_ACCOUNTS` | `TrustAccount[]` | 6 |
| `MOCK_RESEARCH` | `ResearchItem[]` | 10 |
| `MOCK_PRECEDENTS` | `Precedent[]` | 8 |
| `MOCK_COURTS` | `Court[]` | 8 |
| `MOCK_TEAM` | `TeamMember[]` | 10 |
| `MOCK_KPI` | `KpiMonth[]` | 12 (monthly series) |
| `MOCK_ACTIVITY` | `Activity[]` | 10 |
| `MOCK_NOTIFICATIONS` | `MockNotification[]` | 6 |
| `MOCK_REPORTS` | `Report[]` | 6 |
| `MOCK_API_KEYS` | `ApiKey[]` | 3 |
| `MOCK_SETTINGS` | `FirmSettings` | 1 |
| `MOCK_ALERTS` | severity-ranked alerts | 4 |

Derived helpers are exported alongside the fixtures: `totalInvoiced()`, `outstandingBalance()`, `averageRealization()`, `totalTrustBalance()`, `getClientById()`, `getMatterById()`, `getMattersForClient()`, `getDocumentsForMatter()` and `getOpenMatters()`.

Reference constants in `src/lib/constants.ts`: `SIDEBAR_NAV`, `FLAT_NAV`, `BREADCRUMB_LABELS`, status/priority/role vocabularies (`MATTER_STATUSES`, `INVOICE_STATUSES`, `ROLES`, …), thresholds (`RETAINER_ALERT_THRESHOLD`, `OVERDUE_INVOICE_THRESHOLD_DAYS`, `LOW_UTILIZATION_THRESHOLD`) and `ACTIVITY_COLORS`.

---

## Environment variables

Copy `.env.example` to `.env.local`. The current build runs entirely on mock data, so **none of these are required to start the dev server** — they are wired up for the real-backend roadmap.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Display name (default `LegalOS`) |
| `NEXT_PUBLIC_APP_URL` | Canonical URL — used for OG/canonical metadata and `APP_URL` |
| `NEXT_PUBLIC_APP_ENV` | `development` · `staging` · `production` |
| `DATABASE_URL` | PostgreSQL connection string (PostgreSQL / Prisma roadmap) |
| `NEXTAUTH_URL` | Auth base URL |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Session signing secrets |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth login |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe browser key |
| `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Document storage (S3 / R2) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| `LEXIS_NEXIS_API_KEY` | Legal research provider |
| `COURT_EFILING_API_KEY` | Court e-filing integration |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Feature flag: analytics |
| `NEXT_PUBLIC_ENABLE_BETA_FEATURES` | Feature flag: beta features |

---

## License

MIT © 2026 [KhalidKhan541](https://github.com/KhalidKhan541)

See [LICENSE](./LICENSE) for the full text.
