'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/auth/client'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await authClient.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      style={{
        minHeight: '44px',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'transform 140ms ease, opacity 140ms ease',
      }}
      className="hover:opacity-85 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
    >
      {loading ? 'Signing out…' : 'Sign Out'}
    </button>
  )
}
