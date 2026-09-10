import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCalendarDateLabel, formatDaysUntil, formatMoney } from '@/lib/format'
import type { UpcomingRenewal } from '@/schemas/dashboard'

export interface UpcomingRenewalsProps {
  renewals: UpcomingRenewal[]
  windowDays: number
}

/** Urgency is a badge tone AND its text — colour never carries the meaning alone. */
function urgencyVariant(days: number): 'destructive' | 'warning' | 'secondary' {
  if (days <= 3) return 'destructive'
  if (days <= 7) return 'warning'
  return 'secondary'
}

/** What is about to charge the user, soonest first. The north-star view. */
export function UpcomingRenewals({ renewals, windowDays }: UpcomingRenewalsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Upcoming renewals</CardTitle>
        <CardDescription>Charging in the next {windowDays} days, soonest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {renewals.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9375rem',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Nothing renews in the next {windowDays} days.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {renewals.map((renewal, index) => (
              <li
                key={renewal.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.875rem 0',
                  borderTop: index === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: 'var(--foreground)',
                    }}
                  >
                    {renewal.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.8125rem',
                      color: 'var(--muted-foreground)',
                      marginTop: '0.125rem',
                    }}
                  >
                    {formatCalendarDateLabel(renewal.renewalDate)} · {renewal.category}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge variant={urgencyVariant(renewal.daysUntilRenewal)}>
                    {formatDaysUntil(renewal.daysUntilRenewal)}
                  </Badge>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--foreground)',
                    }}
                  >
                    {formatMoney(renewal.priceMinorUnits, renewal.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingRenewals
