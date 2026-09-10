import * as React from 'react'

export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

/**
 * Compact status pill. Colour carries emphasis, never meaning on its own —
 * every badge also states its meaning in text (DESIGN.md accessibility law).
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', style, children, ...props }, ref) => {
    const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
      default: {
        backgroundColor: 'var(--secondary)',
        color: 'var(--secondary-foreground)',
        border: '1px solid var(--border)',
      },
      secondary: {
        backgroundColor: 'var(--muted)',
        color: 'var(--muted-foreground)',
        border: '1px solid var(--border)',
      },
      // Status variants carry their meaning in the LABEL and in a status-coloured
      // border (a graphic element, held to the 3:1 bar). The text itself stays
      // --foreground: the status tokens do not clear 4.5:1 as text on --card, and
      // colour must never be the only carrier of meaning anyway.
      success: {
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--success)',
      },
      warning: {
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--warning)',
      },
      destructive: {
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--destructive)',
      },
    }

    return (
      <span
        ref={ref}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.125rem 0.5rem',
          borderRadius: '999px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      >
        {children}
      </span>
    )
  },
)

Badge.displayName = 'Badge'

export default Badge
