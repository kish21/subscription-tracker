'use client'

import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string
  mono?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      type = 'text',
      error,
      mono = false,
      style,
      disabled,
      onFocus,
      onBlur,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    const hasError = Boolean(error)
    const isMonoType = mono || type === 'number' || type === 'date'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          onMouseEnter={(e) => {
            setIsHovered(true)
            onMouseEnter?.(e)
          }}
          onMouseLeave={(e) => {
            setIsHovered(false)
            onMouseLeave?.(e)
          }}
          aria-invalid={hasError ? 'true' : undefined}
          className={`focus-visible:outline-none focus-visible:ring-2 ${
            hasError
              ? 'focus-visible:ring-[var(--destructive)]'
              : 'focus-visible:ring-[var(--ring)]'
          } ${className}`.trim()}
          style={{
            display: 'block',
            width: '100%',
            minHeight: '2.75rem',
            padding: '0 0.875rem',
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)',
            border: hasError
              ? '1px solid var(--destructive)'
              : isHovered
                ? '1px solid var(--foreground)'
                : '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontFamily: isMonoType ? 'var(--font-mono)' : 'var(--font-sans)',
            fontSize: '1rem',
            lineHeight: 1.5,
            boxSizing: 'border-box',
            outline: isFocused
              ? `2px solid ${hasError ? 'var(--destructive)' : 'var(--ring)'}`
              : 'none',
            outlineOffset: isFocused ? '2px' : undefined,
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.5 : 1,
            transition: 'opacity var(--transition-fast), transform var(--transition-fast)',
            fontVariantNumeric: isMonoType ? 'tabular-nums' : undefined,
            ...style,
          }}
          {...props}
        />
        {typeof error === 'string' && error.trim().length > 0 && (
          <span
            role="alert"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              color: 'var(--destructive)',
              lineHeight: 1.3,
            }}
          >
            {error}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
