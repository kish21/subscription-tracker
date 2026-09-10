import { Card, CardContent } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import type { DashboardSummaryResponse } from '@/schemas/dashboard'

interface StatTileProps {
  label: string
  value: string
  hint: string
}

function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <Card>
      <CardContent style={{ padding: '1.25rem 1.5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--muted-foreground)',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '1.75rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--foreground)',
            marginTop: '0.375rem',
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
          }}
        >
          {hint}
        </div>
      </CardContent>
    </Card>
  )
}

export interface DashboardSummaryProps {
  summary: DashboardSummaryResponse
}

/** The three headline numbers: what this costs per month, per year, and what is due. */
export function DashboardSummary({ summary }: DashboardSummaryProps) {
  const { currency } = summary

  return (
    <section
      aria-label="Spend summary"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
      }}
    >
      <StatTile
        label="Monthly spend"
        value={formatMoney(summary.totalMonthlyMinorUnits, currency)}
        hint={`${summary.activeCount} active ${summary.activeCount === 1 ? 'subscription' : 'subscriptions'}`}
      />
      <StatTile
        label="Yearly spend"
        value={formatMoney(summary.totalYearlyMinorUnits, currency)}
        hint="Normalised across billing cycles"
      />
      <StatTile
        label={`Renewing in ${summary.upcomingWindowDays} days`}
        value={String(summary.upcomingCount)}
        hint={summary.upcomingCount === 0 ? 'Nothing due soon' : 'Listed below, soonest first'}
      />
    </section>
  )
}

export default DashboardSummary
