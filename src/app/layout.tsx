import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Subscription Tracker',
  description: 'Private, manual subscription tracker that runs in any browser.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
// out-of-lane change the gate should reject
