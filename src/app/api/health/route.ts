import { NextResponse } from 'next/server';
import packageJson from '../../../../package.json';

/**
 * GET /api/health
 *
 * Lightweight liveness / readiness probe. Always evaluated at request time and
 * never cached, so load balancers and uptime checks see fresh process data.
 */
export const dynamic = 'force-dynamic';

const startedAt = Date.now();

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export async function GET() {
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.round(process.uptime());

  const body = {
    status: 'ok' as const,
    name: packageJson.name,
    version: packageJson.version,
    uptime: uptimeSeconds,
    uptimeHuman: formatUptime(uptimeSeconds),
    timestamp: new Date().toISOString(),
    runtime: `${process.version} (${process.platform}/${process.arch})`,
    environment: process.env.NODE_ENV ?? 'production',
    memory: {
      rss: formatBytes(memory.rss),
      heapTotal: formatBytes(memory.heapTotal),
      heapUsed: formatBytes(memory.heapUsed),
      external: formatBytes(memory.external),
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
    },
    startedAt: new Date(startedAt).toISOString(),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  if (days || hours || minutes) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}
