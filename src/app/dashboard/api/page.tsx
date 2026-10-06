'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Code2,
  Copy,
  Eye,
  EyeOff,
  FileKey2,
  KeyRound,
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Webhook,
  X,
  Zap,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { MOCK_API_KEYS, type ApiKey } from '@/lib/mock-data';
import { cn, formatDate, formatNumber, formatRelative } from '@/lib/utils';

/* ── Constants ───────────────────────────────────────────────── */

const BASE_URLS = {
  live: 'https://api.legalos.com/v1',
  test: 'https://sandbox.legalos.com/v1',
} as const;

type Environment = keyof typeof BASE_URLS;

const SCOPE_GROUPS: { group: string; scopes: { scope: string; blurb: string }[] }[] = [
  {
    group: 'Matters',
    scopes: [
      { scope: 'matters:read', blurb: 'Read matter records and metadata' },
      { scope: 'matters:write', blurb: 'Create and update matters' },
    ],
  },
  {
    group: 'Clients & intake',
    scopes: [
      { scope: 'clients:read', blurb: 'Read client profiles' },
      { scope: 'clients:write', blurb: 'Create and update clients' },
      { scope: 'intake:write', blurb: 'Submit intake and conflict checks' },
    ],
  },
  {
    group: 'Documents',
    scopes: [
      { scope: 'documents:read', blurb: 'Download documents and versions' },
      { scope: 'documents:write', blurb: 'Upload and mutate documents' },
    ],
  },
  {
    group: 'Billing',
    scopes: [
      { scope: 'invoices:read', blurb: 'Read invoices and payments' },
      { scope: 'invoices:write', blurb: 'Issue and adjust invoices' },
      { scope: 'trust:read', blurb: 'Read trust / IOLTA ledgers' },
    ],
  },
  {
    group: 'Time',
    scopes: [
      { scope: 'time:read', blurb: 'Read time entries' },
      { scope: 'time:write', blurb: 'Create and submit time entries' },
    ],
  },
  {
    group: 'Platform',
    scopes: [
      { scope: 'webhooks:manage', blurb: 'Manage endpoints and subscriptions' },
      { scope: 'settings:read', blurb: 'Read firm settings' },
    ],
  },
];

const ALL_SCOPES = SCOPE_GROUPS.flatMap((group) => group.scopes.map((item) => item.scope));

const WEBHOOK_EVENTS = [
  'matter.created',
  'matter.updated',
  'client.updated',
  'invoice.paid',
  'invoice.overdue',
  'document.uploaded',
  'time.entry.submitted',
  'filing.accepted',
];

type Delivery = {
  id: string;
  event: string;
  status: number;
  ms: number;
  attempts: number;
  at: string;
};

const DELIVERIES: Delivery[] = [
  { id: 'dv_01', event: 'invoice.paid', status: 200, ms: 142, attempts: 1, at: '2026-10-06T09:12:00Z' },
  { id: 'dv_02', event: 'matter.updated', status: 200, ms: 96, attempts: 1, at: '2026-10-06T08:47:00Z' },
  { id: 'dv_03', event: 'filing.accepted', status: 500, ms: 1_284, attempts: 3, at: '2026-10-06T08:21:00Z' },
  { id: 'dv_04', event: 'document.uploaded', status: 200, ms: 233, attempts: 1, at: '2026-10-06T07:58:00Z' },
  { id: 'dv_05', event: 'invoice.overdue', status: 410, ms: 88, attempts: 5, at: '2026-10-05T23:04:00Z' },
  { id: 'dv_06', event: 'time.entry.submitted', status: 200, ms: 174, attempts: 1, at: '2026-10-05T21:36:00Z' },
];

type LogRow = {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  status: number;
  ms: number;
  key: string;
  at: string;
};

