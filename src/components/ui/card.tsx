import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', interactive = false, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: interactive ? 'transform var(--transition-fast)' : undefined,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          padding: '1.5rem 1.5rem 0.75rem 1.5rem',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)

CardHeader.displayName = 'CardHeader'

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', as: Component = 'h3', style, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={className}
        style={{
          fontFamily: 'var(--font-display, var(--font-sans))',
          fontSize: '1.125rem',
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-0.015em',
          color: 'var(--card-foreground)',
          margin: 0,
          ...style,
        }}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

CardTitle.displayName = 'CardTitle'

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = '', style, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={className}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: 'var(--muted-foreground)',
          margin: 0,
          ...style,
        }}
        {...props}
      >
        {children}
      </p>
    )
  },
)

CardDescription.displayName = 'CardDescription'

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          padding: '0.75rem 1.5rem 1.5rem 1.5rem',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)

CardContent.displayName = 'CardContent'

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0 1.5rem 1.5rem 1.5rem',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)

CardFooter.displayName = 'CardFooter'

export default Card
