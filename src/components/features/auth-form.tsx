'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/auth/client'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

const ALLOWED_CURRENCIES = [
  { code: 'USD', label: 'USD ($) — United States Dollar' },
  { code: 'EUR', label: 'EUR (€) — Euro' },
  { code: 'GBP', label: 'GBP (£) — British Pound' },
  { code: 'INR', label: 'INR (₹) — Indian Rupee' },
  { code: 'CAD', label: 'CAD ($) — Canadian Dollar' },
  { code: 'AUD', label: 'AUD ($) — Australian Dollar' },
]

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignup = mode === 'signup'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignup) {
        if (!name.trim()) {
          setError('Name is required')
          setLoading(false)
          return
        }

        if (password.length < 8) {
          setError('Password must be at least 8 characters')
          setLoading(false)
          return
        }

        const { error: signUpError } = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          currency,
        } as Parameters<typeof authClient.signUp.email>[0])

        if (signUpError) {
          setError(signUpError.message || 'Failed to create account. Please try again.')
          setLoading(false)
          return
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
        })

        if (signInError) {
          setError(signInError.message || 'Invalid email or password.')
          setLoading(false)
          return
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div
      suppressHydrationWarning
      style={{
        width: '100%',
        maxWidth: '28rem',
        backgroundColor: 'var(--card)',
        color: 'var(--card-foreground)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-md)',
        padding: '2rem',
      }}
    >
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem 0',
          }}
        >
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
            margin: 0,
          }}
        >
          {isSignup
            ? 'Track your subscriptions privately with calm clarity'
            : 'Enter your credentials to access your subscriptions'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            backgroundColor: 'var(--destructive)',
            color: 'var(--destructive-foreground)',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            lineHeight: 1.4,
          }}
        >
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        suppressHydrationWarning
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        {isSignup && (
          <div
            suppressHydrationWarning
            style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
          >
            <label
              htmlFor="auth-name"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--foreground)',
              }}
            >
              Full Name
            </label>
            <input
              suppressHydrationWarning
              id="auth-name"
              type="text"
              name="name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Doe"
              style={{
                minHeight: '44px',
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--input)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '0.9375rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
              className="focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        )}

        <div
          suppressHydrationWarning
          style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
        >
          <label
            htmlFor="auth-email"
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--foreground)',
            }}
          >
            Email Address
          </label>
          <input
            suppressHydrationWarning
            id="auth-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              minHeight: '44px',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--input)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '0.9375rem',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
            className="focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div
          suppressHydrationWarning
          style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
        >
          <label
            htmlFor="auth-password"
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--foreground)',
            }}
          >
            Password
          </label>
          <input
            suppressHydrationWarning
            id="auth-password"
            type="password"
            name="password"
            required
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
            style={{
              minHeight: '44px',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--input)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '0.9375rem',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
            className="focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        {isSignup && (
          <div
            suppressHydrationWarning
            style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
          >
            <label
              htmlFor="auth-currency"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--foreground)',
              }}
            >
              Account Currency
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
              Chosen at signup and shared by all subscriptions for accurate spend sums.
            </p>
            <select
              suppressHydrationWarning
              id="auth-currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                minHeight: '44px',
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--input)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '0.9375rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
              }}
              className="focus:ring-2 focus:ring-[var(--ring)]"
            >
              {ALLOWED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          suppressHydrationWarning
          type="submit"
          disabled={loading}
          style={{
            minHeight: '44px',
            marginTop: '0.5rem',
            padding: '0.625rem 1.25rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            fontSize: '0.9375rem',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 140ms ease, transform 140ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
          className="hover:opacity-95 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
        >
          {loading ? (
            <span>{isSignup ? 'Creating account…' : 'Signing in…'}</span>
          ) : (
            <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
          )}
        </button>
      </form>

      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--muted-foreground)',
        }}
      >
        {isSignup ? (
          <span>
            Already have an account?{' '}
            <Link
              href="/login"
              style={{
                color: 'var(--primary)',
                fontWeight: 500,
                textDecoration: 'underline',
              }}
              className="hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            >
              Log in
            </Link>
          </span>
        ) : (
          <span>
            Don't have an account?{' '}
            <Link
              href="/signup"
              style={{
                color: 'var(--primary)',
                fontWeight: 500,
                textDecoration: 'underline',
              }}
              className="hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            >
              Sign up
            </Link>
          </span>
        )}
      </div>
    </div>
  )
}
