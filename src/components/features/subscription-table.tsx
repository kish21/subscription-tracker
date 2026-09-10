import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Subscription } from '@/domain/types'
import { formatCalendarDateLabel, formatMoney } from '@/lib/format'

export interface SubscriptionTableProps {
  subscriptions: Subscription[]
  billingCycleLabels: Record<string, string>
}

const cellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.9375rem',
  color: 'var(--foreground)',
  textAlign: 'left',
  verticalAlign: 'middle',
}

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--muted-foreground)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

/**
 * Every subscription on the account.
 *
 * The table sits in a horizontally scrollable container so narrow viewports keep
 * a readable layout without the page itself scrolling sideways.
 */
export function SubscriptionTable({ subscriptions, billingCycleLabels }: SubscriptionTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Your subscriptions</CardTitle>
        <CardDescription>
          {subscriptions.length === 0
            ? 'Nothing tracked yet.'
            : `${subscriptions.length} tracked ${subscriptions.length === 1 ? 'subscription' : 'subscriptions'}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9375rem',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Add your first subscription to see what you are paying each month.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
              <caption
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  overflow: 'hidden',
                  clip: 'rect(0 0 0 0)',
                  whiteSpace: 'nowrap',
                }}
              >
                Subscriptions with price, billing cycle, category and next renewal date
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={headerCellStyle}>
                    Name
                  </th>
                  <th scope="col" style={headerCellStyle}>
                    Price
                  </th>
                  <th scope="col" style={headerCellStyle}>
                    Cycle
                  </th>
                  <th scope="col" style={headerCellStyle}>
                    Category
                  </th>
                  <th scope="col" style={headerCellStyle}>
                    Next renewal
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <th scope="row" style={{ ...cellStyle, fontWeight: 500 }}>
                      {sub.name}
                    </th>
                    <td
                      style={{
                        ...cellStyle,
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                      }}
                    >
                      {formatMoney(sub.priceMinorUnits, sub.currency)}
                    </td>
                    <td style={{ ...cellStyle, color: 'var(--muted-foreground)' }}>
                      {billingCycleLabels[sub.billingCycle] ?? sub.billingCycle}
                    </td>
                    <td style={cellStyle}>
                      <Badge variant="default">{sub.category}</Badge>
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        fontVariantNumeric: 'tabular-nums',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      {formatCalendarDateLabel(sub.nextRenewalDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SubscriptionTable
