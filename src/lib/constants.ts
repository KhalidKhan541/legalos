import {
  LayoutDashboard,
  BarChart3,
  Users,
  ClipboardList,
  Contact,
  Gavel,
  CalendarClock,
  FileCheck2,
  FileText,
  FileSignature,
  LayoutTemplate,
  Timer,
  Receipt,
  Landmark,
  Scale,
  BookOpen,
  UsersRound,
  FileBarChart,
  Webhook,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export const APP_NAME = 'LegalOS';
export const APP_DESCRIPTION = 'The operating system for modern law firms.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
export const APP_VERSION = '0.1.0';

export const APP_BRAND = {
  name: APP_NAME,
  shortName: 'LO',
  tagline: 'Run your firm like a business.',
  primaryColor: '#dc2626',
} as const;

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  ComingSoon?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const SIDEBAR_NAV: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Clients',
    items: [
      { label: 'Clients', href: '/clients', icon: Users },
      { label: 'Intake', href: '/intake', icon: ClipboardList },
      { label: 'Contacts', href: '/contacts', icon: Contact },
    ],
  },
  {
    title: 'Matters',
    items: [
      { label: 'Matters', href: '/matters', icon: Gavel, badge: 25 },
      { label: 'Court Dates', href: '/court-dates', icon: CalendarClock },
      { label: 'Filings', href: '/filings', icon: FileCheck2 },
    ],
  },
  {
    title: 'Documents',
    items: [
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Contracts', href: '/contracts', icon: FileSignature },
      { label: 'Templates', href: '/templates', icon: LayoutTemplate },
    ],
  },
  {
    title: 'Money',
    items: [
      { label: 'Time Tracking', href: '/time', icon: Timer },
      { label: 'Invoices', href: '/invoices', icon: Receipt },
      { label: 'Trust Accounting', href: '/trust', icon: Landmark },
    ],
  },
  {
    title: 'Knowledge',
    items: [
      { label: 'Legal Research', href: '/research', icon: Scale },
      { label: 'Precedents', href: '/precedents', icon: BookOpen },
    ],
  },
  {
    title: 'Team',
    items: [
      { label: 'Team', href: '/team', icon: UsersRound },
      { label: 'Reports', href: '/reports', icon: FileBarChart },
      { label: 'API', href: '/api', icon: Webhook },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export const FLAT_NAV: NavItem[] = SIDEBAR_NAV.flatMap((section) => section.items);

export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  clients: 'Clients',
  intake: 'Intake',
  contacts: 'Contacts',
  matters: 'Matters',
  'court-dates': 'Court Dates',
  filings: 'Filings',
  documents: 'Documents',
  contracts: 'Contracts',
  templates: 'Templates',
  time: 'Time Tracking',
  invoices: 'Invoices',
  trust: 'Trust Accounting',
  research: 'Legal Research',
  precedents: 'Precedents',
  team: 'Team',
  reports: 'Reports',
  api: 'API',
  settings: 'Settings',
};

export const MATTER_TYPES = [
  'litigation',
  'transactional',
  'M&A',
  'IP',
  'employment',
  'real estate',
] as const;

export const MATTER_STATUSES = [
  'open',
  'discovery',
  'trial',
  'closed',
  'on_hold',
] as const;

export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export const HEARING_TYPES = [
  'hearing',
  'trial',
  'deposition',
  'arbitration',
] as const;

export const FILING_STATUSES = [
  'draft',
  'filed',
  'served',
  'accepted',
  'rejected',
] as const;

export const DOCUMENT_TYPES = [
  'pleading',
  'contract',
  'discovery',
  'memo',
  'exhibit',
] as const;

export const DOCUMENT_STATUSES = ['draft', 'review', 'final', 'filed'] as const;

export const CONTRACT_STATUSES = [
  'drafting',
  'negotiating',
  'executed',
  'expired',
] as const;

export const TIME_ENTRY_STATUSES = ['draft', 'submitted', 'billed'] as const;

export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'paid',
  'overdue',
  'partial',
] as const;

export const INTAKE_STATUSES = [
  'new',
  'consulting',
  'retained',
  'declined',
] as const;

export const INTAKE_SOURCES = [
  'Referral',
  'Website',
  'Walk-in',
  'LinkedIn',
  'Partner Network',
  'Alumni',
  'Google Ads',
  'Conference',
] as const;

export const CLIENT_TYPES = ['individual', 'corporate'] as const;

export const CLIENT_STATUSES = ['active', 'inactive', 'prospect'] as const;

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export const ROLES = [
  'Managing Partner',
  'Senior Partner',
  'Associate',
  'Senior Associate',
  'Paralegal',
  'Of Counsel',
  'Legal Assistant',
  'Intern',
  'CFO',
  'Operations Manager',
] as const;

export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'] as const;

export const DATE_FORMATS = [
  { label: 'Oct 5, 2026', value: 'MMM d, yyyy' },
  { label: '10/05/2026', value: 'MM/dd/yyyy' },
  { label: '05 Oct 2026', value: 'dd MMM yyyy' },
  { label: '2026-10-05', value: 'yyyy-MM-dd' },
  { label: 'October 5, 2026', value: 'MMMM d, yyyy' },
] as const;

export const NOTIFICATION_TYPES = [
  'deadline',
  'invoice',
  'mention',
  'filing',
  'system',
] as const;

export const REPORT_TYPES = [
  'Billing Summary',
  'Matter Profitability',
  'Attorney Utilization',
  'Accounts Receivable',
  'Trust Reconciliation',
  'Client Origination',
] as const;

export const ACTIVITY_COLORS: Record<string, string> = {
  matter: 'bg-crimson-100 text-crimson-700 dark:bg-crimson-950 dark:text-crimson-300',
  invoice: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  document: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  client: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  court: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  team: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export const TABLE_PAGE_SIZES = [10, 25, 50, 100] as const;

export const RETAINER_ALERT_THRESHOLD = 5000;
export const OVERDUE_INVOICE_THRESHOLD_DAYS = 30;
export const LOW_UTILIZATION_THRESHOLD = 0.65;
export const HIGH_RISK_THRESHOLD = 0.7;
