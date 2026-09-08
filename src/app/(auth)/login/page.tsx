import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/auth/session'
import { AuthForm } from '@/components/features/auth-form'

export const metadata = {
  title: 'Log In — Subscription Tracker',
  description: 'Log in to your private subscription tracker dashboard.',
}

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--background)',
      }}
    >
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'var(--foreground)',
          }}
          className="focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
        >
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
        </Link>
      </div>

      <AuthForm mode="login" />
    </main>
  )
}