const REQUEST_LOG: LogRow[] = [
  { id: 'rq_01', method: 'GET', path: '/v1/matters?status=open', status: 200, ms: 84, key: 'Production — Document Sync', at: '2026-10-06T11:52:00Z' },
  { id: 'rq_02', method: 'POST', path: '/v1/documents/upload', status: 201, ms: 412, key: 'Production — Document Sync', at: '2026-10-06T11:48:00Z' },
  { id: 'rq_03', method: 'GET', path: '/v1/clients/cl_004', status: 200, ms: 61, key: 'Sandbox — CRM Integration', at: '2026-10-06T11:31:00Z' },
  { id: 'rq_04', method: 'PATCH', path: '/v1/matters/mt_012', status: 429, ms: 12, key: 'Production — Document Sync', at: '2026-10-06T11:20:00Z' },
  { id: 'rq_05', method: 'POST', path: '/v1/intake', status: 422, ms: 138, key: 'Sandbox — CRM Integration', at: '2026-10-06T10:58:00Z' },
  { id: 'rq_06', method: 'GET', path: '/v1/invoices?overdue=true', status: 200, ms: 209, key: 'Legacy — Billing Export', at: '2026-10-06T10:44:00Z' },
  { id: 'rq_07', method: 'DELETE', path: '/v1/webhooks/wh_002', status: 500, ms: 1_942, key: 'Production — Document Sync', at: '2026-10-06T10:12:00Z' },
  { id: 'rq_08', method: 'GET', path: '/v1/time/entries?from=2026-10-01', status: 200, ms: 97, key: 'Sandbox — CRM Integration', at: '2026-10-06T09:37:00Z' },
];

const RATE_LIMITS = [
  { label: 'Requests / minute', used: 842, limit: 1_000, reset: 'resets in 12s' },
  { label: 'Requests / day', used: 148_320, limit: 250_000, reset: 'resets 00:00 UTC' },
  { label: 'Webhook deliveries / hour', used: 4_780, limit: 5_000, reset: 'resets 10:00 UTC' },
  { label: 'Report exports / day', used: 23, limit: 30, reset: 'resets 00:00 UTC' },
];

const METHOD_VARIANT: Record<LogRow['method'], BadgeVariant> = {
  GET: 'info',
  POST: 'success',
  PATCH: 'warning',
  DELETE: 'danger',
};

/* ── Small helpers ───────────────────────────────────────────── */

async function copyText(value: string, message: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(message);
  } catch {
    toast.error('Copy failed — select the text and copy manually');
  }
}

