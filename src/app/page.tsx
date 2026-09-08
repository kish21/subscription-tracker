import Link from 'next/link'
import { getCurrentUser } from '@/auth/session'

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
          <h1 className="text-2xl font-semibold tracking-tight">Subscription Tracker</h1>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          A private, manual subscription tracker that runs in any browser.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Log In
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
