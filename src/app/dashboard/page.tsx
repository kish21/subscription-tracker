import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/auth/session'
import { AddSubscriptionDialog } from '@/components/features/add-subscription-dialog'
import { DashboardSummary } from '@/components/features/dashboard-summary'
import { SignOutButton } from '@/components/features/sign-out-button'
import { SubscriptionTable } from '@/components/features/subscription-table'
import { UpcomingRenewals } from '@/components/features/upcoming-renewals'
import { getConfig } from '@/config/loader'
import { subscriptionRepository } from '@/db/repositories/subscription'
import { buildDashboardSummary } from '@/domain/dashboard'
import type { AllowedCurrency } from '@/domain/types'
import { emitRenewalsViewed } from '@/infra/events'
import { systemClock } from '@/providers/clock'

export const metadata = {
  title: 'Dashboard — Subscription Tracker',
  description: 'View and manage recurring subscriptions.',
}

// Session-dependent and always current: never statically cached.
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const config = getConfig()

  // ADR-005: every read is scoped to the owning user; there is no unscoped path.
  const { items } = await subscriptionRepository.list(user.id)

  const summary = buildDashboardSummary(items, {
    windowDays: config.product.upcomingWindowDays,
    currency: user.currency as AllowedCurrency,
    referenceDate: systemClock.now(),
  })

  // ADR-006: the north-star metric is emitted where the renewals view is actually
  // rendered for an authenticated user. Carries counts only — no names, no prices.
  emitRenewalsViewed({
    userId: user.id,
    upcomingCount: summary.upcomingCount,
    windowDays: summary.upcomingWindowDays,
  })

  const billingCycleLabels = Object.fromEntries(
    config.product.billingCycles.map((cycle) => [cycle.id, cycle.label]),
  )

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
            flexWrap: 'wrap',
            gap: '1rem',
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
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display, var(--font-sans))',
                fontSize: '1.5rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: '0 0 0.25rem 0',
              }}
            >
              What you are paying for
            </h1>
            <p
              style={{
                color: 'var(--muted-foreground)',
                margin: 0,
                fontSize: '0.9375rem',
                fontFamily: 'var(--font-sans)',
              }}
            >
              All amounts in {user.currency}.
            </p>
          </div>
          <AddSubscriptionDialog
            categories={config.product.categories}
            billingCycles={config.product.billingCycles}
            currency={user.currency}
          />
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <DashboardSummary summary={summary} />
          <UpcomingRenewals
            renewals={summary.upcomingRenewals}
            windowDays={summary.upcomingWindowDays}
          />
          <SubscriptionTable subscriptions={items} billingCycleLabels={billingCycleLabels} />
        </div>
      </main>
    </div>
  )
}
