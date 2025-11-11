'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/login') {
      return
    }

    // Check if session cookie exists (client-side check)
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
        })

        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [pathname, router])
}
