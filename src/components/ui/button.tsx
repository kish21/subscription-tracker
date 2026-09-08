'use client'

import * as React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = '', variant = 'primary', size = 'default', style, children, disabled, ...props },
    ref,
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const [isActive, setIsActive] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    // Base styles obeying Calm Authority archetype and touch-target laws (>= 44px for default)
    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: '1px solid transparent',
            opacity: disabled ? 0.5 : isHovered ? 0.92 : 1,
          }
        case 'secondary':
          return {
            backgroundColor: isHovered ? 'var(--muted)' : 'var(--secondary)',
            color: 'var(--secondary-foreground)',
            border: '1px solid var(--border)',
            opacity: disabled ? 0.5 : 1,
          }
        case 'outline':
          return {
            backgroundColor: isHovered ? 'var(--muted)' : 'transparent',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            opacity: disabled ? 0.5 : 1,
          }
        case 'ghost':
          return {
            backgroundColor: isHovered ? 'var(--muted)' : 'transparent',
            color: 'var(--foreground)',
            border: '1px solid transparent',
            opacity: disabled ? 0.5 : 1,
          }
        case 'destructive':
          return {
            backgroundColor: 'var(--destructive)',
            color: 'var(--destructive-foreground)',
            border: '1px solid transparent',
            opacity: disabled ? 0.5 : isHovered ? 0.92 : 1,
          }
        default:
          return {}
      }
    }

    const getSizeStyles = (): React.CSSProperties => {
      switch (size) {
        case 'sm':
          return {
            minHeight: '2.25rem',
            padding: '0 0.75rem',
            fontSize: '0.8125rem',
          }
        case 'lg':
          return {
            minHeight: '3rem',
            padding: '0 1.5rem',
            fontSize: '1rem',
          }
        case 'icon':
          return {
            minHeight: '2.75rem',
            minWidth: '2.75rem',
            width: '2.75rem',
            padding: '0',
            fontSize: '0.875rem',
          }
        default:
          return {
            minHeight: '2.75rem',
            padding: '0 1rem',
            fontSize: '0.875rem',
          }
      }
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsActive(false)
        }}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          lineHeight: 1,
          textDecoration: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: isFocused ? '2px solid var(--ring)' : 'none',
          outlineOffset: isFocused ? '2px' : undefined,
          boxSizing: 'border-box',
          transform: isActive && !disabled ? 'translateY(1px)' : 'none',
          transition: 'transform var(--transition-fast), opacity var(--transition-fast)',
          ...getVariantStyles(),
          ...getSizeStyles(),
          ...style,
        }}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
