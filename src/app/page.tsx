'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  Check,
  ClipboardList,
  FileSignature,
  Gavel,
  Landmark,
  Menu,
  Moon,
  Scale,
  ShieldCheck,
  Star,
  Sun,
  Timer,
  X,
  Zap,
} from 'lucide-react';

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────
   Motion helpers — every reveal lives inside <MotionConfig
   reducedMotion="user">, so OS-level "reduce motion" wins.
   ──────────────────────────────────────────────────────────── */

function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   Content
   ──────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Docs', href: '/dashboard/api' },
];

const FEATURES = [
  {
    icon: Gavel,
    title: 'Matter Management',
    description:
      'Every matter with parties, practice area, stage, risk and owner — filterable, sortable, and always in sync with billing.',
    href: '/dashboard/matters',
    stats: '25 open matters',
  },
  {
    icon: ClipboardList,
    title: 'Client Intake',
    description:
      'Structured intake forms, conflict checks and source attribution that turn a web form into a retained client.',
    href: '/dashboard/intake',
    stats: '8 lead sources',
  },
  {
    icon: FileSignature,
    title: 'Document Automation',
    description:
      'Pleadings, contracts and engagement letters generated from templates with clause libraries and version history.',
    href: '/dashboard/templates',
    stats: 'Draft → final in minutes',
  },
  {
    icon: Timer,
    title: 'Time & Billing',
    description:
      'Timers, rate tables, LEDES-ready invoices, retainers and aging — from captured minute to collected dollar.',
    href: '/dashboard/invoices',
    stats: '36% faster collections',
  },
  {
    icon: Landmark,
    title: 'Trust Accounting',
    description:
      'Three-way reconciliation, IOLTA ledgers and shortfall alerts that keep client funds compliant and auditable.',
    href: '/dashboard/trust',
    stats: 'Zero-balance drift',
  },
  {
    icon: CalendarClock,
    title: 'Court Calendar',
    description:
      'Deadlines, hearings, depositions and filings in one docket with configurable lead-time reminders.',
    href: '/dashboard/court-dates',
    stats: 'Never miss a filing',
  },
  {
    icon: Scale,
    title: 'Legal Research',
    description:
      'Case law, statutes and your own precedents in a searchable knowledge base linked to the matter at hand.',
    href: '/dashboard/research',
    stats: 'Precedent-linked',
  },
  {
    icon: BarChart3,
    title: 'Firm Analytics',
    description:
      'Realization, utilization, matter profitability and pipeline dashboards your partners will actually read.',
    href: '/dashboard/analytics',
    stats: 'Live partner dashboards',
  },
];

