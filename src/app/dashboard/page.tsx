import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/auth/session'
import { SignOutButton } from '@/components/features/sign-out-button'

export const metadata = {
  title: 'Dashboard — Subscription Tracker',
  description: 'View and manage recurring subscriptions.',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
          padding: '1rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '1.125rem',
                letterSpacing: '-0.02em',
              }}
            >
              Subscription Tracker
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 500 }}>{user.name}</div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                {user.email}
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '1.5rem',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.5rem',
              fontWeight: 600,
              margin: '0 0 0.5rem 0',
            }}
          >
            Welcome, {user.name}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', margin: 0, fontSize: '0.9375rem' }}>
            Authenticated session active · Account currency:{' '}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--primary)',
                padding: '0.125rem 0.375rem',
                backgroundColor: 'var(--secondary)',
                borderRadius: '0.25rem',
              }}
            >
              {user.currency}
            </span>
          </p>
        </div>
      </main>
    </div>
  )
}
