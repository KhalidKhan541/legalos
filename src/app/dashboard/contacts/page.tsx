'use client';

import { useMemo, useState } from 'react';
import {
  AtSign,
  Building2,
  Contact,
  MapPin,
  Phone,
  Search,
  Users,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { MOCK_CLIENTS, MOCK_CONTACTS, type Contact as ContactRecord } from '@/lib/mock-data';
import { cn, formatRelative } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────
   Presentational maps
   ──────────────────────────────────────────────────────────── */

type ContactKind = ContactRecord['kind'];

const KIND_META: Record<
  ContactKind,
  { label: string; variant: 'lg' | 'info' | 'warning' | 'success' | 'secondary' | 'danger' }
> = {
  client: { label: 'Client', variant: 'success' },
  'opposing-counsel': { label: 'Opposing counsel', variant: 'danger' },
  court: { label: 'Court / Judicial', variant: 'info' },
  vendor: { label: 'Vendor', variant: 'secondary' },
  referral: { label: 'Referral source', variant: 'warning' },
  expert: { label: 'Expert', variant: 'lg' },
};

const KIND_FILTERS: ContactKind[] = [
  'client',
  'opposing-counsel',
  'court',
  'vendor',
  'referral',
  'expert',
];

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default function ContactsPage() {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | ContactKind>('all');

  const contacts = MOCK_CONTACTS;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (kindFilter !== 'all' && contact.kind !== kindFilter) return false;
      if (!needle) return true;
      return (
        contact.name.toLowerCase().includes(needle) ||
        contact.title.toLowerCase().includes(needle) ||
        contact.organization.toLowerCase().includes(needle) ||
        contact.email.toLowerCase().includes(needle) ||
        contact.location.toLowerCase().includes(needle) ||
        contact.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [contacts, query, kindFilter]);

  const stats = useMemo(() => {
    const count = (kind: ContactKind) =>
      contacts.filter((contact) => contact.kind === kind).length;
    return {
      total: contacts.length,
      opposing: count('opposing-counsel'),
      experts: count('expert'),
      organizations: new Set(contacts.map((contact) => contact.organization)).size,
    };
  }, [contacts]);

  const clientNameById = useMemo(
    () => new Map(MOCK_CLIENTS.map((client) => [client.id, client.name])),
    []
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
            Contacts
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--lg-text)]">
            Contact Directory
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Opposing counsel, experts, vendors and client stakeholders — one searchable roll
            call.
          </p>
        </div>
        <Button leftIcon={<Contact className="h-4 w-4" />}>Add contact</Button>
      </header>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total contacts"
          value={stats.total}
          icon={<Contact className="h-5 w-5" />}
          hint="Across every practice area"
        />
        <MetricCard
          title="Opposing counsel"
          value={stats.opposing}
          icon={<Building2 className="h-5 w-5" />}
          iconTone="danger"
          hint="Adverse parties on record"
        />
        <MetricCard
          title="Experts & witnesses"
          value={stats.experts}
          icon={<Users className="h-5 w-5" />}
          iconTone="info"
          hint="Retained expert witnesses"
        />
        <MetricCard
          title="Organizations"
          value={stats.organizations}
          icon={<MapPin className="h-5 w-5" />}
          iconTone="success"
          hint="Distinct firms, courts and vendors"
        />
      </div>

      {/* Directory */}
      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row">
          <CardTitle className="flex items-center gap-2">
            <Contact className="h-4 w-4 text-crimson-600" />
            Directory
            <span className="ml-1 text-xs font-normal text-[var(--lg-text-muted)]">
              {filtered.length} of {contacts.length}
            </span>
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, firm, tag…"
                aria-label="Search contacts"
                className="lg-input lg-input-sm w-56 pl-8"
              />
            </div>

            <select
              aria-label="Filter by contact type"
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as 'all' | ContactKind)}
              className="lg-input lg-select h-9 w-auto text-sm"
            >
              <option value="all">All types</option>
              {KIND_FILTERS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_META[kind].label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="lg-empty">
              <p className="lg-empty-title">No contacts match these filters</p>
              <p className="lg-empty-description">
                Try a different search term, or pick another contact type.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setKindFilter('all');
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((contact) => {
                const kind = KIND_META[contact.kind];
                const linkedClient = contact.linkedClientId
                  ? clientNameById.get(contact.linkedClientId)
                  : null;

                return (
                  <article
                    key={contact.id}
                    className="flex flex-col rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface)] p-4 shadow-[var(--lg-shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--lg-border-strong)] hover:shadow-[var(--lg-shadow-md)]"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={contact.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--lg-text)]">
                          {contact.name}
                        </p>
                        <p className="truncate text-xs text-[var(--lg-text-secondary)]">
                          {contact.title}
                        </p>
                        <p className="truncate text-[11px] text-[var(--lg-text-muted)]">
                          {contact.organization}
                        </p>
                      </div>
                      <Badge variant={kind.variant} size="sm">
                        {kind.label}
                      </Badge>
                    </div>

                    <ul className="mt-3 space-y-1.5 border-t border-[var(--lg-border-subtle)] pt-3 text-[11px]">
                      <li className="flex items-center gap-2">
                        <AtSign className="h-3.5 w-3.5 shrink-0 text-[var(--lg-text-muted)]" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="truncate text-crimson-600 hover:underline dark:text-crimson-400"
                        >
                          {contact.email}
                        </a>
                      </li>
                      <li className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--lg-text-muted)]" />
                        <span className="truncate text-[var(--lg-text-secondary)]">
                          {contact.phone}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--lg-text-muted)]" />
                        <span className="truncate text-[var(--lg-text-secondary)]">
                          {contact.location}
                        </span>
                      </li>
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {linkedClient && (
                        <Badge variant="outline" size="sm">
                          {linkedClient}
                        </Badge>
                      )}
                      {contact.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="lg-chip">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p
                      className={cn(
                        'mt-auto pt-3 text-[11px] text-[var(--lg-text-muted)]'
                      )}
                    >
                      Last contact {formatRelative(contact.lastContact)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
