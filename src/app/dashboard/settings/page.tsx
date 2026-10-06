'use client';

import { useMemo, useState } from 'react';
import {
  Building2,
  Palette,
  Receipt,
  Plug,
  Bell,
  ShieldCheck,
  Save,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_SETTINGS } from '@/lib/mock-data';
import { cn, formatCurrency } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

type Settings = typeof MOCK_SETTINGS;

const SECTIONS = [
  { id: 'company', label: 'Company profile', icon: Building2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
] as const;

const ACCENTS = [
  { name: 'Crimson', value: '#dc2626' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Sky', value: '#0284c7' },
  { name: 'Violet', value: '#7c3aed' },
] as const;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-crimson-600' : 'bg-slate-300 dark:bg-slate-700'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-crimson-400 focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

/**
 * Sits alongside `MOCK_SETTINGS` so the profile fields, extra integrations and
 * notification channels are covered by the same JSON diff as the saved snapshot.
 */
type ExtraSettings = {
  logoUrl: string;
  address: string;
  barNumber: string;
  efiling: boolean;
  clio: boolean;
  practicePanther: boolean;
  events: { matterDeadlines: boolean; invoiceReminders: boolean; courtDates: boolean };
  channels: Record<'deadlines' | 'invoices' | 'courtDates', string[]>;
};

const CHANNEL_OPTIONS = ['Email', 'In-app', 'Push', 'SMS'] as const;

const INITIAL_EXTRA: ExtraSettings = {
  logoUrl: '',
  address: '1 Whitehall Street, 14th Floor, New York, NY 10004',
  barNumber: 'NY-2458901',
  efiling: true,
  clio: false,
  practicePanther: false,
  events: { matterDeadlines: true, invoiceReminders: true, courtDates: true },
  channels: {
    deadlines: ['Email', 'In-app'],
    invoices: ['Email'],
    courtDates: ['Email', 'In-app', 'Push'],
  },
};

function ChannelPicker({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: string[];
  onToggle: (channel: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-28 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      {CHANNEL_OPTIONS.map((channel) => {
        const active = selected.includes(channel);
        return (
          <button
            key={channel}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(channel)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-crimson-500 bg-crimson-50 text-crimson-700 dark:bg-crimson-950/60 dark:text-crimson-300'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
            )}
          >
            {channel}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>('company');
  const [saved, setSaved] = useState<Settings>(MOCK_SETTINGS);
  const [draft, setDraft] = useState<Settings>(MOCK_SETTINGS);
  const [extra, setExtra] = useState<ExtraSettings>(INITIAL_EXTRA);
  const [savedExtra, setSavedExtra] = useState<ExtraSettings>(INITIAL_EXTRA);

  const snapshot = (settings: Settings, extras: ExtraSettings) =>
    JSON.stringify([settings, extras]);

  const dirty = useMemo(
    () => snapshot(draft, extra) !== snapshot(saved, savedExtra),
    [draft, extra, saved, savedExtra]
  );

  const change = <K extends keyof Settings>(key: K, value: Partial<Settings[K]>) => {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
  };

  const changeExtra = (value: Partial<ExtraSettings>) =>
    setExtra((prev) => ({ ...prev, ...value }));

  const toggleChannel = (
    group: keyof ExtraSettings['channels'],
    channel: string
  ) => {
    setExtra((prev) => {
      const current = prev.channels[group];
      return {
        ...prev,
        channels: {
          ...prev.channels,
          [group]: current.includes(channel)
            ? current.filter((item) => item !== channel)
            : [...current, channel],
        },
      };
    });
  };

  function save() {
    setSaved(draft);
    setSavedExtra(extra);
    toast.success('Settings saved');
  }

  function discard() {
    setDraft(saved);
    setExtra(savedExtra);
    toast('Changes discarded', { icon: '↩️' });
  }

  const dirtyCount = useMemo(() => {
    const a = snapshot(saved, savedExtra).split(',');
    const b = snapshot(draft, extra).split(',');
    let n = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) n++;
    return Math.floor(n / 2);
  }, [saved, savedExtra, draft, extra]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Firm configuration — branding, billing, integrations and compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Badge variant="warning" size="md">{dirtyCount} pending</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={discard} disabled={!dirty}>
            <RotateCcw className="h-4 w-4" /> Discard
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!dirty}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* sticky section nav */}
        <nav className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <ul className="p-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSection(s.id)}
                    aria-current={section === s.id ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      section === s.id
                        ? 'bg-crimson-50 text-crimson-700 dark:bg-crimson-950/60 dark:text-crimson-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <s.icon className="h-4 w-4" /> {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200">ABA compliance</p>
            <p className="mt-1">Trust accounting rules, conflict checks and audit logging are enforced firm-wide.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="success" size="sm">ABA Model 1.15</Badge>
              <Badge variant="info" size="sm">SOC 2 Type II</Badge>
            </div>
          </div>
        </nav>

        {/* section panels */}
        <div className="space-y-6">
          {section === 'company' && (
            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Company profile</CardTitle>
                <CardDescription>How the firm appears on documents, invoices and emails</CardDescription>
              </div>
              <div className="grid gap-4 p-5 pt-4 sm:grid-cols-2">
                <Field label="Firm name">
                  <input className={inputCls} value={draft.general.firmName} onChange={(e) => change('general', { firmName: e.target.value })} />
                </Field>
                <Field label="Support email">
                  <input className={inputCls} value={draft.general.supportEmail} onChange={(e) => change('general', { supportEmail: e.target.value })} />
                </Field>
                <Field label="Timezone">
                  <select className={inputCls} value={draft.general.timezone} onChange={(e) => change('general', { timezone: e.target.value })}>
                    {['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London'].map((tz) => (
                      <option key={tz}>{tz}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date format">
                  <select className={inputCls} value={draft.general.dateFormat} onChange={(e) => change('general', { dateFormat: e.target.value })}>
                    <option value="MMM d, yyyy">Oct 6, 2026</option>
                    <option value="MM/dd/yyyy">10/06/2026</option>
                    <option value="dd MMM yyyy">06 Oct 2026</option>
                    <option value="yyyy-MM-dd">2026-10-06</option>
                  </select>
                </Field>
                <Field label="Currency">
                  <select className={inputCls} value={draft.general.currency} onChange={(e) => change('general', { currency: e.target.value as Settings['general']['currency'] })}>
                    {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Fiscal year start" hint="Month number (1 = January)">
                  <input type="number" min={1} max={12} className={inputCls} value={draft.general.fiscalYearStart} onChange={(e) => change('general', { fiscalYearStart: Number(e.target.value) })} />
                </Field>
                <Field label="Registered address" hint="Appears on invoices and court filings">
                  <input className={inputCls} value={extra.address} onChange={(e) => changeExtra({ address: e.target.value })} />
                </Field>
                <Field label="Bar registration number" hint="Firm bar number printed on filings">
                  <input className={inputCls} value={extra.barNumber} onChange={(e) => changeExtra({ barNumber: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Firm logo" hint="Paste an image URL — leave empty to use initials">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-crimson-600 text-sm font-bold text-white dark:border-slate-800"
                        aria-hidden="true"
                      >
                        {extra.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={extra.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          'HR'
                        )}
                      </span>
                      <input
                        className={inputCls}
                        placeholder="https://…/logo.png"
                        value={extra.logoUrl}
                        onChange={(e) => changeExtra({ logoUrl: e.target.value })}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </Card>
          )}

          {section === 'appearance' && (
            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Theme mode and accent color apply instantly across the app</CardDescription>
              </div>
              <div className="space-y-6 p-5 pt-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Theme mode</p>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
                    {(['light', 'dark', 'system'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTheme(m)}
                        className={cn(
                          'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                          theme === m
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Resolved appearance: <span className="font-medium capitalize">{resolvedTheme}</span>
                    {theme === 'system' ? ' (following system)' : ''}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Accent color</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        title={a.name}
                        onClick={() => {
                          change('branding', { accentColor: a.value, primaryColor: a.value });
                          // Live preview: write the accent through the theme layer.
                          document.documentElement.style.setProperty('--lg-accent', a.value);
                          document.documentElement.style.setProperty('--lg-primary', a.value);
                          toast.success(`${a.name} accent applied`);
                        }}
                        className={cn(
                          'h-9 w-9 rounded-full ring-offset-2 transition-transform hover:scale-110',
                          draft.branding.accentColor === a.value && 'ring-2 ring-slate-400'
                        )}
                        style={{ backgroundColor: a.value }}
                        aria-label={`${a.name} accent`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Corner radius">
                    <select className={inputCls} value={draft.branding.cornerRadius} onChange={(e) => change('branding', { cornerRadius: e.target.value as Settings['branding']['cornerRadius'] })}>
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra large</option>
                    </select>
                  </Field>
                  <Field label="Density">
                    <select className={inputCls} value={draft.branding.density} onChange={(e) => change('branding', { density: e.target.value as Settings['branding']['density'] })}>
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </Field>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  <Toggle label="Dark mode by default" hint="Applies when no stored preference exists" checked={draft.branding.darkModeDefault} onChange={(v) => change('branding', { darkModeDefault: v })} />
                  <Toggle label="Collapsed sidebar by default" checked={draft.branding.sidebarCollapsed} onChange={(v) => change('branding', { sidebarCollapsed: v })} />
                </div>
              </div>
            </Card>
          )}

          {section === 'billing' && (
            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Billing</CardTitle>
                <CardDescription>Rates, invoice numbering and late-fee policy</CardDescription>
              </div>
              <div className="grid gap-4 p-5 pt-4 sm:grid-cols-2">
                <Field label="Default hourly rate">
                  <input type="number" className={inputCls} value={draft.billing.defaultRate} onChange={(e) => change('billing', { defaultRate: Number(e.target.value) })} />
                </Field>
                <Field label="Invoice prefix">
                  <input className={inputCls} value={draft.billing.invoicePrefix} onChange={(e) => change('billing', { invoicePrefix: e.target.value })} />
                </Field>
                <Field label="Next invoice number">
                  <input type="number" className={inputCls} value={draft.billing.invoiceNextNumber} onChange={(e) => change('billing', { invoiceNextNumber: Number(e.target.value) })} />
                </Field>
                <Field label="Payment terms">
                  <select className={inputCls} value={draft.billing.paymentTerms} onChange={(e) => change('billing', { paymentTerms: e.target.value })}>
                    {['Due on receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Late fee %" hint={`Currently ${draft.billing.lateFeePercent}% after ${draft.billing.lateFeeGraceDays} grace days`}>
                  <input type="number" step="0.5" className={inputCls} value={draft.billing.lateFeePercent} onChange={(e) => change('billing', { lateFeePercent: Number(e.target.value) })} />
                </Field>
                <Field label="Grace days">
                  <input type="number" className={inputCls} value={draft.billing.lateFeeGraceDays} onChange={(e) => change('billing', { lateFeeGraceDays: Number(e.target.value) })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Invoice footer">
                    <textarea
                      className={cn(inputCls, 'h-auto py-2')}
                      rows={3}
                      value={draft.billing.invoiceFooter}
                      onChange={(e) => change('billing', { invoiceFooter: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2 divide-y divide-slate-100 dark:divide-slate-800/70">
                  <Toggle label="Accept card payments" checked={draft.billing.acceptCard} onChange={(v) => change('billing', { acceptCard: v })} />
                  <Toggle label="Accept ACH transfers" checked={draft.billing.acceptACH} onChange={(v) => change('billing', { acceptACH: v })} />
                  <Toggle label="Show trust balance on invoices" checked={draft.billing.showTrustOnInvoice} onChange={(v) => change('billing', { showTrustOnInvoice: v })} />
                </div>

                <div className="sm:col-span-2 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800/70">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Trust / IOLTA accounting</p>
                    <p className="text-xs text-slate-400">Client trust ledger rules enforced on every matter</p>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    <Toggle label="IOLTA trust account enabled" hint="Holds client funds in a segregated interest-bearing account" checked={draft.trust.ioltaEnabled} onChange={(v) => change('trust', { ioltaEnabled: v })} />
                    <Toggle label="Require monthly reconciliation" hint="Ledger must be reconciled to bank before month close" checked={draft.trust.requireReconciliation} onChange={(v) => change('trust', { requireReconciliation: v })} />
                    <Toggle label="Three-way match" hint="Ledger, bank statement and book balance must agree" checked={draft.trust.threeWayMatch} onChange={(v) => change('trust', { threeWayMatch: v })} />
                    <Toggle label="Overdraft alerts" hint="Notify trust accountant when a ledger goes negative" checked={draft.trust.overdraftAlerts} onChange={(v) => change('trust', { overdraftAlerts: v })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Reconciliation day of month">
                      <input type="number" min={1} max={31} className={inputCls} value={draft.trust.reconciliationDayOfMonth} onChange={(e) => change('trust', { reconciliationDayOfMonth: Number(e.target.value) })} />
                    </Field>
                    <Field label="Low balance threshold" hint="Alert when a client ledger falls below">
                      <input type="number" className={inputCls} value={draft.trust.lowBalanceThreshold} onChange={(e) => change('trust', { lowBalanceThreshold: Number(e.target.value) })} />
                    </Field>
                  </div>
                </div>
                <div className="sm:col-span-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900/60">
                  Preview: <span className="font-medium text-slate-700 dark:text-slate-200">{draft.billing.invoicePrefix}-{draft.billing.invoiceNextNumber}</span> · default rate {formatCurrency(draft.billing.defaultRate)}/hr · {draft.billing.paymentTerms}
                </div>
              </div>
            </Card>
          )}

          {section === 'integrations' && (
            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Calendar, documents, accounting and e-signature</CardDescription>
              </div>
              <div className="divide-y divide-slate-100 px-5 pb-5 dark:divide-slate-800/70">
                <Toggle label="E-Filing" hint="Electronic court filing via your jurisdiction clerks" checked={extra.efiling} onChange={(v) => changeExtra({ efiling: v })} />
                <Toggle label="Clio" hint="Two-way sync of matters, contacts and time" checked={extra.clio} onChange={(v) => changeExtra({ clio: v })} />
                <Toggle label="PracticePanther" hint="Import matters, trust ledgers and invoices" checked={extra.practicePanther} onChange={(v) => changeExtra({ practicePanther: v })} />
                {(
                  [
                    ['googleCalendar', 'Google Calendar', 'Sync court dates and deadlines'],
                    ['outlook365', 'Outlook 365', 'Mail, calendar and contacts'],
                    ['slack', 'Slack', 'Matter alerts and mentions'],
                    ['quickbooks', 'QuickBooks', 'Two-way invoice and payment sync'],
                    ['docusign', 'DocuSign', 'E-signature for engagements & contracts'],
                    ['dropbox', 'Dropbox', 'Document storage provider'],
                    ['netdocuments', 'NetDocuments', 'DMS integration'],
                    ['lexisNexis', 'LexisNexis', 'Research and citator service'],
                  ] as const
                ).map(([key, name, desc]) => (
                  <Toggle
                    key={key}
                    label={name}
                    hint={desc}
                    checked={draft.integrations[key]}
                    onChange={(v) => change('integrations', { [key]: v } as Partial<Settings['integrations']>)}
                  />
                ))}
              </div>
            </Card>
          )}

          {section === 'notifications' && (
            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Deadlines, invoices and mentions — channel by channel</CardDescription>
              </div>
              <div className="space-y-4 p-5 pt-4">
                <Field label="Email digest">
                  <select className={cn(inputCls, 'max-w-56')} value={draft.notifications.emailDigest} onChange={(e) => change('notifications', { emailDigest: e.target.value as Settings['notifications']['emailDigest'] })}>
                    <option value="off">Off</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </Field>
                <Field label="Deadline reminder lead time (days)" hint="Comma-separated, e.g. 30, 14, 7, 1">
                  <input
                    className={inputCls}
                    value={draft.notifications.deadlineReminderDays.join(', ')}
                    onChange={(e) =>
                      change('notifications', {
                        deadlineReminderDays: e.target.value
                          .split(',')
                          .map((n) => Number(n.trim()))
                          .filter((n) => Number.isFinite(n) && n > 0),
                      })
                    }
                  />
                </Field>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  <Toggle label="Overdue invoice alerts" checked={draft.notifications.invoiceOverdueAlerts} onChange={(v) => change('notifications', { invoiceOverdueAlerts: v })} />
                  <Toggle label="Mention alerts" checked={draft.notifications.mentionAlerts} onChange={(v) => change('notifications', { mentionAlerts: v })} />
                  <Toggle label="Browser push" checked={draft.notifications.browserPush} onChange={(v) => change('notifications', { browserPush: v })} />
                  <Toggle label="Sound" checked={draft.notifications.soundEnabled} onChange={(v) => change('notifications', { soundEnabled: v })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Quiet hours start">
                    <input type="time" className={inputCls} value={draft.notifications.quietHoursStart} onChange={(e) => change('notifications', { quietHoursStart: e.target.value })} />
                  </Field>
                  <Field label="Quiet hours end">
                    <input type="time" className={inputCls} value={draft.notifications.quietHoursEnd} onChange={(e) => change('notifications', { quietHoursEnd: e.target.value })} />
                  </Field>
                </div>
              </div>
            </Card>
          )}

          {section === 'security' && (
            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Security & compliance</CardTitle>
                <CardDescription>Authentication, sessions and audit retention</CardDescription>
              </div>
              <div className="divide-y divide-slate-100 px-5 pb-5 dark:divide-slate-800/70">
                <Toggle label="Require MFA for everyone" hint="Enforces TOTP or WebAuthn on all accounts" checked={draft.security.requireMfa} onChange={(v) => change('security', { requireMfa: v })} />
                <Toggle label="Allow SSO" hint={draft.security.ssoProvider ?? 'No provider configured'} checked={draft.security.allowSso} onChange={(v) => change('security', { allowSso: v })} />
                <Toggle label="Lock accounts after failed attempts" hint={`Threshold: ${draft.security.lockFailedAttempts}`} checked={draft.security.lockFailedAttempts > 0} onChange={(v) => change('security', { lockFailedAttempts: v ? 5 : 0 })} />
              </div>
              <div className="grid gap-4 border-t border-slate-100 p-5 pt-4 dark:border-slate-800 sm:grid-cols-2">
                <Field label="Session timeout (minutes)">
                  <input type="number" className={inputCls} value={draft.security.sessionTimeoutMinutes} onChange={(e) => change('security', { sessionTimeoutMinutes: Number(e.target.value) })} />
                </Field>
                <Field label="Password minimum length">
                  <input type="number" className={inputCls} value={draft.security.passwordMinLength} onChange={(e) => change('security', { passwordMinLength: Number(e.target.value) })} />
                </Field>
                <Field label="Audit log retention (days)">
                  <input type="number" className={inputCls} value={draft.security.auditLogRetentionDays} onChange={(e) => change('security', { auditLogRetentionDays: Number(e.target.value) })} />
                </Field>
                <Field label="IP allowlist" hint="Comma-separated CIDRs — empty allows all">
                  <input
                    className={inputCls}
                    value={draft.security.ipAllowlist.join(', ')}
                    onChange={(e) =>
                      change('security', {
                        ipAllowlist: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </Field>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* sticky save/discard bar (mobile) */}
      {dirty && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-crimson-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-crimson-900 dark:bg-slate-900/95 lg:hidden">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{dirtyCount} unsaved changes</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={discard}>Discard</Button>
            <Button size="sm" variant="primary" onClick={save}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}
