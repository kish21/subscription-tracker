'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toMinorUnits } from '@/domain/types'
import { createSubscriptionSchema } from '@/schemas/subscription'

export interface AddSubscriptionDialogProps {
  categories: string[]
  billingCycles: Array<{ id: string; label: string }>
  currency: string
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--foreground)',
  marginBottom: '0.375rem',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.5rem 0.75rem',
  // 16px prevents iOS auto-zooming the viewport on focus (DESIGN.md).
  fontSize: '16px',
  fontFamily: 'var(--font-sans)',
  color: 'var(--foreground)',
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  minHeight: '44px',
}

/**
 * A native select that renders a visible focus ring.
 *
 * Inline styles cannot express `:focus-visible`, so focus is tracked in state —
 * the same approach the shared Button primitive uses (DESIGN.md Law 13).
 */
function FocusableSelect({
  id,
  name,
  children,
}: {
  id: string
  name: string
  children: React.ReactNode
}) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <select
      id={id}
      name={name}
      required
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        ...selectStyle,
        outline: isFocused ? '2px solid var(--ring)' : 'none',
        outlineOffset: isFocused ? '2px' : '0',
      }}
    >
      {children}
    </select>
  )
}

/**
 * Creates a subscription in under a minute (the M1 exit criterion).
 *
 * Validation runs client-side against the SAME Zod schema the API enforces, so the
 * two cannot drift. The server remains the authority: this is a convenience for the
 * user, never the security boundary.
 */
export function AddSubscriptionDialog({
  categories,
  billingCycles,
  currency,
}: AddSubscriptionDialogProps) {
  const router = useRouter()
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const open = () => {
    setError(null)
    setIsOpen(true)
    dialogRef.current?.showModal()
  }

  const close = () => {
    setIsOpen(false)
    dialogRef.current?.close()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const priceMajor = Number(form.get('price'))

    if (!Number.isFinite(priceMajor) || priceMajor < 0) {
      setError('Enter a price of zero or more.')
      return
    }

    const candidate = {
      name: String(form.get('name') ?? ''),
      priceMinorUnits: toMinorUnits(priceMajor),
      billingCycle: String(form.get('billingCycle') ?? ''),
      category: String(form.get('category') ?? ''),
      nextRenewalDate: String(form.get('nextRenewalDate') ?? ''),
    }

    const parsed = createSubscriptionSchema.safeParse(candidate)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/v1/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        // Surface the failure; never swallow it, never pretend it saved.
        setError(payload?.error?.message ?? 'Could not save the subscription. Please try again.')
        return
      }

      close()
      // Re-render the server component so totals and renewals reflect the new row.
      router.refresh()
    } catch {
      setError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button type="button" variant="primary" onClick={open}>
        Add subscription
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="add-subscription-title"
        onClose={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
        style={{
          padding: 0,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--popover)',
          color: 'var(--popover-foreground)',
          boxShadow: 'var(--shadow-lg)',
          width: 'min(30rem, calc(100vw - 2rem))',
          maxWidth: '100%',
        }}
      >
        {isOpen ? (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            <h2
              id="add-subscription-title"
              style={{
                fontFamily: 'var(--font-display, var(--font-sans))',
                fontSize: '1.125rem',
                fontWeight: 600,
                margin: '0 0 1.25rem 0',
              }}
            >
              Add a subscription
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label htmlFor="sub-name" style={labelStyle}>
                  Name
                </label>
                <Input id="sub-name" name="name" required maxLength={100} placeholder="Netflix" />
              </div>

              <div>
                <label htmlFor="sub-price" style={labelStyle}>
                  Price ({currency})
                </label>
                <Input
                  id="sub-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="15.99"
                />
              </div>

              <div>
                <label htmlFor="sub-cycle" style={labelStyle}>
                  Billing cycle
                </label>
                <FocusableSelect id="sub-cycle" name="billingCycle">
                  {billingCycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.label}
                    </option>
                  ))}
                </FocusableSelect>
              </div>

              <div>
                <label htmlFor="sub-category" style={labelStyle}>
                  Category
                </label>
                <FocusableSelect id="sub-category" name="category">
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </FocusableSelect>
              </div>

              <div>
                <label htmlFor="sub-renewal" style={labelStyle}>
                  Next renewal date
                </label>
                <Input id="sub-renewal" name="nextRenewalDate" type="date" required />
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: 'var(--destructive)',
                  margin: '1rem 0 0 0',
                }}
              >
                {error}
              </p>
            ) : null}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.5rem',
              }}
            >
              <Button type="button" variant="outline" onClick={close} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save subscription'}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>
    </>
  )
}

export default AddSubscriptionDialog
