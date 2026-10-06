'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BadgeCheck,
  Building2,
  Clock,
  FileSignature,
  Gavel,
  Lock,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldHalf,
  UserPlus,
  Users,
  UsersRound,
  X,
} from 'lucide-react';

import { Avatar, type AvatarPresence } from '@/components/ui/Avatar';
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
import { MOCK_TEAM, type TeamMember } from '@/lib/mock-data';
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRelative,
} from '@/lib/utils';

/* ── Roles ───────────────────────────────────────────────────── */

const ROLES = [
  'Partner',
  'Associate',
  'Paralegal',
  'Legal Assistant',
  'Of Counsel',
  'Contractor',
] as const;
type Role = (typeof ROLES)[number];

const ROLE_VARIANT: Record<Role, BadgeVariant> = {
  Partner: 'lg',
  Associate: 'info',
  Paralegal: 'secondary',
  'Legal Assistant': 'default',
  'Of Counsel': 'warning',
  Contractor: 'outline',
};

const ROLE_CARDS: { role: Role; description: string; icon: React.ReactNode }[] = [
  {
    role: 'Partner',
    description:
      'Equity and non-equity partners. Owns client relationships, signs off on billing, and holds locked permissions on every record.',
    icon: <BadgeCheck className="h-4 w-4" />,
  },
  {
    role: 'Associate',
    description:
      'Fee earners carrying a matter load. Records time, drafts work product, and reports against utilization targets.',
    icon: <Gavel className="h-4 w-4" />,
  },
  {
    role: 'Paralegal',
    description:
      'Certified paralegals running discovery, filing, and exhibit work under attorney supervision.',
    icon: <FileSignature className="h-4 w-4" />,
  },
  {
    role: 'Legal Assistant',
    description:
      'Scheduling, calendaring, intake triage, and correspondence. Sees client data but not billing or trust.',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    role: 'Of Counsel',
    description:
      'Senior advisors and specialists. Full matter access with reports, without firm administration rights.',
    icon: <ShieldHalf className="h-4 w-4" />,
  },
  {
    role: 'Contractor',
    description:
      'Contract attorneys and staff on scoped engagements. Least-privilege access tied to assigned matters only.',
    icon: <Users className="h-4 w-4" />,
  },
];

function canonicalRole(role: string): Role {
  const lower = role.toLowerCase();
  if (lower.includes('of counsel')) return 'Of Counsel';
  if (lower.includes('partner')) return 'Partner';
  if (lower.includes('associate')) return 'Associate';
  if (lower.includes('paralegal')) return 'Paralegal';
  if (lower.includes('assistant')) return 'Legal Assistant';
  return 'Contractor';
}

/* ── Permissions matrix — 7 permissions × 6 roles ────────────── */

const PERMISSIONS: { id: string; label: string; hint: string }[] = [
  { id: 'billing', label: 'Billing & invoices', hint: 'Rates, invoices, write-offs' },
  { id: 'trust', label: 'Trust / IOLTA', hint: 'Client ledgers and reconciliation' },
  { id: 'confidential', label: 'Confidential documents', hint: 'Sealed and privileged files' },
  { id: 'client', label: 'Client data (PII)', hint: 'Profiles, contacts, notes' },
  { id: 'reports', label: 'Reports & exports', hint: 'Firm analytics and CSV/PDF' },
  { id: 'admin', label: 'Admin & integrations', hint: 'Settings, API keys, webhooks' },
  { id: 'team', label: 'Team & permissions', hint: 'Invites, roles, access review' },
];

/** Column 0 is the locked Owner / Partner column; the rest are the 5 editable roles. */
const MATRIX_COLUMNS = ['Owner / Partner', 'Associate', 'Paralegal', 'Legal Assistant', 'Of Counsel', 'Contractor'] as const;

type MatrixState = Record<string, boolean[]>;

const INITIAL_MATRIX: MatrixState = {
  billing: [true, true, false, false, true, false],
  trust: [true, false, false, false, false, false],
  confidential: [true, true, true, false, true, false],
  client: [true, true, true, true, true, false],
  reports: [true, false, true, false, true, false],
  admin: [true, false, false, false, false, false],
  team: [true, false, false, false, false, false],
};

/* ── Member presentation maps ───────────────────────────────── */