function randomHex(length: number): string {
  const alphabet = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function statusTone(status: number): BadgeVariant {
  if (status >= 500) return 'danger';
  if (status >= 400) return 'warning';
  return 'success';
}

function latencyClass(ms: number): string {
  if (ms >= 900) return 'text-red-600 dark:text-red-300';
  if (ms >= 400) return 'text-amber-600 dark:text-amber-300';
  return 'text-emerald-600 dark:text-emerald-300';
}

function limitTone(ratio: number): { bar: string; tone: BadgeVariant; label: string } {
  if (ratio >= 0.9) {
    return {
      bar: 'bg-red-600',
      tone: 'danger',
      label: 'Over 90% — requests are throttled with HTTP 429',
    };
  }
  if (ratio >= 0.75) {
    return {
      bar: 'bg-amber-500',
      tone: 'warning',
      label: 'Over 75% — approaching the hard limit',
    };
  }
  return { bar: 'bg-emerald-500', tone: 'success', label: 'Healthy headroom' };
}

/* ── Page ────────────────────────────────────────────────────── */

export default function ApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
  const [armedId, setArmedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftEnv, setDraftEnv] = useState<Environment>('live');
  const [draftScopes, setDraftScopes] = useState<string[]>(['matters:read', 'documents:read']);
  const [nameError, setNameError] = useState<string | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const [env, setEnv] = useState<Environment>('live');
  const [snippetTab, setSnippetTab] = useState('curl');

  const [webhookUrl, setWebhookUrl] = useState('https://ops.halloranreyes.example.com/hooks/legalos');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    'invoice.paid',
    'invoice.overdue',
    'matter.updated',
    'filing.accepted',
  ]);
  const [secretVisible, setSecretVisible] = useState(false);
  const [deliveries] = useState<Delivery[]>(DELIVERIES);

  const activeKeys = keys.filter((key) => key.status === 'active');
  const requests30d = keys.reduce((total, key) => total + key.requests30d, 0);
  const baseUrl = BASE_URLS[env];
  const sampleKey = activeKeys[0]?.masked ?? 'lg_live_9f2a••••••••••••••••••4c7e';

  const snippets = useMemo(
    () => ({
      curl: [
        `curl ${baseUrl}/matters \\`,
        `  -H "Authorization: Bearer ${sampleKey}" \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -G --data-urlencode "status=open"`,
      ].join('\n'),
      node: [
        `import { LegalOS } from '@legalos/node';`,
        ``,
        `const client = new LegalOS({`,
        `  apiKey: '${sampleKey}',`,
        `  baseUrl: '${baseUrl}',`,
        `});`,
        ``,
        `const { data: matters } = await client.matters.list({ status: 'open' });`,
      ].join('\n'),
      python: [
        `import legalos`,
        ``,
        `client = legalos.Client(`,
        `    api_key="${sampleKey}",`,
        `    base_url="${baseUrl}",`,
        `)`,
        ``,
        `matters = client.matters.list(status="open")`,
      ].join('\n'),
    }),
    [baseUrl, sampleKey]
  );

  /* ── Key actions ─────────────────────────────────────────── */

  const handleRevoke = (key: ApiKey) => {
    if (armedId !== key.id) {
      setArmedId(key.id);
      toast('Click again to confirm revoking this key', { icon: '⚠️' });
      return;
    }
    setKeys((current) =>
      current.map((item) => (item.id === key.id ? { ...item, status: 'revoked' } : item))
    );
    setArmedId(null);
    toast.success(`Revoked “${key.name}”`);
  };

  const resetModal = () => {
    setModalOpen(false);
    setDraftName('');
    setDraftEnv('live');
    setDraftScopes(['matters:read', 'documents:read']);
    setNameError(null);
    setScopeError(null);
    setRevealedSecret(null);
  };

  const toggleScope = (scope: string) => {
    setDraftScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]
    );
    setScopeError(null);
  };

  const handleCreate = () => {
    const name = draftName.trim();
    if (name.length < 3) {
      setNameError('Give the key a name of at least 3 characters.');
      return;
    }
    if (draftScopes.length === 0) {
      setScopeError('Select at least one scope.');
      return;
    }

    const prefix = draftEnv === 'live' ? 'lg_live' : 'lg_test';
    const head = randomHex(4);
    const tail = randomHex(4);
    const secret = `${prefix}_${head}${randomHex(16)}${tail}`;

    const created: ApiKey = {
      id: `ak_${randomHex(6)}`,
      name,
      prefix,
      masked: `${prefix}_${head}••••••••••••••••••${tail}`,
      scopes: draftScopes,
      environment: draftEnv,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: null,
      createdBy: 'Margaret Halloran',
      requests30d: 0,
      status: 'active',
      ipAllowlist: [],
      webhookUrl: null,
    };

    setKeys((current) => [created, ...current]);
    setRevealedSecret(secret);
    toast.success('API key created');
  };

  /* ── Webhook actions ─────────────────────────────────────── */

  const toggleEvent = (event: string) => {
    setWebhookEvents((current) =>
      current.includes(event) ? current.filter((item) => item !== event) : [...current, event]
    );
  };

  const signingSecret = 'whsec_7c41f0a9d2e64b18b3f5a0c9d7e21463';

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson-600/10 text-crimson-600">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
              API &amp; integrations
            </h1>
            <Badge variant="lg" size="sm" className="ml-1">
              v1
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-[var(--lg-text-muted)]">
            Keys, quickstart snippets, rate limits, webhooks, and the live request log for
            programmatic access to LegalOS.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create API key
        </Button>
      </header>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active keys"
          value={formatNumber(activeKeys.length)}
          change={0}
          changeLabel="snapshot"
          hint={`${keys.length} keys issued in total`}
          icon={<KeyRound className="h-5 w-5" />}
        />
        <MetricCard
          title="Requests (30d)"
          value={formatNumber(requests30d, { compact: true })}
          change={12.4}
          changeLabel="vs prior 30 days"
          hint="Across every live and test key"
          icon={<Zap className="h-5 w-5" />}
          iconTone="info"
        />
        <MetricCard
          title="Error rate"
          value="1.8%"
          change={-0.6}
          changeLabel="vs prior 30 days"
          hint="4xx and 5xx responses combined"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="warning"
          positiveIsGood={false}
        />
        <MetricCard
          title="p95 latency"
          value="412 ms"
          change={-4.2}
          changeLabel="vs prior 30 days"
          hint="Measured at the API edge"
          icon={<Clock className="h-5 w-5" />}
          iconTone="success"
        />
      </div>

      {/* ── Keys table ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>API keys</CardTitle>
            <CardDescription>
              Secrets are shown masked. Revoking is a two-step action — click once to arm, again to
              confirm.
            </CardDescription>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New key
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="lg-table-wrapper">
            <table className="lg-table lg-table-compact">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Scopes</th>
                  <th scope="col">Env</th>
                  <th scope="col">Requests 30d</th>
                  <th scope="col">Last used</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="lg-table-align-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => {
                  const armed = armedId === key.id;
                  const revoked = key.status !== 'active';
                  return (
                    <tr key={key.id}>
                      <td className="lg-table-cell-primary">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-2 text-[var(--lg-text)]">
                            {key.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyText(key.masked, 'Copied masked key reference')
                            }
                            className="flex items-center gap-1.5 text-left font-mono text-xs text-[var(--lg-text-muted)] transition-colors hover:text-crimson-600"
                            title="Copy key reference"
                          >
                            {key.masked}
                            <Copy className="h-3 w-3 shrink-0" aria-hidden="true" />
                          </button>
                          <span className="text-2xs uppercase tracking-wide text-[var(--lg-text-muted)]">
                            created {formatDate(key.createdAt)} · by {key.createdBy}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex max-w-[18rem] flex-wrap gap-1">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" size="sm" className="font-mono">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge variant={key.environment === 'live' ? 'lg' : 'secondary'} size="sm">
                          {key.environment === 'live' ? 'live' : 'sandbox'}
                        </Badge>
                      </td>
                      <td className="tabular-nums">
                        {formatNumber(key.requests30d, { compact: true })}
                      </td>
                      <td className="whitespace-nowrap">
                        {key.lastUsedAt ? (
                          <span title={formatDate(key.lastUsedAt, 'PPpp')}>
                            {formatRelative(key.lastUsedAt)}
                          </span>
                        ) : (
                          <span className="text-[var(--lg-text-muted)]">never</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={
                            key.status === 'active'
                              ? 'success'
                              : key.status === 'revoked'
                                ? 'danger'
                                : 'secondary'
                          }
                          dot
                          size="sm"
                        >
                          {key.status}
                        </Badge>
                      </td>
                      <td className="lg-table-align-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            aria-label={`Copy ${key.name}`}
                            onClick={() => copyText(key.masked, 'Copied masked key reference')}
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={armed ? 'danger' : 'ghost'}
                            size="sm"
                            disabled={revoked}
                            onClick={() => handleRevoke(key)}
                            onBlur={() => {
                              if (armedId === key.id) setArmedId(null);
                            }}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                          >
                            {armed ? 'Confirm revoke' : revoked ? 'Revoked' : 'Revoke'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Quickstart + rate limits ───────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Quickstart</CardTitle>
              <CardDescription>
                Switching the environment rewrites the base URL in every snippet below.
              </CardDescription>
            </div>

            <div
              role="group"
              aria-label="Environment"
              className="flex items-center rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface-sunken)] p-1"
            >
              {(['live', 'test'] as Environment[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setEnv(option)}
                  aria-pressed={env === option}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    env === option
                      ? 'bg-[var(--lg-surface)] text-[var(--lg-text)] shadow-[var(--lg-shadow-sm)]'
                      : 'text-[var(--lg-text-muted)] hover:text-[var(--lg-text)]'
                  )}
                >
                  {option === 'live' ? 'Live' : 'Sandbox'}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={env === 'live' ? 'lg' : 'secondary'} size="sm">
                {env === 'live' ? 'Live base URL' : 'Sandbox base URL'}
              </Badge>
              <code className="rounded-lg bg-[var(--lg-surface-sunken)] px-2.5 py-1 font-mono text-xs text-[var(--lg-text)]">
                {baseUrl}
              </code>
            </div>

            <Tabs value={snippetTab} onValueChange={setSnippetTab} variant="pill">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="node">Node</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    copyText(snippets[snippetTab as keyof typeof snippets], 'Snippet copied')
                  }
                  leftIcon={<Copy className="h-4 w-4" />}
                >
                  Copy
                </Button>
              </div>

              {(['curl', 'node', 'python'] as const).map((id) => (
                <TabsContent key={id} value={id}>
                  <pre className="overflow-x-auto rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface-sunken)] p-4 font-mono text-xs leading-relaxed text-[var(--lg-text-secondary)]">
                    <code>{snippets[id]}</code>
                  </pre>
                </TabsContent>
              ))}
            </Tabs>

            <p className="flex items-start gap-2 text-xs text-[var(--lg-text-muted)]">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Keep secrets on your server. Never ship a live key in browser or mobile code.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Rate limits</CardTitle>
              <CardDescription>Warnings start at 75%, throttling at 90%.</CardDescription>
            </div>
            <RefreshCw className="h-4 w-4 text-[var(--lg-text-muted)]" aria-hidden="true" />
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            {RATE_LIMITS.map((limit) => {
              const ratio = limit.used / limit.limit;
              const tone = limitTone(ratio);
              return (
                <div key={limit.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--lg-text)]">
                      {limit.label}
                    </span>
                    <span className="text-xs tabular-nums text-[var(--lg-text-muted)]">
                      {formatNumber(limit.used)} / {formatNumber(limit.limit)}
                    </span>
                  </div>

                  <div
                    className="lg-progress mt-2"
                    role="progressbar"
                    aria-valuenow={Math.round(ratio * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={limit.label}
                  >
                    <div
                      className={cn('lg-progress-bar', tone.bar)}
                      style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'text-2xs font-medium',
                        ratio >= 0.9
                          ? 'text-red-600 dark:text-red-300'
                          : ratio >= 0.75
                            ? 'text-amber-600 dark:text-amber-300'
                            : 'text-[var(--lg-text-muted)]'
                      )}
                    >
                      {formatPercentSafe(ratio)} used
                      {ratio >= 0.75 ? ` — ${tone.label}` : ''}
                    </span>
                    <span className="text-2xs text-[var(--lg-text-muted)]">{limit.reset}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── Webhook endpoint ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-crimson-600" aria-hidden="true" />
              Webhook endpoint
            </CardTitle>
            <CardDescription>
              Signed with HMAC-SHA256. Verify the <code className="font-mono">X-LegalOS-Signature</code>{' '}
              header before acting on a delivery.
            </CardDescription>
          </div>
          <Badge variant="success" dot size="sm">
            Enabled
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6 p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="lg-label" htmlFor="webhook-url">
                Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  id="webhook-url"
                  className="lg-input font-mono text-xs"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => copyText(webhookUrl, 'Endpoint URL copied')}
                  aria-label="Copy endpoint URL"
                  icon
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="lg-label" htmlFor="webhook-secret">
                Signing secret
              </label>
              <div className="flex gap-2">
                <input
                  id="webhook-secret"
                  readOnly
                  className="lg-input font-mono text-xs"
                  value={secretVisible ? signingSecret : 'whsec_••••••••••••••••••••••••••••••'}
                />
                <Button
                  variant="secondary"
                  onClick={() => setSecretVisible((visible) => !visible)}
                  aria-label={secretVisible ? 'Hide signing secret' : 'Reveal signing secret'}
                  icon
                >
                  {secretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => copyText(signingSecret, 'Signing secret copied')}
                  aria-label="Copy signing secret"
                  icon
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <p className="lg-label">Subscribed events</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {WEBHOOK_EVENTS.map((event) => {
                const checked = webhookEvents.includes(event);
                return (
                  <label
                    key={event}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-colors',
                      checked
                        ? 'border-crimson-600/40 bg-crimson-600/5 text-[var(--lg-text)]'
                        : 'border-[var(--lg-border)] text-[var(--lg-text-secondary)] hover:border-[var(--lg-border-strong)]'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEvent(event)}
                      className="h-3.5 w-3.5 accent-[#dc2626]"
                    />
                    <span className="truncate font-mono">{event}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => toast.success(`Saved ${webhookEvents.length} event subscriptions`)}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Save subscriptions
              </Button>
              <span className="text-xs text-[var(--lg-text-muted)]">
                {webhookEvents.length} of {WEBHOOK_EVENTS.length} events enabled
              </span>
            </div>
          </div>

          <div>
            <p className="lg-label mb-2">Recent deliveries</p>
            <div className="lg-table-wrapper">
              <table className="lg-table lg-table-compact">
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="lg-table-align-right">
                      Latency
                    </th>
                    <th scope="col" className="lg-table-align-right">
                      Attempts
                    </th>
                    <th scope="col" className="lg-table-align-right">
                      Delivered
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td className="lg-table-cell-primary">
                        <span className="font-mono text-xs">{delivery.event}</span>
                      </td>
                      <td>
                        <Badge variant={statusTone(delivery.status)} size="sm" className="font-mono">
                          {delivery.status}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          'lg-table-align-right tabular-nums',
                          latencyClass(delivery.ms)
                        )}
                      >
                        {formatNumber(delivery.ms)} ms
                      </td>
                      <td className="lg-table-align-right tabular-nums">
                        {delivery.attempts > 1 ? (
                          <Badge variant="warning" size="sm">
                            retry {delivery.attempts}
                          </Badge>
                        ) : (
                          '1'
                        )}
                      </td>
                      <td className="lg-table-align-right whitespace-nowrap">
                        {formatRelative(delivery.at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Request log ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Request log</CardTitle>
            <CardDescription>
              Most recent API calls across every key — latency is coloured once it passes 400 ms.
            </CardDescription>
          </div>
          <Badge variant="outline" size="sm">
            Last 24 hours
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="lg-table-wrapper">
            <table className="lg-table lg-table-compact">
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col">Endpoint</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="lg-table-align-right">
                    Latency
                  </th>
                  <th scope="col">Key</th>
                  <th scope="col" className="lg-table-align-right">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {REQUEST_LOG.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Badge variant={METHOD_VARIANT[row.method]} size="sm" className="font-mono">
                        {row.method}
                      </Badge>
                    </td>
                    <td className="lg-table-cell-primary font-mono text-xs">{row.path}</td>
                    <td>
                      <span
                        className={cn(
                          'font-mono text-xs font-semibold',
                          row.status >= 500
                            ? 'text-red-600 dark:text-red-300'
                            : row.status >= 400
                              ? 'text-amber-600 dark:text-amber-300'
                              : 'text-emerald-600 dark:text-emerald-300'
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'lg-table-align-right tabular-nums',
                        latencyClass(row.ms)
                      )}
                    >
                      {formatNumber(row.ms)} ms
                    </td>
                    <td>
                      <span className="flex items-center gap-2 text-xs">
                        <Avatar
                          size="xs"
                          name={row.key}
                          color="#dc2626"
                        />
                        <span className="truncate">{row.key}</span>
                      </span>
                    </td>
                    <td className="lg-table-align-right whitespace-nowrap text-xs">
                      {formatDate(row.at, 'MMM d, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create key modal ───────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-key-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !revealedSecret) resetModal();
          }}
        >
          <div
            className="absolute inset-0 bg-[var(--lg-surface-overlay)] backdrop-blur-sm"
            onClick={() => {
              if (!revealedSecret) resetModal();
            }}
          />

          <div className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--lg-border)] bg-[var(--lg-surface)] shadow-[var(--lg-shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--lg-border)] px-5 py-4">
              <div>
                <h2
                  id="create-key-title"
                  className="text-sm font-semibold text-[var(--lg-text)]"
                >
                  {revealedSecret ? 'Your new API key' : 'Create API key'}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--lg-text-muted)]">
                  {revealedSecret
                    ? 'Copy it now — the secret is never shown again.'
                    : 'Name the key, pick its environment, and grant only the scopes it needs.'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                aria-label="Close dialog"
                className="rounded-lg p-1 text-[var(--lg-text-muted)] transition-colors hover:bg-[var(--lg-surface-muted)] hover:text-[var(--lg-text)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {revealedSecret ? (
              <div className="space-y-4 p-5">
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="text-xs">
                    This is the only time the full secret is displayed. Store it in your secrets
                    manager before closing this dialog.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface-sunken)] p-3">
                  <code className="min-w-0 flex-1 break-all font-mono text-xs text-[var(--lg-text)]">
                    {revealedSecret}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => copyText(revealedSecret, 'Secret copied to clipboard')}
                    leftIcon={<Copy className="h-4 w-4" />}
                  >
                    Copy
                  </Button>
                </div>

                <ul className="space-y-1.5 text-xs text-[var(--lg-text-muted)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                    Base URL: {BASE_URLS[draftEnv]}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                    {draftScopes.length} scopes granted
                  </li>
                </ul>

                <div className="flex justify-end">
                  <Button onClick={resetModal}>I&apos;ve stored the secret</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="lg-label" htmlFor="key-name">
                      Key name
                    </label>
                    <input
                      id="key-name"
                      className="lg-input"
                      placeholder="e.g. DMS sync — production"
                      value={draftName}
                      aria-invalid={nameError ? 'true' : undefined}
                      onChange={(event) => {
                        setDraftName(event.target.value);
                        setNameError(null);
                      }}
                    />
                    {nameError && <p className="lg-field-error">{nameError}</p>}
                  </div>

                  <div>
                    <label className="lg-label" htmlFor="key-env">
                      Environment
                    </label>
                    <select
                      id="key-env"
                      className="lg-input lg-select"
                      value={draftEnv}
                      onChange={(event) => setDraftEnv(event.target.value as Environment)}
                    >
                      <option value="live">Live — real data, real writes</option>
                      <option value="test">Sandbox — isolated test data</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="lg-label mb-0">Scoped permissions</p>
                    <button
                      type="button"
                      className="text-xs font-medium text-crimson-600 hover:underline"
                      onClick={() =>
                        setDraftScopes((current) =>
                          current.length === ALL_SCOPES.length ? [] : [...ALL_SCOPES]
                        )
                      }
                    >
                      {draftScopes.length === ALL_SCOPES.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>

                  <div className="mt-2 space-y-3">
                    {SCOPE_GROUPS.map((group) => (
                      <div key={group.group}>
                        <p className="text-2xs font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                          {group.group}
                        </p>
                        <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {group.scopes.map(({ scope, blurb }) => {
                            const checked = draftScopes.includes(scope);
                            return (
                              <label
                                key={scope}
                                className={cn(
                                  'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                                  checked
                                    ? 'border-crimson-600/40 bg-crimson-600/5'
                                    : 'border-[var(--lg-border)] hover:border-[var(--lg-border-strong)]'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleScope(scope)}
                                  className="mt-0.5 h-3.5 w-3.5 accent-[#dc2626]"
                                />
                                <span className="min-w-0">
                                  <span className="block truncate font-mono text-xs text-[var(--lg-text)]">
                                    {scope}
                                  </span>
                                  <span className="block text-2xs text-[var(--lg-text-muted)]">
                                    {blurb}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {scopeError && <p className="lg-field-error">{scopeError}</p>}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[var(--lg-border)] pt-4">
                  <span className="text-xs text-[var(--lg-text-muted)]">
                    {draftScopes.length} scope{draftScopes.length === 1 ? '' : 's'} selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={resetModal}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} leftIcon={<FileKey2 className="h-4 w-4" />}>
                      Create key
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** 0.842 → "84%" — small helper kept local to avoid percent rounding surprises. */
function formatPercentSafe(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