const PRICING = [
  {
    name: 'Solo',
    price: '$39',
    period: '/user/mo',
    blurb: 'For solo practitioners who need the whole stack without the overhead.',
    cta: 'Start free trial',
    href: '/dashboard',
    featured: false,
    features: [
      '1 attorney seat included',
      'Unlimited matters & clients',
      'Time tracking + invoicing',
      'Trust accounting (IOLTA)',
      'Document templates (25)',
      'Email support',
    ],
  },
  {
    name: 'Firm',
    price: '$79',
    period: '/user/mo',
    blurb: 'For growing firms that live in the court calendar and the A/R report.',
    cta: 'Start free trial',
    href: '/dashboard',
    featured: true,
    features: [
      'Everything in Solo',
      'Team roles & permissions',
      'Court calendar + reminders',
      'Advanced analytics & reports',
      'Unlimited document templates',
      'Priority support (4h SLA)',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    blurb: 'For multi-office firms with compliance, SSO and integration requirements.',
    cta: 'Talk to sales',
    href: '/dashboard/settings',
    featured: false,
    features: [
      'Everything in Firm',
      'SSO / SAML & SCIM',
      'Custom integrations & API',
      'Data residency options',
      'Dedicated success manager',
      '99.9% uptime SLA',
    ],
  },
];

const TESTIMONIALS = [
  {
    quote:
      'We replaced four tools with LegalOS. Matter, billing and court dates finally live in the same place — our realization rate went from 71% to 89% in two quarters.',
    name: 'Marisa Delgado',
    role: 'Managing Partner',
    firm: 'Delgado & Whitmore LLP',
    initials: 'MD',
    stat: '+18% realization',
  },
  {
    quote:
      'Trust reconciliation used to eat the last day of every month. Now it balances on demand and the auditor gets a clean export. That alone paid for the year.',
    name: 'Tobias Hartmann',
    role: 'CFO',
    firm: 'Hartmann Legal Group',
    initials: 'TH',
    stat: '1 day → 20 minutes',
  },
  {
    quote:
      'The intake-to-matter flow is the best I have used. A web enquiry becomes a conflicts-checked matter with an engagement letter before I have finished my coffee.',
    name: 'Priya Raghavan',
    role: 'Senior Associate',
    firm: 'Raghavan Chambers',
    initials: 'PR',
    stat: '3× faster intake',
  },
];

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Matters', href: '/dashboard/matters' },
      { label: 'Time & Billing', href: '/dashboard/time' },
      { label: 'Trust Accounting', href: '/dashboard/trust' },
      { label: 'Firm Analytics', href: '/dashboard/analytics' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Client Intake', href: '/dashboard/intake' },
      { label: 'Document Automation', href: '/dashboard/templates' },
      { label: 'Court Calendar', href: '/dashboard/court-dates' },
      { label: 'Legal Research', href: '/dashboard/research' },
      { label: 'Reports', href: '/dashboard/reports' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'API Reference', href: '/dashboard/api' },
      { label: 'Health Check', href: '/api/health' },
      { label: 'Settings', href: '/dashboard/settings' },
      { label: 'Team', href: '/dashboard/team' },
      { label: 'Contacts', href: '/dashboard/contacts' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About LegalOS', href: '/' },
      { label: 'Security', href: '/dashboard/trust' },
      { label: 'Privacy Policy', href: '/' },
      { label: 'Terms of Service', href: '/' },
      { label: 'Contact', href: '/' },
    ],
  },
];

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-[#0b0f17] dark:text-slate-100">
        {/* ── Sticky glass nav ─────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f17]/70">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="group flex items-center gap-2.5" aria-label="LegalOS home">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson-600 text-white shadow-[0_8px_20px_-8px_rgba(220,38,38,0.8)] transition-transform group-hover:-translate-y-0.5">
                <Scale className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="text-[17px] font-bold tracking-tight">
                Legal<span className="text-crimson-600">OS</span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-crimson-600 px-4 text-sm font-semibold text-white shadow-[0_10px_25px_-12px_rgba(220,38,38,0.9)] transition-colors hover:bg-crimson-700"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>

          {/* Mobile drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                key="mobile-drawer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f17]/95 md:hidden"
              >
                <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-crimson-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-crimson-700"
                  >
                    Open dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-crimson-500/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-crimson-200 bg-crimson-50 px-3 py-1 text-xs font-semibold text-crimson-700 dark:border-crimson-500/30 dark:bg-crimson-500/10 dark:text-crimson-300">
                  <Zap className="h-3.5 w-3.5" />
                  Legal practice management, reimagined
                </span>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  Run your firm like a{' '}
                  <span className="bg-gradient-to-r from-crimson-600 via-red-500 to-crimson-700 bg-clip-text text-transparent">
                    Fortune 500
                  </span>{' '}
                  legal dept
                </h1>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                  Matters, intake, documents, billing, trust accounting, court deadlines and
                  analytics — one operating system for the entire firm, with the polish of the
                  tools your clients already use.
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-crimson-600 px-7 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(220,38,38,0.9)] transition-all hover:-translate-y-0.5 hover:bg-crimson-700 sm:w-auto"
                  >
                    Launch LegalOS
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 sm:w-auto dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  >
                    Explore the platform
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.24}>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-crimson-600" /> SOC 2-ready controls
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-crimson-600" /> IOLTA-compliant ledgers
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-crimson-600" /> 14-day free trial
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Stat strip */}
            <Reveal delay={0.3} className="mx-auto mt-14 max-w-4xl">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: '2,400+', label: 'firms onboarded' },
                  { value: '1.9M', label: 'matters managed' },
                  { value: '99.98%', label: 'platform uptime' },
                  { value: '4.9/5', label: 'average rating' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {stat.value}
                    </dd>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
                Platform
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything the firm runs on, in one place
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Eight modules that share one data model — no exports, no double entry, no
                reconciling three systems at month end.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={(index % 4) * 0.06} className="h-full">
                  <Link
                    href={feature.href}
                    className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-1 hover:border-crimson-300 hover:shadow-[0_18px_40px_-24px_rgba(220,38,38,0.55)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-crimson-500/40"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-crimson-50 text-crimson-600 transition-colors group-hover:bg-crimson-600 group-hover:text-white dark:bg-crimson-500/10 dark:text-crimson-400">
                      <feature.icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-600 dark:text-crimson-400">
                      {feature.stats}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────── */}
        <section
          id="pricing"
          className="scroll-mt-20 border-y border-slate-200 bg-white py-20 sm:py-24 dark:border-white/10 dark:bg-[#0e131c]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Straightforward pricing, no per-matter fees
              </h2>
              <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
                Every plan includes trust accounting, unlimited matters and a 14-day trial.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {PRICING.map((tier, index) => (
                <Reveal key={tier.name} delay={index * 0.08} className="h-full">
                  <div
                    className={cn(
                      'relative flex h-full flex-col rounded-3xl border p-7 transition-transform sm:p-8',
                      tier.featured
                        ? 'border-crimson-500 bg-gradient-to-b from-crimson-50 to-white shadow-[0_30px_60px_-32px_rgba(220,38,38,0.6)] lg:-translate-y-3 dark:from-crimson-500/10 dark:to-transparent dark:bg-none'
                        : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]'
                    )}
                  >
                    {tier.featured && (
                      <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-crimson-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg">
                        <Star className="h-3 w-3 fill-current" /> Most popular
                      </span>
                    )}

                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {tier.blurb}
                    </p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {tier.period}
                        </span>
                      )}
                    </div>

                    <ul className="mt-6 flex-1 space-y-3">
                      {tier.features.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm">
                          <span
                            className={cn(
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                              tier.featured
                                ? 'bg-crimson-600 text-white'
                                : 'bg-crimson-50 text-crimson-600 dark:bg-crimson-500/15 dark:text-crimson-400'
                            )}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={tier.href}
                      className={cn(
                        'mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors',
                        tier.featured
                          ? 'bg-crimson-600 text-white hover:bg-crimson-700'
                          : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'
                      )}
                    >
                      {tier.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────── */}
        <section id="testimonials" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
                Testimonials
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Trusted by partners who count every hour
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((item, index) => (
                <Reveal key={item.name} delay={index * 0.08} className="h-full">
                  <figure className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex gap-0.5 text-crimson-500">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      “{item.quote}”
                    </blockquote>
                    <span className="mt-4 w-fit rounded-full bg-crimson-50 px-2.5 py-1 text-[11px] font-bold text-crimson-700 dark:bg-crimson-500/10 dark:text-crimson-300">
                      {item.stat}
                    </span>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-white/10">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-crimson-700 text-sm font-bold text-white">
                        {item.initials}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{item.name}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {item.role} · {item.firm}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Crimson CTA band ─────────────────────────────── */}
        <section className="relative overflow-hidden bg-crimson-600">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(69,10,10,0.45),transparent_55%)]"
          />
          <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Your next matter deserves better plumbing
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
                Spin up the full LegalOS workspace — dashboard, matters, billing, trust ledgers and
                court calendar — in under two minutes. No credit card, no implementation consultant.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-bold text-crimson-700 shadow-lg transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  Open the dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#pricing"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/40 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  Compare plans
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.22}>
              <p className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-white/80">
                <Building2 className="h-4 w-4" />
                Trusted by 2,400+ firms across 14 jurisdictions
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Footer (4 columns) ───────────────────────────── */}
        <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b0f17]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-5">
              <div className="md:col-span-1">
                <Link href="/" className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson-600 text-white">
                    <Scale className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="text-[17px] font-bold tracking-tight">
                    Legal<span className="text-crimson-600">OS</span>
                  </span>
                </Link>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  The operating system for modern law firms. Run your firm like a business — not a
                  stack of spreadsheets.
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-crimson-600" />
                  SOC 2-ready · IOLTA-compliant
                </div>
              </div>

              {FOOTER_COLUMNS.map((column) => (
                <nav key={column.title} className="md:col-span-1">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-slate-600 transition-colors hover:text-crimson-600 dark:text-slate-400 dark:hover:text-crimson-400"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                © 2026 LegalOS. Built by KhalidKhan541. All rights reserved.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mock data only — demo environment. Not legal advice.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
