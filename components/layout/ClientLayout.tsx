'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import AuthProvider from '@/components/auth/AuthProvider'
import QueryProvider from '@/components/providers/QueryProvider'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  // v2.14: React Query Provider 추가 (데이터 캐싱 및 자동 리프레시)
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background dark:bg-background-dark">
            {children}
          </main>
        </div>
      </AuthProvider>
    </QueryProvider>
  )
}
