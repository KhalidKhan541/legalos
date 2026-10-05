import Link from 'next/link';

/**
 * 404 — Not Found.
 * Fully self-contained: the gradient headline uses inline `background-clip`
 * styles so it renders identically regardless of globals.css load state or
 * theme. No `lg-*` utility classes are required for the gradient to work.
 */

const GRADIENT_TEXT: React.CSSProperties = {
  backgroundImage: 'linear-gradient(120deg, #dc2626 0%, #f87171 45%, #b91c1c 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
  display: 'inline-block',
};

const shellStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.25rem',
  padding: '4rem 1.5rem',
  textAlign: 'center',
  background:
    'radial-gradient(1200px 600px at 50% -10%, rgba(220, 38, 38, 0.12), transparent 60%), var(--lg-bg, #f7f8fa)',
  color: 'var(--lg-text, #0f172a)',
  fontFamily: "var(--lg-font-sans, 'Inter', ui-sans-serif, system-ui, sans-serif)",
};

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.375rem',
  borderRadius: '0.5rem',
  backgroundColor: 'var(--lg-primary, #dc2626)',
  color: 'var(--lg-on-primary, #ffffff)',
  fontSize: '0.9375rem',
  fontWeight: 600,
  textDecoration: 'none',
  boxShadow: '0 10px 30px -12px rgba(220, 38, 38, 0.7)',
  transition: 'background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms',
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.375rem',
  borderRadius: '0.5rem',
  backgroundColor: 'var(--lg-surface, #ffffff)',
  color: 'var(--lg-text, #0f172a)',
  border: '1px solid var(--lg-border-strong, #d1d5db)',
  fontSize: '0.9375rem',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms',
};

export default function NotFound() {
  return (
    <main style={shellStyle}>
      <p
        style={{
          margin: 0,
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--lg-text-muted, #94a3b8)',
        }}
      >
        Error 404
      </p>

      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(4.5rem, 18vw, 11rem)',
          lineHeight: 0.9,
          fontWeight: 800,
          letterSpacing: '-0.05em',
        }}
      >
        <span style={GRADIENT_TEXT}>404</span>
      </h1>

      <h2
        style={{
          margin: 0,
          fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--lg-text, #0f172a)',
        }}
      >
        This matter isn&apos;t on the docket
      </h2>

      <p
        style={{
          margin: 0,
          maxWidth: '32rem',
          fontSize: '0.9375rem',
          lineHeight: 1.65,
          color: 'var(--lg-text-secondary, #475569)',
        }}
      >
        The page you requested was either moved, deleted, or never filed. Check the URL for
        typos, or head back to the LegalOS dashboard and pick up where you left off.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
        <Link href="/" style={primaryBtn}>
          Back to home
        </Link>
        <Link href="/dashboard" style={secondaryBtn}>
          Open dashboard
        </Link>
      </div>

      <p
        style={{
          margin: '1.5rem 0 0',
          fontSize: '0.8125rem',
          color: 'var(--lg-text-muted, #94a3b8)',
        }}
      >
        Need help? Contact{' '}
        <span style={{ color: 'var(--lg-primary-text, #b91c1c)', fontWeight: 600 }}>
          support@legalos.app
        </span>
      </p>
    </main>
  );
}