const PRESENCE: Record<TeamMember['status'], AvatarPresence> = {
  active: 'online',
  away: 'away',
  sabbatical: 'offline',
  inactive: 'offline',
};

const STATUS_VARIANT: Record<TeamMember['status'], BadgeVariant> = {
  active: 'success',
  away: 'warning',
  sabbatical: 'info',
  inactive: 'secondary',
};

/** Deterministic "last active" offsets (minutes) — one per fixture member. */
const LAST_ACTIVE_MINUTES = [4, 19, 63, 11, 142, 37, 8, 1_286, 26, 8_940];
const REF_DATE = new Date('2026-10-06T12:00:00Z');

function lastActiveFor(index: number): string {
  const minutes = LAST_ACTIVE_MINUTES[index % LAST_ACTIVE_MINUTES.length];
  return new Date(REF_DATE.getTime() - minutes * 60_000).toISOString();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

type Invite = {
  id: string;
  name: string;
  email: string;
  role: Role;
  sentAt: string;
};

const INITIAL_INVITES: Invite[] = [
  {
    id: 'iv_01',
    name: 'Harper Lindqvist',
    email: 'hlindqvist@halloranreyes.example.com',
    role: 'Associate',
    sentAt: '2026-10-05T14:20:00Z',
  },
  {
    id: 'iv_02',
    name: 'Tomas Beringer',
    email: 'tberinger@halloranreyes.example.com',
    role: 'Paralegal',
    sentAt: '2026-10-03T09:05:00Z',
  },
];

/* ── Page ────────────────────────────────────────────────────── */

export default function TeamPage() {
  const [roles, setRoles] = useState<Record<string, Role>>(() =>
    Object.fromEntries(MOCK_TEAM.map((member) => [member.id, canonicalRole(member.role)]))
  );
  const [query, setQuery] = useState('');
  const [matrix, setMatrix] = useState<MatrixState>(INITIAL_MATRIX);
  const [invites, setInvites] = useState<Invite[]>(INITIAL_INVITES);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Associate');
  const [inviteNote, setInviteNote] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const members = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_TEAM;
    return MOCK_TEAM.filter(
      (member) =>
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        member.department.toLowerCase().includes(q)
    );
  }, [query]);

  const stats = useMemo(() => {
    const headcount = MOCK_TEAM.length;
    const avgUtilization =
      MOCK_TEAM.reduce((total, member) => total + member.utilization, 0) / (headcount || 1);
    const avgRate =
      MOCK_TEAM.reduce((total, member) => total + member.hourlyRate, 0) / (headcount || 1);
    const admitted = MOCK_TEAM.filter((member) => member.barAdmissions.length > 0).length;
    const totalMatters = MOCK_TEAM.reduce((total, member) => total + member.matters, 0);
    return { headcount, avgUtilization, avgRate, admitted, totalMatters };
  }, []);

  const roleCounts = useMemo(() => {
    const counts = Object.fromEntries(ROLES.map((role) => [role, 0])) as Record<Role, number>;
    for (const member of MOCK_TEAM) counts[roles[member.id]] += 1;
    return counts;
  }, [roles]);

  /* ── Actions ────────────────────────────────────────────── */

  const changeRole = (memberId: string, role: Role) => {
    setRoles((current) => ({ ...current, [memberId]: role }));
    const member = MOCK_TEAM.find((item) => item.id === memberId);
    toast.success(`${member?.name ?? 'Member'} is now ${role}`);
  };

  const toggleMatrix = (permissionId: string, columnIndex: number) => {
    setMatrix((current) => {
      const row = current[permissionId];
      const next = [...row];
      next[columnIndex] = !next[columnIndex];
      return { ...current, [permissionId]: next };
    });
  };

  const resendInvite = (invite: Invite) => {
    setInvites((current) =>
      current.map((item) =>
        item.id === invite.id ? { ...item, sentAt: new Date().toISOString() } : item
      )
    );
    toast.success(`Invite resent to ${invite.email}`);
  };

  const revokeInvite = (invite: Invite) => {
    setInvites((current) => current.filter((item) => item.id !== invite.id));
    toast(`Revoked the invite for ${invite.email}`, { icon: '🗑️' });
  };

  const resetInviteModal = () => {
    setInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Associate');
    setInviteNote('');
    setErrors({});
  };

  const submitInvite = () => {
    const nextErrors: { name?: string; email?: string } = {};
    if (inviteName.trim().length < 3) {
      nextErrors.name = 'Enter the full name of the person you are inviting.';
    }
    if (!EMAIL_RE.test(inviteEmail.trim())) {
      nextErrors.email = 'Enter a valid email address, e.g. name@firm.com.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setInvites((current) => [
      {
        id: `iv_${Math.random().toString(36).slice(2, 8)}`,
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        sentAt: new Date().toISOString(),
      },
      ...current,
    ]);
    toast.success(`Invitation sent to ${inviteEmail.trim()}`);
    resetInviteModal();
  };

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson-600/10 text-crimson-600">
              <UsersRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">Team</h1>
            <Badge variant="lg" size="sm" className="ml-1">
              {stats.headcount} members
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-[var(--lg-text-muted)]">
            Roles, bar admissions, utilization, and permissions for everyone at the firm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, role, department"
              aria-label="Search team members"
              className="lg-input h-9 w-64 pl-9 text-sm"
            />
          </div>
          <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus className="h-4 w-4" />}>
            Invite member
          </Button>
        </div>
      </header>

      {/* ── Roster stats ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Headcount"
          value={formatNumber(stats.headcount)}
          change={11.1}
          changeLabel="vs last quarter"
          hint={`${MOCK_TEAM.filter((member) => member.status === 'active').length} active today`}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg utilization"
          value={formatPercent(stats.avgUtilization)}
          change={Math.round((stats.avgUtilization - 0.75) * 1000) / 10}
          changeLabel="vs 75% target"
          hint={`Across ${formatNumber(stats.headcount)} timekeepers`}
          icon={<Clock className="h-5 w-5" />}
          iconTone="success"
        />
        <MetricCard
          title="Avg hourly rate"
          value={formatCurrency(stats.avgRate, { cents: false })}
          change={6.4}
          changeLabel="vs last year"
          hint="Unweighted mean standard rate"
          icon={<BadgeCheck className="h-5 w-5" />}
          iconTone="info"
        />
        <MetricCard
          title="Bar admitted"
          value={formatNumber(stats.admitted)}
          subvalue={`of ${stats.headcount}`}
          change={0}
          changeLabel="snapshot"
          hint={`${formatNumber(stats.totalMatters)} matters staffed firm-wide`}
          icon={<Gavel className="h-5 w-5" />}
          iconTone="accent"
        />
      </div>

      {/* ── Member table ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Change a role inline — badges, chips, and permissions follow the selection.
            </CardDescription>
          </div>
          <Badge variant="outline" size="sm">
            {members.length} shown
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="lg-empty">
              <Search className="h-8 w-8" aria-hidden="true" />
              <p className="lg-empty-title">No members match “{query}”</p>
              <p className="lg-empty-description">
                Try a different name, role, or department — or clear the search to see the whole
                roster.
              </p>
            </div>
          ) : (
            <div className="lg-table-wrapper">
              <table className="lg-table">
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col">Role</th>
                    <th scope="col">Bar admissions</th>
                    <th scope="col">Utilization</th>
                    <th scope="col" className="lg-table-align-right">
                      Matters
                    </th>
                    <th scope="col" className="lg-table-align-right">
                      Rate
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col" className="lg-table-align-right">
                      Last active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const index = MOCK_TEAM.findIndex((item) => item.id === member.id);
                    const role = roles[member.id];
                    return (
                      <tr key={member.id}>
                        <td className="lg-table-cell-primary">
                          <div className="flex items-center gap-3">
                            <Avatar
                              size="md"
                              name={member.name}
                              fallback={member.initials}
                              color={member.avatarColor}
                              presence={PRESENCE[member.status]}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[var(--lg-text)]">{member.name}</p>
                              <p className="truncate text-xs text-[var(--lg-text-muted)]">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-col items-start gap-1.5">
                            <select
                              value={role}
                              onChange={(event) =>
                                changeRole(member.id, event.target.value as Role)
                              }
                              aria-label={`Role for ${member.name}`}
                              className="lg-input lg-select h-8 w-40 py-1 text-xs"
                            >
                              {ROLES.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <Badge variant={ROLE_VARIANT[role]} size="sm">
                              {role}
                            </Badge>
                          </div>
                        </td>

                        <td>
                          <div className="flex max-w-[14rem] flex-wrap gap-1">
                            {member.barAdmissions.length === 0 ? (
                              <span className="text-xs text-[var(--lg-text-muted)]">
                                Not admitted
                              </span>
                            ) : (
                              member.barAdmissions.map((state) => (
                                <span key={state} className="lg-chip">
                                  {state}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="flex min-w-[9rem] items-center gap-3">
                            <div
                              className="lg-progress flex-1"
                              role="progressbar"
                              aria-valuenow={Math.round(member.utilization * 100)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${member.name} utilization`}
                            >
                              <div
                                className={cn(
                                  'lg-progress-bar',
                                  member.utilization >= 0.8
                                    ? 'bg-emerald-500'
                                    : member.utilization >= 0.65
                                      ? 'bg-crimson-600'
                                      : 'bg-amber-500'
                                )}
                                style={{ width: `${Math.max(member.utilization * 100, 4)}%` }}
                              />
                            </div>
                            <span className="w-11 shrink-0 text-right text-xs font-medium tabular-nums text-[var(--lg-text)]">
                              {formatPercent(member.utilization, { decimals: 0 })}
                            </span>
                          </div>
                        </td>

                        <td className="lg-table-align-right tabular-nums">{member.matters}</td>
                        <td className="lg-table-align-right tabular-nums">
                          {formatCurrency(member.hourlyRate, { cents: false })}
                        </td>
                        <td>
                          <Badge variant={STATUS_VARIANT[member.status]} dot size="sm">
                            {member.status}
                          </Badge>
                        </td>
                        <td
                          className="lg-table-align-right whitespace-nowrap text-xs text-[var(--lg-text-muted)]"
                          title={formatRelative(lastActiveFor(index))}
                        >
                          {formatRelative(lastActiveFor(index))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pending invites ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pending invites</CardTitle>
            <CardDescription>Invitations expire 7 days after they are sent.</CardDescription>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setInviteOpen(true)}
            leftIcon={<Send className="h-4 w-4" />}
          >
            New invite
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {invites.length === 0 ? (
            <div className="lg-empty">
              <Mail className="h-8 w-8" aria-hidden="true" />
              <p className="lg-empty-title">No pending invites</p>
              <p className="lg-empty-description">
                Everyone with an outstanding invitation has joined. Invite a new member to grow the
                roster.
              </p>
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                Invite member
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--lg-border-subtle)]">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="sm" name={invite.name} color="#94a3b8" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--lg-text)]">
                        {invite.email}
                      </p>
                      <p className="truncate text-xs text-[var(--lg-text-muted)]">
                        {invite.name} · invited {formatRelative(invite.sentAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ROLE_VARIANT[invite.role]} size="sm">
                      {invite.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resendInvite(invite)}
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeInvite(invite)}
                      leftIcon={<X className="h-4 w-4" />}
                    >
                      Revoke
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Role cards ─────────────────────────────────────── */}
      <section aria-labelledby="roles-heading" className="space-y-4">
        <div>
          <h2 id="roles-heading" className="text-lg font-semibold tracking-tight text-[var(--lg-text)]">
            Roles
          </h2>
          <p className="text-xs text-[var(--lg-text-muted)]">
            Six assignable roles, each with a default permission package.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ROLE_CARDS.map(({ role, description, icon }) => (
            <Card key={role} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson-600/10 text-crimson-600">
                  {icon}
                </span>
                <Badge variant={ROLE_VARIANT[role]} size="sm">
                  {roleCounts[role]} {roleCounts[role] === 1 ? 'member' : 'members'}
                </Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[var(--lg-text)]">{role}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--lg-text-muted)]">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Permissions matrix ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Permissions matrix</CardTitle>
            <CardDescription>
              {PERMISSIONS.length} permissions × {MATRIX_COLUMNS.length} roles. Owner and Partner
              access is locked on by firm policy.
            </CardDescription>
          </div>
          <Badge variant="lg" size="sm">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Owner / Partner locked
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="lg-table-wrapper">
            <table className="lg-table lg-table-compact">
              <thead>
                <tr>
                  <th scope="col">Permission</th>
                  {MATRIX_COLUMNS.map((column, columnIndex) => (
                    <th
                      key={column}
                      scope="col"
                      className={cn(
                        'lg-table-align-right',
                        columnIndex === 0 && 'bg-crimson-600/5 text-crimson-700 dark:text-crimson-300'
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {columnIndex === 0 && <Lock className="h-3 w-3" aria-hidden="true" />}
                        {column}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((permission) => (
                  <tr key={permission.id}>
                    <td className="lg-table-cell-primary">
                      <span className="block text-[var(--lg-text)]">{permission.label}</span>
                      <span className="block text-xs text-[var(--lg-text-muted)]">
                        {permission.hint}
                      </span>
                    </td>
                    {MATRIX_COLUMNS.map((column, columnIndex) => {
                      const locked = columnIndex === 0;
                      const checked = matrix[permission.id][columnIndex];
                      return (
                        <td key={column} className="lg-table-align-right">
                          <label
                            className={cn(
                              'inline-flex items-center justify-end gap-2 text-xs',
                              locked
                                ? 'cursor-not-allowed text-[var(--lg-text-muted)]'
                                : 'cursor-pointer'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={locked}
                              onChange={() => toggleMatrix(permission.id, columnIndex)}
                              aria-label={`${permission.label} — ${column}`}
                              className={cn(
                                'h-3.5 w-3.5',
                                locked ? 'cursor-not-allowed opacity-60' : 'accent-[#dc2626]'
                              )}
                            />
                            <span className="w-10 text-right tabular-nums">
                              {checked ? 'Yes' : 'No'}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--lg-border)] px-5 py-3">
          <span className="flex items-center gap-2 text-xs text-[var(--lg-text-muted)]">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            Changes apply to every member holding that role.
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setMatrix(INITIAL_MATRIX);
              toast.success('Permissions reset to firm defaults');
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </Card>

      {/* ── Invite modal ───────────────────────────────────── */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') resetInviteModal();
          }}
        >
          <div
            className="absolute inset-0 bg-[var(--lg-surface-overlay)] backdrop-blur-sm"
            onClick={resetInviteModal}
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--lg-border)] bg-[var(--lg-surface)] shadow-[var(--lg-shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--lg-border)] px-5 py-4">
              <div>
                <h2 id="invite-title" className="text-sm font-semibold text-[var(--lg-text)]">
                  Invite a member
                </h2>
                <p className="mt-0.5 text-xs text-[var(--lg-text-muted)]">
                  They will receive an email invitation to join the firm workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={resetInviteModal}
                aria-label="Close dialog"
                className="rounded-lg p-1 text-[var(--lg-text-muted)] transition-colors hover:bg-[var(--lg-surface-muted)] hover:text-[var(--lg-text)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="lg-label" htmlFor="invite-name">
                  Full name
                </label>
                <input
                  id="invite-name"
                  className="lg-input"
                  placeholder="Jordan Alvarez"
                  value={inviteName}
                  aria-invalid={errors.name ? 'true' : undefined}
                  onChange={(event) => {
                    setInviteName(event.target.value);
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                />
                {errors.name && <p className="lg-field-error">{errors.name}</p>}
              </div>

              <div>
                <label className="lg-label" htmlFor="invite-email">
                  Work email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  className="lg-input"
                  placeholder="name@halloranreyes.example.com"
                  value={inviteEmail}
                  aria-invalid={errors.email ? 'true' : undefined}
                  onChange={(event) => {
                    setInviteEmail(event.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                />
                {errors.email && <p className="lg-field-error">{errors.email}</p>}
              </div>

              <div>
                <label className="lg-label" htmlFor="invite-role">
                  Role
                </label>
                <select
                  id="invite-role"
                  className="lg-input lg-select"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as Role)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="lg-label" htmlFor="invite-note">
                  Message <span className="font-normal">(optional)</span>
                </label>
                <textarea
                  id="invite-note"
                  className="lg-input lg-textarea"
                  placeholder="Welcome aboard — your matters are already staffed."
                  value={inviteNote}
                  onChange={(event) => setInviteNote(event.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[var(--lg-border)] pt-4">
                <span className="text-xs text-[var(--lg-text-muted)]">
                  Joins as <strong>{inviteRole}</strong>
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={resetInviteModal}>
                    Cancel
                  </Button>
                  <Button onClick={submitInvite} leftIcon={<Send className="h-4 w-4" />}>
                    Send invite
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
